const Sequelize = require('sequelize');

module.exports = class Board extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        order: {
          type: Sequelize.TEXT,
        },
      },
      {
        sequelize,
        timestamps: false,
        underscored: true,
        modelName: 'BoardOrder',
        tableName: 'board_order',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
      }
    );
  }

  static associate(db) {
    db.BoardOrder.belongsTo(db.Project, {
      foreignKey: {
        name: 'projectId',
        targetKey: 'id',
      },
      onDelete: 'cascade',
      onUpdate: 'cascade',
    });
  }
};
