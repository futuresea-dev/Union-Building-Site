'use strict'

module.exports = function (sequelize: any, DataTypes: any) {

    let gg_featured_cards: any = sequelize.define('gg_featured_cards', {
        featured_card_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true
        },
        user_id: DataTypes.INTEGER,
        fc_description: DataTypes.TEXT(),
        fc_title: DataTypes.TEXT(),
        fc_name: DataTypes.TEXT(),
        fc_type: DataTypes.INTEGER,
        fc_type_value: DataTypes.TEXT(),
        is_popular: DataTypes.INTEGER,
        is_user_filter: DataTypes.INTEGER,
        fc_title_color: DataTypes.INTEGER,
        fc_description_color: DataTypes.INTEGER,
        fc_color1: DataTypes.INTEGER,
        fc_color2: DataTypes.INTEGER,
        fc_image: DataTypes.TEXT(),
        is_deleted: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
    },
        {
            tableName: 'gg_featured_cards',
            timestamps: false,
            underscored: true,
        });

    gg_featured_cards.associate = function (models: any) {
        gg_featured_cards.belongsTo(models.users, {
            foreignKey: 'user_id',
            targetKey: 'user_id',
        });
    };
    return gg_featured_cards;
}