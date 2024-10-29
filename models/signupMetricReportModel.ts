'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var signup_metric_report: any = sequelize.define('signup_metric_report', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        browser_info:DataTypes.TEXT(),
        ip:DataTypes.TEXT(),
        unique_id:DataTypes.TEXT(),
        site_config_id:DataTypes.INTEGER,
        url:DataTypes.TEXT(),
        is_registered:DataTypes.INTEGER,
        user_id:DataTypes.INTEGER,
        created_at:DataTypes.DATE,
        updated_at:DataTypes.DATE,
    }, {
        tableName: 'signup_metric_report',
        timestamps: false,
        underscored: true,
    });
    signup_metric_report.associate = function (models: any) {
        signup_metric_report.belongsTo(models.users, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
    };
    return signup_metric_report;
}


