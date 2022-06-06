const {
  DEV_DB_USERNAME,
  DEV_DB_PW,
  DEV_DB_NAME,
  DEV_HOST,
  DB_USERNAME,
  DB_PW,
  DB_NAME,
  HOST,
} = process.env;

module.exports = {
  development: {
    username: DEV_DB_USERNAME,
    password: DEV_DB_PW,
    database: DEV_DB_NAME,
    host: DEV_HOST,
    dialect: 'mysql',
    dialectOptions: {
      charset: 'utf8mb4',
      dateStrings: true,
      typeCast(field, next) {
        if (field.type === 'DATETIME' || field.type === 'TIMESTAMP') {
          return new Date(`${field.string()}Z`);
        }
        return next();
      },
    },
    timezone: 'Asia/Seoul',
  },
  test: {
    username: 'root',
    password: null,
    database: 'database_test',
    host: '127.0.0.1',
    dialect: 'mysql',
  },
  production: {
    username: DB_USERNAME,
    password: DB_PW,
    database: DB_NAME,
    host: HOST,
    dialect: 'mysql',
    dialectOptions: {
      charset: 'utf8mb4',
      dateStrings: true,
      typeCast(field, next) {
        if (field.type === 'DATETIME' || field.type === 'TIMESTAMP') {
          return new Date(`${field.string()}Z`);
        }
        return next();
      },
    },
    timezone: 'Asia/Seoul',
    logging: false,
  },
};
