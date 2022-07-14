const Sequelize = require('sequelize');

module.exports = class User extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        platform: {
          type: Sequelize.STRING(20),
          allowNull: false,
        },
        platformId: {
          type: Sequelize.STRING(30),
          allowNull: false,
        },
        profileImage: {
          type: Sequelize.TEXT,
        },
        name: {
          type: Sequelize.STRING(50),
          allowNull: false,
        },
        email: {
          type: Sequelize.STRING(20),
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: sequelize.literal('now()'),
        },
        refreshToken: {
          type: Sequelize.TEXT,
        },
        introduce: {
          type: Sequelize.TEXT,
        },
      },
      {
        sequelize,
        timestamps: false,
        underscored: true,
        modelName: 'User',
        tableName: 'users',
        charset: 'utf8',
        collate: 'utf8_general_ci',
      }
    );
  }

  static associate(db) {
    db.User.hasMany(db.UserProject, {
      foreignKey: {
        name: 'userId',
        allowNull: false,
      },
      onDelete: 'cascade',
      onUpdate: 'cascade',
    });

    db.User.hasMany(db.UserCard, {
      foreignKey: {
        name: 'userId',
        allowNull: false,
      },
      onDelete: 'cascade',
      onUpdate: 'cascade',
    });

    db.User.hasMany(db.Comment, {
      foreignKey: { name: 'userId', sourceKey: 'id', allowNull: false },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    db.User.hasMany(db.Alarm, {
      foreignKey: { name: 'userId', sourceKey: 'id', allowNull: false },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  }
};
