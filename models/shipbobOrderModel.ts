'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var shipbob_shipment_methods: any = sequelize.define('shipbob_orders', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        shipbob_order_id: DataTypes.INTEGER,
        shipbob_shipment_id: DataTypes.INTEGER,
        user_subscription_id: DataTypes.INTEGER,
        user_order_id: DataTypes.INTEGER,
        subscription_number: DataTypes.INTEGER,
        order_number: DataTypes.INTEGER,
        reference_id: DataTypes.STRING(100),
        user_id: DataTypes.INTEGER,
        shipbob_products_name: DataTypes.STRING(50),
        thirdparty_log_id: DataTypes.INTEGER,
        status: DataTypes.TINYINT(1),
        delivery_status: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        tracking_number: DataTypes.INTEGER,
        address_line1: DataTypes.STRING(100),
        address_line2: DataTypes.STRING(100),
        city: DataTypes.STRING(100),
        state_name: DataTypes.STRING(100),
        country_name: DataTypes.STRING(100),
        zipcode: DataTypes.STRING(100),
        shipbob_status: DataTypes.TINYINT(1),
        confirm_datetime: DataTypes.DATE(),
        organization_name: DataTypes.STRING(100),
        token: DataTypes.STRING(300),
        is_from: DataTypes.TINYINT(1)
    }, {
        tableName: 'shipbob_orders',
        timestamps: false,
        underscored: true,
    });
    shipbob_shipment_methods.associate = function (models: any) {

        shipbob_shipment_methods.belongsTo(models.users, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });

    };
    return shipbob_shipment_methods;
};
