'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var gs_feeds: any = sequelize.define('gs_feeds', {
        feed_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        title: DataTypes.STRING(50),
        code: DataTypes.STRING(50),
        user_id:DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
        is_deleted: {
            type:DataTypes.INTEGER,
            defaultValue: 0
        } 
    },
     {
        tableName: 'gs_feeds',
        timestamps: false,
        underscored: true,
    });

    gs_feeds.associate = function (models: any) {
        gs_feeds.hasMany(models.slideShows, {
            foreignKey: 'feed_id',
           targetKey: 'feed_id'
        });
   }; 

    return gs_feeds;
};
