const { QueryTypes } = require('sequelize');

const { Project, User, UserProject, sequelize } = require('../models/index');
const { getProjectMembers, loadProjectsQuery } = require('../utils/query');
const {
  makeInviteCode,
  getBytes,
  projectDataFormatChangeFn,
} = require('../utils/service');
const { getUserProfile, protectDuplicatedSubmit } = require('../utils/redis');

const bookmark = async (req, res, next) => {
  const {
    user: { id: userId },
    body: { projectId },
  } = req;

  try {
    const { duplicatedSubmit, remainTime } = await protectDuplicatedSubmit(
      'bookmark',
      userId
    );

    if (duplicatedSubmit) {
      res.status(400).json({
        ok: false,
        message: `2초 내에 같은 요청이 감지되었습니다. ${remainTime}ms 후 다시 요청해주세요.`,
        remainTime,
      });
      return;
    }

    const project = await Project.findOne({
      where: {
        id: projectId,
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
        userId,
        projectId,
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
            userId,
            projectId,
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
          userId,
          projectId,
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

const changeOwner = async (req, res, next) => {
  const {
    user: { id },
    body: { sender, receiver },
    params: { projectId },
  } = req;

  if (id !== sender) {
    res.status(400).json({
      ok: false,
      message: 'Do not have permission to change the owner',
    });
    return;
  }

  if (sender === receiver) {
    res.status(400).json({
      ok: false,
      message: 'Sender and receiver match',
    });
    return;
  }

  try {
    const project = await Project.findOne({
      where: {
        id: projectId,
      },
    });

    if (sender !== project.owner) {
      res.status(400).json({
        ok: false,
        message: 'Owner not matched',
      });
      return;
    }

    project.owner = +receiver;
    await project.save();

    res.status(200).json({
      ok: true,
      message: `Owner changed`,
    });
  } catch (err) {
    next(err);
  }
};

const createProject = async (req, res, next) => {
  const {
    user: { id },
    body: { title, permission },
  } = req;

  if (title.trim() === '' || !title) {
    res.status(400).json({
      ok: false,
      message: `Invalid title: ${title}`,
    });
    return;
  }

  const titleBytesLength = getBytes(title);

  if (titleBytesLength > 20) {
    res.status(400).json({
      ok: false,
      message: `Title is too long with ${titleBytesLength} characters. Please write within 20 characters`,
    });
    return;
  }

  try {
    const inviteCodes = (await Project.findAll({})).map((el) =>
      el.get('inviteCode')
    );

    let newInviteCode = makeInviteCode();

    while (true) {
      if (inviteCodes.indexOf(newInviteCode) === -1) break;
      else newInviteCode = makeInviteCode();
    }

    const newProject = await Project.create({
      owner: id,
      title,
      permission,
      inviteCode: newInviteCode,
    });

    await UserProject.create({
      id: +id,
      projectId: newProject.id,
    });

    let loggedInUser = await getUserProfile(+id);

    if (!loggedInUser) {
      loggedInUser = await User.findOne({
        where: {
          id,
        },
        attributes: ['id', 'profileImage', 'name'],
      });
    }

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

    // const boardOrder = await getBoardOrder(projectId);

    // if (boardOrder) {
    //   await Promise.allSettled(
    //     boardOrder.split(';').map((id) => delCardOrder(id))
    //   );
    // }
    //
    // await delBoardOrder(projectId);

    res.status(200).json({
      ok: true,
      message: 'Delete project complete',
    });
  } catch (err) {
    next(err);
  }
};

const getMembers = async (req, res, next) => {
  const { projectId } = req.params;

  try {
    const members = await sequelize.query(getProjectMembers, {
      type: QueryTypes.SELECT,
      replacements: [projectId],
    });

    res.status(200).json({
      ok: true,
      members,
    });
  } catch (err) {
    next(err);
  }
};

const getProjectInviteCode = async (req, res, next) => {
  const { projectId } = req.params;

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

    res.status(200).json({
      ok: true,
      inviteCode: project.inviteCode,
    });
  } catch (err) {
    next(err);
  }
};

const joinProject = async (req, res, next) => {
  const {
    user: { id },
    body: { inviteCode },
  } = req;

  try {
    const project = await Project.findOne({
      where: {
        inviteCode,
      },
    });

    if (!project) {
      res.status(404).json({
        ok: false,
        message: 'Project not found',
      });
      return;
    }

    const userProject = await UserProject.findOne({
      where: {
        userId: id,
        projectId: +project.id,
      },
    });

    if (userProject) {
      res.status(400).json({
        ok: false,
        message: 'Already participated in the project',
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

    await UserProject.create({
      userId: id,
      projectId: +project.id,
    });

    res.status(200).json({
      ok: true,
      message: 'Join the project',
    });
  } catch (err) {
    next(err);
  }
};

const kickOutUser = async (req, res, next) => {
  const {
    user: { id },
    params: { projectId, userId: userIdToBeExile },
  } = req;

  try {
    const project = await Project.findOne({
      where: {
        id: projectId,
      },
    });

    if (project.owner !== id) {
      res.status(400).json({
        ok: false,
        message: 'No permission',
      });
      return;
    }

    if (project.owner === +userIdToBeExile) {
      res.status(400).json({
        ok: false,
        message: 'Owner cannot be exile',
      });
      return;
    }

    await UserProject.destroy({
      where: {
        userId: userIdToBeExile,
      },
    });

    res.status(200).json({
      ok: true,
      message: 'User exile complete',
    });
  } catch (err) {
    next(err);
  }
};

const leaveProject = async (req, res, next) => {
  const {
    user: { id: userId },
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

const loadAllProject = async (req, res, next) => {
  try {
    const projects = await sequelize.query(loadProjectsQuery, {
      type: QueryTypes.SELECT,
      replacements: [req.user.id],
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
  changeOwner,
  createProject,
  deleteProject,
  getMembers,
  getProjectInviteCode,
  leaveProject,
  loadAllProject,
  joinProject,
  updateProject,
  kickOutUser,
};
