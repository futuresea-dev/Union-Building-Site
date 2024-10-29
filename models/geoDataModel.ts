'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var geo_data: any = sequelize.define('geo_data', {
        geo_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        email_address: DataTypes.INTEGER,
        user_id: DataTypes.INTEGER,
        user_orders_id: DataTypes.INTEGER,
        user_order_item_id: DataTypes.INTEGER,
        user_subscription_id: DataTypes.INTEGER,
        first_name: DataTypes.STRING(20),
        last_name: DataTypes.STRING(20),
        address: DataTypes.STRING(20),
        user_address_id: DataTypes.INTEGER,
        product_id: DataTypes.INTEGER,
        // city: DataTypes.STRING(20),
        zipcode: DataTypes.STRING(15),
        created_datetime: DataTypes.DATE,
        updated_datetime: DataTypes.DATE,
        is_deleted: DataTypes.INTEGER,
        latitude: DataTypes.INTEGER,
        longitude: DataTypes.INTEGER,
        geo_config_id: DataTypes.INTEGER,
        uuid: DataTypes.STRING(255)
    }, {
        tableName: 'geo_data',
        timestamps: false,
        underscored: true,
    });
    geo_data.associate = function (models: any) {
        geo_data.belongsTo(models.userAddress, {
            foreignKey: 'user_address_id',
            targetKey: 'user_address_id'
        });
        geo_data.belongsTo(models.geoConfig, {
            foreignKey: 'geo_config_id',
            targetKey: 'geo_config_id'
        });
        geo_data.belongsTo(models.userSubscription, {
            foreignKey: 'user_subscription_id',
            targetKey: 'user_subscription_id'
        });
    }
    return geo_data;
};
