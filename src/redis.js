const redis = require('redis');

const { REDIS_PORT, REDIS_HOST } = process.env;

const redisClient = redis.createClient(REDIS_PORT, REDIS_HOST);

async function redisConnect() {
  await redisClient.on('error', (err) =>
    console.log('REDIS CLIENT EORROR', err)
  );
  await redisClient.on('ready', () => console.log('REDIS IS READY'));
  await redisClient.connect();
}

module.exports = {
  redisConnect,
  redisClient,
};
