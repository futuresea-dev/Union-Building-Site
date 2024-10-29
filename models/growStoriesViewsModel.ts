'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var grow_stories_views: any = sequelize.define('grow_stories_views', {
        story_view_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        user_id: DataTypes.INTEGER,
        story_id: DataTypes.INTEGER,
        created_datetime: DataTypes.STRING(255),
    }, {
        tableName: 'free_trial_grow_stories_views',
        timestamps: false,
        underscored: true,
    });
    grow_stories_views.associate = function (models: any) {
    };
    return grow_stories_views;
}