/*
    * Code done by Sh - 13-12-2021
    * create model for gg_attachment
*/
'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var gg_attachment: any = sequelize.define('sycu_game_attachment', {
        game_attachment_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        parent_id: DataTypes.INTEGER,
        user_id: DataTypes.INTEGER,
        parent_type: DataTypes.INTEGER, 
        attachment_url: DataTypes.STRING(255),
        attachment_type: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
    }, {
        tableName: 'gg_attachment',
        timestamps: false,
        underscored: true,
    });
    gg_attachment.associate = function (models: any) {
        gg_attachment.hasMany(models.games, {
            foreignKey: 'game_id',
            sourceKey: 'parent_id'
        });
        gg_attachment.hasMany(models.ratings, {
            foreignKey: 'rating_id',
            sourceKey: 'parent_id'
        });
        gg_attachment.belongsTo(models.users, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        gg_attachment.hasMany(models.reportAbuse, {
            foreignKey: 'game_attachment_id',
            sourceKey: 'game_attachment_id'
        });
    };
    return gg_attachment;
};
