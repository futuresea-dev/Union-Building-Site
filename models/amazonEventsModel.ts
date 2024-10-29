'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var sycu_amazon_events: any = sequelize.define('sycu_amazon_events', {
        amazon_events_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        title: DataTypes.STRING(255),
        sub_title: DataTypes.TEXT(),
        description: DataTypes.TEXT(),
        image_url: DataTypes.STRING(255),
        color_code: DataTypes.STRING(255),
        html_code: DataTypes.TEXT(),
        is_deleted: DataTypes.INTEGER,
        create_by: DataTypes.INTEGER,
        create_datetime: DataTypes.DATE(),
        update_by: DataTypes.INTEGER,
        updated_datetime: DataTypes.DATE(),
        type: DataTypes.INTEGER,
        type_id: DataTypes.INTEGER,
    }, {
        tableName: 'sycu_amazon_events',
        timestamps: false,
        underscored: true,
    });
    sycu_amazon_events.associate = function (models: any) {
        sycu_amazon_events.belongsTo(models.pageLink, {
            foreignKey: 'amazon_events_id',
            targetKey: 'data_id'
        });
    };
    return sycu_amazon_events;
};
