const { v4: uuidv4 } = require('uuid');

const { Project } = require('../models/index');

const createProject = async (req, res, next) => {
  try {
    const newProject = await Project.create({
      owner: req.userId,
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

module.exports = {
  createProject,
};
