'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var permissions: any = sequelize.define('sycu_permissions', {
        permission_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        uuid: DataTypes.STRING(255),
        uuid_2: DataTypes.STRING(255),
        parent_permission_id: DataTypes.INTEGER,
        permission_profile_id: DataTypes.INTEGER,
        menu_name: DataTypes.STRING(256),
        json_value: DataTypes.TEXT(),
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
        is_deleted: DataTypes.INTEGER,
        original_permission_id: DataTypes.INTEGER,
    }, {
        tableName: 'sycu_permissions',
        timestamps: false,
        underscored: true,
    });
    return permissions;
}