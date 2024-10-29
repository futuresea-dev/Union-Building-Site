'use strict';
const membership = require('./membershipsModel');
module.exports = function (sequelize: any, DataTypes: any) {
    var membershipsProduct: any = sequelize.define('sycu_membership_products', {
        membership_product_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        membership_id: DataTypes.INTEGER,
        product_id: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
        is_deleted: DataTypes.INTEGER,
    }, {
        tableName: 'sycu_membership_products',
        timestamps: false,
        underscored: true,
    });
    membershipsProduct.associate = function (models: any) {
        membershipsProduct.belongsTo(models.products, {
            foreignKey: 'product_id',
            targetKey: 'product_id'
        });
        membershipsProduct.belongsTo(models.membership, {
            foreignKey: 'membership_id',
            targetKey: 'membership_id'
        });
        membershipsProduct.hasMany(models.products, {
            as: 'membership_products',
            foreignKey: 'product_id',
            targetKey: 'product_id',
            sourceKey: 'product_id',
        });
        membershipsProduct.hasOne(models.membership, {
            foreignKey: 'membership_id',
            sourceKey: 'membership_id'
        });
    };
    return membershipsProduct;
};