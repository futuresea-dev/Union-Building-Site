/*
    * Code done by Sheetal 24-11-2021
    * create model for sycu_site_payment_gateway
*/
'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var sycu_site_payment_services: any = sequelize.define('sycu_site_payment_services', {
        site_payment_service_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        site_id: DataTypes.INTEGER,
        payment_service_id: DataTypes.INTEGER,
        auth_json: DataTypes.TEXT(),
        is_deleted: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE()
    }, {
        tableName: 'sycu_site_payment_services',
        timestamps: false,
        underscored: true,
    });
    sycu_site_payment_services.associate = function (models: any) {
        sycu_site_payment_services.belongsTo(models.sites, {
            foreignKey: 'site_id',
            targetKey: 'site_id'
        });
        sycu_site_payment_services.belongsTo(models.masterPaymentServices, {
            foreignKey: 'payment_service_id',
            targetKey: 'payment_service_id'
        });
    };
    return sycu_site_payment_services;
};