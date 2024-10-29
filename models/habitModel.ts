module.exports = function (sequelize: any, DataTypes: any) {
    var habit: any = sequelize.define('habit', {
        habit_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        title: DataTypes.STRING(256),
        description: DataTypes.TEXT,
        task_1: DataTypes.STRING(256),
        task_2: DataTypes.STRING(256),
        task_3: DataTypes.STRING(256),
        task_4: DataTypes.STRING(256),
        task_5: DataTypes.STRING(256),
        category_index: DataTypes.INTEGER,
        image_index: DataTypes.INTEGER,
        color_index: DataTypes.INTEGER,
        user_id: DataTypes.INTEGER,
        public_sharing: DataTypes.INTEGER,
        days: DataTypes.STRING(256),
        is_deleted: DataTypes.INTEGER,
        user_index: DataTypes.INTEGER,
        user_count_done: DataTypes.INTEGER(20),
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
        rest_datetime: DataTypes.DATE(),
        is_from: DataTypes.INTEGER,
        parent_habit_id: DataTypes.INTEGER,
        is_admin: DataTypes.INTEGER
    }, {
        tableName: 'ghb_habit',
        timestamps: false,
        underscored: true,
    });
    habit.associate = function (models: any) {
        habit.belongsTo(models.users, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        habit.belongsTo(models.category, {
            foreignKey: 'category_index',
            sourceKey: 'category_id'
        })
    };
    return habit;
};
