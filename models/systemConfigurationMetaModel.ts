/*
    * Code done by Sh - 13-12-2021
    * create model for gg_attachment
*/
'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var systemConfigurationMeta: any = sequelize.define('systemConfigurationMeta', {
        sc_meta_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        sc_type: DataTypes.INTEGER,
        sc_meta_key: DataTypes.TEXT,
        sc_meta_value: DataTypes.TEXT, 
        sc_status: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
    }, {
        tableName: 'sycu_system_configuration_meta',
        timestamps: false,
        underscored: true,
    });
   
    return systemConfigurationMeta;
};
