'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var hub_announcements: any = sequelize.define('gh_announcements', {
        announcement_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        user_id: DataTypes.INTEGER,
        hub_id: DataTypes.INTEGER,
        category_id: DataTypes.INTEGER,
        announcement_title: DataTypes.TEXT(),
        announcement_content: DataTypes.TEXT(),
        schedule_date_time: DataTypes.DATE(),
        is_scheduled: DataTypes.INTEGER,
        is_announcement_pinned: DataTypes.INTEGER,
        pinned_datetime: DataTypes.DATE(),
        hide_comment: DataTypes.INTEGER,
        notification_allow: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        is_system: DataTypes.INTEGER,
        created_by: DataTypes.INTEGER,
        updated_user_id: DataTypes.INTEGER,
        connected_announcement_id: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
        sort_order: DataTypes.INTEGER,
    }, {
        tableName: 'gh_announcements',
        timestamps: false,
        underscored: true,
    });
    hub_announcements.associate = function (models: any) {
        hub_announcements.belongsTo(models.users, {
            foreignKey: 'user_id',
            sourceKey: 'user_id'
        });
        hub_announcements.belongsTo(models.categories, {
            foreignKey: 'category_id',
            sourceKey: 'category_id'
        });
        hub_announcements.belongsTo(models.hubs, {
            foreignKey: 'hub_id',
            sourceKey: 'hub_id'
        });
        hub_announcements.hasMany(models.hubAttachments, {
            foreignKey: 'parent_id',
            sourceKey: 'announcement_id'
        });
        hub_announcements.hasMany(models.hubComments, {
            foreignKey: 'announcement_id',
            sourceKey: 'announcement_id'
        });
        hub_announcements.hasMany(models.hubReactions, {
            foreignKey: 'parent_id',
            sourceKey: 'announcement_id'
        });
    };
    return hub_announcements;
}