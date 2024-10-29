'use strict';
const coupons = require('./couponsModel');
module.exports = function (sequelize: any, DataTypes: any) {
    var sycuCouponsProduct: any = sequelize.define('sycu_coupons_product', {
        coupons_product_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        coupon_id: DataTypes.INTEGER,
        product_id: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        created_datetime: DataTypes.STRING(255),
        updated_datetime: DataTypes.STRING(255),
        created_by: DataTypes.INTEGER,
        updated_by: DataTypes.INTEGER,
    }, {
        tableName: 'sycu_coupons_product',
        timestamps: false,
        underscored: true,
    });
    sycuCouponsProduct.associate = function (models: any) {
        sycuCouponsProduct.belongsTo(models.products, {             
           foreignKey: 'product_id',
           targetKey: 'product_id'
        });       
    };
    return sycuCouponsProduct;
}