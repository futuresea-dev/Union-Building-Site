'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var subscriptionRenewalCronLog: any = sequelize.define('sycu_temp_subscription_renewal_log', {
        temp_subscription_renewal_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        subscription_renewal_id: DataTypes.INTEGER,
        user_subscription_id: DataTypes.INTEGER,
        is_executed: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        is_bug: DataTypes.INTEGER,
        is_instant_payment: DataTypes.INTEGER,
        error_logs: DataTypes.TEXT,
        uuid: DataTypes.TEXT,
        end_date: DataTypes.DATE(),
        renewal_date: DataTypes.DATE(),
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE()
    }, {
        tableName: 'sycu_temp_subscription_renewal_log',
        timestamps: false,
        underscored: true,
    });
    subscriptionRenewalCronLog.associate = function (models: any) {
    };
    return subscriptionRenewalCronLog;
};
