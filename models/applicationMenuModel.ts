'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var sycu_application_menu: any = sequelize.define('sycu_application_menu', {
        application_menu_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        application_menu_title: DataTypes.TEXT(),
        icon: DataTypes.STRING(255),
        parent_application_menu_id: DataTypes.INTEGER,
        site_id: DataTypes.INTEGER,
        menu_type: DataTypes.INTEGER,
        system_pages_id: DataTypes.INTEGER,
        link: DataTypes.TEXT(),
        is_public: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
        is_deleted: DataTypes.INTEGER,
        is_active: DataTypes.INTEGER,
        is_tool: DataTypes.INTEGER,
        sort_order: DataTypes.INTEGER
    }, {
        tableName: 'sycu_application_menu',
        timestamps: false,
        underscored: true,
    });
    sycu_application_menu.associate = function (models: any) {           
        sycu_application_menu.belongsTo(models.systemPages, {
            foreignKey: 'system_pages_id',
            targetKey: 'system_pages_id'
        });
    };
    return sycu_application_menu;
};
