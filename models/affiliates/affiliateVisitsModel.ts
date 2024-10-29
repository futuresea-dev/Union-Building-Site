'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var affiliate_visits: any = sequelize.define('affiliate_visits', {
        affiliate_visit_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        affiliate_id: DataTypes.INTEGER,
        referral_user_id: DataTypes.INTEGER,
        url: DataTypes.STRING(255),
        referrer: DataTypes.STRING(255),
        ip_address: DataTypes.STRING(255),
        created_datetime: DataTypes.DATE(),
    },
        {
            tableName: 'affiliate_visits',
            timestamps: false,
            underscored: true,
        });
    affiliate_visits.associate = function (models: any) {
        affiliate_visits.belongsTo(models.affiliates, {
            foreignKey: 'affiliate_id',
            targetKey: 'affiliate_id'
        });
        affiliate_visits.belongsTo(models.users, {
            foreignKey: 'referral_user_id',
            sourceKey: 'user_id'
        });
        affiliate_visits.hasMany(models.affiliateReferrals, {
            foreignKey: 'affiliate_visit_id',
            targetKey: 'affiliate_visit_id'
        });
        affiliate_visits.belongsTo(models.users, {
            foreignKey: 'referral_user_id',
            targetKey: 'user_id'
        });
    };
    return affiliate_visits;
};
