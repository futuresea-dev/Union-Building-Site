'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var hub_chat_messages_replies: any = sequelize.define('gh_chat_message_replies', {
        reply_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        message_id: DataTypes.INTEGER,
        reply_text: DataTypes.TEXT(),
        reply_by: DataTypes.INTEGER,
        attachments: DataTypes.TEXT(),
        is_deleted: DataTypes.INTEGER,
        created_date: DataTypes.DATE(),
        updated_date: DataTypes.DATE(),
    }, {
        tableName: 'gh_chat_message_replies',
        timestamps: false,
        underscored: true,
    });
    hub_chat_messages_replies.associate = function (models: any) {
        hub_chat_messages_replies.hasOne(models.hubReactions, {
            foreignKey: 'parent_id',
            sourceKey: 'reply_id'
        });
        hub_chat_messages_replies.hasMany(models.hubAttachments, {
            foreignKey: 'parent_id',
            sourceKey: 'reply_id'
        });
    };
    return hub_chat_messages_replies;
}