'use strict';
// AH 04-1-21
module.exports = function (sequelize: any, DataTypes: any) {
    var gh_notificationsSent: any = sequelize.define('gh_notifications_sent', {
        notification_sent_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        notification_id: DataTypes.INTEGER,
        user_id: DataTypes.STRING(),
        is_read: DataTypes.INTEGER,
        is_sent: DataTypes.INTEGER,        
        created_datetime: DataTypes.DATE,
        updated_datetime: DataTypes.DATE,
    }, {
        tableName: 'gh_notifications_sent',
        timestamps: false,
        underscored: true,
    });
    gh_notificationsSent.associate = function (models: any) {
        gh_notificationsSent.belongsTo(models.hubNotification, {
            foreignKey: 'notification_id',
            targetKey: 'notification_id'
        });
        gh_notificationsSent.belongsTo(models.users, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
    };
    return gh_notificationsSent;
};
