'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var sycu_app_visit_history: any = sequelize.define('sycu_app_visit_history', {
        app_visit_history_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        site_id: DataTypes.INTEGER,
        user_id: DataTypes.INTEGER,
        is_online: DataTypes.INTEGER,
        create_datetime: DataTypes.DATE,
        last_access_datetime: DataTypes.DATE
    }, {
        tableName: 'sycu_app_visit_history',
        timestamps: false,
        underscored: true,
    });
    sycu_app_visit_history.associate = function (models: any) {
        sycu_app_visit_history.belongsTo(models.users, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
    };
    return sycu_app_visit_history;
};
