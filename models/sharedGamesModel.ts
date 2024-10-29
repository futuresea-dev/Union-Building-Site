/*
    * Code done by Sh - 03-01-2022
    * create model for gg_shared_games
*/
'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var gg_shared_games: any = sequelize.define('gg_shared_games', {
        share_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        game_id: DataTypes.INTEGER,
        user_id: DataTypes.INTEGER,
        share_plateform: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
    }, {
        tableName: 'gg_shared_games',
        timestamps: false,
        underscored: true,
    });
    gg_shared_games.associate = function (models: any) {
        gg_shared_games.belongsTo(models.users, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        gg_shared_games.belongsTo(models.games, {
            foreignKey: 'game_id',
            targetKey: 'game_id'
        });
    };
    return gg_shared_games;
};
