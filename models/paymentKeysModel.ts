'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var sycuPaymentKeys: any = sequelize.define('sycu_payment_keys', {
        sycu_payment_key_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        payment_public_key: DataTypes.TEXT(),
        payment_private_key: DataTypes.TEXT(),
        users_login_log_id: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
        is_used: DataTypes.INTEGER,
        user_id: DataTypes.INTEGER
    }, {
        tableName: 'sycu_payment_keys',
        timestamps: false,
        underscored: true,
    });
    return sycuPaymentKeys;
};
