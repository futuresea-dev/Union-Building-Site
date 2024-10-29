import { Request, Response } from "express";
import { ErrorController } from "../../core/ErrorController";
import { SuccessResponse } from '../../core/ApiResponse';
import { BadRequestError, ApiError, AuthFailureError } from '../../core/ApiError';
import { getDateRange } from '../../helpers/helpers';
import moment from "moment";
const { dbReader, dbWriter } = require('../../models/dbConfig');
const { Op } = dbReader.Sequelize;
const EC = new ErrorController();

export class productReportController {
    // public async getProductSoldList(req: Request, res: Response) {
    //     try {
    //         let { current_date_range } = req.body;
    //         let { past_date_range } = req.body;

    //         let { sort_field, sort_order } = req.body;

    //         //Pagination
    //         var limit = req.body.page_record == undefined ? 10 : parseInt(req.body.page_record);
    //         var offset = req.body.page_no == undefined ? 1 : parseInt(req.body.page_no);
    //         // Automatic Offset and limit will set on the base of page number
    //         var row_limit = limit;
    //         var row_offset = (offset * limit) - limit;


    //         //Searching
    //         var searchCondition = dbReader.Sequelize.Op.ne, searchData = null;
    //         if (req.body.search) {
    //             searchCondition = Op.like;
    //             searchData = '%' + req.body.search + '%';
    //         }

    //         if (sort_field == 'product_id') {
    //             sort_field = dbReader.sequelize.literal('`sycu_products`.`product_id`');
    //         } else if (sort_field == 'product_name') {
    //             sort_field = dbReader.sequelize.literal('`sycu_products`.`product_name`');
    //         } else if (sort_field == 'net_sale') {
    //             sort_field = dbReader.Sequelize.fn("SUM", dbReader.Sequelize.literal('`user_order_item`.`product_amount`'));
    //         } else if (sort_field == 'item_sold') {
    //             sort_field = dbReader.Sequelize.fn("COUNT", dbReader.Sequelize.literal('`user_order_item`.`product_id`'));
    //         } else if (sort_field == 'orders') {
    //             sort_field = dbReader.sequelize.literal('`user_order_item->user_order`.`user_orders_id`');
    //         } else sort_field = sort_field;
    //         sort_field = sort_field ? sort_field : dbReader.sequelize.literal('`user_order_item->user_order`.`created_datetime`');
    //         sort_order = sort_order ? sort_order : 'DESC';


    //         let includeCondition = [{
    //             required: true,
    //             model: dbReader.userOrderItems,
    //             attributes: [],
    //             where: { item_type: 1 },
    //             include: [
    //                 {
    //                     required: true,
    //                     model: dbReader.userOrder,
    //                     where: {
    //                         order_status: [2,3,4,5,6,8]
    //                     },
    //                     attributes: [],
    //                     include: [{
    //                         required: true,
    //                         model: dbReader.transactionMaster,
    //                         where: { status: "Success" },
    //                         attributes: []
    //                     }]
    //                 }
    //             ]
    //         }];

    //         let whereCondition = dbReader.sequelize.and(
    //                 dbReader.Sequelize.and(
    //                     dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_order_item->user_order`.`created_datetime`'), '%Y-%m-%d'), { [Op.gte]: current_date_range.start_date }),
    //                     dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_order_item->user_order`.`created_datetime`'), '%Y-%m-%d'), { [Op.lte]: current_date_range.end_date })
    //                 ),
    //             { is_deleted: 0 },
    //             // filterWhere,
    //             dbReader.Sequelize.or(
    //                 { product_id: { [searchCondition]: searchData } },
    //                 { product_name: { [searchCondition]: searchData } },
    //                 // { product_price: { [searchCondition]: searchData } }
    //             )
    //         );


    //         let yearData = await dbReader.products.findAndCountAll({
    //             attributes: ['product_id', 'product_name',
    //                 [dbReader.Sequelize.fn("SUM", dbReader.Sequelize.literal('`user_order_item`.`product_amount`')), 'net_sale'],
    //                 [dbReader.Sequelize.fn("COUNT", dbReader.Sequelize.literal('`user_order_item`.`product_id`')), 'item_sold'],
    //                 [dbReader.Sequelize.fn("COUNT", dbReader.Sequelize.literal('`user_order_item->user_order`.`user_orders_id`')), 'orders'],
    //                 [dbReader.Sequelize.literal('`user_order_item->user_order`.`created_datetime`'), 'created_datetime'],
    //             ],
    //             where: whereCondition,
    //             include: includeCondition,
    //             offset: row_offset,
    //             limit: row_limit,
    //             order: [[sort_field, sort_order]],
    //             group: ['user_order_item.product_id']
    //         })
    //         yearData = JSON.parse(JSON.stringify(yearData));

    //         let item_sold = 0, product_count = 0, net_sale = 0, orders = 0;
    //         yearData.rows.filter((e: any) => {
    //             item_sold += e.item_sold;
    //             product_count++;
    //             net_sale += e.net_sale;
    //             orders += e.orders;

    //         });

    //         if (yearData.rows.length > 0) {
    //             new SuccessResponse(EC.success, {
    //                 count: yearData.count.length,
    //                 rows: yearData.rows,
    //                 item_sold,
    //                 product_count,
    //                 net_sale,
    //                 orders
    //             }).send(res);
    //         }
    //         else {
    //             new SuccessResponse(EC.noDataFound, {
    //                 count: 0,
    //                 rows: [],
    //                 item_sold: 0,
    //                 product_count: 0,
    //                 net_sale: 0,
    //                 orders: 0
    //             }).send(res);
    //         }
    //         // let productData = await 
    //     } catch (e: any) {
    //         ApiError.handle(new BadRequestError(e.message), res);
    //     }
    // }



    //    ---->>>> NEW
    // public async getProductSoldList(req: Request, res: Response) {
    //     try {
    //         let { current_date_range } = req.body;
    //         let { past_date_range } = req.body;

    //         let { sort_field, sort_order } = req.body;

    //         //Pagination
    //         var limit = req.body.page_record == undefined ? 10 : parseInt(req.body.page_record);
    //         var offset = req.body.page_no == undefined ? 1 : parseInt(req.body.page_no);
    //         // Automatic Offset and limit will set on the base of page number
    //         var row_limit = limit;
    //         var row_offset = (offset * limit) - limit;


    //         //Searching
    //         var searchCondition = dbReader.Sequelize.Op.ne, searchData = null;
    //         if (req.body.search) {
    //             searchCondition = Op.like;
    //             searchData = '%' + req.body.search + '%';
    //         }

    //         if (sort_field == 'product_id') {
    //             sort_field = dbReader.sequelize.literal('`sycu_products`.`product_id`');
    //         } else if (sort_field == 'product_name') {
    //             sort_field = dbReader.sequelize.literal('`sycu_products`.`product_name`');
    //         } else if (sort_field == 'net_sale') {
    //             sort_field = dbReader.Sequelize.fn("SUM", dbReader.Sequelize.literal('`user_order_item`.`product_amount`'));
    //         } else if (sort_field == 'item_sold') {
    //             sort_field = dbReader.Sequelize.fn("COUNT", dbReader.Sequelize.literal('`user_order_item`.`product_id`'));
    //         } else if (sort_field == 'orders') {
    //             sort_field = dbReader.sequelize.literal('`user_order_item->user_order`.`user_orders_id`');
    //         } else sort_field = sort_field;
    //         sort_field = sort_field ? sort_field : dbReader.sequelize.literal('`user_order_item->user_order`.`created_datetime`');
    //         sort_order = sort_order ? sort_order : 'DESC';


    //         let includeCondition = [{
    //             required: true,
    //             model: dbReader.userOrderItems,
    //             attributes: [],
    //             where: { item_type: 1 },
    //             include: [
    //                 {
    //                     required: true,
    //                     model: dbReader.userOrder,
    //                     where: {
    //                         order_status: [2,3,4,5,6,8]
    //                     },
    //                     attributes: [],
    //                     include: [{
    //                         required: true,
    //                         model: dbReader.transactionMaster,
    //                         where: { status: "Success" },
    //                         attributes: []
    //                     }]
    //                 }
    //             ]
    //         }];

    //         let whereCondition = dbReader.sequelize.and(
    //                 dbReader.Sequelize.and(
    //                     dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_order_item->user_order`.`created_datetime`'), '%Y-%m-%d'), { [Op.gte]: current_date_range.start_date }),
    //                     dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_order_item->user_order`.`created_datetime`'), '%Y-%m-%d'), { [Op.lte]: current_date_range.end_date })
    //                 ),
    //             { is_deleted: 0 },
    //             // filterWhere,
    //             dbReader.Sequelize.or(
    //                 { product_id: { [searchCondition]: searchData } },
    //                 { product_name: { [searchCondition]: searchData } },
    //                 // { product_price: { [searchCondition]: searchData } }
    //             )
    //         );


    //         let yearData = await dbReader.products.findAll({
    //             attributes: ['product_id', 'product_name',
    //                 [dbReader.Sequelize.fn("SUM", dbReader.Sequelize.literal('`user_order_item`.`product_amount`')), 'net_sale'],
    //                 [dbReader.Sequelize.fn("COUNT", dbReader.Sequelize.literal('`user_order_item`.`product_id`')), 'item_sold'],
    //                 [dbReader.Sequelize.fn("COUNT", dbReader.Sequelize.literal('`user_order_item->user_order`.`user_orders_id`')), 'orders'],
    //                 // [dbReader.Sequelize.literal('`user_order_item->user_order`.`created_datetime`'), 'created_datetime'],
    //                 [dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('`user_order_item->user_order`.`created_datetime`'), '%Y-%m-%d'), 'created_date']
    //             ],
    //             where: whereCondition,
    //             include: includeCondition,
    //             // offset: row_offset,
    //             // limit: row_limit,
    //             order: [[sort_field, sort_order]],
    //              group: ['user_order_item.product_id',[dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('`user_order_item->user_order`.`created_datetime`'), '%Y-%m-%d')]]
    //             // group:['`user_order_item`.`product_id`']
    //         })
    //         yearData = JSON.parse(JSON.stringify(yearData));

    //         let item_sold = 0, product_count = 0, net_sale = 0, orders = 0;
    //         yearData.filter((e: any) => {
    //             item_sold += e.item_sold;
    //             product_count++;
    //             net_sale += e.net_sale;
    //             orders += e.orders;

    //         });
    //         let count = yearData.length;
    //         yearData = yearData.splice(row_offset, row_limit);
    //         if (yearData.length > 0) {
    //             new SuccessResponse(EC.success, {
    //                 count: count,
    //                 rows: yearData,
    //                 item_sold,
    //                 product_count,
    //                 net_sale,
    //                 orders
    //             }).send(res);
    //         }
    //         else {
    //             new SuccessResponse(EC.noDataFound, {
    //                 count: 0,
    //                 rows: [],
    //                 item_sold: 0,
    //                 product_count: 0,
    //                 net_sale: 0,
    //                 orders: 0
    //             }).send(res);
    //         }
    //         // let productData = await 
    //     } catch (e: any) {
    //         ApiError.handle(new BadRequestError(e.message), res);
    //     }
    // }




    public async getProductSoldList(req: Request, res: Response) {
        try {
            let { current_date_range } = req.body;
            let { past_date_range } = req.body;

            let { sort_field, sort_order, site_id } = req.body;
            var whereStatement: any = {};
            //Pagination
            var limit = req.body.page_record == undefined ? 10 : parseInt(req.body.page_record);
            var offset = req.body.page_no == undefined ? 1 : parseInt(req.body.page_no);
            // Automatic Offset and limit will set on the base of page number
            var row_limit = limit;
            var row_offset = (offset * limit) - limit;


            //Searching
            var searchCondition = dbReader.Sequelize.Op.ne, searchData = null;
            if (req.body.search) {
                searchCondition = Op.like;
                searchData = '%' + req.body.search + '%';
            }

            if (sort_field == 'product_id') {
                sort_field = dbReader.sequelize.literal('`sycu_products`.`product_id`');
            } else if (sort_field == 'product_name') {
                sort_field = dbReader.sequelize.literal('`sycu_products`.`product_name`');
            } else if (sort_field == 'net_sale') {
                sort_field = dbReader.Sequelize.fn("SUM", dbReader.Sequelize.literal('`user_order_item`.`product_amount`'));
            } else if (sort_field == 'item_sold') {
                sort_field = dbReader.Sequelize.fn("COUNT", dbReader.Sequelize.literal('`user_order_item`.`product_id`'));
            } else if (sort_field == 'orders') {
                sort_field = dbReader.sequelize.literal('`user_order_item->user_order`.`user_orders_id`');
            } else sort_field = sort_field;
            sort_field = sort_field ? sort_field : dbReader.sequelize.literal('`user_order_item->user_order`.`created_datetime`');
            sort_order = sort_order ? sort_order : 'DESC';


            //filter 
            if (site_id) {
                whereStatement.site_id = site_id
            }

            let includeCondition = [{
                required: true,
                model: dbReader.userOrderItems,
                attributes: [],
                where: { item_type: 1 },
                include: [
                    {
                        required: true,
                        model: dbReader.userOrder,
                        where: {
                            order_status: [2, 3, 4, 5, 6, 8]
                        },
                        attributes: [],
                        include: [{
                            required: true,
                            model: dbReader.transactionMaster,
                            where: { status: "Success" },
                            attributes: []
                        }]
                    }
                ]
            }];

            let whereCondition = dbReader.sequelize.and(
                whereStatement,
                dbReader.Sequelize.and(
                    dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_order_item->user_order`.`created_datetime`'), '%Y-%m-%d'), { [Op.gte]: current_date_range.start_date }),
                    dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_order_item->user_order`.`created_datetime`'), '%Y-%m-%d'), { [Op.lte]: current_date_range.end_date })
                ),
                { is_deleted: 0 },
                // filterWhere,
                dbReader.Sequelize.or(
                    { product_id: { [searchCondition]: searchData } },
                    { product_name: { [searchCondition]: searchData } },
                    // { product_price: { [searchCondition]: searchData } }
                )
            );


            let yearData = await dbReader.products.findAll({
                attributes: ['product_id', 'product_name',
                    // [dbReader.Sequelize.fn("SUM", dbReader.Sequelize.literal('`user_order_item`.`product_amount`')), 'net_sale'],
                    [dbReader.Sequelize.literal('`user_order_item`.`product_amount`'), 'net_sale'],
                    // [dbReader.Sequelize.literal('`user_order_item`.`product_id`'), 'item_sold'],
                    // [dbReader.Sequelize.literal('`user_order_item->user_order`.`user_orders_id`'), 'orders'],
                    [dbReader.Sequelize.fn("COUNT", dbReader.Sequelize.literal('`user_order_item`.`product_id`')), 'item_sold'],
                    [dbReader.Sequelize.fn("COUNT", dbReader.Sequelize.literal('`user_order_item->user_order`.`user_orders_id`')), 'orders'],
                    // [dbReader.Sequelize.literal('`user_order_item->user_order`.`created_datetime`'), 'created_datetime'],
                    [dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('`user_order_item->user_order`.`created_datetime`'), '%Y-%m-%d'), 'created_date']
                ],
                where: whereCondition,
                include: includeCondition,
                // offset: row_offset,
                // limit: row_limit,
                // order: [[sort_field, sort_order]],
                // group: ['user_order_item.product_id',[dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('`user_order_item->user_order`.`created_datetime`'), '%Y-%m-%d')]]
                group: ['`user_order_item`.`product_id`']
            })
            // yearData = JSON.parse(JSON.stringify(yearData));

            if (yearData.length > 0) {
                let dateRangeOfCurrent: any = [];
                yearData = JSON.parse(JSON.stringify(yearData));
                // dateRangeOfCurrent = getDateRange(current_date_range.start_date, current_date_range.end_date, "YYYY-MM-DD");
                // let arrayOfDatesOfCurrent = dateRangeOfCurrent.map(function (item: any) { return { 'created_date': item, 'net_sale': 0, 'item_sold': 0, 'orders': 0, 'product_id': 0, 'product_name': '' } });

                // for (let obj of arrayOfDatesOfCurrent) {
                //     for (let value of yearData) {
                //         if (obj.created_date == value.created_date) {
                //             obj.product_id = value.product_id;
                //             obj.product_name = value.product_name;
                //             obj.item_sold++;
                //             obj.orders++;
                //             obj.net_sale += value.net_sale;
                //         }
                //     }
                // }
                // arrayOfDatesOfCurrent.reverse();
                // arrayOfDatesOfCurrent.filter((e: any) => {
                //     e.new_earning = parseFloat((e.new_earning).toFixed(2));
                //     e.renew_earning = parseFloat((e.renew_earning).toFixed(2));
                //     e.total_amount = parseFloat((e.total_amount).toFixed(2));
                // })

                yearData.sort(function (a: any, b: any) {
                    if (sort_order == 'ASC') {
                        if (sort_field == 'created_date') {
                            return new Date(a.created_date).getTime() - new Date(b.created_date).getTime();
                        } else return a[sort_field] - b[sort_field];
                    } else if (sort_order == 'DESC') {
                        if (sort_field == 'created_date') {
                            return new Date(b.created_date).getTime() - new Date(a.created_date).getTime();
                        } else return b[sort_field] - a[sort_field];
                    } else {
                        return new Date(b.created_date).getTime() - new Date(a.created_date).getTime();
                    }
                });

                let count = yearData.length;
                let item_sold = 0, orders = 0, net_sale = 0, product_count = 0;
                yearData.filter((e: any) => {
                    item_sold += e.item_sold;
                    orders += e.orders;
                    net_sale += e.net_sale;
                    product_count++;
                    // amt_renew += e.renew_earning;
                    // total += e.total_amount;
                });
                // arrayOfDatesOfCurrent.filter((e:any)=>{
                //     e.product_id ? e.
                // })

                yearData = yearData.splice(row_offset, row_limit);


                new SuccessResponse(EC.errorMessage(EC.getMessage, ["Subscription Data date wise"]), { // @ts-ignore
                    token: req.token,
                    item_sold,
                    orders,
                    net_sale,
                    product_count,
                    count: count,
                    rows: yearData
                }).send(res);
            } else new SuccessResponse(EC.noDataFound, {
                item_sold: 0,
                orders: 0,
                net_sale: 0,
                count: 0,
                rows: []
            }).send(res);

            // let item_sold = 0, product_count = 0, net_sale = 0, orders = 0;
            // yearData.filter((e: any) => {
            //     item_sold += e.item_sold;
            //     product_count++;
            //     net_sale += e.net_sale;
            //     orders += e.orders;

            // });
            // let count = yearData.length;
            // yearData = yearData.splice(row_offset, row_limit);
            // if (yearData.length > 0) {
            //     new SuccessResponse(EC.success, {
            //         count: count,
            //         rows: yearData,
            //         item_sold,
            //         product_count,
            //         net_sale,
            //         orders
            //     }).send(res);
            // }
            // else {
            //     new SuccessResponse(EC.noDataFound, {
            //         count: 0,
            //         rows: [],
            //         item_sold: 0,
            //         product_count: 0,
            //         net_sale: 0,
            //         orders: 0
            //     }).send(res);
            // }
            // let productData = await 
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getProductSoldCounts(req: Request, res: Response) {
        try {
            let { current_date_range } = req.body;
            let { past_date_range, site_id } = req.body;
            var whereStatement: any = {};

            let includeCondition = [{
                required: true,
                model: dbReader.userOrderItems,
                attributes: [],
                where: { item_type: 1 },
                include: [
                    {
                        required: true,
                        model: dbReader.userOrder,
                        where: {
                            order_status: [2, 3, 4, 5, 6, 8]
                        },
                        attributes: [],
                        include: [{
                            required: true,
                            model: dbReader.transactionMaster,
                            where: { status: "Success" },
                            attributes: []
                        }]
                    }
                ]
            }];

            //filter 
            if (site_id) {
                whereStatement.site_id = site_id
            }

            let whereCondition = dbReader.sequelize.and(
                whereStatement,
                dbReader.Sequelize.or(
                    dbReader.Sequelize.and(
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_order_item->user_order`.`created_datetime`'), '%Y-%m-%d'), { [Op.gte]: current_date_range.start_date }),
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_order_item->user_order`.`created_datetime`'), '%Y-%m-%d'), { [Op.lte]: current_date_range.end_date })
                    ),
                    dbReader.Sequelize.and(
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_order_item->user_order`.`created_datetime`'), '%Y-%m-%d'), { [Op.gte]: past_date_range.start_date }),
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_order_item->user_order`.`created_datetime`'), '%Y-%m-%d'), { [Op.lte]: past_date_range.end_date })
                    ),
                )
                ,
                { is_deleted: 0 }
            );


            let yearData = await dbReader.products.findAll({
                attributes: [
                    [dbReader.Sequelize.fn("SUM", dbReader.Sequelize.literal('`user_order_item`.`product_amount`')), 'net_sale'],
                    [dbReader.Sequelize.fn("COUNT", dbReader.Sequelize.literal('`user_order_item`.`product_id`')), 'item_sold'],
                    [dbReader.Sequelize.fn("COUNT", dbReader.Sequelize.literal('`user_order_item->user_order`.`user_orders_id`')), 'orders'],
                    // [dbReader.Sequelize.literal('`user_order_item->user_order`.`created_datetime`'), 'created_datetime'],
                    [dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('`user_order_item->user_order`.`created_datetime`'), '%Y-%m-%d'), 'created_date']
                ],
                where: whereCondition,
                include: includeCondition,
                group: ['`user_order_item`.`product_id`', [dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('`user_order_item->user_order`.`created_datetime`'), '%Y-%m-%d')]]
                // group:['`user_order_item`.`product_id`']
            })

            yearData = JSON.parse(JSON.stringify(yearData));

            // Current Year
            //Old
            let currentYear = new Date(current_date_range.start_date).getFullYear();
            let filterCurrentData: any = [], currentNetSale = 0;
            yearData.filter(function (e: any, i: any) {
                // let currentYear1 = new Date(e.created_datetime).getFullYear();
                //    if (currentYear1 == currentYear) {
                //     currentNetSale += e.net_sale
                //        filterCurrentData.push(e);
                //    }
                if (e.created_date >= current_date_range.start_date && e.created_date <= current_date_range.end_date) {
                    currentNetSale += e.net_sale
                    filterCurrentData.push(e);
                }

            });

            //Past Year
            let pastYear = new Date(past_date_range.start_date).getFullYear();
            let filterPastData: any = [], pastNetSale = 0;
            yearData.filter(function (e: any, i: any) {
                //let pastYear1 = new Date(e.created_datetime).getFullYear();
                // if (pastYear1 == pastYear) {
                //     pastNetSale += e.net_sale
                //     filterPastData.push(e);
                // }

                if (e.created_date >= past_date_range.start_date && e.created_date <= past_date_range.end_date) {
                    pastNetSale += e.net_sale
                    filterPastData.push(e);
                }
            });

            // // Up-Down Ratio
            // //    let status;
            // //    if(filterCurrentData.length > filterPastData.length){
            // //        status = "UP"
            // //    }else{
            // //        status = "DOWN"
            // //    }

            // //Percentage (item/order)
            // //    let ratio:any;
            // //    ratio = ((filterCurrentData.length*100/filterPastData.length) - 100);

            // //netSalePercentage
            // //    let netSaleRatio : any;
            // //    netSaleRatio = ((currentNetSale*100/pastNetSale)-100);

            // //    let  dataForSum = JSON.parse(JSON.stringify(yearData));
            // //     let total_sum = 0, item_sold = 0,orders = 0;
            // //     if (dataForSum.length) {
            // //         dataForSum.forEach((element: any) => {
            // //             total_sum += element.net_sale
            // //             item_sold += element.item_sold
            // //             orders += element.orders
            // //         });
            // //     }

            // //Current Count
            let current = JSON.parse(JSON.stringify(filterCurrentData));
            let current_total_sum = 0, current_item_sold = 0, current_orders = 0;
            if (current.length) {
                current.forEach((element: any) => {
                    current_total_sum += element.net_sale
                    current_item_sold += element.item_sold
                    current_orders += element.orders
                });
            }


            // Past Count
            let past = JSON.parse(JSON.stringify(filterPastData));
            let past_total_sum = 0, past_item_sold = 0, past_orders = 0;
            if (past.length) {
                past.forEach((element: any) => {
                    past_total_sum += element.net_sale
                    past_item_sold += element.item_sold
                    past_orders += element.orders
                });
            }
            let item_sold_object = {
                "value": current_item_sold,
                "previousPeriodValue": past_item_sold
                // "ratio" : parseFloat(ratio.toFixed(2))
            }
            let net_sale_object = {
                "value": parseFloat(current_total_sum.toFixed(2)),
                "previousPeriodValue": parseFloat(past_total_sum.toFixed(2))
                // "ratio":parseFloat(netSaleRatio.toFixed(2))
            }
            let order_object = {
                "value": current_orders,
                "previousPeriodValue": past_orders
                // "ratio" : parseFloat(ratio.toFixed(2))
            }

            let reports: any = {};
            reports.items_sold = item_sold_object;
            reports.net_sales = net_sale_object
            reports.orders = order_object

            yearData = JSON.parse(JSON.stringify(yearData));
            if (yearData.length > 0) {
                new SuccessResponse(EC.success, {
                    reports
                }).send(res);
            }
            else {
                new SuccessResponse(EC.noDataFound, {
                    reports: {
                        items_sold: {
                            value: 0,
                            previousPeriodValue: 0,
                        },
                        net_sales: {
                            value: 0,
                            previousPeriodValue: 0,
                        },
                        orders: {
                            value: 0,
                            previousPeriodValue: 0,
                        },
                    }
                }).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public getProductSoldChartData = async (req: Request, res: Response) => {
        try {
            let { current_range, previous_range, filter, type, site_id } = req.body;
            var whereStatement: any = {};
            let attributes: any = [[dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_order_item->user_order`.`created_datetime`'), '%Y-%m-%d'), 'created_datetime'],
            [dbReader.Sequelize.literal('`user_order_item`.`product_amount`'), 'product_amount'],
                // [dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m-%d'), 'created_datetime']
            ];
            switch (filter) {
                case "hour":
                    attributes = [
                        [dbReader.Sequelize.literal('`user_order_item->user_order`.`created_datetime`'), 'created_datetime'],
                        [dbReader.Sequelize.literal('`user_order_item`.`product_amount`'), 'product_amount']
                    ];
                    break;
            }

            let includeCondition = [{
                required: true,
                model: dbReader.userOrderItems,
                attributes: [],
                where: { item_type: 1 },
                include: [
                    {
                        required: true,
                        model: dbReader.userOrder,
                        where: {
                            order_status: [2, 3, 4, 5, 6, 8]
                        },
                        attributes: [],
                        include: [{
                            required: true,
                            model: dbReader.transactionMaster,
                            where: { status: "Success" },
                            attributes: []
                        }]
                    }
                ]
            }];

            //filter 
            if (site_id) {
                whereStatement.site_id = site_id
            }

            let whereCondition = dbReader.sequelize.and(
                whereStatement,
                dbReader.Sequelize.or(
                    dbReader.Sequelize.and(
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_order_item->user_order`.`created_datetime`'), '%Y-%m-%d'), { [Op.gte]: current_range.start_date }),
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_order_item->user_order`.`created_datetime`'), '%Y-%m-%d'), { [Op.lte]: current_range.end_date })
                    ),
                    dbReader.Sequelize.and(
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_order_item->user_order`.`created_datetime`'), '%Y-%m-%d'), { [Op.gte]: previous_range.start_date }),
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_order_item->user_order`.`created_datetime`'), '%Y-%m-%d'), { [Op.lte]: previous_range.end_date })
                    ),
                )
                ,
                { is_deleted: 0 }
            );

            let productData = await dbReader.products.findAll({
                attributes: attributes
                // [dbReader.Sequelize.literal('`user_order_item`.`product_amount`'), 'product_amount'],
                // [dbReader.Sequelize.literal('`user_order_item->user_order`.`created_datetime`'), 'created_datetime'],
                // [dbReader.Sequelize.fn("COUNT", dbReader.Sequelize.literal('`user_order_item`.`product_id`')), 'product_count'],
                // [dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('`user_order_item->user_order`.`created_datetime`'), '%Y-%m-%d'), 'created_date']

                ,
                where: whereCondition,
                include: includeCondition,
                // group: ['created_date']
            })
            if (productData.length > 0) {
                productData = JSON.parse(JSON.stringify(productData));
                let dateRange, arrayOfDatesOfCurrent: any = [], arrayOfDatesOfPrevious: any = [], final: any = [];
                let getCounts = (arrCurrent: any, arrPrevious: any, type1: string) => {
                    let final: any = [];
                    if (type1 == 'hour') {
                        for (let ele of arrCurrent) {
                            for (let obj of ele) {
                                for (let value of productData) {
                                    if (obj.created_date == moment(value.created_datetime).format("YYYY-MM-DD HH")) {
                                        if (type == 'net_sale') {
                                            obj.current += value.product_amount
                                        }
                                        else {
                                            obj.current++;
                                        }
                                    }
                                }
                            }
                        }
                        for (let ele of arrPrevious) {
                            for (let obj of ele) {
                                for (let value of productData) {
                                    if (obj.created_date == moment(value.created_datetime).format("YYYY-MM-DD HH")) {
                                        if (type == 'net_sale') {
                                            obj.previous += value.product_amount
                                        }
                                        else {
                                            obj.previous++;
                                        }
                                    }
                                }
                            }
                        }
                        for (let i = 0; i < arrCurrent.length; i++) {
                            let current: any = { "current_count": 0 }, previous: any = { "previous_count": 0 };
                            for (let j = 0; j < arrCurrent[i].length; j++) {
                                // current.title = moment(arrCurrent[i][j].start_date).format('HH A') + "-" + moment(arrCurrent[i][j].end_date).format('HH A');
                                current.start_date = arrCurrent[i][j].start_date;
                                current.end_date = arrCurrent[i][j].end_date;
                                current.current_count += arrCurrent[i][j].current;
                            }
                            for (let j = 0; j < arrPrevious[i].length; j++) {
                                // previous.title = moment(arrPrevious[i][j].start_date).format('HH A') + "-" + moment(arrPrevious[i][j].end_date).format('HH A');
                                previous.start_date = arrPrevious[i][j].start_date;
                                previous.end_date = arrPrevious[i][j].end_date;
                                previous.previous_count += arrPrevious[i][j].previous;
                            }
                            final.push({ "current": current, "previous": previous });
                        }
                    } else {
                        for (let ele of arrCurrent) {
                            for (let obj of ele) {
                                for (let value of productData) {
                                    if (obj.created_date == value.created_datetime) {
                                        if (type == 'net_sale') {
                                            obj.current += value.product_amount
                                        }
                                        else {
                                            obj.current++;
                                        }
                                    }
                                }
                            }
                        }
                        for (let ele of arrPrevious) {
                            for (let obj of ele) {
                                for (let value of productData) {
                                    if (obj.created_date == value.created_datetime) {
                                        if (type == 'net_sale') {
                                            obj.previous += value.product_amount
                                        }
                                        else {
                                            obj.previous++;
                                        }
                                    }
                                }
                            }
                        }
                        for (let i = 0; i < arrCurrent.length; i++) {
                            let current: any = { "current_count": 0 }, previous: any = { "previous_count": 0 };
                            for (let j = 0; j < arrCurrent[i].length; j++) {
                                // let end = moment(arrCurrent[i][j].end_date) > moment(current_range.end_date) ? current_range.end_date : arrCurrent[i][j].end_date;
                                // current.title = moment(arrCurrent[i][j].start_date).format('YYYY/MM/DD') + "-" + moment(end).format('YYYY/MM/DD');
                                current.start_date = arrCurrent[i][j].start_date;
                                current.end_date = arrCurrent[i][j].end_date;
                                // if (type == 'day') {
                                //     current.current_count = arrCurrent[i][j].current;
                                // } else 
                                current.current_count += arrCurrent[i][j].current;
                            }
                            for (let j = 0; j < arrPrevious[i].length; j++) {
                                // let end = moment(arrPrevious[i][j].end_date) > moment(current_range.end_date) ? current_range.end_date : arrPrevious[i][j].end_date;
                                // previous.title = moment(arrPrevious[i][j].start_date).format('YYYY/MM/DD') + "-" + moment(end).format('YYYY/MM/DD');
                                previous.start_date = arrPrevious[i][j].start_date;
                                previous.end_date = arrPrevious[i][j].end_date;
                                // if (type == 'day') {
                                //     previous.previous_count = arrPrevious[i][j].previous;
                                // } else 
                                previous.previous_count += arrPrevious[i][j].previous;
                            }
                            final.push({ "current": current, "previous": previous });
                        }
                        final.reverse();
                    }
                    let current_count = 0, previous_count = 0;
                    final.forEach((e: any) => {
                        current_count += e.current.current_count;
                        previous_count += e.previous.previous_count;
                    });
                    return { current_count, previous_count, final };
                }
                switch (filter) {
                    case 'day': //by day
                        var daysOfYear1: any = [], daysOfYear2: any = [];
                        let dateRangeOfCurrent = getDateRange(current_range.start_date, current_range.end_date, "YYYY-MM-DD");
                        let dateRangeOfPrevious = getDateRange(previous_range.start_date, previous_range.end_date, "YYYY-MM-DD");
                        daysOfYear1 = dateRangeOfCurrent.map(function (item: any) { return { 'created_date': item, 'start_date': item, 'end_date': item, 'current': 0 } });
                        daysOfYear2 = dateRangeOfPrevious.map(function (item: any) { return { 'created_date': item, 'start_date': item, 'end_date': item, 'previous': 0 } });
                        daysOfYear1.reverse(); daysOfYear2.reverse();
                        for (let ele of daysOfYear1) {
                            for (let value of productData) {
                                if (ele.created_date == value.created_datetime) {
                                    ele.current++;
                                }
                            }
                        }
                        for (let ele of daysOfYear2) {
                            for (let value of productData) {
                                if (ele.created_date == value.created_datetime) {
                                    ele.previous++;
                                }
                            }
                        } let final: any = [];
                        for (let i = 0; i < Math.min(daysOfYear1.length, daysOfYear2.length); i++) {
                            let current: any = { "current_count": 0 }, previous: any = { "previous_count": 0 };
                            current.start_date = daysOfYear1[i].start_date;
                            current.end_date = daysOfYear1[i].end_date;
                            current.current_count = daysOfYear1[i].current;
                            previous.start_date = daysOfYear2[i].start_date;
                            previous.end_date = daysOfYear2[i].end_date;
                            previous.previous_count = daysOfYear2[i].previous;
                            final.push({ "current": current, "previous": previous });
                        }
                        //final.reverse();
                        let current_count = 0, previous_count = 0;
                        final.forEach((e: any) => {
                            current_count += e.current.current_count;
                            previous_count += e.previous.previous_count;
                        });
                        new SuccessResponse(EC.errorMessage(EC.getMessage, ["New Production Chart Data"]), { // @ts-ignore
                            token: req.token,
                            current: current_count,
                            previous: previous_count,
                            rows: final
                        }).send(res);
                        break;
                    case "week": //by week
                        moment.updateLocale('in', {
                            week: {
                                dow: 1 // Monday is the first day of the week
                            }
                        });
                        var now1 = new Date(current_range.end_date);
                        var daysOfYear1: any = [];
                        for (var d = new Date(current_range.start_date); d <= now1; d.setDate(d.getDate() + 1)) {
                            let week = moment(d).week();
                            if (daysOfYear1.some((s: any) => s.week == week)) {
                                let fi = daysOfYear1.findIndex((s: any) => s.week == week)
                                daysOfYear1[fi].end_date = moment(d).format('YYYY-MM-DD')
                            } else {
                                daysOfYear1.push({
                                    week: week,
                                    start_date: moment(d).format('YYYY-MM-DD'),
                                    end_date: moment(d).format('YYYY-MM-DD')
                                })
                            }
                        }
                        var now2 = new Date(previous_range.end_date);
                        var daysOfYear2: any = [];
                        for (var d = new Date(previous_range.start_date); d <= now2; d.setDate(d.getDate() + 1)) {
                            let week = moment(d).week();
                            if (daysOfYear2.some((s: any) => s.week == week)) {
                                let fi = daysOfYear2.findIndex((s: any) => s.week == week)
                                daysOfYear2[fi].end_date = moment(d).format('YYYY-MM-DD')
                            } else {
                                daysOfYear2.push({
                                    week: week,
                                    start_date: moment(d).format('YYYY-MM-DD'),
                                    end_date: moment(d).format('YYYY-MM-DD')
                                })
                            }
                        } daysOfYear1.reverse(); daysOfYear2.reverse();
                        for (let index = 0; index < Math.min(daysOfYear1.length, daysOfYear2.length); index++) {
                            let startDate1 = daysOfYear1[index].start_date;
                            let lastDate1 = daysOfYear1[index].end_date;
                            let startDate2 = daysOfYear2[index].start_date;
                            let lastDate2 = daysOfYear2[index].end_date;
                            dateRange = getDateRange(startDate1, lastDate1, "YYYY-MM-DD");
                            arrayOfDatesOfCurrent.push(dateRange.map(function (item) { return { 'created_date': item, 'start_date': startDate1, 'end_date': lastDate1, 'current': 0 } }));
                            dateRange = getDateRange(startDate2, lastDate2, "YYYY-MM-DD");
                            arrayOfDatesOfPrevious.push(dateRange.map(function (item) { return { 'created_date': item, 'start_date': startDate2, 'end_date': lastDate2, 'previous': 0 } }));
                        }
                        let result1 = getCounts(arrayOfDatesOfCurrent, arrayOfDatesOfPrevious, filter);
                        new SuccessResponse(EC.errorMessage(EC.getMessage, ["New Subscription Chart Data"]), { // @ts-ignore
                            token: req.token,
                            current: result1.current_count,
                            previous: result1.previous_count,
                            rows: result1.final
                        }).send(res);
                        break;
                    case 'month': //by week
                        var now1 = new Date(current_range.end_date);
                        var daysOfYear1: any = [];
                        for (var d = new Date(current_range.start_date); d <= now1; d.setDate(d.getDate() + 1)) {
                            let month = moment(d).format('MM');
                            if (daysOfYear1.some((s: any) => s.month == month)) {
                                let fi = daysOfYear1.findIndex((s: any) => s.month == month)
                                daysOfYear1[fi].end_date = moment(d).format('YYYY-MM-DD')
                            } else {
                                daysOfYear1.push({
                                    month: month,
                                    start_date: moment(d).format('YYYY-MM-DD'),
                                    end_date: moment(d).format('YYYY-MM-DD')
                                })
                            }
                        }
                        var now2 = new Date(previous_range.end_date);
                        var daysOfYear2: any = [];
                        for (var d = new Date(previous_range.start_date); d <= now2; d.setDate(d.getDate() + 1)) {
                            let month = moment(d).format('MM');
                            if (daysOfYear2.some((s: any) => s.month == month)) {
                                let fi = daysOfYear2.findIndex((s: any) => s.month == month)
                                daysOfYear2[fi].end_date = moment(d).format('YYYY-MM-DD')
                            } else {
                                daysOfYear2.push({
                                    month: month,
                                    start_date: moment(d).format('YYYY-MM-DD'),
                                    end_date: moment(d).format('YYYY-MM-DD')
                                })
                            }
                        }
                        daysOfYear1.reverse(); daysOfYear2.reverse();
                        for (let index = 0; index < Math.min(daysOfYear1.length, daysOfYear2.length); index++) {
                            let startDate1 = daysOfYear1[index].start_date;
                            let lastDate1 = daysOfYear1[index].end_date;
                            let startDate2 = daysOfYear2[index].start_date;
                            let lastDate2 = daysOfYear2[index].end_date;
                            dateRange = getDateRange(startDate1, lastDate1, "YYYY-MM-DD");
                            arrayOfDatesOfCurrent.push(dateRange.map(function (item) { return { 'created_date': item, 'start_date': startDate1, 'end_date': lastDate1, 'current': 0 } }));
                            dateRange = getDateRange(startDate2, lastDate2, "YYYY-MM-DD");
                            arrayOfDatesOfPrevious.push(dateRange.map(function (item) { return { 'created_date': item, 'start_date': startDate2, 'end_date': lastDate2, 'previous': 0 } }));
                        }
                        let result2 = getCounts(arrayOfDatesOfCurrent, arrayOfDatesOfPrevious, filter);
                        new SuccessResponse(EC.errorMessage(EC.getMessage, ["New Subscription Chart Data"]), { // @ts-ignore
                            token: req.token,
                            current: result2.current_count,
                            previous: result2.previous_count,
                            rows: result2.final
                        }).send(res);
                        break;
                    case 'quarter': //by quarter
                        var daysOfYear1: any = [], daysOfYear2: any = [];
                        for (let m = moment(current_range.start_date); m <= moment(current_range.end_date); m.add(3, 'M')) {
                            let _currentStartDate = m.format("YYYY-MM-DD"),
                                _actualStartDate = moment(current_range.start_date).format("YYYY-MM-DD"),
                                _lastDate = moment(moment(m).add(3, 'M')).format("YYYY-MM-DD"),
                                _actualEndDate = moment(current_range.end_date).format("YYYY-MM-DD");
                            if ((_lastDate <= _actualEndDate || _actualEndDate >= _currentStartDate) && _actualStartDate <= _currentStartDate) {
                                dateRange = getDateRange(m, _lastDate, "YYYY-MM-DD");
                                daysOfYear1.push(dateRange.map(function (item: any) { return { 'created_date': item, 'start_date': _currentStartDate, 'end_date': _lastDate, 'current': 0 } }));
                            }
                        }
                        for (let m = moment(previous_range.start_date); m <= moment(previous_range.end_date); m.add(3, 'M')) {
                            let _currentStartDate = m.format("YYYY-MM-DD"),
                                _actualStartDate = moment(previous_range.start_date).format("YYYY-MM-DD"),
                                _lastDate = moment(moment(m).add(3, 'M')).format("YYYY-MM-DD"),
                                _actualEndDate = moment(previous_range.end_date).format("YYYY-MM-DD");
                            if ((_lastDate <= _actualEndDate || _actualEndDate >= _currentStartDate) && _actualStartDate <= _currentStartDate) {
                                dateRange = getDateRange(m, _lastDate, "YYYY-MM-DD");
                                daysOfYear2.push(dateRange.map(function (item: any) { return { 'created_date': item, 'start_date': _currentStartDate, 'end_date': _lastDate, 'previous': 0 } }));
                            }
                        }
                        daysOfYear1.reverse(); daysOfYear2.reverse();
                        for (let index = 0; index < Math.min(daysOfYear1.length, daysOfYear2.length); index++) {
                            arrayOfDatesOfCurrent.push(daysOfYear1[index]);
                            arrayOfDatesOfPrevious.push(daysOfYear2[index]);
                        }
                        let result3 = getCounts(arrayOfDatesOfCurrent, arrayOfDatesOfPrevious, filter);
                        new SuccessResponse(EC.errorMessage(EC.getMessage, ["New Subscription Chart Data"]), { // @ts-ignore
                            token: req.token,
                            current: result3.current_count,
                            previous: result3.previous_count,
                            rows: result3.final
                        }).send(res);
                        break;
                    case 'hour': //by hour
                        for (let m = moment(current_range.start_date).set({ hour: 0, minute: 0, second: 0 }); m <= moment(current_range.end_date).set({ hour: 23, minute: 59, second: 59 }); m.add(1, 'hours')) {
                            let _currentStartDate = m.format("YYYY-MM-DD HH:mm"),
                                _actualStartDate = moment(current_range.start_date).format("YYYY-MM-DD HH:mm"),
                                _lastDate = moment(m).format("YYYY-MM-DD HH:mm"),
                                _actualEndDate = moment(current_range.end_date).set({ hour: 23, minute: 59, second: 59 }).format("YYYY-MM-DD HH:mm");
                            if ((_lastDate <= _actualEndDate || _actualEndDate >= _currentStartDate) && _actualStartDate <= _currentStartDate) {
                                dateRange = getDateRange(m, _lastDate, "YYYY-MM-DD HH");
                                arrayOfDatesOfCurrent.push(dateRange.map(function (item: any) { return { 'created_date': item, 'start_date': _currentStartDate, 'end_date': _lastDate, 'current': 0 } }));
                            }
                            _lastDate = moment(moment(m).add(1, 'hours')).format("YYYY-MM-DD HH:mm");
                        }
                        for (let m = moment(previous_range.start_date).set({ hour: 0, minute: 0, second: 0 }); m <= moment(previous_range.end_date).set({ hour: 23, minute: 59, second: 59 }); m.add(1, 'hours')) {
                            let _currentStartDate = m.format("YYYY-MM-DD HH:mm"),
                                _actualStartDate = moment(previous_range.start_date).format("YYYY-MM-DD HH:mm"),
                                _lastDate = moment(m).format("YYYY-MM-DD HH:mm"),
                                _actualEndDate = moment(previous_range.end_date).set({ hour: 23, minute: 59, second: 59 }).format("YYYY-MM-DD HH:mm");
                            if ((_lastDate <= _actualEndDate || _actualEndDate >= _currentStartDate) && _actualStartDate <= _currentStartDate) {
                                dateRange = getDateRange(m, _lastDate, "YYYY-MM-DD HH");
                                arrayOfDatesOfPrevious.push(dateRange.map(function (item: any) { return { 'created_date': item, 'start_date': _currentStartDate, 'end_date': _lastDate, 'previous': 0 } }));
                            }
                            _lastDate = moment(moment(m).add(1, 'hours')).format("YYYY-MM-DD HH:mm")
                        }
                        let result4 = getCounts(arrayOfDatesOfCurrent, arrayOfDatesOfPrevious, filter);
                        new SuccessResponse(EC.errorMessage(EC.getMessage, ["New Production Chart Data"]), { // @ts-ignore
                            token: req.token,
                            current: result4.current_count,
                            previous: result4.previous_count,
                            rows: result4.final
                        }).send(res);
                        break;
                }

            } else new SuccessResponse(EC.noDataFound, {
                rows: []
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    /* public getOrderByDate = async (req: Request, res: Response) => {
        try {
            let { sort_field, sort_order, page_no, page_record, date, id, type, range, site_id } = req.body;
            let siteCondition = {}
            if (site_id) {
                siteCondition = { site_id: site_id }
            }
            //Pagination
            var limit = page_record == undefined ? 10 : parseInt(page_record);
            var offset = page_no == undefined ? 1 : parseInt(page_no);
            // Automatic offset and limit will set on the base of page number
            var row_limit = limit;
            var row_offset = (offset * limit) - limit;
            //Searching
            var searchCondition = dbReader.Sequelize.Op.ne, searchData = null;
            var dateCondition = dbReader.Sequelize.Op.ne, dateData = null;
            if (req.body.search) {
                searchCondition = Op.like;
                searchData = '%' + req.body.search + '%';
            }
            if (date) {
                dateCondition = Op.like;
                dateData = '%' + date + '%';
            }
            // Getting sort field(column) and sort order(ASC) from body
            // If it is not passed in body then default values will set
            sort_field = sort_field ? sort_field : 'user_order_date', sort_order = sort_order ? sort_order : "DESC";
            if (sort_field == "user_name") {
                sort_field = dbReader.Sequelize.literal('`sycu_user`.`display_name`')
            }
            // else if(sort_field == "subscription_number"){
            //     sort_field = dbReader.Sequelize.literal('`user_subscription`.`subscription_number`')
            // }
            let whereCondition = {}, idCondition = {} // 1 = product, 2 = coupon
            if (type == 1) {
                // whereCondition = dbReader.sequelize.and(
                //     dbReader.Sequelize.and(
                //         dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_orders`.`created_datetime`'), '%Y-%m-%d'), { [Op.gte]: date.start_date }),
                //         dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_orders`.`created_datetime`'), '%Y-%m-%d'), { [Op.lte]: date.end_date })
                //     ),
                //     dbReader.sequelize.or(
                //         {user_order_number : { [searchCondition]: searchData }},
                //         [dbReader.Sequelize.where(dbReader.sequelize.col('`sycu_user`.`display_name`'), { [searchCondition]: searchData })],
                //         [dbReader.Sequelize.where(dbReader.sequelize.col('`sycu_user`.`email`'), { [searchCondition]: searchData })],
                //         [dbReader.Sequelize.where(dbReader.sequelize.col('`user_subscription`.`subscription_number`'), { [searchCondition]: searchData })]
                //     ),
                //     { order_status: { [Op.in]: [2, 3, 4, 5, 6, 8] } },
                //     dbReader.Sequelize.where(dbReader.Sequelize.literal(`(select count(1) from sycu_user_order_items where product_id = ${id} and user_orders_id = user_orders.user_orders_id and item_type = 1)`), { [dbReader.Sequelize.Op.gt]: 0 })
                // )
                idCondition = dbReader.Sequelize.where(dbReader.Sequelize.literal(`(select count(1) from sycu_user_order_items where product_id = ${id} and user_orders_id = user_orders.user_orders_id and item_type = 1)`), { [dbReader.Sequelize.Op.gt]: 0 });
            }
            if (type == 2) {
                // whereCondition = dbReader.sequelize.and(
                //     dbReader.Sequelize.and(
                //         dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_orders`.`created_datetime`'), '%Y-%m-%d'), { [Op.gte]: date.start_date }),
                //         dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_orders`.`created_datetime`'), '%Y-%m-%d'), { [Op.lte]: date.end_date })
                //     ),
                //     dbReader.sequelize.or(
                //         {user_order_number : { [searchCondition]: searchData }},
                //         [dbReader.Sequelize.where(dbReader.sequelize.col('`sycu_user`.`display_name`'), { [searchCondition]: searchData })],
                //         [dbReader.Sequelize.where(dbReader.sequelize.col('`sycu_user`.`email`'), { [searchCondition]: searchData })],
                //         [dbReader.Sequelize.where(dbReader.sequelize.col('`user_subscription`.`subscription_number`'), { [searchCondition]: searchData })]
                //     ),
                //     { order_status: { [Op.in]: [2, 3, 4, 5, 6, 8] } },
                //     // dbReader.Sequelize.where(dbReader.Sequelize.literal(`(select count(1) from sycu_user_order_items where product_id = ${id} and user_orders_id = user_orders.user_orders_id and item_type = 5)`), { [dbReader.Sequelize.Op.gt]: 0 })
                //     dbReader.Sequelize.where(dbReader.Sequelize.literal(`(select count(1) from sycu_user_coupon where coupon_id = ${id} and user_orders_id = user_orders.user_orders_id)`), { [dbReader.Sequelize.Op.gt]: 0 })
                // )
                idCondition = dbReader.Sequelize.where(dbReader.Sequelize.literal(`(select count(1) from sycu_user_coupon where coupon_id = ${id} and user_orders_id = user_orders.user_orders_id)`), { [dbReader.Sequelize.Op.gt]: 0 })
            }
            // if (type == 3) {
            //     whereCondition = dbReader.sequelize.and(
            //         dbReader.Sequelize.and(
            //             dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_orders`.`created_datetime`'), '%Y-%m-%d'), { [Op.gte]: date }),
            //             dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_orders`.`created_datetime`'), '%Y-%m-%d'), { [Op.lte]: date })
            //         ),
            //         dbReader.sequelize.or(
            //             {user_order_number : { [searchCondition]: searchData }},
            //             [dbReader.Sequelize.where(dbReader.sequelize.col('`sycu_user`.`display_name`'), { [searchCondition]: searchData })],
            //             [dbReader.Sequelize.where(dbReader.sequelize.col('`sycu_user`.`email`'), { [searchCondition]: searchData })],
            //             [dbReader.Sequelize.where(dbReader.sequelize.col('`user_subscription`.`subscription_number`'), { [searchCondition]: searchData })]
            //         ),
            //         { order_status: { [Op.in]: [2, 3, 4, 5, 6, 8] } },
            //     )
            // }
            
            if (date && (type == 1 || type == 2)) {
                whereCondition = dbReader.sequelize.and(
                    dbReader.Sequelize.and(
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_orders`.`created_datetime`'), '%Y-%m-%d '), { [Op.gte]: date.start_date }),
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_orders`.`created_datetime`'), '%Y-%m-%d'), { [Op.lte]: date.end_date })
                    ),
                    dbReader.sequelize.or(
                        { user_order_number: { [searchCondition]: searchData } },
                        [dbReader.Sequelize.where(dbReader.sequelize.col('`sycu_user`.`display_name`'), { [searchCondition]: searchData })],
                        [dbReader.Sequelize.where(dbReader.sequelize.col('`sycu_user`.`email`'), { [searchCondition]: searchData })],
                        [dbReader.Sequelize.where(dbReader.sequelize.col('`user_subscription`.`subscription_number`'), { [searchCondition]: searchData })]
                    ),
                    { order_status: { [Op.in]: [2, 3, 4, 5, 6, 8] } },
                    idCondition
                    // dbReader.Sequelize.where(dbReader.Sequelize.literal(`(select count(1) from sycu_user_order_items where product_id = ${id} and user_orders_id = user_orders.user_orders_id and item_type = 5)`), { [dbReader.Sequelize.Op.gt]: 0 })
                )
            } else if (type == 3) {
                let date1 = moment(date).format("YYYY-MM-DD")
                whereCondition = dbReader.sequelize.and(
                    dbReader.Sequelize.and(
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_orders`.`created_datetime`'), '%Y-%m-%d %H:%i'), { [Op.gte]: range.start_date }),
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_orders`.`created_datetime`'), '%Y-%m-%d %H:%i'), { [Op.lte]: range.end_date }),
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_orders`.`created_datetime`'), '%Y-%m-%d'), { [dateCondition]: dateData }),
                        // dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_orders`.`created_datetime`'), '%Y-%m-%d %H:%i'), { [Op.lte]: date1 }),
                    ),
                    dbReader.sequelize.or(
                        { user_order_number: { [searchCondition]: searchData } },
                        [dbReader.Sequelize.where(dbReader.sequelize.col('`sycu_user`.`display_name`'), { [searchCondition]: searchData })],
                        [dbReader.Sequelize.where(dbReader.sequelize.col('`sycu_user`.`email`'), { [searchCondition]: searchData })],
                        [dbReader.Sequelize.where(dbReader.sequelize.col('`user_subscription`.`subscription_number`'), { [searchCondition]: searchData })]
                    ),
                    { order_status: { [Op.in]: [2, 3, 4, 5, 6, 8] } },
                )
            } else {
                whereCondition = dbReader.sequelize.and(
                    dbReader.sequelize.or(
                        { user_order_number: { [searchCondition]: searchData } },
                        [dbReader.Sequelize.where(dbReader.sequelize.col('`sycu_user`.`display_name`'), { [searchCondition]: searchData })],
                        [dbReader.Sequelize.where(dbReader.sequelize.col('`sycu_user`.`email`'), { [searchCondition]: searchData })],
                        [dbReader.Sequelize.where(dbReader.sequelize.col('`user_subscription`.`subscription_number`'), { [searchCondition]: searchData })]
                    ),
                    { order_status: { [Op.in]: [2, 3, 4, 5, 6, 8] } },
                    idCondition
                    // dbReader.Sequelize.where(dbReader.Sequelize.literal(`(select count(1) from sycu_user_order_items where product_id = ${id} and user_orders_id = user_orders.user_orders_id and item_type = 5)`), { [dbReader.Sequelize.Op.gt]: 0 })
                )
            }

            let userOrderModelData: any = {
                attributes: ['user_orders_id', 'fees_amount', 'tax_amount', 'sub_amount', 'shipping_amount', 'coupon_amount',
                    'created_datetime', 'user_id', 'user_subscription_id', 'user_order_number', 'order_status', 'total_amount', 'user_order_date',
                    [dbReader.Sequelize.literal(`display_name`), 'user_name'], [dbReader.Sequelize.literal(`email`), 'email'],
                    [dbReader.Sequelize.literal('`user_subscription`.`subscription_number`'), 'subscription_number'],
                    [dbReader.Sequelize.literal('`user_subscription`.`coupon_code`'), 'coupon_code'],
                    [dbReader.Sequelize.literal('`user_subscription`.`site_id`'), 'site_id']
                ],
                include: [{
                    model: dbReader.users,
                    attributes: []
                }, {
                    required: false,
                    model: dbReader.userSubscription,
                    attributes: [],
                    where: siteCondition
                }, {
                    separate: true,
                    model: dbReader.userOrderItems
                }, {
                    required: false,
                    model: dbReader.transactionMaster,
                    where: { status: "Success", type: 1, charge_id: { [Op.ne]: '' } },
                    attributes: []
                }, {
                    required: false,
                    as: 'shippingAddress',
                    model: dbReader.userAddress,
                    attributes: ['user_address_id', 'first_name', 'last_name', 'address_line1', 'address_line2', 'city', 'company', 'zipcode', 'state_id', 'country_id', 'phone_number', 'email_address', 'customer_shipping_note',
                        [dbReader.Sequelize.literal('`billingAddress->stateModel`.`state_code`'), 'state_code'], [dbReader.Sequelize.literal('`billingAddress->stateModel`.`name`'), 'state_name']],
                    where: { address_type: 2 },
                    include: [{
                        required: false,
                        model: dbReader.stateModel,
                        attributes: []
                    }],
                }, {
                    required: false,
                    as: 'billingAddress',
                    model: dbReader.userAddress,
                    where: { address_type: 1 },
                    attributes: ['user_address_id', 'first_name', 'last_name', 'address_line1', 'address_line2', 'city', 'company', 'zipcode', 'state_id', 'country_id', 'phone_number', 'email_address',
                        [dbReader.Sequelize.literal('`billingAddress->stateModel`.`state_code`'), 'state_code'], [dbReader.Sequelize.literal('`billingAddress->stateModel`.`name`'), 'state_name']],
                    include: [{
                        required: false,
                        model: dbReader.stateModel,
                        attributes: []
                    }]
                }],
                where: whereCondition,
                order: [[sort_field, sort_order]],
                offset: row_offset,
                limit: row_limit
            }
            let getUserOrderList = await dbReader.userOrder.findAndCountAll(userOrderModelData)
            if (getUserOrderList.count > 0) {
                new SuccessResponse(EC.success, {
                    //@ts-ignore
                    token: req.token,
                    count: getUserOrderList.count,
                    order_list: getUserOrderList.rows
                }).send(res);
            } else {
                new SuccessResponse(EC.noDataFound, {
                    order_list: []
                }).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    } */

    public getOrderByDate = async (req: Request, res: Response) => {
        try {
            let { sort_field, sort_order, page_no, page_record, date, id, type, range, site_id, coupon_filter = 0 } = req.body;
            let row_limit = page_record ? parseInt(page_record) : 10;
            let offset = page_no ? parseInt(page_no) : 1;
            let row_offset = (offset * row_limit) - row_limit;
            let siteCondition = site_id ? { site_id: site_id } : {}
            //Searching
            let searchCondition = dbReader.Sequelize.Op.ne, searchData = null;
            let dateCondition = dbReader.Sequelize.Op.ne, dateData = null;
            if (req.body.search) {
                searchCondition = Op.like;
                searchData = '%' + req.body.search + '%';
            }
            if (date) {
                dateCondition = Op.like;
                dateData = '%' + date + '%';
            }

            sort_field = sort_field ? sort_field : 'user_order_date';
            sort_order = sort_order ? sort_order : "DESC";
            if (sort_field == "user_name") {
                sort_field = dbReader.Sequelize.literal('`sycu_user`.`display_name`')
            }

            let whereCondition = {}, idCondition = {}, redundCondition = {}, refundInclude = {}
            // 1 = product, 2 = coupon
            if (type == 1) {
                idCondition = dbReader.Sequelize.where(dbReader.Sequelize.literal(`(select count(1) from sycu_user_order_items where item_type = 1 and product_id = ${id} and is_deleted = 0 and user_orders_id = user_orders.user_orders_id)`), { [dbReader.Sequelize.Op.gt]: 0 });
            } else if (type == 2) {
                /* if (is_coupons) {
                    idCondition = dbReader.Sequelize.where(dbReader.Sequelize.literal(`(select count(1) from sycu_user_coupon where coupon_id = ${id} and user_orders_id = user_orders.user_orders_id)`), { [dbReader.Sequelize.Op.gt]: 0 })
                } else {
                    idCondition = dbReader.Sequelize.where(dbReader.Sequelize.literal(`(select count(1) from sycu_user_order_items where item_type = 5 and product_id = ${id} and user_orders_id = user_orders.user_orders_id)`), { [dbReader.Sequelize.Op.gt]: 0 })
                } */
                idCondition = dbReader.Sequelize.where(dbReader.Sequelize.literal(`(select count(1) from sycu_user_order_items where item_type = 5 and product_id = ${id} and user_orders_id = user_orders.user_orders_id)`), { [dbReader.Sequelize.Op.gt]: 0 })
                redundCondition = dbReader.Sequelize.where(dbReader.Sequelize.literal(`(select count(1) from sycu_refunds where refund_type = 3 and coupon_id = ${id})`), { [dbReader.Sequelize.Op.gt]: 0 })
            }

            //coupon_filter = 0:All, 1:General Coupon Used, 2: Scholarship Used
            if (coupon_filter == 2) {
                refundInclude = {
                    required: true,
                    model: dbReader.refunds,
                    where: { refund_type: 3, coupon_id: id }
                }
            } else if (coupon_filter == 1) {
                refundInclude = {
                    required: true,
                    model: dbReader.refunds,
                    where: { refund_type: 3, coupon_id: id }
                }
            } else {
                let refundData = await dbReader.refunds.findAll({
                    attributes: ['refund_id'],
                    where: { refund_type: 3, coupon_id: id }
                });
                if (refundData.length) {
                    refundInclude = {
                        required: true,
                        model: dbReader.refunds,
                        where: { refund_type: 3, coupon_id: id }
                    }
                } else {
                    refundInclude = {
                        separate: true,
                        model: dbReader.refunds,
                        where: { refund_type: 3 }
                    }
                }
            }

            if (date && (type == 1 || type == 2)) {
                whereCondition = dbReader.sequelize.and(
                    idCondition, { order_status: [2, 3, 4, 5, 6, 8] },
                    dbReader.Sequelize.and(
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_orders`.`created_datetime`'), '%Y-%m-%d '), { [Op.gte]: date.start_date }),
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_orders`.`created_datetime`'), '%Y-%m-%d'), { [Op.lte]: date.end_date })
                    ),
                    dbReader.sequelize.or(
                        { user_order_number: { [searchCondition]: searchData } },
                        [dbReader.Sequelize.where(dbReader.sequelize.col('`sycu_user`.`display_name`'), { [searchCondition]: searchData })],
                        [dbReader.Sequelize.where(dbReader.sequelize.col('`sycu_user`.`email`'), { [searchCondition]: searchData })],
                        [dbReader.Sequelize.where(dbReader.sequelize.col('`user_subscription`.`subscription_number`'), { [searchCondition]: searchData })]
                    )
                )
            } else if (type == 3) {
                let date1 = moment(date).format("YYYY-MM-DD")
                whereCondition = dbReader.sequelize.and(
                    dbReader.Sequelize.and(
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_orders`.`created_datetime`'), '%Y-%m-%d %H:%i'), { [Op.gte]: range.start_date }),
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_orders`.`created_datetime`'), '%Y-%m-%d %H:%i'), { [Op.lte]: range.end_date }),
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_orders`.`created_datetime`'), '%Y-%m-%d'), { [dateCondition]: dateData }),
                    ),
                    dbReader.sequelize.or(
                        { user_order_number: { [searchCondition]: searchData } },
                        [dbReader.Sequelize.where(dbReader.sequelize.col('`sycu_user`.`display_name`'), { [searchCondition]: searchData })],
                        [dbReader.Sequelize.where(dbReader.sequelize.col('`sycu_user`.`email`'), { [searchCondition]: searchData })],
                        [dbReader.Sequelize.where(dbReader.sequelize.col('`user_subscription`.`subscription_number`'), { [searchCondition]: searchData })]
                    ),
                    { order_status: [2, 3, 4, 5, 6, 8] },
                )
            } else {
                whereCondition = dbReader.sequelize.and(
                    idCondition, { order_status: [2, 3, 4, 5, 6, 8] },
                    dbReader.sequelize.or(
                        { user_order_number: { [searchCondition]: searchData } },
                        [dbReader.Sequelize.where(dbReader.sequelize.col('`sycu_user`.`display_name`'), { [searchCondition]: searchData })],
                        [dbReader.Sequelize.where(dbReader.sequelize.col('`sycu_user`.`email`'), { [searchCondition]: searchData })],
                        [dbReader.Sequelize.where(dbReader.sequelize.col('`user_subscription`.`subscription_number`'), { [searchCondition]: searchData })]
                    )
                )
            }

            let getUserOrderList: any = {
                count: 0,
                rows: []
            }
            if (coupon_filter != 2) {
                getUserOrderList = await dbReader.userOrder.findAndCountAll({
                    attributes: ['user_orders_id', 'fees_amount', 'tax_amount', 'sub_amount', 'shipping_amount', 'coupon_amount',
                        'created_datetime', 'user_id', 'user_subscription_id', 'user_order_number', 'order_status', 'total_amount', 'user_order_date',
                        [dbReader.Sequelize.literal(`display_name`), 'user_name'], [dbReader.Sequelize.literal(`email`), 'email'],
                        [dbReader.Sequelize.literal('`user_subscription`.`subscription_number`'), 'subscription_number'],
                        [dbReader.Sequelize.literal('`user_subscription`.`coupon_code`'), 'coupon_code'],
                        [dbReader.Sequelize.literal('`user_subscription`.`site_id`'), 'site_id']
                    ],
                    include: [{
                        required: true,
                        attributes: [],
                        model: dbReader.users,
                    }, {
                        attributes: [],
                        required: true,
                        model: dbReader.userSubscription,
                        where: siteCondition
                    }, {
                        separate: true,
                        model: dbReader.userOrderItems
                    }, {
                        required: false,
                        attributes: [],
                        model: dbReader.transactionMaster,
                        where: { status: "Success", type: 1, charge_id: { [Op.ne]: '' } },
                    }, {
                        required: false,
                        as: 'shippingAddress',
                        model: dbReader.userAddress,
                        attributes: ['user_address_id', 'first_name', 'last_name', 'address_line1', 'address_line2', 'city',
                            'company', 'zipcode', 'state_id', 'country_id', 'phone_number', 'email_address', 'customer_shipping_note',
                            [dbReader.Sequelize.literal('`billingAddress->stateModel`.`state_code`'), 'state_code'],
                            [dbReader.Sequelize.literal('`billingAddress->stateModel`.`name`'), 'state_name']],
                        where: { address_type: 2 },
                        include: [{
                            required: false,
                            attributes: [],
                            model: dbReader.stateModel,
                        }],
                    }, {
                        required: false,
                        as: 'billingAddress',
                        model: dbReader.userAddress,
                        where: { address_type: 1 },
                        attributes: ['user_address_id', 'first_name', 'last_name', 'address_line1', 'address_line2',
                            'city', 'company', 'zipcode', 'state_id', 'country_id', 'phone_number', 'email_address',
                            [dbReader.Sequelize.literal('`billingAddress->stateModel`.`state_code`'), 'state_code'],
                            [dbReader.Sequelize.literal('`billingAddress->stateModel`.`name`'), 'state_name']],
                        include: [{
                            required: false,
                            attributes: [],
                            model: dbReader.stateModel,
                        }]
                    }],
                    where: whereCondition,
                    order: [[sort_field, sort_order]],
                    offset: row_offset,
                    limit: row_limit
                })
                getUserOrderList = JSON.parse(JSON.stringify(getUserOrderList));
            }

            if (coupon_filter != 1) {
                let getUserOrderList2 = await dbReader.userOrder.findAndCountAll({
                    attributes: ['user_orders_id', 'fees_amount', 'tax_amount', 'sub_amount', 'shipping_amount', 'coupon_amount',
                        'created_datetime', 'user_id', 'user_subscription_id', 'user_order_number', 'order_status', 'total_amount', 'user_order_date',
                        [dbReader.Sequelize.literal(`display_name`), 'user_name'], [dbReader.Sequelize.literal(`email`), 'email'],
                        [dbReader.Sequelize.literal('`user_subscription`.`subscription_number`'), 'subscription_number'],
                        [dbReader.Sequelize.literal('`user_subscription`.`coupon_code`'), 'coupon_code'],
                        [dbReader.Sequelize.literal('`user_subscription`.`site_id`'), 'site_id']
                    ],
                    include: [{
                        required: true,
                        attributes: [],
                        model: dbReader.users,
                    }, {
                        attributes: [],
                        required: true,
                        model: dbReader.userSubscription,
                        where: siteCondition
                    }, {
                        separate: true,
                        model: dbReader.userOrderItems
                    }, {
                        required: false,
                        attributes: [],
                        model: dbReader.transactionMaster,
                        where: { status: "Success", type: 1, charge_id: { [Op.ne]: '' } },
                    }, {
                        required: false,
                        as: 'shippingAddress',
                        model: dbReader.userAddress,
                        attributes: ['user_address_id', 'first_name', 'last_name', 'address_line1', 'address_line2', 'city',
                            'company', 'zipcode', 'state_id', 'country_id', 'phone_number', 'email_address', 'customer_shipping_note',
                            [dbReader.Sequelize.literal('`billingAddress->stateModel`.`state_code`'), 'state_code'],
                            [dbReader.Sequelize.literal('`billingAddress->stateModel`.`name`'), 'state_name']],
                        where: { address_type: 2 },
                        include: [{
                            required: false,
                            attributes: [],
                            model: dbReader.stateModel,
                        }],
                    }, {
                        required: false,
                        as: 'billingAddress',
                        model: dbReader.userAddress,
                        where: { address_type: 1 },
                        attributes: ['user_address_id', 'first_name', 'last_name', 'address_line1', 'address_line2',
                            'city', 'company', 'zipcode', 'state_id', 'country_id', 'phone_number', 'email_address',
                            [dbReader.Sequelize.literal('`billingAddress->stateModel`.`state_code`'), 'state_code'],
                            [dbReader.Sequelize.literal('`billingAddress->stateModel`.`name`'), 'state_name']],
                        include: [{
                            required: false,
                            attributes: [],
                            model: dbReader.stateModel,
                        }]
                    }, refundInclude],
                    where: dbReader.sequelize.and(
                        redundCondition, { order_status: [2, 3, 4, 5, 6, 8] },
                        dbReader.sequelize.or(
                            { user_order_number: { [searchCondition]: searchData } },
                            [dbReader.Sequelize.where(dbReader.sequelize.col('`sycu_user`.`display_name`'), { [searchCondition]: searchData })],
                            [dbReader.Sequelize.where(dbReader.sequelize.col('`sycu_user`.`email`'), { [searchCondition]: searchData })],
                            [dbReader.Sequelize.where(dbReader.sequelize.col('`user_subscription`.`subscription_number`'), { [searchCondition]: searchData })]
                        )
                    ),
                    order: [[sort_field, sort_order]],
                    offset: row_offset,
                    limit: row_limit
                })
                getUserOrderList2 = JSON.parse(JSON.stringify(getUserOrderList2));
                if (getUserOrderList2.count > 0) {
                    getUserOrderList.count += getUserOrderList2.count
                    getUserOrderList2.rows.forEach((r: any) => {
                        getUserOrderList.rows.push(r)
                    })
                }
            }

            if (getUserOrderList.count > 0) {
                new SuccessResponse(EC.success, {
                    //@ts-ignore
                    token: req.token,
                    count: getUserOrderList.count,
                    order_list: getUserOrderList.rows
                }).send(res);
            } else {
                new SuccessResponse(EC.noDataFound, {
                    order_list: []
                }).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
}
