'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var sycu_circleCommunities: any = sequelize.define('circle_communities', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        title: DataTypes.TEXT(),
        circle_community_id: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE()
    }, {
        tableName: 'circle_communities',
        timestamps: false,
        underscored: true,
    });
    sycu_circleCommunities.associate = function (models: any) {
        sycu_circleCommunities.belongsTo(models.spaces, {
            foreignKey: 'circle_community_id',
            targetKey: 'circle_community_id'
        });
    };
    return sycu_circleCommunities;
}
