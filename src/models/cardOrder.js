const Sequelize = require('sequelize');

module.exports = class CardOrder extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        order: {
          type: Sequelize.TEXT,
          defaultValue: '',
        },
      },
      {
        sequelize,
        timestamps: false,
        underscored: true,
        modelName: 'CardOrder',
        tableName: 'card_order',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
      }
    );
  }

  static associate(db) {
    db.CardOrder.belongsTo(db.Board, {
      foreignKey: {
        name: 'boardId',
        targetKey: 'id',
      },
      onDelete: 'cascade',
      onUpdate: 'cascade',
    });
  }
};
