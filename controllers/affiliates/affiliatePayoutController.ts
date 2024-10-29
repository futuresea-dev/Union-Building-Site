import { Request, Response } from "express";
import { ErrorController } from "../../core/ErrorController";
import { SuccessResponse } from '../../core/ApiResponse';
import { BadRequestError, ApiError } from '../../core/ApiError';
const { GeneralController } = require('../generalController');
const { dbReader, dbWriter } = require('../../models/dbConfig');
const { Op } = dbReader.Sequelize;
const EC = new ErrorController();

export class AffiliatePayoutController {

    public payoutList = async (req: Request, res: Response) => {
        try {
            // Getting user detail from token
            const requestContent: any = req;
            const token = requestContent.token;
            let payout = await dbReader.affiliatePayouts.findAll({
                include: [
                    {
                        model: dbReader.affiliates,
                        attributes: [[dbReader.Sequelize.literal('`sycu_users`.`display_name`'), 'user_name']],
                        include: [{
                            model: dbReader.users,
                            attributes: [],
                        }],
                        where: { is_deleted: 0 },
                    }, {
                        model: dbReader.users,
                        attributes: [],
                    }
                ],
                attributes: ['affiliate_payout_id', 'affiliate_referral_ids', 'amount',
                    [dbReader.Sequelize.literal('`sycu_users`.`display_name`'), 'generated_by'], 'payment_method', 'status', 'created_datetime'],
                where: { is_deleted: 0 },
            });
            payout = JSON.parse(JSON.stringify(payout));
            payout.forEach((element: any) => {
                element.affiliate = (element.affiliate) ? element.affiliate.user_name : "";
            });
            new SuccessResponse(EC.DataFetched, {
                token: token,
                payout: payout,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async addUpdateAffiliatePayout(req: Request, res: Response) {
        try {
            if (req.body.affiliate_payout_id && req.body.affiliate_payout_id != 0) {
                req.body.updated_datetime = new Date();
                let updateAffiliatePayout = await dbWriter.affiliatePayouts.update({
                    affiliate_referral_ids: req.body.affiliate_referral_ids.toString(), //need to save as comma seperated values
                    affiliate_id: req.body.affiliate_id,
                    amount: req.body.amount,
                    payment_method: req.body.payment_method,
                    transaction_id: req.body.transaction_id,
                    status: req.body.status,
                    updated_datetime: req.body.updated_datetime,
                    updated_by: req.body.updated_by,
                },
                    {
                        where: {
                            affiliate_payout_id: req.body.affiliate_payout_id,
                        }
                    }
                );
                let getAffiliatePayoutsData = await dbReader.affiliatePayouts.findOne({
                    where: {
                        affiliate_payout_id: req.body.affiliate_payout_id
                    }
                });
                getAffiliatePayoutsData = JSON.parse(JSON.stringify(getAffiliatePayoutsData));
                new SuccessResponse(EC.affiliatePayoutUpdate, {
                    ...getAffiliatePayoutsData
                }).send(res);
            }
            else {
                req.body.created_datetime = new Date();
                let insertAffiliatePayout = await dbWriter.affiliatePayouts.create({
                    affiliate_referral_ids: req.body.affiliate_referral_ids.toString(), //need to save as comma seperated values
                    affiliate_id: req.body.affiliate_id,
                    amount: req.body.amount,
                    payment_method: req.body.payment_method,
                    transaction_id: req.body.transaction_id,
                    status: req.body.status,
                    //created_datetime: req.body.created_datetime,
                    created_by: req.body.created_by,
                })
                insertAffiliatePayout = JSON.parse(JSON.stringify(insertAffiliatePayout));
                if (insertAffiliatePayout) {
                    new SuccessResponse(EC.affiliatePayoutCreate, {
                        ...insertAffiliatePayout
                    }).send(res);
                }
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async deleteAffiliatePayout(req: Request, res: Response) {
        try {

            if (req.body.affiliate_payout_id != null && req.body.affiliate_payout_id != '') {
                let data = await dbWriter.affiliatePayouts.update({
                    is_deleted: 1
                },
                    {
                        where: {
                            affiliate_payout_id: req.body.affiliate_payout_id
                        }
                    });
                let getData = await dbReader.affiliatePayouts.findOne({
                    where: {
                        affiliate_payout_id: req.body.affiliate_payout_id
                    }
                })

                if (getData) {
                    getData = JSON.parse(JSON.stringify(getData));
                    //console.log(getData)
                    let data = getData.affiliate_referral_ids.split(',')
                    //console.log(data);
                    await dbWriter.affiliateReferrals.update({
                        status: 0
                    }, {
                        where: {
                            affiliate_referral_id: {
                                [Op.in]: data
                            }
                        }
                    })
                }
                getData = JSON.parse(JSON.stringify(getData));
                new SuccessResponse(EC.success, {
                    ...getData
                }).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }


    public listAffiliatePayout = async (req: Request, res: Response) => {
        try {
            let { search, page_no, page_record, sort_field, sort_order, payment_method, status, start_date, end_date } = req.body;
            let generalObj = new GeneralController();
            let { user_id, user_role } = generalObj.getCurrentUserDetail(req, res);

            let rowOffset = 0, rowLimit;
            let SearchCondition = dbReader.Sequelize.Op.ne, SearchData = null, amountSearch = null;

            let date = new Date();
            end_date = (end_date == null || end_date == '') ? date : end_date;

            if (sort_field == 'generated_by') {
                sort_field = dbReader.sequelize.fn("concat", dbReader.sequelize.literal('`sycu_user`.`first_name`'), ' ', dbReader.sequelize.literal('`sycu_user`.`last_name`'));
            } else sort_field = sort_field;
            sort_field = sort_field ? sort_field : 'affiliate_payout_id';
            sort_order = sort_order ? sort_order : 'ASC';

            if (isNaN(page_record) || page_record == undefined) {
                rowLimit = EC.pageRecordFor10Page;
            }
            else {
                rowLimit = page_record;
            }
            if (page_no) {
                rowOffset = (page_no * rowLimit) - rowLimit;
            }
            if (search) {
                SearchCondition = dbReader.Sequelize.Op.like;
                SearchData = "%" + search + "%";
                let regExp = /[a-zA-Z]/g;
                if (!(regExp.test(search))) {
                    amountSearch = search;
                }
            }

            let methodCond = dbReader.Sequelize.Op.ne, methodData = null;
            if (payment_method == 1 || payment_method == 2) {
                methodCond = dbReader.Sequelize.Op.eq;
                methodData = payment_method;
            }

            let statusCond = dbReader.Sequelize.Op.ne, statusData = null;
            if (status == 1 || status == 0) {
                statusCond = dbReader.Sequelize.Op.eq;
                statusData = status;
            }

            let whereCondition;
            if (start_date != '' && start_date != null) {
                whereCondition = dbReader.Sequelize.and({ is_deleted: 0 }, { payment_method: { [methodCond]: methodData } }, { status: { [statusCond]: statusData } }, [dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`affiliate_payouts`.`created_datetime`'), '%Y-%m-%d'), { [Op.gte]: start_date }),
                dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`affiliate_payouts`.`created_datetime`'), '%Y-%m-%d'), { [Op.lte]: end_date })],
                    dbReader.Sequelize.or(
                        { amount: { [dbReader.Sequelize.Op.eq]: amountSearch } },
                        dbReader.Sequelize.where(
                            dbReader.sequelize.fn("concat", dbReader.sequelize.col("`sycu_user`.`first_name`"), ' ', dbReader.sequelize.col("`sycu_user`.`last_name`")), { [SearchCondition]: SearchData }
                        ),
                        dbReader.Sequelize.where(
                            dbReader.sequelize.fn("concat", dbReader.sequelize.col("`affiliate->sycu_user`.`first_name`"), ' ', dbReader.sequelize.col("`affiliate->sycu_user`.`last_name`")), { [SearchCondition]: SearchData }
                        ),
                        { affiliate_payout_id: { [SearchCondition]: SearchData } }
                    ));
            } else if (end_date != '' && end_date != null) {
                whereCondition = dbReader.Sequelize.and({ is_deleted: 0 }, { payment_method: { [methodCond]: methodData } }, { status: { [statusCond]: statusData } }, [dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`affiliate_payouts`.`created_datetime`'), '%Y-%m-%d'), { [Op.lte]: end_date })],
                    dbReader.Sequelize.or(
                        { amount: { [dbReader.Sequelize.Op.eq]: amountSearch } },
                        dbReader.Sequelize.where(
                            dbReader.sequelize.fn("concat", dbReader.sequelize.col("`sycu_user`.`first_name`"), ' ', dbReader.sequelize.col("`sycu_user`.`last_name`")), { [SearchCondition]: SearchData }
                        ),
                        dbReader.Sequelize.where(
                            dbReader.sequelize.fn("concat", dbReader.sequelize.col("`affiliate->sycu_user`.`first_name`"), ' ', dbReader.sequelize.col("`affiliate->sycu_user`.`last_name`")), { [SearchCondition]: SearchData }
                        ),
                        { affiliate_payout_id: { [SearchCondition]: SearchData } }
                    ));
            } else {
                whereCondition = dbReader.Sequelize.and({ is_deleted: 0 }, { payment_method: { [methodCond]: methodData } }, { status: { [statusCond]: statusData } },
                    dbReader.Sequelize.or(
                        { amount: { [dbReader.Sequelize.Op.eq]: amountSearch } },
                        dbReader.Sequelize.where(
                            dbReader.sequelize.fn("concat", dbReader.sequelize.col("`sycu_user`.`first_name`"), ' ', dbReader.sequelize.col("`sycu_user`.`last_name`")), { [SearchCondition]: SearchData }
                        ),
                        dbReader.Sequelize.where(
                            dbReader.sequelize.fn("concat", dbReader.sequelize.col("`affiliate->sycu_user`.`first_name`"), ' ', dbReader.sequelize.col("`affiliate->sycu_user`.`last_name`")), { [SearchCondition]: SearchData }
                        ),
                        { affiliate_payout_id: { [SearchCondition]: SearchData } }
                    ));
            }
            let includeWhere, origin;
            if (process.env.NODE_ENV == "production") {
                origin = `https://affiliate.stuffyoucanuse.org`
            } else {
                origin = `https://affiliate.stuffyoucanuse.dev`
            }
            if (user_role == 3 || req.headers.origin == origin) {
                includeWhere = { user_id: user_id }
            } else {
                includeWhere = 1
            }
            let payout = await dbReader.affiliatePayouts.findAndCountAll({
                attributes: ['affiliate_payout_id', 'affiliate_referral_ids', [dbReader.sequelize.fn("concat", dbReader.sequelize.col("`sycu_user`.`first_name`"), ' ', dbReader.sequelize.col("`sycu_user`.`last_name`")), "generated_by"], [dbReader.sequelize.literal("`affiliate->sycu_user`.`email`"), "email"], [dbReader.sequelize.fn("concat", dbReader.sequelize.col("`affiliate->sycu_user`.`first_name`"), ' ', dbReader.sequelize.col("`affiliate->sycu_user`.`last_name`")), "affiliate_user"], 'amount', 'payment_method', 'status', 'created_datetime'],
                where: whereCondition,
                include: [{
                    model: dbReader.affiliates,
                    where: includeWhere,
                    attributes: [],
                    include: [{
                        required: true,
                        model: dbReader.users,
                        attributes: []
                    }]
                }, {
                    required: false,
                    model: dbReader.users,
                    attributes: [],
                }],
                limit: rowLimit,
                offset: rowOffset,
                order: [[sort_field, sort_order]]
            });
            if (payout.rows.length > 0) {
                payout.rows = JSON.parse(JSON.stringify(payout.rows));
                payout.rows.forEach((element: any) => {
                    element.affiliate = element.affiliate_user
                });
                new SuccessResponse(EC.errorMessage(EC.getMessage, ["Affiliate Payout"]), {
                    // @ts-ignore
                    token: req.token,
                    count: payout.count,
                    rows: payout.rows
                }).send(res);
            } else new SuccessResponse(EC.noDataFound, {
                count: 0,
                rows: []
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public listReferralByPayoutId = async (req: Request, res: Response) => {
        try {
            let payOutData = await dbReader.affiliatePayouts.findOne({
                where: {
                    affiliate_payout_id: req.body.affiliate_payout_id
                }
            })
            if (payOutData) {
                payOutData = JSON.parse(JSON.stringify(payOutData));
                let data = payOutData.affiliate_referral_ids.split(',')
                if (data) {
                    let referralData = await dbReader.affiliateReferrals.findAndCountAll({
                        where: {
                            affiliate_referral_id: {
                                [Op.in]: data
                            }
                        }
                    })
                    referralData = JSON.parse(JSON.stringify(referralData.rows));
                    payOutData.referrals = referralData
                }
            }
            new SuccessResponse(EC.success, {
                ...payOutData
            }).send(res);

        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
    public calculatePayout = async (req: Request, res: Response) => {
        try {
            let calculateData = await dbReader.affiliateReferrals.findAndCountAll({
                where: dbReader.Sequelize.and(
                    { affiliate_id: req.body.affiliate_id },
                    { status: 0 },
                    { is_deleted: 0 },
                    dbReader.Sequelize.and(
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('created_datetime'), '%Y-%m-%d'), { [Op.gte]: req.body.start_date }),
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('created_datetime'), '%Y-%m-%d'), { [Op.lte]: req.body.end_date })))
            })
            calculateData = JSON.parse(JSON.stringify(calculateData));
            if (calculateData) {
                new SuccessResponse(EC.success, {
                    ...calculateData
                }).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public payAffiliate = async (req: Request, res: Response) => {
        try {
            // Getting user Id from bearer token
            const requestContent: any = req;
            let userId = requestContent.user_id;

            let createPayout = await dbWriter.affiliatePayouts.create({
                affiliate_id: req.body.affiliate_id,
                affiliate_referral_ids: req.body.affiliate_referral_ids,
                amount: req.body.amount,
                payment_method: 1,
                transaction_id: 0,
                status: 1,
                created_by: userId,
                created_datetime: new Date()
            })
            if (createPayout) {
                createPayout = JSON.parse(JSON.stringify(createPayout));
                let data = createPayout.affiliate_referral_ids.split(',')
                let updateReferralStatus = await dbWriter.affiliateReferrals.update({
                    status: 1
                }, {
                    where: {
                        affiliate_referral_id: {
                            [Op.in]: data
                        }
                    }
                })
            }
            new SuccessResponse(EC.success, {
                ...createPayout
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
}
