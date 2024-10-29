module.exports = function (sequelize: any, DataTypes: any) {
    var order_notes: any = sequelize.define('sycu_notes', {
        note_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        type: DataTypes.INTEGER,
        event_type_id: DataTypes.STRING(256),
        message: DataTypes.STRING(256),
        is_system: DataTypes.TINYINT,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
        is_deleted: DataTypes.INTEGER,
        is_customer: DataTypes.INTEGER,
        is_pinned: DataTypes.TINYINT,
        user_id:DataTypes.INTEGER
    }, {
        tableName: 'sycu_notes',
        timestamps: false,
        underscored: true,
    });
    order_notes.associate = function (models: any) {
        order_notes.hasMany(models.userSubscription, {
            foreignKey: 'user_subscription_id',
            sourceKey: 'event_type_id'
        });
    };
    return order_notes;
};
