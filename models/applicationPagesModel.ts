("use strict");
module.exports = function (sequelize: any, DataTypes: any) {
  var sycu_application_page: any = sequelize.define(
    "sycu_application_page",
    {
      application_page_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      application_page_title: DataTypes.TEXT(),
      icon: DataTypes.STRING(255),
      parent_application_page_id: DataTypes.INTEGER,
      site_id: DataTypes.INTEGER,
      menu_type: DataTypes.INTEGER,
      link: DataTypes.TEXT(),
      is_public: DataTypes.INTEGER,
      created_datetime: DataTypes.DATE(),
      updated_datetime: DataTypes.DATE(),
      is_deleted: DataTypes.INTEGER,
      is_active: DataTypes.INTEGER,
      is_tool: DataTypes.INTEGER,
      sort_order: DataTypes.INTEGER,
    },
    {
      tableName: "sycu_application_page",
      timestamps: false,
      underscored: true,
    }
  );
  sycu_application_page.associate = function (models: any) {
    // sycu_application_page.belongsTo(models.applicationMainMenu, {
    //   foreignKey: "menu_type",
    //   targetKey: "menu_type",
    // });
  };
  return sycu_application_page;
};
