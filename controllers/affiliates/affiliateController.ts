import { Request, Response } from "express";
import { ErrorController } from "../../core/ErrorController";
import { SuccessResponse } from '../../core/ApiResponse';
import { BadRequestError, ApiError } from '../../core/ApiError';
const { dbReader, dbWriter } = require('../../models/dbConfig');
const { Op } = dbReader.Sequelize;
import { RandomString } from '../../helpers/helpers';
const EC = new ErrorController();

export class AffiliateController {
    public async affiliateCode(req: Request, res: Response) {
        try {
            let code = RandomString(6);
            new SuccessResponse(EC.codeGenerated, {
                code: code
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async listAffiliate(req: Request, res: Response) {
        try {
            let row_limit = !req.body.page_record ? 10 : parseInt(req.body.page_record);
            let offset = !req.body.page_no ? 1 : parseInt(req.body.page_no);
            let row_offset = (offset * row_limit) - row_limit;
            // Searching 
            let searchCondition = dbReader.Sequelize.Op.ne, searchData = null;
            if (req.body.search) {
                searchCondition = Op.like;
                searchData = '%' + req.body.search + '%'
            }

            // Status Filtering
            let filter = dbReader.Sequelize.and();
            let id = null, idCondition = Op.ne;
            if (req.body.affiliate_id && req.body.affiliate_id != 0) {
                idCondition = Op.in;
                id = [req.body.affiliate_id];
            }
            if (req.body.filter) {
                let data = req.body.filter[0];
                filter = dbReader.Sequelize.and(data);
            }

            //Type Filtering
            let FilterType = {}
            let typeFilter = !req.body.filter_type ? 0 : req.body.filter_type;
            if (typeFilter == 1) {
                FilterType = { is_curriculum: 1 }
            } else if (typeFilter == 2) {
                FilterType = { is_grow_con: 1 }
            }

            let sortField = 'affiliate_id', sortOrder = 'DESC';
            let sortJoin = [[sortField, sortOrder]];
            sortOrder = req.body.sortOrder;
            sortField = req.body.sortField;
            if (sortField == "rate") {
                sortJoin = [dbReader.Sequelize.literal('rate'), sortOrder];
            } else if (sortField == "consecutive_renewal_rate") {
                sortJoin = [dbReader.Sequelize.literal('consecutive_renewal_rate'), sortOrder];
            } else if (sortField == "visit") {
                sortJoin = [dbReader.Sequelize.literal('(select count(`affiliate_id`) as count from `affiliate_visits` where `affiliates`.`affiliate_id` = `affiliate_visits`.`affiliate_id`)'), sortOrder];
            } else if (sortField == "paid_earning") {
                sortJoin = [dbReader.sequelize.literal(`(SELECT COALESCE(SUM(amount),0) FROM affiliate_referrals where affiliates.affiliate_id = affiliate_referrals.affiliate_id AND affiliate_referrals.status = 1 AND affiliate_referrals.is_deleted=0)`), sortOrder]
            } else if (sortField == "unpaid_earning") {
                sortJoin = [dbReader.sequelize.literal(`(SELECT COALESCE(SUM(amount),0) FROM affiliate_referrals where affiliates.affiliate_id = affiliate_referrals.affiliate_id AND affiliate_referrals.status = 0 AND affiliate_referrals.is_deleted=0)`), sortOrder]
            } else if (sortField == 'user_name') {
                sortJoin = [dbReader.sequelize.fn("concat", dbReader.sequelize.literal('first_name'), ' ', dbReader.sequelize.literal('last_name')), sortOrder];
            }

            let affiliateData = await dbReader.affiliates.findAndCountAll({
                attributes: ['affiliate_id', 'affiliate_code', 'user_id', 'rate', 'rate_type', 'status', 'first_renewal_rate', 'second_renewal_rate', 'consecutive_renewal_rate', 'renewal_level', 'is_curriculum', 'is_grow_con', 'grow_con_expire_time','two_plus_year_commission_rate','two_plus_year_commission_rate_type','created_datetime',
                    [dbReader.sequelize.fn("concat", dbReader.sequelize.literal('`sycu_user`.`first_name`'), ' ', dbReader.sequelize.literal('`sycu_user`.`last_name`')), "user_name"],
                    [dbReader.sequelize.literal('`sycu_user`.`email`'), "email"],
                    [dbReader.Sequelize.literal(`(SELECT COUNT(affiliate_id) FROM affiliate_visits where affiliates.affiliate_id = affiliate_visits.affiliate_id)`), 'visit'],
                    // [dbReader.Sequelize.literal(`(SELECT COUNT(affiliate_id) FROM affiliate_referrals where affiliates.affiliate_id = affiliate_referrals.affiliate_id and affiliate_referrals.user_subscription_id != 0 and affiliate_referrals.type = 1 AND affiliate_referrals.is_deleted=0)`), 'referrals'],
                    [dbReader.Sequelize.literal(`(SELECT COUNT(affiliate_id) FROM affiliate_referrals where affiliates.affiliate_id = affiliate_referrals.affiliate_id and affiliate_referrals.is_deleted=0)`), 'referrals'],
                    // [dbReader.sequelize.literal(`(SELECT COALESCE(SUM(amount),0) FROM affiliate_referrals where affiliates.affiliate_id = affiliate_referrals.affiliate_id AND affiliate_referrals.status = 0 AND affiliate_referrals.is_deleted=0 and affiliate_referrals.user_subscription_id != 0 and affiliate_referrals.type = 1)`), 'unpaid_earning'],
                    [dbReader.sequelize.literal(`(SELECT COALESCE(SUM(amount),0) FROM affiliate_referrals where affiliates.affiliate_id = affiliate_referrals.affiliate_id AND affiliate_referrals.status = 0 AND affiliate_referrals.is_deleted=0)`), 'unpaid_earning'],
                    // [dbReader.sequelize.literal(`(SELECT COALESCE(SUM(amount),0) FROM affiliate_referrals where affiliates.affiliate_id = affiliate_referrals.affiliate_id AND affiliate_referrals.status = 1 AND affiliate_referrals.is_deleted=0 and affiliate_referrals.user_subscription_id != 0 and affiliate_referrals.type = 1)`), 'paid_earning']
                    [dbReader.sequelize.literal(`(SELECT COALESCE(SUM(amount),0) FROM affiliate_referrals where affiliates.affiliate_id = affiliate_referrals.affiliate_id AND affiliate_referrals.status = 1 AND affiliate_referrals.is_deleted=0)`), 'paid_earning'],
                    [dbReader.sequelize.literal(`(SELECT COUNT(affiliate_referral_id) FROM affiliate_referrals where affiliates.affiliate_id = affiliate_referrals.affiliate_id AND affiliate_referrals.status = 0 AND affiliate_referrals.is_deleted=0)`), 'unpaid_earning_count'],
                    [dbReader.sequelize.literal(`(SELECT COUNT(affiliate_referral_id) FROM affiliate_referrals where affiliates.affiliate_id = affiliate_referrals.affiliate_id AND affiliate_referrals.status = 1 AND affiliate_referrals.is_deleted=0)`), 'paid_earning_count'],
                ],
                where: dbReader.sequelize.and({ is_deleted: 0, affiliate_id: { [idCondition]: id } }, filter, FilterType,
                    dbReader.sequelize.or(
                        { affiliate_code: { [searchCondition]: searchData } },
                        [dbReader.Sequelize.where(dbReader.sequelize.fn("concat", dbReader.sequelize.col("first_name"), ' ', dbReader.sequelize.col("last_name")), { [searchCondition]: searchData })],
                        [dbReader.Sequelize.where(dbReader.sequelize.col('`sycu_user`.`email`'), { [searchCondition]: searchData })]
                    )),
                include: [{
                    model: dbReader.users,
                    attributes: []
                }],
                offset: row_offset,
                limit: row_limit,
                order: [sortJoin]
            });
            if (affiliateData.rows.length > 0) {
                affiliateData = JSON.parse(JSON.stringify(affiliateData));
                new SuccessResponse(EC.listAffiliate, {
                    count: affiliateData.count,
                    rows: affiliateData.rows
                }).send(res);
            } else {
                new SuccessResponse(EC.noDataFound, {
                    count: 0,
                    rows: []
                }).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    // SH - 12/01/23
    public getAffiliateDetails = async (req: Request, res: Response) => {
        try {
            let { affiliate_id, search, page_no, page_record, sort_field, sort_order, type, status } = req.body;
            let rowOffset = 0, rowLimit;
            // Searching
            let SearchCondition = dbReader.Sequelize.Op.ne, SearchData = null, amountSearch = null;
            if (search) {
                SearchCondition = dbReader.Sequelize.Op.like;
                SearchData = "%" + search + "%";
                let regExp = /[a-zA-Z]/g;
                if (!(regExp.test(search))) {
                    amountSearch = search;
                }
            }
            // Pagination
            if (isNaN(page_record) || page_record == undefined) {
                rowLimit = EC.pageRecordFor10Page;
            } else { rowLimit = page_record; }
            if (page_no) {
                rowOffset = (page_no * rowLimit) - rowLimit;
            }
            // Sorting
            if (sort_field == 'affiliate_referral_id') {
                sort_field = dbReader.sequelize.literal('affiliate_referral_id');
            } else if (sort_field == 'affiliate_user') {
                sort_field = dbReader.sequelize.fn("concat", dbReader.sequelize.literal('`affiliate->sycu_user`.`first_name`'), ' ', dbReader.sequelize.literal('`affiliate->sycu_user`.`last_name`'));
            } else if (sort_field == 'referred_user') {
                sort_field = dbReader.sequelize.fn("concat", dbReader.sequelize.literal('`sycu_user`.`first_name`'), ' ', dbReader.sequelize.literal('`sycu_user`.`last_name`'));
            } else sort_field = sort_field;
            // Conditional where case
            let whereCondition, includeWhere, origin, data;
            if (process.env.NODE_ENV == "production") {
                origin = `https://affiliate.stuffyoucanuse.org`
            } else {
                origin = `https://affiliate.stuffyoucanuse.dev`
            }
            includeWhere = { affiliate_id: affiliate_id, is_deleted: 0 }
            if (type == 'visit') {
                sort_field = sort_field ? sort_field : 'affiliate_visit_id';
                sort_order = sort_order ? sort_order : 'ASC';
                whereCondition = dbReader.Sequelize.or(
                    { url: { [SearchCondition]: SearchData } },
                    [dbReader.Sequelize.where(
                        dbReader.sequelize.fn("concat", dbReader.sequelize.col("`sycu_user`.`first_name`"), ' ', dbReader.sequelize.col("`sycu_user`.`last_name`")), { [SearchCondition]: SearchData }
                    )],
                    { affiliate_visit_id: { [SearchCondition]: SearchData } }
                );
                data = await dbReader.affiliateVisits.findAndCountAll({
                    where: whereCondition,
                    attributes: ['affiliate_visit_id', 'url', 'referrer', 'ip_address', [dbReader.sequelize.fn("concat", dbReader.sequelize.literal("`sycu_user`.`first_name`"), ' ', dbReader.sequelize.literal("`sycu_user`.`last_name`")), "referred_user"], [dbReader.sequelize.literal('`sycu_user`.`email`'), "email"], 'created_datetime'],
                    include: [{
                        required: true,
                        model: dbReader.affiliates,
                        attributes: [],
                        where: includeWhere,
                        include: [{
                            model: dbReader.users,
                            attributes: []
                        }],
                    }, {
                        model: dbReader.users,
                        attributes: [],
                    }, {
                        separate: true,
                        model: dbReader.affiliateReferrals,
                    }],
                    limit: rowLimit,
                    offset: rowOffset,
                    order: [[sort_field, sort_order]]
                });
                if (data.rows.length > 0) {
                    data.rows = JSON.parse(JSON.stringify(data.rows));
                    data.rows.forEach((e: any) => {
                        if ((e.affiliate_referrals).length > 0) {
                            e.affiliate_referrals = JSON.parse(JSON.stringify(e.affiliate_referrals));
                            e.converted = e.affiliate_referrals && e.affiliate_referrals[0].affiliate_referral_id == null ? false : true;
                            let user_subscriptions: any = [];
                            (e.affiliate_referrals).forEach((el: any) => {
                                if (!(user_subscriptions.includes(el.user_subscription_id))) {
                                    user_subscriptions.push(el.user_subscription_id)
                                }
                            });
                            e.user_subscription_id = user_subscriptions;
                        } else {
                            e.converted = false;
                            e.user_subscription_id = ''
                        }
                        delete e.affiliate_referrals
                    });
                }
            } else {
                sort_field = sort_field ? sort_field : 'affiliate_referral_id';
                sort_order = sort_order ? sort_order : 'DESC';
                whereCondition = dbReader.Sequelize.and({ is_deleted: 0 },
                    dbReader.Sequelize.or(
                        { user_subscription_id: { [SearchCondition]: SearchData } },
                        { amount: { [dbReader.Sequelize.Op.eq]: amountSearch } },
                        dbReader.sequelize.where(dbReader.sequelize.fn('concat', dbReader.sequelize.literal('`sycu_user`.`first_name`'), ' ', dbReader.sequelize.literal('`sycu_user`.`last_name`')), { [SearchCondition]: SearchData }),
                        dbReader.sequelize.where(dbReader.sequelize.fn('concat', dbReader.sequelize.literal('`affiliate->sycu_user`.`first_name`'), ' ', dbReader.sequelize.literal('`affiliate->sycu_user`.`last_name`')), { [SearchCondition]: SearchData }),
                        { affiliate_referral_id: { [SearchCondition]: SearchData } }
                    ));
                if (type == 'unpaid') {
                    whereCondition = { ...whereCondition, status: 0 }
                } else if (type == 'paid') {
                    whereCondition = { ...whereCondition, status: 1 }
                }
                if (status == 0) {
                    whereCondition = { ...whereCondition, status: 0 }
                } else if (status == 1) {
                    whereCondition = { ...whereCondition, status: 1 }
                }
                data = await dbReader.affiliateReferrals.findAndCountAll({
                    attributes: ['affiliate_referral_id', 'affiliate_id', [dbReader.sequelize.literal("`sycu_user`.`user_id`"), "referred_user_id"], [dbReader.sequelize.fn("concat", dbReader.sequelize.col("`sycu_user`.`first_name`"), ' ', dbReader.sequelize.col("`sycu_user`.`last_name`")), "referred_user"], [dbReader.sequelize.literal("`sycu_user`.`email`"), "referred_email"], [dbReader.sequelize.fn("concat", dbReader.sequelize.col("`affiliate->sycu_user`.`first_name`"), ' ', dbReader.sequelize.col("`affiliate->sycu_user`.`last_name`")), "affiliate_user"], [dbReader.sequelize.literal("`affiliate->sycu_user`.`email`"), "email"], 'user_subscription_id', 'notes', 'amount', 'type', 'status', 'rate_type', 'rate', 'created_datetime'],
                    where: whereCondition,
                    include: [{
                        required: true,
                        model: dbReader.affiliates,
                        attributes: [],
                        where: includeWhere,
                        include: [{
                            model: dbReader.users,
                            attributes: [],
                            // where: { is_deleted: 0 }
                        }]
                    }, {
                        model: dbReader.users,
                        attributes: [],
                    }],
                    limit: rowLimit,
                    offset: rowOffset,
                    order: [[sort_field, sort_order]]
                });
            }
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

    public async addUpdateAffiliate(req: Request, res: Response) {
        try {
            if (req.body.affiliate_id && req.body.affiliate_id != 0) {
                req.body.updated_datetime = new Date();
                let { is_curriculum = 0, is_grow_con = 0, grow_con_expire_time = '',two_plus_year_commission_rate,two_plus_year_commission_rate_type } = req.body
                is_curriculum = (!is_curriculum && !is_grow_con) ? 1 : is_curriculum;

                let updateAffiliate = await dbWriter.affiliates.update({
                    rate_type: req.body.rate_type,
                    rate: req.body.rate,
                    first_renewal_rate: req.body.first_renewal_rate,
                    second_renewal_rate: req.body.second_renewal_rate,
                    consecutive_renewal_rate: req.body.consecutive_renewal_rate,
                    renewal_level: req.body.renewal_level,
                    status: req.body.status,
                    is_curriculum: is_curriculum,
                    is_grow_con: is_grow_con,
                    grow_con_expire_time: grow_con_expire_time,
                    two_plus_year_commission_rate,
                    two_plus_year_commission_rate_type
                }, {
                    where: { affiliate_id: req.body.affiliate_id }
                });
                let getAffiliateData = await dbReader.affiliates.findOne({
                    where: { affiliate_id: req.body.affiliate_id }
                });
                getAffiliateData = JSON.parse(JSON.stringify(getAffiliateData));
                new SuccessResponse(EC.affiliateUpdate, {
                    ...getAffiliateData
                }).send(res);
            } else {
                let findUserIdData = await dbReader.affiliates.findOne({
                    where: { user_id: req.body.user_id, is_deleted: 0 }
                })
                if (findUserIdData) {
                    new SuccessResponse(EC.affiliateUser, {}).send(res);
                } else {
                    let { is_curriculum = 0, is_grow_con = 0, grow_con_expire_time = '', two_plus_year_commission_rate,two_plus_year_commission_rate_type } = req.body
                    is_curriculum = (!is_curriculum && !is_grow_con) ? 1 : is_curriculum;
                    let insertAffiliate = await dbWriter.affiliates.create({
                        user_id: req.body.user_id,
                        affiliate_code: req.body.affiliate_code,
                        rate_type: req.body.rate_type,
                        rate: req.body.rate,
                        first_renewal_rate: req.body.first_renewal_rate,
                        second_renewal_rate: req.body.second_renewal_rate,
                        consecutive_renewal_rate: req.body.consecutive_renewal_rate,
                        renewal_level: req.body.renewal_level,
                        status: req.body.status,
                        is_curriculum: is_curriculum,
                        is_grow_con: is_grow_con,
                        grow_con_expire_time: grow_con_expire_time,
                        two_plus_year_commission_rate,
                        two_plus_year_commission_rate_type
                    })
                    insertAffiliate = JSON.parse(JSON.stringify(insertAffiliate));
                    if (insertAffiliate) {
                        await dbWriter.affiliates.update({
                            affiliate_code: insertAffiliate.affiliate_id
                        }, {
                            where: { affiliate_id: insertAffiliate.affiliate_id }
                        })
                        new SuccessResponse(EC.affiliateCreate, {
                            ...insertAffiliate
                        }).send(res);
                    }
                }
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async deleteAffiliate(req: Request, res: Response) {
        try {
            if (req.body.affiliate_id && req.body.affiliate_id != 0) {
                let data = await dbWriter.affiliates.update({
                    is_deleted: 1
                },
                    {
                        where: {
                            affiliate_id: req.body.affiliate_id
                        }
                    });
                let getData = await dbReader.affiliates.findOne({
                    where: {
                        affiliate_id: req.body.affiliate_id
                    }
                })
                console.log(data)
                getData = JSON.parse(JSON.stringify(getData));
                new SuccessResponse(EC.success, {
                    ...getData
                }).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async shareLink(req: Request, res: Response) {

        try {

            let linkData = await dbReader.affiliates.findOne({
                attributes: ['affiliate_id'],
                where: {
                    affiliate_id: req.body.affiliate_id,
                    is_deleted: 0
                }
            })

            let shareLink;

            if (linkData) {

                linkData = JSON.parse(JSON.stringify(linkData));
                shareLink = process.env.Affiliate_share_link + '?ref=' + linkData.affiliate_id

            }

            new SuccessResponse(EC.success, {
                shareable_link: shareLink
            }).send(res);

        } catch (e: any) {

            ApiError.handle(new BadRequestError(e.message), res);

        }

    }

    public async verifyAffiliateUser(req: Request, res: Response) {
        try {
            // Getting user Id from bearer token
            const requestContent: any = req;
            let userId = requestContent.user_id;
            let findUser = await dbReader.affiliates.findOne({
                where: { user_id: userId }
            })
            if (findUser) {
                findUser = JSON.parse(JSON.stringify(findUser))
                new SuccessResponse(EC.success, {
                    is_affiliate_user: 1,
                    affiliate_code: findUser.affiliate_code,
                    affiliate_id: findUser.affiliate_id,
                    is_curriculum: findUser.is_curriculum,
                    is_grow_con: findUser.is_grow_con,
                }).send(res);
            }
            else {
                new SuccessResponse(EC.userNotFound, { is_affiliate_user: 0 }).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async updateAffiliateReferalRate(req: Request, res: Response) {
        try {
            let allAffiliate = await dbReader.affiliates.findAll({});

            if (allAffiliate.length) {
                let affiliate_id: any = [];
                let rate_type = "case affiliate_id", rate = "case affiliate_id";

                allAffiliate.forEach(async (element: any) => {
                    affiliate_id.push(element.affiliate_id);
                    rate_type += " when " + element.affiliate_id + " then " + element.rate_type;
                    rate += " when " + element.affiliate_id + " then " + element.rate;
                });
                if (affiliate_id.length) {
                    rate_type += " else rate_type end";
                    rate += " else rate end";

                    await dbWriter.affiliate_referrals.update({
                        rate_type: dbWriter.Sequelize.literal(rate_type),
                        rate: dbWriter.Sequelize.literal(rate),
                    }, {
                        where: { affiliate_id: affiliate_id }
                    });
                }
            }
            new SuccessResponse(EC.success, {}).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
}
