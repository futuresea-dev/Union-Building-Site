'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var sycu_system_pages: any = sequelize.define('sycu_system_pages', {
        system_pages_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        json_value: DataTypes.TEXT(),
        site_id: DataTypes.INTEGER,
        page_title: DataTypes.STRING(255),
        page_type: DataTypes.INTEGER,
        page_sub_type: DataTypes.INTEGER,
        update_by: DataTypes.INTEGER,
        updated_datetime: DataTypes.DATE(),
        is_deleted: DataTypes.INTEGER,
    }, {
        tableName: 'sycu_system_pages',
        timestamps: false,
        underscored: true,
    });
    sycu_system_pages.associate = function (models: any) {
        sycu_system_pages.belongsTo(models.pageLink, {
            foreignKey: 'system_pages_id',
            targetKey: 'data_id'
        });
    };
    return sycu_system_pages;
};
