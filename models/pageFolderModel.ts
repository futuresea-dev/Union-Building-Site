'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var page_folder: any = sequelize.define('page_folder', {
        page_folder_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        folder_name: DataTypes.TEXT(),
        parent_folder_id: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        created_datetime: DataTypes.TEXT(),
        updated_datetime: DataTypes.TEXT(),
    }, {
        tableName: 'gc_page_folder',
        timestamps: false,
        underscored: true,
    });
    return page_folder;
}