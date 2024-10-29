'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var hub_chat_messages: any = sequelize.define('gh_chat_messages', {
        message_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        chat_room_id: DataTypes.INTEGER,
        message_text: DataTypes.INTEGER,
        sent_by: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        created_date: DataTypes.DATE(),
        updated_date: DataTypes.DATE(),
    }, {
        tableName: 'gh_chat_messages',
        timestamps: false,
        underscored: true,
    });
    hub_chat_messages.associate = function (models: any) {
        hub_chat_messages.belongsTo(models.hubChatRooms, {
            foreignKey: 'chat_room_id',
            targetKey: 'chat_room_id'
        });
        hub_chat_messages.hasMany(models.hubChatMessagesReplies, {
            foreignKey: 'message_id',
            sourceKey: 'message_id'
        });
        hub_chat_messages.hasMany(models.hubAttachments, {
            foreignKey: 'parent_id',
            sourceKey: 'message_id'
        });
        hub_chat_messages.hasMany(models.hubReactions, {
            foreignKey: 'parent_id',
            sourceKey: 'message_id'
        });
    };
    return hub_chat_messages;
}