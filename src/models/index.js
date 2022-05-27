const Sequelize = require('sequelize');

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];

const User = require('./user');
const Project = require('./project');
const UserProject = require('./userProject');
const Board = require('./board');
const Card = require('./card');

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
db.UserProject = UserProject;
db.Board = Board;
db.Card = Card;

User.init(sequelize);
Project.init(sequelize);
UserProject.init(sequelize);
Board.init(sequelize);
Card.init(sequelize);

User.associate(db);
Project.associate(db);
UserProject.associate(db);
Board.associate(db);
Card.associate(db);

module.exports = db;
