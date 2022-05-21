const Sequelize = require('sequelize');

module.exports = class Board extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        title: {
          type: Sequelize.STRING(50),
          allowNull: false,
        },
      },
      {
        sequelize,
        timestamps: false,
        underscored: true,
        modelName: 'Board',
        tableName: 'boards',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
      }
    );
  }

  static associate(db) {
    db.Board.belongsTo(db.Project, {
      foreignKey: { name: 'project_id', targetKey: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  }
};