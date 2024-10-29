/*
    * Code done by Sh - 24-11-2021
    * create model for sycu_sites
*/
'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var sycu_sites: any = sequelize.define('sycu_sites', {
        site_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        title: DataTypes.STRING(50),
        url: DataTypes.STRING(255),
        logo: DataTypes.STRING(255),
        small_logo: DataTypes.STRING(255),
        is_display: DataTypes.INTEGER,
        is_volume_required: DataTypes.INTEGER,
        is_product_required: DataTypes.INTEGER,
        description: DataTypes.TEXT(),
        color_code: DataTypes.STRING,
        created_datetime: DataTypes.STRING(255),
        is_series_required: DataTypes.INTEGER,
        is_debugger: DataTypes.INTEGER,
        api_url: DataTypes.TEXT()
    }, {
        tableName: 'sycu_sites',
        timestamps: false,
        underscored: true,
    });
    sycu_sites.associate = function (models: any) {
        sycu_sites.hasMany(models.sitePaymentServices, {
            foreignKey: 'site_id',
            targetKey: 'site_id'
        });
        sycu_sites.hasMany(models.transactionMaster, {
            foreignKey: 'site_id',
            targetKey: 'site_id'
        });
        sycu_sites.hasMany(models.sendEmailLog, {
            foreignKey: 'site_id',
            targetKey: 'site_id'
        });
        sycu_sites.hasMany(models.CirclePosts, {
            foreignKey: 'site_id',
            targetKey: 'site_id'
        });
        sycu_sites.hasMany(models.appVisitHistory, {
            foreignKey: 'site_id',
            targetKey: 'site_id'
        });
        sycu_sites.hasMany(models.tutorial, {
            foreignKey: 'site_id',
            targetKey: 'site_id'
        });
    };

    return sycu_sites;
};