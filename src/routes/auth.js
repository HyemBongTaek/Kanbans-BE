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
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['email', 'profile'],
  })
);
router.get('/google/callback', passport.authenticate('google'), googleLogin);

// 네이버 로그인
router.get(
  '/naver',
  passport.authenticate('naver', {
    scope: ['email', 'profile'],
  })
);
router.get('/naver/callback', passport.authenticate('naver'), naverLogin);

// Refresh Token 재발급
router.post('/refresh', auth, refreshToken);

module.exports = router;
