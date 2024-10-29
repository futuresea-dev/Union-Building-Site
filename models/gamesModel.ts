/*
    * Code done by Sh - 13-12-2021
    * create model for gg_games
*/
'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var gg_games: any = sequelize.define('sycu_game_games', {
        game_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        category_id: DataTypes.INTEGER,
        user_id: DataTypes.INTEGER,
        game_description: DataTypes.TEXT(),
        is_description_hide: DataTypes.INTEGER,
        game_title: DataTypes.TEXT(),
        what_to_get: DataTypes.TEXT(),
        what_to_prep: DataTypes.TEXT(),
        how_to_play: DataTypes.TEXT(),
        pro_tips: DataTypes.TEXT(),
        is_pro_tips_hide: DataTypes.INTEGER,
        slide_link: DataTypes.TEXT(),
        is_system: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        is_hidden: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
    }, {
        tableName: 'gg_games',
        timestamps: false,
        underscored: true,
    });
    gg_games.associate = function (models: any) {
        // gg_games.hasMany(models.attachment, {
        //     foreignKey: 'game_id',
        //     targetKey: 'parent_id'
        // });
        gg_games.hasMany(models.attachment, {
            foreignKey: 'parent_id',
            targetKey: 'parent_id'
        });
        gg_games.hasMany(models.giFilters, {
            foreignKey: 'type_id',
            targetKey: 'type_id'
        });
        gg_games.belongsTo(models.users, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        gg_games.hasMany(models.favouritedGames, {
            foreignKey: 'game_id',
            targetKey: 'game_id'
        });

        gg_games.hasMany(models.playedGames, {
            foreignKey: 'game_id',
            targetKey: 'game_id'
        });

        gg_games.hasMany(models.mostViewedGames, {
            foreignKey: 'game_id',
            targetKey: 'game_id'
        });

        gg_games.hasMany(models.ratings, {
            foreignKey: 'game_id',
            targetKey: 'game_id'
        });

        gg_games.hasMany(models.gameNotes, {
            foreignKey: 'game_id',
            targetKey: 'game_id'
        });

        gg_games.hasMany(models.notifications, {
            foreignKey: 'notification_type_id',
            targetKey: 'notification_type_id'
        });

        gg_games.hasMany(models.sharedGames, {
            foreignKey: 'game_id',
            targetKey: 'game_id'
        });
        gg_games.belongsTo(models.pageLink, {
            foreignKey: 'game_id',
            targetKey: 'data_id'
        });
        gg_games.hasMany(models.slideShows, {
            foreignKey: 'game_id',
            targetKey: 'game_id'
        });
    };
    return gg_games;
};
