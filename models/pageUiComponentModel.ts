'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var pageUiComponent: any = sequelize.define('pageUiComponent', {
        component_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        component_name: DataTypes.TEXT(),
        component_json_value: DataTypes.TEXT(),
        component_preview_link: DataTypes.TEXT(),
        component_type: DataTypes.INTEGER,
        is_active: DataTypes.INTEGER,
    }, {
        tableName: 'gc_page_ui_component',
        timestamps: false,
        underscored: true,
    });
    return pageUiComponent;
}