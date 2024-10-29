import { Request, Response } from 'express';
import { ErrorController, SuccessResponse, BadRequestError, ApiError } from '../../core/index';
import moment from "moment";
const { GeneralController } = require('../generalController');
const { dbReader, dbWriter } = require('../../models/dbConfig');
const { Op } = dbReader.Sequelize;
const EC = new ErrorController();

export class AffiliateReferralController {


    // Shraddha
    public saveAffiliateReferral = async (req: Request, res: Response) => {
        try {
            let { affiliate_referral_id, affiliate_id, affiliate_visit_id, referral_user_id, notes, amount, user_subscription_id, type, status } = req.body;

            if (affiliate_referral_id != 0) {
                if (affiliate_visit_id != 0) {
                    await dbWriter.affiliateReferrals.update({
                        amount: amount,
                        type: type,
                        status: status,
                        updated_datetime: moment().format("YYYY-MM-DD HH:mm:ss")
                    }, { where: { affiliate_referral_id: affiliate_referral_id } });
                } else {
                    await dbWriter.affiliateReferrals.update({
                        affiliate_visit_id: affiliate_visit_id || 0,
                        referral_user_id: referral_user_id || 0,
                        notes: notes,
                        amount: amount,
                        user_subscription_id: user_subscription_id.toString(),
                        type: type,
                        status: status
                    }, { where: { affiliate_referral_id: affiliate_referral_id } });
                }
            } else {
                await dbWriter.affiliateReferrals.create({
                    affiliate_id: affiliate_id,
                    affiliate_visit_id: affiliate_visit_id || 0,
                    referral_user_id: referral_user_id || 0,
                    notes: notes,
                    amount: amount,
                    user_subscription_id: user_subscription_id.toString(),
                    type: type,
                    status: status
                });
            }
            new SuccessResponse(EC.errorMessage(EC.savedMessage, ["Affiliate Referral"]), {
                // @ts-ignore
                token: req.token
            }).send(res);
        }
        catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    };

    public userListAffiliateReferral = async (req: Request, res: Response) => {
        try {
            let { search, page_no, page_record } = req.body;
            let rowOffset = 0, rowLimit;
            if (isNaN(page_record) || page_record == undefined) {
                rowLimit = EC.pageRecordFor10Page;
            }
            else {
                rowLimit = page_record;
            }
            let SearchCondition = dbReader.Sequelize.Op.ne, SearchData = null;
            if (page_no) {
                rowOffset = (page_no * rowLimit) - rowLimit;
            }
            if (search) {
                SearchCondition = dbReader.Sequelize.Op.like;
                SearchData = "%" + search + "%";
            }

            let data = await dbReader.affiliates.findAndCountAll({
                attributes: ['affiliate_id', [dbReader.sequelize.fn("concat", dbReader.sequelize.col("first_name"), ' ', dbReader.sequelize.col("last_name")), "user_name"], [dbReader.sequelize.literal("email"), "email"]],
                where: dbReader.Sequelize.and({ is_deleted: 0 },
                    dbReader.Sequelize.or(
                        { affiliate_id: { [SearchCondition]: SearchData } },
                        { affiliate_code: { [SearchCondition]: SearchData } },
                        [dbReader.Sequelize.where(
                            dbReader.sequelize.fn("concat", dbReader.sequelize.col("first_name"), ' ', dbReader.sequelize.col("last_name")), { [SearchCondition]: SearchData }
                        )],
                        [dbReader.Sequelize.where(
                            dbReader.sequelize.col("email"), { [SearchCondition]: SearchData }
                        )]
                    )
                ),
                include: [{
                    required: true,
                    model: dbReader.users,
                    attributes: [],
                    where: { is_deleted: 0 }
                }],
                limit: rowLimit,
                offset: rowOffset,
                order: [['affiliate_id', 'ASC']]
            });

            if (data.rows.length > 0) {
                new SuccessResponse(EC.errorMessage(EC.getMessage, ["Affiliate Users"]), { // @ts-ignore
                    token: req.token,
                    count: data.count,
                    rows: data.rows
                }).send(res);
            } else new SuccessResponse(EC.noDataFound, {
                rows: data.rows
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public listAffiliateReferral = async (req: Request, res: Response) => {
        try {
            let { search, page_no, page_record, sort_field, sort_order, type, status, start_date, end_date,range } = req.body;
            let rowOffset = 0, rowLimit;
            let date = new Date();
            end_date = (end_date == null || end_date == '') ? date : end_date;
            let SearchCondition = dbReader.Sequelize.Op.ne, SearchData = null, amountSearch = null;
            if (sort_field == 'affiliate_user') {
                sort_field = dbReader.sequelize.fn("concat", dbReader.sequelize.literal('`affiliate->sycu_user`.`first_name`'), ' ', dbReader.sequelize.literal('`affiliate->sycu_user`.`last_name`'));
            } if (sort_field == 'referred_user') {
                sort_field = dbReader.sequelize.fn("concat", dbReader.sequelize.literal('`sycu_user`.`first_name`'), ' ', dbReader.sequelize.literal('`sycu_user`.`last_name`'));
            } else sort_field = sort_field;
            sort_field = sort_field ? sort_field : 'affiliate_referral_id';
            sort_order = sort_order ? sort_order : 'DESC';
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
            let generalObj = new GeneralController();
            let { user_id, user_role } = generalObj.getCurrentUserDetail(req, res);
            let typeCond = dbReader.Sequelize.Op.ne, typeData = null;
            if (type == 1 || type == 2) {
                typeCond = dbReader.Sequelize.Op.eq;
                typeData = type;
            }
            let statusCond = dbReader.Sequelize.Op.ne, statusData = null;
            if (status == 1 || status == 0) {
                statusCond = dbReader.Sequelize.Op.eq;
                statusData = status;
            }
            let whereCondition, includeWhere, origin;
            if (process.env.NODE_ENV == "production") {
                origin = `https://affiliate.stuffyoucanuse.org`
            } else {
                origin = `https://affiliate.stuffyoucanuse.dev`
            }
            if (user_role == 3 || req.headers.origin == origin) {
                includeWhere = { is_deleted: 0, user_id: user_id }
                if (start_date != '' && start_date != null) {
                    whereCondition = dbReader.Sequelize.and({ is_deleted: 0 }, { type: { [typeCond]: typeData } }, { status: { [statusCond]: statusData } }, [dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`affiliate_referrals`.`created_datetime`'), '%Y-%m-%d'), { [Op.gte]: start_date }),
                    dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`affiliate_referrals`.`created_datetime`'), '%Y-%m-%d'), { [Op.lte]: end_date })],
                        dbReader.Sequelize.or(
                            { user_subscription_id: { [SearchCondition]: SearchData } },
                            { amount: { [dbReader.Sequelize.Op.eq]: amountSearch } },
                            dbReader.sequelize.where(dbReader.sequelize.fn('concat', dbReader.sequelize.literal('`sycu_user`.`first_name`'), ' ', dbReader.sequelize.literal('`sycu_user`.`last_name`')), { [SearchCondition]: SearchData }),
                            { affiliate_referral_id: { [SearchCondition]: SearchData } }
                        ));
                } else if (end_date != '' && end_date != null) {
                    whereCondition = dbReader.Sequelize.and({ is_deleted: 0 }, { type: { [typeCond]: typeData } }, { status: { [statusCond]: statusData } }, [dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`affiliate_referrals`.`created_datetime`'), '%Y-%m-%d'), { [Op.lte]: end_date })],
                        dbReader.Sequelize.or(
                            { user_subscription_id: { [SearchCondition]: SearchData } },
                            { amount: { [dbReader.Sequelize.Op.eq]: amountSearch } },
                            dbReader.sequelize.where(dbReader.sequelize.fn('concat', dbReader.sequelize.literal('`sycu_user`.`first_name`'), ' ', dbReader.sequelize.literal('`sycu_user`.`last_name`')), { [SearchCondition]: SearchData }),
                            { affiliate_referral_id: { [SearchCondition]: SearchData } }
                        ));
                } else {
                    whereCondition = dbReader.Sequelize.and({ is_deleted: 0 }, { type: { [typeCond]: typeData } }, { status: { [statusCond]: statusData } },
                        dbReader.Sequelize.or(
                            { user_subscription_id: { [SearchCondition]: SearchData } },
                            { amount: { [dbReader.Sequelize.Op.eq]: amountSearch } },
                            dbReader.sequelize.where(dbReader.sequelize.fn('concat', dbReader.sequelize.literal('`sycu_user`.`first_name`'), ' ', dbReader.sequelize.literal('`sycu_user`.`last_name`')), { [SearchCondition]: SearchData }),
                            { affiliate_referral_id: { [SearchCondition]: SearchData } }
                        ));
                }
            } else {
                includeWhere = { is_deleted: 0 }
                whereCondition = dbReader.Sequelize.and({ is_deleted: 0 }, { type: { [typeCond]: typeData } }, { status: { [statusCond]: statusData } },
                    dbReader.Sequelize.and(
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`affiliate_referrals`.`created_datetime`'), '%Y-%m-%d %H:%i'), { [dbReader.Sequelize.Op.gte]: range.start_date }),
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`affiliate_referrals`.`created_datetime`'), '%Y-%m-%d %H:%i'), { [dbReader.Sequelize.Op.lte]: range.end_date }),
                      ),
                    dbReader.Sequelize.or(
                        { user_subscription_id: { [SearchCondition]: SearchData } },
                        { amount: { [dbReader.Sequelize.Op.eq]: amountSearch } },
                        dbReader.sequelize.where(dbReader.sequelize.fn('concat', dbReader.sequelize.literal('`sycu_user`.`first_name`'), ' ', dbReader.sequelize.literal('`sycu_user`.`last_name`')), { [SearchCondition]: SearchData }),
                        dbReader.sequelize.where(dbReader.sequelize.fn('concat', dbReader.sequelize.literal('`affiliate->sycu_user`.`first_name`'), ' ', dbReader.sequelize.literal('`affiliate->sycu_user`.`last_name`')), { [SearchCondition]: SearchData }),
                        { affiliate_referral_id: { [SearchCondition]: SearchData } }
                    ));
            }
            whereCondition = { ...whereCondition,  user_subscription_id: { [Op.ne]: 0  } }
            let data = await dbReader.affiliateReferrals.findAndCountAll({
                attributes: ['affiliate_referral_id', 'affiliate_id', 'affiliate_source', [dbReader.sequelize.literal("`sycu_user`.`user_id`"), "referred_user_id"], [dbReader.sequelize.fn("concat", dbReader.sequelize.col("`sycu_user`.`first_name`"), ' ', dbReader.sequelize.col("`sycu_user`.`last_name`")), "referred_user"], [dbReader.sequelize.literal("`sycu_user`.`email`"), "referred_email"], [dbReader.sequelize.fn("concat", dbReader.sequelize.col("`affiliate->sycu_user`.`first_name`"), ' ', dbReader.sequelize.col("`affiliate->sycu_user`.`last_name`")), "affiliate_user"], [dbReader.sequelize.literal("`affiliate->sycu_user`.`email`"), "email"], 'user_subscription_id', 'notes', 'amount', 'type', 'status', 'created_datetime'],
                where: whereCondition,
                include: [{
                    required: true,
                    model: dbReader.affiliates,
                    attributes: [],
                    where: includeWhere,
                    include: [{
                        model: dbReader.users,
                        attributes: [],
                        where: { is_deleted: 0 }
                    }]
                }, {
                    model: dbReader.users,
                    attributes: [],
                }],
                limit: rowLimit,
                offset: rowOffset,
                order: [[sort_field, sort_order]]
            });
            if (data.rows.length > 0) {
                new SuccessResponse(EC.errorMessage(EC.getMessage, ["Affiliate Referral"]), { // @ts-ignore
                    token: req.token,
                    count: data.count,
                    rows: data.rows
                }).send(res);
            } else new SuccessResponse(EC.noDataFound, {
                count: 0,
                rows: []
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public deleteAffiliateReferral = async (req: Request, res: Response) => {
        try {
            let { affiliate_referral_id } = req.params;
            await dbWriter.affiliateReferrals.update({
                is_deleted: 1
            }, {
                where: { affiliate_referral_id: affiliate_referral_id }
            });

            new SuccessResponse(EC.errorMessage(EC.deletedMessage, ["Affiliate Referral"]), {
                // @ts-ignore
                token: req.token
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    };

    public referralPayout = async (req: Request, res: Response) => {
        try {
            let { affiliate_referral_id, status } = req.body;

            let generalObj = new GeneralController();
            let { user_id } = generalObj.getCurrentUserDetail(req, res);

            let affiliateReferralsDetails = await dbReader.affiliateReferrals.findOne({
                where: { affiliate_referral_id: affiliate_referral_id }
            })
            await dbWriter.affiliateReferrals.update({
                status: status
            }, {
                where: { affiliate_referral_id: affiliate_referral_id }
            });

            if (status) {
                await dbWriter.affiliatePayouts.create({
                    affiliate_referral_ids: affiliate_referral_id,
                    affiliate_id: affiliateReferralsDetails.affiliate_id,
                    amount: affiliateReferralsDetails.amount,
                    payment_method: 1,
                    transaction_id: 0,
                    status: 1,
                    created_by: user_id
                })
            }

            new SuccessResponse(EC.errorMessage(EC.successMessage, ["Referral Payout"]), {
                // @ts-ignore
                token: req.token
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    };

    public getAffiliateReferralsForPayout = async (req: Request, res: Response) => {
        try {
            // let generalObj = new GeneralController();
            // let { user_id, user_role } = generalObj.getCurrentUserDetail(req, res);
            let { affiliate_payout_id } = req.params;
            if (affiliate_payout_id != null && affiliate_payout_id != "") {
                let getAffiliatePayoutsData = await dbReader.affiliatePayouts.findOne({
                    where: {
                        affiliate_payout_id: affiliate_payout_id,
                        is_deleted: 0
                    }
                });
                let affiliate_referral_ids = [];
                if (getAffiliatePayoutsData != null && getAffiliatePayoutsData.affiliate_referral_ids && getAffiliatePayoutsData.affiliate_referral_ids != "") {
                    affiliate_referral_ids = getAffiliatePayoutsData.affiliate_referral_ids.split(',').map(Number);
                }

                let whereCondition;
                whereCondition = {
                    affiliate_referral_id: {
                        [Op.in]: affiliate_referral_ids
                    },
                    is_deleted: 0
                }
                let data = await dbReader.affiliateReferrals.findAndCountAll({
                    attributes: [[dbReader.sequelize.fn("concat", dbReader.sequelize.literal('`affiliate->sycu_user`.`first_name`'), ' ', dbReader.sequelize.col('`affiliate->sycu_user`.`last_name`')), 'affiliate_user'], 'affiliate_id', 'affiliate_referral_id', 'user_subscription_id', 'notes', 'amount', 'type', 'status', 'created_datetime'],
                    where: whereCondition,
                    include: [{
                        required: true,
                        model: dbReader.affiliates,
                        attributes: [],
                        where: { is_deleted: 0 },
                        include: [{
                            required: true,
                            model: dbReader.users,
                            attributes: [],
                            where: { is_deleted: 0 }
                        }]
                    }]
                });

                if (data.rows.length > 0) {
                    new SuccessResponse(EC.errorMessage(EC.getMessage, ["Affiliate Referrals for Payout"]), { // @ts-ignore
                        token: req.token,
                        count: data.count,
                        rows: data.rows
                    }).send(res);
                } else new SuccessResponse(EC.noDataFound, {
                    rows: data.rows
                }).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
}
