'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var shipbob_products: any = sequelize.define('shipbob_channel', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        shipbob_channel_id: DataTypes.INTEGER,
        shipbob_channel_name: DataTypes.INTEGER,
        application_name: DataTypes.STRING(255),
        is_selected: DataTypes.STRING(50)
    }, {
        tableName: 'shipbob_channel',
        timestamps: false,
        underscored: true,
    });
    return shipbob_products;
};
