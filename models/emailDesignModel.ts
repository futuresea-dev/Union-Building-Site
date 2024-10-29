"use strict";
module.exports = function (sequelize: any, DataTypes: any) {
  var sycu_email_design_template: any = sequelize.define(
    "sycu_email_design_template",
    {
      email_design_template_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      template_html_text: DataTypes.TEXT(),
      subject: DataTypes.TEXT(),
      title: DataTypes.STRING(50),
      reply_on_email_address: DataTypes.STRING(50),
      is_status: DataTypes.INTEGER,
      is_for: DataTypes.INTEGER,
      created_datetime: DataTypes.DATE,
      updated_datetime: DataTypes.DATE,
      created_by: DataTypes.INTEGER,
      updated_by: DataTypes.INTEGER,
    }, {
    tableName: "sycu_email_design_template",
    timestamps: false,
    underscored: true,
  });
  sycu_email_design_template.associate = function (models: any) {
    // sycu_users.belongsTo(models.company, {
    //     as: 'company',
    //     foreignKey: 'company_id',
    //     targetKey: 'company_id'
    // });
    // sycu_users.hasMany(models.inspector_expenses, {
    //     foreignKey: 'inspector_user_id',
    //     targetKey: 'user_id'
    // });
  };
  return sycu_email_design_template;
};
