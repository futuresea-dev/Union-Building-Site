'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var posts_folders: any = sequelize.define('posts_folders', {
        post_folder_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        post_id: DataTypes.INTEGER,
        title: DataTypes.TEXT(),
        description: DataTypes.TEXT(),
        media_link: DataTypes.TEXT(),
        multi_media_link: DataTypes.TEXT(),
        is_multi_media_enable: DataTypes.INTEGER,
        lesson_builder_link1: DataTypes.TEXT(),
        lesson_builder_link2: DataTypes.TEXT(),
        color_code: DataTypes.STRING(255),
        sort_order: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        created_date: DataTypes.DATE(),
        updated_date: DataTypes.DATE(),
    }, {
        tableName: 'gc_posts_folders',
        timestamps: false,
        underscored: true,
    });
    posts_folders.associate = function (models: any) {
        posts_folders.belongsTo(models.posts, {
            foreignKey: 'post_id',
            targetKey: 'post_id'
        });
    };
    return posts_folders;
}
