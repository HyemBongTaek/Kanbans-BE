const jwt = require('jsonwebtoken');

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

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyToken,
};
