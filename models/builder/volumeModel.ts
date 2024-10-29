'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var volume_model: any = sequelize.define('volume_model', {
        volume_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        user_id: DataTypes.INTEGER,
        build_folder_id: DataTypes.INTEGER,
        volume_title: DataTypes.STRING(256),
        //code: DataTypes.STRING(256),
        media_url: DataTypes.STRING(100),
        is_system: DataTypes.TINYINT(1),
        is_deleted: DataTypes.TINYINT(1),
        parent_id: DataTypes.INTEGER,
        category_id: DataTypes.INTEGER,
        ministry_type: DataTypes.INTEGER,
        is_restore: DataTypes.INTEGER,
        is_auto_saved: DataTypes.INTEGER,
        restore_point_title: DataTypes.STRING(100),
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
        is_added_by_code: DataTypes.INTEGER
    },
        {
            tableName: 'gb_volumes',
            timestamps: false,
            underscored: true,
        });

    volume_model.associate = function (models: any) {
        volume_model.belongsTo(models.buildFolder, {
            foreignKey: 'build_folder_id',
            targetKey: 'build_folder_id'
        });
        volume_model.belongsTo(models.shareCode, {
            foreignKey: 'volume_id',
            targetKey: 'share_content_id'
        });
        // build_folder.belongsTo(models.sites, {
        //          foreignKey: 'site_id',
        //         targetKey: 'site_id'
        //      });
        volume_model.hasMany(models.seriesBuildList, {
            foreignKey: 'volume_id',
            targetKey: 'volume_id'
        });
    };
    return volume_model;
};
