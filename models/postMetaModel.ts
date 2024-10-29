'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var post_meta: any = sequelize.define('post_meta', {
        post_meta_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        post_id: DataTypes.INTEGER,
        meta_key: DataTypes.TEXT(),
        meta_value: DataTypes.TEXT(),
    }, {
        tableName: 'gc_post_meta',
        timestamps: false,
        underscored: true,
    });
    return post_meta;
}