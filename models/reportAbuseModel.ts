/*
    * Code done by Sh - 20-01-2022
    * create model for gg_report_abuse
*/
'use strict'
module.exports = function (sequelize: any, DataTypes: any) {

    let gg_report_abuse: any = sequelize.define('gg_report_abuse', {
        report_abuse_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        game_attachment_id: DataTypes.INTEGER,
        user_id: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE()
    },
        {
            tableName: 'gg_report_abuse',
            timestamps: false,
            underscored: true,
        });

        gg_report_abuse.associate = function (models: any) {
            gg_report_abuse.belongsTo(models.users, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        gg_report_abuse.belongsTo(models.attachment, {
            foreignKey: 'game_attachment_id',
            targetKey: 'game_attachment_id'
        });
    }
    return gg_report_abuse;
}