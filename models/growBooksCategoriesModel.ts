"use strict";
module.exports = function (sequelize: any, DataTypes: any) {
  var grow_books_categories: any = sequelize.define("grow_books_categories",
    {
      book_category_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      category_name: DataTypes.STRING(255),
      category_description: DataTypes.TEXT(),
      category_status: DataTypes.INTEGER,
      sort_order: DataTypes.INTEGER,
      is_deleted: DataTypes.INTEGER,
      created_by: DataTypes.INTEGER,
      updated_by: DataTypes.INTEGER,
      created_datetime: DataTypes.STRING(255),
      updated_datetime: DataTypes.STRING(255),
    },
    {
      tableName: "grow_books_categories",
      timestamps: false,
      underscored: true,
    }
  );
  return grow_books_categories;
};
