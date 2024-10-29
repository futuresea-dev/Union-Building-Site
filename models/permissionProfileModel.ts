'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var permissionPorfileDetail: any = sequelize.define('sycu_permission_profiles', {
        permission_profile_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        title: DataTypes.STRING(256),
        role_id: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE()
    }, {
        tableName: 'sycu_permission_profiles',
        timestamps: false,
        underscored: true,
    });
    return permissionPorfileDetail;
}