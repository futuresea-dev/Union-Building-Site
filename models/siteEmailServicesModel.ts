'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var sycu_site_email_services: any = sequelize.define('sycu_site_email_services', {
        site_email_service_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        email_service_id: DataTypes.STRING(50),
        service_type: DataTypes.TEXT(),
        service_type_credentials: DataTypes.TEXT(),
        is_default: DataTypes.INTEGER,
        site_id: DataTypes.INTEGER,
        updated_datetime: DataTypes.STRING(255),
        is_deleted: DataTypes.INTEGER
    }, {
        tableName: 'sycu_site_email_services',
        timestamps: false,
        underscored: true,
    });
    sycu_site_email_services.associate = function (models: any) {
        sycu_site_email_services.belongsTo(models.sites, {
            foreignKey: 'site_id',
            targetKey: 'site_id'
        });
    };
    return sycu_site_email_services;
};
