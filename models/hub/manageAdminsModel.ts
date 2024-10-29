'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var hub_manage_admin: any = sequelize.define('gh_manage_admins', {
        admin_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        sender_id: DataTypes.INTEGER,
        receiver_id: DataTypes.INTEGER,
        receiver_email: DataTypes.STRING(500),
        is_deleted: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
    }, {
        tableName: 'gh_manage_admins',
        timestamps: false,
        underscored: true,
    });
    hub_manage_admin.associate = function (models: any) {
        
    };
    return hub_manage_admin;
}