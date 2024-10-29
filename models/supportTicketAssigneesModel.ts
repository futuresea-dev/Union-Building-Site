'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var ba_support_tickets_assignees: any = sequelize.define('ba_support_tickets_assignees', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        support_tickets_id: DataTypes.INTEGER,
        users_id: DataTypes.INTEGER,
        date_created: DataTypes.DATE()
    }, {
        tableName: 'ba_support_tickets_assignees',
        timestamps: false,
        underscored: true,
    });
    ba_support_tickets_assignees.associate = function (models: any) {
        ba_support_tickets_assignees.belongsTo(models.users, {
            foreignKey: 'users_id',
            targetKey: 'user_id'
        });
    };
    return ba_support_tickets_assignees;
};
