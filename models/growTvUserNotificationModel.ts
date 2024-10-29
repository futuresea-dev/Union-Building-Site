module.exports = function (sequelize: any, DataTypes: any) {
    var grow_tv_user_notification: any = sequelize.define('grow_tv_user_notification', {
        tv_user_notification_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        user_id: DataTypes.INTEGER,
        grow_tv_video_id: DataTypes.INTEGER,
        is_read: DataTypes.BOOLEAN,
        is_deleted: DataTypes.BOOLEAN,
        created_datetime: DataTypes.DATE,
        read_datetime: DataTypes.DATE,
        deleted_datetime: DataTypes.DATE
    }, {
        tableName: "grow_tv_user_notification",
        timestamps: false,
        underscored: true,
    });
    return grow_tv_user_notification
}