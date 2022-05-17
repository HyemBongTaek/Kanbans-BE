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
        name: 'project_id',
        allowNull: false,
      },
      onDelete: 'cascade',
      onUpdate: 'cascade',
    });
    db.Project.hasMany(db.Board, {
      foreignKey: { name: 'project_id', sourceKey: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  }
};
