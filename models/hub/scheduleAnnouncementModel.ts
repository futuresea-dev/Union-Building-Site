'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var hub_schedule_announcement: any = sequelize.define('gh_schedule_announcement', {
        schedule_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        announcement_id: DataTypes.INTEGER,
        is_scheduled_sent: DataTypes.INTEGER,
        is_in_process: DataTypes.INTEGER,
        schedule_date_time: DataTypes.DATE(),
        process_start_date: DataTypes.DATE(),
        process_finish_date: DataTypes.DATE(),
        is_deleted: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
    }, {
        tableName: 'gh_schedule_announcement',
        timestamps: false,
        underscored: true,
    });
    hub_schedule_announcement.associate = function (models: any) {
        
    };
    return hub_schedule_announcement;
}