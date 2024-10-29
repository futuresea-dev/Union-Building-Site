module.exports = function (sequelize: any, DataTypes: any) {
    var user_subscription: any = sequelize.define('user_subscription', {
        user_subscription_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        subscription_number: DataTypes.INTEGER,
        user_id: DataTypes.INTEGER,
        subscription_status: DataTypes.TINYINT(1),
        subscription_note: DataTypes.STRING(255),
        coupon_code: DataTypes.STRING(255),
        total_amount: DataTypes.DOUBLE,
        site_id: DataTypes.INTEGER,
        start_date: DataTypes.DATE(),
        end_date: DataTypes.DATE(),
        next_payment_date: DataTypes.DATE(),
        trial_end_date: DataTypes.DATE(),
        last_order_date: DataTypes.DATE(),
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
        pg_customer_id: DataTypes.STRING(256),
        pg_card_id: DataTypes.STRING(256),
        pg_transaction_type: DataTypes.INTEGER
    }, {
        tableName: 'sycu_user_subscriptions',
        timestamps: false,
        underscored: true,
    });
    user_subscription.associate = function (models: any) {
        user_subscription.belongsTo(models.users, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        user_subscription.belongsTo(models.userOrder, {
            foreignKey: 'user_subscription_id',
            targetKey: 'user_subscription_id'
        });
        user_subscription.belongsTo(models.userAddress, {
            as: 'billingAddressOne',
            foreignKey: 'user_subscription_id',
            targetKey: 'user_subscription_id'
        });
        user_subscription.hasMany(models.userAddress, {
            foreignKey: 'user_subscription_id',
            targetKey: 'user_subscription_id'
        });
        user_subscription.hasMany(models.userSubscriptionItems, {
            foreignKey: 'user_subscription_id',
            targetKey: 'user_subscription_id'
        });
        user_subscription.hasMany(models.userMemberships, {
            foreignKey: 'user_subscription_id',
            targetKey: 'user_subscription_id'
        });
        user_subscription.hasMany(models.userMemberships, {
            as: 'user_memberships',
            foreignKey: 'user_id',
            targetKey: 'user_id',
            sourceKey: 'user_id'
        });
    };
    return user_subscription;
};