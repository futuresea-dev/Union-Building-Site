import { Request, Response } from "express";
import { ErrorController } from "../core/ErrorController";
import { SuccessResponse } from '../core/ApiResponse';
import { BadRequestError, ApiError,AuthFailureError } from '../core/ApiError';
const { dbReader, dbWriter } = require('../models/dbConfig');
import moment from "moment";
const { Op } = dbReader.Sequelize;
const EC = new ErrorController();


export class ReportController{
    public async getRevenueReportData(req: Request, res: Response) {
        try {
            // Getting user Id from bearer token
            const requestContent: any = req;
            let userId = requestContent.user_id;

            let userRole = await dbReader.users.findOne({
                where:{
                    user_id:userId,
                    user_role:[1,2]
                }
            })
            if(userRole)
            {
                let { start_date, end_date, sort_field, sort_order } = req.body;
                let date = moment(new Date()).format("YYYY-MM-DD");
                start_date = (start_date == null || start_date == '') ? date : start_date;
                end_date = (end_date == null || end_date == '') ? date : end_date;
                //Pagination
                var limit = req.body.page_record == undefined ? 10 : parseInt(req.body.page_record);
                var offset = req.body.page_no == undefined ? 1 : parseInt(req.body.page_no);
                // Automatic Offset and limit will set on the base of page number
                var row_limit = limit;
                var row_offset = (offset * limit) - limit;
                // Sorting on fields
                if (sort_field == 'Name') {
                    sort_field = dbReader.sequelize.fn("concat", dbReader.sequelize.literal('`sycu_user`.`first_name`'), ' ', dbReader.sequelize.literal('`sycu_user`.`last_name`'));
                } else if (sort_field == 'email') {
                    sort_field = dbReader.sequelize.literal('`sycu_user`.`email`');
                } else if (sort_field == 'username') {
                    sort_field = dbReader.sequelize.literal('`sycu_user`.`username`');
                } else if (sort_field == 'subscription_number') {
                    sort_field = dbReader.sequelize.literal('`user_order->user_subscription`.`subscription_number`');
                } else sort_field = sort_field;
                sort_field = sort_field ? sort_field : 'created_datetime';
                sort_order = sort_order ? sort_order : 'DESC';
                // Searching
                var searchCondition = dbReader.Sequelize.Op.ne, searchData = null, amountSearch = null;
                if (req.body.search) {
                    searchCondition = Op.like;
                    searchData = '%' + req.body.search + '%';
                    let regExp = /[a-zA-Z]/g;
                    if (!(regExp.test(req.body.search))) {
                        amountSearch = req.body.search;
                    }
                }
                // Filtering
                var filter = dbReader.Sequelize.and();
                if (req.body.filter) {
                    var data = req.body.filter[0];
                    filter = dbReader.Sequelize.and(data);
                }
                let revenuData = await dbReader.transactionMaster.findAndCountAll({
                    attributes:[
                        "created_datetime","charge_id","stripe_customer_id","stripe_card_id","amount","user_id",
                        [dbReader.sequelize.fn("concat", dbReader.sequelize.literal('`sycu_user`.`first_name`'), ' ',
                            dbReader.sequelize.literal('`sycu_user`.`last_name`')), "Name"],
                            [dbReader.sequelize.literal('`sycu_user`.`email`'),'email'],
                            [dbReader.sequelize.literal('`sycu_user`.`username`'),'username'],
                        [dbReader.sequelize.literal('`user_order->user_subscription`.`subscription_number`'),'subscription_number'],
                        [dbReader.sequelize.literal('`user_order->user_subscription`.`user_subscription_id`'),'user_subscription_id']
                    ],
                    where:
                        dbReader.sequelize.and(
                            dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('sycu_transaction_master.created_datetime'), '%Y-%m-%d'),{ [Op.gte]: start_date }),
                            dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('sycu_transaction_master.created_datetime'), '%Y-%m-%d'),{ [Op.lte]: end_date }),
                            filter,
                            {status:"Success"},
                            {amount:{[dbReader.Sequelize.Op.gt]:0}},
                            dbReader.sequelize.or(
                                { amount: { [dbReader.Sequelize.Op.eq]:amountSearch } },
                                [dbReader.Sequelize.where(dbReader.sequelize.fn("concat", dbReader.sequelize.col("first_name"), ' ', dbReader.sequelize.col("last_name")), { [searchCondition]: searchData })],
                                [dbReader.Sequelize.where(dbReader.sequelize.col('`sycu_user`.`email`'), { [searchCondition]: searchData })],
                                [dbReader.Sequelize.where(dbReader.Sequelize.col('`user_order->user_subscription`.`subscription_number`'), { [searchCondition]: searchData })]
                            )
                        ),
                        include: [
                            {
                                required:true,
                                model: dbReader.users,
                                attributes: []
                            },
                            {
                                required:true,
                                model:dbReader.userOrder,
                                attributes:[],
                                include:[
                                    {
                                        required:true,
                                        model:dbReader.userSubscription,
                                        attributes:[]
                                    }
                                ]
                            }
                        ],
                        offset: row_offset,
                        limit: row_limit,
                        order: [[sort_field, sort_order]]
                })
                revenuData = JSON.parse(JSON.stringify(revenuData));
                if (revenuData.rows.length > 0) {
                    new SuccessResponse(EC.success, {
                        count: revenuData.count,
                        rows: revenuData.rows
                    }).send(res);
                }
                else {
                    new SuccessResponse(EC.noDataFound, {
                        count: 0,
                        rows: []
                    }).send(res);
                }
            }
            else{
                ApiError.handle(new AuthFailureError(EC.unauthorizedError), res);
            }
            
        } catch (e:any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getRevenueByProductReportData(req:Request,res:Response){
        try {
            // Getting user Id from bearer token
            const requestContent: any = req;
            let userId = requestContent.user_id;
            let userRole = await dbReader.users.findOne({
                where:{
                    user_id:userId,
                    user_role:[1,2]
                }
            });
            if(userRole) {
                let {start_date,end_date,sort_field, sort_order} = req.body;
                let date = moment(new Date()).format("YYYY-MM-DD");
                start_date = (start_date == null || start_date == '') ? date : start_date;
                end_date = (end_date == null || end_date == '') ? date : end_date;
                //Pagination
                var limit = req.body.page_record == undefined ? 10 : parseInt(req.body.page_record);
                var offset = req.body.page_no == undefined ? 1 : parseInt(req.body.page_no);
                // Automatic Offset and limit will set on the base of page number
                var row_limit = limit;
                var row_offset = (offset * limit) - limit;
                // Sorting on fields
                sort_field = sort_field ? sort_field : 'product_id';
                sort_order = sort_order ? sort_order : 'ASC';
                var searchCondition = dbReader.Sequelize.Op.ne, searchData = null;
                if (req.body.search) {
                    searchCondition = Op.like;
                    searchData = '%' + req.body.search + '%';
                }
                // Filtering
                var filterWhere = {};
                if (req.body.filter) {
                    filterWhere = { site_id: req.body.filter.site_id };
                }
                let whereCondition = dbReader.sequelize.and(
                    dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_order_item->user_order->sycu_transaction_master`.`created_datetime`'), '%Y-%m-%d'),{ [Op.gte]: start_date }),
                    dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_order_item->user_order->sycu_transaction_master`.`created_datetime`'), '%Y-%m-%d'),{ [Op.lte]: end_date }),
                    { is_deleted: 0 },
                    filterWhere,
                    dbReader.Sequelize.or(
                        { product_id: { [searchCondition]: searchData } },
                        { product_name: { [searchCondition]: searchData } },
                        { product_price: { [searchCondition]: searchData } }
                    )
                );
                let includeCondition = [{
                    required: true,
                    model:dbReader.userOrderItems,
                    attributes:[],
                    where: { item_type: 1 },
                    include:[
                        {
                            required:true,
                            model:dbReader.userOrder,
                            attributes:[],
                            include: [{
                                required:true,
                                model:dbReader.transactionMaster,
                                where: { status: "Success" },
                                attributes:[]
                            }]
                        }
                    ]
                }];
                let productData = await dbReader.products.findAndCountAll({
                    attributes: ['product_id', 'product_name', [dbReader.Sequelize.fn("SUM", dbReader.Sequelize.literal('`user_order_item`.`product_amount`')), 'product_price']],
                    where: whereCondition,
                    include: includeCondition,
                    offset: row_offset,
                    limit: row_limit,
                    order: [[sort_field, sort_order]],
                    group: ['user_order_item.product_id']
                })
                let dataForSum = await dbReader.products.findAll({
                    attributes: [[dbReader.Sequelize.fn("SUM", dbReader.Sequelize.literal('`user_order_item`.`product_amount`')), 'product_price']],
                    where: whereCondition,
                    include: includeCondition,
                    group: ['user_order_item.product_id']
                });
                dataForSum = JSON.parse(JSON.stringify(dataForSum));
                let total_sum = 0;
                if (dataForSum.length) {
                    dataForSum.forEach((element: any) => {
                        total_sum += element.product_price
                    });
                }
                productData = JSON.parse(JSON.stringify(productData));
                if (productData.rows.length > 0) {
                    new SuccessResponse(EC.success, {
                        count: productData.count.length,
                        sum : total_sum,
                        rows: productData.rows
                    }).send(res);
                }
                else {
                    new SuccessResponse(EC.noDataFound, {
                        count: 0,
                        rows: []
                    }).send(res);
                }
            } else {
                ApiError.handle(new AuthFailureError(EC.unauthorizedError), res);
            }
        } catch (e:any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }


    public async getRenewalsReportData(req:Request,res:Response){
        try {
            // Getting user Id from bearer token
            const requestContent: any = req;
            let userId = requestContent.user_id;

            let userRole = await dbReader.users.findOne({
                where:{
                    user_id:userId,
                    user_role:[1,2]
                }
            })

            if(userRole)
            {
                let {start_date,end_date,sort_field, sort_order} = req.body;
                let date = moment(new Date()).format("YYYY-MM-DD");
                start_date = (start_date == null || start_date == '') ? date : start_date;
                end_date = (end_date == null || end_date == '') ? date : end_date;
                //Pagination
                var limit = req.body.page_record == undefined ? 10 : parseInt(req.body.page_record);
                var offset = req.body.page_no == undefined ? 1 : parseInt(req.body.page_no);
                // Automatic Offset and limit will set on the base of page number
                var row_limit = limit;
                var row_offset = (offset * limit) - limit;

                // Sorting on fields
                if (sort_field == 'Name') {
                    sort_field = dbReader.sequelize.fn("concat", dbReader.sequelize.literal('`renewalUser`.`first_name`'), ' ', dbReader.sequelize.literal('`renewalUser`.`last_name`'));
                } else if (sort_field == 'email') {
                    sort_field = dbReader.sequelize.literal('`renewalUser`.`email`');
                } else if (sort_field == 'username') {
                    sort_field = dbReader.sequelize.literal('`renewalUser`.`username`');
                } else if (sort_field == 'user_id') {
                    sort_field = dbReader.sequelize.literal('`renewalUser`.`user_id`');
                }else if (sort_field == 'subscription_number') {
                    sort_field = dbReader.sequelize.literal('`renewalSubscription`.`subscription_number`');
                } else if (sort_field == 'total_amount') {
                    sort_field = dbReader.sequelize.literal('`renewalSubscription`.`total_amount`');
                }else if (sort_field == 'order_status') {
                    sort_field = dbReader.sequelize.literal('`renewalOrder`.`order_status`');
                }else sort_field = sort_field;
                sort_field = sort_field ? sort_field : 'renewal_date';
                sort_order = sort_order ? sort_order : 'DESC';
            
                var searchCondition = dbReader.Sequelize.Op.ne, searchData = null,isExecuted = null;
                if (req.body.search) {
                    searchCondition = Op.like;
                    searchData = '%' + req.body.search + '%';
                    if (!(typeof req.body.search == 'string')) {
                        isExecuted = req.body.search;
                    }
                }

                // Filtering
                var filter = dbReader.Sequelize.and();
                if (req.body.filter) {
                    var data = req.body.filter[0];
                    filter = dbReader.Sequelize.and(data);
                }


                let renewalData = await dbReader.subscriptionRenewal.findAndCountAll({
                    attributes:["renewal_date","is_executed","is_deleted",
                    [dbReader.sequelize.fn("concat", dbReader.sequelize.literal('`renewalUser`.`first_name`'), ' ',
                            dbReader.sequelize.literal('`renewalUser`.`last_name`')), "Name"],
                            [dbReader.sequelize.literal('`renewalUser`.`email`'),'email'],
                            [dbReader.sequelize.literal('`renewalUser`.`first_name`'),'first_name'],
                            [dbReader.sequelize.literal('`renewalUser`.`last_name`'),'last_name'],
                            [dbReader.sequelize.literal('`renewalUser`.`user_id`'),'user_id'],
                            [dbReader.sequelize.literal('`renewalUser`.`username`'),'username'],
                            [dbReader.sequelize.literal('`renewalSubscription`.`subscription_number`'),'subscription_number'],
                            
                            [dbReader.sequelize.literal('`renewalSubscription`.`user_subscription_id`'),'user_subscription_id'],
                            [dbReader.sequelize.literal('`renewalSubscription`.`total_amount`'),'total_amount'],
                            [dbReader.sequelize.literal('`renewalOrder`.`order_status`'),'order_status']
                    ],
                    where:
                    dbReader.sequelize.and(
                            dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('sycu_subscription_renewal.renewal_date'), '%Y-%m-%d'),{ [Op.gte]: start_date }),
                            dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('sycu_subscription_renewal.renewal_date'), '%Y-%m-%d'),{ [Op.lte]: end_date }),
                            filter,
                            {is_deleted:0},
                            dbReader.sequelize.or(
                                [dbReader.Sequelize.where(dbReader.sequelize.fn("concat", dbReader.sequelize.col("first_name"), ' ', dbReader.sequelize.col("last_name")), { [searchCondition]: searchData })],
                                [dbReader.Sequelize.where(dbReader.sequelize.col('`renewalUser`.`email`'), { [searchCondition]: searchData })],
                                [dbReader.Sequelize.where(dbReader.Sequelize.col('`renewalSubscription`.`subscription_number`'), { [searchCondition]: searchData })],
                                [dbReader.Sequelize.where(dbReader.Sequelize.col('`renewalSubscription`.`total_amount`'), { [searchCondition]: searchData })]
                            )
                        ),
                        include: [
                                    {
                                        required:true,
                                        model: dbReader.users,
                                        as:"renewalUser",
                                        attributes: []
                                    },
                                    {   
                                        required:true,
                                        model:dbReader.userSubscription,
                                        as:"renewalSubscription",
                                        attributes:[]
                                    },
                                    {   
                                        required:true,
                                        model:dbReader.userOrder,
                                        as:"renewalOrder",
                                        attributes:[]
                                    },
                                ],
                        offset: row_offset,
                        limit: row_limit,
                        order: [[sort_field, sort_order]]

                })

                let sum = await dbReader.subscriptionRenewal.findAll({
                    attributes:[
                         [dbReader.sequelize.fn("sum", dbReader.sequelize.literal('`renewalSubscription`.`total_amount`')),"sum"],
                    ],
                    where:
                    dbReader.sequelize.and(
                            dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('sycu_subscription_renewal.renewal_date'), '%Y-%m-%d'),{ [Op.gte]: start_date }),
                            dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('sycu_subscription_renewal.renewal_date'), '%Y-%m-%d'),{ [Op.lte]: end_date }),
                            {is_deleted:0},
                            filter,
                            dbReader.sequelize.or(
                                [dbReader.Sequelize.where(dbReader.sequelize.fn("concat", dbReader.sequelize.col("first_name"), ' ', dbReader.sequelize.col("last_name")), { [searchCondition]: searchData })],
                                [dbReader.Sequelize.where(dbReader.sequelize.col('`renewalUser`.`email`'), { [searchCondition]: searchData })],
                                [dbReader.Sequelize.where(dbReader.Sequelize.col('`renewalSubscription`.`subscription_number`'), { [searchCondition]: searchData })],
                                [dbReader.Sequelize.where(dbReader.Sequelize.col('`renewalSubscription`.`total_amount`'), { [searchCondition]: searchData })]
                            )
                        ),
                        include: [
                                    {
                                        required:true,
                                        model: dbReader.users,
                                        as:"renewalUser",
                                        attributes: []
                                    },
                                    {   
                                        required:true,
                                        model:dbReader.userSubscription,
                                        as:"renewalSubscription",
                                        attributes:[]
                                    },
                                    {   
                                        required:true,
                                        model:dbReader.userOrder,
                                        as:"renewalOrder",
                                        attributes:[]
                                    },
                                ],
                                distinct:true

                })
                let total = JSON.parse(JSON.stringify(sum));
                // console.log(total[0])
                renewalData = JSON.parse(JSON.stringify(renewalData));
                    if (renewalData.rows.length > 0) {
                        // renewalData.rows.forEach((e:any)=>{
                        //     total = total + e.total_amount
                        // })
                        new SuccessResponse(EC.success, {
                            count: renewalData.count,
                            rows: renewalData.rows,
                            sum : total[0].sum
                        }).send(res);
                    }
                    else {
                        new SuccessResponse(EC.noDataFound, {
                            count: 0,
                            rows: []
                        }).send(res);
                    }
            }
            else{
                ApiError.handle(new AuthFailureError(EC.unauthorizedError), res);
            }
        } catch (e:any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getRegisterdUserReportData(req:Request,res:Response){
        try {
              // Getting user Id from bearer token
            const requestContent: any = req;
            let userId = requestContent.user_id;
            let userRole = await dbReader.users.findOne({
                where:{
                    user_id:userId,
                    user_role:[1,2]
                }
            })
            if(userRole) {
                let {start_date,end_date,sort_field, sort_order} = req.body;
                let date = moment(new Date()).format("YYYY-MM-DD");
                start_date = (start_date == null || start_date == '') ? date : start_date;
                end_date = (end_date == null || end_date == '') ? date : end_date;
                //Pagination
                var limit = req.body.page_record == undefined ? 10 : parseInt(req.body.page_record);
                var offset = req.body.page_no == undefined ? 1 : parseInt(req.body.page_no);
                // Automatic Offset and limit will set on the base of page number
                var row_limit = limit;
                var row_offset = (offset * limit) - limit;
                // Sorting on fields
                if (sort_field == 'email') {
                    sort_field = dbReader.sequelize.literal('`sycu_users`.`email`');
                } else if (sort_field == 'username') {
                    sort_field = dbReader.sequelize.literal('`sycu_users`.`username`');
                }  else if (sort_field == 'first_name') {
                    sort_field = dbReader.sequelize.literal('`sycu_users`.`first_name`');
                } else if (sort_field == 'last_name') {
                    sort_field = dbReader.sequelize.literal('`sycu_users`.`last_name`');
                }else if (sort_field == 'user_id') {
                    sort_field = dbReader.sequelize.literal('`sycu_users`.`user_id`');
                }else if (sort_field == 'via_portal') {
                    sort_field = dbReader.sequelize.literal('`sycu_users`.`via_portal`');
                } else if (sort_field == 'via_platform') {
                    sort_field = dbReader.sequelize.literal('`sycu_users`.`via_platform`');
                }else sort_field = sort_field;
                sort_field = sort_field ? sort_field : 'created_datetime';
                sort_order = sort_order ? sort_order : 'DESC';
                var searchCondition = dbReader.Sequelize.Op.ne, searchData = null;
                if (req.body.search) {
                    searchCondition = Op.like;
                    searchData = '%' + req.body.search + '%'
                }
                // Filtering
                var filter = dbReader.Sequelize.and(), filterWhere = {};
                if (req.body.filter) {
                    var data = req.body.filter;
                    if (data != undefined) {
                        if (data.subscription_status != undefined) {
                            if (data.subscription_status == 1) {
                                filterWhere = dbReader.Sequelize.where(dbReader.Sequelize.literal(`(select count(1) from sycu_user_subscriptions where subscription_status IN (2, 4) AND user_id = sycu_users.user_id)`), { [dbReader.Sequelize.Op.gt]: 0 });
                            }
                            else if (data.subscription_status == 0) {
                                filterWhere = dbReader.Sequelize.where(dbReader.Sequelize.literal(`(select count(1) from sycu_user_subscriptions where subscription_status IN (2, 4) AND user_id = sycu_users.user_id)`), { [dbReader.Sequelize.Op.eq]: 0 });
                            }
                        }
                        if (data.via_platform!= undefined) {
                            filter = { "via_platform": data.via_platform };
                        }
                    }
                }
                let userData = await dbReader.users.findAndCountAll({
                    attributes:[
                        "user_id","email","first_name","last_name","username","via_portal","via_platform","created_datetime",
                        [dbReader.sequelize.fn("concat", dbReader.sequelize.literal('`sycu_users`.`first_name`'), ' ',
                        dbReader.sequelize.literal('`sycu_users`.`last_name`')), "Name"],
                    ],
                    where:
                    dbReader.sequelize.and(
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('sycu_users.created_datetime'), '%Y-%m-%d'),{ [Op.gte]: start_date }),
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('sycu_users.created_datetime'), '%Y-%m-%d'),{ [Op.lte]: end_date }),
                        {
                            is_deleted:0
                        },
                        dbReader.sequelize.or(
                            { user_id: { [searchCondition]: searchData } },
                            { first_name: { [searchCondition]: searchData } },
                            { last_name: { [searchCondition]: searchData } },
                            { email: { [searchCondition]: searchData } },
                            { username: { [searchCondition]: searchData } }
                        ),
                        filterWhere,
                        filter
                    ),
                    include:[
                        {
                            separate: true,
                            model:dbReader.userSubscription,
                            attributes:["user_subscription_id","subscription_status"]
                        }
                    ],
                    offset: row_offset,
                    limit: row_limit,
                    order: [[sort_field, sort_order]]
                })
                userData = JSON.parse(JSON.stringify(userData));
                if (userData.rows.length > 0) {
                    new SuccessResponse(EC.success, {
                        count: userData.count,
                        rows: userData.rows
                    }).send(res);
                }
                else {
                    new SuccessResponse(EC.noDataFound, {
                        count: 0,
                        rows: []
                    }).send(res);
                }
            }
            else{
                ApiError.handle(new AuthFailureError(EC.unauthorizedError), res);
            }
        } catch (e:any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
}