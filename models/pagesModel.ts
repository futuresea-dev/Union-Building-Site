'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var pages: any = sequelize.define('pages', {
        page_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        category_id: DataTypes.INTEGER,
        ministry_type: DataTypes.INTEGER,
        page_title: DataTypes.TEXT(),
        page_description: DataTypes.TEXT(),
        page_image: DataTypes.TEXT(),
        page_icon: DataTypes.TEXT(),
        page_link: DataTypes.TEXT(),
        page_slug: DataTypes.TEXT(),
        created_by: DataTypes.INTEGER,
        updated_by: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        is_published: DataTypes.INTEGER,
        is_ministry_page: DataTypes.INTEGER,
        accessible_type: DataTypes.INTEGER,
        parent_page_id: DataTypes.INTEGER,
        publish_datetime: DataTypes.STRING,
        created_datetime: DataTypes.TEXT(),
        updated_datetime: DataTypes.TEXT(),
        sort_order: DataTypes.INTEGER,
        is_hidden: DataTypes.INTEGER,
    }, {
        tableName: 'gc_pages',
        timestamps: false,
        underscored: true,
    });
    pages.associate = function (models: any) {
        pages.hasMany(models.pageMeta, {
            foreignKey: 'page_id',
            targetKey: 'page_id'
        });
        pages.belongsTo(models.users, {
            foreignKey: 'updated_by',
            targetKey: 'user_id'
        });
        pages.hasMany(models.posts, {
            foreignKey: 'page_id',
            targetKey: 'page_id'
        });
        pages.hasMany(models.pageSeries, {
            foreignKey: 'page_id',
            targetKey: 'page_id'
        });
        pages.hasMany(models.pagePosts, {
            foreignKey: 'page_id',
            targetKey: 'page_id'
        });
        pages.belongsTo(models.pageLink, {
            foreignKey: 'page_id',
            as: 'page_series_link',
            targetKey: 'data_id'
        });
        pages.belongsTo(models.categories, {
            foreignKey: 'category_id',
            targetKey: 'category_id'
        });
        pages.hasMany(models.users, {
            as: 'created_user',
            sourceKey: 'created_by',
            foreignKey: 'user_id'
        });
        pages.hasMany(models.users, {
            as: 'updated_user',
            sourceKey: 'updated_by',
            foreignKey: 'user_id'
        });
    };
    return pages;
}
