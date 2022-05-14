const axios = require('axios');

const { User } = require('../models/index');
const {
  verifyJWT,
  signAccessToken,
  signRefreshToken,
} = require('../utils/jwt');
const { createUserOrLogin } = require('../utils/auth');

const {
  KAKAO_REST_KEY,
  KAKAO_REDIRECT_URI_DEV,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIERECT_URI_DEV,
} = process.env;

const kakaoLogin = async (req, res, next) => {
  const { code } = req.query;

  if (!code) {
    res.status(400).json({
      ok: false,
      message: 'Code does not exist',
    });
    return;
  }

  const url = `https://kauth.kakao.com/oauth/token?grant_type=authorization_code&client_id=${KAKAO_REST_KEY}&redirect_uri=${KAKAO_REDIRECT_URI_DEV}&code=${code}`;

  try {
    const kakaoRes = await axios({
      method: 'POST',
      url,
      headers: {
        'Content-Type': 'application/x-www.form-urlencoded;charset=utf-8',
      },
    });

    const accessToken = kakaoRes.data.access_token;

    const userInfoRes = await axios({
      url: 'https://kapi.kakao.com/v2/user/me',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    });

    const user = await createUserOrLogin({
      platform: 'kakao',
      platformId: userInfoRes.data.id,
      name: userInfoRes.data.kakao_account.profile.nickname,
      profileImageURL: userInfoRes.data.kakao_account.profile.profile_image_url,
      email: userInfoRes.data.kakao_account.email,
    });

    res.status(201).json({
      ok: true,
      accessToken: user.accessToken,
      refreshToken: user.refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

const googleLogin = async (req, res, next) => {
  const { code } = req.query;
  console.log(code);

  const GOOGLE_AUTH_TOKEN_URL = `https://oauth2.googleapis.com/token?code=${code}&client_id=${GOOGLE_CLIENT_ID}&client_secret=${GOOGLE_CLIENT_SECRET}&redirect_uri=${GOOGLE_REDIERECT_URI_DEV}&grant_type=authorization_code`;
  const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

  try {
    const googleTokenRes = await axios({
      method: 'POST',
      url: GOOGLE_AUTH_TOKEN_URL,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const googleAccessToken = googleTokenRes.data.access_token;

    const userInfoRes = await axios({
      method: 'GET',
      url: GOOGLE_USERINFO_URL,
      headers: {
        Authorization: `Bearer ${googleAccessToken}`,
      },
    });

    const user = await createUserOrLogin({
      platform: 'google',
      platformId: userInfoRes.data.id,
      name: userInfoRes.data.name,
      profileImageURL: userInfoRes.data.picture,
      email: userInfoRes.data.email,
    });

    res.status(201).json({
      ok: true,
      accessToken: user.accessToken,
      refreshToken: user.refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

const naverLogin = (req, res) => {
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
      res.status(401).json({
        ok: false,
        message: 'Jwt expired',
      });
    } else if (err.message === 'invalid signature') {
      res.status(401).json({
        ok: false,
        message: 'Token invalid',
      });
    } else {
      res.status(401).json({
        ok: false,
        message: err.message,
      });
    }
  }
};

module.exports = {
  kakaoLogin,
  googleLogin,
  naverLogin,
  refreshToken,
};
