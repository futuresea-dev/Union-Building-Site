'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var hub_sms_short_link: any = sequelize.define('gh_sms_short_link', {
        short_link_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        sms_short_link: DataTypes.STRING(512),
        short_code: DataTypes.STRING(20),
        original_link: DataTypes.STRING(255),
        hits_count: DataTypes.INTEGER,
        created_date: DataTypes.DATE(),
    }, {
        tableName: 'gh_sms_short_link',
        timestamps: false,
        underscored: true,
    });
    hub_sms_short_link.associate = function (models: any) {
        
    };
    return hub_sms_short_link;
}