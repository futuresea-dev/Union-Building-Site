'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var userMemberships: any = sequelize.define('sycu_user_memberships', {
        user_membership_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        user_id: DataTypes.INTEGER,
        site_id: DataTypes.INTEGER,
        membership_id: DataTypes.INTEGER,
        user_subscription_id: DataTypes.INTEGER,
        status: DataTypes.INTEGER,
        user_orders_id: DataTypes.INTEGER,
        expires: DataTypes.DATE(),
        start_date: DataTypes.DATE(),
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
        is_deleted: DataTypes.INTEGER
    }, {
        tableName: 'sycu_user_memberships',
        timestamps: false,
        underscored: true,
    });
    userMemberships.associate = function (models: any) {
        userMemberships.belongsTo(models.users, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        userMemberships.belongsTo(models.membership, {
            foreignKey: 'membership_id',
            targetKey: 'membership_id'
        });
        userMemberships.belongsTo(models.userOrder, {
            foreignKey: 'user_orders_id',
            targetKey: 'user_orders_id'
        });
        userMemberships.hasMany(models.orderNotes, {
            foreignKey: 'event_type_id',
            sourceKey: 'user_membership_id'
        });
        userMemberships.belongsTo(models.userSubscription, {
            foreignKey: 'user_subscription_id',
            targetKey: 'user_subscription_id'
        });
        userMemberships.belongsTo(models.membershipProduct, {
            foreignKey: 'membership_id',
            targetKey: 'membership_id'
        });
    };
    return userMemberships;
};
