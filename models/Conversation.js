const { Sequelize, Model } = require('sequelize');

('use strict');

module.exports = (sequelize, DataTypes) => {
  class Conversation extends Model {
    static associate(models) {
      models.Conversation.belongsTo(models.User, {
        foreignKey: 'firstUserId',
        as: 'firstUser',
      });
      models.Conversation.belongsTo(models.User, {
        foreignKey: 'secondUserId',
        as: 'secondUser',
      });
      models.Conversation.hasMany(models.Message, {
        onDelete: 'cascade',
        foreignKey: 'conversationId',
        hooks: true,
      });
    }
  }
  Conversation.init(
    {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      unreadMessageFirstUser: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      unreadMessageSecondUser: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      senderId: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Conversation',
    }
  );
  return Conversation;
};
