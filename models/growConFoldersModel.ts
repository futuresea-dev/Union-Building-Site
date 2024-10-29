'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var gs_grow_con_folders: any = sequelize.define('gs_grow_con_folders', {
        grow_con_folder_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        folder_name: DataTypes.TEXT(),
        is_deleted: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
    }, {
        tableName: 'gs_grow_con_folders',
        timestamps: false,
        underscored: true,
    });
    return gs_grow_con_folders;
};
