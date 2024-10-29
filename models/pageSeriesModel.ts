'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var page_series: any = sequelize.define('page_series', {
        page_series_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        page_id: DataTypes.INTEGER,
        content_type_id: DataTypes.INTEGER,
        category_id: DataTypes.INTEGER,
        is_locked: DataTypes.INTEGER,
        is_coming_soon: DataTypes.INTEGER,
        is_selected: DataTypes.INTEGER,
        sort_order: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        created_datetime: DataTypes.TEXT(),
        updated_datetime: DataTypes.TEXT(),
        created_by: DataTypes.INTEGER,
        updated_by: DataTypes.INTEGER,
    }, {
        tableName: 'gc_page_series',
        timestamps: false,
        underscored: true,
    });
    page_series.associate = function (models: any) {
        page_series.belongsTo(models.categories, {
            foreignKey: 'category_id',
            targetKey: 'category_id'
        });
    };
    return page_series;
}