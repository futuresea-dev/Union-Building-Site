'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var subscriptionRenewal: any = sequelize.define('sycu_subscription_renewal', {
        subscription_renewal_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        user_id: DataTypes.INTEGER,
        site_id: DataTypes.INTEGER,
        user_subscription_id: DataTypes.INTEGER,
        user_orders_id: DataTypes.INTEGER,
        end_date: DataTypes.DATE(),
        attempt_count: DataTypes.INTEGER,
        renewal_date: DataTypes.DATE(),
        is_executed: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        is_update: DataTypes.INTEGER,
        is_instant_payment: DataTypes.INTEGER,
        note: DataTypes.TEXT,
        updated_datetime: DataTypes.DATE(),
    }, {
        tableName: 'sycu_subscription_renewal',
        timestamps: false,
        underscored: true,
    });
    subscriptionRenewal.associate = function (models: any) {
        subscriptionRenewal.hasMany(models.users, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        subscriptionRenewal.hasMany(models.userSubscription, {
            foreignKey: 'user_subscription_id',
            targetKey: 'user_subscription_id'
        });
        subscriptionRenewal.belongsTo(models.userSubscription, {
            as: "renewalSubscription",
            foreignKey: 'user_subscription_id',
            targetKey: 'user_subscription_id'
        });
        subscriptionRenewal.belongsTo(models.userSubscription, {
            foreignKey: 'user_subscription_id',
            targetKey: 'user_subscription_id'
        });
        subscriptionRenewal.belongsTo(models.userOrder, {
            as: "renewalOrder",
            foreignKey: 'user_orders_id',
            targetKey: 'user_orders_id'
        });
        subscriptionRenewal.belongsTo(models.users, {
            as: "renewalUser",
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });

    };
    return subscriptionRenewal;
};
