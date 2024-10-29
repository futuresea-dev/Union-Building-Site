/*
    * Code done by Sh - 31-12-2021
    * create model for gg_notifications
*/
'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var gg_notifications: any = sequelize.define('gg_notifications', {
        notification_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        notification_title: DataTypes.STRING(255),
        notification_description: DataTypes.TEXT(),
        notification_type: DataTypes.INTEGER,
        notification_type_id: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
    }, {
        tableName: 'gg_notifications',
        timestamps: false,
        underscored: true,
    });
    gg_notifications.associate = function (models: any) {
        gg_notifications.hasMany(models.games, {
            foreignKey: 'game_id',
            sourceKey: 'notification_type_id'
        });
        gg_notifications.hasMany(models.sentNotifications, {
            foreignKey: 'notification_id',
            targetKey: 'notification_id'
        });
    };
    return gg_notifications;
};
