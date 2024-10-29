'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var shipbob_products: any = sequelize.define('shipbob_products', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        shipbob_product_id: DataTypes.INTEGER,
        reference_id: DataTypes.STRING(255),
        title: DataTypes.STRING(255),
        shipbob_channel_id: DataTypes.INTEGER,
        created_date: DataTypes.STRING(50),
        is_deleted: DataTypes.TINYINT(1),
        is_active : DataTypes.TINYINT(1)
    }, {
        tableName: 'shipbob_products',
        timestamps: false,
        underscored: true,
    });
    return shipbob_products;
};
