const express = require('express');

const authRoutes = require('./auth');
const projectRoutes = require('./project');
const userRoutes = require('./user');
const boardRoutes = require('./board');
const taskRoutes = require('./task');
const commentRoutes = require('./comment');
const cardRoutes = require('./card');
const alarmRoutes = require('./alarm');

const router = express.Router();

router.use('/oauth', authRoutes);
router.use('/project', projectRoutes);
router.use('/user', userRoutes);
router.use('/board', boardRoutes);
router.use('/task', taskRoutes);
router.use('/comment', commentRoutes);
router.use('/card', cardRoutes);
router.use('/alarm', alarmRoutes);

module.exports = router;
