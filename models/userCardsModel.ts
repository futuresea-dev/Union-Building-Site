module.exports = function (sequelize: any, DataTypes: any) {
    var userCard: any = sequelize.define('userCard', {
        pg_customer_card_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        site_id: DataTypes.INTEGER,
        user_id: DataTypes.INTEGER,
        stripe_customer_id: DataTypes.STRING(20),
        stripe_card_id: DataTypes.STRING(20),
        fingerprint: DataTypes.STRING(20),
        card_type: DataTypes.STRING(20),
        card_no: DataTypes.INTEGER,
        is_auto: DataTypes.INTEGER,
        card_holder_name: DataTypes.STRING(20),
        site_payment_service_id: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
        is_deleted: DataTypes.INTEGER,
        delete_reason: DataTypes.TEXT(),
    }, {
        tableName: 'sycu_payment_gateway_customer_card',
        timestamps: false,
        underscored: true,
    });
    userCard.associate = function (models: any) {
        userCard.belongsTo(models.sites, {
            foreignKey: 'site_id',
            targetKey: 'site_id'
        });
    };
    return userCard;
};
