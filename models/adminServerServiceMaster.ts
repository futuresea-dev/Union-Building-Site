'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var sycu_service_master: any = sequelize.define('sycu_service_master', {
        service_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        server_id: DataTypes.STRING(50),
        service_type: DataTypes.TEXT(),
        service_type_credentials: DataTypes.TEXT(),
        is_default: DataTypes.INTEGER,
        site_id: DataTypes.INTEGER,
        updated_datetime: DataTypes.STRING(255),
        is_deleted: DataTypes.INTEGER
    }, {
        tableName: 'sycu_service_master',
        timestamps: false,
        underscored: true,
    });
    sycu_service_master.associate = function (models: any) {
        //     sycu_service_master.belongsTo(models., {
        //          as: 'server',
        //          foreignKey: 'server_id',
        //          targetKey: 'server_id'
        //      });
        sycu_service_master.belongsTo(models.sites, {
            foreignKey: 'site_id',
            targetKey: 'site_id'
        });
    };
    return sycu_service_master;
};
