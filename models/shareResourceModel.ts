'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var share_resources: any = sequelize.define('share_resources', {
        share_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        resource_id: DataTypes.INTEGER,
        user_id: DataTypes.INTEGER,
        shared_by: DataTypes.INTEGER,
        shared_link: DataTypes.STRING(255),
        is_expired: DataTypes.INTEGER,
        expire_datetime: DataTypes.DATE(),
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
        is_deleted: DataTypes.INTEGER
    }, {
        tableName: 'share_resources',
        timestamps: false,
        underscored: true,
    });
    share_resources.associate = function (models: any) {
        share_resources.belongsTo(models.resource, {
            foreignKey: 'resource_id',
            targetKey: 'id'
        });

    };
    return share_resources;
}
