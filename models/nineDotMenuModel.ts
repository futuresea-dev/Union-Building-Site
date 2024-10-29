'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var nine_dot_menu: any = sequelize.define('sycu_nine_dot_menu', {
        nine_dot_menu_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        title: DataTypes.STRING(255),
        category: DataTypes.INTEGER,
        icon: DataTypes.STRING(255),
        menu_order: DataTypes.INTEGER,
        link: DataTypes.STRING(255),
        is_deleted: {type:DataTypes.TINYINT(1), defaultValue: 0},
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),       
    }, {
        tableName: 'sycu_nine_dot_menu',
        timestamps: false,
        underscored: true,
    });
    return nine_dot_menu;
}