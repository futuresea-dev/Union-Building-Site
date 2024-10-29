'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var gs_grow_con_videoes: any = sequelize.define('gs_grow_con_videoes', {
        grow_con_video_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        title: DataTypes.STRING(255),
        video_url: DataTypes.TEXT(),
        thumbnail_url: DataTypes.TEXT(),
        grow_con_folder_id: DataTypes.INTEGER,
        product_id: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
        is_deleted: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    }, {
        tableName: 'gs_grow_con_videoes',
        timestamps: false,
        underscored: true,
    });

    gs_grow_con_videoes.associate = function (models: any) {
    };

    return gs_grow_con_videoes;
};
