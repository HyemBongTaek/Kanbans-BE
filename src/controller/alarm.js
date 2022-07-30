const { Alarm } = require('../models/index');

const getAlarm = async (req, res, next) => {
  const {
    userId,
    query: { page },
  } = req;
  try {
    const findAlarm = await Alarm.findAll({
      where: {
        userId,
      },
    });
    const allAlarm = findAlarm.length;
    let offset = 0;
    if (page > 1) {
      offset = 7 * (page - 1);
    }
    const alarms = await Alarm.findAll({
      where: {
        userId,
      },
      offset,
      limit: 7,
      order: [['createdAt', 'desc']],
    });
    if (alarms.length <= 0) {
      res.status(200).json({
        ok: true,
        allAlarm,
        alarms: [
          {
            id: {},
            time: {},
            createdAt: {},
            userId: {},
          },
        ],
      });
      return;
    }
    res.status(200).json({ ok: true, allAlarm, alarms });
  } catch (err) {
    next(err);
  }
};

const updateAlarm = async (req, res, next) => {
  const {
    userId,
    body: { time, createdAt },
  } = req;
  try {
    const findAlarms = await Alarm.findOne({
      where: {
        createdAt,
        userId,
      },
    });
    if (!findAlarms) {
      await Alarm.create({
        time,
        createdAt,
        userId,
      });
    } else {
      await Alarm.update(
        {
          createdAt,
          userId,
        },
        { where: { createdAt, userId } }
      );
      await Alarm.increment({ time }, { where: { createdAt, userId } });
    }
    const findAlarm = await Alarm.findOne({
      where: {
        createdAt,
        userId,
      },
    });
    res.status(201).json({ ok: true, findAlarm });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAlarm,
  updateAlarm,
};
