"use strict";
module.exports = function (sequelize: any, DataTypes: any) {
  var sycu_sms_design_template: any = sequelize.define("sycu_sms_design_template",
    {
      sms_design_template_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      sms_content: DataTypes.TEXT(),
      title: DataTypes.STRING(50),
      is_status: DataTypes.INTEGER,
      site_id: DataTypes.INTEGER,
      created_datetime: DataTypes.DATE,
      updated_datetime: DataTypes.DATE,
      created_by: DataTypes.INTEGER,
      updated_by: DataTypes.INTEGER,
    }, {
    tableName: "sycu_sms_design_template",
    timestamps: false,
    underscored: true,
  });
  sycu_sms_design_template.associate = function (models: any) {
  };
  return sycu_sms_design_template;
};
