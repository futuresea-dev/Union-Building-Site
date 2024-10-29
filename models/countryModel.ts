'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var country: any = sequelize.define('countryModel', {
        country_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        name: DataTypes.STRING(255),
        country_code: DataTypes.STRING(255),        
        
    }, {
        tableName: 'sycu_country',
        timestamps: false,
        underscored: true,
    });
    country.associate = function (models: any) {
        country.hasMany(models.stateModel, {
            foreignKey: 'country_id',
            targetKey: 'country_id'
        });

    };
    return country;
};
