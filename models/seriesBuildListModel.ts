module.exports = function (sequelize: any, DataTypes: any) {
    var seriesBuildList: any = sequelize.define('gb_series_buildlist', {
        series_build_list_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        user_id: DataTypes.INTEGER,
        volume_id: DataTypes.INTEGER,
        series_id: DataTypes.INTEGER,
        series_buildlist_title: DataTypes.STRING(),
        series_buildlist_content: DataTypes.STRING(),
        media_url: DataTypes.STRING(1),
        sortable_order: DataTypes.INTEGER,
        hex_color: DataTypes.INTEGER,
        is_visible: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
        is_added_by_code: DataTypes.INTEGER
    }, {
        tableName: 'gb_series_buildlist',
        timestamps: false,
        underscored: true,
    });

    seriesBuildList.associate = function (models: any) {


    };
    return seriesBuildList;
};
