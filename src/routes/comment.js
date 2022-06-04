const express = require('express');

const { auth } = require('../middlewares/auth');
const {
  getComment,
  createComment,
  updateComment,
  deleteComment,
} = require('../controller/comment');

const router = express.Router();

router.get('/:cardId', auth, getComment);
router.post('/', auth, createComment);
router.patch('/:id', auth, updateComment);
router.delete('/:id', auth, deleteComment);

module.exports = router;
