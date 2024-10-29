'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var affiliate_configurations: any = sequelize.define('affiliate_configurations', {
        affiliate_configuration_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        rate_type: DataTypes.INTEGER,
        rate: DataTypes.DOUBLE,
        first_renewal_rate: DataTypes.DOUBLE,
        second_renewal_rate: DataTypes.DOUBLE,
        consecutive_renewal_rate: DataTypes.DOUBLE,
        renewal_level: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
        is_deleted: DataTypes.INTEGER
    },
        {
            tableName: 'affiliate_configurations',
            timestamps: false,
            underscored: true,
        });
    affiliate_configurations.associate = function (models: any) {
        // affiliate_configurations.belongsTo(models.sites, {
        //     foreignKey: 'site_id',
        //     targetKey: 'site_id'
        // });
    };
    return affiliate_configurations;
};
