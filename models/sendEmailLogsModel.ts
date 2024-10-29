"use strict";
module.exports = function (sequelize: any, DataTypes: any) {
  var sendEmailLogs: any = sequelize.define(
    "sendEmailLogs",
    {
      send_email_log_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      site_id: DataTypes.INTEGER,
      email_design_template_id: DataTypes.INTEGER,
      user_id: DataTypes.INTEGER,
      status: DataTypes.INTEGER,
      subject_mail: DataTypes.STRING(50),
      receiver: DataTypes.STRING(50),
      html_link: DataTypes.STRING(50),
      response_data: DataTypes.JSON,
      created_datetime: DataTypes.DATE,
      type: DataTypes.INTEGER,
      global_id: DataTypes.INTEGER,
      site_email_service_id: DataTypes.INTEGER,
      sender: DataTypes.STRING(50),
      parent_id :  DataTypes.INTEGER
    },
    {
      tableName: "sycu_send_email_logs",
      timestamps: false,
      underscored: true,
    }
  );
  sendEmailLogs.associate = function (models: any) {
    sendEmailLogs.belongsTo(models.sites, {
      foreignKey: 'site_id',
      targetKey: 'site_id'
    });
    sendEmailLogs.belongsTo(models.users, {
      foreignKey: 'user_id',
      targetKey: 'user_id'
    });
  };
  return sendEmailLogs;
};