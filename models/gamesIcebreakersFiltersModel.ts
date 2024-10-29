/*
    * Code done by Sh - 15-12-2021
    * create model for gg_gi_filters
*/
'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var gg_gi_filters: any = sequelize.define('gg_games_icebreakers_filters', {
        gi_filter_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        filter_id: DataTypes.INTEGER,
        user_id: DataTypes.INTEGER,
        type_id: DataTypes.INTEGER,
        filter_type: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        added_by_system: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
    }, {
        tableName: 'gg_gi_filters',
        timestamps: false,
        underscored: true,
    });
    gg_gi_filters.associate = function (models: any) {
        gg_gi_filters.belongsTo(models.filters, {
            foreignKey: 'filter_id',
            targetKey: 'filter_id'
        });
        gg_gi_filters.belongsTo(models.filters, {
            as: 'Icebreaker_Filters',
            foreignKey: 'filter_id',
            targetKey: 'filter_id'
        });
        gg_gi_filters.belongsTo(models.users, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        gg_gi_filters.hasMany(models.games, {
            foreignKey: 'game_id',
            sourceKey: 'type_id'
        });
        gg_gi_filters.belongsTo(models.icebreakers, {
            foreignKey: 'type_id',
            targetKey: 'icebreaker_id'
        });

    };
    return gg_gi_filters;
};
