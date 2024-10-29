'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var sycu_users_social_logs: any = sequelize.define('sycu_users_social_logs', {
        user_social_login_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        user_id: DataTypes.INTEGER,
        client_id: DataTypes.STRING(),
        type: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
        is_deleted: DataTypes.INTEGER,
    }, {
        tableName: 'sycu_users_social_logs',
        timestamps: false,
        underscored: true,
    });
    sycu_users_social_logs.associate = function (models: any) {
        // sycu_users_social_logs.hasMany(models.userLoginLogs, {
        //      foreignKey: 'user_id',
        //      targetKey: 'user_id'
        //  });
    };
    return sycu_users_social_logs;
};
