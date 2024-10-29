/*
    * Code done by Sh - 15-12-2021
    * create model for gg_filters
*/
'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var gg_filters: any = sequelize.define('gg_filters', {
        filter_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        user_id: DataTypes.INTEGER,
        name: DataTypes.STRING(255),
        slug: DataTypes.STRING(255),
        is_popular: DataTypes.INTEGER,
        is_system: DataTypes.INTEGER,
        short_name: DataTypes.STRING(255),
        filter_type: DataTypes.INTEGER,
        description: DataTypes.TEXT(),
        parent: DataTypes.INTEGER,
        count: DataTypes.INTEGER,
        created_by: DataTypes.INTEGER,
        updated_by: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
    }, {
        tableName: 'gg_filters',
        timestamps: false,
        underscored: true,
    });
    gg_filters.associate = function (models: any) {
        gg_filters.belongsTo(models.users, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });

        gg_filters.hasMany(models.giFilters, {
            foreignKey: 'filter_id',
            targetKey: 'filter_id'
        });
    };
    return gg_filters;
};
