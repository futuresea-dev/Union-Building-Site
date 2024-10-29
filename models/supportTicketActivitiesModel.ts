'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var ba_support_tickets_activity: any = sequelize.define('ba_support_tickets_activity', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        activity: DataTypes.TEXT,
        support_tickets_id: DataTypes.INTEGER,
        users_id: DataTypes.INTEGER,
        date_created: DataTypes.DATE()
    }, {
        tableName: 'ba_support_tickets_activity',
        timestamps: false,
        underscored: true,
    });
    ba_support_tickets_activity.associate = function (models: any) {
        ba_support_tickets_activity.belongsTo(models.users, {
            foreignKey: 'users_id',
            targetKey: 'user_id'
        });
    };
    return ba_support_tickets_activity;
};
