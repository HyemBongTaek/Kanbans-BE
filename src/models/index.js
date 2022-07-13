const Sequelize = require('sequelize');

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];

const User = require('./user');
const Project = require('./project');
const UserProject = require('./userProject');
const Board = require('./board');
const Card = require('./card');
const Task = require('./task');
const UserCard = require('./userCard');
const Comment = require('./comment');
const Image = require('./image');
const Label = require('./label');
const CardLabel = require('./cardLabel');
const Alarm = require('./alarm');

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
db.Task = Task;
db.UserCard = UserCard;
db.Comment = Comment;
db.Image = Image;
db.Label = Label;
db.CardLabel = CardLabel;
db.Alarm = Alarm;

User.init(sequelize);
Project.init(sequelize);
UserProject.init(sequelize);
Board.init(sequelize);
Card.init(sequelize);
Task.init(sequelize);
UserCard.init(sequelize);
Comment.init(sequelize);
Image.init(sequelize);
Label.init(sequelize);
CardLabel.init(sequelize);
Alarm.init(sequelize);

User.associate(db);
Project.associate(db);
UserProject.associate(db);
Board.associate(db);
Card.associate(db);
Task.associate(db);
UserCard.associate(db);
Comment.associate(db);
Image.associate(db);
Label.associate(db);
CardLabel.associate(db);
Alarm.associate(db);

module.exports = db;
