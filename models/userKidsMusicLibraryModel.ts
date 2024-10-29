'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var kidsMusicLibrary: any = sequelize.define('user_kids_music_library', {
        user_music_library_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        music_id: DataTypes.INTEGER,
        user_id: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        added_type: DataTypes.INTEGER, //1 = shared dashboard, 2 = purchased songs, 3 = curriculum purchased, 4 = free songs
        created_date: DataTypes.TEXT(),
        updated_date: DataTypes.TEXT(),
    }, {
        tableName: 'sycu_user_kids_music_library',
        timestamps: false,
        underscored: true,
    });
    return kidsMusicLibrary;
}
