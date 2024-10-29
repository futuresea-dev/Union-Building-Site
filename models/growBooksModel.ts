"use strict";
module.exports = function (sequelize: any, DataTypes: any) {
  var grow_books: any = sequelize.define("grow_books",
    {
      book_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      book_name: DataTypes.STRING(255),
      book_category: DataTypes.STRING(255),
      book_author: DataTypes.STRING(255),
      book_description: DataTypes.TEXT(),
      book_image: DataTypes.TEXT(),
      book_price: DataTypes.DOUBLE,
      book_button_label: DataTypes.TEXT(),
      book_button_destination_link: DataTypes.TEXT(),
      book_status: DataTypes.INTEGER,
      age_category: DataTypes.INTEGER,
      book_author_id: DataTypes.INTEGER,
      book_category_id: DataTypes.INTEGER,
      sort_order: DataTypes.INTEGER,
      is_deleted: DataTypes.INTEGER,
      created_by: DataTypes.INTEGER,
      updated_by: DataTypes.INTEGER,
      created_datetime: DataTypes.STRING(255),
      updated_datetime: DataTypes.STRING(255),
    },
    {
      tableName: "grow_books",
      timestamps: false,
      underscored: true,
    }
  );
  grow_books.associate = function (models: any) {
    grow_books.belongsTo(models.growBooksAuthor, {
      foreignKey: "book_author_id",
      targetKey: "book_author_id",
    });
    grow_books.belongsTo(models.growBooksCategory, {
        foreignKey: "book_category_id",
        targetKey: "book_category_id",
      });
  };
  return grow_books;
};
