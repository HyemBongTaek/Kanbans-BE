const express = require('express');

const { auth } = require('../middlewares/auth');
const { profileUpload } = require('../middlewares/upload');
const { changeProfile, deleteUser } = require('../controller/user');

const router = express.Router();

router.patch('/profile', auth, profileUpload, changeProfile);
router.delete('/sign-out', auth, deleteUser);

module.exports = router;
