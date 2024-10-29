/*
    * Code done by Sh - 17-12-2021
    * create model for gg_played_games
*/
'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var sycu_game_played_games: any = sequelize.define('gg_played_games', {
        played_game_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        user_id: DataTypes.INTEGER,
        game_id: DataTypes.INTEGER,
        is_played: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
    }, {
        tableName: 'gg_played_games',
        timestamps: false,
        underscored: true,
    });
    sycu_game_played_games.associate = function (models: any) {
        sycu_game_played_games.belongsTo(models.users, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        sycu_game_played_games.belongsTo(models.games, {
            foreignKey: 'game_id',
            targetKey: 'game_id'
        });
    };
    return sycu_game_played_games;
};
