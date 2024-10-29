'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var sycu_sms_services: any = sequelize.define('sycu_sms_services', {
        sms_service_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        server_type: DataTypes.STRING(50),
        credential_setup: DataTypes.TEXT(),
        format: DataTypes.TEXT(),
        updated_datetime: DataTypes.STRING(255)
    }, {
        tableName: 'sycu_sms_services',
        timestamps: false,
        underscored: true,
    });
    sycu_sms_services.associate = function (models: any) {
    };
    return sycu_sms_services;
};
