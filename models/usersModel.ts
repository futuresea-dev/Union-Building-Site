'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var sycu_users: any = sequelize.define('sycu_users', {
        user_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        first_name: DataTypes.STRING(50),
        last_name: DataTypes.STRING(50),
        username: DataTypes.STRING(50),
        password: DataTypes.STRING(500),
        email: DataTypes.STRING(100),
        user_role: DataTypes.INTEGER,
        status: DataTypes.INTEGER,
        via_portal: DataTypes.INTEGER,
        via_platform: DataTypes.INTEGER,
        mobile: DataTypes.STRING(20),
        display_name: DataTypes.STRING(20),
        ministry_level: DataTypes.STRING(30),
        profile_image: DataTypes.STRING(512),
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
        is_deleted: DataTypes.INTEGER,
        ac_status: DataTypes.INTEGER,
        activecampaign_contact_id: DataTypes.INTEGER,
        ac_final_status: DataTypes.INTEGER,
        utm_campaign: DataTypes.STRING(512),
        utm_source: DataTypes.STRING(512),
        utm_medium: DataTypes.STRING(512),
        utm_content: DataTypes.STRING(512),
        country_code: DataTypes.STRING(10),
        // is_free_trial_user: DataTypes.INTEGER,
        fte_coupon_version: DataTypes.INTEGER,
        onboarding_created_datetime: DataTypes.DATE(),
        onboarding_updated_datetime: DataTypes.DATE(),
        //name: {
        //    type: DataTypes.VIRTUAL,
        //    get: function () {
        //      const firstName = this.first_name; // Prints out the right value
        //      const lastName= this.getDataValue('last_name'); // Prints out the right value      
        //      const name = firstName +" "+ lastName;
        //      return name;
        //     }
        //  },        
    }, {
        tableName: 'sycu_users',
        timestamps: false,
        underscored: true,
    });
    sycu_users.associate = function (models: any) {
        sycu_users.hasMany(models.userLoginLogs, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        sycu_users.hasMany(models.userSocialLogs, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        sycu_users.hasMany(models.userSubscription, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        sycu_users.hasMany(models.userMemberships, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        sycu_users.hasMany(models.userOrder, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        sycu_users.hasMany(models.userAddress, {
            as: 'shippingAddress',
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        sycu_users.hasOne(models.stripeCustomer, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        sycu_users.hasMany(models.userAddress, {
            as: 'billingAddress',
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        sycu_users.hasMany(models.games, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        sycu_users.hasMany(models.attachment, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        sycu_users.hasMany(models.filters, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        sycu_users.hasMany(models.giFilters, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        sycu_users.hasMany(models.favouritedGames, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        sycu_users.hasMany(models.playedGames, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        sycu_users.hasMany(models.mostViewedGames, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        sycu_users.hasMany(models.ratings, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        sycu_users.hasMany(models.gameNotes, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        sycu_users.hasMany(models.transactionMaster, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        sycu_users.belongsTo(models.userAddress, {
            as: 'billingAddressOne',
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        sycu_users.belongsTo(models.userAddress, {
            as: 'shippingAddressOne',
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        sycu_users.belongsTo(models.appVisitHistory, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        sycu_users.hasMany(models.affiliates, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        sycu_users.belongsTo(models.affiliates, {
            as: 'affiliateUser',
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        sycu_users.hasMany(models.affiliatePayouts, {
            foreignKey: 'created_by',
            targetKey: 'created_by'
        });
        sycu_users.hasMany(models.userEmailsHistory, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        sycu_users.belongsTo(models.userSubscription, {
            as: 'user_subscription_check',
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        sycu_users.hasMany(models.userSubscription, {
            as: 'all_user_subscription',
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        sycu_users.hasMany(models.checkoutUtmCampaignModel, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        sycu_users.belongsTo(models.checkoutUtmCampaignModel, {
            as: 'check_utm_campaign',
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        sycu_users.belongsTo(models.church, {
            foreignKey: 'church_id',
            targetKey: 'church_id'
        });
    };
    return sycu_users;
};
