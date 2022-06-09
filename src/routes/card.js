const express = require('express');

const router = express.Router();

const { auth } = require('../middlewares/auth');
const { loadCardData, inputCardDetails } = require('../controller/card');

// 카드 보기
router.get('/:cardId', auth, loadCardData);
// 카드 세부정보 입력
router.patch('/:cardId/card-details', auth, inputCardDetails);

module.exports = router;
