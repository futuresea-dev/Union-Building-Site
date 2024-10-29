'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var disputedEvidence: any = sequelize.define('disputed_evidence', {
        evidence_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        dispute_id: DataTypes.INTEGER,
        user_id: DataTypes.INTEGER,
        evidence_data: DataTypes.TEXT,
        dispute: DataTypes.TEXT,        
    }, {
        tableName: 'sycu_disputed_evidence',
        timestamps: false,
        underscored: true,
    });
    return disputedEvidence;
};