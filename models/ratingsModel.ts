'use strict'
module.exports = function (sequelize: any, DataTypes: any) {

    let gg_ratings: any = sequelize.define('gg_ratings', {
        rating_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        user_id: DataTypes.INTEGER,
        game_id: DataTypes.INTEGER,
        review: DataTypes.TEXT(),
        rating: DataTypes.DOUBLE,
        is_deleted: DataTypes.INTEGER,
        updated_by: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE()
    },
        {
            tableName: 'gg_ratings',
            timestamps: false,
            underscored: true,
        });

    gg_ratings.associate = function (models: any) {
        gg_ratings.belongsTo(models.users, {
            foreignKey: 'user_id',
            targetKey: 'user_id'

        });
        gg_ratings.belongsTo(models.games, {
            foreignKey: 'game_id',
            targetKey: 'game_id'
        });
        gg_ratings.hasMany(models.attachment, {
            foreignKey: 'parent_id',
            targetKey: 'parent_id'
        });
    }
    return gg_ratings;
}