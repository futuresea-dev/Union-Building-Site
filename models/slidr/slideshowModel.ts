'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var gs_slideshows: any = sequelize.define('gs_slideshows', {
        slideshow_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        feed_id: DataTypes.INTEGER,
        user_id: DataTypes.INTEGER,
        title: DataTypes.STRING(50),
        description: DataTypes.STRING(50),
        category_id: DataTypes.INTEGER,
        week_number: DataTypes.INTEGER,
        ministry_type: DataTypes.INTEGER,
        ministry_sub_type: DataTypes.INTEGER,
        parent_slideshow_id: DataTypes.INTEGER,
        is_system:DataTypes.INTEGER,
        is_published: DataTypes.INTEGER,
        is_active: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
        published_datetime: DataTypes.DATE(),
        published_url: DataTypes.STRING(1024),
        is_deleted: DataTypes.INTEGER,
        game_id: DataTypes.INTEGER,
    },{
            tableName: 'gs_slideshows',
            timestamps: false,
            underscored: true,
    });

    gs_slideshows.associate = function (models: any) {
        gs_slideshows.hasMany(models.slides, {
            foreignKey: 'slideshow_id',
           targetKey: 'slideshow_id'
        });
        gs_slideshows.belongsTo(models.slideshowSetting, {
            foreignKey: 'slideshow_id',
           targetKey: 'slideshow_id'
        });

        gs_slideshows.belongsTo(models.users, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
   };

    return gs_slideshows;
};
