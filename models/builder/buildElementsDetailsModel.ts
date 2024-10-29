'use strict'
module.exports = function (sequelize: any, DataTypes: any) {
    var sycu_build_elements_details: any = sequelize.define('sycu_build_elements_details', {
        build_elements_details_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true
        },
        build_list_id: DataTypes.INTEGER,
        build_elements_id: DataTypes.INTEGER,
        title: DataTypes.STRING(),
        extra_title: DataTypes.STRING(),
        extra_title_1: DataTypes.STRING(),
        content: DataTypes.STRING(),
        extra_content: DataTypes.STRING(),
        extra_content_1: DataTypes.STRING(),
        media_url: DataTypes.STRING(),
        sortable_order: DataTypes.INTEGER,
        build_type: DataTypes.INTEGER,
        is_series: DataTypes.INTEGER,
        is_collapsed: DataTypes.INTEGER,
        is_visible: DataTypes.INTEGER,
        is_delete: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE,
        updated_datetime: DataTypes.DATE
    }, {
        tableName: 'gb_build_elements_details',
        timestamps: false,
        underscored: true
    });
    sycu_build_elements_details.associate = function (models: any) {
        // sycu_users.belongsTo(models.company, {
        //     as: 'company',
        //     foreignKey: 'company_id',
        //     targetKey: 'company_id'
        // });
        sycu_build_elements_details.hasMany(models.messageBuildList, {
            foreignKey: 'message_build_list_id',
            sourceKey: 'build_list_id'
        });
        sycu_build_elements_details.hasMany(models.buildElements, {
            foreignKey: 'build_elements_id',
            sourceKey: 'build_elements_id'
        });
        sycu_build_elements_details.hasMany(models.seriesBuildList, {
            foreignKey: 'series_build_list_id',
            sourceKey: 'build_list_id'
        });
    };
    return sycu_build_elements_details;
}