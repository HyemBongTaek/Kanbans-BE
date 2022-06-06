const Sequelize = require('sequelize');

module.exports = class UserCard extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        userId: {
          type: Sequelize.INTEGER,
          primaryKey: true,
        },
        cardId: {
          type: Sequelize.INTEGER,
          primaryKey: true,
        },
      },
      {
        sequelize,
        timestamps: false,
        underscored: true,
        modelName: 'UserCard',
        tableName: 'user_card',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
      }
    );
  }

  static associate(db) {
    db.UserCard.belongsTo(db.User, {
      foreignKey: {
        name: 'userId',
        targetKey: 'id',
        allowNull: false,
      },
      as: 'user',
      onDelete: 'cascade',
      onUpdate: 'cascade',
    });

    db.UserCard.belongsTo(db.Card, {
      foreignKey: {
        name: 'cardId',
        targetKey: 'id',
        allowNull: false,
      },
      as: 'card',
      onDelete: 'cascade',
      onUpdate: 'cascade',
    });
  }
};
