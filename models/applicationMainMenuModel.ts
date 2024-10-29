"use strict";
module.exports = function (sequelize: any, DataTypes: any) {
  var sycu_application_main_menu: any = sequelize.define(
    "sycu_application_main_menu",
    {
      application_menu_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      application_menu_title: DataTypes.TEXT(),
      site_id: DataTypes.INTEGER,
      created_datetime: DataTypes.DATE(),
      updated_datetime: DataTypes.DATE(),
      is_deleted: DataTypes.INTEGER,
      is_active: DataTypes.INTEGER,
      sort_order: DataTypes.INTEGER,
    },
    {
      tableName: "sycu_application_main_menu",
      timestamps: false,
      underscored: true,
    }
  );
  sycu_application_main_menu.associate = function (models: any) {
    // sycu_application_main_menu.hasMany(models.applicationMainMenu, {
    //   foreignKey: "menu_type",
    //   targetKey: "menu_type",
    // });
    sycu_application_main_menu.belongsTo(models.sites, {
      foreignKey: "site_id",
      targetKey: "site_id",
    });
  };
  return sycu_application_main_menu;
};
