'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var user_todo_list: any = sequelize.define('user_todo_list', {
        user_todo_list_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        todo_list_id: DataTypes.INTEGER,
        user_id: DataTypes.INTEGER,
        is_completed: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        created_datetime: DataTypes.STRING(255),
    }, {
        tableName: 'free_trial_user_todo_list',
        timestamps: false,
        underscored: true,
    });
    return user_todo_list;
}
