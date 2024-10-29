'use strict'
module.exports = function (sequelize: any, DataTypes: any) {
    var sycu_notes: any = sequelize.define('sycu_notes', {
        note_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true
        },
        user_id: DataTypes.INTEGER,
        type_id: DataTypes.INTEGER,
        note_description: DataTypes.STRING(),
        type: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE,
        updated_datetime: DataTypes.DATE
    }, {
        tableName: 'gb_notes',
        timestamps: false,
        underscored: true
    });
    sycu_notes.associate = function (models: any) {
        sycu_notes.belongsTo(models.messageBuildList, {
            foreignKey: 'type_id',
            sourceKey: 'type_id'
        });
        // sycu_notes.belongsTo(models.volumeModel, {
        //     foreignKey: 'type_id',
        //     sourceKey: 'type_id'
        // });
        sycu_notes.belongsTo(models.seriesBuildList, {
            foreignKey: 'type_id',
            sourceKey: 'type_id'
        });
    };
    return sycu_notes;
}