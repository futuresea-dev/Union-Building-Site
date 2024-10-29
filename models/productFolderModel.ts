'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var sycu_product_folder: any = sequelize.define('sycu_product_folder', {
        product_folder_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        folder_name: DataTypes.STRING(255),
        parent_folder_id: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        created_date: DataTypes.STRING(255),
        updated_date: DataTypes.STRING(255),
        is_shippable: DataTypes.TINYINT(1),
    }, {
        tableName: 'sycu_product_folder',
        timestamps: false,
        underscored: true,
    });
    return sycu_product_folder;
};
