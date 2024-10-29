'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var sycu_live_chat: any = sequelize.define('sycu_live_chat_archives', {
        archive_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        chat_id: DataTypes.STRING(255),
        users_data: DataTypes.TEXT,
        chat_data: DataTypes.TEXT,
        created_at:DataTypes.DATE(),
        updated_at:DataTypes.DATE(),
    }, {
        tableName: 'sycu_live_chat_archives',
        timestamps: false,
        underscored: true,
    });
    sycu_live_chat.associate = function (models: any) {
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
    return sycu_live_chat;
};
