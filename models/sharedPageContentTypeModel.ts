'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var sycu_shared_page_content_type: any = sequelize.define('sharedPageContentType', {
        page_menu_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        shared_page_id: DataTypes.INTEGER,
        content_type_id: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE()
    }, {
        tableName: 'sycu_shared_page_content_type',
        timestamps: false,
        underscored: true,
    });
    sycu_shared_page_content_type.associate = function (models: any) {
        sycu_shared_page_content_type.hasMany(models.contentMeta, {
            foreignKey: 'content_type_id',
            sourceKey: 'content_type_id'
        });
    }
    return sycu_shared_page_content_type;
};
