'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var thirdParty_configuration: any = sequelize.define('sycu_thirdparty_configuration', {
        thirdparty_configuration_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        thirdparty_id: DataTypes.INTEGER,
        configuration_json: DataTypes.JSON,        
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
    }, {
        tableName: 'sycu_thirdparty_configuration',
        timestamps: false,
        underscored: true,
    });
    thirdParty_configuration.associate = function (models: any) {       

    };
    
    return thirdParty_configuration;
};