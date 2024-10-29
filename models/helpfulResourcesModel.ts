'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var helpful_resources: any = sequelize.define('helpful_resources', {
        resource_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        title: DataTypes.TEXT(),
        description: DataTypes.TEXT(),
        cta_type: DataTypes.INTEGER,
        cta_text: DataTypes.TEXT(),
        cta_link: DataTypes.TEXT(),
        image_url: DataTypes.TEXT(),
        ministry_type: DataTypes.INTEGER,
        sort_order: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        created_by: DataTypes.INTEGER,
        created_datetime: DataTypes.STRING(255),
        updated_datetime: DataTypes.STRING(255),
    }, {
        tableName: 'free_trial_helpful_resources',
        timestamps: false,
        underscored: true,
    });
    return helpful_resources;
}