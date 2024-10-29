'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var memberships: any = sequelize.define('sycu_memberships', {
        membership_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        page_id: DataTypes.INTEGER,
        site_id: DataTypes.INTEGER,
        membership_name: DataTypes.STRING(255),
        slug: DataTypes.STRING(255),
        membership_type: DataTypes.INTEGER,
        status: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
        is_deleted: DataTypes.INTEGER,
        ministry_type: DataTypes.INTEGER,
        is_ministry_page: DataTypes.INTEGER,
    }, {
        tableName: 'sycu_memberships',
        timestamps: false,
        underscored: true,
    });
    memberships.associate = function (models: any) {
        memberships.hasMany(models.membershipProduct, {
            foreignKey: 'membership_id',
            targetKey: 'membership_id'
        });
        memberships.hasMany(models.userMemberships, {
            foreignKey: 'membership_id',
            targetKey: 'membership_id'
        });
        memberships.belongsTo(models.userMemberships, {
            as: 'userMember',
            foreignKey: 'membership_id',
            targetKey: 'membership_id'
        });
        memberships.belongsTo(models.pages, {
            foreignKey: 'page_id',
            targetKey: 'page_id'
        });
        memberships.belongsTo(models.sites, {
            foreignKey: 'site_id',
            targetKey: 'site_id'
        });
    };
    return memberships;
};
