'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var payment_check: any = sequelize.define('sycu_payment_check', {
        payment_check_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        user_id: DataTypes.INTEGER,
        site_id: DataTypes.INTEGER,
        check_number: DataTypes.DOUBLE,
        account_holder_name: DataTypes.STRING(),
        user_subscription_id: DataTypes.INTEGER,
        order_id: DataTypes.INTEGER,
        amount: DataTypes.DOUBLE,
        is_payment_confirmed: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
    }, {
        tableName: 'sycu_payment_check',
        timestamps: false,
        underscored: true,
    });
    payment_check.associate = function (models: any) {
        payment_check.belongsTo(models.userSubscription, {
            foreignKey: 'user_subscription_id',
            targetKey: 'user_subscription_id'
        });
        payment_check.belongsTo(models.transactionMaster, {
            foreignKey: 'payment_check_id',
            targetKey: 'stripe_card_id'
        });
    };
    return payment_check;
};