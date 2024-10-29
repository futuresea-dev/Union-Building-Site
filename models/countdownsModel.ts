//Sa 24-12-2021 


'use strict'

module.exports = function (sequelize: any, DataTypes: any) {
    var gg_countdowns: any = sequelize.define('gg_countdowns', {
        countdown_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        user_id: DataTypes.INTEGER,
        created_by: DataTypes.INTEGER,
        updated_by: DataTypes.INTEGER,
        is_default: DataTypes.INTEGER,
        bg_type: DataTypes.INTEGER,
        bg_value: DataTypes.TEXT(),
        name: DataTypes.TEXT(),
        extension: DataTypes.TEXT(),
        size: DataTypes.INTEGER,
        bg_width: DataTypes.INTEGER,
        bg_height: DataTypes.INTEGER,
        box_bg_color: DataTypes.TEXT(),
        box_angle: DataTypes.DOUBLE,
        box_scale: DataTypes.DOUBLE,
        box_width: DataTypes.DOUBLE,
        box_height: DataTypes.DOUBLE,
        box_coordinate_x: DataTypes.DOUBLE,
        box_coordinate_y: DataTypes.DOUBLE,
        box_title: DataTypes.TEXT(),
        box_title_color: DataTypes.TEXT(),
        box_font_style: DataTypes.TEXT(),
        is_landscape: DataTypes.INTEGER,
        is_rotate: DataTypes.INTEGER,
        countdown_minutes: DataTypes.INTEGER,
        minute_x: DataTypes.DOUBLE,
        minute_y: DataTypes.DOUBLE,
        second_x: DataTypes.DOUBLE,
        second_y: DataTypes.DOUBLE,
        flat_box_coordinate_x: DataTypes.FLOAT,
        flat_box_coordinate_y: DataTypes.FLOAT,
        resized_box_width: DataTypes.FLOAT,
        resized_box_height: DataTypes.FLOAT,
        time_text_size: DataTypes.INTEGER,
        time_text_color: DataTypes.TEXT(),
        exported_video_url: DataTypes.TEXT(),
        overlay_image_url: DataTypes.TEXT(),
        timer_seconds: DataTypes.INTEGER,
        export_status: DataTypes.INTEGER,
        ffmpeg_command: DataTypes.TEXT(),
        created_datetime: DataTypes.DATE,
        updated_datetime: DataTypes.DATE
    },
        {
            tableName: 'gg_countdowns',
            timestamps: false,
            underscored: true,
        });
    gg_countdowns.associate = function (models: any) {
        gg_countdowns.belongsTo(models.users, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        })
    }
    return gg_countdowns;
}
