'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var content_meta: any = sequelize.define('content_meta', {
        content_meta_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        content_type_id: DataTypes.INTEGER,
        meta_key: DataTypes.TEXT(),
        meta_type: DataTypes.TEXT(),
        meta_value: DataTypes.TEXT(),
        is_deleted: DataTypes.INTEGER,
        created_datetime: DataTypes.TEXT(),
        updated_datetime: DataTypes.TEXT(),
    }, {
        tableName: 'gc_content_meta',
        timestamps: false,
        underscored: true,
    });
    return content_meta;
}