module.exports = function (sequelize: any, DataTypes: any) {
    var user_orders: any = sequelize.define('user_orders', {
        user_orders_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        parent_user_order_id: DataTypes.INTEGER,
        user_subscription_id: DataTypes.INTEGER,
        user_order_date: DataTypes.DATE(),
        user_order_number: DataTypes.STRING(256),
        user_id: DataTypes.INTEGER,
        site_id: DataTypes.INTEGER,
        order_status: DataTypes.TINYINT(1),
        sub_amount: DataTypes.DOUBLE,
        coupon_amount: DataTypes.DOUBLE,
        shipping_amount: DataTypes.DOUBLE,
        fees_amount: DataTypes.DOUBLE,
        tax_amount: DataTypes.DOUBLE,
        total_amount: DataTypes.DOUBLE,
        ip_address: DataTypes.STRING(39),
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
        is_from: DataTypes.INTEGER,
        payment_type: DataTypes.INTEGER
    }, {
        tableName: 'sycu_user_orders',
        timestamps: false,
        underscored: true,
    });
    user_orders.associate = function (models: any) {
        user_orders.hasMany(models.userOrderItems, {
            foreignKey: 'user_orders_id',
            targetKey: 'user_orders_id'
        });

        user_orders.belongsTo(models.userSubscription, {
            foreignKey: 'user_subscription_id',
            targetKey: 'user_subscription_id'
        });

        user_orders.belongsTo(models.users, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        user_orders.hasMany(models.userMemberships, {
            foreignKey: 'user_orders_id',
            targetKey: 'user_orders_id'
        });

        user_orders.belongsTo(models.userAddress, {
            as: 'billingAddress',
            foreignKey: 'user_orders_id',
            targetKey: 'user_orders_id'
        });
        user_orders.belongsTo(models.userAddress, {
            as: 'shippingAddress',
            foreignKey: 'user_orders_id',
            targetKey: 'user_orders_id'
        });
        user_orders.hasMany(models.userOrderItems, {
            foreignKey: 'user_orders_id',
            targetKey: 'user_orders_id'
        });
        user_orders.hasMany(models.orderNotes, {
            foreignKey: 'event_type_id',
            targetKey: 'user_orders_id'
        });
        user_orders.belongsTo(models.transactionMaster, {
            targetKey: 'parent_id',
            foreignKey: 'user_orders_id'
        });
        user_orders.hasMany(models.userOrder, {
            as: 'relatedOrders',
            sourceKey: 'user_orders_id',
            foreignKey: 'parent_user_order_id'
        });
        user_orders.hasMany(models.userOrder, {
            as: 'ParentOrder',
            sourceKey: 'parent_user_order_id',
            foreignKey: 'user_orders_id'
        });
        user_orders.hasOne(models.transactionMaster, {
            // as:'',
            foreignKey: 'parent_id',
            sourceKey: 'user_orders_id'
        });
        user_orders.hasMany(models.refunds, {
            foreignKey: 'order_id',
            targetKey: 'user_orders_id'
        });
        user_orders.belongsTo(models.userOrderItems, {
            as: 'report_order',
            foreignKey: 'user_orders_id',
            targetKey: 'user_orders_id'
        });
        user_orders.belongsTo(models.sycuUserCoupon, {
            foreignKey: 'user_orders_id',
            targetKey: 'user_orders_id'
        });
        user_orders.hasMany(models.transactionMaster, {
            as: "transaction",
            foreignKey: 'parent_id',
            sourceKey: 'user_orders_id'
        });
        user_orders.belongsTo(models.disputedTransaction, {
            foreignKey: 'user_orders_id',
            targetKey: 'user_orders_id',
        });
	user_orders.belongsTo(models.userSubscription, {
            as: 'succes_subscription_check',
            foreignKey: 'user_subscription_id',
            targetKey: 'user_subscription_id'
        });
    };
    return user_orders;
};