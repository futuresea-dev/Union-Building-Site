//Sa 22-12-2021
'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var gg_countdown_configurations: any = sequelize.define('gg_countdown_configurations', {
        cc_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        type: DataTypes.INTEGER,
        type_value: DataTypes.TEXT(),
        thumbnail: DataTypes.TEXT(),
        name: DataTypes.TEXT(),
        extension: DataTypes.TEXT(),
        size: DataTypes.INTEGER,
        sort_order: DataTypes.INTEGER,
        is_landscape: DataTypes.INTEGER,
        is_rotate: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        created_by: DataTypes.INTEGER,
        updated_by: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
    }, {
        tableName: 'gg_countdown_configurations',
        timestamps: false,
        underscored: true,
    });
    gg_countdown_configurations.association = function (models: any) {
        gg_countdown_configurations.belongsTo(models.sycu_users, {
            foreignKey: "created_by",
            target_key: "user_id"
        })
    }
    return gg_countdown_configurations;
};
