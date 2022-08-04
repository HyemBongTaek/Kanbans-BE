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

router.use(auth);

// 보드 불러오기
router.get('/:projectId', getBoard);
// 보드 생성
router.post('/', createBoard);
// 보드 수정
router.patch('/:id', updateBoard);
// 보드 삭제
router.post('/:boardId', deleteBoard);

// 카드 생성
router.post('/:boardId/card', createCard);
// 카드 상태변경
router.patch('/:boardId/card/:cardId/status', modifyCardStatus);
// 카드 체크
router.patch('/:boardId/card/:cardId/check', modifyCardCheck);
// 카드 삭제
router.delete('/:boardId/card/:cardId', deleteCard);
// 카드 전체 삭제
router.post('/:boardId/cards', deleteAllCards);
// 카드 순서 변경
router.patch('/card/location', updateCardLocation);

module.exports = router;
