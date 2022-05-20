const express = require('express');

const { auth } = require('../middlewares/auth');
const { profileUpload } = require('../middlewares/upload');
const {
  changeProfile,
  deleteUser,
  getProfileInfo,
} = require('../controller/user');

const router = express.Router();

router.get('/profile', auth, getProfileInfo);
router.patch('/profile', auth, profileUpload, changeProfile);
router.delete('/sign-out', auth, deleteUser);

module.exports = router;
