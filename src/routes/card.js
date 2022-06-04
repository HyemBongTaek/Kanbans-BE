const express = require('express');

const router = express.Router();

const { auth } = require('../middlewares/auth');
const { updateCardLocation } = require('../controller/card');

// 카드 순서 변경
router.patch('/card-location', auth, updateCardLocation);

module.exports = router;
