const { v4: uuidv4 } = require('uuid');
const { QueryTypes } = require('sequelize');

const { sequelize, Project, UserProject } = require('../models/index');
const { loadProjectsQuery, insertUserProjectQuery } = require('../utils/query');
const { projectDataFormatChangeFn } = require('../utils/service');

const createProject = async (req, res, next) => {
  try {
    const newProject = await Project.create({
      owner: req.userId,
      title: req.body.title,
      permission: req.body.permission,
      inviteCode: uuidv4(),
    });

    await sequelize.query(insertUserProjectQuery, {
      type: QueryTypes.INSERT,
      replacements: [+req.userId, newProject.id],
    });

    res.status(201).json({
      ok: true,
      message: 'Project create success',
      project: newProject,
    });
  } catch (err) {
    next(err);
  }
};

const loadAllProject = async (req, res, next) => {
  try {
    const projects = await sequelize.query(loadProjectsQuery, {
      type: QueryTypes.SELECT,
      replacements: [req.userId],
    });

    if (projects.length === 0) {
      res.status(200).json({
        ok: true,
        projects: [],
      });
      return;
    }

    const projectData = projectDataFormatChangeFn(projects);

    res.status(200).json({
      ok: true,
      projects: projectData,
    });
  } catch (err) {
    next(err);
  }
};

const bookmark = async (req, res, next) => {
  try {
    const project = await Project.findOne({
      where: {
        id: req.body.projectId,
      },
    });

    if (!project) {
      res.status(404).json({
        ok: false,
        message: 'Cannot find project',
      });
      return;
    }

    const userProject = await UserProject.findOne({
      where: {
        userId: +req.userId,
        projectId: req.body.projectId,
      },
      attributes: ['user_id', 'project_id', 'bookmark'],
    });

    if (!userProject.bookmark) {
      await UserProject.update(
        {
          bookmark: 1,
        },
        {
          where: {
            userId: +req.userId,
            projectId: req.body.projectId,
          },
        }
      );

      res.status(200).json({
        ok: true,
        message: 'Project bookmark on',
      });
      return;
    }

    await UserProject.update(
      {
        bookmark: 0,
      },
      {
        where: {
          userId: +req.userId,
          projectId: req.body.projectId,
        },
      }
    );

    res.status(200).json({
      ok: true,
      message: 'Project bookmark off',
    });
  } catch (err) {
    next(err);
  }
};

const joinProject = async (req, res, next) => {
  const {
    userId,
    body: { projectId, inviteCode },
  } = req;

  try {
    const project = await Project.findOne({
      where: {
        id: projectId,
      },
    });

    if (project.inviteCode !== inviteCode) {
      res.status(400).json({
        ok: false,
        message: 'Inconsistent invitation code',
      });
      return;
    }

    await sequelize.query(insertUserProjectQuery, {
      type: QueryTypes.INSERT,
      replacements: [+userId, +projectId],
    });

    res.status(200).json({
      ok: true,
      message: 'Join the project',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createProject,
  loadAllProject,
  bookmark,
  joinProject,
};
