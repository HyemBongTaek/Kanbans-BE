const Sequelize = require('sequelize');

module.exports = class Label extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        title: {
          type: Sequelize.STRING(50),
          allowNull: false,
        },
        color: {
          type: Sequelize.STRING(20),
          allowNull: false,
        },
      },
      {
        sequelize,
        timestamps: false,
        underscored: true,
        modelName: 'Label',
        tableName: 'labels',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci',
      }
    );
  }

  static associate(db) {
    db.Label.belongsTo(db.Project, {
      foreignKey: {
        name: 'projectId',
        targetKey: 'id',
      },
      onDelete: 'cascade',
      onUpdate: 'cascade',
    });
  }
};
