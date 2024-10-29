/*
    * Code done by Sh - 31-12-2021
    * create model for gg_sent_notifications
*/
'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var gg_sent_notifications: any = sequelize.define('gg_sent_notifications', {
        notification_sent_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        notification_id: DataTypes.INTEGER,
        user_id: DataTypes.INTEGER,
        is_seen: DataTypes.INTEGER,
        is_sent: DataTypes.INTEGER,
        is_processed: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        seen_datetime: DataTypes.DATE(),
        sent_datetime: DataTypes.DATE(),
    }, {
        tableName: 'gg_sent_notifications',
        timestamps: false,
        underscored: true,
    });
    gg_sent_notifications.associate = function (models: any) {
        gg_sent_notifications.belongsTo(models.notifications, {
            foreignKey: 'notification_id',
            targetKey: 'notification_id'
        });
        gg_sent_notifications.belongsTo(models.users, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
    };
    return gg_sent_notifications;
};
