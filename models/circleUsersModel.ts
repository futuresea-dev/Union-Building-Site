'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var sycu_circleUsers: any = sequelize.define('circle_users', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        circle_id: DataTypes.INTEGER,
        user_id: DataTypes.INTEGER,
        circle_community_id: DataTypes.INTEGER,
        first_name: DataTypes.STRING(255),
        last_name: DataTypes.STRING(255),
        email: DataTypes.STRING(255),
        avatar_url: DataTypes.TEXT(),
        profile_url: DataTypes.TEXT(),
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE()
    }, {
        tableName: 'circle_users',
        timestamps: false,
        underscored: true,
    });
    return sycu_circleUsers;
}
