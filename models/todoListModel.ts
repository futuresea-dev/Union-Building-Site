'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var todo_list: any = sequelize.define('todo_list', {
        todo_list_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        title: DataTypes.STRING(255),
        type: DataTypes.INTEGER,
        scheduled: DataTypes.STRING(255),
        button_text: DataTypes.STRING(255),
        additional_data: DataTypes.TEXT(),
        ministry_type: DataTypes.INTEGER,
        sort_order: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        created_by: DataTypes.INTEGER,
        created_datetime: DataTypes.STRING(255),
        updated_datetime: DataTypes.STRING(255),
    }, {
        tableName: 'free_trial_todo_list',
        timestamps: false,
        underscored: true,
    });
    todo_list.associate = function (models: any) {
        todo_list.belongsTo(models.users, {
            foreignKey: 'created_by',
            targetKey: 'user_id'
        });
        todo_list.belongsTo(models.userTodoList, {
            foreignKey: 'todo_list_id',
            targetKey: 'todo_list_id'
        });
        todo_list.hasMany(models.feedBack, {
            foreignKey: 'type_id',
            targetKey: 'todo_list_id'
        });
    };
    return todo_list;
}
