'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var ba_applications: any = sequelize.define('ba_applications', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        name: DataTypes.STRING(255)
    }, {
        tableName: 'ba_applications',
        timestamps: false,
        underscored: true,
    });
    ba_applications.associate = function (models: any) {
        ba_applications.hasMany(models.supportTickets, {
            foreignKey: 'applications_id',
            sourceKey: 'id'
        });
    };
    return ba_applications;
};
