'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var sycu_shared_pages: any = sequelize.define('shared_pages', {
        shared_page_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        sender_user_id: DataTypes.INTEGER,
        receiver_user_id: DataTypes.INTEGER,
        receiver_user_name: DataTypes.TEXT,
        receiver_user_email: DataTypes.TEXT,
        ministry_type: DataTypes.INTEGER,
        membership_id: DataTypes.INTEGER,
        page_id: DataTypes.INTEGER,
        site_id: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE()
    }, {
        tableName: 'sycu_shared_pages',
        timestamps: false,
        underscored: true,
    });
    sycu_shared_pages.associate = function (models: any) {
        sycu_shared_pages.hasMany(models.sharedPagesContentTypes, {
            foreignKey: 'shared_page_id',
            sourceKey: 'shared_page_id'
        });
        sycu_shared_pages.belongsTo(models.users, {
            as: 'single_sender',
            foreignKey: 'sender_user_id',
            targetKey: 'user_id'
        });
        sycu_shared_pages.hasMany(models.users, {
            foreignKey: 'user_id',
            sourceKey: 'sender_user_id'
        });
        sycu_shared_pages.hasMany(models.users, {
            as: 'share_user',
            foreignKey: 'user_id',
            sourceKey: 'receiver_user_id'
        });
        sycu_shared_pages.hasMany(models.membership, {
            foreignKey: 'membership_id',
            sourceKey: 'membership_id'
        });
    }
    return sycu_shared_pages;
};
