'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var message_buildlist: any = sequelize.define('message_buildlist', {
        message_build_list_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        user_id: DataTypes.INTEGER,
        build_folder_id: DataTypes.INTEGER,
        build_title: DataTypes.STRING(256),
        build_sub_title: DataTypes.STRING(256),
        is_default_build: DataTypes.TINYINT(1),
        is_demo_build: DataTypes.TINYINT(1),
        media_url: DataTypes.TEXT,
        sortable_order: DataTypes.INTEGER(11),
        build_type: DataTypes.TINYINT(1),
        is_deleted: DataTypes.TINYINT(1),
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
        is_auto_saved: DataTypes.INTEGER,
        restore_point_title: DataTypes.STRING(),
        is_added_by_code: DataTypes.INTEGER,
        original_parent_id: DataTypes.INTEGER,
        is_from: DataTypes.INTEGER,
    },
        {
            tableName: 'gb_message_buildlist',
            timestamps: false,
            underscored: true,
        });

    message_buildlist.associate = function (models: any) {


    };
    return message_buildlist;
};