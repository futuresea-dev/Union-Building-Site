'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var hub_reactions: any = sequelize.define('gh_reactions', {
        reaction_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        user_id: DataTypes.INTEGER,
        parent_id: DataTypes.INTEGER,
        parent_type: DataTypes.INTEGER,
        reaction: DataTypes.STRING(50),
        updated_user_id: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
    }, {
        tableName: 'gh_reactions',
        timestamps: false,
        underscored: true,
    });
    hub_reactions.associate = function (models: any) {
        hub_reactions.belongsTo(models.users, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
        // hub_reactions.hasMany(models.users, {
        //     foreignKey: 'user_id',
        //     targetKey: 'user_id'
        // });

    };
    return hub_reactions;
}