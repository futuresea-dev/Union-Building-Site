'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var hub_comments: any = sequelize.define('gh_comments', {
        comment_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        user_id: DataTypes.INTEGER,
        announcement_id: DataTypes.INTEGER,
        comment_content: DataTypes.TEXT(),
        updated_user_id: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
    }, {
        tableName: 'gh_comments',
        timestamps: false,
        underscored: true,
    });
    hub_comments.associate = function (models: any) {
        hub_comments.belongsTo(models.users, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        hub_comments.belongsTo(models.hubAnnouncements, {
            foreignKey: 'announcement_id',
            targetKey: 'announcement_id'
        });
        hub_comments.hasMany(models.hubAttachments, {
            as: 'comment_attachments',
            foreignKey: 'parent_id',
            targetKey: 'comment_id'
        });
        hub_comments.hasMany(models.hubReactions, {
            foreignKey: 'parent_id',
            targetKey: 'comment_id'
        });
    };
    return hub_comments;
}