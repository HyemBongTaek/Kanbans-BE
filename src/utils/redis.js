const { redisClient } = require('../redis');

async function getUserProfile(userId) {
  try {
    const userProfile = await redisClient.get(`user:${userId}:profile`);
    return JSON.parse(userProfile);
  } catch (err) {
    throw new Error(err.message);
  }
}

async function setUserProfile(userId, profile) {
  try {
    await redisClient.setEx(
      `user:${userId}:profile`,
      1200000,
      JSON.stringify(profile)
    );
  } catch (err) {
    throw new Error(err.message);
  }
}

module.exports = {
  getUserProfile,
  setUserProfile,
};
