'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var gs_slides: any = sequelize.define('gs_slides', {
        slide_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        content: DataTypes.TEXT(),
        slideshow_id:DataTypes.INTEGER,
        user_id: DataTypes.INTEGER,
        parent_slide_id:DataTypes.INTEGER,
        published_slide_image_url:DataTypes.TEXT(),
        sort_order:DataTypes.INTEGER,
        slide_type: DataTypes.INTEGER, /** 1-Normal,2-VideoSlide */
        video_url: DataTypes.TEXT(),
        video_type:DataTypes.INTEGER, /** 1-youtube,2-vimeo,3-other */
        is_deleted: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE()
    },
     {
        tableName: 'gs_slides',
        timestamps: false,
        underscored: true,
    });

    gs_slides.associate = function (models: any) {
        gs_slides.belongsTo(models.users, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
    };

    return gs_slides;
};