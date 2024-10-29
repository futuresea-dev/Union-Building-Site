//Santosh -  23-12-2021

'use strict'
module.exports = function (sequelize: any, DataTypes: any) {

    var gg_options: any = sequelize.define('gg_options', {
        option_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
            unique: true
        },
       
        option_name: DataTypes.TEXT(),
        option_value: {
            type: DataTypes.TEXT(),
            defaultValue: 0
        },
        auto_load: {
            type: DataTypes.TEXT(),
            defaultValue: 0
        },
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
    },
        {
            tableName: 'gg_options',
            timestamps: false,
            underscored: true
        });
    return gg_options;

}

