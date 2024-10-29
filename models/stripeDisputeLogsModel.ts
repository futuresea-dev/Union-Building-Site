"use strict";
module.exports = function (sequelize: any, DataTypes: any) {
    var dispute_logs: any = sequelize.define('sycu_stripe_dispute_logs', {
        dispute_log_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        disputed_transaction_id: DataTypes.INTEGER,
        charge_id: DataTypes.TEXT(),
        charge: DataTypes.TEXT(),
        request_body: DataTypes.TEXT(),
        status: DataTypes.TEXT(),
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
    }, {
        tableName: 'sycu_stripe_dispute_logs',
        timestamps: false,
        underscored: true,
    });
    return dispute_logs;
};
