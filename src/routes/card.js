const express = require('express');

const router = express.Router();

const { auth } = require('../middlewares/auth');
const { loadCardData } = require('../controller/card');

// 카드 보기
router.get('/:cardId', auth, loadCardData);

module.exports = router;
