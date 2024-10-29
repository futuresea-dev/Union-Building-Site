'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var thirdParty: any = sequelize.define('sycu_thirdparty', {
        thirdparty_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        title: DataTypes.STRING(255),
        icon: DataTypes.STRING(255),
        is_active:DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),

    }, {
        tableName: 'sycu_thirdparty',
        timestamps: false,
        underscored: true,
    });
    thirdParty.associate = function (models: any) {       

    };
    
    return thirdParty;
};