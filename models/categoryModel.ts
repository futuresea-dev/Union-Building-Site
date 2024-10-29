module.exports = function (sequelize: any, DataTypes: any) {
    var category: any = sequelize.define('category', {
        category_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        title: DataTypes.STRING(256),
        icon: DataTypes.STRING(256),
        color: DataTypes.STRING(256),
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
        status: DataTypes.INTEGER,
        is_present_habit_available: DataTypes.INTEGER,
        description: DataTypes.TEXT,
        is_deleted: DataTypes.INTEGER,
        is_from: DataTypes.INTEGER
    }, {
        tableName: 'ghb_category',
        timestamps: false,
        underscored: true,
    });
    return category;
};
