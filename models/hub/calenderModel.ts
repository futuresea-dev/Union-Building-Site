'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var hub_calender: any = sequelize.define('gh_calendar', {
        calendar_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        user_id: DataTypes.INTEGER,
        hub_id: DataTypes.INTEGER,
        category_id: DataTypes.INTEGER,
        calendar_title: DataTypes.TEXT(),
        calendar_content: DataTypes.TEXT(),
        event_start_date: DataTypes.DATE,
        event_end_date: DataTypes.DATE,
        event_time_select: DataTypes.INTEGER,
        event_start_time: DataTypes.TIME,
        event_end_time: DataTypes.TIME,
        event_repeat_select: DataTypes.INTEGER,
        repeat_type: DataTypes.INTEGER,
        recurring_end_date: DataTypes.DATE(),
        recurring_master_uuid: DataTypes.STRING(256),
        connected_calendar_uuid: DataTypes.STRING(256),
        parent_calendar_id: DataTypes.INTEGER,
        notification_allow: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        is_system: DataTypes.INTEGER,
        updated_user_id: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
        sort_order: DataTypes.INTEGER
    }, {
        tableName: 'gh_calendar',
        timestamps: false,
        underscored: true,
    });

    hub_calender.associate = function (models: any) {
        hub_calender.hasMany(models.hubAttachments, {
            foreignKey: 'parent_id',
            sourceKey: 'calendar_id'
        });
        hub_calender.belongsTo(models.categories, {
            foreignKey: 'category_id',
            sourceKey: 'category_id'
        });
        hub_calender.belongsTo(models.users, {
            foreignKey: 'user_id',
            sourceKey: 'user_id'
        });
    };
    return hub_calender;
}