'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var church: any = sequelize.define('sycu_church', {
        church_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        church_name: DataTypes.STRING(500),
        church_location: DataTypes.STRING(500),
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
        is_deleted: DataTypes.TINYINT,
        created_user_id: DataTypes.INTEGER,
    }, {
        tableName: 'sycu_church',
        timestamps: false,
        underscored: true,
    });
    church.associate = function (models: any) {
        church.hasMany(models.users, {
            foreignKey: 'church_id',
            targetKey: 'church_id'
        });
    };
    return church;
};
