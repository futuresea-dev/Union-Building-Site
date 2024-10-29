"use strict";
module.exports = function (sequelize: any, DataTypes: any) {
    var ba_facebook_group_link_activity: any = sequelize.define('ba_facebook_group_link_activity', {
        ba_facebook_group_link_activity_id: {
            type: DataTypes.BIGINT(20),
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        ba_facebook_groups_id: {
            type: DataTypes.BIGINT(20),
        },
        user_id: {
            type: DataTypes.BIGINT(20),
        },
        site_id: {
            type: DataTypes.BIGINT(20),
        },
        activity: {
            type: DataTypes.STRING(256),
        },
        created_date: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updated_date:{
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'ba_facebook_group_link_activity',
        timestamps: false,
        underscored: true,
    });
    ba_facebook_group_link_activity.associate = function(models:any){
        ba_facebook_group_link_activity.belongsTo(models.baFacebookGroups, {
            foreignKey: 'ba_facebook_groups_id',
            targetKey: 'ba_facebook_groups_id'
        }),
        ba_facebook_group_link_activity.belongsTo(models.users, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        })
    }
    return ba_facebook_group_link_activity;
};
