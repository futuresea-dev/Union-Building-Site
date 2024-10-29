'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var sycu_disputed_transaction: any = sequelize.define('sycu_disputed_transaction', {
        disputed_transaction_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        charge_id: DataTypes.STRING(256),
        dispute_id: DataTypes.STRING(256),
        disputed_date: DataTypes.DATE(),
        transaction_id: DataTypes.INTEGER,
        user_subscription_id: DataTypes.INTEGER,
        user_orders_id: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
        status: DataTypes.STRING(50),
        reason: DataTypes.TEXT(),
        is_deleted: DataTypes.INTEGER,
        evidence_submited: DataTypes.INTEGER,
    }, {
        tableName: 'sycu_disputed_transaction',
        timestamps: false,
        underscored: true,
    });
    sycu_disputed_transaction.associate = function (models: any) {
        sycu_disputed_transaction.belongsTo(models.transactionMaster, {
            foreignKey: 'transaction_id',
            targetKey: 'transaction_id'
        });
        sycu_disputed_transaction.belongsTo(models.transactionMaster, {
            foreignKey: 'charge_id',
            targetKey: 'charge_id'
        });
        sycu_disputed_transaction.belongsTo(models.userSubscription, {
            foreignKey: 'user_subscription_id',
            targetKey: 'user_subscription_id'
        });
        sycu_disputed_transaction.belongsTo(models.userOrder, {
            foreignKey: 'user_orders_id',
            targetKey: 'user_orders_id'
        });
    };
    return sycu_disputed_transaction;
};
