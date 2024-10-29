import { Request, Response } from "express";
import { ErrorController, SuccessResponse, BadRequestError, ApiError } from '../core/index';
const { dbReader } = require('../models/dbConfig');
const { GeneralController } = require('./generalController');
const { Op } = dbReader.Sequelize;
const EC = new ErrorController();

export class transactionController {
    public listTransaction = async (req: Request, res: Response) => {
        try {
            let { site_id, user_id } = req.body;
            //Pagination
            var limit = req.body.page_record == undefined ? 10 : parseInt(req.body.page_record);
            var offset = req.body.page_no == undefined ? 0 : parseInt(req.body.page_no);
            // Automatic offset and limit will set on the base of page number
            var row_limit = limit;
            var row_offset = offset == 0 ? 0 : (offset * limit) - limit;
            //Sorting
            var sortField = 'created_datetime', sortOrder = "DESC";
            if (req.body.sortField) {
                sortField = req.body.sortField
            }
            if (req.body.sortOrder) {
                sortOrder = req.body.sortOrder;
            }
            // Searching                           
            var SearchCondition = dbReader.Sequelize.Op.ne, SearchData = null;
            if (req.body.search) {
                SearchCondition = Op.like;
                SearchData = "%" + req.body.search + "%";
            }
            // Filtering
            var filter = dbReader.Sequelize.and();
            if (req.body.filter) {
                var data = req.body.filter;
                filter = dbReader.Sequelize.and(data);
            }
            // Site Filter
            let siteIdCond = dbReader.Sequelize.Op.ne, siteIdData = null;
            if (site_id) {
                siteIdCond = dbReader.Sequelize.Op.eq;
                siteIdData = site_id;
            }
            let getTransactionList = await dbReader.transactionMaster.findAndCountAll({
                attributes: ['parent_id', 'transaction_id', 'request_json', 'response_json', 'status', 'stripe_customer_id', 'stripe_card_id', 'amount', 'created_datetime', 'type', 'transaction_details'],
                where: dbReader.Sequelize.and(
                    { user_id: user_id },
                    dbReader.Sequelize.or(
                        { request_json: { [SearchCondition]: SearchData } },
                        { response_json: { [SearchCondition]: SearchData } },
                        { status: { [SearchCondition]: SearchData } },
                        { stripe_customer_id: { [SearchCondition]: SearchData } },
                        { stripe_card_id: { [SearchCondition]: SearchData } },
                        { amount: { [SearchCondition]: SearchData } },
                        { created_datetime: { [SearchCondition]: SearchData } },
                        //filter,
                        dbReader.Sequelize.where(dbReader.Sequelize.literal('`sycu_user`.`first_name`'), { [SearchCondition]: SearchData }),
                        dbReader.Sequelize.where(dbReader.Sequelize.literal('`sycu_user`.`last_name`'), { [SearchCondition]: SearchData }),
                        dbReader.Sequelize.where(dbReader.Sequelize.literal('`sycu_user`.`email`'), { [SearchCondition]: SearchData }),
                        dbReader.Sequelize.where(dbReader.Sequelize.literal('`sycu_site`.`title`'), { [SearchCondition]: SearchData })
                    ),
                    { site_id: { [siteIdCond]: siteIdData } },
                    filter),
                include: [{
                    required: true,
                    model: dbReader.users,
                    attributes: ['user_id', 'first_name', 'last_name', 'email'],
                }, {
                    model: dbReader.sites,
                    attributes: ['title'],
                }, {
                    model: dbReader.userOrder,
                    include: [{
                        model: dbReader.userSubscription,
                        // attributes: ['subscription_number', 'pg_transaction_type'],
                    }, {
                        separate: true,
                        model: dbReader.userOrderItems,
                        where: { is_deleted: 0 },
                        include: [{
                            attributes: ['product_duration'],
                            model: dbReader.products,
                        }]
                    }, {
                        separate: true,
                        model: dbReader.refunds
                    }]
                }],
                offset: row_offset,
                limit: row_limit,
                order: [[sortField, sortOrder]]
            })
            if (getTransactionList.count > 0) {
                new SuccessResponse(EC.success, {
                    //@ts-ignore
                    token: req.token,
                    data: getTransactionList
                }).send(res);
            }
            else {
                new SuccessResponse(EC.noDataFound, {
                    //@ts-ignore
                    token: req.token,
                    data: {
                        count: 0,
                        rows: []
                    }
                }).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public getTransactionDetails = async (req: Request, res: Response) => {
        try {
            let generalControllerObj = new GeneralController();
            let { token = null, user_id = 0 } = generalControllerObj.getCurrentUserDetail(req, res);
            let { user_orders_id } = req.body;
            let transactionDetails = await dbReader.userOrder.findOne({
                include: [{
                    model: dbReader.transactionMaster,
                    where: {
                        status: "Success"
                    }
                }],
                where: {
                    user_orders_id: user_orders_id
                },
            });
            new SuccessResponse(EC.success, {
                token: token,
                transactionDetails
            }).send(res);

            // console.log(transactionDetails.sycu_transaction_master.charge_id);

        }
        catch (error: any) {
            ApiError.handle(new BadRequestError(error.message), res);
        }
    }
}