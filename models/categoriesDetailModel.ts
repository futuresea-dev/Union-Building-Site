'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var categories_detail: any = sequelize.define('categories_detail', {
        categories_detail_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        category_id: DataTypes.INTEGER,
        detail_key: DataTypes.STRING(255),
        detail_value: DataTypes.TEXT(),
        is_deleted: DataTypes.INTEGER,
        created_datetime: DataTypes.STRING(255),
        updated_datetime: DataTypes.STRING(255),
        created_by: DataTypes.INTEGER,
        updated_by: DataTypes.INTEGER,
    }, {
        tableName: 'sycu_categories_detail',
        timestamps: false,
        underscored: true,
    });
    categories_detail.associate = function (models: any) {
        categories_detail.belongsTo(models.pageLink, {
            foreignKey: 'categories_detail_id',
            targetKey: 'data_id'
        });
        categories_detail.belongsTo(models.pageLink, {
            as: 'series_tutorials',
            foreignKey: 'category_id',
            targetKey: 'data_id'
        });
        categories_detail.belongsTo(models.categories, {
            foreignKey: 'category_id',
            targetKey: 'category_id'
        });
        categories_detail.belongsTo(models.pageLink, {
            as: 'amazon_internal',
            foreignKey: 'categories_detail_id',
            targetKey: 'detail_id'
        });
    };
    return categories_detail;
}