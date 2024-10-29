'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var application_ads: any = sequelize.define('application_ads', {
        application_ads_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        application_title: DataTypes.STRING(200),
        application_sub_title: DataTypes.TEXT(),
        application_card_title: DataTypes.STRING(200),
        application_card_sub_title: DataTypes.TEXT(),
        application_card_description: DataTypes.STRING(),
        application_image: DataTypes.TEXT(),
        application_model_image: DataTypes.TEXT(),
        application_primary_color: DataTypes.STRING(200),
        application_secondary_color: DataTypes.STRING(200),
        application_preview_link: DataTypes.TEXT(),
        application_download_link: DataTypes.TEXT(),
        application_status: DataTypes.INTEGER,
        ministry_type: DataTypes.INTEGER,
        sort_order: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        created_by: DataTypes.INTEGER,
        created_datetime: DataTypes.STRING(255),
        updated_datetime: DataTypes.STRING(255),
    }, {
        tableName: 'free_trial_application_ads',
        timestamps: false,
        underscored: true,
    });
    application_ads.associate = function (models: any) {
        application_ads.hasMany(models.feedBack, {
            foreignKey: 'type_id',
            targetKey: 'application_ads_id'
        });
    };
    return application_ads;
}
