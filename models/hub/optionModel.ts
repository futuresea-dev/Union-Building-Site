'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var hub_option: any = sequelize.define('gh_option', {
        option_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        user_id: DataTypes.INTEGER,
        option_name: DataTypes.STRING(255),
        option_value: DataTypes.TEXT(),
        autoload: DataTypes.STRING(20)
    }, {
        tableName: 'gh_option',
        timestamps: false,
        underscored: true,
    });
    hub_option.associate = function (models: any) {
        
    };
    return hub_option;
}