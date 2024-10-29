'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var kidsMusic: any = sequelize.define('user_kids_music', {
        users_music_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        music_id: DataTypes.INTEGER,
        user_id: DataTypes.INTEGER,
        product_id: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        created_date: DataTypes.TEXT(),
        updated_date: DataTypes.TEXT(),
    }, {
        tableName: 'sycu_user_kids_music',
        timestamps: false,
        underscored: true,
    });
    return kidsMusic;
}
