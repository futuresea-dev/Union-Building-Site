'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var sycu_admin_activity_logs: any = sequelize.define('sycu_admin_activity_logs', {
        admin_activity_log_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        user_id: DataTypes.STRING(50),
        activity_type: DataTypes.TEXT(),
        module: DataTypes.TEXT(),
        submodule :  DataTypes.TEXT(),
        description: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        is_deleted: DataTypes.INTEGER
    }, {
        tableName: 'sycu_admin_activity_logs',
        timestamps: false,
        underscored: true,
    }); 

    sycu_admin_activity_logs.associate = function (models: any) {

        sycu_admin_activity_logs.belongsTo(models.users, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
    };

    return sycu_admin_activity_logs;
};
