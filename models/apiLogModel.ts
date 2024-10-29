//Sa-28/03/22
"use strict";
module.exports = function (sequelize: any, DataTypes: any) {
    var sycu_api_log: any = sequelize.define('sycu_api_log', {
        api_log_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        api_url: DataTypes.TEXT(),
        method: DataTypes.TEXT(),
        request: DataTypes.TEXT(),
        response: DataTypes.TEXT(),
        site_id: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
        header: DataTypes.TEXT(),
    }, {
        tableName: 'sycu_api_log',
        timestamps: false,
        underscored: true,
    });
    sycu_api_log.associate = function (models: any) {
        sycu_api_log.belongsTo(models.sites, {
            foreignKey: 'site_id',
            targetKey: 'site_id'
        });
    };
    return sycu_api_log;
};
