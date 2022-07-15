const { QueryTypes } = require('sequelize');

const { sequelize, User, Project } = require('../models/index');
const {
  profileImageUploadFn,
  deleteProfileImage,
  getProfileFilename,
  getProfileFileStorage,
} = require('../utils/image');
const { findProjectsQuery } = require('../utils/query');
const { getUserProfile, setUserProfile } = require('../utils/redis');

const getProfileInfo = async (req, res, next) => {
  const { userId } = req;

  try {
    let profile = await getUserProfile(userId);

    if (!profile) {
      const user = await User.findOne({
        where: {
          id: +userId,
        },
        attributes: ['id', 'profileImage', 'name', 'introduce'],
      });

      if (!user) {
        res.status(404).json({
          ok: false,
          message: 'User not found',
        });
        return;
      }

      await setUserProfile(userId, user);

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
    userId,
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
        message: 'User not found',
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
        message: 'Profile image has been changed',
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
        message: 'Name has been changed',
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
        message: 'Introduce has been changed',
        introduce,
      });
    }
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: {
        id: req.userId,
      },
    });

    if (!user) {
      res.status(404).json({
        ok: false,
        message: 'User does not exist',
      });
      return;
    }

    const projectToDelete = await sequelize.query(findProjectsQuery, {
      type: QueryTypes.SELECT,
      replacements: [req.userId],
    });

    const ids = [];
    projectToDelete.forEach((value) => ids.push(value.id));

    await Project.destroy({
      where: {
        id: [...ids],
      },
    });

    const profileImageStorage = getProfileFileStorage(user.profileImage);

    if (profileImageStorage === 'firebasestorage') {
      const profileFilename = getProfileFilename(user.profileImage);
      await deleteProfileImage(profileFilename);
    }

    await User.destroy({
      where: {
        id: req.userId,
      },
    });

    res.status(200).json({
      ok: true,
      message: 'User delete',
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
