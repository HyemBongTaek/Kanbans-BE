const { v4: uuidv4 } = require('uuid');
const { QueryTypes } = require('sequelize');

const {
  sequelize,
  Project,
  User,
  UserProject,
  BoardOrder,
} = require('../models/index');
const { loadProjectsQuery, insertUserProjectQuery } = require('../utils/query');
const { getBytes, projectDataFormatChangeFn } = require('../utils/service');

const createProject = async (req, res, next) => {
  const {
    userId,
    body: { title, permission },
  } = req;

  try {
    const titleBytesLength = getBytes(title);

    if (titleBytesLength > 20) {
      res.status(400).json({
        ok: false,
        message: `Title is too long with ${titleBytesLength} characters. Please write within 20 characters`,
      });
      return;
    }

    const newProject = await Project.create({
      owner: userId,
      title,
      permission,
      inviteCode: uuidv4(),
    });

    await BoardOrder.create({
      projectId: newProject.id,
    });

    await sequelize.query(insertUserProjectQuery, {
      type: QueryTypes.INSERT,
      replacements: [+userId, newProject.id],
    });

    const loggedInUser = await User.findOne({
      where: {
        id: userId,
      },
      attributes: ['id', 'profileImage', 'name'],
    });

    const newProjectResponse = {
      title: newProject.title,
      permission: newProject.permission,
      projectId: newProject.id,
      bookmark: 0,
      users: [
        {
          userId: loggedInUser.id,
          profileImageURL: loggedInUser.profileImage,
          name: loggedInUser.name,
        },
      ],
    };

    res.status(201).json({
      ok: true,
      message: 'Project create success',
      project: newProjectResponse,
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

    if (!project) {
      res.status(404).json({
        ok: false,
        message: 'Project not found',
      });
      return;
    }

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

const deleteProject = async (req, res, next) => {
  const { id: projectId } = req.params;

  try {
    const deleteProjectCount = await Project.destroy({
      where: {
        id: +projectId,
      },
    });

    if (deleteProjectCount === 0) {
      res.status(400).json({
        ok: false,
        message: 'No project deleted. Check the project ID',
      });
      return;
    }

    res.status(200).json({
      ok: true,
      message: 'Delete project complete',
    });
  } catch (err) {
    next(err);
  }
};

const leaveProject = async (req, res, next) => {
  const {
    userId,
    params: { id: projectId },
  } = req;

  try {
    const project = await Project.findOne({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      res.status(404).json({
        ok: false,
        message: 'Project not found',
      });
      return;
    }

    if (+userId === +project.owner) {
      res.status(400).json({
        ok: false,
        message: 'Owner cannot leave',
      });
      return;
    }

    const deleteCount = await UserProject.destroy({
      where: {
        userId,
        projectId,
      },
    });

    if (deleteCount === 0) {
      res.status(400).json({
        ok: false,
        message: 'Already leave the project',
      });
      return;
    }

    res.status(200).json({
      ok: true,
      message: 'Project leave',
      deleteCount,
    });
  } catch (err) {
    next(err);
  }
};

const updateProject = async (req, res, next) => {
  const {
    userId,
    body: { title, permission },
    params: { id: projectId },
  } = req;

  try {
    const project = await Project.findOne({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      res.status(404).json({
        ok: false,
        message: 'Project not found',
      });
      return;
    }

    if (project.owner !== +userId) {
      res.status(400).json({
        ok: false,
        message: 'You do not have permission to modify',
      });
      return;
    }

    await Project.update(
      {
        title: title || project.title,
        permission: permission || project.permission,
      },
      {
        where: {
          id: projectId,
          owner: +userId,
        },
      }
    );

    res.status(200).json({
      ok: true,
      message: 'Project update',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  bookmark,
  createProject,
  deleteProject,
  leaveProject,
  loadAllProject,
  joinProject,
  updateProject,
};
