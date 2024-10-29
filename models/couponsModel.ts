'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var sycuCoupons: any = sequelize.define('sycu_coupons', {
        coupon_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        site_id: DataTypes.INTEGER,
        coupon_code: DataTypes.STRING(255),
        coupon_description: DataTypes.TEXT(),
        rate_type: DataTypes.INTEGER,
        rate: DataTypes.DOUBLE,
        coupon_expire_date_time: DataTypes.STRING(50),
        max_limit: DataTypes.INTEGER,
        user_used_limit: DataTypes.INTEGER,
        min_cart_amount: DataTypes.DOUBLE,
        is_deleted: DataTypes.INTEGER,
        updated_date: DataTypes.DATE(),
        updated_by: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        created_by: DataTypes.INTEGER,
    }, {
        tableName: 'sycu_coupons',
        timestamps: false,
        underscored: true,
    });
    sycuCoupons.associate = function (models: any) {
        sycuCoupons.hasMany(models.couponsProduct, {
            foreignKey: 'coupon_id',
            targetKey: 'coupon_id'
        });
        sycuCoupons.belongsTo(models.couponsProduct, {
            as: 'customAlias',
            foreignKey: 'coupon_id',
            targetKey: 'coupon_id'
        });
        sycuCoupons.belongsTo(models.sycuUserCoupon, {
            foreignKey: 'coupon_id',
            sourceKey: 'coupon_id'
        });
        sycuCoupons.hasMany(models.sycuUserCoupon, {
            foreignKey: 'coupon_id',
            sourceKey: 'coupon_id'
        });
        //Add by SA 28-06-2022
        sycuCoupons.hasMany(models.sycuUserCoupon, {
            as: 'TopCoupon',
            foreignKey: 'coupon_id',
            sourceKey: 'coupon_id'
        });
        sycuCoupons.hasMany(models.userSubscriptionItems, {
            foreignKey: 'product_id',
            sourceKey: 'coupon_id'
        });
        sycuCoupons.hasMany(models.userOrderItems, {
            foreignKey: 'product_id',
            sourceKey: 'coupon_id'
        });
        sycuCoupons.hasMany(models.refunds, {
            foreignKey: 'coupon_id',
            sourceKey: 'coupon_id'
        });
    };
    return sycuCoupons;
}
