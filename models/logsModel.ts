'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var logs: any = sequelize.define('sycu_logs', {
        log_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        type: DataTypes.TINYINT,
        event_type_id: DataTypes.TINYINT,
        message: DataTypes.TEXT(),
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
        is_deleted: DataTypes.TINYINT
    }, {
        tableName: 'sycu_logs',
        timestamps: false,
        underscored: true,
    });
    logs.associate = function (models: any) {

    };
    return logs;
};
