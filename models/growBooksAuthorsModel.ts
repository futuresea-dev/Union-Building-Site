"use strict";
module.exports = function (sequelize: any, DataTypes: any) {
  var grow_books_authors: any = sequelize.define("grow_books_authors",
    {
      book_author_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      author_name: DataTypes.STRING(255),
      author_description: DataTypes.TEXT(),
      author_image: DataTypes.TEXT(),
      author_status: DataTypes.INTEGER,
      sort_order: DataTypes.INTEGER,
      is_deleted: DataTypes.INTEGER,
      created_by: DataTypes.INTEGER,
      updated_by: DataTypes.INTEGER,
      created_datetime: DataTypes.STRING(255),
      updated_datetime: DataTypes.STRING(255),
    },
    {
      tableName: "grow_books_authors",
      timestamps: false,
      underscored: true,
    }
  );
  return grow_books_authors;
};
