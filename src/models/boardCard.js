const Sequelize = require('sequelize');

module.exports = class BoardCard extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        boardId: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        cardId: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
      },
      {
        sequelize,
        timestamps: false,
        underscored: true,
        modelName: 'BoardCard',
        tableName: 'boardcards',
        charset: 'utf8',
        collate: 'utf8_general_ci',
      }
    );
  }

  static associate(db) {
    db.BoardCard.belongsTo(db.Board, {
      foreignKey: {
        name: 'board_id',
        allowNull: false,
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    db.BoardCard.belongsTo(db.Card, {
      foreignKey: {
        name: 'card_id',
        targetKey: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  }
};
