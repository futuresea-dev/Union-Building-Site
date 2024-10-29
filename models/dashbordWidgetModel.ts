'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var dashbord_widget: any = sequelize.define('dashbord_widget', {
        dashbord_widget_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        image_url: DataTypes.TEXT(),
        image_type: DataTypes.INTEGER,
        title: DataTypes.STRING(50),
        btn_title: DataTypes.STRING(50),
        btn_link: DataTypes.TEXT(),
        btn_color: DataTypes.STRING(50),
        btn_icon_link: DataTypes.TEXT(),
        background_color: DataTypes.STRING(50),
        background_texture_image: DataTypes.TEXT(),
        is_deleted: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
        btn_text_color: DataTypes.STRING(50),
        btn_image: DataTypes.TEXT(),
        background_top_texture_image: DataTypes.TEXT(),
        background_bottom_texture_image: DataTypes.TEXT(),
    }, {
        tableName: 'dashbord_widget',
        timestamps: false,
        underscored: true,
    });
    return dashbord_widget;
}