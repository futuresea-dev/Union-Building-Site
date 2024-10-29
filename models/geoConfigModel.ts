'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var geo_config: any = sequelize.define('geo_config', {
        geo_config_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true
        },
        geo_pin_id: DataTypes.INTEGER,
        geo_pin_title: DataTypes.STRING,
        geo_pin_color: DataTypes.STRING,
        is_active: DataTypes.INTEGER,
        // site_id: DataTypes.INTEGER,
        updated_datetime: DataTypes.DATE,
        updated_by: DataTypes.INTEGER,
    },
        {
            tableName: 'geo_config',
            timestamps: false,
            underscored: true,
        });
    geo_config.associate = function (models: any) {
        geo_config.hasMany(models.geoData, {
            foreignKey: 'geo_config_id',
            targetKey: 'geo_config_id',
            sourceKey: 'geo_config_id'
        });
    }
    return geo_config;
}
