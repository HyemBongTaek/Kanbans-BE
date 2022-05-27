const { QueryTypes } = require('sequelize');

const { sequelize, User, Project } = require('../models/index');
const {
  profileImageUploadFn,
  deleteProfileImage,
  getProfileFilename,
  getProfileFileStorage,
} = require('../utils/image');
const { findProjectsQuery } = require('../utils/query');

const getProfileInfo = async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: {
        id: req.userId,
      },
      attributes: ['id', 'profileImage', 'name'],
    });

    if (!user) {
      res.status(404).json({
        ok: false,
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      ok: true,
      user,
    });
  } catch (err) {
    next(err);
  }
};

const changeProfile = async (req, res, next) => {
  const {
    userId,
    file,
    body: { name },
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

    if (file) {
      const url = await profileImageUploadFn(file, userId, user.profileImage);

      await User.update(
        {
          profileImage: url,
        },
        {
          where: {
            id: +userId,
          },
        }
      );

      res.status(200).json({
        ok: true,
        message: 'Profile image has been changed',
        imageUrl: url,
      });
    } else if (name) {
      await User.update(
        {
          name,
        },
        {
          where: {
            id: +userId,
          },
        }
      );

      res.status(200).json({
        ok: true,
        message: 'Name has been changed',
        name,
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
