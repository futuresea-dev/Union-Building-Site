'use strict'
module.exports = function (sequelize: any, DataTypes: any) {
    var sycu_build_elements: any = sequelize.define('gb_build_elements', {
        build_elements_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        build_elements_name: DataTypes.STRING(),
        hex_color: DataTypes.STRING(),
        icon: DataTypes.STRING(),
        element_type: DataTypes.INTEGER,
        //is_tools: DataTypes.INTEGER,
        element_category: DataTypes.INTEGER,
        is_system: DataTypes.INTEGER,
        user_id: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE,
        updated_datetime: DataTypes.DATE
    }, {
        tableName: 'gb_build_elements',
        timestamps: false,
        underscored: true
    });
    sycu_build_elements.associate = function (models: any) {
        sycu_build_elements.hasMany(models.buildElementsDetails, {
            foreignKey: 'build_elements_id',
            targetKey: 'build_elements_id'
        });
    };
    return sycu_build_elements;
}