'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var shipbob_shipment_methods: any = sequelize.define('shipbob_shipment_methods', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        title: DataTypes.STRING(255),
        is_active:DataTypes.TINYINT(1),
        is_default: DataTypes.TINYINT(1),
        service_level: DataTypes.TEXT,
        is_deleted: DataTypes.TINYINT(1),
    }, {
        tableName: 'shipbob_shipment_methods',
        timestamps: false,
        underscored: true,
    });
    return shipbob_shipment_methods;
};
