const express = require('express');

const { auth } = require('../middlewares/auth');
const {
  getBoard,
  createBoard,
  updateBoard,
  deleteBoard,
} = require('../controller/board');
const { createCard } = require('../controller/card');

const router = express.Router();

router.get('/:project_id', auth, getBoard);
router.post('/', auth, createBoard);
router.patch('/:id', auth, updateBoard);
router.delete('/:id', auth, deleteBoard);
router.post('/:boardId/card', auth, createCard);

module.exports = router;
