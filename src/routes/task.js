const express = require('express');

const { auth } = require('../middlewares/auth');
const {
  getTask,
  createTask,
  updateTask,
  deleteTask,
} = require('../controller/task');

const router = express.Router();

router.get('/:cardId', auth, getTask);
router.post('/', auth, createTask);
router.patch('/:id', auth, updateTask);
router.delete('/:id', auth, deleteTask);

module.exports = router;
