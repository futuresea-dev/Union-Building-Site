//Sa-01-03-2022
//For export countdown video requests
"user strict"
module.exports = function (sequelize: any, DataTypes: any) {
    var gg_export_video_request: any = sequelize.define("gg_export_video_request", {
        request_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
            unique: true,
        },
        countdown_id: DataTypes.INTEGER,
        user_id: DataTypes.INTEGER,
        status: DataTypes.INTEGER,
        fail_reason: DataTypes.TEXT(),
        retry_attempts: DataTypes.INTEGER,
        server_process_id: DataTypes.INTEGER,
        log_url: DataTypes.TEXT(),
        ffmpeg_command: DataTypes.TEXT(),
        in_process_date: DataTypes.DATE(),
        finish_date: DataTypes.DATE(),
        failed_date: DataTypes.DATE(),
        cancel_request_date: DataTypes.DATE(),
        cancel_finish_date: DataTypes.DATE(),
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE()
    }, {
        tableName: "gg_export_video_request",
        timestamps: false,
        underscored: true
    });
    gg_export_video_request.associate = function (models: any) {
        gg_export_video_request.belongsTo(models.countdowns, {
            foreignKey: "countdown_id",
            targetKey: "countdown_id"
        });
        gg_export_video_request.belongsTo(models.users, {
            foreignKey: "user_id",
            targetKey: "user_id"
        })
    };
    return gg_export_video_request

}

