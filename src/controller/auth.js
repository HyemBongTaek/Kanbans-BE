const axios = require('axios');

const {
  signAccessToken,
  signRefreshToken,
  verifyToken,
} = require('../utils/jwt');
const { createUserOrLogin } = require('../utils/auth');
const User = require('../models/user');

const {
  KAKAO_REST_KEY,
  KAKAO_REDIRECT_URI_DEV,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIERECT_URI_DEV,
  NAVER_CLIENT_ID,
  NAVER_CLIENT_SECRET,
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

    res.status(200).json({
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

    res.status(200).json({
      ok: true,
      accessToken: user.accessToken,
      refreshToken: user.refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

const naverLogin = async (req, res, next) => {
  const { code } = req.query;

  const NAVER_AUTH_TOKEN_URL = `https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=${NAVER_CLIENT_ID}&client_secret=${NAVER_CLIENT_SECRET}&code=${code}`;
  const NAVER_USERINFO_URL = `https://openapi.naver.com/v1/nid/me`;

  try {
    const naverTokenRes = await axios({
      method: 'POST',
      url: NAVER_AUTH_TOKEN_URL,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const naverAccessToken = naverTokenRes.data.access_token;

    const userInfoRes = await axios({
      method: 'GET',
      url: NAVER_USERINFO_URL,
      headers: {
        Authorization: `Bearer ${naverAccessToken}`,
      },
    });

    const user = await createUserOrLogin({
      platform: 'naver',
      platformId: userInfoRes.data.response.id,
      name: userInfoRes.data.response.nickname,
      profileImageURL: userInfoRes.data.response.profile_image,
      email: userInfoRes.data.response.email,
    });

    res.status(200).json({
      ok: true,
      accessToken: user.accessToken,
      refreshToken: user.refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

const refreshToken = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    res.status(401).json({
      ok: false,
      message: 'Jwt must be provided',
    });
    return;
  }

  const [tokenType, refresh] = authorization.split(' ');

  if (tokenType !== 'Bearer') {
    res.status(401).json({
      ok: false,
      message: 'Not authenticated',
    });
    return;
  }

  const verifiedRefresh = verifyToken(refresh);

  if (verifiedRefresh.error === 'jwt expired') {
    res.status(401).json({
      ok: false,
      message: 'Token expired. Please login again',
    });
    return;
  }

  if (verifiedRefresh.error === 'invalid signature') {
    res.status(401).json({
      ok: false,
      message: 'Token invalid',
    });
    return;
  }

  if (verifiedRefresh.error === 'jwt malformed') {
    res.status(401).json({
      ok: false,
      message: 'Token malformed',
    });
    return;
  }

  try {
    const user = await User.findOne({
      where: {
        refreshToken: refresh,
      },
    });

    if (!user) {
      res.status(400).json({
        ok: false,
        message: 'Token does not match. Please login again',
      });
      return;
    }

    const newAccessToken = await signAccessToken(user.id, user.name);
    const newRefreshToken = await signRefreshToken();

    user.refreshToken = newRefreshToken;
    await user.save();

    res.status(200).json({
      ok: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  kakaoLogin,
  googleLogin,
  naverLogin,
  refreshToken,
};
