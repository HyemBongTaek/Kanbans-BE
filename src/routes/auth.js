const express = require('express');
const passport = require('passport');

const { auth } = require('../middlewares/auth');
const {
  kakaoLogin,
  googleLogin,
  naverLogin,
  refreshToken,
} = require('../controller/auth');

const router = express.Router();

// 카카오 로그인
router.get('/kakao', kakaoLogin);

// 구글 로그인
router.get('/google', googleLogin);

// 네이버 로그인
router.get(
  '/naver',
  passport.authenticate('naver', {
    scope: ['email', 'profile'],
  })
);
router.get('/naver/callback', passport.authenticate('naver'), naverLogin);

// Refresh Token 재발급
router.get('/refresh', refreshToken);

module.exports = router;
