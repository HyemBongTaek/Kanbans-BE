const Sequelize = require('sequelize');

module.exports = class Alarm extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        time: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        createdAt: {
          type: Sequelize.DATEONLY,
          allowNull: false,
        },
      },
      {
        sequelize,
        timestamps: false,
        underscored: true,
        modelName: 'Alarm',
        tableName: 'alarms',
        charset: 'utf8',
        collate: 'utf8_general_ci',
      }
    );
  }

  static associate(db) {
    db.User.hasMany(db.Comment, {
      foreignKey: { name: 'userId', targetKey: 'id', allowNull: false },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  }
};
