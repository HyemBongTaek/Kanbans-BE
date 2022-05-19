const express = require('express');

const { auth } = require('../middlewares/auth');
const {
  bookmark,
  createProject,
  deleteProject,
  leaveProject,
  loadAllProject,
  joinProject,
  updateProject,
} = require('../controller/project');

const router = express.Router();

router.post('/', auth, createProject);
router.get('/', auth, loadAllProject);
router.patch('/:id', auth, updateProject);
router.delete('/:id', auth, deleteProject);
router.post('/bookmark', auth, bookmark);
router.post('/join', auth, joinProject);
router.delete('/leave/:id', auth, leaveProject);

module.exports = router;
