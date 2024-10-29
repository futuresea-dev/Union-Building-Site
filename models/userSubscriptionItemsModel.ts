module.exports = function (sequelize: any, DataTypes: any) {
    var user_subscription_items: any = sequelize.define('user_subscription_items', {
        user_subscription_item_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        user_subscription_id: DataTypes.INTEGER,
        item_type: DataTypes.INTEGER,
        product_name: DataTypes.STRING(256),
        product_id: DataTypes.INTEGER,
        updated_product_name: DataTypes.STRING(256),
        updated_product_id: DataTypes.INTEGER,
        product_amount: DataTypes.DOUBLE,
        coupon_amount: DataTypes.DOUBLE,
        shipping_fees: DataTypes.DOUBLE,
        processing_fees: DataTypes.DOUBLE,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
        is_deleted: DataTypes.INTEGER
    }, {
        tableName: 'sycu_user_subscription_items',
        timestamps: false,
        underscored: true,
    });
    user_subscription_items.associate = function (models: any) {
        user_subscription_items.belongsTo(models.products, {
            foreignKey: 'product_id',
            targetKey: 'product_id'
        });
        user_subscription_items.belongsTo(models.shipbobSycuProductModel, {
            foreignKey: 'product_id',
            targetKey: 'sycu_product_id'
        });
        user_subscription_items.belongsTo(models.userSubscription, {
            foreignKey: 'user_subscription_id',
            targetKey: 'user_subscription_id'
        });
        user_subscription_items.belongsTo(models.products, {
            as: 'updated_sub_product',
            foreignKey: 'updated_product_id',
            targetKey: 'product_id'
        });
    };
    return user_subscription_items;
};
