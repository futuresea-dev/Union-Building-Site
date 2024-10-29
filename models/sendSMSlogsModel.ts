"use strict";
module.exports = function (sequelize: any, DataTypes: any) {
  var sendSMSLogs: any = sequelize.define(
    "sendSMSLogs",
    {
      send_sms_log_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      site_id: DataTypes.INTEGER,
      sms_design_template_id: DataTypes.INTEGER,
      user_id: DataTypes.INTEGER,
      status: DataTypes.INTEGER,
      content_text: DataTypes.TEXT(),
      receiver: DataTypes.STRING(20),
      response_data: DataTypes.TEXT(),
      created_datetime: DataTypes.DATE
    },
    {
      tableName: "sycu_send_sms_logs",
      timestamps: false,
      underscored: true,
    }
  );
  
  return sendSMSLogs;
};