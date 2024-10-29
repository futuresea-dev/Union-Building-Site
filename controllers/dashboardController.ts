import { Request, Response } from "express";
import moment from 'moment';
import _ from 'lodash';
import { ErrorController, SuccessResponse, BadRequestError, ApiError } from '../core/index';
import { getDateRange } from '../helpers/helpers';
const { dbReader, dbWriter } = require('../models/dbConfig');
const EC = new ErrorController();
const { Op } = dbReader.Sequelize;

export class DashboardController {
    /*
    * Code done by Sh - 02-12-2021
    * For dashboard chart api's
    */

    public async dashBoardData(req: Request, res: Response) {
        try {
            var current_obj = new DashboardController();

            //Getting Register User Detail
            let getRegisteredUser = await current_obj.registeredUserDetail(req, res);

            //Getting Active Subscription values Detail
            let getActiveSubscription = await current_obj.activeSubscriptionDetail(req, res);

            //Getting Cancel Subscription Detail
            let getCancelSubscription = await current_obj.cancelSubscriptionDetail(req, res);

            //Getting Total Net Sales Detail
            let getTotalNetSales = await current_obj.totalNetSalesDetail(req, res);

            //Getting Total Paid User Detail
            let getTotalPaidUser = await current_obj.totalPaidUserDetail(req, res);

            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token,
                registeredUser: getRegisteredUser,
                activeSubscription: getActiveSubscription,
                cancelSubscription: getCancelSubscription,
                totalNetSales: getTotalNetSales,
                totalPaidUser: getTotalPaidUser,
            }).send(res);

        }
        catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }

    }

    // Get total Registered user from database
    public async registeredUserDetail(req: Request, res: Response) {
        try {
            const totalUser = await dbReader.users.findAll({
                attributes: [
                    [dbReader.Sequelize.literal('COUNT(user_id)'), 'total_user'],
                ],
                where: { is_deleted: 0, user_role: 3 }
            });
            let usersValues;
            totalUser.filter((obj: any) => { usersValues = obj.dataValues.total_user; });
            return usersValues;
        } catch (e: any) {
            return 0;
        }
    }

    public async activeSubscriptionDetail(req: Request, res: Response) {
        try {
            const activeSubscription = await dbReader.userSubscription.findAll({
                attributes: [
                    [dbReader.Sequelize.literal('COUNT(subscription_status)'), 'total_active_subscription'],
                ],
                where: {
                    subscription_status: 2
                }
            });
            let activeSubscriptionValues;
            activeSubscription.filter((obj: any) => { activeSubscriptionValues = obj.dataValues.total_active_subscription; });
            return activeSubscriptionValues;
        } catch (e: any) {
            return 0;
        }
    }

    public async cancelSubscriptionDetail(req: Request, res: Response) {
        try {
            const cancelSubscription = await dbReader.userSubscription.findAll({
                attributes: [
                    [dbReader.Sequelize.literal('COUNT(subscription_status)'), 'total_cancel_subscription'],
                ],
                where: {
                    subscription_status: 5
                }
            });
            let cancelSubscriptionValues;
            cancelSubscription.filter((obj: any) => { cancelSubscriptionValues = obj.dataValues.total_cancel_subscription; });
            return cancelSubscriptionValues;
        } catch (e: any) {
            return 0;
        }
    }

    public async totalNetSalesDetail(req: Request, res: Response) {
        try {
            const totalNetSales = await dbReader.userOrder.findAll({
                attributes: [
                    [dbReader.Sequelize.fn('sum', dbReader.Sequelize.col('total_amount')), 'total_net_sales'],
                ]
            });
            let totalNetSalesValues;
            totalNetSales.filter((obj: any) => { totalNetSalesValues = obj.dataValues.total_net_sales; });
            return totalNetSalesValues;
        } catch (e: any) {
            return 0;
        }
    }

    public async totalPaidUserDetail(req: Request, res: Response) {
        try {
            let totalPaidUser = await dbReader.userSubscription.findAll({
                attributes: [
                    [dbReader.Sequelize.literal('COUNT(user_id)'), 'total_paid_user'],
                ],
                where: {
                    subscription_status: { [Op.in]: [2, 4] }
                },
                group: ['user_id']
            });
            let totalPaidUserValues;
            totalPaidUser = JSON.parse(JSON.stringify(totalPaidUser));
            totalPaidUserValues = totalPaidUser.length
            return totalPaidUserValues;
        } catch (e: any) {
            return 0;
        }
    }

    public async getNewRegisterUsersChartData(req: Request, res: Response) {
        try {
            let date = new Date();
            let startOfMonth, endOfMonth;
            if (req.body.month) {
                startOfMonth = moment(new Date(date.getFullYear() + "-" + req.body.month + "-01")).format('YYYY-MM-DD');
                endOfMonth = moment(new Date(date.getFullYear(), req.body.month, 0)).format('YYYY-MM-DD');
            } else {
                startOfMonth = moment(new Date(date.getFullYear() + "-" + (date.getMonth() + 1) + "-01")).format('YYYY-MM-DD');
                endOfMonth = moment(new Date(date.getFullYear(), (date.getMonth() + 1), 0)).format('YYYY-MM-DD');
            }
            let dates = [startOfMonth, endOfMonth];

            const totalUser = await dbReader.users.findAll({
                attributes: [
                    [dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('created_datetime'), '%Y-%m-%d'), 'created_date'],
                    [dbReader.Sequelize.literal('COUNT(user_id)'), 'total_user'],
                ],
                where: { "created_datetime": { [Op.between]: dates, } },
                group: ['created_date']
            });

            let filteredValuesOfDates: any = [];
            let dateRange = getDateRange(startOfMonth, endOfMonth, "YYYY-MM-DD")
            let arrayOfDates = dateRange.map(function (item) { return { 'created_date': item, 'total_user': null } });
            totalUser.filter((obj: any) => { filteredValuesOfDates.push(obj.dataValues) });
            let finalResult = _.unionBy(filteredValuesOfDates, arrayOfDates, 'created_date');
            finalResult.sort(function (a: any, b: any) {
                let dateA: any, dateB: any;
                dateA = new Date(a.created_date);
                dateB = new Date(b.created_date);
                return dateA - dateB;
            });
            finalResult.filter((obj: any) => {
                if (moment(new Date()).diff(obj.created_date, 'days') > 0 && obj.total_user == null) {
                    obj.total_user = 0;
                }
            });
            let monthData: any = [];
            finalResult.map((data: any) => {
                monthData.push(data.total_user)
            });
            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token,
                monthData: monthData,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getCancelSubscriptionChartData(req: Request, res: Response) {
        try {
            let date = new Date();
            let startOfMonth, endOfMonth;
            if (req.body.month) {
                startOfMonth = moment(new Date(date.getFullYear() + "-" + req.body.month + "-01")).format('YYYY-MM-DD');
                endOfMonth = moment(new Date(date.getFullYear(), req.body.month, 0)).format('YYYY-MM-DD');
            } else {
                startOfMonth = moment(new Date(date.getFullYear() + "-" + (date.getMonth() + 1) + "-01")).format('YYYY-MM-DD');
                endOfMonth = moment(new Date(date.getFullYear(), (date.getMonth() + 1), 0)).format('YYYY-MM-DD');
            }
            let dates = [startOfMonth, endOfMonth];
            const cancelSubscription = await dbReader.userSubscription.findAll({
                attributes: [
                    [dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('created_datetime'), '%Y-%m-%d'), 'created_date'],
                    [dbReader.Sequelize.literal('COUNT(user_id)'), 'total_cancel_subscription'],
                ],
                where: { created_datetime: { [Op.between]: dates, }, subscription_status: 5 },
                group: ['created_date']
            });
            let filteredValuesOfDates: any = [];
            let dateRange = getDateRange(startOfMonth, endOfMonth, "YYYY-MM-DD")
            let arrayOfDates = dateRange.map(function (item) { return { 'created_date': item, 'total_cancel_subscription': null } });
            cancelSubscription.filter((obj: any) => { filteredValuesOfDates.push(obj.dataValues) });
            let finalResult = _.unionBy(filteredValuesOfDates, arrayOfDates, 'created_date');
            finalResult.sort(function (a: any, b: any) {
                let dateA: any, dateB: any;
                dateA = new Date(a.created_date);
                dateB = new Date(b.created_date);
                return dateA - dateB;
            });
            finalResult.filter((obj: any) => {
                if (moment(new Date()).diff(obj.created_date, 'days') > 0 && obj.total_cancel_subscription == null) {
                    obj.total_cancel_subscription = 0;
                }
            });
            let monthData: any = [];
            finalResult.map((data: any) => {
                monthData.push(data.total_cancel_subscription)
            })
            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token,
                monthData: monthData,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getTopVisitorsChartData(req: Request, res: Response) {
        try {
            let today = { count: 0 };
            let month = {
                count: 0,
                percentage: "0.2",
                ratio: "u"
            };
            let city = [
                { city_name: "California", percentage: "78" },
                { city_name: "Nevada", percentage: "69" },
                { city_name: "Texas", percentage: "61" }
            ]
            new SuccessResponse(EC.success,
                {
                    //@ts-ignore
                    token: req.token,
                    today: today,
                    month: month,
                    city: city,
                }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getNewSubscriptionChartData(req: Request, res: Response) {
        try {
            let date = new Date();
            let startOfMonth, endOfMonth;
            if (req.body.month) {
                startOfMonth = moment(new Date(date.getFullYear() + "-" + req.body.month + "-01")).format('YYYY-MM-DD');
                endOfMonth = moment(new Date(date.getFullYear(), req.body.month, 0)).format('YYYY-MM-DD');
            } else {
                startOfMonth = moment(new Date(date.getFullYear() + "-" + (date.getMonth() + 1) + "-01")).format('YYYY-MM-DD');
                endOfMonth = moment(new Date(date.getFullYear(), (date.getMonth() + 1), 0)).format('YYYY-MM-DD');
            }
            let dates = [startOfMonth, endOfMonth];
            const renewedSubscriptions = await dbReader.userOrder.findAll({
                attributes: [
                    [dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('created_datetime'), '%Y-%m-%d'), 'created_date'],
                    [dbReader.Sequelize.literal('COUNT(user_orders_id)'), 'total_new_subscription'],
                ],
                where: {
                    created_datetime: { [Op.between]: dates },
                    [Op.or]: [{ parent_user_order_id: { [Op.eq]: null } }, { parent_user_order_id: { [Op.eq]: 0 } }]
                },
                order: [
                    ['user_subscription_id', 'DESC'],
                ],
                group: ['created_date']
            });
            let filteredValuesOfDates: any = [];
            let dateRange = getDateRange(startOfMonth, endOfMonth, "YYYY-MM-DD")
            let arrayOfDates = dateRange.map(function (item) { return { 'created_date': item, 'total_new_subscription': null } });
            renewedSubscriptions.filter((obj: any) => { filteredValuesOfDates.push(obj.dataValues) });
            let finalResult = _.unionBy(filteredValuesOfDates, arrayOfDates, 'created_date');
            finalResult.sort(function (a: any, b: any) {
                let dateA: any, dateB: any;
                dateA = new Date(a.created_date);
                dateB = new Date(b.created_date);
                return dateA - dateB;
            });
            finalResult.filter((obj: any) => {
                if (moment(new Date()).diff(obj.created_date, 'days') > 0 && obj.total_new_subscription == null) {
                    obj.total_new_subscription = 0;
                }
            });
            let monthData: any = [];
            finalResult.map((data: any) => {
                monthData.push(data.total_new_subscription)
            });
            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token,
                monthData: monthData,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getRenewedSubscriptionsChartData(req: Request, res: Response) {
        try {
            let date = new Date();
            let startOfMonth, endOfMonth;
            if (req.body.month) {
                startOfMonth = moment(new Date(date.getFullYear() + "-" + req.body.month + "-01")).format('YYYY-MM-DD');
                endOfMonth = moment(new Date(date.getFullYear(), req.body.month, 0)).format('YYYY-MM-DD');
            } else {
                startOfMonth = moment(new Date(date.getFullYear() + "-" + (date.getMonth() + 1) + "-01")).format('YYYY-MM-DD');
                endOfMonth = moment(new Date(date.getFullYear(), (date.getMonth() + 1), 0)).format('YYYY-MM-DD');
            }
            let dates = [startOfMonth, endOfMonth];
            const renewedSubscriptions = await dbReader.userOrder.findAll({
                attributes: [
                    [dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('created_datetime'), '%Y-%m-%d'), 'created_date'],
                    [dbReader.Sequelize.literal('COUNT(parent_user_order_id)'), 'total_renewed_subscription'],
                ],
                where: {
                    created_datetime: { [Op.between]: dates },
                    [Op.or]: [{ parent_user_order_id: { [Op.not]: null } }, { parent_user_order_id: { [Op.not]: 0 } }]
                },
                order: [
                    ['user_subscription_id', 'DESC'],
                ],
                group: ['created_date']
            });
            let filteredValuesOfDates: any = [];
            let dateRange = getDateRange(startOfMonth, endOfMonth, "YYYY-MM-DD")
            let arrayOfDates = dateRange.map(function (item) { return { 'created_date': item, 'total_renewed_subscription': null } });
            renewedSubscriptions.filter((obj: any) => { filteredValuesOfDates.push(obj.dataValues) });
            let finalResult = _.unionBy(filteredValuesOfDates, arrayOfDates, 'created_date');
            finalResult.sort(function (a: any, b: any) {
                let dateA: any, dateB: any;
                dateA = new Date(a.created_date);
                dateB = new Date(b.created_date);
                return dateA - dateB;
            });
            finalResult.filter((obj: any) => {
                if (moment(new Date()).diff(obj.created_date, 'days') > 0 && obj.total_renewed_subscription == null) {
                    obj.total_renewed_subscription = 0;
                }
            });
            let monthData: any = [];
            finalResult.map((data: any) => {
                monthData.push(data.total_renewed_subscription)
            });
            new SuccessResponse(EC.success,
                {
                    //@ts-ignore
                    token: req.token,
                    monthData: monthData
                }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getEarningsChartData(req: Request, res: Response) {
        try {
            let todayDate = new Date().setHours(0, 0, 0, 0);
            const NOW = new Date();
            // Get Current Day Data From Database
            const todayEarnings = await dbReader.userOrder.findAll({
                attributes: [
                    [dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('created_datetime'), '%Y-%m-%d'), 'created_date'],
                    [dbReader.Sequelize.fn('sum', dbReader.Sequelize.col('total_amount')), 'total_amount'],
                ],
                where: {
                    created_datetime: {
                        [Op.gt]: todayDate,
                        [Op.lt]: NOW
                    },
                }
            });
            let valuesOfToday = 0;
            todayEarnings.filter((obj: any) => { valuesOfToday = obj.dataValues.total_amount; });

            let startOfWeek = moment().startOf('isoWeek').format("YYYY-MM-DD");
            let endOfWeek = moment().endOf('isoWeek').format("YYYY-MM-DD");
            let currentWeekDates = [startOfWeek, endOfWeek];

            //Get Current Week Data From Database
            const currentWeekEarnings = await dbReader.userOrder.findAll({
                attributes: [
                    [dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('created_datetime'), '%Y-%m-%d'), 'created_date'],
                    [dbReader.Sequelize.fn('sum', dbReader.Sequelize.col('total_amount')), 'total_amount'],
                ],
                where: { created_datetime: { [Op.between]: currentWeekDates } },
                group: ['created_date']
            });

            let filteredValuesOfDates: any = [];
            let dateRange = getDateRange(startOfWeek, endOfWeek, "YYYY-MM-DD")
            let arrayOfDates = dateRange.map(function (item) { return { 'created_date': item, 'total_amount': null } });
            currentWeekEarnings.filter((obj: any) => { filteredValuesOfDates.push(obj.dataValues) });

            // Array merge With Date value And Set Null For Future Dates,

            arrayOfDates.filter((obj: any) => {
                filteredValuesOfDates.filter((value: any) => {
                    if (obj.created_date == value.created_date) {
                        obj.total_amount = value.total_amount;
                    } else {
                        if (moment(new Date()).diff(obj.created_date, 'days') > 0 || obj.created_date == moment().format("YYYY-MM-DD")) {
                            obj.total_amount = 0;
                        }
                    }
                });
            });
            let currentWeekData: any = [];
            let sumOfTotalAmount = 0;
            arrayOfDates.reverse();
            arrayOfDates.map((data: any) => {
                sumOfTotalAmount = sumOfTotalAmount + data.total_amount;
                if (data.total_amount != null && data.total_amount != 0) {
                    let total_amount = data.total_amount;
                    currentWeekData.push(total_amount.toFixed(2));
                } else {
                    currentWeekData.push(data.total_amount);
                }
            });

            let startOfPreviousWeek = moment(startOfWeek).subtract(7, 'day').format('YYYY-MM-DD');
            let endOfPreviousWeek = moment(endOfWeek).subtract(7, 'day').format('YYYY-MM-DD');
            let previousWeekDates = [startOfPreviousWeek, endOfPreviousWeek];

            //Get Previous Week Data From Database
            const previousWeekEarnings = await dbReader.userOrder.findAll({
                attributes: [
                    [dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('created_datetime'), '%Y-%m-%d'), 'created_date'],
                    [dbReader.Sequelize.fn('sum', dbReader.Sequelize.col('total_amount')), 'total_amount'],
                ],
                where: { created_datetime: { [Op.between]: previousWeekDates } },
                group: ['created_date']
            });

            let filteredValuesOfPreviousWeekDates: any = [];
            let previousWeekDateRange = getDateRange(startOfWeek, endOfWeek, "YYYY-MM-DD")
            let arrayOfPreviousWeekDates = previousWeekDateRange.map(function (item) { return { 'created_date': item, 'total_amount': null } });
            previousWeekEarnings.filter((obj: any) => { filteredValuesOfPreviousWeekDates.push(obj.dataValues) });

            // Array merge With Date value And Set Null For Future Dates
            arrayOfPreviousWeekDates.filter((obj: any) => {
                filteredValuesOfPreviousWeekDates.filter((value: any) => {
                    if (obj.created_date == value.created_date) {
                        obj.total_amount = value.total_amount;
                    } else {
                        if (moment(new Date()).diff(obj.created_date, 'days') > 0 || obj.created_date == moment().format("YYYY-MM-DD")) {
                            obj.total_amount = 0;
                        }
                    }
                });
            });
            let previousWeekData: any = [];
            let sumOfPreviousWeekTotalAmount: any;
            arrayOfPreviousWeekDates.reverse();
            arrayOfPreviousWeekDates.map((data: any) => {
                sumOfPreviousWeekTotalAmount = sumOfPreviousWeekTotalAmount + data.total_amount;
                if (data.total_amount != null && data.total_amount != 0) {
                    let total_amount = data.total_amount;
                    previousWeekData.push(total_amount.toFixed(2));
                } else {
                    previousWeekData.push(data.total_amount);
                }
            });

            let date = new Date();
            let startOfPreviousMonth = moment(new Date(date.getFullYear() + "-" + (date.getMonth() - 1) + "-01")).format('YYYY-MM-DD');
            let endOfPreviousMonth = moment(new Date(date.getFullYear(), (date.getMonth() - 1), 0)).format('YYYY-MM-DD');
            let previousMonthDates = [startOfPreviousMonth, endOfPreviousMonth];
            //Get Previous Month data From Database 
            const previousMonthEarnings = await dbReader.userOrder.findAll({
                attributes: [
                    [dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('created_datetime'), '%Y-%m-%d'), 'created_date'],
                    [dbReader.Sequelize.fn('sum', dbReader.Sequelize.col('total_amount')), 'total_amount'],
                ],
                where: { created_datetime: { [Op.between]: previousMonthDates } },
            });

            let filtervaluesOfPreviousMonth: any = [];
            let previousMonthDateRange = getDateRange(startOfPreviousMonth, endOfPreviousMonth, "YYYY-MM-DD")
            let arrayOfPreviousMonthDates = previousMonthDateRange.map(function (item) { return { 'created_date': item, 'total_amount': null } });
            previousMonthEarnings.filter((obj: any) => { filtervaluesOfPreviousMonth.push(obj.dataValues) });
            let finalResultPreviousMonth = _.unionBy(filtervaluesOfPreviousMonth, arrayOfPreviousMonthDates, 'created_date');
            finalResultPreviousMonth.sort(function (a: any, b: any) {
                let dateA: any, dateB: any;
                dateA = new Date(a.created_date);
                dateB = new Date(b.created_date);
                return dateA - dateB;
            });
            finalResultPreviousMonth.filter((obj: any) => {
                if (moment(new Date()).diff(obj.created_date, 'days') > 0 && obj.total_amount == null) {
                    obj.total_amount = 0;
                }
            });
            let previousMonthData: any = [];
            let valuesOfPreviousMonth = 0;
            finalResultPreviousMonth.map((data: any) => {
                valuesOfPreviousMonth = valuesOfPreviousMonth + data.total_amount;
                if (data.total_amount != null && data.total_amount != 0) {
                    let total_amount = data.total_amount;
                    previousMonthData.push(total_amount.toFixed(2));
                } else {
                    previousMonthData.push(data.total_amount);
                }
            });

            let startOfMonth = moment(new Date(date.getFullYear() + "-" + (date.getMonth() + 1) + "-01")).format('YYYY-MM-DD');
            let endOfMonth = moment(new Date(date.getFullYear(), (date.getMonth() + 1), 0)).format('YYYY-MM-DD');
            let currentMonthDates = [startOfMonth, endOfMonth];

            //Get Current Month Data From Database       
            const currentMonthEarnings = await dbReader.userOrder.findAll({
                attributes: [
                    [dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('created_datetime'), '%Y-%m-%d'), 'created_date'],
                    [dbReader.Sequelize.fn('sum', dbReader.Sequelize.col('total_amount')), 'total_amount'],
                ],
                where: { created_datetime: { [Op.between]: currentMonthDates, } },
                group: ['created_date']
            });

            let filteredValuesOfMonth: any = [];
            let monthDateRange = getDateRange(startOfMonth, endOfMonth, "YYYY-MM-DD")
            let arrayOfMonthDates = monthDateRange.map(function (item) { return { 'created_date': item, 'total_amount': null } });
            currentMonthEarnings.filter((obj: any) => { filteredValuesOfMonth.push(obj.dataValues) });
            let finalResult = _.unionBy(filteredValuesOfMonth, arrayOfMonthDates, 'created_date');
            finalResult.sort(function (a: any, b: any) {
                let dateA: any, dateB: any;
                dateA = new Date(a.created_date);
                dateB = new Date(b.created_date);
                return dateA - dateB;
            });
            finalResult.filter((obj: any) => {
                if (moment(new Date()).diff(obj.created_date, 'days') > 0 && obj.total_amount == null) {
                    obj.total_amount = 0;
                }
            });
            let currentMonthData: any = [];
            let valueOfCurrentMonth = 0;
            finalResult.map((data: any) => {
                valueOfCurrentMonth = valueOfCurrentMonth + data.total_amount;
                if (data.total_amount != null && data.total_amount != 0) {
                    let total_amount = data.total_amount;
                    currentMonthData.push(total_amount.toFixed(2));
                } else {
                    currentMonthData.push(data.total_amount);
                }
            });
            let diff = valuesOfPreviousMonth - valueOfCurrentMonth;
            let percentage = (Math.abs(diff) * 100) / (valuesOfPreviousMonth > valueOfCurrentMonth ? valuesOfPreviousMonth : valueOfCurrentMonth);

            let monthDetail = {
                count: valueOfCurrentMonth.toFixed(2),
                percentage: percentage.toFixed(2),
                ratio: valuesOfPreviousMonth > valueOfCurrentMonth ? "d" : "u"
            };

            let currentYear = moment().year();

            //Get Current Year Data From Database  
            const currentYearEarnings = await dbReader.userOrder.findAll({
                attributes: [
                    [dbReader.Sequelize.fn('month', dbReader.Sequelize.col('created_datetime')), 'created_month'],
                    [dbReader.Sequelize.fn('sum', dbReader.Sequelize.col('total_amount')), 'total_amount'],
                ],
                where: dbReader.Sequelize.where(dbReader.Sequelize.fn('YEAR', dbReader.Sequelize.col('created_datetime')), currentYear),
                group: ['created_month']
            });

            let filteredValuesOfCurrentYear: any = [];
            let monthRange = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
            let arrayOfCurrentYear = monthRange.map(function (item) { return { 'created_month': item, 'total_amount': null } });
            currentYearEarnings.filter((obj: any) => { filteredValuesOfCurrentYear.push(obj.dataValues) });
            let finalResultOfCurrentYear = _.unionBy(filteredValuesOfCurrentYear, arrayOfCurrentYear, 'created_month');

            finalResultOfCurrentYear.sort(function (a: any, b: any) {
                return a.created_month - b.created_month;
            });
            finalResultOfCurrentYear.filter((obj: any) => {
                if (moment(new Date()).diff(obj.created_month, 'month') > 0 && obj.total_amount == null) {
                    obj.total_amount = 0;
                }
            });
            let currentYearData: any = [];
            let valueOfCurrentYear = 0;
            finalResultOfCurrentYear.map((data: any) => {
                valueOfCurrentYear = valueOfCurrentYear + data.total_amount;
                if (data.total_amount != null && data.total_amount != 0) {
                    let total_amount = data.total_amount;
                    currentYearData.push(total_amount.toFixed(2));
                } else {
                    currentYearData.push(data.total_amount);
                }
            });

            let previousYear = moment().subtract(1, 'year').format('YYYY');
            //Get Previous Year Data From Database  
            const previousYearEarnings = await dbReader.userOrder.findAll({
                attributes: [
                    [dbReader.Sequelize.fn('month', dbReader.Sequelize.col('created_datetime')), 'created_month'],
                    [dbReader.Sequelize.fn('sum', dbReader.Sequelize.col('total_amount')), 'total_amount'],
                ],
                where: dbReader.Sequelize.where(dbReader.Sequelize.fn('YEAR', dbReader.Sequelize.col('created_datetime')), previousYear),
                group: ['created_month']
            });

            let filteredValuesOfPreviousYear: any = [];
            let arrayOfPreviousYear = monthRange.map(function (item) { return { 'created_month': item, 'total_amount': null } });
            previousYearEarnings.filter((obj: any) => { filteredValuesOfPreviousYear.push(obj.dataValues) });
            let finalResultOfPreviousYear = _.unionBy(filteredValuesOfPreviousYear, arrayOfPreviousYear, 'created_month');
            finalResultOfPreviousYear.sort(function (a: any, b: any) {
                return a.created_month - b.created_month;
            });
            finalResultOfPreviousYear.filter((obj: any) => {
                if (moment(new Date()).diff(obj.created_month, 'month') > 0 && obj.total_amount == null) {
                    obj.total_amount = 0;
                }
            });
            let previousYearData: any = [];
            let valueOfPreviousYear = 0;
            finalResultOfPreviousYear.map((data: any) => {
                valueOfPreviousYear = valueOfPreviousYear + data.total_amount;
                if (data.total_amount != null && data.total_amount != 0) {
                    let total_amount = data.total_amount;
                    previousYearData.push(total_amount.toFixed(2));
                } else {
                    previousYearData.push(data.total_amount);
                }
            });

            let valueDiffOfYear = valueOfPreviousYear - valueOfCurrentYear;
            let percentageForYear = (Math.abs(valueDiffOfYear) * 100) / (valueOfPreviousYear > valueOfCurrentYear ? valueOfPreviousYear : valueOfCurrentYear);

            let yearDetail = {
                count: valueOfCurrentYear.toFixed(2),
                percentage: percentageForYear.toFixed(2),
                ratio: valueOfPreviousYear > valueOfCurrentYear ? "d" : "u"
            };

            new SuccessResponse(EC.success,
                {
                    //@ts-ignore
                    token: req.token,
                    todayData: valuesOfToday,
                    weekData: { previousWeekData, currentWeekData },
                    monthData: { monthDetail, previousMonthData, currentMonthData },
                    yearData: { yearDetail, previousYearData, currentYearData }
                }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getOrderByProductData(req: Request, res: Response) {
        try {
            let currentYear = moment().year();
            const orderByProduct = await dbReader.userOrderItems.findAll({
                attributes: ['product_id', 'product_name', [dbReader.Sequelize.fn('COUNT', dbReader.Sequelize.col('product_id')), 'total_product']],
                group: 'product_id',
                where: dbReader.Sequelize.and({ item_type: 1 }, dbReader.Sequelize.where(dbReader.Sequelize.fn('YEAR', dbReader.Sequelize.col('created_datetime')), currentYear)),

                order: [
                    [dbReader.Sequelize.literal('total_product'), 'DESC'],
                ],
                limit: 3
            });
            new SuccessResponse(EC.success,
                {
                    //@ts-ignore
                    token: req.token,
                    orderByProduct: orderByProduct
                }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getSalesAnalyticsData(req: Request, res: Response) {
        try {

            let date = new Date();
            //Get Current Month Data From Database
            let startOfMonth, endOfMonth;
            if (req.body.month) {
                startOfMonth = moment(new Date(date.getFullYear() + "-" + req.body.month + "-01")).format('YYYY-MM-DD');
                endOfMonth = moment(new Date(date.getFullYear(), req.body.month, 0)).format('YYYY-MM-DD');
            } else {
                startOfMonth = moment(new Date(date.getFullYear() + "-" + (date.getMonth() + 1) + "-01")).format('YYYY-MM-DD');
                endOfMonth = moment(new Date(date.getFullYear(), (date.getMonth() + 1), 0)).format('YYYY-MM-DD');
            }

            let currentMonthDates = [startOfMonth, endOfMonth];
            const currentMonthTopSellingProduct = await dbReader.userOrderItems.findAll({
                include: [{
                    model: dbReader.products,
                    attributes: ['product_description', 'site_id'],
                }],
                attributes: ['product_id', 'product_name',
                    [dbReader.sequelize.literal('SUM(user_order_items.product_amount - user_order_items.coupon_amount + user_order_items.shipping_fees + user_order_items.processing_fees)'), 'total_net_sales'],
                    [dbReader.Sequelize.fn('COUNT', dbReader.Sequelize.col('user_order_items.product_id')), 'total_product']],
                group: 'product_id',
                where: { created_datetime: { [Op.between]: currentMonthDates }, item_type: 1 },
                order: [
                    [dbReader.Sequelize.literal('total_net_sales'), 'DESC'],
                ],
                // limit: 3
            });
            let filteredValuesOfCurrentMonth: any = [];
            currentMonthTopSellingProduct.filter((obj: any) => { filteredValuesOfCurrentMonth.push(obj.dataValues) });
            let totalGrossSale = 0;
            filteredValuesOfCurrentMonth.map((data: any) => {
                totalGrossSale += data.total_net_sales;
            });
            filteredValuesOfCurrentMonth.map((data: any) => {
                data.gross_sale = totalGrossSale;
                data.percentage = ((data.total_net_sales / totalGrossSale) * 100).toFixed(2);
            });

            let salesAnalytics = [
                { percentage: 46.7, title: "product1", amount: 2132 },
                { percentage: 31.7, title: "product2", amount: 1763 },
                { percentage: 21.7, title: "product3", amount: 973 },
            ];
            new SuccessResponse(EC.success,
                {
                    //@ts-ignore
                    token: req.token,

                    salesAnalytics: filteredValuesOfCurrentMonth
                }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getSalesAnalyticsDataV2(req: Request, res: Response) {
        try {

            let date = new Date();
            let { site_id } = req.body;
            //Get Current Month Data From Database
            let startOfMonth, endOfMonth;
            if (req.body.month) {
                startOfMonth = moment(new Date(date.getFullYear() + "-" + req.body.month + "-01")).format('YYYY-MM-DD');
                endOfMonth = moment(new Date(date.getFullYear(), req.body.month, 0)).format('YYYY-MM-DD');
            } else {
                startOfMonth = moment(new Date(date.getFullYear() + "-" + (date.getMonth() + 1) + "-01")).format('YYYY-MM-DD');
                endOfMonth = moment(new Date(date.getFullYear(), (date.getMonth() + 1), 0)).format('YYYY-MM-DD');
            }

            let currentMonthDates = [startOfMonth, endOfMonth];
            const currentMonthTopSellingProduct = await dbReader.userOrderItems.findAll({
                include: [{
                    model: dbReader.products,
                    attributes: ['product_description', 'site_id'],
                    where: { site_id: site_id, is_deleted: 0 }
                }],
                attributes: ['product_id', 'product_name',
                    [dbReader.sequelize.literal('SUM(user_order_items.product_amount - user_order_items.coupon_amount + user_order_items.shipping_fees + user_order_items.processing_fees)'), 'total_net_sales'],
                    [dbReader.Sequelize.fn('COUNT', dbReader.Sequelize.col('user_order_items.product_id')), 'total_product']],
                group: 'product_id',
                where: { created_datetime: { [Op.between]: currentMonthDates }, item_type: 1 },
                order: [
                    [dbReader.Sequelize.literal('total_net_sales'), 'DESC'],
                ],
                // limit: 3
            });
            let filteredValuesOfCurrentMonth: any = [];
            currentMonthTopSellingProduct.filter((obj: any) => { filteredValuesOfCurrentMonth.push(obj.dataValues) });
            let totalGrossSale = 0;
            filteredValuesOfCurrentMonth.map((data: any) => {
                totalGrossSale += data.total_net_sales;
            });
            filteredValuesOfCurrentMonth.map((data: any) => {
                data.gross_sale = totalGrossSale;
                data.percentage = ((data.total_net_sales / totalGrossSale) * 100).toFixed(2);
            });

            let salesAnalytics = [
                { percentage: 46.7, title: "product1", amount: 2132 },
                { percentage: 31.7, title: "product2", amount: 1763 },
                { percentage: 21.7, title: "product3", amount: 973 },
            ];
            new SuccessResponse(EC.success,
                {
                    //@ts-ignore
                    token: req.token,

                    salesAnalytics: filteredValuesOfCurrentMonth
                }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getTopSellingProductData(req: Request, res: Response) {
        try {
            let date = new Date();
            //Get Current Month Data From Database
            let startOfMonth, endOfMonth;
            if (req.body.month) {
                startOfMonth = moment(new Date(date.getFullYear() + "-" + req.body.month + "-01")).format('YYYY-MM-DD');
                endOfMonth = moment(new Date(date.getFullYear(), req.body.month, 0)).format('YYYY-MM-DD');
            } else {
                startOfMonth = moment(new Date(date.getFullYear() + "-" + (date.getMonth() + 1) + "-01")).format('YYYY-MM-DD');
                endOfMonth = moment(new Date(date.getFullYear(), (date.getMonth() + 1), 0)).format('YYYY-MM-DD');
            }
            let currentMonthDates = [startOfMonth, endOfMonth];
            const currentMonthTopSellingProduct = await dbReader.userOrderItems.findAll({
                include: [{
                    model: dbReader.products,
                    attributes: ['product_description'],
                }],
                attributes: ['product_id', 'product_name',
                    [dbReader.sequelize.literal('SUM(user_order_items.product_amount - user_order_items.coupon_amount + user_order_items.shipping_fees + user_order_items.processing_fees)'), 'total_net_sales']],
                group: 'product_id',
                where: { created_datetime: { [Op.between]: currentMonthDates }, item_type: 1 },
                order: [
                    [dbReader.Sequelize.literal('total_net_sales'), 'DESC'],
                ],
                limit: 3
            });
            let filteredValuesOfCurrentMonth: any = [];
            currentMonthTopSellingProduct.filter((obj: any) => { filteredValuesOfCurrentMonth.push(obj.dataValues) });
            let valueOfCurrentMonth = 0;
            filteredValuesOfCurrentMonth.map((data: any) => {
                valueOfCurrentMonth = valueOfCurrentMonth + data.total_net_sales;
            });

            //Get Previous Month Data From Database
            let startOfPreviousMonth, endOfPreviousMonth;
            if (req.body.month) {
                startOfPreviousMonth = moment(startOfMonth).subtract(1, 'months').format('YYYY-MM-DD');
                endOfPreviousMonth = moment(endOfMonth).subtract(1, 'months').format('YYYY-MM-DD');
            } else {
                startOfPreviousMonth = moment(new Date(date.getFullYear() + "-" + (date.getMonth()) + "-01")).format('YYYY-MM-DD');
                endOfPreviousMonth = moment(new Date(date.getFullYear(), (date.getMonth()), 0)).format('YYYY-MM-DD');
            }

            let previousMonthDates = [startOfPreviousMonth, endOfPreviousMonth];
            const previousMonthTopSellingProduct = await dbReader.userOrderItems.findAll({
                include: [{
                    model: dbReader.products,
                    attributes: ['product_description'],
                }],
                attributes: ['product_id', 'product_name',
                    [dbReader.sequelize.literal('SUM(user_order_items.product_amount - user_order_items.coupon_amount + user_order_items.shipping_fees + user_order_items.processing_fees)'), 'total_net_sales']],
                group: 'product_id',
                where: { created_datetime: { [Op.between]: previousMonthDates }, item_type: 1 },
                order: [
                    [dbReader.Sequelize.literal('total_net_sales'), 'DESC'],
                ],
                limit: 3
            });
            let filteredValuesOfPreviousMonth: any = [];
            previousMonthTopSellingProduct.filter((obj: any) => { filteredValuesOfPreviousMonth.push(obj.dataValues) });
            let valueOfPreviousMonth = 0;
            filteredValuesOfPreviousMonth.map((data: any) => {
                valueOfPreviousMonth = valueOfPreviousMonth + data.total_net_sales;
            });
            interface topSellingProduct {
                percentage: number;
                product_id: number;
                product_name: string;
                total_net_sales: number;
                product_description: string;
            }
            let topSellingProduct: any = [];

            // Calculate Percentage of total_net_sales base on current and previous year
            filteredValuesOfCurrentMonth.map((obj: any) => {
                filteredValuesOfPreviousMonth.map((val: any) => {
                    if (val.product_id == obj.product_id) {
                        let valueDiffTotal_net_sales = val.total_net_sales - obj.total_net_sales;
                        let percentage = (Math.abs(valueDiffTotal_net_sales) * 100) / (val.total_net_sales > obj.total_net_sales ? val.total_net_sales : obj.total_net_sales);
                        if (!topSellingProduct.some((e: topSellingProduct) => e.product_id == obj.product_id)) {
                            topSellingProduct.push({
                                percentage: percentage,
                                product_id: obj.product_id,
                                product_name: obj.product_name,
                                total_net_sales: obj.total_net_sales,
                                product_description: obj.sycu_product.product_description
                            });
                        }
                    } else {
                        if (!topSellingProduct.some((e: topSellingProduct) => e.product_id == obj.product_id)) {
                            topSellingProduct.push({
                                percentage: 0,
                                product_id: obj.product_id,
                                product_name: obj.product_name,
                                total_net_sales: obj.total_net_sales,
                                product_description: obj.sycu_product.product_description
                            });
                        }
                    }
                });
            });
            let valueDiffOfMonth = valueOfPreviousMonth - valueOfCurrentMonth;
            let percentageForMonth = (Math.abs(valueDiffOfMonth) * 100) / (valueOfPreviousMonth > valueOfCurrentMonth ? valueOfPreviousMonth : valueOfCurrentMonth);

            let monthDetail = {
                count: valueOfCurrentMonth.toFixed(2),
                percentage: percentageForMonth.toFixed(2),
                ratio: valueOfPreviousMonth > valueOfCurrentMonth ? "d" : "u"
            };
            new SuccessResponse(EC.success,
                {
                    //@ts-ignore
                    token: req.token,
                    topSellingProduct: { monthDetail, topSellingProduct },
                }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async listsignupMetricReport(req: Request, res: Response) {
        try {
            let { page_no, page_record, siteConfigId, range, converted, purchased_converted } = req.body;
            let rowLimit = page_record ? parseInt(page_record) : 25;
            let rowOffset = page_no ? page_no * page_record - page_record : 0;
            let site_config_con = dbReader.Sequelize.Op.ne, site_config_data = null, convertedCondition = dbReader.Sequelize.Op.ne,
                purchasedConvertedCondition: any = {}, convertedData = null;
            if (siteConfigId) {
                site_config_con = dbReader.Sequelize.Op.eq
                site_config_data = siteConfigId
            }
            if (converted == 0 || converted == 1) {
                convertedCondition = dbReader.Sequelize.Op.eq
                convertedData = converted
            }
            if (purchased_converted) {
                purchasedConvertedCondition = {
                    required: true,
                    model: dbReader.userSubscription,
                    attributes: ["user_subscription_id", "subscription_number", "subscription_status"]
                }
            } else {
                purchasedConvertedCondition = {
                    separate: true,
                    model: dbReader.userSubscription,
                    attributes: ["user_subscription_id", "subscription_number", "subscription_status"]
                }
            }

            let signupMetricReport = await dbReader.signupMetricReportModel.findAndCountAll({
                where: dbReader.Sequelize.and(
                    { site_config_id: { [site_config_con]: site_config_data } },
                    { is_registered: { [convertedCondition]: convertedData } },
                    dbReader.Sequelize.and(
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`signup_metric_report`.`created_at`'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.gte]: range.start_date }),
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`signup_metric_report`.`created_at`'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.lte]: range.end_date })
                    )
                ),
                include: [{
                    required: false,
                    model: dbReader.users,
                    attributes: ["user_id", "first_name", "last_name", "email"],
                    where: { is_deleted: 0 },
                    include: [purchasedConvertedCondition]
                }],
                order: [['id', 'DESC']],
                limit: rowLimit,
                offset: rowOffset,
            });
            signupMetricReport = JSON.parse(JSON.stringify(signupMetricReport));

            // Get All visted and registered data
            let totVistedUserdata = await dbReader.signupMetricReportModel.findAll({
                attributes: ["is_registered", [dbReader.Sequelize.literal('COUNT(id)'), 'countData']],
                where: dbReader.Sequelize.and(
                    { site_config_id: { [site_config_con]: site_config_data } },
                    { is_registered: { [convertedCondition]: convertedData } },
                    dbReader.Sequelize.and(
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`signup_metric_report`.`created_at`'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.gte]: range.start_date }),
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`signup_metric_report`.`created_at`'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.lte]: range.end_date })
                    )
                ),
                group: ['is_registered']
            });
            totVistedUserdata = JSON.parse(JSON.stringify(totVistedUserdata));

            if (signupMetricReport.rows.length > 0) {
                new SuccessResponse(EC.success, {
                    //@ts-ignore
                    token: req.token,
                    count: signupMetricReport.count,
                    totalVisits: signupMetricReport.count,
                    totalNonRegisters: (totVistedUserdata.length) ? totVistedUserdata[0].countData || 0 : 0,
                    totalRegisters: (totVistedUserdata.length > 1) ? totVistedUserdata[1].countData || 0 : 0,
                    signupMetricReport: signupMetricReport.rows,
                }).send(res);
            } else {
                new SuccessResponse(EC.success, {
                    //@ts-ignore
                    token: req.token,
                    signupMetricReport: []
                }).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    // public async listsignupMetricReport(req: Request, res: Response) {
    //     try {
    //         let { page_no, page_record, siteConfigId, range } = req.body, totalVisits = 0, totalRegisters = 0;

    //         let startDate = moment((range.start_date)).format("YYYY-MM-DD")
    //         let endDate = moment((range.end_date)).format("YYYY-MM-DD")

    //         let rowLimit = page_record ? parseInt(page_record) : 25;
    //         let rowOffset = page_no ? page_no * page_record - page_record : 0;

    //         let site_config_con = dbReader.Sequelize.Op.ne, site_config_data = null

    //         if (siteConfigId) {
    //             site_config_con = dbReader.Sequelize.Op.eq
    //             site_config_data = siteConfigId
    //         }

    //         let signupMetricReport = await dbReader.signupMetricReportModel.findAndCountAll({
    //             include: [
    //                 {
    //                     required: false,
    //                     model: dbReader.users,
    //                     attributes: ["user_id", "first_name", "last_name", "email"],
    //                     where: { is_deleted: 0 },
    //                 }],
    //             where:
    //                 dbReader.Sequelize.and(
    //                     { site_config_id: { [site_config_con]: site_config_data } },
    //                     dbReader.Sequelize.and(
    //                         dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`signup_metric_report`.`created_at`'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.gte]: startDate }),
    //                         dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`signup_metric_report`.`created_at`'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.lte]: endDate })
    //                     ),
    //                 ),
    //             order: [['id', 'DESC']],
    //             limit: rowLimit,
    //             offset: rowOffset,
    //         });
    //         signupMetricReport = JSON.parse(JSON.stringify(signupMetricReport));

    //         // Get All visted and registered data
    //         let totVistedUserdata = await dbReader.signupMetricReportModel.findAll({
    //             attributes: [
    //                 "is_registered", [dbReader.Sequelize.literal('COUNT(id)'), 'countData'],
    //             ],
    //             where:
    //                 dbReader.Sequelize.and(
    //                     { site_config_id: { [site_config_con]: site_config_data } },
    //                     dbReader.Sequelize.and(
    //                         dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`signup_metric_report`.`created_at`'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.gte]: startDate }),
    //                         dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`signup_metric_report`.`created_at`'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.lte]: endDate })
    //                     ),
    //                 ),
    //             group: ['is_registered']
    //         });
    //         totVistedUserdata = JSON.parse(JSON.stringify(totVistedUserdata));

    //         // console.log("==> totVistedUserdata data are: ", totVistedUserdata)

    //         if (signupMetricReport.rows.length > 0) {
    //             new SuccessResponse(EC.success, {
    //                 //@ts-ignore
    //                 token: req.token,
    //                 count: signupMetricReport.count,
    //                 totalVisits: signupMetricReport.count,
    //                 totalNonRegisters: (totVistedUserdata.length) ? totVistedUserdata[0].countData || 0 : 0,
    //                 totalRegisters: (totVistedUserdata.length > 1) ? totVistedUserdata[1].countData || 0 : 0,
    //                 signupMetricReport: signupMetricReport.rows,
    //             }).send(res);
    //         } else {
    //             new SuccessResponse(EC.success, {
    //                 //@ts-ignore
    //                 token: req.token,
    //                 signupMetricReport: []
    //             }).send(res);
    //         }
    //     } catch (e: any) {
    //         ApiError.handle(new BadRequestError(e.message), res);
    //     }
    // }

    public async listsignupGraphMetricReport(req: Request, res: Response) {
        try {
            let { range, by, siteConfigId } = req.body
            let startDate = moment((range.start_date)).format("YYYY-MM-DD")
            let endDate = moment((range.end_date)).format("YYYY-MM-DD")
            let attributes: any = [[dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`signup_metric_report`.`created_at`'), '%Y-%m-%d %H:%i'), 'created_at'], 'id'];
            let site_config_con = dbReader.Sequelize.Op.ne, site_config_data = null

            if (siteConfigId) {
                site_config_con = dbReader.Sequelize.Op.eq
                site_config_data = siteConfigId
            }
            switch (by) {
                case 'day':
                    attributes = [[dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`signup_metric_report`.`created_at`'), '%Y-%m-%d'), 'created_at'], 'id', 'is_registered']
                    break;
                case 'month':
                    attributes = [[dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`signup_metric_report`.`created_at`'), '%Y-%m-%d'), 'created_at'], 'id', 'is_registered']
                    break;
                case 'year':
                    attributes = [[dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`signup_metric_report`.`created_at`'), '%Y'), 'created_at'], 'id', 'is_registered']
                    break;
            }


            let currentYearData = await dbReader.signupMetricReportModel.findAll({
                attributes: attributes,
                where: dbReader.Sequelize.and(
                    { site_config_id: { [site_config_con]: site_config_data } },
                    dbReader.Sequelize.and(
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`signup_metric_report`.`created_at`'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.gte]: startDate }),
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`signup_metric_report`.`created_at`'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.lte]: endDate })
                    )
                )
            })
            if (currentYearData.length) {
                currentYearData = JSON.parse(JSON.stringify(currentYearData));
                let returnData: any = [];
                switch (by) {
                    case "day":
                        let a11 = moment(endDate).format("YYYY-MM-DD");
                        let b11 = moment(startDate).format("YYYY-MM-DD")
                        var daysOfYear1: any = [];
                        for (let d = moment(b11); d <= moment(a11); d.add(1, 'days')) {
                            daysOfYear1.push({
                                start_date: moment(d).format('YYYY-MM-DD')
                            })
                        }
                        for (let index = 0; index < daysOfYear1.length; index++) {
                            let startDate11 = daysOfYear1[index].start_date || ''
                            let DR1 = currentYearData.filter((s: any) => moment(s.created_at).format("YYYY-MM-DD") == startDate11 && s.created_at >= range.start_date && s.created_at <= range.end_date);
                            let d111 = 0, e111 = 0;
                            DR1.forEach((ed1: any) => {
                                d111 += 1;

                                if (ed1.is_registered == 1) {
                                    e111 += 1;
                                }
                            });
                            returnData.push({
                                date: daysOfYear1[index].start_date || '',
                                count: d111,
                                registered: e111
                            });
                        }

                        break;
                    case "month":
                        let a2 = moment(range.end_date).format("YYYY-MM");
                        let b2 = moment(range.start_date).format("YYYY-MM")
                        var daysOfYear1: any = [];
                        for (let d = moment(b2); d <= moment(a2); d.add(1, 'days')) {
                            let month = moment(d).format('MM');
                            if (daysOfYear1.some((s: any) => s.month == month)) {
                                let fi = daysOfYear1.findIndex((s: any) => s.month == month)
                                daysOfYear1[fi].end_date = moment(d).format('YYYY-MM')
                            } else {
                                daysOfYear1.push({
                                    month: month,
                                    start_date: moment(d).format('YYYY-MM'),
                                    end_date: moment(d).format('YYYY-MM')
                                })
                            }
                        }
                        daysOfYear1.reverse();
                        for (let index = 0; index < daysOfYear1.length; index++) {
                            let startDate1 = daysOfYear1[index] ? daysOfYear1[index].start_date : '';
                            let lastDate1 = daysOfYear1[index] ? daysOfYear1[index].end_date : '';

                            let d11 = currentYearData.filter((s: any) => s.created_at >= startDate1 && s.created_at <= lastDate1)
                            let d111 = 0, e111 = 0;
                            d11.forEach((ed1: any) => {
                                d111 += 1;
                                if (ed1.is_registered == 1) {
                                    e111 += 1;
                                }
                            });
                            returnData.push({
                                date: moment(startDate1).format('YYYY-MM'),
                                count: d111,
                                registered: e111
                            })
                        }
                        returnData.reverse();
                        break;
                    case "year":
                        let a22 = moment(range.end_date).format("YYYY");
                        let b22 = moment(range.start_date).format("YYYY")
                        var daysOfYear1: any = [];
                        for (let d = moment(b22); d <= moment(a22); d.add(1, 'days')) {
                            let year = moment(d).format('YYYY');
                            if (daysOfYear1.some((s: any) => s.year == year)) {
                                let fi = daysOfYear1.findIndex((s: any) => s.year == year)
                                daysOfYear1[fi].end_date = moment(d).format('YYYY')
                            } else {
                                daysOfYear1.push({
                                    year: year,
                                    start_date: moment(d).format('YYYY'),
                                    end_date: moment(d).format('YYYY')
                                })
                            }
                        }
                        daysOfYear1.reverse();
                        for (let index = 0; index < daysOfYear1.length; index++) {
                            let startDate1 = daysOfYear1[index] ? daysOfYear1[index].start_date : '';
                            let lastDate1 = daysOfYear1[index] ? daysOfYear1[index].end_date : '';

                            let d11 = currentYearData.filter((s: any) => s.created_at >= startDate1 && s.created_at <= lastDate1)
                            let d111 = 0, e111 = 0;
                            d11.forEach((ed1: any) => {
                                d111 += 1;
                                if (ed1.is_registered == 1) {
                                    e111 += 1;
                                }
                            });
                            returnData.push({
                                date: moment(startDate1).format('YYYY'),
                                count: d111,
                                registered: e111
                            })
                        }
                        returnData.reverse();
                        break;
                }
                new SuccessResponse("Success", {
                    graph: returnData
                }).send(res);
            } else {
                throw new Error("no data found")
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async signupCampaignReport(req: Request, res: Response) {
        try {
            let { range, search = "", page_no, page_record } = req.body;
            let rowLimit = page_record ? parseInt(page_record) : 25;
            let rowOffset = page_no ? ((page_no * page_record) - page_record) : 0;
            let startDate = moment((range.start_date)).format("YYYY-MM-DD");
            let endDate = moment((range.end_date)).format("YYYY-MM-DD");

            // Searching                           
            let SearchCondition = dbReader.Sequelize.Op.ne, SearchData = null;
            if (search) {
                SearchCondition = dbReader.Sequelize.Op.like;
                SearchData = "%" + search + "%";
            }

            let userData = await dbReader.users.findAndCountAll({
                attributes: ["user_id", "first_name", "last_name", "email", "created_datetime", "country_code", "mobile", "utm_campaign", "utm_source", "utm_medium", "utm_content", "utm_term"],
                where: dbReader.Sequelize.and({ is_deleted: 0 },
                    dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('created_datetime'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.gte]: startDate }),
                    dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('created_datetime'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.lte]: endDate }),
                    dbReader.Sequelize.or(
                        { first_name: { [SearchCondition]: SearchData } },
                        { last_name: { [SearchCondition]: SearchData } },
                        { email: { [SearchCondition]: SearchData } },
                        { utm_campaign: { [SearchCondition]: SearchData } },
                        { utm_source: { [SearchCondition]: SearchData } },
                        { utm_medium: { [SearchCondition]: SearchData } },
                        { utm_content: { [SearchCondition]: SearchData } },
                    ),
                    dbReader.Sequelize.or(
                        { utm_campaign: { [dbReader.Sequelize.Op.ne]: "" } },
                        { utm_source: { [dbReader.Sequelize.Op.ne]: "" } },
                        { utm_medium: { [dbReader.Sequelize.Op.ne]: "" } },
                        { utm_content: { [dbReader.Sequelize.Op.ne]: "" } }
                    ),
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

    public async dashbordwidgetList(req: Request, res: Response) {
        try {
            let data = await dbReader.dashbordWidget.findAll();
            data = JSON.parse(JSON.stringify(data))
            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token,
                data
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async dashbordwidgetDelete(req: Request, res: Response) {
        try {
            let { dashbord_widget_id } = req.params, newStatus;

            let data = await dbReader.dashbordWidget.findOne({
                where: { dashbord_widget_id: dashbord_widget_id }
            });
            if (data) {
                data = JSON.parse(JSON.stringify(data));
                if (data.is_deleted) {
                    newStatus = 0;
                } else {
                    newStatus = 1;
                }

                let data1 = await dbWriter.dashbordWidget.update({
                    is_deleted: newStatus
                }, {
                    where: { dashbord_widget_id: dashbord_widget_id },
                })
                data1 = JSON.parse(JSON.stringify(data1))
                new SuccessResponse(EC.success, {
                    //@ts-ignore
                    token: req.token,
                    data1
                }).send(res);
            } else {
                new SuccessResponse(EC.success, {
                    //@ts-ignore
                    token: req.token,
                    data: [],
                }).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async dashbordwidgetCreate(req: Request, res: Response) {
        try {
            let { dashbord_widget_id, image_url, image_type, title, btn_title, btn_link, btn_color, btn_icon_link, btn_text_color, background_color, background_texture_image, btn_image, background_top_texture_image, background_bottom_texture_image } = req.body;

            let data = await dbReader.dashbordWidget.findOne({
                where: { dashbord_widget_id: dashbord_widget_id }
            });
            if (data) {
                let data = await dbWriter.dashbordWidget.update({
                    image_url: image_url,
                    image_type: image_type,
                    title: title,
                    btn_title: btn_title,
                    btn_link: btn_link,
                    btn_color: btn_color,
                    btn_icon_link: btn_icon_link,
                    btn_text_color: btn_text_color,
                    background_texture_image: background_texture_image,
                    background_color: background_color,
                    btn_image: btn_image,
                    background_top_texture_image: background_top_texture_image,
                    background_bottom_texture_image: background_bottom_texture_image
                }, {
                    where: { dashbord_widget_id: dashbord_widget_id },
                })
                data = JSON.parse(JSON.stringify(data))
                new SuccessResponse(EC.success, {
                    //@ts-ignore
                    token: req.token,
                    data
                }).send(res);
            } else {
                let data = await dbWriter.dashbordWidget.create({
                    image_url: image_url,
                    image_type: image_type,
                    title: title,
                    btn_title: btn_title,
                    btn_link: btn_link,
                    btn_color: btn_color,
                    btn_icon_link: btn_icon_link,
                    btn_text_color: btn_text_color,
                    background_texture_image: background_texture_image,
                    background_color: background_color,
                    btn_image: btn_image,
                    background_top_texture_image: background_top_texture_image,
                    background_bottom_texture_image: background_bottom_texture_image
                });
                data = JSON.parse(JSON.stringify(data))
                new SuccessResponse(EC.success, {
                    //@ts-ignore
                    token: req.token,
                    data
                }).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async checkoutCampaignReport(req: Request, res: Response) {
        try {
            let { range, search = "", page_no, page_record } = req.body;
            let rowLimit = page_record ? parseInt(page_record) : 25;
            let rowOffset = page_no ? ((page_no * page_record) - page_record) : 0;
            let startDate = moment((range.start_date)).format("YYYY-MM-DD");
            let endDate = moment((range.end_date)).format("YYYY-MM-DD");
            let SearchCondition = dbReader.Sequelize.Op.ne, SearchData = null;
            if (search) {
                SearchCondition = dbReader.Sequelize.Op.like;
                SearchData = "%" + search + "%";
            }

            let userData = await dbReader.users.findAndCountAll({
                attributes: ["user_id", "first_name", "last_name", "email"],
                include: [{
                    requiresd: true,
                    attributes: [],
                    as: 'check_utm_campaign',
                    model: dbReader.checkoutUtmCampaignModel,
                    where: dbReader.Sequelize.and(
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('created_date'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.gte]: startDate }),
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('created_date'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.lte]: endDate }),
                        dbReader.Sequelize.or(
                            dbReader.Sequelize.where(dbReader.Sequelize.literal('`sycu_users`.`first_name`'), { [SearchCondition]: SearchData }),
                            dbReader.Sequelize.where(dbReader.Sequelize.literal('`sycu_users`.`last_name`'), { [SearchCondition]: SearchData }),
                            dbReader.Sequelize.where(dbReader.Sequelize.literal('`sycu_users`.`email`'), { [SearchCondition]: SearchData }),
                            { utm_campaign: { [SearchCondition]: SearchData } },
                            { utm_source: { [SearchCondition]: SearchData } },
                            { utm_medium: { [SearchCondition]: SearchData } },
                            { utm_content: { [SearchCondition]: SearchData } },
                        )
                    )
                }, {
                    separate: true,
                    model: dbReader.checkoutUtmCampaignModel,
                    include: [{
                        model: dbReader.userSubscription,
                        attributes: ['user_subscription_id', 'subscription_number', 'subscription_status', 'created_datetime'],
                        include: [{
                            separate: true,
                            model: dbReader.userSubscriptionItems,
                            attributes: ['user_subscription_item_id', 'user_subscription_id', 'product_name', 'product_amount'],
                            where: { item_type: 1, is_deleted: 0 },
                        }]
                    }]
                }],
                where: { is_deleted: 0 },
                group: ["user_id"],
                offset: rowOffset,
                limit: rowLimit,
            });

            userData = JSON.parse(JSON.stringify(userData));
            new SuccessResponse("Success", {
                count: userData.count.length,
                rows: userData.rows
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async listConUserReport(req: Request, res: Response) {
        try {
            let { page_no, page_record, converted, country = "", range, search = "", serchfilter = 0, serchFilterCon = {}, ministry = "" } = req.body;
            let rowLimit = page_record ? parseInt(page_record) : 25;
            let rowOffset = page_no ? page_no * page_record - page_record : 0;
            let convertedCondition = dbReader.Sequelize.Op.ne, convertedData, countryData = null, ministryCon = null, churchCondition, whereCon, flag = false, countryCondition, whereCon1;
            let searchCondition = dbReader.Sequelize.Op.ne, searchData = null;
            if (search) {
                flag = true;
                searchCondition = dbReader.Sequelize.Op.like;
                searchData = "%" + search + "%";
                if (serchfilter == 1) {
                    serchFilterCon = { utm_medium: { [searchCondition]: searchData } }
                } else if (serchfilter == 2) {
                    serchFilterCon = { utm_source: { [searchCondition]: searchData } }
                } else if (serchfilter == 3) {
                    serchFilterCon = { utm_campaign: { [searchCondition]: searchData } }
                } else if (serchfilter == 4) {
                    serchFilterCon = { utm_content: { [searchCondition]: searchData } }
                } else if (serchfilter == 5) {
                    serchFilterCon = { utm_term: { [searchCondition]: searchData } }
                } else if (serchfilter == 6) {
                    serchFilterCon = { church_name: { [searchCondition]: searchData } }
                } else if (serchfilter == 7) {
                    serchFilterCon = { church_city: { [searchCondition]: searchData } }
                } else if (serchfilter == 8) {
                    serchFilterCon = { church_state: { [searchCondition]: searchData } }
                } else if (serchfilter == 9) {
                    serchFilterCon = { church_size: { [searchCondition]: searchData } }
                } else {
                    serchFilterCon = dbReader.Sequelize.or(
                        { first_name: { [searchCondition]: searchData } },
                        { last_name: { [searchCondition]: searchData } },
                        { email: { [searchCondition]: searchData } },
                        { utm_medium: { [searchCondition]: searchData } },
                        { utm_source: { [searchCondition]: searchData } }
                    )
                }
            }

            if (converted == 0 || converted == 1) {
                convertedCondition = dbReader.Sequelize.Op.eq
                convertedData = converted
            } else {
                convertedCondition = dbReader.Sequelize.Op.ne
                convertedData = null
            }

            if (country) {
                flag = true;
                countryCondition = dbReader.Sequelize.Op.like;
                countryData = "%" + country + "%";
                churchCondition = { church_country: { [countryCondition]: countryData } };
            } else {
                // countryCondition = dbReader.Sequelize.Op.like;
                // countryData = "%" + country + "%";
                churchCondition = {}
            }

            if (range !== '') {
                whereCon =
                    dbReader.Sequelize.and(
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`sycu_con_user_details`.`created_date`'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.gte]: range.start_date }),
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`sycu_con_user_details`.`created_date`'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.lte]: range.end_date }),
                        dbReader.Sequelize.or({ is_registered: { [convertedCondition]: convertedData } })
                    );

                whereCon1 =
                    dbReader.Sequelize.and(
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`sycu_con_user_details`.`created_date`'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.gte]: range.start_date }),
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`sycu_con_user_details`.`created_date`'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.lte]: range.end_date })
                    );
            } else {
                whereCon = {
                    is_registered: { [convertedCondition]: convertedData }
                };
                whereCon1 = {}
            }

            if (ministry) {
                flag = true;
                ministryCon = { ministry_level: ministry };
            }

            let conUserReport = await dbReader.conUsers.findAndCountAll({
                where: whereCon,
                include: [{
                    required: true,
                    model: dbReader.users,
                    attributes: ["user_id", "first_name", "last_name", "email", "ministry_level", "ministry_role", "students_ministry_size", "kids_ministry_size", "church_name", "church_country", "church_state", "church_city", "church_size", "church_ethnic_makeup", "is_curriculum_user", "using_curriculum_from", "greatest_struggle", "utm_term", "utm_campaign", "utm_source", "utm_medium", "utm_content", "created_datetime"],
                    where: dbReader.Sequelize.and({ is_deleted: 0 }, serchFilterCon, ministryCon, churchCondition)
                }],
                order: [['con_user_detail_id', 'DESC']],
                limit: rowLimit,
                offset: rowOffset,
            });
            conUserReport = JSON.parse(JSON.stringify(conUserReport));
            // Get All visted and registered data
            let totalCountData = await dbReader.conUsers.findAll({
                attributes: ["is_registered", [dbReader.Sequelize.literal('COUNT(con_user_detail_id)'), 'countData']],
                // where:
                //     dbReader.Sequelize.and(
                //         { is_registered: { [convertedCondition]: convertedData } },
                //     ),
                where: whereCon1,
                group: ['is_registered']
            });
            let totVistedUserdata = await dbReader.conUsers.findAll({
                attributes: ["is_registered", [dbReader.Sequelize.literal('COUNT(DISTINCT con_user_detail_id)'), 'countData']],
                where: dbReader.Sequelize.and(whereCon1, { is_registered: 1 }),
                include: [{
                    required: true,
                    attributes: [],
                    model: dbReader.users,
                    where: dbReader.Sequelize.and({ is_deleted: 0 }, serchFilterCon, ministryCon)
                }],
                group: ['is_registered']
            });
            totVistedUserdata = JSON.parse(JSON.stringify(totVistedUserdata));
            totalCountData = JSON.parse(JSON.stringify(totalCountData));
            if (conUserReport.rows.length > 0) {
                new SuccessResponse(EC.success, {
                    //@ts-ignore
                    token: req.token,
                    count: conUserReport.count,
                    totalVisits: (totalCountData.length > 1) ? totalCountData[0].countData + totalCountData[1].countData : totalCountData[0].countData,
                    totalNonRegisters: (totalCountData.length) ? totalCountData[0].countData || 0 : 0,
                    totalRegisters: (totVistedUserdata.length) ? totVistedUserdata[0].countData || 0 : 0,
                    conUserReport: conUserReport.rows,
                }).send(res);
            } else {
                new SuccessResponse(EC.success, {
                    //@ts-ignore
                    token: req.token,
                    conUserReportData: []
                }).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getUserOnboardingReport(req: Request, res: Response) {
        try {
            let { range, search = "", page_no, page_record } = req.body;
            let rowLimit = page_record ? parseInt(page_record) : 25;
            let rowOffset = page_no ? ((page_no * page_record) - page_record) : 0;
            let startDate = range.start_date ? moment((range.start_date)).format("YYYY-MM-DD") : "";
            let endDate = range.end_date ? moment((range.end_date)).format("YYYY-MM-DD") : "";
            let searchCondition = dbReader.Sequelize.Op.ne, searchData = null;
            if (search) {
                searchCondition = dbReader.Sequelize.Op.like;
                searchData = "%" + search + "%";
            }

            let userData = await dbReader.users.findAndCountAll({
                attributes: ["user_id", "first_name", "last_name", "email", "created_datetime", "country_code", "mobile",
                    "utm_campaign", "utm_source", "utm_medium", "utm_content", "via_portal", "church_name", "church_size",
                    "country_code", "ministry_role", "feedback_note", "grow_accomplish", "church_location", "is_church_confirmed",
                    "church_denomination", "church_ethnic_makeup", "feedback_option_data_id", "onboarding_created_datetime",
                    "onboarding_updated_datetime"],
                where: dbReader.Sequelize.and({ is_deleted: 0, via_portal: 15 },
                    dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('onboarding_created_datetime'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.gte]: startDate }),
                    dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('onboarding_created_datetime'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.lte]: endDate }),
                    dbReader.Sequelize.or(
                        { first_name: { [searchCondition]: searchData } },
                        { last_name: { [searchCondition]: searchData } },
                        { email: { [searchCondition]: searchData } },
                        { utm_campaign: { [searchCondition]: searchData } },
                        { utm_source: { [searchCondition]: searchData } },
                        { utm_medium: { [searchCondition]: searchData } },
                        { utm_content: { [searchCondition]: searchData } },
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

    public async getCalenderCardReport(req: Request, res: Response) {
        try {
            let { range, search = "", page_no, page_record, filter = "" } = req.body;
            let rowLimit = page_record ? parseInt(page_record) : 25;
            let rowOffset = page_no ? ((page_no * page_record) - page_record) : 0;
            let startDate = range.start_date ? moment((range.start_date)).format("YYYY-MM-DD") : "";
            let endDate = range.end_date ? moment((range.end_date)).format("YYYY-MM-DD") : "";
            let searchCondition = dbReader.Sequelize.Op.ne, searchData = null;
            let statusCondition: any = {};
            if (search) {
                searchCondition = dbReader.Sequelize.Op.like;
                searchData = "%" + search + "%";
            }

            if (filter) {
                statusCondition = { delivery_status: filter };
            }

            let shipBobOrder = await dbReader.shipbobOrders.findAndCountAll({
                attributes: ['id', 'shipbob_order_id', 'shipbob_shipment_id', 'user_subscription_id', 'user_order_id', 'subscription_number', 'order_number', 'reference_id', 'user_id', 'shipbob_products_name',
                    'thirdparty_log_id', 'status', 'created_datetime', 'delivery_status', 'tracking_number', 'address_line1', 'address_line2', 'city', 'state_name', 'country_name', 'zipcode', 'shipbob_status',
                    'confirm_datetime', 'organization_name', 'token', 'is_from', [dbReader.Sequelize.literal(`email`), "email"], [dbReader.Sequelize.literal(`first_name`), "first_name"],
                    [dbReader.Sequelize.literal(`last_name`), "last_name"], [dbReader.Sequelize.literal(`username`), "username"]
                ],
                include: [{
                    model: dbReader.users,
                    attributes: []
                }],
                where: dbReader.Sequelize.and(
                    dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('shipbob_orders.created_datetime'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.gte]: startDate }),
                    dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('shipbob_orders.created_datetime'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.lte]: endDate }),
                    dbReader.Sequelize.or(
                        { '$sycu_user.first_name$': { [searchCondition]: searchData } },
                        { '$sycu_user.last_name$': { [searchCondition]: searchData } },
                        { '$sycu_user.email$': { [searchCondition]: searchData } },
                        { shipbob_products_name: { [searchCondition]: searchData } }
                    ),
                    statusCondition
                ),
                offset: rowOffset,
                order: [["id", "DESC"]],
                limit: rowLimit,
            });

            if (shipBobOrder.count > 0) {
                new SuccessResponse(EC.success, {
                    //@ts-ignore
                    token: req.token,
                    count: shipBobOrder.count,
                    rows: shipBobOrder.rows
                }).send(res);
            }
            else {
                new SuccessResponse(EC.noDataFound, {
                    //@ts-ignore
                    token: req.token,
                    rows: []
                }).send(res);
            }
        } catch (e: any) {
            return false
        }
    }

    public async getFeedbackReport(req: Request, res: Response) {
        try {
            let { range, search = "", page_no, page_record, filter1, filter2, filter3 } = req.body;
            let rowLimit = page_record ? parseInt(page_record) : 25;
            let rowOffset = page_no ? ((page_no * page_record) - page_record) : 0;
            let startDate = range.start_date ? moment((range.start_date)).format("YYYY-MM-DD") : "";
            let endDate = range.end_date ? moment((range.end_date)).format("YYYY-MM-DD") : "";
            let searchCondition = dbReader.Sequelize.Op.ne, searchData = null;
            let feedbackCondition: any = {}, ministryCondition: any = {}, typeCondition = {};
            if (search) {
                searchCondition = dbReader.Sequelize.Op.like;
                searchData = "%" + search + "%";
            }
            if (filter1) {
                feedbackCondition = { feedback_rating: filter1 };
            }
            if (filter2) {
                ministryCondition = { ministry_type: filter2 };
            }
            if (filter3) {
                typeCondition = { type: filter3 };
            }
            let feedbackData = await dbReader.feedBack.findAndCountAll({
                attributes: ['feedback_id', 'type', 'type_id', 'user_id', 'feedback_rating', 'feedback_review', 'curriculum_tabs_id',
                    [dbReader.Sequelize.literal(`email`), "email"],
                    [dbReader.Sequelize.literal(`first_name`), "first_name"],
                    [dbReader.Sequelize.literal(`last_name`), "last_name"]],
                include: [{
                    model: dbReader.users,
                    attributes: []
                }, {
                    required: false,
                    model: dbReader.applicationAds,
                    attributes: ['application_ads_id', 'application_title', 'application_card_title', 'ministry_type'],
                    where: ministryCondition
                }, {
                    required: false,
                    model: dbReader.todoList,
                    attributes: ['todo_list_id', 'title', 'ministry_type'],
                    where: ministryCondition
                }, {
                    required: false,
                    model: dbReader.categories,
                    attributes: ['category_id', 'category_title', 'parent_category_id'],
                }, {
                    required: false,
                    model: dbReader.posts,
                    attributes: ['post_id', 'post_title', 'category_id'],
                }, {
                    required: false,
                    model: dbReader.contentTypes,
                    attributes: ['content_type_id', 'content_type_title'],
                },
                ],
                where: dbReader.Sequelize.and({ is_deleted: 0 }, feedbackCondition, typeCondition,
                    dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('feedbacks.created_datetime'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.gte]: startDate }),
                    dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('feedbacks.created_datetime'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.lte]: endDate }),
                    dbReader.Sequelize.or(
                        { '$sycu_user.first_name$': { [searchCondition]: searchData } },
                        { '$sycu_user.last_name$': { [searchCondition]: searchData } },
                        { '$sycu_user.email$': { [searchCondition]: searchData } },
                    )),
                offset: rowOffset,
                order: [["feedback_id", "DESC"]],
                limit: rowLimit,
            });
            if (feedbackData.count > 0) {
                feedbackData = JSON.parse(JSON.stringify(feedbackData));
                for (let i = 0; i < feedbackData.rows.length; i++) {
                    if (feedbackData.rows[i].type == 3) {
                        if (feedbackData.rows[i].curriculum_tabs_id == 2 || feedbackData.rows[i].curriculum_tabs_id == 13) {
                            if (feedbackData.rows[i].sycu_category != null) {
                                let data = await dbReader.categories.findOne({
                                    attributes: ["category_id", "category_title"],
                                    where: { category_id: feedbackData.rows[i].sycu_category.parent_category_id }
                                });
                                data = JSON.parse(JSON.stringify(data));
                                feedbackData.rows[i].sycu_category.volume = data.category_title;
                            }
                            delete feedbackData.rows[i].post;
                        } else {
                            if (feedbackData.rows[i].post != null) {
                                let data = await dbReader.categories.findOne({
                                    attributes: ["category_id", "category_title"],
                                    where: { category_id: feedbackData.rows[i].post.category_id }
                                });
                                data = JSON.parse(JSON.stringify(data));
                                feedbackData.rows[i].post.volume = data.category_title;
                            }
                            delete feedbackData.rows[i].sycu_category;
                        }
                    }
                }
                new SuccessResponse(EC.success, {
                    //@ts-ignore
                    token: req.token,
                    count: feedbackData.count,
                    rows: feedbackData.rows
                }).send(res);
            } else {
                new SuccessResponse(EC.noDataFound, {
                    //@ts-ignore
                    token: req.token,
                    rows: []
                }).send(res);
            }
        } catch (e: any) {
            return false
        }
    }
}
