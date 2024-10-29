module.exports = function (sequelize: any, DataTypes: any) {
    var sycuGrowTogetherMeetup: any = sequelize.define('sycu_grow_together_meetup', {
        meetup_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        meetup_title: DataTypes.STRING(255),
        meetup_link: DataTypes.STRING(255),
        participants_limit: DataTypes.INTEGER,
        meetup_datetime: DataTypes.DATE(),
        meetup_category: DataTypes.INTEGER,
        meetup_type: DataTypes.INTEGER,
        created_by: DataTypes.INTEGER,
        updated_by: DataTypes.INTEGER,
        is_deleted: DataTypes.TINYINT,
        zoom_meeting_id: DataTypes.INTEGER,
        is_approved: DataTypes.TINYINT,
        is_proposal: DataTypes.TINYINT,
        created_datetime: DataTypes.DATE(),
        deleted_datetime: DataTypes.DATE(),
    }, {
        tableName: 'sycu_grow_together_meetup',
        timestamps: false,
        underscored: true,
    });
    sycuGrowTogetherMeetup.associate = function (models: any) {
        sycuGrowTogetherMeetup.hasMany(models.sycuGrowTogetherMeetupParticipants, {
            foreignKey: 'meetup_id',
            targetKey: 'meetup_id',
            sourceKey: 'meetup_id'
        });
        sycuGrowTogetherMeetup.belongsTo(models.sycuGrowTogetherMeetupParticipants, {
            as: 'self_registration',
            foreignKey: 'meetup_id',
            targetKey: 'meetup_id'
        });
    };
    return sycuGrowTogetherMeetup;
}