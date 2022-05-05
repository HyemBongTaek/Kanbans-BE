const { DB_USERNAME, DB_PW, DB_NAME, HOST } = process.env;

module.exports = {
  development: {
    username: DB_USERNAME,
    password: DB_PW,
    database: DB_NAME,
    host: HOST,
    dialect: 'mysql',
    timezone: '+09:00',
  },
  test: {
    username: 'root',
    password: null,
    database: 'database_test',
    host: '127.0.0.1',
    dialect: 'mysql',
  },
  production: {
    username: '',
    password: null,
    database: '',
    host: '127.0.0.1',
    dialect: 'mysql',
  },
};
