const express = require('express');

const { auth } = require('../middlewares/auth');
const { getAlarm, updateAlarm } = require('../controller/alarm');

const router = express.Router();

router.get('/', auth, getAlarm);
router.put('/', auth, updateAlarm);

module.exports = router;
