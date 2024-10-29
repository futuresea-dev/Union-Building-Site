'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var thirdparty_log: any = sequelize.define('sycu_thirdparty_logs', {
        thirdparty_log_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        thirdparty_id: DataTypes.INTEGER,
        request: DataTypes.JSON,
        response: DataTypes.JSON,
        activity_type: DataTypes.INTEGER,
        status: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        user_id :  DataTypes.INTEGER,
        email : DataTypes.STRING(100),
    }, {
        tableName: 'sycu_thirdparty_logs',
        timestamps: false,
        underscored: true,
    });
    thirdparty_log.associate = function (models: any) {

    };

    return thirdparty_log;
};