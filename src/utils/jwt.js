const jwt = require('jsonwebtoken');

const { User } = require('../models/index');

const { JWT_SECRET } = process.env;

async function signAccessToken(userId, username) {
  return new Promise((resolve, reject) => {
    jwt.sign(
      {
        id: userId,
        name: username,
      },
      JWT_SECRET,
      {
        expiresIn: '2h',
      },
      (err, encoded) => {
        if (err) {
          reject(err);
        } else {
          resolve(encoded);
        }
      }
    );
  });
}

async function signRefreshToken() {
  return new Promise((resolve, reject) => {
    jwt.sign(
      {},
      JWT_SECRET,
      {
        expiresIn: '14d',
      },
      (err, encoded) => {
        if (err) {
          reject(err);
        } else {
          resolve(encoded);
        }
      }
    );
  });
}

async function verifyJWT(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_SECRET, (err, value) => {
      if (err) {
        reject(err);
      } else {
        resolve(value);
      }
    });
  });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return err.message;
  }
}

async function saveRefreshTokenToDB(userId, token) {
  try {
    await User.update(
      {
        refreshToken: token,
      },
      {
        where: {
          id: userId,
        },
      }
    );
  } catch (err) {
    console.error(err);
  }
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyToken,
  verifyJWT,
  saveRefreshTokenToDB,
};
