'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var sycu_hubs: any = sequelize.define('gh_hubs', {
        hub_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        user_id: DataTypes.INTEGER,
        hub_title: DataTypes.TEXT(),
        banner_image: DataTypes.TEXT(),
        banner_thumbnail_image: DataTypes.TEXT(),
        banner_background_color: DataTypes.TEXT(),
        created_by: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
    }, {
        tableName: 'gh_hubs',
        timestamps: false,
        underscored: true,
    });
    sycu_hubs.associate = function (models: any) {
        sycu_hubs.hasMany(models.hubAnnouncements, {
            foreignKey: 'hub_id',
            sourceKey: 'hub_id'
        });
        sycu_hubs.hasMany(models.users, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        sycu_hubs.hasMany(models.hubVisitors, {
            foreignKey: 'hub_id',
            targetKey: 'hub_id'

        });
        sycu_hubs.hasMany(models.hubUserInvites, {
            foreignKey: 'hub_id',
            targetKey: 'hub_id'
        });
        sycu_hubs.belongsTo(models.hubUserInvites, {
            as: "userInvites",
            foreignKey: 'hub_id',
            targetKey: 'hub_id'
        });
    };
    return sycu_hubs;
}