module.exports=function(sequelize:any, DataTypes:any){
    var grow_tv_videos: any = sequelize.define('grow_tv_videos',{
        grow_tv_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true
        },
        volume_id: DataTypes.INTEGER,
        ministry_type_id: DataTypes.INTEGER,
        series_id: DataTypes.INTEGER,
        tv_category_id: DataTypes.INTEGER,
        parent_category_id: DataTypes.INTEGER,
        video_title: DataTypes.TEXT,
        thumbnail_image: DataTypes.TEXT,
        video_url: DataTypes.TEXT,
        duration: DataTypes.STRING,
        created_datetime: DataTypes.DATE,
        updated_datetime: DataTypes.DATE,
        created_by: DataTypes.INTEGER,
        updated_by: DataTypes.INTEGER,
        is_deleted: DataTypes.INTEGER
    },
    {
        tableName: 'grow_tv_videos',
        timestamps: false,
        underscored: true,
    });
    grow_tv_videos.associate = function (models: any) {
        grow_tv_videos.belongsTo(models.categories, {
            foreignKey: 'tv_category_id',
            targetKey: 'category_id'
        })
        grow_tv_videos.belongsTo(models.users, {
            foreignKey: 'created_by',
            targetKey: 'user_id'
        });
        grow_tv_videos.belongsTo(models.categories, {
            as: "videoSeries",
            foreignKey: 'series_id',
            targetKey: 'category_id'
        });
        grow_tv_videos.belongsTo(models.categories, {
            as: "videoVolume",
            foreignKey: 'volume_id',
            targetKey: 'category_id'
        });
    };
    return grow_tv_videos;
}
