"use strict";
module.exports = function (sequelize: any, DataTypes: any) {
  var sycu_circlePosts: any = sequelize.define(
    "circle_posts",
    {
      post_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      title: DataTypes.TEXT(),
      post_url: DataTypes.TEXT(),
      profile_url: DataTypes.STRING(255),
      post_content: DataTypes.TEXT(),
      user_name: DataTypes.STRING(255),
      user_email: DataTypes.STRING(255),
      circle_user_id: DataTypes.INTEGER,
      user_id: DataTypes.INTEGER,
      circle_post_id: DataTypes.INTEGER,
      site_id: DataTypes.INTEGER,
      circle_space_id: DataTypes.INTEGER,
      circle_community_id: DataTypes.INTEGER,
      is_deleted: DataTypes.INTEGER,
      created_datetime: DataTypes.DATE(),
      updated_datetime: DataTypes.DATE(),
    },
    {
      tableName: "circle_posts",
      timestamps: false,
      underscored: true,
    }
  );
  sycu_circlePosts.associate = function (models: any) {
    sycu_circlePosts.belongsTo(models.sites, {
      foreignKey: "site_id",
      targetKey: "site_id",
    });
    sycu_circlePosts.hasMany(models.comments, {
      foreignKey: "circle_post_id",
      sourceKey: "circle_post_id",
    });
    sycu_circlePosts.belongsTo(models.users, {
      foreignKey: "user_id",
      targetKey: "user_id",
    });
  };
  return sycu_circlePosts;
};
