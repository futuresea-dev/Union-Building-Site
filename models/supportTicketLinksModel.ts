'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var ba_support_tickets_links: any = sequelize.define('ba_support_tickets_links', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        support_tickets_id: DataTypes.INTEGER,
        support_tickets_services_id: DataTypes.INTEGER,
        service_reference_id: DataTypes.INTEGER,
        is_source: DataTypes.TINYINT(1),
        url: DataTypes.TEXT,
        date_created: DataTypes.DATE()
    }, {
        tableName: 'ba_support_tickets_links',
        timestamps: false,
        underscored: true,
    });
    ba_support_tickets_links.associate = function (models: any) {
        // ba_support_tickets_links.belongsTo(models.users, {
        //     as: 'users',
        //     foreignKey: 'users_id',
        //     targetKey: 'user_id'
        // });
        ba_support_tickets_links.belongsTo(models.supportTicketServices, {
            foreignKey: 'support_tickets_services_id',
            targetKey: 'id'
        });
    };
    return ba_support_tickets_links;
};
