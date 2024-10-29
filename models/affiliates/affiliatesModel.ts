'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var affiliates: any = sequelize.define('affiliates', {
        affiliate_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        user_id: DataTypes.INTEGER,
        affiliate_code: DataTypes.STRING(15),
        rate_type: DataTypes.INTEGER,
        rate: DataTypes.DOUBLE,
        first_renewal_rate: DataTypes.DOUBLE,
        second_renewal_rate: DataTypes.DOUBLE,
        consecutive_renewal_rate: DataTypes.DOUBLE,
        renewal_level: DataTypes.INTEGER,
        status: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
        is_deleted: DataTypes.INTEGER,
        is_curriculum: DataTypes.INTEGER,
        is_grow_con: DataTypes.INTEGER,
        grow_con_expire_time: DataTypes.DATE(),
        two_plus_year_commission_rate: DataTypes.DOUBLE,
        two_plus_year_commission_rate_type: DataTypes.INTEGER
    }, {
        tableName: 'affiliates',
        timestamps: false,
        underscored: true,
    });
    affiliates.associate = function (models: any) {
        affiliates.belongsTo(models.users, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        affiliates.hasMany(models.affiliateVisits, {
            foreignKey: 'affiliate_id',
            targetKey: 'affiliate_id'
        });
        affiliates.hasMany(models.affiliateReferrals, {
            foreignKey: 'affiliate_id',
            targetKey: 'affiliate_id'
        });
        affiliates.hasMany(models.affiliatePayouts, {
            foreignKey: 'affiliate_id',
            targetKey: 'affiliate_id'
        });
    };

    return affiliates;
};
