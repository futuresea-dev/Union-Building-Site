'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var affiliate_referrals: any = sequelize.define('affiliate_referrals', {
        affiliate_referral_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        affiliate_id: DataTypes.INTEGER,
        affiliate_visit_id: DataTypes.INTEGER,
        referral_user_id: DataTypes.INTEGER,
        notes: DataTypes.TEXT,
        amount: DataTypes.DOUBLE,
        user_subscription_id: DataTypes.STRING(255),
        type: DataTypes.INTEGER,
        status: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
        is_deleted: DataTypes.INTEGER,
        rate_type: DataTypes.INTEGER,
        rate: DataTypes.DOUBLE,
        affiliate_source: DataTypes.INTEGER,
    }, {
        tableName: 'affiliate_referrals',
        timestamps: false,
        underscored: true,
    });
    affiliate_referrals.associate = function (models: any) {
        affiliate_referrals.belongsTo(models.affiliates, {
            foreignKey: 'affiliate_id',
            targetKey: 'affiliate_id'
        });
        affiliate_referrals.hasMany(models.affiliatePayouts, {
            foreignKey: 'affiliate_referral_ids',
            targetKey: 'affiliate_referral_ids'
        });
        affiliate_referrals.belongsTo(models.affiliateVisits, {
            foreignKey: 'affiliate_visit_id',
            targetKey: 'affiliate_visit_id'
        });
        affiliate_referrals.belongsTo(models.users, {
            foreignKey: 'referral_user_id',
            targetKey: 'user_id'
        });
    };
    return affiliate_referrals;
};
