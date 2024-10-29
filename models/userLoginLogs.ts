module.exports = function (sequelize: any, DataTypes: any) {
    var user_login_logs: any = sequelize.define('user_login_logs', {
        users_login_log_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        user_id: DataTypes.INTEGER,
        parent_user_id: DataTypes.INTEGER,
        access_token: DataTypes.STRING(256),
        refresh_token: DataTypes.STRING(256),
        via_portal: DataTypes.TINYINT,
        via_platform: DataTypes.TINYINT,
        device_token: DataTypes.STRING(256),
        device_info: DataTypes.TEXT(),
        login_ip_address: DataTypes.STRING(15),
        is_logout: DataTypes.TINYINT,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
        access_token_expire_datetime: DataTypes.DATE(),
        refresh_token_expire_datetime: DataTypes.DATE(),
        logout_datetime: DataTypes.DATE()
    }, {
        tableName: 'sycu_user_login_logs',
        timestamps: false,
        underscored: true,
    });
    user_login_logs.associate = function (models: any) {
        user_login_logs.belongsTo(models.users, {
            foreignKey: 'user_id',
            sourceKey: 'user_id'
        });

        user_login_logs.belongsTo(models.users, {
            as: 'admin_details',
            foreignKey: 'parent_user_id',
            sourceKey: 'user_id'
        });

        user_login_logs.belongsTo(models.sites, {
            foreignKey: 'via_portal',
            sourceKey: 'site_id'
        });
    };
    return user_login_logs;
};
