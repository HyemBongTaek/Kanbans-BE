const { v4: uuidv4 } = require('uuid');
const { QueryTypes } = require('sequelize');

const { sequelize, Project } = require('../models/index');
const { loadProjectsQuery } = require('../utils/query');
const { projectDataFormatChangeFn } = require('../utils/service');

const createProject = async (req, res, next) => {
  try {
    const newProject = await Project.create({
      owner: req.userId,
      title: req.body.title,
      permission: req.body.permission,
      inviteCode: uuidv4(),
    });

    await newProject.addUsers(req.userId);

    res.status(200).json({
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
      res.status(401).json({
        ok: false,
        message: 'Load projects fail',
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

module.exports = {
  createProject,
  loadAllProject,
};
