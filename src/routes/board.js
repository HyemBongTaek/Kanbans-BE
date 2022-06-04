const express = require('express');

const { auth } = require('../middlewares/auth');
const {
  getBoard,
  createBoard,
  updateBoard,
  deleteBoard,
} = require('../controller/board');
const {
  deleteCard,
  deleteAllCards,
  modifyCardCheck,
  modifyCardStatus,
  updateCardLocation,
  createCard,
} = require('../controller/card');

const router = express.Router();

// 보드 불러오기
router.get('/:projectId', auth, getBoard);
// 보드 생성
router.post('/', auth, createBoard);
// 보드 수정
router.patch('/:id', auth, updateBoard);
// 보드 삭제
router.delete('/:boardId', auth, deleteBoard);

// 카드 생성
router.post('/:boardId/card', auth, createCard);
// 카드 상태변경
router.patch('/:boardId/card/:cardId/status', auth, modifyCardStatus);
// 카드 체크
router.patch('/:boardId/card/:cardId/check', auth, modifyCardCheck);
// 카드 삭제
router.delete('/:boardId/card/:cardId', auth, deleteCard);
// 카드 전체 삭제
router.delete('/:boardId/cards', auth, deleteAllCards);
// 카드 순서 변경
router.patch('/card/location', auth, updateCardLocation);

module.exports = router;
