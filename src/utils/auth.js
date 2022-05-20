const { User } = require('../models/index');
const { signAccessToken, signRefreshToken } = require('./jwt');

async function createUserOrLogin({
  platform,
  platformId,
  name,
  profileImageURL,
  email,
}) {
  const existingUser = await User.findOne({
    where: {
      platform,
      platformId,
    },
  });

  if (existingUser) {
    const accessToken = await signAccessToken(existingUser.id.toString());
    const refreshToken = await signRefreshToken();

    existingUser.refreshToken = refreshToken;
    await existingUser.save();

    return {
      userId: existingUser.id,
      accessToken,
      refreshToken,
    };
  }

  const newUser = await User.create({
    platform,
    platformId,
    profileImage: profileImageURL,
    name,
    email,
  });

  const accessToken = await signAccessToken(newUser.id.toString());
  const refreshToken = await signRefreshToken();

  newUser.refreshToken = refreshToken;
  await newUser.save();

  return {
    userId: newUser.id,
    accessToken,
    refreshToken,
  };
}

module.exports = {
  createUserOrLogin,
};
