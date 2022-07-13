const Sequelize = require('sequelize');

module.exports = class Project extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        owner: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        title: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        permission: {
          type: Sequelize.STRING(10),
          allowNull: false,
          defaultValue: 'public',
        },
        inviteCode: {
          type: Sequelize.STRING(50),
          allowNull: false,
        },
        boardOrder: {
          type: Sequelize.TEXT,
          defaultValue: '',
        },
      },
      {
        sequelize,
        timestamps: false,
        underscored: true,
        modelName: 'Project',
        tableName: 'projects',
        charset: 'utf8',
        collate: 'utf8_general_ci',
      }
    );
  }

  static associate(db) {
    db.Project.hasMany(db.UserProject, {
      foreignKey: {
        name: 'projectId',
        allowNull: false,
      },
      onDelete: 'cascade',
      onUpdate: 'cascade',
    });

    db.Project.hasMany(db.Board, {
      foreignKey: { name: 'projectId', sourceKey: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    db.Project.hasMany(db.Label, {
      foreignKey: {
        name: 'projectId',
        sourceKey: 'id',
      },
      onDelete: 'cascade',
      onUpdate: 'cascade',
    });
  }
};
