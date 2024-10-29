/*
    * Code done by Sheetal 24-11-2021
    * create model for sycu_payment_services
*/
'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var sycu_payment_services: any = sequelize.define('sycu_payment_services', {
        payment_service_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        service_name: DataTypes.STRING(50),
        is_active: DataTypes.INTEGER,
    }, {
        tableName: 'sycu_payment_services',
        timestamps: false,
        underscored: true,
    });
    sycu_payment_services.associate = function (models: any) {
        sycu_payment_services.hasMany(models.sitePaymentServices, {
            foreignKey: 'payment_service_id',
            targetKey: 'payment_service_id'
        });
    };
    return sycu_payment_services;
};