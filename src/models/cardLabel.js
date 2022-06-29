const Sequelize = require('sequelize');

module.exports = class CardLabel extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        cardId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          primaryKey: true,
        },
        labelId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          primaryKey: true,
        },
      },
      {
        sequelize,
        timestamps: false,
        underscored: true,
        modelName: 'CardLabel',
        tableName: 'card_label',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
      }
    );
  }

  static associate(db) {
    db.CardLabel.belongsTo(db.Label, {
      foreignKey: {
        name: 'labelId',
        targetKey: 'id',
      },
      as: 'label',
      onDelete: 'cascade',
      onUpdate: 'cascade',
    });

    db.CardLabel.belongsTo(db.Card, {
      foreignKey: {
        name: 'cardId',
        targetKey: 'id',
      },
      as: 'card',
      onDelete: 'cascade',
      onUpdate: 'cascade',
    });
  }
};
