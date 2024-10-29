// Sm 8-12-21

module.exports = function (sequelize: any, DataTypes: any) {
    var systemThirdPartyService: any = sequelize.define('sycu_system_third_party_service', {
        system_third_party_service_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        third_party_service_type: DataTypes.INTEGER,
        site_id: DataTypes.INTEGER,
        is_active: DataTypes.INTEGER,
        json_value: DataTypes.JSON,
        create_datetime: DataTypes.DATE()
    }, {
        tableName: 'sycu_system_third_party_service',
        timestamps: false,
        underscored: true,
    });
    systemThirdPartyService.associate = function (models: any) {

    };
    return systemThirdPartyService;
};