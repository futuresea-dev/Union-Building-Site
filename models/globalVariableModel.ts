'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var sycu_global_variable: any = sequelize.define('sycu_global_variable', {
        global_variable_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        variable_display_text: DataTypes.TEXT(),
        variable_replacement_identifier: DataTypes.STRING(50),
        description: DataTypes.TEXT(),
        is_deleted: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE,
    }, {
        tableName: 'sycu_global_variable',
        timestamps: false,
        underscored: true,
    });
    sycu_global_variable.associate = function (models: any) {
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
    return sycu_global_variable;
};
