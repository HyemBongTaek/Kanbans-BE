const express = require('express');

const { auth } = require('../middlewares/auth');
const { createProject, loadAllProject } = require('../controller/project');

const router = express.Router();

router.post('/', auth, createProject);
router.get('/', auth, loadAllProject);

module.exports = router;
