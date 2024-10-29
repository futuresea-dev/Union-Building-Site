'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var series_email: any = sequelize.define('series_email', {
        series_email_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        category_id: DataTypes.INTEGER,
        series_page_title: DataTypes.TEXT(),
        series_type: DataTypes.INTEGER,
        week_number: DataTypes.INTEGER,
        mail_chimp_id: DataTypes.INTEGER,
        mail_chimp_redirect_url: DataTypes.TEXT(),
        mail_chimp_json: DataTypes.TEXT(),
        mail_chimp_link: DataTypes.TEXT(),
        page_content: DataTypes.TEXT(),
        page_content_link: DataTypes.TEXT(),
        is_deleted: DataTypes.INTEGER,
        created_datetime: DataTypes.STRING(255),
        updated_datetime: DataTypes.STRING(255),
        created_by: DataTypes.INTEGER,
        updated_by: DataTypes.INTEGER,
    }, {
        tableName: 'gc_series_email',
        timestamps: false,
        underscored: true,
    });
    series_email.associate = function (models: any) {
        series_email.belongsTo(models.pageLink, {
            foreignKey: 'series_email_id',
            targetKey: 'data_id'
        });
    };
    return series_email;
}