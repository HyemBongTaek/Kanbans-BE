const schedule = require('node-schedule');

const { redisClient } = require('./redis');
const { BoardOrder } = require('./models/index');

async function save(key) {
  const [type, num] = key.split('_');

  try {
    const data = await redisClient.get(key);

    if (type === 'p') {
      const boardOrder = await BoardOrder.findOne({
        where: {
          projectId: +num,
        },
      });

      if (boardOrder.order !== data) {
        boardOrder.order = data;
        await boardOrder.save();
      }

      await redisClient.del(key);
    }
  } catch (err) {
    const error = new Error(err.message);
    throw error;
  }
}

async function redisSchedule() {
  try {
    const data = await redisClient.SCAN(0);

    if (data.keys.length > 0) {
      await Promise.all(data.keys.map((key) => save(key)));
    }
  } catch (err) {
    const error = new Error(err.message);
    throw error;
  }
}

function job() {
  return schedule.scheduleJob('0 0/10 * * * ?', redisSchedule);
}

module.exports = job;
