

'use strict'

module.exports = function (sequelize: any, DataTypes: any) {
    var gg_favorited_icebreakers: any = sequelize.define('gg_favorited_icebreakers', {
        favorited_icebreaker_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
            unique: true
        },
        user_id: DataTypes.INTEGER,
        icebreaker_id: DataTypes.INTEGER,
        is_favourite: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),

    }, {
        tableName: 'gg_favorited_icebreakers',
        timestamps: false,
        underscored: true
    });

    gg_favorited_icebreakers.associate = function (models: any) {
        gg_favorited_icebreakers.belongsTo(models.users, {
            foreignKey: 'user_id',
            targetKey: 'user_id',
        });
        gg_favorited_icebreakers.belongsTo(models.icebreakers, {
            foreignKey: 'icebreaker_id',
            targetKey: 'icebreaker_id',
        })
    }

    return gg_favorited_icebreakers;
}