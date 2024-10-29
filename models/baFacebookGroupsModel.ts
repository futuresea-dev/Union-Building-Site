"use strict";
module.exports = function (sequelize: any, DataTypes: any) {
    var ba_facebook_groups: any = sequelize.define('ba_facebook_groups', {
        ba_facebook_groups_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        name: {
            type: DataTypes.STRING(256),
        },
        fb_group_url: DataTypes.TEXT(),
        ac_tag: DataTypes.INTEGER,
        sycu_url: DataTypes.TEXT(),
        created_date: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updated_date:{
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'ba_facebook_groups',
        timestamps: false,
        underscored: true,
    });
    return ba_facebook_groups;
};
