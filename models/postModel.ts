'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var posts: any = sequelize.define('posts', {
        post_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        content_type_id: DataTypes.INTEGER,
        category_id: DataTypes.INTEGER,
        ministry_type: DataTypes.INTEGER,
        post_title: DataTypes.TEXT(),
        post_description: DataTypes.TEXT(), 
        post_image: DataTypes.TEXT(),
        post_video: DataTypes.TEXT(),
        parent_post_id: DataTypes.INTEGER,
        created_by: DataTypes.INTEGER,
        updated_by: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        is_hidden: DataTypes.INTEGER,
        is_hidden_card: DataTypes.INTEGER,
        created_datetime: DataTypes.TEXT(),
        updated_datetime: DataTypes.TEXT(),
    }, {
        tableName: 'gc_posts',
        timestamps: false,
        underscored: true,
    });
    posts.associate = function (models: any) {
        posts.hasMany(models.postMeta, {
            foreignKey: 'post_id',
            targetKey: 'post_id'
        });
        posts.belongsTo(models.categories, {
            foreignKey: 'category_id',
            targetKey: 'category_id'
        });
        posts.belongsTo(models.contentTypes, {
            foreignKey: 'content_type_id',
            targetKey: 'content_type_id'
        });
        posts.belongsTo(models.pagePosts, {
            as:'signlePagePosts',
            foreignKey: 'post_id',
            targetKey: 'post_id'
        });
        posts.hasMany(models.pagePosts, {
            foreignKey: 'post_id',
            sourceKey: 'post_id',
        });
        posts.hasMany(models.users, {
            as: 'created_user',
            sourceKey: 'created_by',
            foreignKey: 'user_id'
        });
        posts.hasMany(models.users, {
            as: 'updated_user',
            sourceKey: 'updated_by',
            foreignKey: 'user_id'
        });
        posts.hasMany(models.postsFolders, {
            foreignKey: 'post_id',
            targetKey: 'post_id'
        });
        posts.belongsTo(models.userKidsMusic, {
            foreignKey: 'post_id',
            targetKey: 'music_id'
        });
        posts.belongsTo(models.userKidsMusicLibrary, {
            foreignKey: 'post_id',
            targetKey: 'music_id'
        })
    };
    return posts;
}
