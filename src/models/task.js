const Sequelize = require('sequelize');

module.exports = class Task extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        content: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        check: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
      },
      {
        sequelize,
        timestamps: false,
        underscored: true,
        modelName: 'Task',
        tableName: 'tasks',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
      }
    );
  }

  static associate(db) {
    db.Task.belongsTo(db.Card, {
      foreignKey: { name: 'cardId', targetKey: 'id', allowNull: false },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  }
};
