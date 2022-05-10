const Sequelize = require('sequelize');

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];

const User = require('./user');
const Project = require('./project');

const db = {};

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

db.sequelize = sequelize;
db.User = User;
db.Project = Project;

User.init(sequelize);
Project.init(sequelize);

User.associate(db);
Project.associate(db);

module.exports = db;
