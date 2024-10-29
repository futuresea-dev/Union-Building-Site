'use strict'

module.exports = function (sequelize: any, DataTypes: any) {
    var gg_icebreakers: any = sequelize.define('gg_icebreakers', {
        icebreaker_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
            unique: true
        },
        user_id: DataTypes.INTEGER,
        icebreaker_title: DataTypes.TEXT(),
        uuid: DataTypes.TEXT(),
        is_system: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        is_deleted: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
    }, {
        tableName: 'gg_icebreakers',
        timestamps: false,
        underscored: true
    });

    gg_icebreakers.associate = function (models: any) {
        gg_icebreakers.belongsTo(models.users, {
            foreignKey: 'user_id',
            targetKey: 'user_id',
        });
        gg_icebreakers.hasMany(models.giFilters, {
            foreignKey: 'type_id',
            targetKey: 'icebreaker_id',
        });
        gg_icebreakers.hasMany(models.favoritedIceBreakers, {
            foreignKey: 'icebreaker_id',
            targetKey: 'icebreaker_id',
        });
        gg_icebreakers.hasMany(models.viewedIceBreakers, {
            foreignKey: 'icebreaker_id',
            targetKey: 'icebreaker_id',
        });      
        gg_icebreakers.belongsTo(models.giFilters, {
            as: "iceBreakerFilter",
            foreignKey: "icebreaker_id",
            targetKey: "type_id",
          });
          gg_icebreakers.hasMany(models.favoritedIceBreakers, {
            as: "favIceBreaker",
            foreignKey: "icebreaker_id",
            targetKey: "icebreaker_id",
          });

    }

    return gg_icebreakers;
}
