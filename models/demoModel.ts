'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var sycu_demo: any = sequelize.define('sycu_demo', {
        demo_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        first_name: DataTypes.STRING(50),
        last_name: DataTypes.STRING(50)
    }, {
        tableName: 'sycu_demo',
        timestamps: false,
        underscored: true,
    });
    sycu_demo.associate = function (models: any) {
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
    return sycu_demo;
};
