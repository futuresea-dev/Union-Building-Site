'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var ba_support_tickets_notes: any = sequelize.define('ba_support_tickets_notes', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        support_tickets_id: DataTypes.INTEGER,
        users_id: DataTypes.INTEGER,
        note: DataTypes.TEXT,
        date_created: DataTypes.DATE()
    }, {
        tableName: 'ba_support_tickets_notes',
        timestamps: false,
        underscored: true,
    });
    ba_support_tickets_notes.associate = function (models: any) {
        ba_support_tickets_notes.belongsTo(models.users, {
            foreignKey: 'users_id',
            targetKey: 'user_id'
        });        
    };
    return ba_support_tickets_notes;
};
