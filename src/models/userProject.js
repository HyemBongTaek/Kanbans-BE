const Sequelize = require('sequelize');

module.exports = class UserProject extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        userId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          primaryKey: true,
        },
        projectId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          primaryKey: true,
        },
        bookmark: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
      },
      {
        sequelize,
        timestamps: false,
        underscored: true,
        modelName: 'UserProject',
        tableName: 'user_project',
        charset: 'utf8',
        collate: 'utf8_general_ci',
      }
    );
  }

  static associate(db) {
    db.UserProject.belongsTo(db.User, {
      foreignKey: {
        name: 'userId',
        targetKey: 'id',
        allowNull: false,
      },
      as: 'user',
      onDelete: 'cascade',
      onUpdate: 'cascade',
    });

    db.UserProject.belongsTo(db.Project, {
      foreignKey: {
        name: 'projectId',
        targetKey: 'id',
        allowNull: false,
      },
      onDelete: 'cascade',
      onUpdate: 'cascade',
    });
  }
};
