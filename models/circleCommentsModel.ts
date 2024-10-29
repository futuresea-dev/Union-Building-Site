"use strict";
module.exports = function (sequelize: any, DataTypes: any) {
  var sycu_circleComments: any = sequelize.define(
    "circle_comments",
    {
      comment_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      comment_text: DataTypes.TEXT(),
      user_name: DataTypes.STRING(255),
      user_email: DataTypes.STRING(255),
      profile_url: DataTypes.STRING(255),
      circle_comment_id: DataTypes.INTEGER,
      circle_user_id: DataTypes.INTEGER,
      circle_parent_comment_id: DataTypes.INTEGER,
      user_id: DataTypes.INTEGER,
      circle_post_id: DataTypes.INTEGER,
      is_deleted: DataTypes.INTEGER,
      created_datetime: DataTypes.DATE(),
      updated_datetime: DataTypes.DATE(),
    },
    {
      tableName: "circle_comments",
      timestamps: false,
      underscored: true,
    }
  );
  sycu_circleComments.associate = function (models: any) {
    sycu_circleComments.belongsTo(models.users, {
      foreignKey: "user_id",
      targetKey: "user_id",
    });
  };
  return sycu_circleComments;
};
