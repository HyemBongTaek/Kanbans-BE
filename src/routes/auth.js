const express = require('express');
const passport = require('passport');

const { kakaoLogin, googleLogin, refreshToken } = require('../controller/auth');

const router = express.Router();

// 카카오 로그인
router.get('/kakao', passport.authenticate('kakao'));
router.get('/kakao/callback', passport.authenticate('kakao'), kakaoLogin);

// 구글 로그인
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['email', 'profile'],
  })
);
router.get('/google/callback', passport.authenticate('google'), googleLogin);

// Refresh Token 재발급
router.post('/refresh', refreshToken);

module.exports = router;
