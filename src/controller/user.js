const { User } = require('../models/index');
const {
  profileImageUploadFn,
  deleteProfileImage,
  getProfileFileStorage,
  getProfileFilename,
} = require('../utils/service');

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

    if (!file && !name) {
      res.status(204).json({
        ok: false,
        message: 'Profile has not been changed',
      });
      return;
    }

    if (file && name) {
      const url = await profileImageUploadFn(file, userId, user.profileImage);

      await User.update(
        {
          profileImage: url,
          name,
        },
        {
          where: {
            id: userId,
          },
        }
      );
    } else if (file) {
      const url = await profileImageUploadFn(file, userId, user.profileImage);

      await User.update(
        {
          profileImage: url,
        },
        {
          where: {
            id: userId,
          },
        }
      );
    } else if (name) {
      await User.update(
        {
          name,
        },
        {
          where: {
            id: userId,
          },
        }
      );
    }

    res.status(201).json({
      ok: true,
      message: 'Profile has been changed',
    });
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
};
