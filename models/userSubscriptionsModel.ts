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
        pg_customer_id: DataTypes.STRING(256),
        pg_card_id: DataTypes.STRING(256),
        subscription_note: DataTypes.TEXT,
        pg_transaction_type: DataTypes.INTEGER,
        site_id: DataTypes.INTEGER,
        is_from: DataTypes.INTEGER,
        is_recurring_subscription: DataTypes.INTEGER,
        total_amount: DataTypes.DOUBLE,
        coupon_code: DataTypes.STRING(255),
        coupon_ids: DataTypes.STRING(255),
        start_date: DataTypes.DATE(),
        end_date: DataTypes.DATE(),
        next_payment_date: DataTypes.DATE(),
        trial_end_date: DataTypes.DATE(),
        last_order_date: DataTypes.DATE(),
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
        status_updated_date: DataTypes.DATE(),
        last_order_id: DataTypes.INTEGER,
        is_renewal: DataTypes.INTEGER,
        is_renewal_notice_send: DataTypes.INTEGER,
        is_circle_access: DataTypes.INTEGER,
        created_note_date: DataTypes.DATE(),
        feedback_note: DataTypes.TEXT(),
        feedback_option_data_id: DataTypes.INTEGER,
        fte_coupon_version: DataTypes.INTEGER,
        cancel_reason_type: DataTypes.INTEGER,
        is_bundle_subscription: DataTypes.INTEGER,
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
        user_subscription.belongsTo(models.userCard, {
            as: 'transaction_card',
            foreignKey: 'pg_card_id',
            targetKey: 'pg_customer_card_id'
        });
        user_subscription.belongsTo(models.userOrder, {
            as: 'user_order_check',
            foreignKey: 'user_subscription_id',
            targetKey: 'user_subscription_id'
        });
        user_subscription.hasMany(models.userAddress, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        user_subscription.hasMany(models.userAddress, {
            as: 'subscription_address',
            foreignKey: 'user_subscription_id',
            targetKey: 'user_subscription_id'
        });
        user_subscription.hasMany(models.userMemberships, {
            foreignKey: 'user_id',
            sourceKey: 'user_id'
        });
        user_subscription.hasMany(models.userMemberships, {
            as: 'user_memberships',
            foreignKey: 'user_id',
            targetKey: 'user_id',
            sourceKey: 'user_id'
        });
        user_subscription.belongsTo(models.stripeCustomer, {
            sourceKey: 'sycu_stripe_customer_id',
            foreignKey: 'pg_customer_id'
        });
        user_subscription.belongsTo(models.userCard, {
            sourceKey: 'stripe_card_id',
            foreignKey: 'pg_card_id'
        });
        user_subscription.hasMany(models.userOrder, {
            foreignKey: 'user_subscription_id',
            targetKey: 'user_subscription_id'
        });
        user_subscription.belongsTo(models.userAddress, {
            as: 'billingAddress',
            foreignKey: 'user_subscription_id',
            targetKey: 'user_subscription_id'
        });
        user_subscription.belongsTo(models.userAddress, {
            as: 'shippingAddress',
            foreignKey: 'user_subscription_id',
            targetKey: 'user_subscription_id'
        });
        user_subscription.hasMany(models.userSubscriptionItems, {
            foreignKey: 'user_subscription_id',
            sourceKey: 'user_subscription_id'
        });
        user_subscription.belongsTo(models.sites, {
            foreignKey: 'site_id',
            targetKey: 'site_id'
        });
        user_subscription.belongsTo(models.subscriptionRenewal, {
            foreignKey: 'user_subscription_id',
            targetKey: 'user_subscription_id'
        });
        user_subscription.belongsTo(models.paymentCheck, {
            targetKey: 'payment_check_id',
            foreignKey: 'pg_card_id'
        });
        user_subscription.hasMany(models.subscriptionRenewal, {
            as: 'sycu_subscription_renewals',
            foreignKey: 'user_subscription_id',
            targetKey: 'user_subscription_id'
        });
        user_subscription.belongsTo(models.disputedTransaction, {
            foreignKey: 'user_subscription_id',
            targetKey: 'user_subscription_id'
        });
        user_subscription.belongsTo(models.userSubscriptionItems, {
            as: "succes_subscription_items_check",
            foreignKey: 'user_subscription_id',
            targetKey: 'user_subscription_id'
        });
    };
    return user_subscription;
};
