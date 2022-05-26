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
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
      },
      {
        sequelize,
        timestamps: false,
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

    // db.Card.hasMany(db.BoardCard, {
    //   foreignKey: {
    //     name: 'card_id',
    //     sourceKey: 'id',
    //   },
    //   onDelete: 'CASCADE',
    //   onUpdate: 'CASCADE',
    // });
  }
};
