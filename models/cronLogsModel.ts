'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var cron_logs: any = sequelize.define('sycu_cron_logs', {
        cron_log_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        args: DataTypes.STRING(),
        date: DataTypes.DATE()
    }, {
        tableName: 'sycu_cron_logs',
        timestamps: false,
        underscored: true,
    });
    return cron_logs;
}