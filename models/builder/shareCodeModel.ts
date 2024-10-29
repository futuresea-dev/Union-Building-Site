module.exports = function (sequelize: any, DataTypes: any) {
    var build_share_code: any = sequelize.define('build_share_code', {
        build_share_code_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        user_id: DataTypes.INTEGER,
        share_content_id: DataTypes.INTEGER,
        share_content_type: DataTypes.TINYINT(1),
        code: DataTypes.STRING(256),
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
        public_code: DataTypes.STRING(20),
        is_deleted: DataTypes.INTEGER
    }, {
        tableName: 'gb_share_code',
        timestamps: false,
        underscored: true,
    });

    build_share_code.associate = function (models: any) {
        build_share_code.belongsTo(models.messageBuildList, {
            foreignKey: 'share_content_id',
            sourceKey: 'share_content_id'
        });
        build_share_code.belongsTo(models.volumeModel, {
            foreignKey: 'share_content_id',
            sourceKey: 'share_content_id'
        });
        build_share_code.belongsTo(models.seriesBuildList, {
            foreignKey: 'share_content_id',
            sourceKey: 'share_content_id'
        });

        build_share_code.belongsTo(models.buildElementsDetails, {
            foreignKey: 'share_content_id',
            sourceKey: 'share_content_id'
        });
    };
    return build_share_code;
};
