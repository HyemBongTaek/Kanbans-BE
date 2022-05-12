const express = require('express');

const { auth } = require('../middlewares/auth');
const {
  createProject,
  loadAllProject,
  bookmark,
} = require('../controller/project');

const router = express.Router();

router.post('/', auth, createProject);
router.get('/', auth, loadAllProject);
router.post('/bookmark', auth, bookmark);

module.exports = router;
