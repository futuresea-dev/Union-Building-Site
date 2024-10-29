'use strict';
// AH 04-1-21
module.exports = function (sequelize: any, DataTypes: any) {
    var gh_attachments: any = sequelize.define('gh_attachments', {
        hub_attachment_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        parent_id: DataTypes.INTEGER,
        user_id: DataTypes.INTEGER,
        parent_type: DataTypes.INTEGER,
        attachments: DataTypes.TEXT(),        
        is_deleted: DataTypes.INTEGER,        
        created_date: DataTypes.DATE,
        updated_date: DataTypes.DATE,
	attachment_name: DataTypes.TEXT(),  
    }, {
        tableName: 'gh_attachments',
        timestamps: false,
        underscored: true,
    });
    gh_attachments.associate = function (models: any) {
        // sycu_users.belongsTo(models.company, {
        //     as: 'company',
        //     foreignKey: 'company_id',
        //     targetKey: 'company_id'
        // });
        // sycu_users.hasMany(models.inspector_expenses, {
        //     foreignKey: 'inspector_user_id',
        //     targetKey: 'user_id'
        // });
    };
    return gh_attachments;
};
