const { QueryTypes } = require('sequelize');

const { sequelize, User, UserProject, Project } = require('../models/index');
const {
  profileImageUploadFn,
  deleteProfileImage,
  getProfileFilename,
  getProfileFileStorage,
} = require('../utils/image');
const { findProjectsQuery } = require('../utils/query');
const { getUserProfile, setUserProfile } = require('../utils/redis');

const getProfileInfo = async (req, res, next) => {
  try {
    let profile = await getUserProfile(req.user.id);

    if (!profile) {
      const user = await User.findOne({
        where: {
          id: req.user.id,
        },
        attributes: ['id', 'profileImage', 'name', 'introduce'],
      });

      if (!user) {
        res.status(404).json({
          ok: false,
          message: '사용자를 찾을 수 없습니다.',
        });
        return;
      }

      await setUserProfile(req.user.id, user);

      profile = user;
    }

    res.status(200).json({
      ok: true,
      user: profile,
    });
  } catch (err) {
    next(err);
  }
};

const changeProfile = async (req, res, next) => {
  const {
    user: { id: userId },
    file,
    body: { name, introduce },
  } = req;

  try {
    const user = await User.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      res.status(404).json({
        ok: false,
        message: '사용자를 찾을 수 없습니다.',
      });
      return;
    }

    const profile = await getUserProfile(userId);

    if (file) {
      const url = await profileImageUploadFn(file, userId, user.profileImage);

      if (profile) {
        profile.profileImage = url;
        await setUserProfile(userId, profile);
      }

      user.profileImage = url;
      await user.save();

      res.status(200).json({
        ok: true,
        message: '프로필 이미지가 변경되었습니다.',
        imageUrl: url,
      });
    } else if (name) {
      if (profile) {
        profile.name = name;
        await setUserProfile(userId, profile);
      }

      user.name = name;
      await user.save();

      res.status(200).json({
        ok: true,
        message: '이름이 변경되었습니다.',
        name,
      });
    } else if (introduce) {
      if (profile) {
        profile.introduce = introduce;
        await setUserProfile(userId, profile);
      }

      user.introduce = introduce;
      await user.save();

      res.status(200).json({
        ok: true,
        message: '자기소개가 변경되었습니다.',
        introduce,
      });
    }
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  const {
    user: { id: userId },
  } = req;

  try {
    const user = await User.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      res.status(404).json({
        ok: false,
        message: '존재하지 않는 유저입니다.',
      });
      return;
    }

    await User.destroy({
      where: {
        id: req.user.id,
      },
    });

    const project = await Project.findAll({
      where: {
        owner: userId,
      },
      attributes: ['id'],
    });

    project.map(async ({ id }) => {
      const userProject = await UserProject.findAll({
        where: {
          projectId: id,
        },
        attributes: ['userId'],
      });

      if (userProject.length === 0) {
        await Project.destroy({
          where: {
            id,
          },
        });
      } else {
        await Project.update(
          {
            owner: userProject[0].userId,
          },
          {
            where: {
              id,
            },
          }
        );
      }
    });

    const profileImageStorage = getProfileFileStorage(user.profileImage);

    if (profileImageStorage === 'firebasestorage') {
      const profileFilename = getProfileFilename(user.profileImage);
      await deleteProfileImage(profileFilename);
    }

    res.status(200).json({
      ok: true,
      message: '회원탈퇴되었습니다.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  changeProfile,
  deleteUser,
  getProfileInfo,
};
