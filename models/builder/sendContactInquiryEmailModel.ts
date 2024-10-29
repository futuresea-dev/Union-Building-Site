module.exports = function (sequelize: any, DataTypes: any) {
    var gb_send_contact_inquiry_email: any = sequelize.define('gb_send_contact_inquiry_email', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        user_id: DataTypes.INTEGER,
        subject: DataTypes.STRING(256),
        description: DataTypes.STRING(256),
        is_deleted: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
    }, {
        tableName: 'gb_contact_inquiry_emails',
        timestamps: false,
        underscored: true,
    });

    // build_share_code.associate = function (models: any) {
    //     build_share_code.belongsTo(models.messageBuildList, {
    //         foreignKey: 'share_content_id',
    //         sourceKey: 'share_content_id'
    //     });
    //     build_share_code.belongsTo(models.volumeModel, {
    //         foreignKey: 'share_content_id',
    //         sourceKey: 'share_content_id'
    //     });
    //     build_share_code.belongsTo(models.seriesBuildList, {
    //         foreignKey: 'share_content_id',
    //         sourceKey: 'share_content_id'
    //     });
    // };
    return gb_send_contact_inquiry_email;
};
