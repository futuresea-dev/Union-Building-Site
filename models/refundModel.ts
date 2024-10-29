module.exports = function (sequelize: any, DataTypes: any) {
    var refunds: any = sequelize.define('refunds', {
        refund_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        user_id: DataTypes.INTEGER,
        site_id: DataTypes.INTEGER,
        charge_id: DataTypes.INTEGER,
        order_id: DataTypes.INTEGER,
        transaction_id: DataTypes.INTEGER,
        stripe_refund_id: DataTypes.STRING(255),
        pg_customer_id: DataTypes.INTEGER,
        pg_card_id: DataTypes.INTEGER,
        status: DataTypes.TINYINT(1),
        refund_type: DataTypes.TINYINT(1),
        refund_amount: DataTypes.DOUBLE,
        refund_reason: DataTypes.STRING(255),
        scholarship_code: DataTypes.STRING(255),
        coupon_id: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE()
    }, {
        tableName: 'sycu_refunds',
        timestamps: false,
        underscored: true,
    });
    refunds.associate = function (models: any) {
        refunds.belongsTo(models.userOrder, {
            foreignKey: 'order_id',
            targetKey: 'user_orders_id'
        });
    };
    return refunds;
};
