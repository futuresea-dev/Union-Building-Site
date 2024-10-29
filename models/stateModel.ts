'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var state: any = sequelize.define('stateModel', {
        state_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        country_id: DataTypes.INTEGER,
        name: DataTypes.STRING(255),
        state_code: DataTypes.STRING(255),        
        
    }, {
        tableName: 'sycu_state',
        timestamps: false,
        underscored: true,
    });
    state.associate = function (models: any) {        
        // state.hasMany(models.state, {
        //     foreignKey: 'country_id',
        //     targetKey: 'country_id'
        // });

       
    };
    return state;
};