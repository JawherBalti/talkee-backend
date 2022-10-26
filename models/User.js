'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      models.User.hasMany(models.Post, { onDelete: 'cascade', hooks: true });
      models.User.hasMany(models.Comment, { onDelete: 'cascade', hooks: true });
      models.User.hasMany(models.Like, { onDelete: 'cascade', hooks: true });
      models.User.belongsToMany(models.User, {
        foreignKey: 'userId',
        as: 'followers',
        through: 'Followers',
        onDelete: 'cascade',
        hooks: true,
      });
      models.User.belongsToMany(models.User, {
        foreignKey: 'followedUserId',
        as: 'following',
        through: 'Followers',
        onDelete: 'cascade',
        hooks: true,
      });
    }
  }
  User.init(
    {
      firstName: { type: DataTypes.STRING, allowNull: false },
      familyName: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      password: { type: DataTypes.STRING, allowNull: false },
      photoUrl: { type: DataTypes.STRING, allowNull: true },
      bannerUrl: { type: DataTypes.STRING, allowNull: true },
      biography: { type: DataTypes.STRING, allowNull: true },
      skills: { type: DataTypes.STRING, allowNull: true },
      role: { type: DataTypes.BOOLEAN, allowNull: false, default: false },
      isBlocked: { type: DataTypes.BOOLEAN, allowNull: false, default: false },
    },
    {
      sequelize,
      modelName: 'User',
    }
  );
  return User;
};
