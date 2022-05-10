const jwt = require('jsonwebtoken');

const { User } = require('../models/index');

const { JWT_SECRET } = process.env;

async function signAccessToken(value) {
  return new Promise((resolve, reject) => {
    jwt.sign(
      {
        id: value,
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

async function signRefreshToken(value) {
  return new Promise((resolve, reject) => {
    jwt.sign(
      {
        id: value,
      },
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
    return {
      errName: err.name,
      errMessage: err.message,
    };
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
