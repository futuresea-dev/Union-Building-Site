'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var page_posts: any = sequelize.define('page_posts', {
        page_post_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        page_id: DataTypes.INTEGER,
        post_id: DataTypes.INTEGER,
        content_type_id: DataTypes.INTEGER,
        is_locked: DataTypes.INTEGER,
        is_coming_soon: DataTypes.INTEGER,
        is_selected: DataTypes.INTEGER,
        sort_order: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        created_datetime: DataTypes.TEXT(),
        updated_datetime: DataTypes.TEXT(),
        created_by: DataTypes.INTEGER,
        updated_by: DataTypes.INTEGER,
    }, {
        tableName: 'gc_page_posts',
        timestamps: false,
        underscored: true,
    });
    page_posts.associate = function (models: any) {
        page_posts.belongsTo(models.posts, {
            foreignKey: 'post_id',
            targetKey: 'post_id'
        });
        page_posts.belongsTo(models.pages, {
            foreignKey: 'page_id',
            targetKey: 'page_id'
        });
        page_posts.belongsTo(models.games, {
            foreignKey: 'post_id',
            targetKey: 'game_id'
        });
        page_posts.belongsTo(models.games, {
            foreignKey: 'post_id',
            targetKey: 'game_id'
        });
    };
    return page_posts;
}
