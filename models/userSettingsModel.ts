'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var userSettings: any = sequelize.define('sycu_user_settings', {
        user_setting_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        user_id: DataTypes.INTEGER,
        key: DataTypes.TEXT(),
        value: DataTypes.JSON()
    }, {
        tableName: 'sycu_user_settings',
        timestamps: false,
        underscored: true,
    });
    return userSettings;
}