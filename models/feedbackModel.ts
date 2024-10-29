'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var feedback: any = sequelize.define('feedbacks', {
        feedback_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        type: DataTypes.INTEGER,
        type_id: DataTypes.INTEGER,
        user_id: DataTypes.INTEGER,
        feedback_rating: DataTypes.INTEGER,
        feedback_review: DataTypes.STRING(500),
        curriculum_content_type: DataTypes.STRING(500),
        curriculum_tabs_id: DataTypes.INTEGER,
        sort_order: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        created_datetime: DataTypes.STRING(255),
    }, {
        tableName: 'free_trial_feedback',
        timestamps: false,
        underscored: true,
    });
    feedback.associate = function (models: any) {
        feedback.belongsTo(models.users, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        feedback.belongsTo(models.applicationAds, {
            foreignKey: 'type_id',
            targetKey: 'application_ads_id'
        });
        feedback.belongsTo(models.todoList, {
            foreignKey: 'type_id',
            targetKey: 'todo_list_id'
        });
        feedback.belongsTo(models.contentTypes, {
            foreignKey: 'curriculum_tabs_id',
            targetKey: 'content_type_id'
        });
        feedback.belongsTo(models.categories, {
            foreignKey: 'type_id',
            targetKey: 'category_id'
        });
        feedback.belongsTo(models.posts, {
            foreignKey: 'type_id',
            targetKey: 'post_id'
        });
    };
    return feedback;
}
