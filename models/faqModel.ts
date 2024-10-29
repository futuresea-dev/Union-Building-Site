
'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
  var sycu_faq: any = sequelize.define('sycu_faq', {
    faq_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    site_id: DataTypes.INTEGER,
    title: DataTypes.TEXT(),
    content: DataTypes.TEXT(),
    sort_order: DataTypes.INTEGER,
    is_deleted: DataTypes.INTEGER,
    created_datetime: DataTypes.DATE(),
    updated_datetime: DataTypes.DATE(),
    created_by: DataTypes.INTEGER,
    updated_by: DataTypes.INTEGER,
  }, {
    tableName: 'sycu_faq',
    timestamps: false,
    underscored: true,
  });
  sycu_faq.associate = function (models: any) {
  };
  return sycu_faq;
}