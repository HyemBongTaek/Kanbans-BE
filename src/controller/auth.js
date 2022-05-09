const { User } = require('../models/index');
const {
  verifyToken,
  signAccessToken,
  signRefreshToken,
} = require('../utils/jwt');

const kakaoLogin = (req, res) => {
  const { accessToken } = req.user;
  res.redirect(`${process.env.CLIENT_URL}/?token=${accessToken}`);
};

const googleLogin = (req, res) => {
  const { accessToken } = req.user;
  res.redirect(`${process.env.CLIENT_URL}/?token=${accessToken}`);
};

const refreshToken = async (req, res, next) => {
  if (req.headers.authorization) {
    const token = req.headers.authorization.split(' ')[1];

    const verifiedToken = verifyToken(token);

    // 유효하지 않은 토큰
    if (verifiedToken.errMessage === 'invalid signature') {
      res.status(403).json({
        ok: false,
        message: 'Token invalid',
      });
      return;
    }

    // Token 만료
    if (verifiedToken.errMessage === 'jwt expired') {
      res.status(403).json({
        ok: false,
        message: 'Token expired',
      });
      return;
    }

    try {
      const user = await User.findOne({
        where: {
          id: verifiedToken.id,
        },
        attributes: ['refreshToken'],
      });

      const verifiedRefreshToken = verifyToken(user.refreshToken);

      if (verifiedRefreshToken.errMessage) {
        const error = new Error(verifiedRefreshToken.errMessage);
        next(error);
      }

      const newAccessToken = await signAccessToken(verifiedRefreshToken.id);
      const newRefreshToken = await signRefreshToken(verifiedRefreshToken.id);

      await User.update(
        {
          refreshToken: newRefreshToken,
        },
        {
          where: {
            id: verifiedRefreshToken.id,
          },
        }
      );

      res.json({
        ok: true,
        accessToken: newAccessToken,
      });
    } catch (err) {
      next(err);
    }
  } else {
    const error = new Error('Jwt must be provided');
    error.statusCode = 403;
    next(error);
  }
};

module.exports = {
  kakaoLogin,
  googleLogin,
  refreshToken,
};
