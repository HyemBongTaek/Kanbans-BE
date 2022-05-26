const express = require('express');

const { auth } = require('../middlewares/auth');
const {
  getBoard,
  createBoard,
  updateBoard,
  deleteBoard,
} = require('../controller/board');
const { createCard, deleteCard } = require('../controller/card');

const router = express.Router();

// 보드 생성
router.get('/:project_id', auth, getBoard);
router.post('/', auth, createBoard);
router.patch('/:id', auth, updateBoard);
router.delete('/:id', auth, deleteBoard);

// 카드 생성
router.post('/:boardId/card', auth, createCard);
router.delete('/:boardId/card/:cardId', auth, deleteCard);

module.exports = router;
