'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var hub_chat_messages_read: any = sequelize.define('gh_chat_messages_read', {
        read_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        message_id: DataTypes.INTEGER,
        received_by: DataTypes.INTEGER,
        is_read: DataTypes.INTEGER,
        is_notification_sent: DataTypes.INTEGER,
        created_date: DataTypes.DATE(),
        updated_date: DataTypes.DATE(),
    }, {
        tableName: 'gh_chat_messages_read',
        timestamps: false,
        underscored: true,
    });
    hub_chat_messages_read.associate = function (models: any) {
        
    };
    return hub_chat_messages_read;
}