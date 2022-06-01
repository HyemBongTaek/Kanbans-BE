const { redisClient } = require('../redis');

async function getBoardOrderInRedis(projectId) {
  try {
    return redisClient.get(`p_${projectId}`);
  } catch (err) {
    const error = new Error(err.message);
    throw error;
  }
}

async function setBoardOrderInRedis(projectId, data) {
  try {
    await redisClient.set(`p_${projectId}`, data);
  } catch (err) {
    const error = new Error(err.message);
    throw error;
  }
}

async function delBoardOrderInRedis(projectId) {
  try {
    await redisClient.del(`p_${projectId}`);
  } catch (err) {
    const error = new Error(err.message);
    throw error;
  }
}

async function getCardOrderInRedis(boardId) {
  try {
    return redisClient.get(`board:${boardId}:card.order`);
  } catch (err) {
    const error = new Error(err.message);
    throw error;
  }
}

async function setCardOrderInRedis(boardId, data) {
  try {
    await redisClient.set(`board:${boardId}:card.order`, data);
  } catch (err) {
    const error = new Error(err.message);
    throw error;
  }
}

module.exports = {
  delBoardOrderInRedis,
  getBoardOrderInRedis,
  getCardOrderInRedis,
  setBoardOrderInRedis,
  setCardOrderInRedis,
};
