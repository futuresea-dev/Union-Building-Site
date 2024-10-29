'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var sycu_categories: any = sequelize.define('sycu_categories', {
        category_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        parent_category_id: DataTypes.INTEGER,
        category_title: DataTypes.TEXT(),
        category_slug: DataTypes.TEXT(),
        category_image: DataTypes.TEXT(),
        category_level: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        created_datetime: DataTypes.STRING(255),
        updated_datetime: DataTypes.STRING(255),
    }, {
        tableName: 'sycu_categories',
        timestamps: false,
        underscored: true,
    });
    return sycu_categories;
}