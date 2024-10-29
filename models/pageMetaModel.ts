'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var page_meta: any = sequelize.define('page_meta', {
        page_meta_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        page_id: DataTypes.INTEGER,
        original_id: DataTypes.INTEGER,
        parent_meta_id: DataTypes.INTEGER,
        parent_page_meta_id: DataTypes.INTEGER,
        meta_key: DataTypes.TEXT(),
        meta_value: DataTypes.TEXT(),
        sort_order: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        created_datetime: DataTypes.TEXT(),
        updated_datetime: DataTypes.TEXT(),
        created_by: DataTypes.INTEGER,
        updated_by: DataTypes.INTEGER,
    }, {
        tableName: 'gc_page_meta',
        timestamps: false,
        underscored: true,
    });
    return page_meta;
}