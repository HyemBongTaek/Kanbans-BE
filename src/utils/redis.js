const { redisClient } = require('../redis');

const TIME = 1200;

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
    await redisClient.setEx(
      `project:${id}:board-order`,
      TIME,
      JSON.stringify(order)
    );
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

    return JSON.parse(boardOrder);
  } catch (err) {
    throw new Error(err.message);
  }
}

async function delBoardOrder(id) {
  try {
    await redisClient.del(`project:${id}:board-order`);
  } catch (e) {
    throw new Error(e.message);
  }
}

async function setCardOrder(id, order) {
  try {
    await redisClient.setEx(
      `board:${id}:card-order`,
      TIME,
      JSON.stringify(order)
    );
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

    return JSON.parse(cardOrder);
  } catch (err) {
    throw new Error(err.message);
  }
}

async function delCardOrder(id) {
  try {
    await redisClient.del(`board:${id}:card-order`);
  } catch (e) {
    throw new Error(e.message);
  }
}

async function protectDuplicatedSubmit(submitType, userId) {
  try {
    const submitTime = await redisClient.get(`${submitType}:${userId}`);
    const now = Date.now();

    if (submitTime && now - +submitTime < 2000) {
      return {
        duplicatedSubmit: true,
        remainTime: 2000 - (now - +submitTime),
      };
    }

    await redisClient.setEx(`${submitType}:${userId}`, 2, `${now}`);

    return {
      duplicatedSubmit: false,
      remainTime: 0,
    };
  } catch (e) {
    throw new Error(e.message);
  }
}

module.exports = {
  delBoardOrder,
  delCardOrder,
  getBoardOrder,
  getCardOrder,
  getUserProfile,
  protectDuplicatedSubmit,
  setBoardOrder,
  setCardOrder,
  setUserProfile,
};
