import { Request, Response } from "express";
import moment from 'moment';
import { getDateRange } from '../helpers/helpers';
import { ErrorController, SuccessResponse, BadRequestError, ApiError } from '../core/index';
const { dbReader } = require('../models/dbConfig');
const EC = new ErrorController();

const { Op } = dbReader.Sequelize;

export class SubscriptionDashboardController {
    /*
    * Code done by Sh - 25-11-2021
    * For cart Detail api , Charts api's and Performance api's
    */

    /*
      Subscription DashBoard API
     */
    public async getSubscriptionPerformanceData(req: Request, res: Response) {
        try {
            var current_obj = new SubscriptionDashboardController();

            // Total Sales
            const activeSubscription = await dbReader.userSubscription.findAndCountAll({
                attributes: [
                    [dbReader.Sequelize.fn('sum', dbReader.Sequelize.col('total_amount')), 'total_amount'],
                ],
                where: { subscription_status: 1 }
            });
            ``
            //Getting Net Sales
            let getNetSales = await current_obj.netSalesDetail(req, res);

            //Getting Average Order Value
            let getAverageOrderValueDetail = await current_obj.averageOrderValueDetail(req, res);

            //Getting Product Sold Detail
            let getProductSoldDetail = await current_obj.productSoldDetail(req, res);

            //Getting Discounted Orders Detailc
            let discountedOrdersDetail = await current_obj.discountedOrdersDetail(req, res);

            //Getting net Discounted Amount Detail
            let netDiscountedAmountDetail = await current_obj.netDiscountedAmountDetail(req, res);

            //Getting gross Sales Detail
            let grossSalesDetail = await current_obj.grossSalesDetail(req, res);

            //Getting shipping Detail
            let shippingDetail = await current_obj.shippingDetail(req, res);

            //Getting returns Detail
            let returnsDetail = await current_obj.returnsDetail(req, res);

            //Getting total Tax Detail
            let totalTaxDetail = await current_obj.totalTaxDetail(req, res);

            //Getting order Tax Detail
            let orderTaxDetail = await current_obj.orderTaxDetail(req, res);

            //Getting shipping Tax Detail
            let shippingTaxDetail = await current_obj.shippingTaxDetail(req, res);

            //Getting downloads Detail
            let downloadsDetail = await current_obj.downloadsDetail(req, res);

            //Getting variations Sold Detail
            let variationsSoldDetail = await current_obj.variationsSoldDetail(req, res);


            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token,
                totalSales: activeSubscription.rows[0].total_amount,
                sales: getNetSales,
                averageOrderValueDetail: getAverageOrderValueDetail,
                productSoldDetail: getProductSoldDetail,
                discountedOrdersDetail: discountedOrdersDetail,
                netDiscountedAmountDetail: netDiscountedAmountDetail,
                grossSalesDetail: grossSalesDetail,
                shippingDetail: shippingDetail,
                returnsDetail: returnsDetail,
                totalTaxDetail: totalTaxDetail,
                orderTaxDetail: orderTaxDetail,
                shippingTaxDetail: shippingTaxDetail,
                downloadsDetail: downloadsDetail,
                variationsSoldDetail: variationsSoldDetail,
            }).send(res);
        }
        catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }


    // cart Detail api
    public async getCartDetail(req: Request, res: Response) {
        try {
            const userCount = await dbReader.users.count({});
            const activeSubscription = await dbReader.userSubscription.findAndCountAll({
                attributes: [
                    [dbReader.Sequelize.fn('sum', dbReader.Sequelize.col('total_amount')), 'total_amount'],
                ],
                where: { subscription_status: 1 }
            });
            const totalPaidUser = await dbReader.userSubscription.findAndCountAll({
                where: {
                    subscription_status: {
                        [Op.or]: [1, 3]
                    }
                }

            });
            const cancelSubscription = await dbReader.userSubscription.findAndCountAll({
                where: { subscription_status: 3 }
            });
            let finalData = [
                { title: "Registered Users", iconClass: "bx-user", description: userCount },
                {
                    title: "Total Net Sales",
                    iconClass: "bx-dollar-circle",
                    description: activeSubscription.rows[0].total_amount,
                }, {
                    title: "Total Paid Users",
                    iconClass: "bx-money",
                    description: totalPaidUser.count,
                },
                {
                    title: "Active Subscription",
                    iconClass: "bx-user-plus",
                    description: activeSubscription.count,
                },
                {
                    title: "Cancelled Subscription",
                    iconClass: "bx-user-minus",
                    description: cancelSubscription.count,
                },
            ];

            new SuccessResponse(EC.listOfData,
                {
                    //@ts-ignore
                    token: req.token,
                    cartDetail: finalData,
                }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    // Charts api
    public async getNetSalesChartData(req: Request, res: Response) {
        try {
            var startDate = moment().startOf('isoWeek').format("YYYY-MM-DD");
            var endDate = moment().endOf('isoWeek').format("YYYY-MM-DD");
            let dates = [startDate, endDate];

            const totalSales = await dbReader.userOrder.findAll({
                attributes: [
                    [dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('created_datetime'), '%Y-%m-%d'), 'created_date'],
                    [dbReader.Sequelize.fn('sum', dbReader.Sequelize.col('total_amount')), 'total_sales'],
                ],
                where: { "created_datetime": { [Op.between]: dates } },
                group: ['created_date']
            });

            let filteredValuesOfDates: any = [];
            let dateRange = getDateRange(startDate, endDate, "YYYY-MM-DD")
            let arrayOfDates = dateRange.map(function (item) { return { 'created_date': item, 'total_sales': null } });
            totalSales.filter((obj: any) => { filteredValuesOfDates.push(obj.dataValues) });

            // Array merge With Date value And Set Null For Future Dates,

            arrayOfDates.filter((obj: any) => {
                filteredValuesOfDates.filter((value: any) => {
                    if (obj.created_date == value.created_date) {
                        obj.total_sales = value.total_sales;
                    } else {
                        if (moment(new Date()).diff(obj.created_date, 'days') > 0 || obj.created_date == moment().format("YYYY-MM-DD")) {
                            obj.total_sales = 0;
                        }
                    }
                });
            });
            let weekData: any = [];
            arrayOfDates.reverse();
            arrayOfDates.map((data: any) => {
                weekData.push(data.total_sales)
            })

            new SuccessResponse(EC.listOfData, {
                //@ts-ignore
                token: req.token,
                weekData: weekData
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getOrdersChartData(req: Request, res: Response) {
        try {
            var startDate = moment().startOf('isoWeek').format("YYYY-MM-DD");
            var endDate = moment().endOf('isoWeek').format("YYYY-MM-DD");
            let dates = [startDate, endDate];

            const totalOrders = await dbReader.userOrder.findAll({
                attributes: [
                    [dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('created_datetime'), '%Y-%m-%d'), 'created_date'],
                    [dbReader.Sequelize.literal('COUNT(user_orders_id)'), 'total_orders'],
                ],
                where: { "created_datetime": { [Op.between]: dates } },
                group: ['created_date']
            });

            let filteredValuesOfDates: any = [];
            let dateRange = getDateRange(startDate, endDate, "YYYY-MM-DD")
            let arrayOfDates = dateRange.map(function (item) { return { 'created_date': item, 'total_orders': null } });
            totalOrders.filter((obj: any) => { filteredValuesOfDates.push(obj.dataValues) });

            // Array merge With Date value And Set Null For Future Dates,

            arrayOfDates.filter((obj: any) => {
                filteredValuesOfDates.filter((value: any) => {
                    if (obj.created_date == value.created_date) {
                        obj.total_orders = value.total_orders;
                    } else {
                        if (moment(new Date()).diff(obj.created_date, 'days') > 0 || obj.created_date == moment().format("YYYY-MM-DD")) {
                            obj.total_orders = 0;
                        }
                    }
                });
            });
            let weekData: any = [];
            arrayOfDates.reverse();
            arrayOfDates.map((data: any) => {
                weekData.push(data.total_orders)
            })

            new SuccessResponse(EC.listOfData, {
                //@ts-ignore
                token: req.token,
                weekData: weekData
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getAverageOrderValueChartData(req: Request, res: Response) {
        try {
            var startDate = moment().startOf('isoWeek').format("YYYY-MM-DD");
            var endDate = moment().endOf('isoWeek').format("YYYY-MM-DD");
            let dates = [startDate, endDate];

            const averageOrderValue = await dbReader.userOrder.findAll({
                attributes: [
                    [dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('created_datetime'), '%Y-%m-%d'), 'created_date'],
                    [dbReader.Sequelize.fn('sum', dbReader.Sequelize.col('total_amount')), 'sum_of_total_amount'],
                    [dbReader.Sequelize.literal('COUNT(user_orders_id)'), 'total_orders'],
                ],
                where: { "created_datetime": { [Op.between]: dates } },
                group: ['created_date']
            });

            let filteredValuesOfDates: any = [];
            let dateRange = getDateRange(startDate, endDate, "YYYY-MM-DD")
            let arrayOfDates = dateRange.map(function (item) { return { 'created_date': item, 'total_orders': null, 'sum_of_total_amount': null, "average_order_value": null } });
            averageOrderValue.filter((obj: any) => { filteredValuesOfDates.push(obj.dataValues) });

            // Array merge With Date value And Set Null For Future Dates,

            arrayOfDates.filter((obj: any) => {
                filteredValuesOfDates.filter((value: any) => {
                    if (obj.created_date == value.created_date) {
                        obj.total_orders = value.total_orders;
                        obj.sum_of_total_amount = value.sum_of_total_amount;
                        obj.average_order_value = value.sum_of_total_amount / value.total_orders;
                    } else {
                        if (moment(new Date()).diff(obj.created_date, 'days') > 0 || obj.created_date == moment().format("YYYY-MM-DD")) {
                            obj.total_orders = 0;
                            obj.sum_of_total_amount = 0;
                            obj.average_order_value = 0;
                        }
                    }
                });
            });
            let weekData: any = [];
            arrayOfDates.reverse();
            arrayOfDates.map((data: any) => {
                weekData.push(data.average_order_value);
            });
            new SuccessResponse(EC.listOfData, {
                //@ts-ignore
                token: req.token,
                weekData: weekData
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getDiscountedOrdersChartData(req: Request, res: Response) {
        try {
            var startDate = moment().startOf('isoWeek').format("YYYY-MM-DD");
            var endDate = moment().endOf('isoWeek').format("YYYY-MM-DD");
            let dates = [startDate, endDate];

            const discountedOrders = await dbReader.userOrder.findAll({
                attributes: [
                    [dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('created_datetime'), '%Y-%m-%d'), 'created_date'],
                    [dbReader.Sequelize.literal('COUNT(coupon_amount)'), 'no_of_discount'],
                ],
                where: { "created_datetime": { [Op.between]: dates, }, coupon_amount: { [Op.gt]: 0 } },
                group: ['created_date']
            });

            let filteredValuesOfDates: any = [];
            let dateRange = getDateRange(startDate, endDate, "YYYY-MM-DD")
            let arrayOfDates = dateRange.map(function (item) { return { 'created_date': item, 'no_of_discount': null } });
            discountedOrders.filter((obj: any) => { filteredValuesOfDates.push(obj.dataValues) });

            // Array merge With Date value And Set Null For Future Dates,

            arrayOfDates.filter((obj: any) => {
                filteredValuesOfDates.filter((value: any) => {
                    if (obj.created_date == value.created_date) {
                        obj.no_of_discount = value.no_of_discount;
                    } else {
                        if (moment(new Date()).diff(obj.created_date, 'days') > 0 || obj.created_date == moment().format("YYYY-MM-DD")) {
                            obj.no_of_discount = 0;
                        }
                    }
                });
            });
            let weekData: any = [];
            arrayOfDates.reverse();
            arrayOfDates.map((data: any) => {
                weekData.push(data.no_of_discount)
            })

            new SuccessResponse(EC.listOfData, {
                //@ts-ignore
                token: req.token,
                weekData: weekData
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getItemSoldChartData(req: Request, res: Response) {
        try {
            var startDate = moment().startOf('isoWeek').format("YYYY-MM-DD");
            var endDate = moment().endOf('isoWeek').format("YYYY-MM-DD");
            let dates = [startDate, endDate];

            const itemSold = await dbReader.userOrderItems.findAll({
                attributes: [
                    [dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('created_datetime'), '%Y-%m-%d'), 'created_date'],
                    [dbReader.Sequelize.literal('COUNT(user_order_item_id)'), 'total_item_sold'],
                ],
                where: { "created_datetime": { [Op.between]: dates, }, },
                group: ['created_date']
            });

            let filteredValuesOfDates: any = [];
            let dateRange = getDateRange(startDate, endDate, "YYYY-MM-DD")
            let arrayOfDates = dateRange.map(function (item) { return { 'created_date': item, 'total_item_sold': null } });
            itemSold.filter((obj: any) => { filteredValuesOfDates.push(obj.dataValues) });

            // Array merge With Date value And Set Null For Future Dates,

            arrayOfDates.filter((obj: any) => {
                filteredValuesOfDates.filter((value: any) => {
                    if (obj.created_date == value.created_date) {
                        obj.total_item_sold = value.total_item_sold;
                    } else {
                        if (moment(new Date()).diff(obj.created_date, 'days') > 0 || obj.created_date == moment().format("YYYY-MM-DD")) {
                            obj.total_item_sold = 0;
                        }
                    }
                });
            });
            let weekData: any = [];
            arrayOfDates.reverse();
            arrayOfDates.map((data: any) => {
                weekData.push(data.total_item_sold)
            })

            new SuccessResponse(EC.listOfData, {
                //@ts-ignore
                token: req.token,
                weekData: weekData
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getShippingChartData(req: Request, res: Response) {
        try {
            let startDate = moment().startOf('isoWeek').format("YYYY-MM-DD");
            let endDate = moment().endOf('isoWeek').format("YYYY-MM-DD");
            let dates = [startDate, endDate];

            const shipping = await dbReader.userOrder.findAll({
                attributes: [
                    [dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('created_datetime'), '%Y-%m-%d'), 'created_date'],
                    [dbReader.Sequelize.fn('sum', dbReader.Sequelize.col('shipping_amount')), 'total_shipping_amount'],
                ],
                where: { "created_datetime": { [Op.between]: dates, }, },
                group: ['created_date']
            });

            let filteredValuesOfDates: any = [];
            let dateRange = getDateRange(startDate, endDate, "YYYY-MM-DD")
            let arrayOfDates = dateRange.map(function (item) { return { 'created_date': item, 'total_shipping_amount': null } });
            shipping.filter((obj: any) => { filteredValuesOfDates.push(obj.dataValues) });

            // Array merge With Date value And Set Null For Future Dates,

            arrayOfDates.filter((obj: any) => {
                filteredValuesOfDates.filter((value: any) => {
                    if (obj.created_date == value.created_date) {
                        obj.total_shipping_amount = value.total_shipping_amount;
                    } else {
                        if (moment(new Date()).diff(obj.created_date, 'days') > 0 || obj.created_date == moment().format("YYYY-MM-DD")) {
                            obj.total_shipping_amount = 0;
                        }
                    }
                });
            });
            let weekData: any = [];
            arrayOfDates.reverse();
            arrayOfDates.map((data: any) => {
                weekData.push(data.total_shipping_amount)
            })

            new SuccessResponse(EC.listOfData, {
                //@ts-ignore
                token: req.token,
                weekData: weekData
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getGrossDiscountedChartData(req: Request, res: Response) {
        try {
            let startDate = moment().startOf('isoWeek').format("YYYY-MM-DD");
            let endDate = moment().endOf('isoWeek').format("YYYY-MM-DD");
            let dates = [startDate, endDate];

            const grossDiscounted = await dbReader.userOrder.findAll({
                attributes: [
                    [dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('created_datetime'), '%Y-%m-%d'), 'created_date'],
                    [dbReader.Sequelize.fn('sum', dbReader.Sequelize.col('coupon_amount')), 'total_coupon_amount'],
                ],
                where: { "created_datetime": { [Op.between]: dates, }, },
                group: ['created_date']
            });

            let filteredValuesOfDates: any = [];
            let dateRange = getDateRange(startDate, endDate, "YYYY-MM-DD")
            let arrayOfDates = dateRange.map(function (item) { return { 'created_date': item, 'total_coupon_amount': null } });
            grossDiscounted.filter((obj: any) => { filteredValuesOfDates.push(obj.dataValues) });

            // Array merge With Date value And Set Null For Future Dates,

            arrayOfDates.filter((obj: any) => {
                filteredValuesOfDates.filter((value: any) => {
                    if (obj.created_date == value.created_date) {
                        obj.total_coupon_amount = value.total_coupon_amount;
                    } else {
                        if (moment(new Date()).diff(obj.created_date, 'days') > 0 || obj.created_date == moment().format("YYYY-MM-DD")) {
                            obj.total_coupon_amount = 0;
                        }
                    }
                });
            });
            let weekData: any = [];
            arrayOfDates.reverse();
            arrayOfDates.map((data: any) => {
                weekData.push(data.total_coupon_amount)
            })

            new SuccessResponse(EC.listOfData, {
                //@ts-ignore
                token: req.token,
                weekData: weekData
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getReturnsChartData(req: Request, res: Response) {
        try {
            let startDate = moment().startOf('isoWeek').format("YYYY-MM-DD");
            let endDate = moment().endOf('isoWeek').format("YYYY-MM-DD");
            let dateRange = getDateRange(startDate, endDate, "YYYY-MM-DD")
            let arrayOfDates = dateRange.map(function (item) { return { 'created_date': item, 'total_coupon_amount': null } });

            // Array merge With Date value And Set Null For Future Dates,
            arrayOfDates.filter((obj: any) => {
                if (moment(new Date()).diff(obj.created_date, 'days') > 0 || obj.created_date == moment().format("YYYY-MM-DD")) {
                    obj.total_item_sold = 0;
                }
            });
            let weekData: any = [];
            arrayOfDates.reverse();
            arrayOfDates.map((data: any) => {
                weekData.push(data.total_item_sold)
            });

            new SuccessResponse(EC.listOfData, {
                //@ts-ignore
                token: req.token,
                weekData: weekData
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getTotalTaxChartData(req: Request, res: Response) {
        try {
            let startDate = moment().startOf('isoWeek').format("YYYY-MM-DD");
            let endDate = moment().endOf('isoWeek').format("YYYY-MM-DD");
            let dateRange = getDateRange(startDate, endDate, "YYYY-MM-DD")
            let arrayOfDates = dateRange.map(function (item) { return { 'created_date': item, 'total_coupon_amount': null } });

            // Array merge With Date value And Set Null For Future Dates,
            arrayOfDates.filter((obj: any) => {
                if (moment(new Date()).diff(obj.created_date, 'days') > 0 || obj.created_date == moment().format("YYYY-MM-DD")) {
                    obj.total_item_sold = 0;
                }
            });
            let weekData: any = [];
            arrayOfDates.reverse();
            arrayOfDates.map((data: any) => {
                weekData.push(data.total_item_sold)
            });

            new SuccessResponse(EC.listOfData, {
                //@ts-ignore
                token: req.token,
                weekData: weekData
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getOrderTaxChartData(req: Request, res: Response) {
        try {
            let startDate = moment().startOf('isoWeek').format("YYYY-MM-DD");
            let endDate = moment().endOf('isoWeek').format("YYYY-MM-DD");
            let dateRange = getDateRange(startDate, endDate, "YYYY-MM-DD")
            let arrayOfDates = dateRange.map(function (item) { return { 'created_date': item, 'total_coupon_amount': null } });

            // Array merge With Date value And Set Null For Future Dates,
            arrayOfDates.filter((obj: any) => {
                if (moment(new Date()).diff(obj.created_date, 'days') > 0 || obj.created_date == moment().format("YYYY-MM-DD")) {
                    obj.total_item_sold = 0;
                }
            });
            let weekData: any = [];
            arrayOfDates.reverse();
            arrayOfDates.map((data: any) => {
                weekData.push(data.total_item_sold)
            });

            new SuccessResponse(EC.listOfData, {
                //@ts-ignore
                token: req.token,
                weekData: weekData
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getShippingTaxChartData(req: Request, res: Response) {
        try {
            let startDate = moment().startOf('isoWeek').format("YYYY-MM-DD");
            let endDate = moment().endOf('isoWeek').format("YYYY-MM-DD");
            let dateRange = getDateRange(startDate, endDate, "YYYY-MM-DD")
            let arrayOfDates = dateRange.map(function (item) { return { 'created_date': item, 'total_coupon_amount': null } });

            // Array merge With Date value And Set Null For Future Dates,
            arrayOfDates.filter((obj: any) => {
                if (moment(new Date()).diff(obj.created_date, 'days') > 0 || obj.created_date == moment().format("YYYY-MM-DD")) {
                    obj.total_item_sold = 0;
                }
            });
            let weekData: any = [];
            arrayOfDates.reverse();
            arrayOfDates.map((data: any) => {
                weekData.push(data.total_item_sold)
            });

            new SuccessResponse(EC.listOfData, {
                //@ts-ignore
                token: req.token,
                weekData: weekData
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getDownloadsChartData(req: Request, res: Response) {
        try {
            let startDate = moment().startOf('isoWeek').format("YYYY-MM-DD");
            let endDate = moment().endOf('isoWeek').format("YYYY-MM-DD");
            let dateRange = getDateRange(startDate, endDate, "YYYY-MM-DD")
            let arrayOfDates = dateRange.map(function (item) { return { 'created_date': item, 'total_coupon_amount': null } });

            // Array merge With Date value And Set Null For Future Dates,
            arrayOfDates.filter((obj: any) => {
                if (moment(new Date()).diff(obj.created_date, 'days') > 0 || obj.created_date == moment().format("YYYY-MM-DD")) {
                    obj.total_item_sold = 0;
                }
            });
            let weekData: any = [];
            arrayOfDates.reverse();
            arrayOfDates.map((data: any) => {
                weekData.push(data.total_item_sold)
            });

            new SuccessResponse(EC.listOfData, {
                //@ts-ignore
                token: req.token,
                weekData: weekData
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    // Performance Api's

    public async netSalesDetail(req: Request, res: Response) {
        try {
            const totalSales = await dbReader.userOrder.findAll({
                attributes: [
                    [dbReader.Sequelize.fn('sum', dbReader.Sequelize.col('total_amount')), 'total_net_sales'],
                ],
            });
            let filteredValues;
            totalSales.filter((obj: any) => { filteredValues = obj.dataValues.total_net_sales; });
            return filteredValues;
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
    public async averageOrderValueDetail(req: Request, res: Response) {
        try {
            const totalAverageOrder = await dbReader.userOrder.findAll({
                attributes: [
                    [dbReader.Sequelize.fn('sum', dbReader.Sequelize.col('total_amount')), 'sum_of_total_amount'],
                    [dbReader.Sequelize.literal('COUNT(user_orders_id)'), 'total_orders'],
                ],
            });
            let filteredValues: any = [], averageOrderValue;
            totalAverageOrder.filter((obj: any) => { filteredValues.push(obj.dataValues) });
            filteredValues.map((value: any) => {
                averageOrderValue = value.sum_of_total_amount / value.total_orders
            });
            return averageOrderValue;
        } catch (e: any) {
            return 0;
        }
    }

    public async productSoldDetail(req: Request, res: Response) {
        try {
            const totalProductSold = await dbReader.userOrderItems.findAll({
                attributes: [
                    [dbReader.Sequelize.literal('COUNT(user_order_item_id)'), 'total_product_sold'],
                ],
            });
            let filteredValues;
            totalProductSold.filter((obj: any) => { filteredValues = obj.dataValues.total_product_sold; });
            return filteredValues;
        } catch (e: any) {
            return 0;
        }
    }

    public async discountedOrdersDetail(req: Request, res: Response) {
        try {
            const totalDiscountedOrders = await dbReader.userOrder.findAll({
                attributes: [
                    [dbReader.Sequelize.literal('COUNT(coupon_amount)'), 'no_of_discount'],
                ],
                where: [{ coupon_amount: { [Op.gt]: 0 } }]
            });
            let filteredValues;
            totalDiscountedOrders.filter((obj: any) => { filteredValues = obj.dataValues.no_of_discount });
            return filteredValues;
        } catch (e: any) {
            return 0;
        }
    }

    public async netDiscountedAmountDetail(req: Request, res: Response) {
        try {
            const netDiscountedAmountValue = await dbReader.userOrder.findAll({
                attributes: [
                    [dbReader.Sequelize.fn('sum', dbReader.Sequelize.col('coupon_amount')), 'net_discount_amount'],
                ],
            });
            let filteredValues;
            netDiscountedAmountValue.filter((obj: any) => { filteredValues = obj.dataValues.net_discount_amount; });
            return filteredValues;
        } catch (e: any) {
            return 0;
        }
    }

    public async grossSalesDetail(req: Request, res: Response) {
        try {
            const grossSalesData = await dbReader.userOrder.findAll({
                attributes: [
                    [dbReader.Sequelize.fn('sum', dbReader.Sequelize.col('total_amount')), 'gross_amount'],
                ],
            });
            let filteredValues;
            grossSalesData.filter((obj: any) => { filteredValues = obj.dataValues.gross_amount; });
            return filteredValues;
        } catch (e: any) {
            return 0;
        }
    }

    public async shippingDetail(req: Request, res: Response) {
        try {
            const shippingData = await dbReader.userOrder.findAll({
                attributes: [
                    [dbReader.Sequelize.fn('sum', dbReader.Sequelize.col('shipping_amount')), 'gross_shipping_amount'],
                ],
            });
            let filteredValues;
            shippingData.filter((obj: any) => { filteredValues = obj.dataValues.gross_shipping_amount; });
            return filteredValues;
        } catch (e: any) {
            return 0;
        }
    }

    public async returnsDetail(req: Request, res: Response) {
        try {
            let returns = 0;
            return returns;
        } catch (e: any) {
            return 0;
        }
    }

    public async totalTaxDetail(req: Request, res: Response) {
        try {
            let totalTax = 0;
            return totalTax;
        } catch (e: any) {
            return 0;
        }
    }

    public async orderTaxDetail(req: Request, res: Response) {
        try {
            let orderTax = 0;
            return orderTax;
        } catch (e: any) {
            return 0;
        }
    }

    public async shippingTaxDetail(req: Request, res: Response) {
        try {
            let shippingTax = 0;
            return shippingTax;
        } catch (e: any) {
            return 0;
        }
    }

    public async downloadsDetail(req: Request, res: Response) {
        try {
            let downloads = 0;
            return downloads;
        } catch (e: any) {
            return 0;
        }
    }

    public async variationsSoldDetail(req: Request, res: Response) {
        try {
            let variationsSold = 0;
            return variationsSold;
        } catch (e: any) {
            return 0;
        }
    }

    public async getTopProductData(req: Request, res: Response) {
        try {
            let currentYear = moment().year();
            const topProduct = await dbReader.userOrderItems.findAll({
                attributes: ['product_id', 'product_name', [dbReader.Sequelize.fn('COUNT', dbReader.Sequelize.col('product_id')), 'total_product'],
                    [dbReader.sequelize.literal('SUM(product_amount - coupon_amount + shipping_fees + processing_fees)'), 'total_net_sales']],
                group: 'product_id',
                where: dbReader.Sequelize.where(dbReader.Sequelize.fn('YEAR', dbReader.Sequelize.col('created_datetime')), currentYear),
                order: [
                    [dbReader.Sequelize.literal('total_product'), 'DESC'],
                    ['product_id', 'ASC']
                ],
                limit: 5
            });
            new SuccessResponse(EC.success,
                {
                    //@ts-ignore
                    token: req.token,
                    topProduct: topProduct
                }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getTopMembershipData(req: Request, res: Response) {
        try {
            let currentYear = moment().year();
            const topMembership = await dbReader.membership.findAll({
                include: [{
                    model: dbReader.userMemberships,
                    required: true,
                    include: [{
                        model: dbReader.userOrder,
                        include: [{
                            model: dbReader.userOrderItems,
                            attributes: ['user_order_item_id', 'coupon_amount', [dbReader.Sequelize.fn('COUNT', dbReader.Sequelize.col('product_id')), 'total_item_sold'],
                                [dbReader.Sequelize.fn('SUM', dbReader.Sequelize.where(dbReader.Sequelize.col('product_amount'), '-', dbReader.Sequelize.col('grow_user_memberships.user_order.user_order_items.coupon_amount'), '+', dbReader.Sequelize.col('shipping_fees'), '+', dbReader.Sequelize.col('processing_fees'))
                                ), 'total_net_sales',]],
                        }],
                        attributes: ['user_orders_id'],
                    }],
                    attributes: [[dbReader.Sequelize.fn('COUNT', dbReader.Sequelize.col('user_membership_id')), 'total_membership']],
                    order: [
                        [dbReader.Sequelize.literal('total_membership'), 'DESC'],
                    ],
                }],
                attributes: ['membership_id', 'membership_name'],
                where: dbReader.Sequelize.where(dbReader.Sequelize.fn('YEAR', dbReader.Sequelize.col('created_datetime')), currentYear),
                group: 'membership_id',
                limit: 5
            });
            let filteredValuesOfCurrentYear: any = [];
            topMembership.filter((obj: any) => { filteredValuesOfCurrentYear.push(obj.dataValues) });
            let valueOfCurrentYear = 0;
            filteredValuesOfCurrentYear.map((data: any) => {
                valueOfCurrentYear = valueOfCurrentYear + data.total_net_sales;
            });

            new SuccessResponse(EC.success,
                {
                    //@ts-ignore
                    token: req.token,
                    topMembership: topMembership
                }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
}