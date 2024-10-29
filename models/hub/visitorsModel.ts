'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var hub_visitors: any = sequelize.define('gh_visitors', {
        visitor_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        hub_id: DataTypes.INTEGER,
        visitor_ip: DataTypes.STRING(50),
        device_info: DataTypes.STRING(500),
        visit_datetime: DataTypes.DATE(),
    }, {
        tableName: 'gh_visitors',
        timestamps: false,
        underscored: true,
    });
    hub_visitors.associate = function (models: any) {
        hub_visitors.belongsTo(models.hubs, {
            foreignKey: 'hub_id',
            targetKey: 'hub_id'
        });

    };
    return hub_visitors;
}