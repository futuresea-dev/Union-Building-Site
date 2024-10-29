'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var transaction: any = sequelize.define('sycu_transaction_master', {
        transaction_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        user_id: DataTypes.INTEGER,
        site_id: DataTypes.INTEGER,
        transaction_type: DataTypes.INTEGER,
        type: DataTypes.STRING(),
        parent_id: DataTypes.INTEGER,
        request_json: DataTypes.STRING(),
        response_json: DataTypes.STRING(),
        status: DataTypes.STRING(),
        stripe_customer_id: DataTypes.INTEGER,
        amount: DataTypes.DOUBLE,
        stripe_card_id: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        charge_id: DataTypes.STRING(),
        txn_id: DataTypes.STRING(),
        processing_fee: DataTypes.FLOAT,
        payment_type: DataTypes.INTEGER,
        site_payment_service_id: DataTypes.INTEGER,
        transaction_details: DataTypes.STRING(),
    }, {
        tableName: 'sycu_transaction_master',
        timestamps: false,
        underscored: true,
    });
    transaction.associate = function (models: any) {
        transaction.belongsTo(models.users, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        transaction.belongsTo(models.userCard, {
            foreignKey: 'stripe_card_id',
            targetKey: 'pg_customer_card_id'
        });
        transaction.belongsTo(models.paymentCheck, {
            foreignKey: 'stripe_card_id',
            targetKey: 'payment_check_id'
        });
        // transaction.belongsTo(models.userSubscription, {
        //     foreignKey: 'user_subscription_id',
        //     targetKey: 'user_subscription_id'
        // });
        transaction.belongsTo(models.sites, {
            foreignKey: 'site_id',
            targetKey: 'site_id'
        });
        transaction.belongsTo(models.stripeCustomer, {
            foreignKey: 'stripe_customer_id',
            targetKey: 'sycu_stripe_customer_id'
        });

        transaction.belongsTo(models.userOrder, {
            foreignKey: 'parent_id',
            sourceKey: 'parent_id'
        });
        transaction.belongsTo(models.refunds, {
            foreignKey: 'transaction_id',
            targetKey: 'transaction_id'
        });
        transaction.belongsTo(models.userOrder, {
            as:"succes_subscription",
            foreignKey: 'parent_id',
            targetKey: 'user_orders_id'
        });
    };
    return transaction;
};