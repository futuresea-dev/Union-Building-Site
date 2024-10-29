'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var notes: any = sequelize.define('sycu_notes', {
        note_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        type: DataTypes.TINYINT,
        event_type_id: DataTypes.TINYINT,
        message: DataTypes.TEXT(),
        is_system: DataTypes.TINYINT,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
        is_deleted: DataTypes.TINYINT,
        is_customer: DataTypes.TINYINT,
        is_pinned: DataTypes.TINYINT,
        user_id:DataTypes.INTEGER
    }, {
        tableName: 'sycu_notes',
        timestamps: false,
        underscored: true,
    });
    notes.associate = function (models: any) {

    };
    return notes;
};
