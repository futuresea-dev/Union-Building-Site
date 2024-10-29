'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var ba_support_tickets: any = sequelize.define('ba_support_tickets', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        subject: DataTypes.TEXT,
        description: DataTypes.TEXT,
        applications_id: DataTypes.INTEGER,
        support_tickets_statuses_id: DataTypes.INTEGER,
        support_tickets_types_id: DataTypes.INTEGER,
        users_id: DataTypes.INTEGER,
        added_by: DataTypes.INTEGER,
        date_created: DataTypes.DATE(),
        date_updated: DataTypes.DATE()
    }, {
        tableName: 'ba_support_tickets',
        timestamps: false,
        underscored: true,
    });
    ba_support_tickets.associate = function (models: any) {
        ba_support_tickets.belongsTo(models.users, {
            foreignKey: 'users_id',
            targetKey: 'user_id',
            as: 'users'
        });
        ba_support_tickets.belongsTo(models.users, {
            foreignKey: 'added_by',
            targetKey: 'user_id',
            as: 'addedByUsers'
        });
        ba_support_tickets.belongsTo(models.supportTicketStatus, {
            foreignKey: 'support_tickets_statuses_id',
            targetKey: 'id'
        });
        ba_support_tickets.belongsTo(models.supportTicketTypes, {
            foreignKey: 'support_tickets_types_id',
            targetKey: 'id'
        });
        ba_support_tickets.belongsTo(models.supportTicketApplications, {
            foreignKey: 'applications_id',
            targetKey: 'id'
        });
        ba_support_tickets.hasMany(models.supportTicketAssignees, {
            foreignKey: 'support_tickets_id',
            targetKey: 'id'
        });
        ba_support_tickets.hasMany(models.supportTicketLinks, {
            foreignKey: 'support_tickets_id',
            targetKey: 'id'
        });
    };
    return ba_support_tickets;
};
