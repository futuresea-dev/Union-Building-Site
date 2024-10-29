'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var page_link: any = sequelize.define('page_link', {
        page_link_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        data_id: DataTypes.INTEGER,
        detail_id: DataTypes.INTEGER,
        site_id: DataTypes.INTEGER,
        keyword: DataTypes.TEXT(),
        target_url: DataTypes.TEXT(),
        ui_component: DataTypes.TEXT(), // 1=page_link - (Page), 2=series_email_link - (series-email), 3=game_link - (game), 4 = tip_video_link (tip-videos), 5 = Series Details Link - (series-details), 6 = Amazon Internal Link - (amazon-internal), 7 = Amazon External Link - (amazon-external), 8 = Memory Verses Link - (memory-verses), 9 = General External Link - (general-external)
        link_type: DataTypes.INTEGER, // 1=page_link - (Page), 2=series_email_link - (series-email), 3=game_link - (game), 4 = tip_video_link (tip-videos), 5 = Series Details Link - (series-details), 6 = Amazon Internal Link - (amazon-internal), 7 = Amazon External Link - (amazon-external), 8 = Memory Verses Link - (memory-verses), 9 = General External Link - (general-external)
        total_hits: DataTypes.INTEGER,
        is_disable: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE,
        updated_datetime: DataTypes.DATE,
        redirection_folder_id: DataTypes.INTEGER,
        wp_redirection_id: DataTypes.INTEGER
    }, {
        tableName: 'gc_page_link',
        timestamps: false,
        underscored: true,
    });
    page_link.associate = function (models: any) {
        page_link.belongsTo(models.sites, {
            foreignKey: 'site_id',
            targetKey: 'site_id'
        });
    };
    return page_link;
}
