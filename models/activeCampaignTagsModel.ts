'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var acTags: any = sequelize.define('sycu_active_campaign_tags', {
        sycu_ac_tag_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        tag_id: DataTypes.INTEGER,
        tag_name: DataTypes.STRING(500),
        tag_description: DataTypes.TEXT(),
        data_id: DataTypes.INTEGER,
        site_id: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        created_datetime: DataTypes.TEXT(),
    }, {
        tableName: 'sycu_active_campaign_tags',
        timestamps: false,
        underscored: true,
    });
    return acTags;
}
