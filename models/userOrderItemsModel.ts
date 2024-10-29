module.exports = function (sequelize: any, DataTypes: any) {
    var user_order_items: any = sequelize.define('user_order_items', {
        user_order_item_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        user_orders_id: DataTypes.INTEGER,
        item_type: DataTypes.INTEGER,
        product_name: DataTypes.STRING(256),
        product_id: DataTypes.INTEGER,
        updated_product_name: DataTypes.STRING(256),
        updated_product_id: DataTypes.INTEGER,
        product_amount: DataTypes.DOUBLE,
        coupon_amount: DataTypes.DOUBLE,
        shipping_fees: DataTypes.DOUBLE,
        processing_fees: DataTypes.DOUBLE,
        site_id: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
        is_update: DataTypes.INTEGER,
        renewal_count: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
    }, {
        tableName: 'sycu_user_order_items',
        timestamps: false,
        underscored: true,
    });
    user_order_items.associate = function (models: any) {
        user_order_items.belongsTo(models.userOrder, {
            foreignKey: 'user_orders_id',
            sourceKey: 'user_orders_id'
        });
        user_order_items.belongsTo(models.products, {
            foreignKey: 'product_id',
            targetKey: 'product_id'
        });
        user_order_items.hasMany(models.sycuUserCoupon, {
            foreignKey: 'user_orders_id',
            targetKey: 'user_orders_id'
        });
        user_order_items.belongsTo(models.products, {
            as: 'updated_product',
            foreignKey: 'updated_product_id',
            targetKey: 'product_id'
        });
    };
    return user_order_items;
};
