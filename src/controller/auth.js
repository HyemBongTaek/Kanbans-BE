const { User } = require('../models/index');
const {
  verifyToken,
  verifyJWT,
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

const refreshToken = async (req, res) => {
  try {
    const user = await User.findOne({
      where: {
        id: req.userId,
      },
      attributes: ['refreshToken'],
    });

    const verifiedRefreshToken = await verifyJWT(user.refreshToken);

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
    if (err.message === 'jwt expired') {
      res.status(403).json({
        ok: false,
        message: 'Jwt expired',
      });
    } else if (err.message === 'invalid signature') {
      res.status(403).json({
        ok: false,
        message: 'Token invalid',
      });
    } else {
      res.json({
        ok: false,
        message: err.message,
      });
    }
  }
};

module.exports = {
  kakaoLogin,
  googleLogin,
  refreshToken,
};
