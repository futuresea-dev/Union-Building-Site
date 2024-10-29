'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var sycu_circleSpaces: any = sequelize.define('circle_spaces', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        title: DataTypes.TEXT(),
        community_id: DataTypes.INTEGER,
        circle_community_id: DataTypes.INTEGER,
        circle_space_id: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE()
    }, {
        tableName: 'circle_spaces',
        timestamps: false,
        underscored: true,
    });
    sycu_circleSpaces.associate = function (models: any) {
        sycu_circleSpaces.belongsTo(models.communities, {
            foreignKey: 'circle_community_id',
            targetKey: 'circle_community_id'
        });
    };
    return sycu_circleSpaces;
}
