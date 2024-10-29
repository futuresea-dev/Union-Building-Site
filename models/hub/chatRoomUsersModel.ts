'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var hub_chat_room_users: any = sequelize.define('gh_chat_room_users', {
        chat_room_user_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        chat_room_id: DataTypes.INTEGER,
        connected_user_id: DataTypes.INTEGER,
        is_left: DataTypes.INTEGER,
        created_date: DataTypes.DATE(),
    }, {
        tableName: 'gh_chat_room_users',
        timestamps: false,
        underscored: true,
    });
    hub_chat_room_users.associate = function (models: any) {
        hub_chat_room_users.belongsTo(models.users, {
            foreignKey: 'connected_user_id',
            sourceKey: 'user_id'
        });
    };
    return hub_chat_room_users;
}