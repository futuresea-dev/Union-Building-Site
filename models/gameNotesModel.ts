/*
    * Code done by Sh - 27-12-2021
    * create model for gg_games_notes
*/
'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var gg_game_notes: any = sequelize.define('gg_game_notes', {
        game_note_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        user_id: DataTypes.INTEGER,
        game_id: DataTypes.INTEGER,
        note: DataTypes.TEXT(),
        is_deleted: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
    }, {
        tableName: 'gg_game_notes',
        timestamps: false,
        underscored: true,
    });
    gg_game_notes.associate = function (models: any) {
        gg_game_notes.belongsTo(models.users, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        gg_game_notes.belongsTo(models.games, {
            foreignKey: 'game_id',
            targetKey: 'game_id'
        });
    };
    return gg_game_notes;
};
