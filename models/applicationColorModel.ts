'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var application_color: any = sequelize.define('application_color', {
        application_color_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        application_color_name: DataTypes.STRING(500),
        application_color_hex: DataTypes.STRING(500),
        application_color_type: DataTypes.INTEGER,
        ministry_type: DataTypes.INTEGER,
        sort_order: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        created_by: DataTypes.INTEGER,
        created_datetime: DataTypes.STRING(255),
        updated_datetime: DataTypes.STRING(255),
    }, {
        tableName: 'free_trial_application_color',
        timestamps: false,
        underscored: true,
    });
    return application_color;
}
