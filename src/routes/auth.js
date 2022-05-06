const express = require('express');
const passport = require('passport');

const { kakaoLogin, googleLogin } = require('../controller/auth');

const router = express.Router();

router.get('/kakao', passport.authenticate('kakao'));
router.get('/kakao/callback', passport.authenticate('kakao'), kakaoLogin);
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['email', 'profile'],
  })
);
router.get('/google/callback', passport.authenticate('google'), googleLogin);

module.exports = router;
