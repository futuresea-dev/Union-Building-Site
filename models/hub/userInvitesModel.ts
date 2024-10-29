'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var hub_user_invites: any = sequelize.define('gh_user_invites', {
        user_invite_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        user_id: DataTypes.INTEGER,
        hub_id: DataTypes.INTEGER,
        name: DataTypes.STRING(50),
        email: DataTypes.STRING(255),
        invitation_code: DataTypes.STRING(50),
        user_type: DataTypes.INTEGER,
        status: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
    }, {
        tableName: 'gh_user_invites',
        timestamps: false,
        underscored: true,
    });
    hub_user_invites.associate = function (models: any) {
        hub_user_invites.belongsTo(models.users, {
            foreignKey: 'user_id',
            sourceKey: 'user_id'
        });
        hub_user_invites.belongsTo(models.hubs, {
            foreignKey: 'hub_id',
            sourceKey: 'hub_id'
        });
        // hub_user_invites.belongsTo(models.hubs, {
        //     as: "userInvites",
        //     foreignKey: 'hub_id',
        //     sourceKey: 'hub_id'
        // });
    };
    return hub_user_invites;
}