'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var sycu_email_services: any = sequelize.define('sycu_email_services', {
        email_service_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        server_type: DataTypes.STRING(50),
        credential_setup: DataTypes.TEXT(),
        format: DataTypes.TEXT(),
        updated_datetime: DataTypes.STRING(255)
    }, {
        tableName: 'sycu_email_services',
        timestamps: false,
        underscored: true,
    });
    sycu_email_services.associate = function (models: any) {
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
    return sycu_email_services;
};
