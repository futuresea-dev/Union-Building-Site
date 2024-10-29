'use strict'

module.exports = function (sequelize: any, DataTypes: any) {
    var gg_viewed_icebreakers: any = sequelize.define('gg_viewed_icebreakers', {
        icebreaker_viewed_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
            unique: true
        },
        user_id: DataTypes.INTEGER,
        icebreaker_id: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),

    }, {
        tableName: 'gg_viewed_icebreakers',
        timestamps: false,
        underscored: true
    });

    gg_viewed_icebreakers.associate = function (models: any) {
        gg_viewed_icebreakers.belongsTo(models.users, {
            foreignKey: 'user_id',
            targetKey: 'user_id',
        });
        gg_viewed_icebreakers.belongsTo(models.icebreakers, {
            foreignKey: 'icebreaker_id',
            targetKey: 'icebreaker_id',
        })
    }

    return gg_viewed_icebreakers;
}