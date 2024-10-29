'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var gs_slideshows_settings: any = sequelize.define('gs_slideshows_settings', {
        slideshow_setting_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        slideshow_id: DataTypes.INTEGER,
        user_id: DataTypes.INTEGER,
        presentation_size: DataTypes.STRING(50),
        show_slide_no:DataTypes.INTEGER,
        auto_slide:DataTypes.INTEGER,
        background_image: DataTypes.TEXT(),
        background_color: DataTypes.TEXT(),
        background_repeat: DataTypes.STRING(50),
        background_all: DataTypes.STRING(50),
        background_position: DataTypes.STRING(50),
        slideshow_repeat: DataTypes.INTEGER,
        slideshow_gridlines: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE()
    },
     {
        tableName: 'gs_slideshows_settings',
        timestamps: false,
        underscored: true,
    });

    gs_slideshows_settings.associate = function (models: any) {
        gs_slideshows_settings.belongsTo(models.slideShows, {
            foreignKey: 'slideshow_id',
           targetKey: 'slideshow_id'
        });

        gs_slideshows_settings.belongsTo(models.users, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
   };

    return gs_slideshows_settings;
};
