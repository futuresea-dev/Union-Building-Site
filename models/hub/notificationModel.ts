'use strict';
// AH 04-1-21
module.exports = function (sequelize: any, DataTypes: any) {
    var gh_notifications: any = sequelize.define('gh_notifications', {
        notification_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        notification_title: DataTypes.TEXT(),
        notification_type: DataTypes.TEXT(),
        parent_id: DataTypes.INTEGER,
        sender_id: DataTypes.INTEGER,
        super_parent_id: DataTypes.STRING(),
        is_sent: DataTypes.INTEGER,
        is_in_process: DataTypes.INTEGER,
        hub_id: DataTypes.INTEGER,
        process_start_date: DataTypes.DATE,
        process_finish_date: DataTypes.DATE,
        created_datetime: DataTypes.DATE,
        updated_datetime: DataTypes.DATE,
    }, {
        tableName: 'gh_notifications',
        timestamps: false,
        underscored: true,
    });
    gh_notifications.associate = function (models: any) {
        gh_notifications.hasMany(models.hubNotificationSent, {
            foreignKey: 'notification_id',
            targetKey: 'notification_id'
        });
        gh_notifications.belongsTo(models.hubs, {
            foreignKey: 'hub_id',
            targetKey: 'hub_id'
        });
    };
    return gh_notifications;
};
