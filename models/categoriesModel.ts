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
        ministry_type: DataTypes.INTEGER,
        total_week: DataTypes.INTEGER,
        volume_count: DataTypes.INTEGER,
        sort_order: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        is_hidden: DataTypes.INTEGER,
        created_datetime: DataTypes.STRING(255),
        updated_datetime: DataTypes.STRING(255),
        created_by: DataTypes.INTEGER,
        updated_by: DataTypes.INTEGER,
        recommended_fonts: DataTypes.TEXT(),
    }, {
        tableName: 'sycu_categories',
        timestamps: false,
        underscored: true,
    });
    sycu_categories.associate = function (models: any) {
        sycu_categories.hasMany(models.pages, {
            foreignKey: 'category_id',
            targetKey: 'category_id'
        });
        sycu_categories.hasMany(models.categoriesDetail, {
            foreignKey: 'category_id',
            targetKey: 'category_id'
        });
        sycu_categories.hasMany(models.products, {
            foreignKey: 'category_id',
            targetKey: 'category_id'
        });
        sycu_categories.hasMany(models.seriesEmail, {
            foreignKey: 'category_id',
            targetKey: 'category_id'
        });
        sycu_categories.hasMany(models.pageLink, {
            foreignKey: 'data_id',
            sourceKey: 'category_id'
        });
        sycu_categories.hasMany(models.messageBuildList, {
            foreignKey: 'series_id',
            targetKey: 'category_id'
        });
        sycu_categories.hasMany(models.users, {
            as: 'created_user',
            sourceKey: 'created_by',
            foreignKey: 'user_id'
        });
        sycu_categories.hasMany(models.users, {
            as: 'updated_user',
            sourceKey: 'updated_by',
            foreignKey: 'user_id'
        });
        sycu_categories.hasMany(models.membership, {
            foreignKey: 'category_id',
            targetKey: 'category_id'
        });
    };
    return sycu_categories;
}
