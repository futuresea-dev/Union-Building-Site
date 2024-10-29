module.exports = function (sequelize: any, DataTypes: any) {
    var redirectionFolder: any = sequelize.define('redirection_folder', {
        redirection_folder_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        parent_id: DataTypes.INTEGER,
        title: DataTypes.STRING(255),
        is_deleted: DataTypes.TINYINT(1),
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
        created_by: DataTypes.INTEGER,
        updated_by: DataTypes.INTEGER
    }, {
        tableName: 'redirection_folder',
        timestamps: false,
        underscored: true,
    });
    // redirectionFolder.associate = function (models: any) {
    //     redirectionFolder.belongsTo(models.userOrder, {
    //         foreignKey: 'order_id',
    //         targetKey: 'user_orders_id'
    //     });
    // };
    return redirectionFolder;
};
