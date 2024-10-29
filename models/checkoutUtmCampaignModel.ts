'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var checkout_utm_campaign: any = sequelize.define('checkout_utm_campaign', {
        utm_campaign_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        user_subscription_id: DataTypes.INTEGER,
        user_id: DataTypes.INTEGER,
        utm_campaign: DataTypes.STRING(512),
        utm_source: DataTypes.STRING(512),
        utm_medium: DataTypes.STRING(512),
        utm_content: DataTypes.STRING(512),
        created_date: DataTypes.DATE(),
        updated_date: DataTypes.DATE(),
    }, {
        tableName: 'checkout_utm_campaign',
        timestamps: false,
        underscored: true,
    });
    checkout_utm_campaign.associate = function (models: any) {
        checkout_utm_campaign.belongsTo(models.userSubscription, {
            foreignKey: 'user_subscription_id',
            targetKey: 'user_subscription_id'
        });
    }
    return checkout_utm_campaign;
};
