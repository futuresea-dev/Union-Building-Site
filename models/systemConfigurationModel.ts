'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var systemConfiguration: any = sequelize.define('systemConfiguration', {
        system_configuration_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        android_app_version: DataTypes.INTEGER,
        android_force_update: DataTypes.TINYINT(1),
        roku_app_version: DataTypes.INTEGER,
        roku_force_update: DataTypes.TINYINT(1),
        ios_app_version: DataTypes.INTEGER,
        ios_force_update:DataTypes.TINYINT(1),
        site_id: DataTypes.TINYINT(1),
        privacy_policy: DataTypes.TEXT(),
        return_policy: DataTypes.TEXT(),
        payment_policy: DataTypes.TEXT(),
        terms_and_conditions: DataTypes.TEXT(),
        about_us: DataTypes.TEXT(),
        is_deleted:DataTypes.TINYINT(1),
        apple_tv_app_version: DataTypes.TEXT(),
        apple_tv_force_update: DataTypes.TINYINT(1),
        amazon_fire_stick_app_version: DataTypes.TEXT(),
        amazon_fire_stick_force_update: DataTypes.TINYINT(1),
        share_dashboard_limit: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
        delete_log_pass:DataTypes.STRING()
    },
     {
        tableName: 'sycu_system_configuration',
        timestamps: false,
        underscored: true,
    });
    
    systemConfiguration.associate = function (models: any) {
        
 };
    return systemConfiguration;
};
