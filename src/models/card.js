const Sequelize = require('sequelize');

module.exports = class Card extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        title: {
          type: Sequelize.STRING(50),
          allowNull: false,
        },
        subtitle: {
          type: Sequelize.TEXT,
        },
        description: {
          type: Sequelize.TEXT,
        },
        dDay: {
          type: Sequelize.DATE,
        },
        status: {
          type: Sequelize.STRING(20),
          allowNull: false,
          defaultValue: 'progress',
        },
        check: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
      },
      {
        sequelize,
        timestamps: true,
        createdAt: true,
        updatedAt: false,
        underscored: true,
        modelName: 'Card',
        tableName: 'cards',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
      }
    );
  }

  static associate(db) {
    db.Card.belongsTo(db.Board, {
      foreignKey: {
        name: 'boardId',
        targetKey: 'id',
        allowNull: false,
      },
      onDelete: 'cascade',
      onUpdate: 'cascade',
    });

    db.Card.hasMany(db.Task, {
      foreignKey: { name: 'cardId', sourceKey: 'id', allowNull: false },
      as: 'tasks',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    db.Card.hasMany(db.UserCard, {
      foreignKey: {
        name: 'cardId',
        allowNull: false,
      },
      as: 'users',
      onDelete: 'cascade',
      onUpdate: 'cascade',
    });

    db.Card.hasMany(db.Comment, {
      foreignKey: { name: 'cardId', sourceKey: 'id', allowNull: false },
      as: 'comments',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  }
};
