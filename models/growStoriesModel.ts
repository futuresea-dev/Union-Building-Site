'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var grow_stories: any = sequelize.define('grow_stories', {
        story_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        user_name: DataTypes.STRING(255),
        thumbnail_url: DataTypes.TEXT(),
        media_url: DataTypes.TEXT(),
        location: DataTypes.STRING(500),
        ministry_type: DataTypes.INTEGER,
        sort_order: DataTypes.INTEGER,
        status: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        created_by: DataTypes.INTEGER,
        created_datetime: DataTypes.STRING(255),
        updated_datetime: DataTypes.STRING(255),
    }, {
        tableName: 'free_trial_grow_stories',
        timestamps: false,
        underscored: true,
    });
    grow_stories.associate = function (models: any) {
        grow_stories.hasMany(models.growStoriesViews, {
            foreignKey: 'story_id',
            targetKey: 'story_id'
        });
    };
    return grow_stories;
}