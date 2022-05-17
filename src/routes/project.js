const express = require('express');

const { auth } = require('../middlewares/auth');
const {
  createProject,
  loadAllProject,
  bookmark,
  joinProject,
} = require('../controller/project');

const router = express.Router();

router.post('/', auth, createProject);
router.get('/', auth, loadAllProject);
router.post('/bookmark', auth, bookmark);
router.post('/join', auth, joinProject);

module.exports = router;
