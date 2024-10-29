'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var hub_chat_rooms: any = sequelize.define('gh_chat_rooms', {
        chat_room_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        created_user_id: DataTypes.INTEGER,
        is_group: DataTypes.INTEGER,
        chat_room_name: DataTypes.STRING(50),
        chat_room_logo: DataTypes.STRING(255),
        created_date: DataTypes.DATE(),
        is_deleted: DataTypes.INTEGER,
    }, {
        tableName: 'gh_chat_rooms',
        timestamps: false,
        underscored: true,
    });
    hub_chat_rooms.associate = function (models: any) {
        hub_chat_rooms.hasMany(models.hubChatRoomUsers, {
            foreignKey: 'chat_room_id',
            sourceKey: 'chat_room_id'
        });

        hub_chat_rooms.hasMany(models.hubChatMessages, {
            foreignKey: 'chat_room_id',
            sourceKey: 'chat_room_id'
        });

        // hub_chat_rooms.belongsToMany(models.users, { 
        //     through: 'User_Chats',
        //     foreignKey: "user_id",
        //     sourceKey: 'created_user_id'
        // });
    };
    return hub_chat_rooms;
}