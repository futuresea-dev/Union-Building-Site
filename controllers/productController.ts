import { Request, Response } from "express";
import { ErrorController } from "../core/ErrorController";
import { SuccessResponse } from '../core/ApiResponse';
import { BadRequestError, ApiError } from '../core/ApiError';
import moment from "moment";
import { enumerationController } from "./enumerationController";
import { ActiveCampaignController } from "./thirdParty/activeCampaignController";
const { dbReader, dbWriter } = require('../models/dbConfig');
const { WickedReportsAPIs } = require('./thirdParty/WickedReportsAPIs');
const EC = new ErrorController();
const EnumObj = new enumerationController();
const ACObj = new ActiveCampaignController();

export class ProductController {

    /**
     * list all product folders
     * @param req 
     * @param res 
     */
    public async listAllProductFolders(req: Request, res: Response) {
        try {
            var reqBody = req.body, dbSequelize = dbReader.Sequelize, sqOperator = dbSequelize.Op;
            var row_offset = 0, row_limit = 10;

            if (reqBody.page_record) {
                row_limit = reqBody.page_record;
            }

            if (reqBody.page_no) {
                row_offset = reqBody.page_no;
            }

            var SearchCondition = sqOperator.ne, SearchData = null;

            if (reqBody.search) {
                SearchCondition = sqOperator.like;
                SearchData = "%" + reqBody.search + "%";
            }

            var data = await dbReader.productFolder.findAndCountAll({
                attributes: ["product_folder_id", "folder_name"],
                where: dbSequelize.and(
                    { is_deleted: 0 },
                    { folder_name: { [SearchCondition]: SearchData } }
                ),

                limit: row_limit,
                offset: row_offset,
                order: [['product_folder_id', 'DESC']]
            });

            var message = (data.count > 0) ? EC.success : EC.noDataFound;
            new SuccessResponse(message, {
                user: null,
                //@ts-ignore
                token: req.token,
                count: data.count,
                rows: data.rows
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    /**
    * list all product folders
    * @param req 
    * @param res 
    */
    public async listAllProductVolumes(req: Request, res: Response) {
        try {
            let data = await dbReader.categories.findAll({
                where: { is_deleted: 0, category_level: 0, category_id: { [dbReader.Sequelize.Op.notIn]: [7, 8] } },
                attributes: ['category_id', 'category_title', 'category_image', 'sort_order'],
                include: [{
                    separate: true,
                    model: dbReader.products,
                    where: { is_deleted: 0, site_id: 2 },
                    attributes: ['product_id']
                }]
            });
            data = JSON.parse(JSON.stringify(data));
            data.forEach((element: any) => {
                element.total_products = element.sycu_products.length;
                delete element.sycu_products;
            });
            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token,
                volumes: data
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    /**
     * get product folder
     * @param req 
     * @param res 
     */
    public async getProductFolder(req: Request, res: Response) {
        try {
            var reqBody = req.body;
            var productFolderId = (req.params.id) ? req.params.id : '';
            if (productFolderId) {
                var data = await dbReader.productFolder.findOne({
                    where: {
                        product_folder_id: productFolderId,
                        is_deleted: 0
                    }
                });
                var message = (data.length > 0) ? EC.success : EC.noDataFound;
                new SuccessResponse(message, {
                    user: null,
                    //@ts-ignore
                    token: req.token,
                    // count: data.count,
                    rows: data
                }).send(res);
            } else {
                throw new Error(EC.requiredFieldError);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    /**
     * Save folder of products
     * @param req 
     * @param res 
     */
    public async saveProductFolder(req: Request, res: Response) {

        try {
            var productFolderData;
            if (req.body.product_folder_id) {
                productFolderData = await dbWriter.productFolder.update({
                    folder_name: req.body.folder_name.trim(),
                    parent_folder_id: req.body.parent_folder_id,
                    updated_date: moment().unix(),
                }, {
                    where: { product_folder_id: req.body.product_folder_id }
                });

            } else {
                productFolderData = await dbWriter.productFolder.create({
                    folder_name: req.body.folder_name.trim(),
                    parent_folder_id: req.body.parent_folder_id,
                    created_date: moment().unix(),
                    updated_date: moment().unix(),
                });
            }
            new SuccessResponse(EC.errorMessage(EC.saveDataSuccess, ["Product folder"]), {
                user: null,
                //@ts-ignore
                token: req.token,
                count: productFolderData.count,
                rows: productFolderData.rows
            }).send(res);

        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    /**
     * Delete folder of products
     * @param req 
     * @param res 
     */
    public async deleteProductFolder(req: Request, res: Response) {

        try {
            var productFolderId = (req.params.id) ? req.params.id : '';
            if (productFolderId) {
                await dbWriter.productFolder.update({
                    is_deleted: 1,
                }, {
                    where: { product_folder_id: productFolderId }
                });

                await dbWriter.products.update({
                    product_folder_id: 0,
                }, {
                    where: { product_folder_id: productFolderId }
                });

                new SuccessResponse(EC.saveDataSuccess, {
                    user: null,
                    //@ts-ignore
                    token: req.token,
                    data: ''
                }).send(res);

            } else {
                throw new Error(EC.requiredFieldError);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
    /**
     * Listing of all products
     * @param req 
     * @param res 
     */
    public async listAllProducts(req: Request, res: Response) {
        try {
            let { category_id } = req.body;
            var reqBody = req.body, dbSequelize = dbReader.Sequelize, sqOperator = dbSequelize.Op;
            let site_id = reqBody.site_id, data: any;
            var row_offset = 0, row_limit = 10, orderBy = [], inStockSearch = {};
            var sortOrder = (reqBody.sort_order) ? reqBody.sort_order : 'DESC';
            var sortField = (reqBody.sort_field) ? reqBody.sort_field : 'product_id';
            if (sortField == 'site_title') {
                orderBy = [['sycu_site', 'title', sortOrder]]
            } else {
                orderBy = [[sortField, sortOrder]]
            }
            // var listProducts:any;
            if (reqBody.page_record) {
                row_limit = reqBody.page_record;
            }
            if (reqBody.page_no) {
                row_offset = (reqBody.page_no * reqBody.page_record) - reqBody.page_record;
            }
            var SearchCondition = sqOperator.ne, SearchData = null;
            var SearchPriceCondition = sqOperator.ne, SearchPriceData = null;
            if (reqBody.search) {
                SearchCondition = sqOperator.like;
                SearchPriceCondition = sqOperator.eq;
                SearchPriceData = reqBody.search;
                SearchData = "%" + reqBody.search + "%";
                if (reqBody.search.toLowerCase() == 'in stock') {
                    SearchData = 1;
                    inStockSearch = { in_stock: { [SearchCondition]: SearchData } };
                } else if (reqBody.search.toLowerCase() == 'not available') {
                    SearchData = 0;
                    inStockSearch = { in_stock: { [SearchCondition]: SearchData } };
                }
            }
            let categoryCond = dbReader.Sequelize.Op.ne, categoryData = null;
            if (category_id) {
                categoryCond = dbReader.Sequelize.Op.eq;
                categoryData = category_id;
            }

            if (reqBody.page_record && reqBody.page_no) {
                data = await dbReader.products.findAndCountAll({
                    where: dbSequelize.and(
                        { is_hidden: 0, is_deleted: 0, site_id: site_id, category_id: { [categoryCond]: categoryData } },
                        dbReader.Sequelize.or(
                            inStockSearch,
                            { product_price: { [SearchPriceCondition]: SearchPriceData } },
                            { product_name: { [SearchCondition]: SearchData } },
                        ),
                    ),
                    attributes: ['site_id', [dbReader.Sequelize.literal('`sycu_site`.`title`'), 'site_title'], 'in_stock', 'product_id', 'product_name', 'product_price', 'product_description', 'product_price', 'product_folder_id', 'product_duration', 'tax_in_percentage', 'tax_in_amount', 'shipping_fees', 'processing_fees', 'product_image', 'is_recurring_product', 'is_shippable', 'ministry_type', 'product_duration_type'],
                    include: [{
                        model: dbReader.sites,
                        attributes: []
                    }],
                    limit: row_limit,
                    offset: row_offset,
                    order: orderBy
                });
            } else {
                data = await dbReader.products.findAndCountAll({
                    where: dbSequelize.and(
                        { is_deleted: 0, site_id: site_id, category_id: { [categoryCond]: categoryData } },
                        dbReader.Sequelize.or(
                            inStockSearch,
                            { product_price: { [SearchPriceCondition]: SearchPriceData } },
                            { product_name: { [SearchCondition]: SearchData } },
                        ),
                    ),
                    attributes: ['site_id', [dbReader.Sequelize.literal('`sycu_site`.`title`'), 'site_title'], 'in_stock', 'product_id', 'product_name', 'product_price', 'product_description', 'product_price', 'product_folder_id', 'product_duration', 'tax_in_percentage', 'tax_in_amount', 'shipping_fees', 'processing_fees', 'product_image', 'is_recurring_product', 'is_shippable', 'ministry_type', 'product_duration_type'],
                    include: [{
                        model: dbReader.sites,
                        attributes: []
                    }],
                    order: orderBy
                });
            }

            var message = (data.count > 0) ? EC.success : EC.noDataFound;
            data = JSON.parse(JSON.stringify(data));
            data.rows.map(function (value: any, index: any) {
                value.in_stock = value.in_stock;
                value.created_date = moment.unix(value.created_date).format("MM/DD/YYYY");
            })

            new SuccessResponse(message, {
                //@ts-ignore
                token: req.token,
                count: data.count,
                rows: data.rows
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }


    /**
    * Display product details
    * @param req 
    * @param res 
    */
    public async getProductDetails(req: Request, res: Response) {
        try {
            var reqBody = req.body, dbSequelize = dbReader.Sequelize;
            var productId = (req.params.id) ? req.params.id : '';
            if (productId) {
                var data = await dbReader.products.findAndCountAll({
                    where: dbSequelize.and(
                        { is_deleted: 0 },
                        { product_id: productId }
                    ),
                    include: [{
                        required: false,
                        attributes: ["product_folder_id", "folder_name", "is_shippable", "ministry_type"],
                        model: dbReader.productFolder,
                    }],
                });

                var message = (data.count > 0) ? EC.success : EC.noDataFound;
                new SuccessResponse(message, {
                    user: null,
                    //@ts-ignore
                    token: req.token,
                    count: data.count,
                    rows: data.rows
                }).send(res);
            } else {
                throw new Error(EC.requiredFieldError);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    /**
    * Delete product
    * @param req 
    * @param res 
    */
    public async deleteProduct(req: Request, res: Response) {
        try {
            var productId = (req.body.product_id) ? req.body.product_id : '';
            if (productId) {
                let activeKidsMusicSubscriptions = await dbReader.userSubscription.findOne({
                    where: { subscription_status: [2, 4, 10] },
                    attributes: ['user_subscription_id'],
                    include: [{
                        separate: true,
                        attributes: ['user_subscription_item_id'],
                        model: dbReader.userSubscriptionItems,
                        where: { is_deleted: 0, item_type: 1 },
                        include: [{
                            required: true,
                            attributes: ['product_id'],
                            model: dbReader.products,
                            where: { is_deleted: 0, site_id: EnumObj.siteEnum.get('kids music').value }
                        }]
                    }]
                });
                if (activeKidsMusicSubscriptions.length) {
                    ApiError.handle(new BadRequestError("You Can't delete this product because this product is purchased by users."), res);
                } else {
                    await dbWriter.products.update({
                        is_deleted: 1,
                    }, {
                        where: { product_id: productId }
                    });
                    new SuccessResponse(EC.saveDataSuccess,
                        {
                            user: null,
                            //@ts-ignore
                            token: req.token,
                            data: ''
                        }).send(res);
                }
            } else {
                throw new Error(EC.requiredFieldError);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    /**
     * Save or update products
     * @param req 
     * @param res 
     */
    public async saveProducts(req: Request, res: Response) {
        try {
            let productData: any;
            let wickedReportProduct: any = [];
            let WickedReportsAPIsObj = new WickedReportsAPIs();

            if (req.body.product_id) {
                productData = await dbWriter.products.update({
                    product_name: req.body.product_name.trim(),
                    product_description: req.body.product_description,
                    product_price: req.body.product_price,
                    product_duration: req.body.product_duration,
                    product_image: req.body.product_image,
                    category_id: req.body.category_id || 0,
                    in_stock: req.body.in_stock,
                    site_id: req.body.site_id || 3,
                    tax_in_percentage: req.body.tax_in_percentage,
                    tax_in_amount: req.body.tax_in_amount,
                    ministry_type: req.body.ministry_type,
                    is_shippable: req.body.is_shippable,
                    shipping_fees: req.body.shipping_fees,
                    processing_fees: req.body.processing_fees,
                    is_recurring_product: req.body.is_recurring_product,
                    product_type: req.body.product_type,
                    is_ministry_page: req.body.is_ministry_page,
                    created_date: moment().unix(),
                    updated_date: moment().unix(),
                }, {
                    where: { product_id: req.body.product_id }
                });
                wickedReportProduct.push({
                    site_id: req.body.site_id || 3,
                    product_id: req.body.product_id,
                    product_name: req.body.product_name.trim(),
                    product_amount: req.body.product_price
                });
            } else {
                productData = await dbWriter.products.create({
                    product_name: req.body.product_name.trim(),
                    product_description: req.body.product_description,
                    product_price: req.body.product_price,
                    category_id: req.body.category_id || 0,
                    product_duration: req.body.product_duration,
                    product_image: req.body.product_image,
                    in_stock: req.body.in_stock,
                    site_id: req.body.site_id || 3,
                    tax_in_percentage: req.body.tax_in_percentage,
                    tax_in_amount: req.body.tax_in_amount,
                    shipping_fees: req.body.shipping_fees,
                    processing_fees: req.body.processing_fees,
                    is_recurring_product: req.body.is_recurring_product,
                    product_type: req.body.product_type || 1,
                    is_ministry_page: req.body.is_ministry_page || 0,
                    is_shippable: req.body.is_shippable,
                    ministry_type: req.body.ministry_type,
                    created_date: moment().unix(),
                    updated_date: moment().unix(),
                });
                wickedReportProduct.push({
                    site_id: req.body.site_id || 3,
                    product_id: productData.product_id,
                    product_name: req.body.product_name.trim(),
                    product_amount: req.body.product_price
                });
            }

            WickedReportsAPIsObj.CreateProduct(wickedReportProduct);
            let product_id = req.body.product_id ? req.body.product_id : productData.product_id;
            let label = req.body.product_name ? req.body.product_name.trim() : productData.product_name;

            try {
                if (req.body.product_type == 3 && req.body.site_id == EnumObj.siteEnum.get('kids music').value) {
                    let ac_tags = await dbReader.activeCampaignTags.findOne({
                        where: { site_id: EnumObj.siteEnum.get('kids music').value, data_id: product_id, is_deleted: 0 }
                    });
                    if (ac_tags) {
                        //update AC tag for music
                        ac_tags = JSON.parse(JSON.stringify(ac_tags));
                        if (ac_tags.tag_name != label) {
                            //====================== ActiveCampaign CODE==================//
                            let tag_name = label.replace("Song & Videos", "").trim();
                            let acTagData = {
                                id: ac_tags.tag_id,
                                tag: tag_name,
                                tagType: "contact",
                                description: req.body.product_description
                            }
                            await ACObj.updateActiveCampaignTag(acTagData);
                            await dbWriter.activeCampaignTags.update({
                                tag_name: tag_name
                            }, {
                                where: { sycu_ac_tag_id: ac_tags.sycu_ac_tag_id }
                            })
                        }
                    } else {
                        //create AC tag for music
                        //====================== ActiveCampaign CODE==================//
                        let tag_name = label.replace("Song & Videos", "").trim();
                        tag_name = "Customer - GKM " + tag_name;
                        let acTagData = {
                            tag: tag_name,
                            tagType: "contact",
                            description: req.body.product_description
                        }
                        let newACTag = await ACObj.createActiveCampaignTag(acTagData);
                        if (newACTag) {
                            await dbWriter.activeCampaignTags.create({
                                tag_id: newACTag.id,
                                tag_name: newACTag.tag,
                                tag_description: newACTag.description,
                                data_id: product_id,
                                site_id: req.body.site_id
                            })
                        }
                    }
                }
            } catch (err: any) {
                console.log(err.message);
            }

            new SuccessResponse(EC.errorMessage(EC.saveDataSuccess, ["Product"]), {
                //@ts-ignore
                token: req.token,
                count: productData.count || 0,
                rows: productData.rows || [],
                product_id: product_id,
                label: label,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    /**
     * confirm product details 
     * @param req 
     * @param res 
     */
    public async confirmProductDetails(req: Request, res: Response) {
        try {
            let { product_id, site_id, return_url } = req.body;
            let productList = await dbReader.products.findAll({
                where: {
                    site_id: site_id,
                    is_deleted: 0
                }
            })
            let message = typeof productList != undefined && productList.length > 0 ? EC.success : EC.noDataFound;
            new SuccessResponse(message, {
                //@ts-ignore
                token: req.token,
                product: productList.find((f: any) => f.product_id == product_id),
                site_product: productList,
                returnURL: return_url
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    /**
    * get of all products
    * @param req
    * @param res
    */
    public async getAllProducts(req: Request, res: Response) {
        try {
            let { site_id } = req.body;
            var dbSequelize = dbReader.Sequelize;
            var reqBody = req.body, dbSequelize = dbReader.Sequelize, sqOperator = dbSequelize.Op;
            var SearchCondition = sqOperator.ne, SearchData = null;

            if (reqBody.search) {
                SearchCondition = sqOperator.like;
                SearchData = "%" + reqBody.search + "%";
            }

            let siteIdCons = dbReader.Sequelize.Op.ne, siteIdData = null;
            if (site_id) {
                siteIdCons = dbReader.Sequelize.Op.eq;
                siteIdData = site_id;
            }

            var data = await dbReader.products.findAndCountAll({
                attributes: ["is_recurring_product", "product_name", "product_id", "site_id", "product_price", "in_stock", "product_image", "shipping_fees", "processing_fees", "is_shippable", "product_type", "product_duration"],
                where: dbSequelize.and(
                    { is_hidden: 0, is_deleted: 0, site_id: { [siteIdCons]: siteIdData } },
                    { product_name: { [SearchCondition]: SearchData } },
                    // { in_stock: 1 }
                ),
                order: [['product_id', 'DESC']]
            });

            var message = (data.count > 0) ? EC.success : EC.noDataFound;

            data.rows.map(function (value: any, index: any) {
                if (value.site_id == 1) {
                    value.site_id = "growCurriculum"
                }
            })
            new SuccessResponse(message, {
                user: null,
                //@ts-ignore
                token: req.token,
                count: data.count,
                rows: data.rows
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
}
