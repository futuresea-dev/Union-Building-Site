'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var sycu_user_coupon: any = sequelize.define('sycu_user_coupon', {
        user_coupon_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        user_id: DataTypes.INTEGER,
        coupon_id: DataTypes.INTEGER,
        user_orders_id: DataTypes.INTEGER,
        created_datetime: DataTypes.STRING(255)

    }, {
        tableName: 'sycu_user_coupon',
        timestamps: false,
        underscored: true,
    });
    sycu_user_coupon.associate = function (models: any) {
        sycu_user_coupon.hasMany(models.coupons, {
            foreignKey: 'coupon_id',
            targetKey: 'coupon_id'
        });
        sycu_user_coupon.belongsTo(models.coupons, {
            foreignKey: 'coupon_id',
            targetKey: 'coupon_id'
        });
        sycu_user_coupon.belongsTo(models.userOrderItems, {
            foreignKey: 'user_orders_id',
            targetKey: 'user_orders_id'
        });
        sycu_user_coupon.belongsTo(models.userOrder, {
            foreignKey: 'user_orders_id',
            targetKey: 'user_orders_id'
        });
        //Add by SA 28-06-2022
        sycu_user_coupon.belongsTo(models.coupons, {
            as: 'TopCoupon',
            foreignKey: 'coupon_id',
            targetKey: 'coupon_id'
        });
    }
    return sycu_user_coupon;
}