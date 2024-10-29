import { integer } from "aws-sdk/clients/cloudfront";
("use strict");
module.exports = function (sequelize: any, DataTypes: any) {
  var free_trial_product: any = sequelize.define(
    "free_trial_product",
    {
      product_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      product_title: DataTypes.TEXT(),
      product_logo: DataTypes.TEXT(),
      product_sub_logo: DataTypes.TEXT(),
      product_route: DataTypes.TEXT(),
      site_id: DataTypes.INTEGER,
      created_datetime: DataTypes.DATE(),
      updated_datetime: DataTypes.DATE(),
      is_deleted: DataTypes.INTEGER,
      is_active: DataTypes.INTEGER,
      sort_order: DataTypes.INTEGER,
    },
    {
      tableName: "free_trial_products",
      timestamps: false,
      underscored: true,
    }
  );
  free_trial_product.associate = function (models: any) {
    free_trial_product.belongsTo(models.sites, {
      foreignKey: "site_id",
      targetKey: "site_id",
    });
  };
  return free_trial_product;
};
