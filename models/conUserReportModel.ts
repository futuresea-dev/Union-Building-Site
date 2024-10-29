'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var con_user_report: any = sequelize.define('con_user_report', {
        con_user_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        site_config_id:DataTypes.INTEGER,
        browser_info:DataTypes.TEXT(),
        ip:DataTypes.TEXT(),
        unique_id:DataTypes.TEXT(),
        url:DataTypes.TEXT(),
        is_registered:DataTypes.INTEGER,
        user_id:DataTypes.INTEGER,
        created_at:DataTypes.DATE,
        updated_at:DataTypes.DATE,
    }, {
        tableName: 'con_user_report',
        timestamps: false,
        underscored: true,
    });
    con_user_report.associate = function (models: any) {
        con_user_report.belongsTo(models.users, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
    };
    return con_user_report;
}