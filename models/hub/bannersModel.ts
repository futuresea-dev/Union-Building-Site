'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var hub_banners: any = sequelize.define('gh_hub_banners', {
        banner_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        user_id: DataTypes.INTEGER,
        banner_name: DataTypes.TEXT(),
        banner_image_url: DataTypes.TEXT(),
        is_default: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
    }, {
        tableName: 'gh_hub_banners',
        timestamps: false,
        underscored: true,
    });
    hub_banners.associate = function (models: any) {
        hub_banners.belongsTo(models.users, {
            foreignKey: 'user_id',
            sourceKey: 'user_id'
        });
    };
    return hub_banners;
}