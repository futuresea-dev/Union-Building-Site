'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
  var frontend_exception_logs: any = sequelize.define(
    "frontend_exception_logs",
    {
      exception_log_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      user_id: DataTypes.INTEGER,
      api_name: DataTypes.TEXT(),
      function_name: DataTypes.TEXT(),
      error_message: DataTypes.TEXT(),
      error_object: DataTypes.TEXT(),
      site_id: DataTypes.INTEGER,
      created_datetime: DataTypes.DATE(),
    },
    {
      tableName: "frontend_exception_logs",
      timestamps: false,
      underscored: true,
    }
  );

  return frontend_exception_logs;
};
