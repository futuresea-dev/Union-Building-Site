import { Request, Response } from "express";
import { ErrorController, SuccessResponse, BadRequestError, ApiError } from '../core/index';
import moment from "moment";
import { SubscriptionAnalyticsController } from "./analytics/subscriptionAnalyticsController";
import { enumerationController } from "./enumerationController";
const { dbReader, dbWriter } = require('../models/dbConfig');
const { Op } = dbReader.Sequelize;
const EC = new ErrorController();
var EnumObject = new enumerationController();

export class SubscriptionReportController {

    public listSubscriptionReport = async (req: Request, res: Response) => {
        try {
            let { page_no, page_record } = req.body
            let rowLimit = page_record ? parseInt(page_record) : 20;
            let rowOffset = page_no ? ((page_no * page_record) - page_record) : 0;
            let sortField = dbReader.Sequelize.literal(`sycu_membership.membership_name`), sortOrder = 'ASC';
            let sortJoin = [[sortField, sortOrder]];
            sortOrder = req.body.sort_order;
            sortField = req.body.sort_field

            if (req.body.sort_field == "user_name") {
                sortJoin = [dbReader.Sequelize.literal('(select `display_name` as user_name from `sycu_users` where `sycu_users`.`user_id` = `sycu_user_memberships`.`user_id`)'), sortOrder];
            } else if (req.body.sort_field == "membership_name") {
                sortJoin = [dbReader.Sequelize.literal(`sycu_membership.membership_name`), sortOrder];
            } else if (req.body.sort_field == "email") {
                sortJoin = [dbReader.Sequelize.literal(`email`), sortOrder];
            } else if (req.body.sort_field == "mobile") {
                sortJoin = [dbReader.Sequelize.literal(`mobile`), sortOrder];
            }

            let where: any = { status: [2, 3], is_deleted: 0, user_id: { [Op.ne]: 0 } }
            if (req.body.search) {
                let custom_or = dbReader.Sequelize.or(
                    dbReader.Sequelize.where(dbReader.Sequelize.literal('membership_name'), { [Op.like]: `%${req.body.search}%` }),
                    dbReader.Sequelize.where(dbReader.Sequelize.literal('email'), { [Op.like]: `${req.body.search}` })
                )
                where = { ...where, custom_or }
            }
            if (req.body.filter_1) {
                let custom_f1 = dbReader.Sequelize.where(dbReader.Sequelize.literal('membership_name'), { [Op.like]: `%${req.body.filter_1}%` })
                where = { ...where, custom_f1 }
            }
            if (req.body.filter_2) {
                if (req.body.filter_2 == "Non Ministry") {
                    var custom_f2 = dbReader.Sequelize.where(dbReader.Sequelize.literal('membership_name'), { [Op.notLike]: `%Ministry%` })
                    where = { ...where, custom_f2 }
                } else {
                    let custom_f2 = dbReader.Sequelize.where(dbReader.Sequelize.literal('membership_name'), { [Op.like]: `%${req.body.filter_2}%` })
                    where = { ...where, custom_f2 }
                }
            }
            if (req.body.filter_3) {
                let custom_f3 = dbReader.Sequelize.where(dbReader.Sequelize.literal('membership_name'), { [Op.like]: `%${req.body.filter_3}%` })
                where = { ...where, custom_f3 }
            }

            let data = await dbReader.userMemberships.findAndCountAll({
                attributes: ['user_id',
                    [dbReader.sequelize.fn("concat", dbReader.sequelize.col("first_name"), ' ', dbReader.sequelize.col("last_name")), "user_name"],
                    [dbReader.Sequelize.literal(`email`), 'email'], [dbReader.Sequelize.literal(`ac_final_status`), 'ac_status'],
                    [dbReader.sequelize.fn('group_concat', dbReader.sequelize.fn('concat', '\n', dbReader.Sequelize.literal(`membership_name`))), 'membership_name']],
                where: where,
                include: [{
                    model: dbReader.membership,
                    attributes: []
                }, {
                    required: true,
                    model: dbReader.users,
                    where: { is_deleted: 0, activecampaign_contact_id: { [dbReader.Sequelize.Op.ne]: 0 } },
                    attributes: ['user_id', 'mobile']
                }, {
                    model: dbReader.userSubscription,
                    where: { subscription_status: [2, 4] },
                    attributes: []
                }],
                group: ['user_id', dbReader.Sequelize.literal(`ministry_type`)],
                order: [sortJoin],
                limit: rowLimit,
                offset: rowOffset,
            });
            if (data.rows.length > 0) {
                data = JSON.parse(JSON.stringify(data));
                new SuccessResponse("Subscription Report Fetched Successfully", {
                    // @ts-ignore
                    token: req.token,
                    count: data.count.length,
                    rows: data.rows,
                }).send(res);
            } else {
                new SuccessResponse(EC.noDataFound, {
                    rows: data.rows
                }).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public userACStatusUpdate = async (req: Request, res: Response) => {
        try {
            let { user_id } = req.body
            await dbWriter.users.update({
                ac_status: 1,
                updated_datetime: new Date()
            }, {
                where: { user_id: user_id }
            })
            new SuccessResponse(EC.success, {
                // @ts-ignore
                token: req.token
            }).send(res);
        } catch (err: any) {
            ApiError.handle(new BadRequestError(err.message), res);
        }
    }

    public listNotActiveSubscriptionReport = async (req: Request, res: Response) => {
        try {
            let { page_no, page_record, search = '', filter = '', start_date = '', end_date = '' } = req.body;
            let rowLimit = page_record ? parseInt(page_record) : 25, requiredFlag = false;
            let rowOffset = page_no ? ((page_no * page_record) - page_record) : 0, ministry_type = 0;
            let productCondition: any = {}, productCondition2: any = {}, whereCondition: any = {};
            let usersCondition = { user_role: 3, is_deleted: 0, activecampaign_contact_id: { [Op.ne]: 0 } };
            if (search) {
                usersCondition = dbReader.Sequelize.and(usersCondition,
                    dbReader.Sequelize.or(
                        dbReader.Sequelize.where(dbReader.Sequelize.literal('email'), { [Op.like]: `${search}` }),
                        dbReader.Sequelize.where(dbReader.Sequelize.literal('last_name'), { [Op.like]: `${search}` }),
                        dbReader.Sequelize.where(dbReader.Sequelize.literal('first_name'), { [Op.like]: `${search}` }),
                        dbReader.Sequelize.where(dbReader.Sequelize.literal('display_name'), { [Op.like]: `${search}` })
                    )
                )
            }
            if (filter) {
                requiredFlag = true;
                if (filter == 'kids') {
                    ministry_type = 1;
                } else if (filter == 'student') {
                    ministry_type = 2;
                } else if (filter == 'group') {
                    ministry_type = 3;
                } else {
                    productCondition = dbReader.Sequelize.and({ is_deleted: 0 },
                        dbReader.Sequelize.where(dbReader.Sequelize.literal('`user_subscription_check->user_order_check->report_order->sycu_product`.`product_name`'), { [Op.like]: `%${filter}%` })
                    )
                    productCondition2 = dbReader.Sequelize.and({ is_deleted: 0 },
                        dbReader.Sequelize.where(dbReader.Sequelize.literal('`user_order_check->report_order->sycu_product`.`product_name`'), { [Op.like]: `%${filter}%` })
                    )
                }
                if (ministry_type) {
                    productCondition = { is_deleted: 0, ministry_type: ministry_type };
                    productCondition2 = productCondition;
                    whereCondition = dbReader.Sequelize.where(dbReader.Sequelize.literal('(SELECT COUNT(1) FROM sycu_user_subscriptions a INNER JOIN sycu_user_orders AS o ON a.user_subscription_id = o.user_subscription_id INNER JOIN sycu_user_order_items AS oi ON o.user_orders_id = oi.user_orders_id INNER JOIN sycu_products AS p ON oi.product_id = p.product_id WHERE `a`.`user_id` = `sycu_users`.`user_id` AND oi.is_deleted = 0 AND oi.item_type = 1 AND `a`.`subscription_status` IN (2,3,4,10) AND p.ministry_type = ' + ministry_type + ' ORDER BY o.user_orders_id DESC)'), 0);
                } else {
                    whereCondition = dbReader.Sequelize.where(dbReader.Sequelize.literal('(SELECT COUNT(1) FROM sycu_user_subscriptions a INNER JOIN sycu_user_orders AS o ON a.user_subscription_id = o.user_subscription_id INNER JOIN sycu_user_order_items AS oi ON o.user_orders_id = oi.user_orders_id INNER JOIN sycu_products AS p ON oi.product_id = p.product_id WHERE `a`.`user_id` = `sycu_users`.`user_id` AND `a`.`subscription_status` IN (2,3,4,10) AND oi.is_deleted = 0 AND oi.item_type = 1 AND p.product_name LIKE "%' + filter + '%" ORDER BY o.user_orders_id DESC)'), 0);
                }
            } else {
                productCondition = { is_deleted: 0 };
                productCondition2 = productCondition;
                whereCondition = dbReader.Sequelize.where(dbReader.Sequelize.literal('(SELECT COUNT(1) FROM sycu_user_subscriptions AS a INNER JOIN sycu_user_orders AS o ON a.user_subscription_id = o.user_subscription_id INNER JOIN sycu_user_order_items AS oi ON o.user_orders_id = oi.user_orders_id INNER JOIN sycu_products AS p ON oi.product_id = p.product_id WHERE `a`.`user_id` = `sycu_users`.`user_id` AND oi.is_deleted = 0 AND oi.item_type = 1 AND `a`.`subscription_status` IN (2,3,4,10) AND p.ministry_type IN (SELECT p.ministry_type FROM sycu_user_subscriptions AS a INNER JOIN sycu_user_orders AS o ON a.user_subscription_id = o.user_subscription_id INNER JOIN sycu_user_order_items AS oi ON o.user_orders_id = oi.user_orders_id INNER JOIN sycu_products AS p ON oi.product_id = p.product_id WHERE `a`.`user_id` = `sycu_users`.`user_id` AND oi.is_deleted = 0 AND oi.item_type = 1 AND `a`.`subscription_status` IN (5,6,7)) ORDER BY o.user_orders_id DESC)'), 0);
            }

            let startDateCondition1 = dbReader.Sequelize.where(dbReader.Sequelize.fn('if',
                dbReader.Sequelize.where(dbReader.Sequelize.literal('`user_subscription_check`.`subscription_status`'), { [Op.in]: [6, 7] }),
                dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_subscription_check.next_payment_date`'), '%Y-%m-%d'), { [Op.gte]: start_date }),
                dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_subscription_check.status_updated_date`'), '%Y-%m-%d'), { [Op.gte]: start_date })), 1);
            let endDateCondition1 = dbReader.Sequelize.where(dbReader.Sequelize.fn('if',
                dbReader.Sequelize.where(dbReader.Sequelize.literal('`user_subscription_check`.`subscription_status`'), { [Op.in]: [6, 7] }),
                dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_subscription_check.next_payment_date`'), '%Y-%m-%d'), { [Op.lte]: end_date }),
                dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_subscription_check.status_updated_date`'), '%Y-%m-%d'), { [Op.lte]: end_date })), 1);

            let startDateCondition2 = dbReader.Sequelize.where(dbReader.Sequelize.fn('if',
                dbReader.Sequelize.where(dbReader.Sequelize.literal('`user_subscription`.`subscription_status`'), { [Op.in]: [6, 7] }),
                dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_subscription.next_payment_date`'), '%Y-%m-%d'), { [Op.gte]: start_date }),
                dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_subscription.status_updated_date`'), '%Y-%m-%d'), { [Op.gte]: start_date })), 1);
            let endDateCondition2 = dbReader.Sequelize.where(dbReader.Sequelize.fn('if',
                dbReader.Sequelize.where(dbReader.Sequelize.literal('`user_subscription`.`subscription_status`'), { [Op.in]: [6, 7] }),
                dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_subscription.next_payment_date`'), '%Y-%m-%d'), { [Op.lte]: end_date }),
                dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_subscription.status_updated_date`'), '%Y-%m-%d'), { [Op.lte]: end_date })), 1);

            let data = await dbReader.users.findAndCountAll({
                attributes: ['user_id', 'email', 'display_name', 'first_name', 'last_name'],
                where: dbReader.Sequelize.and(usersCondition, whereCondition, startDateCondition1, endDateCondition1),
                include: [{
                    as: 'user_subscription_check',
                    attributes: [],
                    required: true,
                    model: dbReader.userSubscription,
                    where: { subscription_status: [5, 6, 7] },
                    include: [{
                        as: 'user_order_check',
                        attributes: [],
                        required: true,
                        model: dbReader.userOrder,
                        include: [{
                            as: 'report_order',
                            attributes: [],
                            required: true,
                            model: dbReader.userOrderItems,
                            where: { is_deleted: 0, item_type: 1 },
                            include: [{
                                attributes: [],
                                required: true,
                                model: dbReader.products,
                                where: productCondition,
                            }]
                        }]
                    }]
                }, {
                    as: 'all_user_subscription',
                    separate: true,
                    attributes: ['user_subscription_id', 'subscription_number', 'subscription_status', 'next_payment_date', 'updated_datetime', 'status_updated_date', 'user_id'],
                    model: dbReader.userSubscription,
                    where: dbReader.Sequelize.and(
                        { subscription_status: [5, 6, 7] },
                        { subscription_status: { [Op.notIn]: [2, 3, 4] } },
                        startDateCondition2, endDateCondition2
                    ),
                    include: [{
                        separate: true,
                        attributes: ['user_subscription_id', 'product_id', [dbReader.Sequelize.literal(`sycu_product.product_name`), 'product_name']],
                        model: dbReader.userSubscriptionItems,
                        where: { is_deleted: 0, item_type: 1 },
                        include: [{
                            attributes: [],
                            model: dbReader.products,
                            where: { is_deleted: 0 },
                        }]
                    }, {
                        as: 'user_order_check',
                        attributes: [],
                        required: requiredFlag,
                        model: dbReader.userOrder,
                        include: [{
                            as: 'report_order',
                            attributes: [],
                            required: requiredFlag,
                            model: dbReader.userOrderItems,
                            where: { is_deleted: 0, item_type: 1 },
                            include: [{
                                attributes: [],
                                required: requiredFlag,
                                model: dbReader.products,
                                where: productCondition2,
                            }]
                        }]
                    }]
                }],
                group: ['user_id'],
                order: ['user_id'],
                limit: rowLimit,
                offset: rowOffset,
            });

            data = JSON.parse(JSON.stringify(data));
            data.rows.forEach((e: any) => {
                e.user_name = e.first_name && e.last_name ? e.first_name + ' ' + e.last_name : e.display_name;
                e.all_user_subscription.forEach((s: any) => {
                    if (s.subscription_status == 6 || s.subscription_status == 7) {
                        s.status_date = s.next_payment_date;
                    } else if (s.subscription_status == 5) {
                        s.status_date = s.status_updated_date ? s.status_updated_date : s.updated_datetime;
                    } else {
                        s.status_date = s.updated_datetime;
                    }
                    delete s.updated_datetime;
                    delete s.next_payment_date;
                    delete s.status_updated_date;
                });
                delete e.last_name;
                delete e.first_name;
                delete e.display_name;
            });

            new SuccessResponse(EC.success, {
                // @ts-ignore
                token: req.token,
                count: data.count.length,
                rows: data.rows,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public freeTrialUserReport = async (req: Request, res: Response) => {
        try {
            let { range, search = "", page_no, page_record } = req.body;
            let rowLimit = page_record ? parseInt(page_record) : 25;
            let rowOffset = page_no ? page_no * page_record - page_record : 0;
            let startDate = moment((range.start_date)).format("YYYY-MM-DD");
            let endDate = moment((range.end_date)).format("YYYY-MM-DD");
            let searchCondition = dbReader.Sequelize.Op.ne, searchData = null;

            if (search) {
                searchCondition = Op.like;
                searchData = "%" + search + "%";
            }

            let userData = await dbReader.users.findAndCountAll({
                attributes: ["user_id", "first_name", "last_name", "email", "created_datetime", "country_code", "mobile"],
                where: dbReader.Sequelize.and({ is_deleted: 0 },
                    dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('created_datetime'), '%Y-%m-%d'),
                        { [dbReader.Sequelize.Op.gte]: startDate }),
                    dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('created_datetime'), '%Y-%m-%d'),
                        { [dbReader.Sequelize.Op.lte]: endDate }),
                    dbReader.Sequelize.or(
                        { first_name: { [searchCondition]: searchData } },
                        { last_name: { [searchCondition]: searchData } },
                        { email: { [searchCondition]: searchData } },
                        { mobile: { [searchCondition]: searchData } },
                    )
                ),
                order: [["user_id", "DESC"]],
                offset: rowOffset,
                limit: rowLimit,
            });
            userData = JSON.parse(JSON.stringify(userData));

            new SuccessResponse("Success", {
                data: userData
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    /**
     * report_type
     * 1 - Total Active Curriculum Subscribers
     * 2 - Grow Kids Active Subscribers
     * 3 - Grow Students Active Subscribers
     * 4 - Grow Groups Active Subscribers
     * 5 - Bundled Active Subscribers
     * 6 - Annual Payment Active Subscribers
     * 7 - Quarterly Payment Active Subscribers
     * 8 - Monthly Payment Active Subscribers
     */
    public getSubscribersReport = async (req: Request, res: Response) => {
        try {
            let { ministryFilter = [], durationFilter = [], start_date, end_date, site_id = 0, filter_type = 0, duration_filter = 0 } = req.body;
            let monthArray: any = [], finalResponse: any = {}, export_data: any = [];
            const subscriptionController = new SubscriptionAnalyticsController();
            const startDate: any = moment(start_date, 'DD-MM-YYYY').format('YYYY-MM-DD HH:mm:ss');
            const endDate: any = moment(end_date, 'DD-MM-YYYY').format('YYYY-MM-DD HH:mm:ss');

            let current: any = moment(start_date, 'DD-MM-YYYY').startOf('month').clone();
            while (current.isSameOrBefore(endDate, 'month')) {
                monthArray.push(current.format('MMM YYYY'));
                current.add(1, 'month');
            }

            // Function to aggregate data by month
            let new_users: any = [], active_users: any = [], getActiveSubscribers: any = [], productsWhere: any = [];
            const aggregateByMonth = (data: any, dateField = 'created_datetime') => {
                return data.reduce((acc: any, item: any) => {
                    const date = new Date(item[dateField]);
                    const month = date.toLocaleString('default', { month: 'short' });
                    const year = date.toLocaleString('default', { year: 'numeric' });
                    const monthYear = `${month} ${year}`;
                    acc[monthYear] = acc[monthYear] || { count: 0 };
                    acc[monthYear].count += 1;
                    if (!new_users.includes(item.user_id))
                        new_users.push(item.user_id);
                    acc[monthYear].users = new_users;
                    return acc;
                }, {});
            };

            const formatFinalArray = (totalUsers: any, newUsersCount: any) => {
                return monthArray.map((month: any, index: any) => {
                    if (totalUsers[index].length > 0) {
                        totalUsers[index].forEach((user: any) => {
                            if (!active_users.includes(user)) active_users.push(user);
                        });
                    }
                    return {
                        month: month,
                        total_subscribers: totalUsers[index]?.length || 0,
                        new_subscribers: newUsersCount[month]?.count || 0,
                    }
                });
            };

            const aggregateCurriculum = (subscriber: any) => {
                let yearData = monthArray.map((month: any) => ({ [month]: { value: [] } }));

                subscriber.forEach((user: any) => {
                    user.user_subscriptions.forEach((subscription: any) => {
                        let subscriptionStartDate = new Date(subscription.start_date);
                        let subscriptionEndDate = new Date(subscription.end_date);

                        yearData.forEach((entry: any) => {
                            let month = Object.keys(entry)[0];
                            let entryDate = new Date(month + " 01");
                            if (entryDate >= subscriptionStartDate && entryDate <= subscriptionEndDate) {
                                if (!entry[month].value.includes(user.user_id)) {
                                    entry[month].value.push(user.user_id);
                                }
                            }
                        });
                    });
                });
                return yearData;
            }

            const formatCurriculumFinalArray = (totalUsers: any, newUsersCount: any) => {
                // Helper function to get the number of active kids for a given month
                const getActiveCount = (data: any, month: any) => {
                    const monthData = data.find((item: any) => item[month]);
                    return monthData ? monthData[month].value.length : 0;
                };
                if (duration_filter == 1) {
                    return monthArray.map((month: any) => {
                        return {
                            month: month,
                            ...(durationFilter.includes(365) && {
                                annual_payment: {
                                    total_subscribers: newUsersCount?.newAnnual[month]?.count || 0,
                                    total_active_subscribers: getActiveCount(totalUsers?.activeAnnual, month)
                                }
                            }),
                            ...(durationFilter.includes(90) && {
                                quarterly_payment: {
                                    total_subscribers: newUsersCount?.newQuarterly[month]?.count || 0,
                                    total_active_subscribers: getActiveCount(totalUsers?.activeQuarterly, month)
                                }
                            }),
                            ...(durationFilter.includes(30) && {
                                monthly_payment: {
                                    total_subscribers: newUsersCount?.newMonthly[month]?.count || 0,
                                    total_active_subscribers: getActiveCount(totalUsers?.activeMonthly, month)
                                }
                            })
                        };
                    });
                } else {
                    return monthArray.map((month: any) => {
                        return {
                            month: month,
                            ...(ministryFilter.includes(1) && {
                                grow_kids: {
                                    total_subscribers: newUsersCount?.newKids[month]?.count || 0,
                                    total_active_subscribers: getActiveCount(totalUsers.activeKids, month)
                                }
                            }),
                            ...(ministryFilter.includes(2) && {
                                grow_students: {
                                    total_subscribers: newUsersCount?.newStudents[month]?.count || 0,
                                    total_active_subscribers: getActiveCount(totalUsers.activeStudents, month)
                                }
                            })
                        };
                    });
                }
            };

            // Return curriculum graph data except Bundled
            if (site_id === EnumObject.siteEnum.get('curriculum').value) {
                const getNewSubscribers = await dbReader.users.findAll({
                    attributes: ['user_id', [dbReader.Sequelize.literal('`user_subscriptions`.`created_datetime`'), 'created_datetime']],
                    include: [{
                        required: true,
                        model: dbReader.userSubscription,
                        attributes: ['user_subscription_id', 'created_datetime'],
                        where: {
                            [Op.and]: [{ site_id: site_id }, { is_bundle_subscription: 0 },
                            dbReader.Sequelize.where(dbReader.Sequelize.literal('`user_subscriptions`.`created_datetime`'), {
                                [Op.between]: [startDate, endDate]
                            })]
                        },
                        include: [{
                            separate: true,
                            model: dbReader.userSubscriptionItems,
                            attributes: ['user_subscription_item_id', 'product_name', 'product_id', 'created_datetime'],
                            where: { is_deleted: 0, item_type: 1 },
                            include: [{
                                model: dbReader.products,
                                attributes: ['ministry_type', 'product_duration'],
                                where: {
                                    [Op.and]: [
                                        { ministry_type: { [Op.in]: ministryFilter } },
                                        { product_duration: { [Op.in]: durationFilter } }
                                    ]
                                }
                            }]
                        }]
                    }],
                    order: [[dbReader.Sequelize.literal('`user_subscriptions`.`created_datetime`'), 'ASC']],
                });

                const classifySubscribers = (subscribers: any) => {
                    let kidsUsers: any = [], studentsUsers: any = [], annualUsers: any = [], quarterlyUsers: any = [], monthlyUsers: any = [];
                    subscribers.forEach((user: any) => {
                        const userSubscriptions = user['user_subscriptions'];
                        if (userSubscriptions) {
                            userSubscriptions.forEach((sub: any) => {
                                const items = sub['user_subscription_items'];
                                items.forEach((item: any) => {
                                    switch (item['sycu_product'].ministry_type) {
                                        case 1:
                                            if (!kidsUsers.some((u: any) => (u.user_id === user.user_id)))
                                                kidsUsers.push(user);
                                            break;
                                        case 2:
                                            if (!studentsUsers.some((u: any) => (u.user_id === user.user_id)))
                                                studentsUsers.push(user);
                                            break;
                                    }
                                    switch (item['sycu_product'].product_duration) {
                                        case 365:
                                            if (!annualUsers.some((u: any) => (u.user_id === user.user_id)))
                                                annualUsers.push(user);
                                            break;
                                        case 90:
                                            if (!quarterlyUsers.some((u: any) => (u.user_id === user.user_id)))
                                                quarterlyUsers.push(user);
                                            break;
                                        case 30:
                                            if (!monthlyUsers.some((u: any) => (u.user_id === user.user_id)))
                                                monthlyUsers.push(user);
                                            break;
                                    }
                                });
                            });
                        }
                    });
                    return { kidsUsers, studentsUsers, annualUsers, quarterlyUsers, monthlyUsers };
                };

                const { kidsUsers, studentsUsers, annualUsers, quarterlyUsers, monthlyUsers } = classifySubscribers(getNewSubscribers);
                const newSubscribersCount = {
                    newKids: aggregateByMonth(kidsUsers),
                    newStudents: aggregateByMonth(studentsUsers),
                    newAnnual: aggregateByMonth(annualUsers),
                    newQuarterly: aggregateByMonth(quarterlyUsers),
                    newMonthly: aggregateByMonth(monthlyUsers)
                };

                if (ministryFilter.length > 0) {
                    productsWhere.push({ ministry_type: ministryFilter });
                }
                if (durationFilter.length > 0) {
                    productsWhere.push({ product_duration: durationFilter });
                }

                getActiveSubscribers = await dbReader.users.findAll({
                    attributes: ['user_id', 'email', 'first_name', 'last_name'],
                    include: [{
                        required: true,
                        model: dbReader.userSubscription,
                        attributes: ['subscription_number', 'created_datetime', 'start_date', 'end_date'],
                        where: {
                            [Op.and]: [{ site_id: EnumObject.siteEnum.get('curriculum').value }, { is_bundle_subscription: 0 },
                            {
                                [Op.or]: [{
                                    start_date: { [Op.between]: [startDate, endDate] }
                                }, {
                                    end_date: { [Op.between]: [startDate, endDate] }
                                }, {
                                    [Op.and]: [{ start_date: { [Op.lte]: startDate } }, { end_date: { [Op.gte]: endDate } }]
                                }, {
                                    [Op.and]: [{ start_date: { [Op.gte]: startDate } }, { end_date: { [Op.lte]: endDate } }]
                                }]
                            }]
                        },
                        include: [{
                            model: dbReader.userOrder,
                            attributes: ['total_amount', 'created_datetime'],
                            where: {
                                [Op.and]: [{
                                    order_status: { [Op.notIn]: [1, 7] }
                                }, {
                                    created_datetime: { [Op.between]: [startDate, endDate] }
                                }]
                            },
                            include: [{
                                model: dbReader.userOrderItems,
                                attributes: ["user_order_item_id"],
                                where: { item_type: 1, is_deleted: 0 },
                                include: [{
                                    required: false,
                                    attributes: ['product_id', 'product_name', 'ministry_type', 'is_ministry_page', 'product_duration'],
                                    model: dbReader.products,
                                    where: { [Op.and]: productsWhere }
                                }, {
                                    required: false,
                                    attributes: ['product_id', 'product_name', 'ministry_type', 'is_ministry_page', 'product_duration'],
                                    as: 'updated_product',
                                    model: dbReader.products,
                                    where: { [Op.and]: productsWhere }
                                }]
                            }]
                        }]
                    }],
                    order: [[dbReader.Sequelize.literal('`user_subscriptions`.`created_datetime`'), 'ASC']],
                });
                getActiveSubscribers = JSON.parse(JSON.stringify(getActiveSubscribers));

                const filteredSubscribers = getActiveSubscribers.map((subscriber: any) => {
                    // Filter subscriptions with valid order items
                    const validSubscriptions = subscriber.user_subscriptions.filter((subscription: any) => {
                        return subscription.user_orders.some((order: any) => {
                            return order.user_order_items.some((item: any) => item.sycu_product !== null || item.updated_product !== null);
                        });
                    });

                    // Update subscriber with filtered subscriptions
                    return {
                        ...subscriber,
                        user_subscriptions: validSubscriptions
                    };
                }).filter((subscriber: any) => subscriber.user_subscriptions.length > 0);

                const classifyActiveSubscribers = (subscribers: any) => {
                    let kidsActiveUsers: any = [], studentsActiveUsers: any = [], annualActiveUsers: any = [],
                        quarterlyActiveUsers: any = [], monthlyActiveUsers: any = [];
                    subscribers.forEach((user: any) => {
                        const userSubscriptions = user['user_subscriptions'];
                        if (userSubscriptions) {
                            userSubscriptions.forEach((sub: any) => {
                                const orders = sub['user_orders'];
                                orders.forEach((order: any) => {
                                    const items = order['user_order_items'];
                                    items.forEach((item: any) => {
                                        let ministry_type = item['updated_product']?.ministry_type ? item['updated_product']?.ministry_type : item['sycu_product']?.ministry_type;
                                        let product_duration = item['updated_product']?.product_duration ? item['updated_product']?.product_duration : item['sycu_product']?.product_duration;
                                        switch (ministry_type) {
                                            case 1:
                                                if (!kidsActiveUsers.some((u: any) => (u.user_id === user.user_id)))
                                                    kidsActiveUsers.push(user);
                                                break;
                                            case 2:
                                                if (!studentsActiveUsers.some((u: any) => (u.user_id === user.user_id)))
                                                    studentsActiveUsers.push(user);
                                                break;
                                        }
                                        switch (product_duration) {
                                            case 365:
                                                if (!annualActiveUsers.some((u: any) => (u.user_id === user.user_id)))
                                                    annualActiveUsers.push(user);
                                                break;
                                            case 90:
                                                if (!quarterlyActiveUsers.some((u: any) => (u.user_id === user.user_id)))
                                                    quarterlyActiveUsers.push(user);
                                                break;
                                            case 30:
                                                if (!monthlyActiveUsers.some((u: any) => (u.user_id === user.user_id)))
                                                    monthlyActiveUsers.push(user);
                                                break;
                                        }
                                    });
                                })
                            });
                        }
                    });
                    return { kidsActiveUsers, studentsActiveUsers, annualActiveUsers, quarterlyActiveUsers, monthlyActiveUsers };
                };
                const { kidsActiveUsers, studentsActiveUsers, annualActiveUsers, quarterlyActiveUsers, monthlyActiveUsers } = classifyActiveSubscribers(filteredSubscribers);

                const activeSubscribersCount = {
                    activeKids: aggregateCurriculum(kidsActiveUsers),
                    activeStudents: aggregateCurriculum(studentsActiveUsers),
                    activeAnnual: aggregateCurriculum(annualActiveUsers),
                    activeQuarterly: aggregateCurriculum(quarterlyActiveUsers),
                    activeMonthly: aggregateCurriculum(monthlyActiveUsers)
                };

                const finalResponseChartData = formatCurriculumFinalArray(activeSubscribersCount, newSubscribersCount);

                if (filter_type != 1 && filter_type != 2 && duration_filter != 1) {
                    // Return Bundled graph data
                    const getNewBundleSubscribers = await dbReader.users.findAll({
                        attributes: ['user_id', 'email', 'first_name', 'last_name', 'created_datetime',
                            [dbReader.Sequelize.literal('`user_subscriptions`.`created_datetime`'), 'created_datetime']],
                        include: [{
                            required: true,
                            model: dbReader.userSubscription,
                            attributes: ['user_subscription_id', 'subscription_number', 'created_datetime'],
                            where: {
                                [Op.and]: [{ site_id: site_id }, { is_bundle_subscription: 1 },
                                dbReader.Sequelize.where(dbReader.Sequelize.literal('`user_subscriptions`.`created_datetime`'), {
                                    [Op.between]: [startDate, endDate]
                                })]
                            },
                            include: [{
                                model: dbReader.userOrder,
                                attributes: ['total_amount', 'created_datetime'],
                                where: {
                                    [Op.and]: [{
                                        order_status: { [Op.notIn]: [1, 7] }
                                    }, {
                                        created_datetime: { [Op.between]: [startDate, endDate] }
                                    }]
                                },
                                include: [{
                                    model: dbReader.userOrderItems,
                                    attributes: ["user_order_item_id"],
                                    where: { item_type: 1, is_deleted: 0 },
                                    include: [{
                                        required: false,
                                        model: dbReader.products,
                                        attributes: ['product_id', 'product_name', 'ministry_type', 'is_ministry_page', 'product_duration'],
                                        where: { ministry_type: { [Op.in]: [1, 2] }, product_duration: { [Op.in]: [30, 90, 365] } }
                                    }, {
                                        required: false,
                                        as: 'updated_product',
                                        model: dbReader.products,
                                        attributes: ['product_id', 'product_name', 'ministry_type', 'is_ministry_page', 'product_duration'],
                                        where: { ministry_type: { [Op.in]: [1, 2] }, product_duration: { [Op.in]: [30, 90, 365] } }
                                    }]
                                }]
                            }]
                        }],
                        order: [[dbReader.Sequelize.literal('`user_subscriptions`.`created_datetime`'), 'ASC']],
                    });

                    const newBundled = aggregateByMonth(getNewBundleSubscribers);
                    const getTotalSubscribers = async (type: number, duration: number = 0, is_from: number = 0) => {
                        const promises = monthArray.map((month: any) =>
                            subscriptionController.allActiveSubscriptionsFunction(type, site_id, month, duration, is_from, 1)
                        );
                        return await Promise.all(promises);
                    };

                    const bundledData = await getTotalSubscribers(0, 0, 1);
                    const bundledChartData = formatFinalArray(bundledData, newBundled);

                    finalResponseChartData.forEach((chartData: any) => {
                        let monthData = bundledChartData.find((bundleChartData: any) => bundleChartData.month == chartData.month);
                        if (monthData) {
                            chartData.grow_bundle = {
                                total_subscribers: monthData.new_subscribers,
                                total_active_subscribers: monthData.total_subscribers,
                            }
                        }
                        if (filter_type == 3) {
                            delete chartData.grow_kids
                            delete chartData.grow_students
                        }
                    });
                }

                finalResponse.title = (duration_filter == 1) ? 'Curriculum Duration Overview' : 'Curriculum Overview';
                finalResponse.chartData = finalResponseChartData;
            }
            // Return other sites data
            else {
                // Return Kids Music Report
                if (site_id === EnumObject.siteEnum.get('kids music').value) {
                    // find total purchased music count
                    let musicData = await dbReader.users.findAll({
                        attributes: ['first_name', 'last_name', 'email'],
                        include: [{
                            model: dbReader.userSubscription,
                            attributes: ['subscription_number', 'created_datetime'],
                            where: { site_id: EnumObject.siteEnum.get('kids music').value },
                            include: [{
                                required: true,
                                model: dbReader.userOrder,
                                attributes: ['user_orders_id', 'created_datetime', 'user_id', 'total_amount',
                                ],
                                where: { site_id: EnumObject.siteEnum.get('kids music').value, order_status: { [Op.in]: [2, 4, 10] } },
                                include: [{
                                    attributes: ['product_name', 'created_datetime', 'user_order_item_id'],
                                    model: dbReader.userOrderItems,
                                    where: { is_deleted: 0, item_type: 1 }
                                }]
                            }]
                        }],
                    });
                    let newMusicData: any = [];
                    musicData = JSON.parse(JSON.stringify(musicData));
                    musicData.forEach((data: any) => {
                        data.user_subscriptions.forEach((subscription: any) => {
                            subscription.user_orders.forEach((order: any) => {
                                order.user_order_items.forEach((item: any) => {
                                    item.user_id = item.user_order_item_id;
                                    newMusicData.push(item);
                                })
                            })
                        })
                    })
                    const musicVideos = aggregateByMonth(newMusicData);
                    const musicVideosCount = monthArray.map((month: any, index: any) => ({
                        month: month,
                        purchased_videos: musicVideos[month]?.count || 0,
                    }));
                    finalResponse.title = 'Kids Music Overview';
                    finalResponse.chartData = musicVideosCount;
                    finalResponse.export_data = musicData;
                }
                // Return other Sites Report
                else if ([EnumObject.siteEnum.get('builder').value, EnumObject.siteEnum.get('hub').value,
                EnumObject.siteEnum.get('slider').value, EnumObject.siteEnum.get('board').value].includes(site_id)) {
                    let subscribers: any = await dbReader.users.findAll({
                        attributes: ['user_id', 'email', 'first_name', 'last_name',
                            [dbReader.Sequelize.literal('`user_subscriptions`.`created_datetime`'), 'created_datetime']],
                        include: [{
                            required: true,
                            model: dbReader.userSubscription,
                            attributes: ['user_subscription_id', 'subscription_number', 'created_datetime'],
                            where: {
                                subscription_status: { [Op.in]: [2, 4, 10] },
                                site_id,
                                [Op.and]: dbReader.Sequelize.where(dbReader.Sequelize.literal('`user_subscriptions`.`created_datetime`'), {
                                    [Op.between]: [startDate, endDate]
                                }),
                            },
                            include: [{
                                separate: true,
                                attributes: ['user_subscription_id', 'product_name'],
                                model: dbReader.userSubscriptionItems,
                                where: { is_deleted: 0, item_type: 1 },
                            }, {
                                model: dbReader.userOrder,
                                attributes: ['total_amount'],
                                limit: 1
                            }]
                        }],
                        order: [[dbReader.Sequelize.literal('`user_subscriptions`.`created_datetime`'), 'ASC']],
                    });
                    subscribers = JSON.parse(JSON.stringify(subscribers));
                    const newSubscribersCount = aggregateByMonth(subscribers);
                    subscribers.forEach((subscriber: any) => {
                        export_data.push({
                            type: 'new_subscriber',
                            email: subscriber.email,
                            first_name: subscriber.first_name,
                            last_name: subscriber.last_name,
                            user_subscriptions: subscriber.user_subscriptions.map((subscription: any) => {
                                return {
                                    subscription_number: subscription.subscription_number,
                                    created_datetime: subscription.created_datetime,
                                    product_name: subscription.user_subscription_items[0].product_name,
                                    total_amount: subscription.user_orders[0]?.total_amount || 0
                                };
                            })
                        })
                    });

                    const getTotalSubscribers = Promise.all(monthArray.map((month: any) =>
                        subscriptionController.allActiveSubscriptionsFunction(0, site_id, month, 0)));
                    let totalSubscribers = await getTotalSubscribers;
                    totalSubscribers = JSON.parse(JSON.stringify(totalSubscribers));

                    let chartData = formatFinalArray(totalSubscribers, newSubscribersCount);
                    let total_subscriber = await dbReader.users.findAll({
                        attributes: ['user_id', 'email', 'first_name', 'last_name',
                            [dbReader.Sequelize.literal('`user_subscriptions`.`created_datetime`'), 'created_datetime']],
                        where: { user_id: { [Op.in]: active_users } },
                        include: [{
                            required: true,
                            model: dbReader.userSubscription,
                            attributes: ['user_subscription_id', 'subscription_number', 'created_datetime'],
                            where: { site_id },
                            include: [{
                                separate: true,
                                attributes: ['user_subscription_id', 'product_name'],
                                model: dbReader.userSubscriptionItems,
                                where: { is_deleted: 0, item_type: 1 },
                            }, {
                                model: dbReader.userOrder,
                                attributes: ['total_amount'],
                                where: { order_status: { [Op.ne]: 7 } },
                            }]
                        }],
                        order: [[dbReader.Sequelize.literal('`user_subscriptions`.`created_datetime`'), 'ASC']],
                    });
                    total_subscriber = JSON.parse(JSON.stringify(total_subscriber));
                    total_subscriber.forEach((data: any) => {
                        export_data.push({
                            type: 'active_subscriber',
                            email: data.email,
                            first_name: data.first_name,
                            last_name: data.last_name,
                            user_subscriptions: data.user_subscriptions.map((subscription: any) => {
                                return {
                                    subscription_number: subscription.subscription_number,
                                    created_datetime: subscription.created_datetime,
                                    product_name: subscription.user_subscription_items[0].product_name,
                                    total_amount: subscription.user_orders[0]?.total_amount || 0
                                };
                            })
                        })
                    })

                    if (site_id === EnumObject.siteEnum.get('builder').value) {
                        finalResponse.title = 'Builder Overview';
                        finalResponse.chartData = chartData;
                        finalResponse.export_data = export_data;
                    }
                    if (site_id === EnumObject.siteEnum.get('hub').value) {
                        finalResponse.title = 'Hubs Overview';
                        finalResponse.chartData = chartData;
                        finalResponse.export_data = export_data;
                    }
                    if (site_id === EnumObject.siteEnum.get('slider').value) {
                        finalResponse.title = 'Slides Overview';
                        finalResponse.chartData = chartData;
                        finalResponse.export_data = export_data;
                    }
                    if (site_id === EnumObject.siteEnum.get('board').value) {
                        finalResponse.title = 'Creative Boards Overview';
                        finalResponse.chartData = chartData;
                        finalResponse.export_data = export_data;
                    }
                }
            }

            finalResponse.site_id = site_id;
            new SuccessResponse("Success", finalResponse).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public getFreeTrialUserReport = async (req: Request, res: Response) => {
        try {
            let { user_role = 3, start_date, end_date } = req.body;
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const startDate = moment(start_date, 'DD-MM-YYYY').format('YYYY-MM-DD HH:mm:ss');
            const endDate = moment(end_date, 'DD-MM-YYYY').format('YYYY-MM-DD HH:mm:ss');
            let finalUserData: any = [], chartData = [];

            let userData = await dbReader.users.findAll({
                attributes: ["user_id", "email", "first_name", "last_name", "created_datetime"],
                where: { is_deleted: 0, user_role: user_role },
                include: [{
                    required: false,
                    model: dbReader.userSubscription,
                    attributes: ["user_subscription_id", "subscription_status", "start_date", "end_date"]
                }]
            });
            userData = JSON.parse(JSON.stringify(userData));
            userData.forEach((user: any) => {
                let free_trial_end_date = user.user_subscriptions.length ? user.user_subscriptions[0].start_date : new Date();
                finalUserData.push({
                    user_id: user.user_id,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    created_date: user.created_datetime,
                    free_trial_end_date: free_trial_end_date,
                })
            });

            const filteredData = finalUserData.filter((item: any) => {
                const createdDate = moment(item.created_date, 'DD-MM-YYYY').format('YYYY-MM-DD HH:mm:ss');
                const freeTrialEndDate = moment(item.free_trial_end_date, 'DD-MM-YYYY').format('YYYY-MM-DD HH:mm:ss');
                return createdDate <= startDate && freeTrialEndDate >= endDate;
            });

            function addMonth(date: any) {
                let newDate = new Date(date);
                newDate.setMonth(newDate.getMonth() + 1);
                if (newDate.getDate() !== date.getDate()) {
                    newDate.setDate(0);
                }
                return newDate;
            }

            let currentDate = new Date(startDate);
            const exportDataSet = new Set();
            while (currentDate <= new Date(endDate)) {
                const monthYear = `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
                let totalSubscribers = 0;

                filteredData.forEach((item: any) => {
                    const createdDate = new Date(item.created_date);
                    const freeTrialEndDate = new Date(item.free_trial_end_date);
                    if (createdDate <= currentDate && freeTrialEndDate >= currentDate) {
                        totalSubscribers++;
                        exportDataSet.add(JSON.stringify(item));
                    }
                });
                chartData.push({
                    month: monthYear,
                    free_trial_users: totalSubscribers,
                });
                currentDate = addMonth(currentDate);
            }

            const export_data = Array.from(exportDataSet).map((item: any) => JSON.parse(item));
            new SuccessResponse("Success", {
                "title": "Free Trial Overview",
                "chartData": chartData,
                "export_data": export_data,
                "site_id": 0
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public getSubscriberSummary = async (req: Request, res: Response) => {
        try {
            let { previous_year_count = 1 } = req.body;
            const startOfPreviousYear = moment().subtract(previous_year_count, 'year').startOf('year').format('YYYY-MM-DD HH:mm:ss');
            const endOfPreviousYear = moment().subtract(previous_year_count, 'year').format('YYYY-MM-DD HH:mm:ss');
            const startOfCurrentYear = moment().startOf('year').format('YYYY-MM-DD HH:mm:ss');
            const endOfCurrentYear = moment().format('YYYY-MM-DD HH:mm:ss');

            let summaryArray = [
                { title: "Curriculum", site_id: EnumObject.siteEnum.get('curriculum').value },
                { title: "Hubs", site_id: EnumObject.siteEnum.get('hub').value },
                { title: "Lesson Builder", site_id: EnumObject.siteEnum.get('builder').value },
                { title: "Slides", site_id: EnumObject.siteEnum.get('slider').value },
                { title: "Creative Board", site_id: EnumObject.siteEnum.get('board').value },
            ];

            let fetchData = async (site_id: any, productRequiredCondition: any, start_date: any, end_date: any) => {
                return await dbReader.userSubscription.findAll({
                    attributes: ['user_subscription_id', 'subscription_number', 'subscription_status', 'start_date', 'end_date',
                        [dbReader.sequelize.fn("concat", dbReader.sequelize.literal('`sycu_user`.`first_name`'), ' ', dbReader.sequelize.literal('`sycu_user`.`last_name`')), "user_name"],
                        [dbReader.sequelize.literal('`sycu_user`.`email`'), "email"], [dbReader.sequelize.literal('`sycu_user`.`user_id`'), "user_id"]
                    ],
                    where: {
                        site_id: site_id,
                        [Op.or]: [{
                            start_date: { [Op.between]: [start_date, end_date] }
                        }, {
                            end_date: { [Op.between]: [start_date, end_date] }
                        }, {
                            [Op.and]: [{ start_date: { [Op.lte]: start_date } }, { end_date: { [Op.gte]: end_date } }]
                        }, {
                            [Op.and]: [{ start_date: { [Op.gte]: start_date } }, { end_date: { [Op.lte]: end_date } }]
                        }]
                    },
                    include: [{
                        attributes: [],
                        model: dbReader.users,
                    }, {
                        separate: true,
                        model: dbReader.userSubscriptionItems,
                        attributes: ['user_subscription_item_id', 'product_name', 'product_id', 'created_datetime'],
                        where: { is_deleted: 0, item_type: 1 },
                        include: [{
                            required: productRequiredCondition,
                            model: dbReader.products,
                            attributes: ['ministry_type', 'product_duration'],
                            where: { ministry_type: { [Op.in]: [1, 2] } }
                        }]
                    }, {
                        separate: true,
                        model: dbReader.userOrder,
                        attributes: ["user_orders_id", "user_subscription_id", "created_datetime"],
                        where: { order_status: { [Op.ne]: 7 } },
                        include: [{
                            separate: true,
                            model: dbReader.userOrderItems,
                            attributes: ["user_order_item_id"],
                            where: { item_type: 1, is_deleted: 0 },
                            include: [{
                                required: productRequiredCondition,
                                attributes: ['product_id', 'product_name', 'ministry_type', 'is_ministry_page', 'product_duration'],
                                model: dbReader.products,
                                where: { ministry_type: { [Op.in]: [1, 2] } }
                            }]
                        }]
                    }]
                });
            };

            let processUserData = (userSubscriptionData: any) => {
                userSubscriptionData = JSON.parse(JSON.stringify(userSubscriptionData));
                userSubscriptionData.forEach((e: any) => {
                    e.user_orders = e.user_orders.filter((f: any) => f.user_order_items.length > 0);
                });
                userSubscriptionData = userSubscriptionData.filter((us: any) => us.user_orders.length > 0);
                let userIDs: any = [];
                userSubscriptionData.forEach((e: any) => {
                    if (!userIDs.includes(e.user_id)) {
                        userIDs.push(e.user_id);
                    }
                });
                return userIDs.length;
            };

            let processDifference = (current: any, previous: any) => {
                let percentage_change, sign;
                if (previous === 0) {
                    if (current === 0) {
                        percentage_change = 0;
                        sign = "";
                    } else {
                        percentage_change = 100;
                        sign = "+";
                    }
                } else {
                    percentage_change = (((current - previous) / previous) * 100);
                    sign = (((current - previous) / previous) * 100) >= 0 ? "+" : "-";
                }
                let difference = `${sign}${Math.abs(percentage_change).toFixed(2)}%`;
                return difference;
            };

            let currentYearData = await Promise.all(summaryArray.map(async (item) => {
                let productRequiredCondition = item.site_id == EnumObject.siteEnum.get('curriculum').value;
                let userSubscriptionData = await fetchData(item.site_id, productRequiredCondition, startOfCurrentYear, endOfCurrentYear);
                let cnt = processUserData(userSubscriptionData);
                return {
                    title: item.title,
                    currentYearUserIDs: cnt
                };
            }));

            let previousYearData = await Promise.all(summaryArray.map(async (item) => {
                let productRequiredCondition = item.site_id == EnumObject.siteEnum.get('curriculum').value;
                let userSubscriptionData = await fetchData(item.site_id, productRequiredCondition, startOfPreviousYear, endOfPreviousYear);
                let cnt = processUserData(userSubscriptionData);
                return {
                    title: item.title,
                    previousYearUserIDs: cnt
                };
            }));

            let currentActiveSubscription = await Promise.all(summaryArray.map(async (item) => {
                let productRequiredCondition = item.site_id == EnumObject.siteEnum.get('curriculum').value;
                let userSubscriptionData = await dbReader.userSubscription.findAll({
                    attributes: ['user_subscription_id', 'subscription_number', 'subscription_status', 'start_date', 'end_date', 'site_id',
                        [dbReader.sequelize.fn("concat", dbReader.sequelize.literal('`sycu_user`.`first_name`'), ' ', dbReader.sequelize.literal('`sycu_user`.`last_name`')), "user_name"],
                        [dbReader.sequelize.literal('`sycu_user`.`email`'), "email"], [dbReader.sequelize.literal('`sycu_user`.`user_id`'), "user_id"]
                    ],
                    where: {
                        site_id: item.site_id,
                        subscription_status: { [Op.in]: [2, 4, 8, 10] }
                    },
                    include: [{
                        attributes: [],
                        model: dbReader.users,
                    }, {
                        separate: true,
                        model: dbReader.userSubscriptionItems,
                        attributes: ['user_subscription_item_id', 'product_name', 'product_id', 'created_datetime'],
                        where: { is_deleted: 0, item_type: 1 },
                        include: [{
                            required: productRequiredCondition,
                            model: dbReader.products,
                            attributes: ['ministry_type', 'product_duration'],
                            where: { ministry_type: { [Op.in]: [1, 2] } }
                        }]
                    }, {
                        separate: true,
                        model: dbReader.userOrder,
                        attributes: ["user_orders_id", "user_subscription_id", "created_datetime"],
                        where: { order_status: { [Op.ne]: 7 } },
                        include: [{
                            separate: true,
                            model: dbReader.userOrderItems,
                            attributes: ["user_order_item_id"],
                            where: { item_type: 1, is_deleted: 0 },
                            include: [{
                                required: productRequiredCondition,
                                attributes: ['product_id', 'product_name', 'ministry_type', 'is_ministry_page', 'product_duration'],
                                model: dbReader.products,
                                where: { ministry_type: { [Op.in]: [1, 2] } }
                            }]
                        }]
                    }]
                });
                userSubscriptionData = JSON.parse(JSON.stringify(userSubscriptionData));
                userSubscriptionData.forEach((e: any) => {
                    e.user_orders = e.user_orders.filter((f: any) => f.user_order_items.length > 0);
                });
                userSubscriptionData = userSubscriptionData.filter((us: any) => us.user_orders.length > 0);
                let userIDs: any = [], curriculumArray: any = [];
                userSubscriptionData.forEach((e: any) => {
                    if (e.site_id == EnumObject.siteEnum.get('curriculum').value && e.user_subscription_items.length) {
                        if (!curriculumArray.find((c: any) => c.user_id == e.user_id)) {
                            curriculumArray.push({ user_id: e.user_id, kids: false, student: false });
                        }
                        if (e.user_subscription_items.some((si: any) => si.sycu_product.ministry_type == 1)) {
                            curriculumArray.find((c: any) => c.user_id == e.user_id).kids = true
                        }
                        if (e.user_subscription_items.some((si: any) => si.sycu_product.ministry_type == 2)) {
                            curriculumArray.find((c: any) => c.user_id == e.user_id).student = true
                        }
                    } else {
                        if (!userIDs.includes(e.user_id)) {
                            userIDs.push(e.user_id);
                        }
                    }
                });
                curriculumArray.forEach((c: any) => {
                    if (c.kids == true) {
                        userIDs.push(c.user_id)
                    }
                    if (c.student == true) {
                        userIDs.push(c.user_id)
                    }
                });

                return {
                    title: item.title,
                    activeIDs: userIDs.length
                };
            }));

            // Combining data into final response
            let finalResponse: any = summaryArray.map(item => {
                let current: any = currentYearData.find(d => d.title === item.title) || {};
                let previous: any = previousYearData.find(d => d.title === item.title) || {};
                let activeSubscription: any = currentActiveSubscription.find(d => d.title === item.title) || {};
                return {
                    title: item.title,
                    count: current.currentYearUserIDs || 0,
                    previousYearUserIDs: previous.previousYearUserIDs || 0,
                    activeSubscription: activeSubscription.activeIDs || 0
                };
            });

            const previousYearMusic = await dbReader.userOrder.findAll({
                attributes: ['user_orders_id', 'created_datetime'],
                where: {
                    site_id: EnumObject.siteEnum.get('kids music').value,
                    order_status: { [Op.in]: [2, 4, 10] },
                    created_datetime: { [Op.between]: [startOfPreviousYear, endOfPreviousYear] }
                },
                include: [{
                    attributes: ["user_order_item_id"],
                    model: dbReader.userOrderItems,
                    where: { is_deleted: 0, item_type: 1 }
                }, {
                    attributes: [],
                    required: true,
                    model: dbReader.users,
                }]
            });

            const currentYearMusic = await dbReader.userOrder.findAll({
                attributes: ['user_orders_id', 'created_datetime'],
                where: {
                    site_id: EnumObject.siteEnum.get('kids music').value,
                    order_status: { [Op.in]: [2, 4, 10] },
                    created_datetime: { [Op.between]: [startOfCurrentYear, endOfCurrentYear] }
                },
                include: [{
                    attributes: ["user_order_item_id"],
                    model: dbReader.userOrderItems,
                    where: { is_deleted: 0, item_type: 1 }
                }, {
                    attributes: [],
                    required: true,
                    model: dbReader.users,
                }]
            });

            const totalMusicSub = await dbReader.userOrder.findAll({
                attributes: ['user_orders_id', 'created_datetime'],
                where: { site_id: EnumObject.siteEnum.get('kids music').value, order_status: { [Op.in]: [2, 4, 8, 10] } },
                include: [{
                    attributes: ["user_order_item_id"],
                    model: dbReader.userOrderItems,
                    where: { is_deleted: 0, item_type: 1 }
                }, {
                    attributes: [],
                    required: true,
                    model: dbReader.users,
                }]
            });

            let currentYearMusicItems = [];
            currentYearMusic.forEach((e: any) => {
                e.user_order_items.forEach((f: any) => {
                    currentYearMusicItems.push(f)
                })
            })

            let previousYearMusicItems = [];
            previousYearMusic.forEach((e: any) => {
                e.user_order_items.forEach((f: any) => {
                    previousYearMusicItems.push(f)
                })
            })

            let totalMusicItems = [];
            totalMusicSub.forEach((e: any) => {
                e.user_order_items.forEach((f: any) => {
                    totalMusicItems.push(f)
                })
            })

            finalResponse.push({
                title: 'Kids Music',
                count: currentYearMusicItems.length ?? 0,
                activeSubscription: totalMusicItems.length ?? 0,
                previousYearUserIDs: previousYearMusicItems.length ?? 0,
            });
            finalResponse.forEach((item: any) => {
                item.percentage = processDifference(item.count, item.previousYearUserIDs);
                delete item.previousYearUserIDs;
            });

            new SuccessResponse("Success", finalResponse).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    /**
     * fieldFilter => 1: new subscriber, 2: total subscriber
     * ministryFilter => 1: kids subscriber, 2: students subscriber, 3: groups subscriber
     * durationFilter => 1: monthly subscriber, 2: quarterly subscriber, 3: annual subscriber
     */
    public exportCurriculumData = async (req: Request, res: Response) => {
        try {
            let { fieldFilter = [], ministryFilter = [], durationFilter = [], bundleFilter = false, start_date, end_date } = req.body;
            const startDate: any = moment(start_date, 'DD-MM-YYYY').format('YYYY-MM-DD HH:mm:ss');
            const endDate: any = moment(end_date, 'DD-MM-YYYY').format('YYYY-MM-DD HH:mm:ss');
            let getNewSubscribers: any = [], productsWhere: any = [], getActiveSubscribers: any = [], finalData: any;

            if (ministryFilter.length === 0 && bundleFilter) {
                ministryFilter = [1, 2];
            }
            if (ministryFilter.length > 0) {
                productsWhere.push({ ministry_type: ministryFilter });
            }
            if (durationFilter.length > 0) {
                productsWhere.push({ product_duration: durationFilter });
            }
            if (fieldFilter.includes(2)) {
                getActiveSubscribers = await dbReader.users.findAll({
                    attributes: ['user_id', 'email', 'first_name', 'last_name'],
                    include: [{
                        required: true,
                        model: dbReader.userSubscription,
                        attributes: ['subscription_number', 'created_datetime'],
                        where: {
                            [Op.and]: [
                                {
                                    [Op.or]: [{
                                        [Op.and]: [{
                                            start_date: { [Op.lte]: startDate },
                                            end_date: { [Op.gte]: startDate }
                                        }]
                                    }, {
                                        [Op.and]: [{
                                            start_date: { [Op.lte]: endDate },
                                            end_date: { [Op.gte]: endDate }
                                        }]
                                    }]
                                },
                                { site_id: EnumObject.siteEnum.get('curriculum').value }
                            ]
                        },
                        include: [{
                            // as: 'user_order_check',
                            model: dbReader.userOrder,
                            attributes: ['total_amount', 'created_datetime'],
                            where: {
                                [Op.and]: [{
                                    order_status: { [Op.notIn]: [1, 7] }
                                }, {
                                    created_datetime: { [Op.between]: [startDate, endDate] }
                                }]
                            },
                            include: [{
                                model: dbReader.userOrderItems,
                                attributes: ["user_order_item_id"],
                                where: { item_type: 1, is_deleted: 0 },
                                include: [{
                                    required: false,
                                    attributes: ['product_id', 'product_name', 'ministry_type', 'is_ministry_page', 'product_duration'],
                                    model: dbReader.products,
                                    where: { [Op.and]: productsWhere }
                                }, {
                                    required: false,
                                    attributes: ['product_id', 'product_name', 'ministry_type', 'is_ministry_page', 'product_duration'],
                                    as: 'updated_product',
                                    model: dbReader.products,
                                    where: { [Op.and]: productsWhere }
                                }]
                            }]
                        }]
                    }],
                    order: [[dbReader.Sequelize.literal('`user_subscriptions`.`created_datetime`'), 'ASC']],
                });
                getActiveSubscribers = JSON.parse(JSON.stringify(getActiveSubscribers));
            }
            if (fieldFilter.includes(1)) {
                getNewSubscribers = await dbReader.users.findAll({
                    attributes: ['user_id', 'email', 'first_name', 'last_name'],
                    include: [{
                        required: true,
                        model: dbReader.userSubscription,
                        attributes: ['subscription_number', 'created_datetime'],
                        where: {
                            [Op.and]: [
                                dbReader.Sequelize.where(dbReader.Sequelize.literal('`user_subscriptions`.`created_datetime`'), { [Op.between]: [startDate, endDate] }),
                                { site_id: EnumObject.siteEnum.get('curriculum').value }
                            ]
                        },
                        include: [{
                            as: 'user_order_check',
                            model: dbReader.userOrder,
                            attributes: ['total_amount', 'created_datetime'],
                            where: { order_status: { [Op.notIn]: [1, 7] } },
                            include: [{
                                model: dbReader.userOrderItems,
                                attributes: ["user_order_item_id"],
                                where: { item_type: 1, is_deleted: 0 },
                                include: [{
                                    required: false,
                                    attributes: ['product_id', 'product_name', 'ministry_type', 'is_ministry_page', 'product_duration'],
                                    model: dbReader.products,
                                    where: { [Op.and]: productsWhere }
                                }, {
                                    required: false,
                                    attributes: ['product_id', 'product_name', 'ministry_type', 'is_ministry_page', 'product_duration'],
                                    as: 'updated_product',
                                    model: dbReader.products,
                                    where: { [Op.and]: productsWhere }
                                }]
                            }]
                        }]
                    }],
                    order: [[dbReader.Sequelize.literal('`user_subscriptions`.`created_datetime`'), 'ASC']],
                });
                getNewSubscribers = JSON.parse(JSON.stringify(getNewSubscribers));
            }

            function mergeByUniqueKey(arr: any, key: any) {
                const seen = new Map();
                arr.forEach((item: any) => {
                    const keyValue = item[key];
                    if (!seen.has(keyValue)) {
                        seen.set(keyValue, item);
                    } else {
                        // Merge if key exists
                        const existingItem = seen.get(keyValue);
                        // Merge subscriptions
                        existingItem.user_subscriptions = mergeSubscriptions(existingItem.user_subscriptions, item.user_subscriptions);
                    }
                });
                return Array.from(seen.values());
            }
            // Function to merge subscriptions
            function mergeSubscriptions(existingSubs: any, newSubs: any) {
                const subscriptionMap = new Map();
                existingSubs.forEach((sub: any) => {
                    subscriptionMap.set(sub.subscription_number, sub);
                });
                newSubs.forEach((newSub: any) => {
                    const existingSub = subscriptionMap.get(newSub.subscription_number);
                    if (!existingSub) {
                        subscriptionMap.set(newSub.subscription_number, newSub);
                    } else {
                        // Merge orders
                        existingSub.user_orders = mergeOrders(existingSub.user_orders || [], newSub.user_orders || []);
                        existingSub.user_order_check = mergeOrders([existingSub.user_order_check].filter(Boolean), [newSub.user_order_check].filter(Boolean))[0];
                    }
                });
                return Array.from(subscriptionMap.values());
            }
            // Function to merge orders
            function mergeOrders(existingOrders: any, newOrders: any) {
                const orderMap = new Map();
                existingOrders.forEach((order: any) => {
                    if (order && order.created_datetime) {
                        orderMap.set(order.created_datetime, order);
                    }
                });
                newOrders.forEach((newOrder: any) => {
                    if (newOrder && newOrder.created_datetime) {
                        if (!orderMap.has(newOrder.created_datetime)) {
                            orderMap.set(newOrder.created_datetime, newOrder);
                        } else {
                            const existingOrder = orderMap.get(newOrder.created_datetime);
                            // Merge order items
                            existingOrder.user_order_items = mergeOrderItems(existingOrder.user_order_items || [], newOrder.user_order_items || []);
                        }
                    }
                });
                return Array.from(orderMap.values());
            }
            // Function to merge order items
            function mergeOrderItems(existingItems: any, newItems: any) {
                const itemMap = new Map();
                existingItems.forEach((item: any) => {
                    itemMap.set(item.user_order_item_id, item);
                });
                newItems.forEach((newItem: any) => {
                    if (!itemMap.has(newItem.user_order_item_id)) {
                        itemMap.set(newItem.user_order_item_id, newItem);
                    } else {
                        const existingItem = itemMap.get(newItem.user_order_item_id);
                        // Check for updated product
                        if (newItem.updated_product) {
                            existingItem.updated_product = newItem.updated_product;
                        }
                    }
                });
                return Array.from(itemMap.values());
            }
            // Format the data into the desired structure
            function formatSubscriberData(subscriber: any) {
                return {
                    email: subscriber.email,
                    first_name: subscriber.first_name,
                    last_name: subscriber.last_name,
                    user_subscriptions: subscriber.user_subscriptions.map((subscription: any) => ({
                        subscription_number: subscription.subscription_number,
                        created_datetime: subscription.created_datetime,
                        products: (subscription.user_orders || [subscription.user_order_check])
                            .flatMap((order: any) => order.user_order_items.map((item: any) => {
                                const product = item.updated_product || item.sycu_product;
                                // Added check to ensure product exists
                                if (!product) {
                                    return null;
                                }
                                return {
                                    order_date: order.created_datetime,
                                    total_amount: order.total_amount,
                                    product_name: product.product_name,
                                    product_duration: product.product_duration,
                                    ministry_type: product.ministry_type
                                };
                            }))
                            .filter(Boolean) // Remove any null products
                    }))
                };
            }

            // Merge subscribers and format the data
            const mergedSubscribers = mergeByUniqueKey([...getNewSubscribers, ...getActiveSubscribers], 'email');
            finalData = mergedSubscribers.map(formatSubscriberData)

            // Filter out subscriptions with empty products array
            finalData.forEach((user: any) => {
                user.user_subscriptions = user.user_subscriptions.filter((subscription: any) => subscription.products.length > 0);
            });
            finalData = finalData.filter((user: any) => user.user_subscriptions.length > 0);
            if (bundleFilter) {
                function filterSubscriptions(data: any) {
                    return data.filter((user: any) => {
                        // Check if user has both ministry_type = 1 and ministry_type = 2
                        let hasMinistryType1 = false;
                        let hasMinistryType2 = false;

                        user.user_subscriptions.forEach((subscription: any) => {
                            if (subscription.products.some((product: any) => product.ministry_type === 1)) {
                                hasMinistryType1 = true;
                            }
                            if (subscription.products.some((product: any) => product.ministry_type === 2)) {
                                hasMinistryType2 = true;
                            }
                        });

                        return hasMinistryType1 && hasMinistryType2;
                    });
                }
                let filteredData = filterSubscriptions(finalData);
                finalData = filteredData;
            }
            new SuccessResponse("Success", finalData).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
}
