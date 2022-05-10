const express = require('express');

const { auth } = require('../middlewares/auth');
const { createProject } = require('../controller/project');

const router = express.Router();

router.post('/', auth, createProject);

module.exports = router;
