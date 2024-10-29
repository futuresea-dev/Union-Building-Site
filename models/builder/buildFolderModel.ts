'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var build_folder: any = sequelize.define('build_folder', {
        build_folder_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        user_id: DataTypes.INTEGER,
        parent_id: DataTypes.INTEGER(11),
        build_folder_title: DataTypes.STRING(256),
        folder_type: DataTypes.TINYINT(1),
        is_system: DataTypes.TINYINT(1),
        is_deleted: DataTypes.TINYINT(1),
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE()
    },
     {
        tableName: 'gb_build_folders',
        timestamps: false,
        underscored: true,
    });
    build_folder.associate = function (models: any) {
        build_folder.hasMany(models.messageBuildList, {
             foreignKey: 'build_folder_id',
             targetKey: 'build_folder_id'
         });
    build_folder.hasMany(models.volumeModel, {
             foreignKey: 'build_folder_id',
            targetKey: 'build_folder_id'
         });
  };
    return build_folder;
};
