const express = require('express');

const { auth } = require('../middlewares/auth');
const { profileUpload } = require('../middlewares/upload');
const { changeProfile } = require('../controller/user');

const router = express.Router();

router.patch('/profile', auth, profileUpload, changeProfile);

module.exports = router;
