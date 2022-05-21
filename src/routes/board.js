const express = require('express');

const { auth } = require('../middlewares/auth');
const { createBoard, getBoard } = require('../controller/board');

const router = express.Router();

router.get('/:project_id', auth, getBoard);
router.post('/', auth, createBoard);

module.exports = router;
