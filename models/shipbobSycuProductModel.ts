'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var shipbob_products: any = sequelize.define('shipbob_sycu_products', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        sycu_product_id: DataTypes.INTEGER,
        sycu_product_name: DataTypes.STRING(255),
        shipbob_product_id: DataTypes.INTEGER,
        shipbob_product_name: DataTypes.STRING(255),
        is_deleted: DataTypes.TINYINT(1),
    }, {
        tableName: 'shipbob_sycu_products',
        timestamps: false,
        underscored: true,
    });
    return shipbob_products;
};
