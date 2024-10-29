'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var sycu_site_sms_services: any = sequelize.define('sycu_site_sms_services', {
        site_sms_service_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        sms_service_id: DataTypes.INTEGER,
        service_type: DataTypes.TEXT(),
        service_type_credentials: DataTypes.TEXT(),
        is_default: DataTypes.INTEGER,
        site_id: DataTypes.INTEGER,
        updated_datetime: DataTypes.STRING(255),
        is_deleted: DataTypes.INTEGER,
    }, {
        tableName: 'sycu_site_sms_services',
        timestamps: false,
        underscored: true,
    });
    sycu_site_sms_services.associate = function (models: any) {
        sycu_site_sms_services.belongsTo(models.sites, {
            foreignKey: 'site_id',
            targetKey: 'site_id'
        });
    };
    return sycu_site_sms_services;
};
