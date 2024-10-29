'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var ba_support_tickets_statuses: any = sequelize.define('ba_support_tickets_statuses', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        name: DataTypes.STRING(255)
    }, {
        tableName: 'ba_support_tickets_statuses',
        timestamps: false,
        underscored: true,
    });
    ba_support_tickets_statuses.associate = function (models: any) {

    };
    return ba_support_tickets_statuses;
};
