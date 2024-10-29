/*
    * Code done by Sh - 17-12-2021
    * create model for gg_most_viewed_games
*/
'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var sycu_game_most_viewed_games: any = sequelize.define('gg_most_viewed_games', {
        view_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        game_id: DataTypes.INTEGER,
        user_id: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
    }, {
        tableName: 'gg_most_viewed_games',
        timestamps: false,
        underscored: true,
    });
    sycu_game_most_viewed_games.associate = function (models: any) {
        sycu_game_most_viewed_games.belongsTo(models.users, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        sycu_game_most_viewed_games.belongsTo(models.games, {
            foreignKey: 'game_id',
            targetKey: 'game_id'
        });
    };
    return sycu_game_most_viewed_games;
};
