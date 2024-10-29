'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var sycu_users_email_history: any = sequelize.define('sycu_users_email_history', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        email: DataTypes.STRING(100),
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
        is_deleted: DataTypes.INTEGER,
    }, {
        tableName: 'sycu_users_email_history',
        timestamps: false,
        underscored: true,
    });

    sycu_users_email_history.associate = function (models: any) {
        sycu_users_email_history.belongsTo(models.users, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
    };
     
    return sycu_users_email_history;
};
