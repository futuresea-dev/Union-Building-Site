'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var ba_support_tickets_types: any = sequelize.define('ba_support_tickets_types', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        name: DataTypes.STRING(255)
    }, {
        tableName: 'ba_support_tickets_types',
        timestamps: false,
        underscored: true,
    });
    ba_support_tickets_types.associate = function (models: any) {

    };
    return ba_support_tickets_types;
};
