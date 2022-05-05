const express = require('express');
const passport = require('passport');

const { kakaoLogin } = require('../controller/kakaoController');

const router = express.Router();

router.get('/kakao', passport.authenticate('kakao'));
router.get('/kakao/callback', passport.authenticate('kakao'), kakaoLogin);

module.exports = router;
