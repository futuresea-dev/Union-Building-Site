import { Request, Response } from "express";
import { ErrorController } from "../../core/ErrorController";
import { SuccessResponse } from '../../core/ApiResponse';
import { BadRequestError, ApiError, AuthFailureError } from '../../core/ApiError';
import { getDateRange } from '../../helpers/helpers';
import moment from "moment";
const { dbReader, dbWriter } = require('../../models/dbConfig');
const { Op } = dbReader.Sequelize;
const EC = new ErrorController();

export class CouponReportController {
    public async getCouponUsedCount(req: Request, res: Response) {
        try {
            let { current_date_range } = req.body;
            let { past_date_range, site_id } = req.body;
            let whereStatement: any = {}
            let includeCondition = [{
                required: true,
                model: dbReader.userOrderItems,
                attributes: [],
                where: {
                    item_type: 5
                }
            }];

            //filter 
            if (site_id) {
                whereStatement.site_id = site_id
            }

            let whereCondition = dbReader.sequelize.and(
                whereStatement,
                dbReader.Sequelize.or(
                    dbReader.Sequelize.and(
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_orders.created_datetime`'), '%Y-%m-%d'), { [Op.gte]: current_date_range.start_date }),
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_orders.created_datetime`'), '%Y-%m-%d'), { [Op.lte]: current_date_range.end_date })
                    ),
                    dbReader.Sequelize.and(
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('user_orders.created_datetime`'), '%Y-%m-%d'), { [Op.gte]: past_date_range.start_date }),
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_orders.created_datetime`'), '%Y-%m-%d'), { [Op.lte]: past_date_range.end_date })
                    ),
                ),
                { order_status: [2, 3, 4, 5, 6, 8] }
            );

            let yearData = await dbReader.userOrder.findAll({
                attributes: [[dbReader.Sequelize.literal('`user_order_items`.`product_amount`'), "coupon_amount"],
                [dbReader.Sequelize.literal('`user_order_items`.`product_name`'), 'product_name'],
                [dbReader.Sequelize.literal('`user_order_items`.`user_orders_id`'), 'user_orders_id'],
                [dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('`user_orders`.`created_datetime`'), '%Y-%m-%d'), 'created_date']
                ],
                where: whereCondition,
                include: includeCondition
            })

            yearData = JSON.parse(JSON.stringify(yearData));

            let filterCurrentData: any = [], filterPastData: any = [], current_orders = 0, past_orders = 0, current_tot = 0, past_tot = 0;

            //new shraddha
            let dateRangeOfCurrent = getDateRange(current_date_range.start_date, current_date_range.end_date, "YYYY-MM-DD");
            let dateRangeOfPrevious = getDateRange(past_date_range.start_date, past_date_range.end_date, "YYYY-MM-DD");
            let arrayOfDatesOfCurrent = dateRangeOfCurrent.map(function (item: any) { return { 'created_date': item } });
            let arrayOfDatesOfPrevious = dateRangeOfPrevious.map(function (item: any) { return { 'created_date': item } });
            for (let obj of arrayOfDatesOfCurrent) {
                for (let value of yearData) {
                    if (obj.created_date == value.created_date) {
                        if (filterCurrentData.includes(value.coupon_amount)) {
                            current_tot += value.coupon_amount;
                        } else {
                            filterCurrentData.push(value.coupon_amount);
                            current_tot += value.coupon_amount;
                        }
                        current_orders++;
                    }
                }
            }
            for (let obj of arrayOfDatesOfPrevious) {
                for (let value of yearData) {
                    if (obj.created_date == value.created_date) {
                        if (filterPastData.includes(value.coupon_amount)) {
                            past_tot += value.coupon_amount;
                        } else {
                            filterPastData.push(value.coupon_amount);
                            past_tot += value.coupon_amount;
                        }
                        past_orders++;
                    }
                }
            }

            let reports: any = {};
            reports.amount = {
                "value": parseFloat(current_tot.toFixed(2)),
                "previousPeriodValue": parseFloat(past_tot.toFixed(2))
            }
            reports.discount_orders = {
                "value": current_orders,
                "previousPeriodValue": past_orders
            }

            if (yearData.length > 0) {
                new SuccessResponse(EC.success, {
                    reports
                }).send(res);
            }
            else {
                new SuccessResponse(EC.noDataFound, {
                    reports: {
                        discount_orders: {
                            value: 0,
                            previousPeriodValue: 0,
                        },
                        amount: {
                            value: 0,
                            previousPeriodValue: 0,
                        },
                    }
                }).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getCouponUsedChartData(req: Request, res: Response) {
        try {
            let { current_range, previous_range, filter, type, site_id } = req.body;
            let whereStatement: any = {}
            //filter 
            if (site_id) {
                whereStatement.site_id = site_id
            }
            let attributes: any = ["coupon_amount",
                [dbReader.Sequelize.literal('`user_order_items`.`product_name`'), 'product_name'],
                [dbReader.Sequelize.literal('`user_order_items`.`user_orders_id`'), 'user_orders_id'],
                [dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m-%d'), 'created_datetime']
            ];
            switch (filter) {
                case "hour":
                    attributes = [[dbReader.Sequelize.literal('`user_order_items`.`product_amount`'), "coupon_amount"],
                    [dbReader.Sequelize.literal('`user_order_items`.`product_name`'), 'product_name'],
                    [dbReader.Sequelize.literal('`user_order_items`.`user_orders_id`'), 'user_orders_id'],
                    [dbReader.Sequelize.literal('`user_orders`.`created_datetime`'), 'created_datetime']
                    ];
                    break;
            }
            let includeCondition = [
                {
                    required: true,
                    model: dbReader.userOrderItems,
                    attributes: [],
                    where: {
                        item_type: 5
                    }
                }
            ];

            let whereCondition = dbReader.sequelize.and(
                whereStatement,
                dbReader.Sequelize.or(
                    dbReader.Sequelize.and(
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_orders.created_datetime`'), '%Y-%m-%d'), { [Op.gte]: current_range.start_date }),
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_orders.created_datetime`'), '%Y-%m-%d'), { [Op.lte]: current_range.end_date })
                    ),
                    dbReader.Sequelize.and(
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('user_orders.created_datetime`'), '%Y-%m-%d'), { [Op.gte]: previous_range.start_date }),
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_orders.created_datetime`'), '%Y-%m-%d'), { [Op.lte]: previous_range.end_date })
                    ),
                ),
                { order_status: [2, 3, 4, 5, 6, 8] }
            );

            let yearData = await dbReader.userOrder.findAll({
                attributes: attributes,
                where: whereCondition,
                include: includeCondition
            })

            if (yearData.length > 0) {
                yearData = JSON.parse(JSON.stringify(yearData));
                let dateRange, arrayOfDatesOfCurrent: any = [], arrayOfDatesOfPrevious: any = [], filterCurrentData: any = [], filterPastData: any = [];

                let getCounts = (arrCurrent: any, arrPrevious: any, type1: string) => {
                    let final: any = [];
                    if (type1 == 'hour') {
                        for (let ele of arrCurrent) {
                            for (let obj of ele) {
                                for (let value of yearData) {
                                    if (obj.created_date == moment(value.created_datetime).format("YYYY-MM-DD HH")) {
                                        if (type == 'amount') {
                                            if (filterCurrentData.includes(value.coupon_amount)) {
                                                obj.current += value.coupon_amount;
                                            } else {
                                                filterCurrentData.push(value.coupon_amount);
                                                obj.current += value.coupon_amount;
                                            }
                                        } else {
                                            obj.current++;
                                        }
                                    }
                                }
                            }
                        }
                        for (let ele of arrPrevious) {
                            for (let obj of ele) {
                                for (let value of yearData) {
                                    if (obj.created_date == moment(value.created_datetime).format("YYYY-MM-DD HH")) {
                                        if (type == 'amount') {
                                            if (filterPastData.includes(value.coupon_amount)) {
                                                obj.previous += value.coupon_amount;
                                            } else {
                                                filterPastData.push(value.coupon_amount);
                                                obj.previous += value.coupon_amount;
                                            }
                                        } else {
                                            obj.previous++;
                                        }
                                    }
                                }
                            }
                        }
                        for (let i = 0; i < arrCurrent.length; i++) {
                            let current: any = { "current_count": 0 }, previous: any = { "previous_count": 0 };
                            for (let j = 0; j < arrCurrent[i].length; j++) {
                                current.start_date = arrCurrent[i][j].start_date;
                                current.end_date = arrCurrent[i][j].end_date;
                                current.current_count += arrCurrent[i][j].current;
                            }
                            for (let j = 0; j < arrPrevious[i].length; j++) {
                                previous.start_date = arrPrevious[i][j].start_date;
                                previous.end_date = arrPrevious[i][j].end_date;
                                previous.previous_count += arrPrevious[i][j].previous;
                            }
                            final.push({ "current": current, "previous": previous });
                        }
                    } else {
                        for (let ele of arrCurrent) {
                            for (let obj of ele) {
                                for (let value of yearData) {
                                    if (obj.created_date == value.created_datetime) {
                                        if (type == 'amount') {
                                            if (filterCurrentData.includes(value.coupon_amount)) {
                                                obj.current += value.coupon_amount;
                                            } else {
                                                filterCurrentData.push(value.coupon_amount);
                                                obj.current += value.coupon_amount;
                                            }
                                        } else {
                                            obj.current++;
                                        }
                                    }
                                }
                            }
                        }
                        for (let ele of arrPrevious) {
                            for (let obj of ele) {
                                for (let value of yearData) {
                                    if (obj.created_date == value.created_datetime) {
                                        if (type == 'amount') {
                                            if (filterPastData.includes(value.coupon_amount)) {
                                                obj.previous += value.coupon_amount;
                                            } else {
                                                filterPastData.push(value.coupon_amount);
                                                obj.previous += value.coupon_amount;
                                            }
                                        } else {
                                            obj.previous++;
                                        }
                                    }
                                }
                            }
                        }
                        for (let i = 0; i < arrCurrent.length; i++) {
                            let current: any = { "current_count": 0 }, previous: any = { "previous_count": 0 };
                            for (let j = 0; j < arrCurrent[i].length; j++) {
                                current.start_date = arrCurrent[i][j].start_date;
                                current.end_date = arrCurrent[i][j].end_date;
                                current.current_count += arrCurrent[i][j].current;
                            }
                            for (let j = 0; j < arrPrevious[i].length; j++) {
                                previous.start_date = arrPrevious[i][j].start_date;
                                previous.end_date = arrPrevious[i][j].end_date;
                                previous.previous_count += arrPrevious[i][j].previous;
                            }
                            final.push({ "current": current, "previous": previous });
                        }
                        final.reverse();
                    }
                    let current_count = 0, previous_count = 0;
                    final.forEach((e: any) => {
                        current_count += e.current.current_count;
                        previous_count += e.previous.previous_count;
                    });
                    return { current_count, previous_count, final };
                }
                switch (filter) {
                    case 'day': //by day
                        var daysOfYear1: any = [], daysOfYear2: any = [];
                        let dateRangeOfCurrent = getDateRange(current_range.start_date, current_range.end_date, "YYYY-MM-DD");
                        let dateRangeOfPrevious = getDateRange(previous_range.start_date, previous_range.end_date, "YYYY-MM-DD");
                        daysOfYear1 = dateRangeOfCurrent.map(function (item: any) { return { 'created_date': item, 'start_date': item, 'end_date': item, 'current': 0 } });
                        daysOfYear2 = dateRangeOfPrevious.map(function (item: any) { return { 'created_date': item, 'start_date': item, 'end_date': item, 'previous': 0 } });
                        daysOfYear1.reverse(); daysOfYear2.reverse();
                        for (let ele of daysOfYear1) {
                            for (let value of yearData) {
                                if (ele.created_date == value.created_datetime) {
                                    if (type == 'amount') {
                                        if (filterCurrentData.includes(value.coupon_amount)) {
                                            ele.current += value.coupon_amount;
                                        } else {
                                            filterCurrentData.push(value.coupon_amount);
                                            ele.current += value.coupon_amount;
                                        }
                                    } else {
                                        ele.current++;
                                    }
                                }
                            }
                        }
                        for (let ele of daysOfYear2) {
                            for (let value of yearData) {
                                if (ele.created_date == value.created_datetime) {
                                    if (type == 'amount') {
                                        if (filterPastData.includes(value.coupon_amount)) {
                                            ele.previous += value.coupon_amount;
                                        } else {
                                            filterPastData.push(value.coupon_amount);
                                            ele.previous += value.coupon_amount;
                                        }
                                    } else {
                                        ele.previous++;
                                    }
                                }
                            }
                        } let final: any = [];
                        for (let i = 0; i < Math.min(daysOfYear1.length, daysOfYear2.length); i++) {
                            let current: any = { "current_count": 0 }, previous: any = { "previous_count": 0 };
                            current.start_date = daysOfYear1[i].start_date;
                            current.end_date = daysOfYear1[i].end_date;
                            current.current_count = daysOfYear1[i].current;
                            previous.start_date = daysOfYear2[i].start_date;
                            previous.end_date = daysOfYear2[i].end_date;
                            previous.previous_count = daysOfYear2[i].previous;
                            final.push({ "current": current, "previous": previous });
                        }
                        //  final.reverse();
                        let current_count = 0, previous_count = 0;
                        final.forEach((e: any) => {
                            current_count += e.current.current_count;
                            previous_count += e.previous.previous_count;
                        });
                        new SuccessResponse(EC.errorMessage(EC.getMessage, ["New Coupon Chart Data"]), { // @ts-ignore
                            token: req.token,
                            current: current_count,
                            previous: previous_count,
                            rows: final
                        }).send(res);
                        break;

                    case "week": //by week
                        moment.updateLocale('in', {
                            week: {
                                dow: 1 // Monday is the first day of the week
                            }
                        });
                        var now1 = new Date(current_range.end_date);
                        var daysOfYear1: any = [];
                        for (var d = new Date(current_range.start_date); d <= now1; d.setDate(d.getDate() + 1)) {
                            let week = moment(d).week();
                            if (daysOfYear1.some((s: any) => s.week == week)) {
                                let fi = daysOfYear1.findIndex((s: any) => s.week == week)
                                daysOfYear1[fi].end_date = moment(d).format('YYYY-MM-DD')
                            } else {
                                daysOfYear1.push({
                                    week: week,
                                    start_date: moment(d).format('YYYY-MM-DD'),
                                    end_date: moment(d).format('YYYY-MM-DD')
                                })
                            }
                        }
                        var now2 = new Date(previous_range.end_date);
                        var daysOfYear2: any = [];
                        for (var d = new Date(previous_range.start_date); d <= now2; d.setDate(d.getDate() + 1)) {
                            let week = moment(d).week();
                            if (daysOfYear2.some((s: any) => s.week == week)) {
                                let fi = daysOfYear2.findIndex((s: any) => s.week == week)
                                daysOfYear2[fi].end_date = moment(d).format('YYYY-MM-DD')
                            } else {
                                daysOfYear2.push({
                                    week: week,
                                    start_date: moment(d).format('YYYY-MM-DD'),
                                    end_date: moment(d).format('YYYY-MM-DD')
                                })
                            }
                        } daysOfYear1.reverse(); daysOfYear2.reverse();
                        for (let index = 0; index < Math.min(daysOfYear1.length, daysOfYear2.length); index++) {
                            let startDate1 = daysOfYear1[index].start_date;
                            let lastDate1 = daysOfYear1[index].end_date;
                            let startDate2 = daysOfYear2[index].start_date;
                            let lastDate2 = daysOfYear2[index].end_date;
                            dateRange = getDateRange(startDate1, lastDate1, "YYYY-MM-DD");
                            arrayOfDatesOfCurrent.push(dateRange.map(function (item) { return { 'created_date': item, 'start_date': startDate1, 'end_date': lastDate1, 'current': 0 } }));
                            dateRange = getDateRange(startDate2, lastDate2, "YYYY-MM-DD");
                            arrayOfDatesOfPrevious.push(dateRange.map(function (item) { return { 'created_date': item, 'start_date': startDate2, 'end_date': lastDate2, 'previous': 0 } }));
                        }
                        let result1 = getCounts(arrayOfDatesOfCurrent, arrayOfDatesOfPrevious, filter);
                        new SuccessResponse(EC.errorMessage(EC.getMessage, ["New Coupon Chart Data"]), { // @ts-ignore
                            token: req.token,
                            current: result1.current_count,
                            previous: result1.previous_count,
                            rows: result1.final
                        }).send(res);
                        break;
                    case 'month': //by week
                        var now1 = new Date(current_range.end_date);
                        var daysOfYear1: any = [];
                        for (var d = new Date(current_range.start_date); d <= now1; d.setDate(d.getDate() + 1)) {
                            let month = moment(d).format('MM');
                            if (daysOfYear1.some((s: any) => s.month == month)) {
                                let fi = daysOfYear1.findIndex((s: any) => s.month == month)
                                daysOfYear1[fi].end_date = moment(d).format('YYYY-MM-DD')
                            } else {
                                daysOfYear1.push({
                                    month: month,
                                    start_date: moment(d).format('YYYY-MM-DD'),
                                    end_date: moment(d).format('YYYY-MM-DD')
                                })
                            }
                        }
                        var now2 = new Date(previous_range.end_date);
                        var daysOfYear2: any = [];
                        for (var d = new Date(previous_range.start_date); d <= now2; d.setDate(d.getDate() + 1)) {
                            let month = moment(d).format('MM');
                            if (daysOfYear2.some((s: any) => s.month == month)) {
                                let fi = daysOfYear2.findIndex((s: any) => s.month == month)
                                daysOfYear2[fi].end_date = moment(d).format('YYYY-MM-DD')
                            } else {
                                daysOfYear2.push({
                                    month: month,
                                    start_date: moment(d).format('YYYY-MM-DD'),
                                    end_date: moment(d).format('YYYY-MM-DD')
                                })
                            }
                        }
                        daysOfYear1.reverse(); daysOfYear2.reverse();
                        for (let index = 0; index < Math.min(daysOfYear1.length, daysOfYear2.length); index++) {
                            let startDate1 = daysOfYear1[index].start_date;
                            let lastDate1 = daysOfYear1[index].end_date;
                            let startDate2 = daysOfYear2[index].start_date;
                            let lastDate2 = daysOfYear2[index].end_date;
                            dateRange = getDateRange(startDate1, lastDate1, "YYYY-MM-DD");
                            arrayOfDatesOfCurrent.push(dateRange.map(function (item) { return { 'created_date': item, 'start_date': startDate1, 'end_date': lastDate1, 'current': 0 } }));
                            dateRange = getDateRange(startDate2, lastDate2, "YYYY-MM-DD");
                            arrayOfDatesOfPrevious.push(dateRange.map(function (item) { return { 'created_date': item, 'start_date': startDate2, 'end_date': lastDate2, 'previous': 0 } }));
                        }
                        let result2 = getCounts(arrayOfDatesOfCurrent, arrayOfDatesOfPrevious, filter);
                        new SuccessResponse(EC.errorMessage(EC.getMessage, ["New Subscription Chart Data"]), { // @ts-ignore
                            token: req.token,
                            current: result2.current_count,
                            previous: result2.previous_count,
                            rows: result2.final
                        }).send(res);
                        break;
                    case 'quarter': //by quarter
                        var daysOfYear1: any = [], daysOfYear2: any = [];
                        for (let m = moment(current_range.start_date); m <= moment(current_range.end_date); m.add(3, 'M')) {
                            let _currentStartDate = m.format("YYYY-MM-DD"),
                                _actualStartDate = moment(current_range.start_date).format("YYYY-MM-DD"),
                                _lastDate = moment(moment(m).add(3, 'M')).format("YYYY-MM-DD"),
                                _actualEndDate = moment(current_range.end_date).format("YYYY-MM-DD");
                            if ((_lastDate <= _actualEndDate || _actualEndDate >= _currentStartDate) && _actualStartDate <= _currentStartDate) {
                                dateRange = getDateRange(m, _lastDate, "YYYY-MM-DD");
                                daysOfYear1.push(dateRange.map(function (item: any) { return { 'created_date': item, 'start_date': _currentStartDate, 'end_date': _lastDate, 'current': 0 } }));
                            }
                        }
                        for (let m = moment(previous_range.start_date); m <= moment(previous_range.end_date); m.add(3, 'M')) {
                            let _currentStartDate = m.format("YYYY-MM-DD"),
                                _actualStartDate = moment(previous_range.start_date).format("YYYY-MM-DD"),
                                _lastDate = moment(moment(m).add(3, 'M')).format("YYYY-MM-DD"),
                                _actualEndDate = moment(previous_range.end_date).format("YYYY-MM-DD");
                            if ((_lastDate <= _actualEndDate || _actualEndDate >= _currentStartDate) && _actualStartDate <= _currentStartDate) {
                                dateRange = getDateRange(m, _lastDate, "YYYY-MM-DD");
                                daysOfYear2.push(dateRange.map(function (item: any) { return { 'created_date': item, 'start_date': _currentStartDate, 'end_date': _lastDate, 'previous': 0 } }));
                            }
                        }
                        daysOfYear1.reverse(); daysOfYear2.reverse();
                        for (let index = 0; index < Math.min(daysOfYear1.length, daysOfYear2.length); index++) {
                            arrayOfDatesOfCurrent.push(daysOfYear1[index]);
                            arrayOfDatesOfPrevious.push(daysOfYear2[index]);
                        }
                        let result3 = getCounts(arrayOfDatesOfCurrent, arrayOfDatesOfPrevious, filter);
                        new SuccessResponse(EC.errorMessage(EC.getMessage, ["New Subscription Chart Data"]), { // @ts-ignore
                            token: req.token,
                            current: result3.current_count,
                            previous: result3.previous_count,
                            rows: result3.final
                        }).send(res);
                        break;
                    case 'hour': //by hour
                        for (let m = moment(current_range.start_date).set({ hour: 0, minute: 0, second: 0 }); m <= moment(current_range.end_date).set({ hour: 23, minute: 59, second: 59 }); m.add(1, 'hours')) {
                            let _currentStartDate = m.format("YYYY-MM-DD HH:mm"),
                                _actualStartDate = moment(current_range.start_date).format("YYYY-MM-DD HH:mm"),
                                _lastDate = moment(m).format("YYYY-MM-DD HH:mm"),
                                _actualEndDate = moment(current_range.end_date).set({ hour: 23, minute: 59, second: 59 }).format("YYYY-MM-DD HH:mm");
                            if ((_lastDate <= _actualEndDate || _actualEndDate >= _currentStartDate) && _actualStartDate <= _currentStartDate) {
                                dateRange = getDateRange(m, _lastDate, "YYYY-MM-DD HH");
                                arrayOfDatesOfCurrent.push(dateRange.map(function (item: any) { return { 'created_date': item, 'start_date': _currentStartDate, 'end_date': _lastDate, 'current': 0 } }));
                            }
                            _lastDate = moment(moment(m).add(1, 'hours')).format("YYYY-MM-DD HH:mm");
                        }
                        for (let m = moment(previous_range.start_date).set({ hour: 0, minute: 0, second: 0 }); m <= moment(previous_range.end_date).set({ hour: 23, minute: 59, second: 59 }); m.add(1, 'hours')) {
                            let _currentStartDate = m.format("YYYY-MM-DD HH:mm"),
                                _actualStartDate = moment(previous_range.start_date).format("YYYY-MM-DD HH:mm"),
                                _lastDate = moment(m).format("YYYY-MM-DD HH:mm"),
                                _actualEndDate = moment(previous_range.end_date).set({ hour: 23, minute: 59, second: 59 }).format("YYYY-MM-DD HH:mm");
                            if ((_lastDate <= _actualEndDate || _actualEndDate >= _currentStartDate) && _actualStartDate <= _currentStartDate) {
                                dateRange = getDateRange(m, _lastDate, "YYYY-MM-DD HH");
                                arrayOfDatesOfPrevious.push(dateRange.map(function (item: any) { return { 'created_date': item, 'start_date': _currentStartDate, 'end_date': _lastDate, 'previous': 0 } }));
                            }
                            _lastDate = moment(moment(m).add(1, 'hours')).format("YYYY-MM-DD HH:mm")
                        }
                        let result4 = getCounts(arrayOfDatesOfCurrent, arrayOfDatesOfPrevious, filter);
                        new SuccessResponse(EC.errorMessage(EC.getMessage, ["New Subscription Chart Data"]), { // @ts-ignore
                            token: req.token,
                            current: result4.current_count,
                            previous: result4.previous_count,
                            rows: result4.final
                        }).send(res);
                        break;
                }

            } else new SuccessResponse(EC.noDataFound, {
                rows: []
            }).send(res);

        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getCouponUserListData(req: Request, res: Response) {
        try {
            let { current_date_range } = req.body;
            let { sort_field, sort_order, site_id } = req.body;
            let whereStatement: any = {}

            //filter 
            if (site_id) {
                whereStatement.site_id = site_id
            }

            //Pagination
            var limit = req.body.page_record == undefined ? 10 : parseInt(req.body.page_record);
            var offset = req.body.page_no == undefined ? 1 : parseInt(req.body.page_no);
            // Automatic Offset and limit will set on the base of page number
            var row_limit = limit;
            var row_offset = (offset * limit) - limit;

            // if (sort_field == 'product_name') {
            //     sort_field = dbReader.Sequelize.literal('`user_order_items`.`product_name`');
            // } else if (sort_field == 'coupon_amount') {
            //     sort_field = dbReader.Sequelize.literal('`user_orders`.`coupon_amount`');
            // } else if (sort_field == 'orders') {
            //     sort_field = dbReader.Sequelize.fn("COUNT", dbReader.Sequelize.literal('`user_order_items`.`product_name`'));
            // } else sort_field = sort_field;
            // sort_field = sort_field ? sort_field : dbReader.Sequelize.fn("COUNT", dbReader.Sequelize.literal('`user_order_items`.`product_name`'));
            // sort_order = sort_order ? sort_order : 'DESC';


            //Searching
            var searchCondition = dbReader.Sequelize.Op.ne, searchData = null;
            if (req.body.search) {
                searchCondition = Op.like;
                searchData = '%' + req.body.search + '%';
            }

            let includeCondition = [{
                required: true,
                model: dbReader.userOrderItems,
                attributes: [],
                where: {
                    item_type: 5
                }
            }];

            let whereCondition = dbReader.sequelize.and(
                whereStatement,
                dbReader.Sequelize.and(
                    dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_orders.created_datetime`'), '%Y-%m-%d'), { [Op.gte]: current_date_range.start_date }),
                    dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_orders.created_datetime`'), '%Y-%m-%d'), { [Op.lte]: current_date_range.end_date })
                ),
                { order_status: [2, 3, 4, 5, 6, 8] },
                dbReader.Sequelize.or(
                    [dbReader.Sequelize.where(dbReader.sequelize.col('`user_order_items`.`product_name`'), { [searchCondition]: searchData })],
                    // { product_id: { [searchCondition]: searchData } },
                    // { product_name: { [searchCondition]: searchData } },
                    // { product_price: { [searchCondition]: searchData } }
                )
            );
            let data = await dbReader.userOrder.findAll({
                attributes: [[dbReader.Sequelize.literal('`user_order_items`.`product_amount`'), "coupon_amount"],
                [dbReader.Sequelize.literal('`user_order_items`.`product_name`'), 'product_name'],
                [dbReader.Sequelize.literal('`user_order_items`.`user_orders_id`'), 'user_orders_id'],
                [dbReader.Sequelize.literal('`user_order_items`.`product_id`'), 'product_id'],
                [dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('`user_orders`.`created_datetime`'), '%Y-%m-%d'), 'created_date']
                ],
                where: whereCondition,
                include: includeCondition
            })

            data = JSON.parse(JSON.stringify(data));

            let arrayOfDatesOfCurrent = Array.from(new Set(data.map((item: any) => item.product_name))).map(function (item: any) { return { 'product_name': item, "orders": 0, "amount_discounted": 0, "created_date": '', "coupon_amount": 0, "user_orders_id": 0, "product_id": 0 } });

            let current_orders = 0, current_tot = 0;

            for (let obj of arrayOfDatesOfCurrent) {
                for (let value of data) {
                    if (obj.product_name == value.product_name) {
                        obj.amount_discounted += value.coupon_amount;
                        obj.created_date = value.created_date;
                        obj.coupon_amount = value.coupon_amount;
                        obj.product_id = value.product_id;
                        obj.user_orders_id = value.user_orders_id;
                        obj.orders++;
                    }
                }
            }

            arrayOfDatesOfCurrent.sort(function (a: any, b: any) {
                if (sort_order == 'ASC') {
                    return a[sort_field] - b[sort_field];
                } else if (sort_order == 'DESC') {
                    return b[sort_field] - a[sort_field];
                } else {
                    return b.product_name - a.product_name;
                }
            });

            arrayOfDatesOfCurrent.forEach((e: any) => { current_orders += e.orders, current_tot += e.amount_discounted; })

            let dataCount = arrayOfDatesOfCurrent.length;

            arrayOfDatesOfCurrent = arrayOfDatesOfCurrent.splice(row_offset, row_limit);
            if (arrayOfDatesOfCurrent.length > 0) {
                new SuccessResponse(EC.success, {
                    count: dataCount,
                    rows: arrayOfDatesOfCurrent,
                    coupon_count: arrayOfDatesOfCurrent.length,
                    amount_discounted: current_tot,
                    orders: current_orders
                }).send(res);
            }
            else {
                new SuccessResponse(EC.noDataFound, {
                    count: 0,
                    rows: [],
                    coupon_count: 0,
                    amount_discounted: 0,
                    orders: 0
                }).send(res);
            }

        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
}