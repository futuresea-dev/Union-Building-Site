'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var sycu_address_users: any = sequelize.define('sycu_user_address', {
        user_address_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        parent_user_address_id: DataTypes.INTEGER,
        email_address: DataTypes.INTEGER,
        phone_number: DataTypes.INTEGER,
        user_id: DataTypes.INTEGER,
        user_orders_id: DataTypes.INTEGER,
        user_subscription_id: DataTypes.INTEGER,
        address_type: DataTypes.INTEGER,
        is_shipping_same: DataTypes.INTEGER,
        first_name: DataTypes.STRING(20),
        last_name: DataTypes.STRING(20),
        address_line1: DataTypes.STRING(20),
        address_line2: DataTypes.STRING(20),
        city: DataTypes.STRING(20),
        state_id: DataTypes.INTEGER,
        country_id: DataTypes.INTEGER,
        zipcode: DataTypes.STRING(15),
        latitude: DataTypes.DOUBLE,
        longitude: DataTypes.DOUBLE,
        company: DataTypes.STRING(256),
        created_datetime: DataTypes.DATE,
        updated_datetime: DataTypes.DATE,
        is_deleted: DataTypes.INTEGER,
        customer_shipping_note: DataTypes.TEXT,
        transaction_id: DataTypes.INTEGER,
        // uuid: DataTypes.STRING(255),
    }, {
        tableName: 'sycu_user_address',
        timestamps: false,
        underscored: true,
    });
    sycu_address_users.associate = function (models: any) {
        sycu_address_users.belongsTo(models.stateModel, {
            foreignKey: 'state_id',
            targetKey: 'state_id'
        });
        sycu_address_users.belongsTo(models.countryModel, {
            foreignKey: 'country_id',
            targetKey: 'country_id'
        });
    }
    return sycu_address_users;
};