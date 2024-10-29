'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var sycu_con_user_details: any = sequelize.define('sycu_con_user_details', {
        con_user_detail_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        user_id:DataTypes.INTEGER,
        is_registered:DataTypes.INTEGER,
        cruise_sweepstakes:DataTypes.INTEGER,
        event_type:DataTypes.INTEGER,
        event_date: DataTypes.DATE(),
        utm_campaign:DataTypes.STRING(255),
        utm_source:DataTypes.STRING(255),
        utm_medium:DataTypes.STRING(255),
        utm_term:DataTypes.STRING(255),
        utm_content:DataTypes.TEXT(),
        created_date: DataTypes.DATE(),
    }, {
        tableName: 'sycu_con_user_details',
        timestamps: false,
        underscored: true,
    });
    sycu_con_user_details.associate = function (models: any) {
        sycu_con_user_details.belongsTo(models.users, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
    };
    return sycu_con_user_details;
};