module.exports = function (sequelize: any, DataTypes: any) {
    var grow_together_intake_form: any = sequelize.define('grow_together_intake_form', {
        grow_together_intake_form_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },  
        user_id: DataTypes.INTEGER,
        status: DataTypes.TINYINT,
        is_deleted: DataTypes.TINYINT,
        created_datetime: DataTypes.DATE(),
        updated_datetime: DataTypes.DATE(),
        created_by: DataTypes.INTEGER,
        updated_by: DataTypes.INTEGER,
        mastermind_group: DataTypes.TINYINT,
        no_of_volunteers: DataTypes.INTEGER,
        no_of_kid_student: DataTypes.INTEGER,
        reference_mastermind_group: DataTypes.TEXT,
        call_schedule: DataTypes.TEXT,
        is_leader: DataTypes.INTEGER,
    },{
        tableName: 'grow_together_intake_form',
        timestamps: false,
        underscored: true,
    });
    grow_together_intake_form.associate = function (models: any) {
        grow_together_intake_form.belongsTo(models.users, {
            foreignKey: 'user_id',
            targetKey: 'user_id'
        });
    };
    return grow_together_intake_form;
}