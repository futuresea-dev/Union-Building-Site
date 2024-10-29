'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var affiliate_payouts: any = sequelize.define('affiliate_payouts', {
        affiliate_payout_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        affiliate_referral_ids: DataTypes.STRING(255),
        affiliate_id: DataTypes.INTEGER,
        amount: DataTypes.DOUBLE,
        payment_method: DataTypes.INTEGER,
        transaction_id: DataTypes.INTEGER,
        status: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        created_by: DataTypes.INTEGER,
        updated_datetime: DataTypes.DATE(),
        updated_by: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER
    },
        {
            tableName: 'affiliate_payouts',
            timestamps: false,
            underscored: true,
        });
    affiliate_payouts.associate = function (models: any) {
        affiliate_payouts.belongsTo(models.affiliates, {
            foreignKey: 'affiliate_id',
            targetKey: 'affiliate_id'
        });
        affiliate_payouts.hasMany(models.affiliateReferrals, {
            foreignKey: 'affiliate_referral_id',
            sourceKey: 'affiliate_referral_ids'
        });
        affiliate_payouts.belongsTo(models.users, {
            foreignKey: 'created_by',
            targetKey: 'user_id'
        });
    };
    return affiliate_payouts;
};
