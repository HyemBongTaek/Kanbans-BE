const { sequelize } = require('./models/index');

module.exports = async () => {
  try {
    await sequelize.sync({ force: false });
    console.log('✅ DB 연결 성공');
  } catch (error) {
    console.log('❗ DB 연결 실패');
    console.log(error);
  }
};
