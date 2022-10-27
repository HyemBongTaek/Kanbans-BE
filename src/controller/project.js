const { Sequelize, QueryTypes } = require('sequelize');

const {
  Image,
  Project,
  User,
  UserProject,
  sequelize,
} = require('../models/index');
const { getProjectMembers, loadProjectsQuery } = require('../utils/query');
const {
  makeInviteCode,
  getBytes,
  projectDataFormatChangeFn,
} = require('../utils/service');
const { getUserProfile, protectDuplicatedSubmit } = require('../utils/redis');
const { deleteCardImageFn } = require('../utils/image');

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
        message: '존재하지 않는 프로젝트입니다.',
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
        message: '북마크 되었습니다.',
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
      message: '북마크가 해제되었습니다.',
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
      message: '권한이 없습니다.',
    });
    return;
  }

  if (sender === receiver) {
    res.status(400).json({
      ok: false,
      message: '이전 owner와 변경하고자 하는 owner가 동일합니다.',
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
        message: 'Owner가 아니므로 owner를 변경할 수 없습니다.',
      });
      return;
    }

    project.owner = +receiver;
    await project.save();

    res.status(200).json({
      ok: true,
      message: '정상적으로 변경되었습니다.',
    });
  } catch (err) {
    next(err);
  }
};

const createProject = async (req, res, next) => {
  const {
    user: { id: userId },
    body: { title, permission },
  } = req;

  if (title.trim() === '' || !title) {
    res.status(400).json({
      ok: false,
      message: `유효하지 않는 제목입니다. 현재 제목: ${title}`,
    });
    return;
  }

  const titleBytesLength = getBytes(title);

  if (titleBytesLength > 20) {
    res.status(400).json({
      ok: false,
      message: `영어는 20, 한글은 10글자 이내로 입력해주세요.`,
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
      owner: userId,
      title,
      permission,
      inviteCode: newInviteCode,
    });

    await UserProject.create({
      userId,
      projectId: newProject.id,
    });

    let loggedInUser = await getUserProfile(userId);

    if (!loggedInUser) {
      loggedInUser = await User.findOne({
        where: {
          id: userId,
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
      message: '프로젝트가 생성되었습니다.',
      project: newProjectResponse,
    });
  } catch (err) {
    next(err);
  }
};

const deleteProject = async (req, res, next) => {
  const { id: projectId } = req.params;

  try {
    const images = await Image.findAll({
      where: {
        projectId,
      },
    });

    if (images.length > 0) {
      await Promise.allSettled(
        images.map((image) => deleteCardImageFn(image.cardId, image.url))
      );
    }

    const deleteProjectCount = await Project.destroy({
      where: {
        id: +projectId,
      },
    });

    if (deleteProjectCount === 0) {
      res.status(400).json({
        ok: false,
        message: '삭제된 프로젝트가 없습니다. 다시 시도해주세요.',
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
      message: '프로젝트를 삭제했습니다.',
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
        message: '존재하지 않는 프로젝트입니다.',
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
        message: '존재하지 않는 프로젝트입니다.',
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
        message: '이미 참가한 프로젝트입니다.',
      });
      return;
    }

    if (project.inviteCode !== inviteCode) {
      res.status(400).json({
        ok: false,
        message: '잘못된 초대코드입니다.',
      });
      return;
    }

    await UserProject.create({
      userId: id,
      projectId: +project.id,
    });

    const usersInProject = await UserProject.findAll({
      where: {
        projectId: project.id,
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: [],
        },
      ],
      attributes: [
        [Sequelize.col('user.id'), 'userId'],
        [Sequelize.col('user.profile_image'), 'profileImageURL'],
        [Sequelize.col('user.name'), 'name'],
      ],
    });

    res.status(200).json({
      ok: true,
      message: '프로젝트에 참가하였습니다.',
      data: {
        title: project.title,
        permission: project.permission,
        projectId: project.id,
        bookmark: 0,
        owner: project.owner,
        users: usersInProject,
      },
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
        message: '권한이 없습니다.',
      });
      return;
    }

    if (project.owner === +userIdToBeExile) {
      res.status(400).json({
        ok: false,
        message: '추방할 수 없는 유저입니다.',
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
      message: '추방 완료',
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
        message: '존재하지 않는 프로젝트입니다.',
      });
      return;
    }

    if (+userId === +project.owner) {
      res.status(400).json({
        ok: false,
        message: 'Owner는 나갈 수 없습니다.',
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
        message: '이미 프로젝트에서 나갔습니다.',
      });
      return;
    }

    res.status(200).json({
      ok: true,
      message: '프로젝트에서 나가기 완료',
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
    user: { id: userId },
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
        message: '존재하지 않는 프로젝트입니다.',
      });
      return;
    }

    if (project.owner !== +userId) {
      res.status(400).json({
        ok: false,
        message: '수정권한이 없습니다.',
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
      message: '프로젝트 수정 완료',
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
