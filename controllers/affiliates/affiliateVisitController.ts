import { Request, Response } from 'express'
import { ErrorController, SuccessResponse, BadRequestError, ApiError } from '../../core/index';
const { dbReader, dbWriter } = require('../../models/dbConfig');
const { Op } = dbReader.Sequelize;
const { GeneralController } = require('../generalController');
const EC = new ErrorController();

export class Affiliates {

    public listAffiliatesVisitData = async (req: Request, res: Response) => {
        try {
            let { page_no, page_record, search, sort_field, sort_order, converted, start_date, end_date } = req.body;
            let generalObj = new GeneralController();
            let { user_id, user_role } = generalObj.getCurrentUserDetail(req, res);
            let date = new Date();
            end_date = (end_date == null || end_date == '') ? date : end_date;
            let rowOffset = 0, rowLimit;
            if (isNaN(page_record) || page_record == undefined) {
                rowLimit = EC.pageRecordFor10Page;
            }
            else {
                rowLimit = page_record;
            }
            if (page_no) { rowOffset = (page_no * rowLimit) - rowLimit; }
            let SearchCondition = dbReader.Sequelize.Op.ne, SearchData = null;
            if (sort_field == 'affiliate_referral_id') {
                sort_field = dbReader.sequelize.literal('affiliate_referral_id');
            } else if (sort_field == 'user_name') {
                sort_field = dbReader.sequelize.fn("concat", dbReader.sequelize.literal('`sycu_user`.`first_name`'), ' ', dbReader.sequelize.literal('`sycu_user`.`last_name`'));
            } else sort_field = sort_field;
            sort_field = sort_field ? sort_field : 'affiliate_visit_id';
            sort_order = sort_order ? sort_order : 'ASC';
            //condition for search
            if (search) {
                SearchCondition = dbReader.Sequelize.Op.like;
                SearchData = "%" + search + "%";
            }
            let whereCondition;
            if (start_date != '' && start_date != null) {
                whereCondition = dbReader.Sequelize.and([dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`affiliate_visits`.`created_datetime`'), '%Y-%m-%d'), { [Op.gte]: start_date }),
                dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`affiliate_visits`.`created_datetime`'), '%Y-%m-%d'), { [Op.lte]: end_date })], dbReader.Sequelize.or(
                    { url: { [SearchCondition]: SearchData } },
                    [dbReader.Sequelize.where(
                        dbReader.sequelize.fn("concat", dbReader.sequelize.col("`sycu_user`.`first_name`"), ' ', dbReader.sequelize.col("`sycu_user`.`last_name`")), { [SearchCondition]: SearchData }
                    )],
                    { affiliate_visit_id: { [SearchCondition]: SearchData } }
                ));
            } else if (end_date != '' && end_date != null) {
                whereCondition = dbReader.Sequelize.and([dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`affiliate_visits`.`created_datetime`'), '%Y-%m-%d'), { [Op.lte]: end_date })], dbReader.Sequelize.or(
                    { url: { [SearchCondition]: SearchData } },
                    [dbReader.Sequelize.where(
                        dbReader.sequelize.fn("concat", dbReader.sequelize.literal("`sycu_user`.`first_name`"), ' ', dbReader.sequelize.literal("`sycu_user`.`last_name`")), { [SearchCondition]: SearchData }
                    )],
                    { affiliate_visit_id: { [SearchCondition]: SearchData } }
                ));
            } else {
                whereCondition = dbReader.Sequelize.or(
                    { url: { [SearchCondition]: SearchData } },
                    [dbReader.Sequelize.where(
                        dbReader.sequelize.fn("concat", dbReader.sequelize.col("`sycu_user`.`first_name`"), ' ', dbReader.sequelize.col("`sycu_user`.`last_name`")), { [SearchCondition]: SearchData }
                    )],
                    { affiliate_visit_id: { [SearchCondition]: SearchData } }
                );
            }
            let includeWhere, origin;
            if (process.env.NODE_ENV == "production") {
                origin = `https://affiliate.stuffyoucanuse.org`
            } else {
                origin = `https://affiliate.stuffyoucanuse.dev`
            }
            if (user_role == 3 || req.headers.origin == origin) {
                includeWhere = { user_id: user_id, is_deleted: 0 }
            } else {
                includeWhere = { is_deleted: 0 }
            }
            let data;
            if (converted == 1 || converted == 0) {
                if (converted == 1) {
                    whereCondition = dbReader.Sequelize.and(
                        dbReader.Sequelize.where(dbReader.Sequelize.literal('(select count(1) from affiliate_referrals where affiliate_referrals.affiliate_visit_id = `affiliate_visits`.`affiliate_visit_id`)'), { [dbReader.Sequelize.Op.gt]: 0 }),
                        whereCondition
                    )
                } else {
                    whereCondition = dbReader.Sequelize.and(
                        dbReader.Sequelize.where(dbReader.Sequelize.literal('(select count(1) from affiliate_referrals where affiliate_referrals.affiliate_visit_id = `affiliate_visits`.`affiliate_visit_id`)'), { [dbReader.Sequelize.Op.eq]: 0 }),
                        whereCondition
                    )
                }
                data = await dbReader.affiliateVisits.findAndCountAll({
                    where: whereCondition,
                    attributes: ['affiliate_visit_id', 'url', 'referrer', 'ip_address', [dbReader.sequelize.fn("concat", dbReader.sequelize.literal("`sycu_user`.`first_name`"), ' ', dbReader.sequelize.literal("`sycu_user`.`last_name`")), "referred_user"], [dbReader.sequelize.literal('`sycu_user`.`email`'), "email"], 'created_datetime'],
                    include: [{
                        separate: true,
                        model: dbReader.affiliateReferrals,
                    }, {
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
                    }],
                    limit: rowLimit,
                    offset: rowOffset,
                    order: [[sort_field, sort_order]]
                });
            } else {
                data = await dbReader.affiliateVisits.findAndCountAll({
                    where: whereCondition,
                    attributes: ['affiliate_visit_id', 'url', 'referrer', 'ip_address', [dbReader.sequelize.fn("concat", dbReader.sequelize.literal("`sycu_user`.`first_name`"), ' ', dbReader.sequelize.literal("`sycu_user`.`last_name`")), "referred_user"], [dbReader.sequelize.literal('`sycu_user`.`email`'), "email"], 'created_datetime'],
                    include: [{
                        separate: true,
                        //required: false,
                        model: dbReader.affiliateReferrals,
                    }, {
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
                    }],
                    limit: rowLimit,
                    offset: rowOffset,
                    order: [[sort_field, sort_order]]
                });
            }
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
                new SuccessResponse(EC.errorMessage(EC.getMessage, ["Visit"]), { // @ts-ignore
                    token: req.token,
                    count: data.count,
                    rows: data.rows
                }).send(res);
            } else new SuccessResponse(EC.noDataFound, {
                // @ts-ignore
                token: req.token,
                count: 0,
                rows: []
            }).send(res);
        }
        catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }


}
