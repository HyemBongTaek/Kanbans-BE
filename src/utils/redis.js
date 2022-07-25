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
      1800,
      JSON.stringify(profile)
    );
  } catch (err) {
    throw new Error(err.message);
  }
}

async function setBoardOrder(id, order) {
  try {
    await redisClient.setEx(`project:${id}:board-order`, 900, order);
  } catch (err) {
    throw new Error(err.message);
  }
}

async function getBoardOrder(id) {
  try {
    const boardOrder = await redisClient.get(`project:${id}:board-order`);

    if (!boardOrder) {
      return null;
    }

    return boardOrder;
  } catch (err) {
    throw new Error(err.message);
  }
}

async function setCardOrder(id, order) {
  try {
    await redisClient.setEx(`board:${id}:card-order`, 900, order);
  } catch (err) {
    throw new Error(err.message);
  }
}

async function getCardOrder(id) {
  try {
    const cardOrder = await redisClient.get(`board:${id}:card-order`);

    if (!cardOrder) {
      return null;
    }

    return cardOrder;
  } catch (err) {
    throw new Error(err.message);
  }
}

module.exports = {
  getBoardOrder,
  getCardOrder,
  getUserProfile,
  setBoardOrder,
  setCardOrder,
  setUserProfile,
};
