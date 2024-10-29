'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var content_type: any = sequelize.define('content_type', {
        content_type_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        content_type_title: DataTypes.TEXT(),
    }, {
        tableName: 'gc_content_type',
        timestamps: false,
        underscored: true,
    });
    content_type.associate = function (models: any) {
        content_type.hasMany(models.contentMeta, {
            foreignKey: 'content_type_id',
            targetKey: 'content_type_id'
        });
    };
    return content_type;
}