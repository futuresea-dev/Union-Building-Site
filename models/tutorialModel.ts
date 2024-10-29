'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
  var sycu_tutorial: any = sequelize.define('sycu_tutorial', {
    tutorial_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    site_id: DataTypes.INTEGER,
    title: DataTypes.TEXT(),
    content: DataTypes.TEXT(),
    featured_image_url: DataTypes.STRING(1024),
    video_url: DataTypes.STRING(1024),
    button_link: DataTypes.STRING(1024),
    is_active: DataTypes.INTEGER,
    is_deleted: DataTypes.INTEGER,
    created_datetime: DataTypes.DATE(),
    updated_datetime: DataTypes.DATE(),
    created_by: DataTypes.INTEGER,
    type: DataTypes.INTEGER,
    updated_by: DataTypes.INTEGER,
    tags: DataTypes.TEXT(),
  }, {
    tableName: 'sycu_tutorial',
    timestamps: false,
    underscored: true,
  });
  sycu_tutorial.associate = function (models: any) {
    sycu_tutorial.belongsTo(models.sites, {
      foreignKey: 'site_id',
      targetKey: 'site_id'
    });
  };
  return sycu_tutorial;
}