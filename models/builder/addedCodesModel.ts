'use strict'
module.exports = function (sequelize: any, DataTypes: any) {
    var sycu_added_codes: any = sequelize.define('sycu_added_codes', {
        added_code_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true
        },
        user_id: DataTypes.INTEGER,
        build_id: DataTypes.INTEGER,
        build_type: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE,
        updated_datetime: DataTypes.DATE
    }, {
        tableName: 'gb_added_codes',
        timestamps: false,
        underscored: true
    });
    return sycu_added_codes;
}