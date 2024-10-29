module.exports = function (sequelize: any, DataTypes: any) {
    var sycu_stripe_customer: any = sequelize.define('sycu_stripe_customer', {
        sycu_stripe_customer_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        user_id: DataTypes.INTEGER,
        site_payment_service_id: DataTypes.INTEGER,
        site_id: DataTypes.INTEGER,
        stripe_customer_id: DataTypes.STRING(20),
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE()
    }, {
        tableName: 'sycu_stripe_customer',
        timestamps: false,
        underscored: true,
    });
    sycu_stripe_customer.associate = function (models: any) {
        sycu_stripe_customer.hasMany(models.userCard, {
            foreignKey: 'stripe_customer_id',
            targetKey: 'stripe_customer_id'
        });
        sycu_stripe_customer.belongsTo(models.users, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
    };
    return sycu_stripe_customer;
};
