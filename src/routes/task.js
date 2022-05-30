const express = require('express');

const { auth } = require('../middlewares/auth');
const { createTask, deleteTask } = require('../controller/task');

const router = express.Router();

router.post('/', auth, createTask);
router.delete('/:id', auth, deleteTask);

module.exports = router;
