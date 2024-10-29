import { Request, Response } from "express";
import { ErrorController } from "../../core/ErrorController";
import { SuccessResponse } from '../../core/ApiResponse';
import { BadRequestError, ApiError } from '../../core/ApiError';
import { getDateRange } from '../../helpers/helpers';
import moment from "moment";
const { GeneralController } = require('../generalController');
const { dbReader } = require('../../models/dbConfig');
const { Op } = dbReader.Sequelize;
const EC = new ErrorController();
const dateFormatter = require('date-and-time');

export class AffiliateDashboardController {

    public async getLatestAffiliateRegistrations(req: Request, res: Response) {
        try {
            //included pagination
            const page_no = parseInt(req.body.page_no as string) || 1;
            const page_record = parseInt(req.body.page_record as string) || 10;
            const offset = (page_no - 1) * page_record;

            //searching
            const search = req.body.search || '';

            let rows = await dbReader.affiliates.findAndCountAll({
                attributes: ['affiliate_id', 'affiliate_code', 'status', 'created_datetime',
                    [dbReader.sequelize.fn("concat", dbReader.sequelize.literal('`sycu_user`.`first_name`'), ' ', dbReader.sequelize.literal('`sycu_user`.`last_name`')), "user_name"],
                    [dbReader.sequelize.col('`sycu_user`.`email`'), 'email']
                ],

                where: dbReader.sequelize.and(
                   {is_deleted: 0,
                    [Op.or]: [
                        {
                            '$sycu_user.first_name$': {
                                [Op.like]: `%${search}%`
                            }
                        },
                        {
                            '$sycu_user.last_name$': {
                                [Op.like]: `%${search}%`
                            }
                        },{
                            '$sycu_user.email$': {
                                [Op.like]: `%${search}%`
                            }
                        },
                        
                    ]
                   }
                    
                ),
                include: [
                    {
                        required: true,
                        model: dbReader.users,
                        attributes: []
                    },
                ],
                order: [['affiliate_id', 'DESC']],
                limit: page_record,
                offset: offset
            })
            rows = JSON.parse(JSON.stringify(rows));

            if (rows) {
                new SuccessResponse(EC.latestAffiliateRegistrations, {
                    ...rows
                }).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getMostValuableAffiliates(req: Request, res: Response) {
        try {
             //included pagination
             const page_no = parseInt(req.body.page_no as string) || 1;
             const page_record = parseInt(req.body.page_record as string) || 10;
             const offset = (page_no - 1) * page_record;

             //searching
            const search = req.body.search || '';
             
            let rows = await dbReader.affiliateReferrals.findAndCountAll({
                attributes: ['affiliate_referral_id',
                    [dbReader.sequelize.fn("concat", dbReader.sequelize.literal('`affiliate->sycu_user`.`first_name`'), ' ', dbReader.sequelize.literal('`affiliate->sycu_user`.`last_name`')), "affiliate_user_name"],
                    [dbReader.Sequelize.literal('COUNT(DISTINCT(`affiliate_visit`.`affiliate_visit_id`))'), "visits"],
                    [dbReader.Sequelize.fn("count", dbReader.Sequelize.col("affiliate_referral_id")), "referrals"],
                    [dbReader.Sequelize.fn("sum", dbReader.Sequelize.col("amount")), "earnings"]
                ],
                group: [dbReader.sequelize.literal('`affiliate_referrals`.`affiliate_id`')],
                where: dbReader.sequelize.and({
                    is_deleted: 0,
                    [Op.or]: [
                        {
                            '$affiliate.sycu_user.first_name$': {
                                [Op.like]: `%${search}%`
                            }
                        },
                        {
                            '$affiliate.sycu_user.last_name$': {
                                [Op.like]: `%${search}%`
                            }
                        },

                    ]
                }),
                include: [
                    {
                        required: false,
                        model: dbReader.affiliates,
                        attributes: [],
                        include: [
                            {
                                required: true,
                                model: dbReader.users,
                                attributes: []
                            },
                        ]
                    },
                    {
                        required: false,
                        model: dbReader.affiliateVisits,
                        attributes: []
                    },
                ],
                order: [[dbReader.Sequelize.fn("sum", dbReader.Sequelize.literal("amount")), 'DESC']],
                limit: page_record,
                offset: offset
            })
            rows = JSON.parse(JSON.stringify(rows));
            if (rows) {
                new SuccessResponse(EC.mostValuableAffiliates, {
                    count: rows.count.length,
                   rows: rows.rows,
                }).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getRecentAffiliateReferrals(req: Request, res: Response) {
        try {
            //included pagination
            const page_no = parseInt(req.body.page_no as string) || 1;
            const page_record = parseInt(req.body.page_record as string) || 10;
            const offset = (page_no - 1) * page_record;

            //searching
            const search = req.body.search || '';

            let rows = await dbReader.affiliateReferrals.findAndCountAll({
                attributes: ['affiliate_referral_id', 'amount', 'notes', 'created_datetime',
                    [dbReader.sequelize.fn("concat", dbReader.sequelize.literal('`affiliate->sycu_user`.`first_name`'), ' ', dbReader.sequelize.literal('`affiliate->sycu_user`.`last_name`')), "affiliate_user_name"],

                ],
                where: dbReader.sequelize.and({
                    is_deleted: 0,
                    [Op.or]: [
                        {
                            '$affiliate.sycu_user.first_name$': {
                                [Op.like]: `%${search}%`
                            }
                        },
                        {
                            '$affiliate.sycu_user.last_name$': {
                                [Op.like]: `%${search}%`
                            }
                        },

                    ]
                }),
                include: [
                    {
                        required: false,
                        model: dbReader.affiliates,
                        attributes: [],
                        include: [
                            {
                                required: true,
                                model: dbReader.users,
                                attributes: []
                            },
                        ]
                    },
                ],
                order: [["affiliate_referral_id", 'DESC']],
                limit: page_record,
                offset: offset
            })
            rows = JSON.parse(JSON.stringify(rows));
            if (rows) {
                new SuccessResponse(EC.recentAffiliateReferrals, {
                    ...rows
                }).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getAllAffiliateTotals(req: Request, res: Response) {
        try {
            let includeJoinCondition = [{
                required: true,
                model: dbReader.affiliates,
                where: { is_deleted: 0 },
                include: [
                    {
                        model: dbReader.users
                    }
                ]
            }];

            let affiliateVisitsCount = await dbReader.affiliateVisits.count({
                include: [{
                    required: true,
                    model: dbReader.affiliates,
                    where: { is_deleted: 0 },
                    include: [
                        {
                            model: dbReader.users
                        }
                    ]
                }, {
                    model: dbReader.users
                }]
            });
            let affiliateCount = await dbReader.affiliates.count({
                where: {
                    is_deleted: 0
                },
                include: [{
                    model: dbReader.users
                }]

            });
            let affiliateReferralsCount = await dbReader.affiliateReferrals.count({ where: { is_deleted: 0 }, include: includeJoinCondition });
            let affiliatePayoutsCount = await dbReader.affiliatePayouts.findOne({
                where: { is_deleted: 0 },
                attributes: [[dbReader.Sequelize.fn('SUM', dbReader.Sequelize.col('amount')), 'payout_count']],
                include: includeJoinCondition
            });
            affiliatePayoutsCount = JSON.parse(JSON.stringify(affiliatePayoutsCount));

            new SuccessResponse(EC.allTotalAffiliateDataCounts, {
                affiliates: affiliateCount,
                payouts: affiliatePayoutsCount.payout_count,
                referrals: affiliateReferralsCount,
                visits: affiliateVisitsCount
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getHighestConvertingURLs(req: Request, res: Response) {
        try {
             //included pagination
             const page_no = parseInt(req.body.page_no as string) || 1;
             const page_record = parseInt(req.body.page_record as string) || 10;
             const offset = (page_no - 1) * page_record;

            let rows = await dbReader.affiliateReferrals.findAndCountAll({
                attributes: ['affiliate_referral_id',
                    [dbReader.Sequelize.col('`affiliate_visit`.`url`'), "url"],
                    [dbReader.Sequelize.literal('COUNT(`affiliate_referrals`.`affiliate_visit_id`)'), "conversions"],
                ],
                group: [dbReader.sequelize.literal('`affiliate_referrals`.`affiliate_visit_id`')],
                where: dbReader.sequelize.and({
                    is_deleted: 0,
                }),
                include: [
                    {
                        required: true,
                        model: dbReader.affiliateVisits,
                        attributes: []
                    },
                ],
                order: [[dbReader.Sequelize.literal('COUNT(`affiliate_referrals`.`affiliate_visit_id`)'), 'DESC']],
                limit: page_record,
                offset: offset
            })
            rows = JSON.parse(JSON.stringify(rows));
            if (rows) {
                new SuccessResponse(EC.highestConvertingURLs, {
                    count: rows.count.length,
                    rows: rows.rows,
                }).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getVisitAndReferralDataForGraph(req: Request, res: Response) {
        try {
            var date = new Date();
            var month = date.getMonth();
            var year = date.getFullYear();
            //filter data ->
            // 0 = currentMonth data (default)
            // 1 = currentYear data
            // 2 = currentWeek data
            var filter = 0;
            if ((req.body.month && req.body.month != 0) && (req.body.year && req.body.year != 0)) {
                month = req.body.month - 1; //month starts from 0
                year = req.body.year;
            }
            if (req.body.filter && req.body.filter != 0) {
                filter = req.body.filter;
            }
            var firstDay = new Date(year, month, 1);
            var lastDay = new Date(year, month + 1, 0);
            let attributeArray: any = [];
            let groupArray: any = [];
            let dateRange: any = [];
            switch (filter) {
                case 0://current month
                    firstDay = new Date(year, month, 1);
                    lastDay = new Date(year, month + 1, 0);
                    dateRange = getDateRange(firstDay, lastDay, "YYYY-MM-DD")
                    attributeArray = [[dbReader.Sequelize.literal('DATE(`affiliate_referrals`.`created_datetime`)'), "key"],
                    [dbReader.Sequelize.literal('COUNT(Distinct(`affiliate_referrals`.`affiliate_visit_id`))'), "visits"],
                    [dbReader.Sequelize.literal('COUNT(`affiliate_referrals`.`affiliate_referral_id`)'), "referrals"]];
                    groupArray = ['key']; //date
                    break;
                case 1://current year
                    firstDay = new Date(year, 0, 1);
                    lastDay = new Date(year, 12, 0);
                    dateRange = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
                    attributeArray = [[dbReader.sequelize.fn('MONTH', dbReader.sequelize.col('`affiliate_referrals`.`created_datetime`')), "key"],
                    [dbReader.Sequelize.literal('COUNT(Distinct(`affiliate_referrals`.`affiliate_visit_id`))'), "visits"],
                    [dbReader.Sequelize.literal('COUNT(`affiliate_referrals`.`affiliate_referral_id`)'), "referrals"]];
                    groupArray = ['key']; //month
                    break;
                case 2://current week
                    var first = date.getDate() - date.getDay() + 1; // +1 for starting from monday
                    var last = first + 6
                    firstDay = new Date(date.setDate(first));
                    lastDay = new Date(date.setDate(last));
                    dateRange = getDateRange(firstDay, lastDay, "YYYY-MM-DD")
                    attributeArray = [[dbReader.Sequelize.literal('DATE(`affiliate_referrals`.`created_datetime`)'), "key"],
                    [dbReader.Sequelize.literal('COUNT(Distinct(`affiliate_referrals`.`affiliate_visit_id`))'), "visits"],
                    [dbReader.Sequelize.literal('COUNT(`affiliate_referrals`.`affiliate_referral_id`)'), "referrals"]];
                    groupArray = ['key']; //date
                    break;
            }

            let dataRows = await dbReader.affiliateReferrals.findAll({
                attributes: attributeArray,
                group: groupArray,
                where: dbReader.sequelize.and({
                    created_datetime: {
                        [Op.between]: [dateFormatter.format(firstDay, 'YYYY/MM/DD'), dateFormatter.format(lastDay, 'YYYY/MM/DD')]
                    },
                    is_deleted: 0,
                }),
                include: [
                    {
                        required: true,
                        model: dbReader.affiliateVisits,
                        attributes: []
                    },
                ],
            })

            let filteredValuesOfDates: any = [];
            let arrayOfDates = dateRange.map(function (item: any) { return { 'key': item, 'visits': null, 'referrals': null, } });
            dataRows.filter((obj: any) => { filteredValuesOfDates.push(obj.dataValues) });

            // Array merge With Date value And Set Null For Future Dates,
            for (let obj of arrayOfDates) {
                for (let value of filteredValuesOfDates) {
                    if (obj.key == value.key) {
                        obj.visits = value.visits;
                        obj.referrals = value.referrals;
                        break;
                    } else {
                        if (moment(new Date()).diff(obj.key, 'days') > 0 || obj.key == moment().format("YYYY-MM-DD")) {
                            obj.visits = 0;
                            obj.referrals = 0;
                        }
                    }
                }
            }

            let visits: any = [];
            let referrals: any = [];
            arrayOfDates.reverse();
            arrayOfDates.map((data: any) => {
                visits.push(data.visits);
                referrals.push(data.referrals);
            });

            if (dataRows) {
                new SuccessResponse(EC.visitAndReferralDataForGraph, {
                    visits,
                    referrals
                }).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getAffiliateCounts(req: Request, res: Response) {
        try {
            let generalObj = new GeneralController();
            let { user_id } = generalObj.getCurrentUserDetail(req, res);
            let { is_grow_con = 0 } = req.body;

            let whereCondition: any
            if (is_grow_con) {
                whereCondition = { user_id: user_id, is_deleted: 0, is_grow_con: 1 }
            } else {
                whereCondition = { user_id: user_id, is_deleted: 0, is_curriculum: 1 }
            }

            let includeJoinCondition = [{
                required: true,
                model: dbReader.affiliates,
                where: whereCondition
            }];
            let affiliateVisitsCount = await dbReader.affiliateVisits.count({ include: includeJoinCondition });
            let affiliateReferralsCount = await dbReader.affiliateReferrals.count({ where: { is_deleted: 0 }, include: includeJoinCondition });
            let affiliatePaidCount = await dbReader.affiliateReferrals.findOne({
                where: { is_deleted: 0, status: 1 },
                attributes: [[dbReader.Sequelize.fn('sum', dbReader.Sequelize.col('amount')), 'paid_count']],
                include: includeJoinCondition
            });
            let affiliateUnpaidCount = await dbReader.affiliateReferrals.findOne({
                where: { is_deleted: 0, status: 0 },
                attributes: [[dbReader.Sequelize.fn('sum', dbReader.Sequelize.col('amount')), 'unpaid_count']],
                include: includeJoinCondition
            });
            affiliatePaidCount = JSON.parse(JSON.stringify(affiliatePaidCount));
            affiliateUnpaidCount = JSON.parse(JSON.stringify(affiliateUnpaidCount));

            new SuccessResponse(EC.errorMessage(EC.getMessage, ["Affiliate count"]), {
                referrals: affiliateReferralsCount,
                visits: affiliateVisitsCount,
                paid: affiliatePaidCount.paid_count == null ? 0 : affiliatePaidCount.paid_count,
                unpaid: affiliateUnpaidCount.unpaid_count == null ? 0 : affiliateUnpaidCount.unpaid_count
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getConversationRateGraph(req: Request, res: Response) {
        try {
            let generalObj = new GeneralController();
            let { is_grow_con = 0 } = req.body;
            let { user_id } = generalObj.getCurrentUserDetail(req, res);
            let date = new Date();
            let year = date.getFullYear();

            let monthsName: any = {
                1: 'Jan',
                2: 'Feb',
                3: 'Mar',
                4: 'Apr',
                5: 'May',
                6: 'Jun',
                7: 'Jul',
                8: 'Aug',
                9: 'Sep',
                10: 'Oct',
                11: 'Nov',
                12: 'Dec'
            }

            let whereCondition: any
            if (is_grow_con) {
                whereCondition = { user_id: user_id, is_deleted: 0, is_grow_con: 1 }
            } else {
                whereCondition = { user_id: user_id, is_deleted: 0, is_curriculum: 1 }
            }

            let firstDay, lastDay;
            let attributeArray: any = [];
            let groupArray: any = [];
            let dateRange: any = [];

            firstDay = new Date(year, 0, 1);
            lastDay = new Date(year, 12, 0);
            dateRange = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
            attributeArray = [[dbReader.sequelize.fn('MONTH', dbReader.sequelize.col('`affiliate_referrals`.`created_datetime`')), "key"],
            [dbReader.Sequelize.literal('COUNT(Distinct(`affiliate_referrals`.`affiliate_visit_id`))'), "visits"],
            [dbReader.Sequelize.literal('COUNT(`affiliate_referrals`.`affiliate_referral_id`)'), "referrals"]];
            groupArray = ['key']; //month

            let dataRows = await dbReader.affiliateReferrals.findAll({
                attributes: attributeArray,
                group: groupArray,
                where: dbReader.sequelize.and({
                    created_datetime: {
                        [Op.between]: [dateFormatter.format(firstDay, 'YYYY/MM/DD'), dateFormatter.format(lastDay, 'YYYY/MM/DD')]
                    },
                    is_deleted: 0,
                }),
                include: [{
                    required: true,
                    model: dbReader.affiliates,
                    where: whereCondition,
                    attributes: []
                }, {
                    required: true,
                    model: dbReader.affiliateVisits,
                    attributes: [],
                    include: [{
                        required: true,
                        model: dbReader.affiliates,
                        where: whereCondition
                    }]
                }],
            })

            let filteredValuesOfDates: any = [];
            let arrayOfDates = dateRange.map(function (item: any) { return { 'key': item, 'visits': 0, 'referrals': 0, } });
            dataRows = JSON.parse(JSON.stringify(dataRows));
            dataRows.filter((obj: any) => { filteredValuesOfDates.push(obj) });

            // Array merge With Date value And Set Null For Future Dates,
            for (let obj of arrayOfDates) {
                for (let value of filteredValuesOfDates) {
                    if (obj.key == value.key) {
                        obj.visits = value.visits;
                        obj.referrals = value.referrals;
                        break;
                    } else {
                        if (moment(new Date()).diff(obj.key, 'days') > 0 || obj.key == moment().format("YYYY-MM-DD")) {
                            obj.visits = 0;
                            obj.referrals = 0;
                        }
                    }
                }
            }

            let totalData: any = [];
            arrayOfDates.reverse();
            arrayOfDates.map((data: any) => {
                totalData.push({ month: monthsName[data.key], visit: data.visits, referral: data.referrals });
            });

            new SuccessResponse(EC.errorMessage(EC.getMessage, ['Conversion rate graph']), {
                totalData
            }).send(res);

        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getVisitLineGraph(req: Request, res: Response) {
        try {
            let generalObj = new GeneralController();
            let { is_grow_con = 0 } = req.body;
            let { user_id } = generalObj.getCurrentUserDetail(req, res);
            var date = new Date();
            var year = date.getFullYear();

            let monthsName: any = {
                1: 'Jan',
                2: 'Feb',
                3: 'Mar',
                4: 'Apr',
                5: 'May',
                6: 'Jun',
                7: 'Jul',
                8: 'Aug',
                9: 'Sep',
                10: 'Oct',
                11: 'Nov',
                12: 'Dec'
            }

            let whereCondition: any
            if (is_grow_con) {
                whereCondition = { user_id: user_id, is_deleted: 0, is_grow_con: 1 }
            } else {
                whereCondition = { user_id: user_id, is_deleted: 0, is_curriculum: 1 }
            }

            let firstDay, lastDay;
            let attributeArray: any = [];
            let groupArray: any = [];
            let dateRange: any = [];

            firstDay = new Date(year, 0, 1);
            lastDay = new Date(year, 12, 0);
            dateRange = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
            attributeArray = [[dbReader.sequelize.fn('MONTH', dbReader.sequelize.col('`affiliate_visits`.`created_datetime`')), "key"],
            [dbReader.Sequelize.literal('COUNT(Distinct(affiliate_visit_id))'), "visits"]];
            groupArray = ['key']; //month

            let dataRows = await dbReader.affiliateVisits.findAll({
                attributes: attributeArray,
                group: groupArray,
                where: dbReader.sequelize.and({
                    created_datetime: {
                        [Op.between]: [dateFormatter.format(firstDay, 'YYYY/MM/DD'), dateFormatter.format(lastDay, 'YYYY/MM/DD')]
                    }
                }),
                include: [{
                    required: true,
                    model: dbReader.affiliates,
                    where: whereCondition
                }],
            })

            let filteredValuesOfDates: any = [];
            let arrayOfDates = dateRange.map(function (item: any) { return { 'key': item, 'visits': 0 } });
            dataRows = JSON.parse(JSON.stringify(dataRows));
            dataRows.filter((obj: any) => { filteredValuesOfDates.push(obj) });

            // Array merge With Date value And Set Null For Future Dates,
            for (let obj of arrayOfDates) {
                for (let value of filteredValuesOfDates) {
                    if (obj.key == value.key) {
                        obj.visits = value.visits;
                        break;
                    } else {
                        if (moment(new Date()).diff(obj.key, 'days') > 0 || obj.key == moment().format("YYYY-MM-DD")) {
                            obj.visits = 0;
                        }
                    }
                }
            }

            let visits: any = [];
            arrayOfDates.reverse();
            arrayOfDates.map((data: any) => {
                visits.push({ month: monthsName[data.key], visit: data.visits });
            });
            new SuccessResponse(EC.errorMessage(EC.getMessage, ['Visit line graph']), {
                visits
            }).send(res);

        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getPaidGraph(req: Request, res: Response) {
        try {
            let generalObj = new GeneralController();
            let { user_id } = generalObj.getCurrentUserDetail(req, res);
            let { is_grow_con = 0 } = req.body;

            let monthsName: any = {
                1: 'Jan',
                2: 'Feb',
                3: 'Mar',
                4: 'Apr',
                5: 'May',
                6: 'Jun',
                7: 'Jul',
                8: 'Aug',
                9: 'Sep',
                10: 'Oct',
                11: 'Nov',
                12: 'Dec'
            }

            let whereCondition: any
            if (is_grow_con) {
                whereCondition = { user_id: user_id, is_deleted: 0, is_grow_con: 1 }
            } else {
                whereCondition = { user_id: user_id, is_deleted: 0, is_curriculum: 1 }
            }

            var date = new Date();
            var year = date.getFullYear();

            let firstDay, lastDay;
            let attributeArray: any = [];
            let groupArray: any = [];
            let dateRange: any = [];

            firstDay = new Date(year, 0, 1);
            lastDay = new Date(year, 12, 0);
            dateRange = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
            attributeArray = [[dbReader.sequelize.fn('MONTH', dbReader.sequelize.col('`affiliate_referrals`.`created_datetime`')), "key"],
            [dbReader.Sequelize.fn('COUNT', dbReader.Sequelize.col('`affiliate_referrals`.`status`')), 'paid_count']];
            groupArray = ['key']; //month

            let dataRows = await dbReader.affiliateReferrals.findAll({
                attributes: attributeArray,
                group: groupArray,
                where: dbReader.sequelize.and({
                    created_datetime: {
                        [Op.between]: [dateFormatter.format(firstDay, 'YYYY/MM/DD'), dateFormatter.format(lastDay, 'YYYY/MM/DD')]
                    }
                }),
                include: [{
                    required: true,
                    model: dbReader.affiliates,
                    where: whereCondition
                }]
            })

            let filteredValuesOfDates: any = [];
            let arrayOfDates = dateRange.map(function (item: any) { return { 'key': item, 'paid_count': 0 } });
            dataRows = JSON.parse(JSON.stringify(dataRows));
            dataRows.filter((obj: any) => { filteredValuesOfDates.push(obj) });

            // Array merge With Date value And Set Null For Future Dates,
            for (let obj of arrayOfDates) {
                for (let value of filteredValuesOfDates) {
                    if (obj.key == value.key) {
                        obj.paid_count = value.paid_count;
                        break;
                    } else {
                        if (moment(new Date()).diff(obj.key, 'days') > 0 || obj.key == moment().format("YYYY-MM-DD")) {
                            obj.paid_count = 0;
                        }
                    }
                }
            }

            let paid: any = [];
            arrayOfDates.reverse();
            arrayOfDates.map((data: any) => {
                paid.push({ month: monthsName[data.key], referral: data.paid_count });
            });

            new SuccessResponse(EC.errorMessage(EC.getMessage, ['Paid Data graph']), {
                paid
            }).send(res);

        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
}
