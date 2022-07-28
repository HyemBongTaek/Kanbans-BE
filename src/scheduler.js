const schedule = require('node-schedule');

const { Board, Card, Project } = require('./models');
const { redisClient } = require('./redis');
const { getBoardOrder, getCardOrder } = require('./utils/redis');

async function autoSave(key) {
  const [type, id, orderType] = key.split(':');

  try {
    if (type === 'project') {
      const boardOrder = await getBoardOrder(id);

      await Project.update(
        {
          boardOrder: boardOrder || '',
        },
        {
          where: {
            id,
          },
        }
      );
    } else if (type === 'board') {
      const cardOrder = await getCardOrder(id);

      await Board.update(
        {
          cardOrder: cardOrder || '',
        },
        {
          where: {
            id,
          },
        }
      );

      if (cardOrder !== null || cardOrder !== '') {
        await Card.update(
          {
            boardId: id,
          },
          {
            where: {
              id: cardOrder.split(';'),
            },
          }
        );
      }
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
      await Promise.allSettled(data.keys.map((key) => autoSave(key)));
    }
  } catch (err) {
    throw new Error(err.message);
  }
}

function job() {
  console.log('✅ 스케줄러 실행!');
  return schedule.scheduleJob('0 0/15 * * * ?', redisSchedule);
}

module.exports = job;
