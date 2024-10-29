'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var sycu_resources: any = sequelize.define('resources', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        title: DataTypes.STRING(255),
        type: DataTypes.INTEGER,
        size: DataTypes.STRING(255),
        parent_id: DataTypes.INTEGER,
        super_parent_id: DataTypes.INTEGER,
        extension: DataTypes.STRING(255),
        path: DataTypes.STRING(1000),
        relative_path: DataTypes.STRING(1000),
        bucket_path: DataTypes.STRING(1000),
        is_deleted: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
        is_downloaded: DataTypes.INTEGER,
    }, {
        tableName: 'resources',
        timestamps: false,
        underscored: true,
    });
    return sycu_resources;
}
