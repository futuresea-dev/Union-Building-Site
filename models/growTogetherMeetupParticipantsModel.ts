module.exports = function (sequelize: any, DataTypes: any) {
    var sycuGrowTogetherMeetupParticipants: any = sequelize.define('sycu_grow_together_meetup_participants', {
        meetup_participants_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        meetup_id:DataTypes.INTEGER,
        user_id:DataTypes.INTEGER,
        status:DataTypes.INTEGER,
        created_by: DataTypes.INTEGER,
        updated_by: DataTypes.INTEGER,
        is_deleted: DataTypes.TINYINT,
        created_datetime: DataTypes.DATE(),
        deleted_datetime: DataTypes.DATE(),
    }, {
        tableName: 'sycu_grow_together_meetup_participants',
        timestamps: false,
        underscored: true,
    });
    sycuGrowTogetherMeetupParticipants.associate = function (models: any) {
        sycuGrowTogetherMeetupParticipants.belongsTo(models.sycuGrowTogetherMeetup, {
            foreignKey: 'meetup_id',
            targetKey: 'meetup_id'
        });
        sycuGrowTogetherMeetupParticipants.belongsTo(models.users, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
    };
    return sycuGrowTogetherMeetupParticipants;
}