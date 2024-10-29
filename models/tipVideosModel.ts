'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var tip_videos: any = sequelize.define('tip_videos', {
        tip_video_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        category_id: DataTypes.INTEGER,
        ministry_type: DataTypes.INTEGER,
        video_title: DataTypes.STRING(256),
        video_url: DataTypes.TEXT(),
        video_cc: DataTypes.TEXT(),
        is_deleted: DataTypes.INTEGER,
        created_datetime: DataTypes.STRING(255),
        updated_datetime: DataTypes.STRING(255),
        created_by: DataTypes.INTEGER,
        updated_by: DataTypes.INTEGER,
    }, {
        tableName: 'gc_tip_videos',
        timestamps: false,
        underscored: true,
    });
    tip_videos.associate = function (models: any) {
        tip_videos.belongsTo(models.pageLink, {
            foreignKey: 'tip_video_id',
            targetKey: 'data_id'
        });
        tip_videos.hasMany(models.users, {
            as: 'created_user',
            sourceKey: 'created_by',
            foreignKey: 'user_id'
        });
        tip_videos.hasMany(models.users, {
            as: 'updated_user',
            sourceKey: 'updated_by',
            foreignKey: 'user_id'
        });
    };
    return tip_videos;
};
