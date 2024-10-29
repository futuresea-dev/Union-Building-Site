'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var sycu_share_all_pages: any = sequelize.define('sycu_share_all_pages', {
        share_all_page_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        sender_user_id: DataTypes.INTEGER,
        receiver_user_id: DataTypes.INTEGER,
        receiver_user_name: DataTypes.STRING(500),
        receiver_user_email: DataTypes.TEXT,
        is_share_all_kids: DataTypes.TINYINT,
        is_share_all_students: DataTypes.TINYINT,
        is_share_all_groups: DataTypes.TINYINT,
        is_deleted: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE()
    }, {
        tableName: 'sycu_share_all_pages',
        timestamps: false,
        underscored: true,
    });
    sycu_share_all_pages.associate = function (models: any) {
        sycu_share_all_pages.hasMany(models.users, {
            foreignKey: 'user_id',
            sourceKey: 'sender_user_id'
        });
        sycu_share_all_pages.hasMany(models.users, {
            as: 'share_user',
            foreignKey: 'user_id',
            sourceKey: 'receiver_user_id'
        });
    }
    return sycu_share_all_pages;
};
