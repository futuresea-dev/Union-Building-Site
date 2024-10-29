'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var sycu_checkout_logs: any = sequelize.define('sycu_checkout_logs', {
        checkout_log_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        user_id: DataTypes.INTEGER,
        subscription_id: DataTypes.INTEGER,
        request: DataTypes.TEXT(),
        cart_data: DataTypes.TEXT(),
        response: DataTypes.TEXT(),
        api_status: DataTypes.TEXT(),
        is_instant_payment: DataTypes.INTEGER,
        error_message: DataTypes.TEXT(),
        created_datetime: DataTypes.DATE(),
    }, {
        tableName: 'sycu_checkout_logs',
        timestamps: false,
        underscored: true,
    });
    return sycu_checkout_logs;
};