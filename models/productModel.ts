'use strict';
module.exports = function (sequelize: any, DataTypes: any) {
    var sycu_product: any = sequelize.define('sycu_products', {
        product_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        product_name: DataTypes.STRING(255),
        product_description: DataTypes.TEXT,
        product_price: DataTypes.DOUBLE,
        product_duration: DataTypes.INTEGER,
        product_folder_id: DataTypes.INTEGER,
        category_id: DataTypes.INTEGER,
        product_image: DataTypes.TEXT,
        in_stock: DataTypes.INTEGER,
        site_id: DataTypes.INTEGER,
        tax_in_percentage: DataTypes.INTEGER,
        tax_in_amount: DataTypes.DOUBLE,
        shipping_fees: DataTypes.DOUBLE,
        processing_fees: DataTypes.DOUBLE,
        is_deleted: DataTypes.INTEGER,
        is_recurring_product: DataTypes.INTEGER,
        created_date: DataTypes.STRING(255),
        updated_date: DataTypes.STRING(255),
        ministry_type: DataTypes.INTEGER,
        is_ministry_page: DataTypes.INTEGER,
        is_shippable: DataTypes.TINYINT(1),
        product_type: DataTypes.TINYINT(1),
        product_duration_type: DataTypes.TINYINT(1),
        is_hidden: DataTypes.TINYINT(1),
    }, {
        tableName: 'sycu_products',
        timestamps: false,
        underscored: true,
    });
    sycu_product.associate = function (models: any) {
        sycu_product.belongsTo(models.productFolder, {
            foreignKey: 'product_folder_id',
            targetKey: 'product_folder_id'
        });
        sycu_product.belongsTo(models.sites, {
            foreignKey: 'site_id',
            targetKey: 'site_id'
        });
        sycu_product.hasMany(models.membershipProduct, {
            foreignKey: 'product_id',
            targetKey: 'product_id'
        });
        sycu_product.belongsTo(models.categories, {
            foreignKey: 'category_id',
            sourceKey: 'category_id'
        });
        sycu_product.belongsTo(models.userOrderItems, {
            foreignKey: 'product_id',
            targetKey: 'product_id'
        });
    };
    return sycu_product;
};
