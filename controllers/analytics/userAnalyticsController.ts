import { ErrorController, SuccessResponse, BadRequestError, ApiError } from '../../core/index';
import { getDateRange } from '../../helpers/helpers';
import { Request, Response } from 'express';
import moment from 'moment';
import { enumerationController } from '../enumerationController';
const { dbReader } = require('../../models/dbConfig');
const EC = new ErrorController();
var EnumObject = new enumerationController();

export class UserAnalyticsController {

    public async getUserCounts(req: Request, res: Response) {
        try {
            let { current_year_date_range, past_year_date_range, site_id = 0 } = req.body;
            let current_start_date = current_year_date_range ? current_year_date_range.start_date : "";
            let current_end_date = current_year_date_range ? current_year_date_range.end_date : "";
            let past_start_date = past_year_date_range ? past_year_date_range.start_date : "";
            let past_end_date = past_year_date_range ? past_year_date_range.end_date : "";
            site_id = site_id ? site_id : [1, 2, 3, 4, 5, 6];

            if (current_start_date && current_end_date && past_start_date && past_end_date) {
                let freeUserData = await dbReader.users.findAll({
                    attributes: ["user_id", [dbReader.Sequelize.literal('DATE_FORMAT(`created_datetime`,"%Y-%m-%d")'), 'created_date'], [dbReader.Sequelize.literal(`(select count(1) from sycu_user_subscriptions where subscription_status IN (2, 4) AND user_id = sycu_users.user_id)`), "uct"]],
                    where: dbReader.Sequelize.and(
                        dbReader.Sequelize.or(dbReader.Sequelize.and(
                            dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('sycu_users.created_datetime'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.gte]: current_start_date }),
                            dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('sycu_users.created_datetime'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.lte]: current_end_date })
                        ), dbReader.Sequelize.and(
                            dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('sycu_users.created_datetime'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.gte]: past_start_date }),
                            dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('sycu_users.created_datetime'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.lte]: past_end_date })
                        )),
                        { is_deleted: 0 },
                        { via_portal: site_id }
                    )
                });

                let filterCurrentDataFreeUsers = [], filterPastDataFreeUsers = [];
                let filterCurrentDataPaidUsers = [], filterPastDataPaidUsers = [];
                freeUserData = JSON.parse(JSON.stringify(freeUserData));
                freeUserData.filter(function (e: any, i: any) {
                    if (e.uct == 0) {
                        if (e.created_date >= current_start_date && e.created_date <= current_end_date) {
                            filterCurrentDataFreeUsers.push(e);
                        }
                        if (e.created_date >= past_start_date && e.created_date <= past_end_date) {
                            filterPastDataFreeUsers.push(e);
                        }
                    } else {
                        if (e.created_date >= current_start_date && e.created_date <= current_end_date) {
                            filterCurrentDataPaidUsers.push(e);
                        }
                        if (e.created_date >= past_start_date && e.created_date <= past_end_date) {
                            filterPastDataPaidUsers.push(e);
                        }
                    }
                });

                new SuccessResponse(EC.errorMessage(EC.success), {
                    // @ts-ignore
                    token: req.token,
                    registered_users: {
                        value: filterCurrentDataPaidUsers.length + filterCurrentDataFreeUsers.length,
                        previousPeriodValue: filterPastDataPaidUsers.length + filterPastDataFreeUsers.length,
                    },
                    free_users: {
                        value: filterCurrentDataFreeUsers.length,
                        previousPeriodValue: filterPastDataFreeUsers.length,
                    },
                    subscribe_users: {
                        value: filterCurrentDataPaidUsers.length,
                        previousPeriodValue: filterPastDataPaidUsers.length,
                    },
                }).send(res);
            } else {
                throw new Error(EC.errorMessage("Please provide all data."));
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getFreeUserGraphData(req: Request, res: Response) {
        try {
            let { current_year_date_range, past_year_date_range, by = "", site_id = 0 } = req.body, graphData: any;
            let current_start_date = current_year_date_range ? current_year_date_range.start_date : "";
            let current_end_date = current_year_date_range ? current_year_date_range.end_date : "";
            let past_start_date = past_year_date_range ? past_year_date_range.start_date : "";
            let past_end_date = past_year_date_range ? past_year_date_range.end_date : "";
            let attributes = (by == "hour") ? ['created_datetime'] : [[dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`sycu_users`.`created_datetime`'), '%Y-%m-%d'), 'created_datetime']];
            site_id = site_id ? site_id : [1, 2, 3, 4, 5, 6];

            if (current_start_date && current_end_date && past_start_date && past_end_date) {
                graphData = await dbReader.users.findAll({
                    attributes: attributes,
                    where: dbReader.Sequelize.and(
                        dbReader.Sequelize.or(
                            dbReader.Sequelize.and(
                                dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('sycu_users.created_datetime'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.gte]: current_start_date }),
                                dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('sycu_users.created_datetime'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.lte]: current_end_date })
                            ), dbReader.Sequelize.and(
                                dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('sycu_users.created_datetime'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.gte]: past_start_date }),
                                dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('sycu_users.created_datetime'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.lte]: past_end_date })
                            )
                        ),
                        dbReader.Sequelize.where(dbReader.Sequelize.literal(`(select count(1) from sycu_user_subscriptions where subscription_status IN (2, 4) AND user_id = sycu_users.user_id)`), { [dbReader.Sequelize.Op.eq]: 0 }),
                        { via_portal: site_id },
                        { is_deleted: 0 },
                    ),
                    include: [{
                        separate: true,
                        model: dbReader.userSubscription,
                        attributes: ["user_subscription_id", "subscription_status"],
                        where: { subscription_status: [3, 5, 6, 7] },
                    }]
                });
                if (graphData.length) {
                    graphData = JSON.parse(JSON.stringify(graphData));
                    let dateRange, arrayOfDatesOfCurrent: any = [], arrayOfDatesOfPrevious: any = [];
                    let getCounts = (arrCurrent: any, arrPrevious: any, type: string) => {
                        let final: any = [];
                        if (type == 'hour') {
                            for (let ele of arrCurrent) {
                                for (let obj of ele) {
                                    for (let value of graphData) {
                                        if (obj.created_date == moment(value.created_datetime).format("YYYY-MM-DD HH")) {
                                            obj.current++;
                                        }
                                    }
                                }
                            }
                            for (let ele of arrPrevious) {
                                for (let obj of ele) {
                                    for (let value of graphData) {
                                        if (obj.created_date == moment(value.created_datetime).format("YYYY-MM-DD HH")) {
                                            obj.previous++;
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
                                    for (let value of graphData) {
                                        if (obj.created_date == value.created_datetime) {
                                            obj.current++;
                                        }
                                    }
                                }
                            }
                            for (let ele of arrPrevious) {
                                for (let obj of ele) {
                                    for (let value of graphData) {
                                        if (obj.created_date == value.created_datetime) {
                                            obj.previous++;
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
                    switch (by) {
                        case "day":
                            var daysOfYear1: any = [], daysOfYear2: any = [];
                            let dateRangeOfCurrent = getDateRange(current_start_date, current_end_date, "YYYY-MM-DD");
                            let dateRangeOfPrevious = getDateRange(past_start_date, past_end_date, "YYYY-MM-DD");
                            daysOfYear1 = dateRangeOfCurrent.map(function (item: any) { return { 'created_date': item, 'start_date': item, 'end_date': item, 'current': 0 } });
                            daysOfYear2 = dateRangeOfPrevious.map(function (item: any) { return { 'created_date': item, 'start_date': item, 'end_date': item, 'previous': 0 } });
                            daysOfYear1.reverse(); daysOfYear2.reverse();
                            for (let ele of daysOfYear1) {
                                for (let value of graphData) {
                                    if (ele.created_date == value.created_datetime) {
                                        ele.current++;
                                    }
                                }
                            }
                            for (let ele of daysOfYear2) {
                                for (let value of graphData) {
                                    if (ele.created_date == value.created_datetime) {
                                        ele.previous++;
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
                            let current_count = 0, previous_count = 0;
                            final.forEach((e: any) => {
                                current_count += e.current.current_count;
                                previous_count += e.previous.previous_count;
                            });
                            new SuccessResponse(EC.errorMessage(EC.getMessage), {
                                // @ts-ignore
                                token: req.token,
                                current: current_count,
                                previous: previous_count,
                                rows: final
                            }).send(res);
                            break;
                        case "week":
                            moment.updateLocale('in', {
                                week: {
                                    dow: 1 // Monday is the first day of the week
                                }
                            });
                            var now1 = new Date(current_end_date);
                            var daysOfYear1: any = [];
                            for (var d = new Date(current_start_date); d <= now1; d.setDate(d.getDate() + 1)) {
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
                            var now2 = new Date(past_end_date);
                            var daysOfYear2: any = [];
                            for (var d = new Date(past_start_date); d <= now2; d.setDate(d.getDate() + 1)) {
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
                            let result1 = getCounts(arrayOfDatesOfCurrent, arrayOfDatesOfPrevious, by);
                            new SuccessResponse(EC.errorMessage(EC.getMessage), {
                                // @ts-ignore
                                token: req.token,
                                current: result1.current_count,
                                previous: result1.previous_count,
                                rows: result1.final
                            }).send(res);
                            break;
                        case 'month':
                            var now1 = new Date(current_end_date);
                            var daysOfYear1: any = [];
                            for (var d = new Date(current_start_date); d <= now1; d.setDate(d.getDate() + 1)) {
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
                            var now2 = new Date(past_end_date);
                            var daysOfYear2: any = [];
                            for (var d = new Date(past_start_date); d <= now2; d.setDate(d.getDate() + 1)) {
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
                            let result2 = getCounts(arrayOfDatesOfCurrent, arrayOfDatesOfPrevious, by);
                            new SuccessResponse(EC.errorMessage(EC.getMessage), {
                                // @ts-ignore
                                token: req.token,
                                current: result2.current_count,
                                previous: result2.previous_count,
                                rows: result2.final
                            }).send(res);
                            break;
                        case 'quarter':
                            var daysOfYear1: any = [], daysOfYear2: any = [];
                            for (let m = moment(current_start_date); m <= moment(current_end_date); m.add(3, 'M')) {
                                let _currentStartDate = m.format("YYYY-MM-DD"),
                                    _actualStartDate = moment(current_start_date).format("YYYY-MM-DD"),
                                    _lastDate = moment(moment(m).add(3, 'M')).format("YYYY-MM-DD"),
                                    _actualEndDate = moment(current_end_date).format("YYYY-MM-DD");
                                if ((_lastDate <= _actualEndDate || _actualEndDate >= _currentStartDate) && _actualStartDate <= _currentStartDate) {
                                    dateRange = getDateRange(m, _lastDate, "YYYY-MM-DD");
                                    daysOfYear1.push(dateRange.map(function (item: any) { return { 'created_date': item, 'start_date': _currentStartDate, 'end_date': _lastDate, 'current': 0 } }));
                                }
                            }
                            for (let m = moment(past_start_date); m <= moment(past_end_date); m.add(3, 'M')) {
                                let _currentStartDate = m.format("YYYY-MM-DD"),
                                    _actualStartDate = moment(past_start_date).format("YYYY-MM-DD"),
                                    _lastDate = moment(moment(m).add(3, 'M')).format("YYYY-MM-DD"),
                                    _actualEndDate = moment(past_end_date).format("YYYY-MM-DD");
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
                            let result3 = getCounts(arrayOfDatesOfCurrent, arrayOfDatesOfPrevious, by);
                            new SuccessResponse(EC.errorMessage(EC.getMessage), {
                                // @ts-ignore
                                token: req.token,
                                current: result3.current_count,
                                previous: result3.previous_count,
                                rows: result3.final
                            }).send(res);
                            break;
                        case 'hour':
                            for (let m = moment(current_start_date).set({ hour: 0, minute: 0, second: 0 }); m <= moment(current_end_date).set({ hour: 23, minute: 59, second: 59 }); m.add(1, 'hours')) {
                                let _currentStartDate = m.format("YYYY-MM-DD HH:mm"),
                                    _actualStartDate = moment(current_start_date).format("YYYY-MM-DD HH:mm"),
                                    _lastDate = moment(m).format("YYYY-MM-DD HH:mm"),
                                    _actualEndDate = moment(current_end_date).set({ hour: 23, minute: 59, second: 59 }).format("YYYY-MM-DD HH:mm");
                                if ((_lastDate <= _actualEndDate || _actualEndDate >= _currentStartDate) && _actualStartDate <= _currentStartDate) {
                                    dateRange = getDateRange(m, _lastDate, "YYYY-MM-DD HH");
                                    arrayOfDatesOfCurrent.push(dateRange.map(function (item: any) { return { 'created_date': item, 'start_date': _currentStartDate, 'end_date': _lastDate, 'current': 0 } }));
                                }
                                _lastDate = moment(moment(m).add(1, 'hours')).format("YYYY-MM-DD HH:mm");
                            }
                            for (let m = moment(past_start_date).set({ hour: 0, minute: 0, second: 0 }); m <= moment(past_end_date).set({ hour: 23, minute: 59, second: 59 }); m.add(1, 'hours')) {
                                let _currentStartDate = m.format("YYYY-MM-DD HH:mm"),
                                    _actualStartDate = moment(past_start_date).format("YYYY-MM-DD HH:mm"),
                                    _lastDate = moment(m).format("YYYY-MM-DD HH:mm"),
                                    _actualEndDate = moment(past_end_date).set({ hour: 23, minute: 59, second: 59 }).format("YYYY-MM-DD HH:mm");
                                if ((_lastDate <= _actualEndDate || _actualEndDate >= _currentStartDate) && _actualStartDate <= _currentStartDate) {
                                    dateRange = getDateRange(m, _lastDate, "YYYY-MM-DD HH");
                                    arrayOfDatesOfPrevious.push(dateRange.map(function (item: any) { return { 'created_date': item, 'start_date': _currentStartDate, 'end_date': _lastDate, 'previous': 0 } }));
                                }
                                _lastDate = moment(moment(m).add(1, 'hours')).format("YYYY-MM-DD HH:mm");
                            }
                            let result4 = getCounts(arrayOfDatesOfCurrent, arrayOfDatesOfPrevious, by);
                            new SuccessResponse(EC.errorMessage(EC.getMessage), {
                                // @ts-ignore
                                token: req.token,
                                current: result4.current_count,
                                previous: result4.previous_count,
                                rows: result4.final
                            }).send(res);
                            break;
                        default:
                            new SuccessResponse(EC.errorMessage(EC.success), {
                                // @ts-ignore
                                token: req.token,
                                rows: []
                            }).send(res);
                            break;
                    }
                } else new SuccessResponse(EC.noDataFound, {
                    current: 0,
                    previous: 0,
                    rows: []
                }).send(res);
            } else {
                throw new Error(EC.errorMessage("Please provide all data."));
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getSubscribeUserGraphData(req: Request, res: Response) {
        try {
            let { current_year_date_range, past_year_date_range, by = "", site_id = 0 } = req.body, graphData: any;
            let current_start_date = current_year_date_range ? current_year_date_range.start_date : "";
            let current_end_date = current_year_date_range ? current_year_date_range.end_date : "";
            let past_start_date = past_year_date_range ? past_year_date_range.start_date : "";
            let past_end_date = past_year_date_range ? past_year_date_range.end_date : "";
            let attributes = (by == "hour") ? ['created_datetime'] : [[dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`sycu_users`.`created_datetime`'), '%Y-%m-%d'), 'created_datetime']];
            site_id = site_id ? site_id : [1, 2, 3, 4, 5, 6];

            if (current_start_date && current_end_date && past_start_date && past_end_date) {
                graphData = await dbReader.users.findAll({
                    attributes: attributes,
                    where: dbReader.Sequelize.and(
                        dbReader.Sequelize.or(
                            dbReader.Sequelize.and(
                                dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('sycu_users.created_datetime'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.gte]: current_start_date }),
                                dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('sycu_users.created_datetime'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.lte]: current_end_date })
                            ), dbReader.Sequelize.and(
                                dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('sycu_users.created_datetime'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.gte]: past_start_date }),
                                dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('sycu_users.created_datetime'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.lte]: past_end_date })
                            )
                        ),
                        dbReader.Sequelize.where(dbReader.Sequelize.literal('(select count(1) from sycu_user_subscriptions a where a.user_id = sycu_users.user_id and a.subscription_status in (2,4))'), { [dbReader.Sequelize.Op.gt]: 0 }),
                        { via_portal: site_id },
                        { is_deleted: 0 },
                    ),
                });
                if (graphData.length) {
                    graphData = JSON.parse(JSON.stringify(graphData));
                    let dateRange, arrayOfDatesOfCurrent: any = [], arrayOfDatesOfPrevious: any = [];
                    let getCounts = (arrCurrent: any, arrPrevious: any, type: string) => {
                        let final: any = [];
                        if (type == 'hour') {
                            for (let ele of arrCurrent) {
                                for (let obj of ele) {
                                    for (let value of graphData) {
                                        if (obj.created_date == moment(value.created_datetime).format("YYYY-MM-DD HH")) {
                                            obj.current++;
                                        }
                                    }
                                }
                            }
                            for (let ele of arrPrevious) {
                                for (let obj of ele) {
                                    for (let value of graphData) {
                                        if (obj.created_date == moment(value.created_datetime).format("YYYY-MM-DD HH")) {
                                            obj.previous++;
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
                                    for (let value of graphData) {
                                        if (obj.created_date == value.created_datetime) {
                                            obj.current++;
                                        }
                                    }
                                }
                            }
                            for (let ele of arrPrevious) {
                                for (let obj of ele) {
                                    for (let value of graphData) {
                                        if (obj.created_date == value.created_datetime) {
                                            obj.previous++;
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
                    switch (by) {
                        case "day":
                            var daysOfYear1: any = [], daysOfYear2: any = [];
                            let dateRangeOfCurrent = getDateRange(current_start_date, current_end_date, "YYYY-MM-DD");
                            let dateRangeOfPrevious = getDateRange(past_start_date, past_end_date, "YYYY-MM-DD");
                            daysOfYear1 = dateRangeOfCurrent.map(function (item: any) { return { 'created_date': item, 'start_date': item, 'end_date': item, 'current': 0 } });
                            daysOfYear2 = dateRangeOfPrevious.map(function (item: any) { return { 'created_date': item, 'start_date': item, 'end_date': item, 'previous': 0 } });
                            daysOfYear1.reverse(); daysOfYear2.reverse();
                            for (let ele of daysOfYear1) {
                                for (let value of graphData) {
                                    if (ele.created_date == value.created_datetime) {
                                        ele.current++;
                                    }
                                }
                            }
                            for (let ele of daysOfYear2) {
                                for (let value of graphData) {
                                    if (ele.created_date == value.created_datetime) {
                                        ele.previous++;
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
                            let current_count = 0, previous_count = 0;
                            final.forEach((e: any) => {
                                current_count += e.current.current_count;
                                previous_count += e.previous.previous_count;
                            });
                            new SuccessResponse(EC.errorMessage(EC.getMessage), {
                                // @ts-ignore
                                token: req.token,
                                current: current_count,
                                previous: previous_count,
                                rows: final
                            }).send(res);
                            break;
                        case "week":
                            moment.updateLocale('in', {
                                week: {
                                    dow: 1 // Monday is the first day of the week
                                }
                            });
                            var now1 = new Date(current_end_date);
                            var daysOfYear1: any = [];
                            for (var d = new Date(current_start_date); d <= now1; d.setDate(d.getDate() + 1)) {
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
                            var now2 = new Date(past_end_date);
                            var daysOfYear2: any = [];
                            for (var d = new Date(past_start_date); d <= now2; d.setDate(d.getDate() + 1)) {
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
                            let result1 = getCounts(arrayOfDatesOfCurrent, arrayOfDatesOfPrevious, by);
                            new SuccessResponse(EC.errorMessage(EC.getMessage), {
                                // @ts-ignore
                                token: req.token,
                                current: result1.current_count,
                                previous: result1.previous_count,
                                rows: result1.final
                            }).send(res);
                            break;
                        case 'month':
                            var now1 = new Date(current_end_date);
                            var daysOfYear1: any = [];
                            for (var d = new Date(current_start_date); d <= now1; d.setDate(d.getDate() + 1)) {
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
                            var now2 = new Date(past_end_date);
                            var daysOfYear2: any = [];
                            for (var d = new Date(past_start_date); d <= now2; d.setDate(d.getDate() + 1)) {
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
                            let result2 = getCounts(arrayOfDatesOfCurrent, arrayOfDatesOfPrevious, by);
                            new SuccessResponse(EC.errorMessage(EC.getMessage), {
                                // @ts-ignore
                                token: req.token,
                                current: result2.current_count,
                                previous: result2.previous_count,
                                rows: result2.final
                            }).send(res);
                            break;
                        case 'quarter':
                            var daysOfYear1: any = [], daysOfYear2: any = [];
                            for (let m = moment(current_start_date); m <= moment(current_end_date); m.add(3, 'M')) {
                                let _currentStartDate = m.format("YYYY-MM-DD"),
                                    _actualStartDate = moment(current_start_date).format("YYYY-MM-DD"),
                                    _lastDate = moment(moment(m).add(3, 'M')).format("YYYY-MM-DD"),
                                    _actualEndDate = moment(current_end_date).format("YYYY-MM-DD");
                                if ((_lastDate <= _actualEndDate || _actualEndDate >= _currentStartDate) && _actualStartDate <= _currentStartDate) {
                                    dateRange = getDateRange(m, _lastDate, "YYYY-MM-DD");
                                    daysOfYear1.push(dateRange.map(function (item: any) { return { 'created_date': item, 'start_date': _currentStartDate, 'end_date': _lastDate, 'current': 0 } }));
                                }
                            }
                            for (let m = moment(past_start_date); m <= moment(past_end_date); m.add(3, 'M')) {
                                let _currentStartDate = m.format("YYYY-MM-DD"),
                                    _actualStartDate = moment(past_start_date).format("YYYY-MM-DD"),
                                    _lastDate = moment(moment(m).add(3, 'M')).format("YYYY-MM-DD"),
                                    _actualEndDate = moment(past_end_date).format("YYYY-MM-DD");
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
                            let result3 = getCounts(arrayOfDatesOfCurrent, arrayOfDatesOfPrevious, by);
                            new SuccessResponse(EC.errorMessage(EC.getMessage), {
                                // @ts-ignore
                                token: req.token,
                                current: result3.current_count,
                                previous: result3.previous_count,
                                rows: result3.final
                            }).send(res);
                            break;
                        case 'hour':
                            for (let m = moment(current_start_date).set({ hour: 0, minute: 0, second: 0 }); m <= moment(current_end_date).set({ hour: 23, minute: 59, second: 59 }); m.add(1, 'hours')) {
                                let _currentStartDate = m.format("YYYY-MM-DD HH:mm"),
                                    _actualStartDate = moment(current_start_date).format("YYYY-MM-DD HH:mm"),
                                    _lastDate = moment(m).format("YYYY-MM-DD HH:mm"),
                                    _actualEndDate = moment(current_end_date).set({ hour: 23, minute: 59, second: 59 }).format("YYYY-MM-DD HH:mm");
                                if ((_lastDate <= _actualEndDate || _actualEndDate >= _currentStartDate) && _actualStartDate <= _currentStartDate) {
                                    dateRange = getDateRange(m, _lastDate, "YYYY-MM-DD HH");
                                    arrayOfDatesOfCurrent.push(dateRange.map(function (item: any) { return { 'created_date': item, 'start_date': _currentStartDate, 'end_date': _lastDate, 'current': 0 } }));
                                }
                                _lastDate = moment(moment(m).add(1, 'hours')).format("YYYY-MM-DD HH:mm");
                            }
                            for (let m = moment(past_start_date).set({ hour: 0, minute: 0, second: 0 }); m <= moment(past_end_date).set({ hour: 23, minute: 59, second: 59 }); m.add(1, 'hours')) {
                                let _currentStartDate = m.format("YYYY-MM-DD HH:mm"),
                                    _actualStartDate = moment(past_start_date).format("YYYY-MM-DD HH:mm"),
                                    _lastDate = moment(m).format("YYYY-MM-DD HH:mm"),
                                    _actualEndDate = moment(past_end_date).set({ hour: 23, minute: 59, second: 59 }).format("YYYY-MM-DD HH:mm");
                                if ((_lastDate <= _actualEndDate || _actualEndDate >= _currentStartDate) && _actualStartDate <= _currentStartDate) {
                                    dateRange = getDateRange(m, _lastDate, "YYYY-MM-DD HH");
                                    arrayOfDatesOfPrevious.push(dateRange.map(function (item: any) { return { 'created_date': item, 'start_date': _currentStartDate, 'end_date': _lastDate, 'previous': 0 } }));
                                }
                                _lastDate = moment(moment(m).add(1, 'hours')).format("YYYY-MM-DD HH:mm");
                            }
                            let result4 = getCounts(arrayOfDatesOfCurrent, arrayOfDatesOfPrevious, by);
                            new SuccessResponse(EC.errorMessage(EC.getMessage), {
                                // @ts-ignore
                                token: req.token,
                                current: result4.current_count,
                                previous: result4.previous_count,
                                rows: result4.final
                            }).send(res);
                            break;
                        default:
                            new SuccessResponse(EC.errorMessage(EC.success), {
                                // @ts-ignore
                                token: req.token,
                                rows: []
                            }).send(res);
                            break;
                    }
                } else new SuccessResponse(EC.noDataFound, {
                    current: 0,
                    previous: 0,
                    rows: []
                }).send(res);
            } else {
                throw new Error(EC.errorMessage("Please provide all data."));
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getUserListDateWise(req: Request, res: Response) {
        try {
            let reqBody = req.body, whereCondition: any, includeCondition: any, includeMembershipCondition: any, filterWhere = {};
            let sortOrder = reqBody.sort_order ? reqBody.sort_order : "DESC";
            let sortField = reqBody.sort_field ? reqBody.sort_field : "user_id";
            let rowLimit = reqBody.page_record ? parseInt(reqBody.page_record) : 25;
            let rowOffset = reqBody.page_no ? ((reqBody.page_no * reqBody.page_record) - reqBody.page_record) : 0;
            let date_range = reqBody.date_range ? reqBody.date_range : "";
            let searchCondition = dbReader.Sequelize.Op.ne, searchData = null;
            let filterData = reqBody.filter ? reqBody.filter : "";
            let site_id = reqBody.site_id ? reqBody.site_id : [1, 2, 3, 4, 5, 6];

            if (reqBody.search) {
                searchCondition = dbReader.Sequelize.Op.like;
                searchData = "%" + reqBody.search + "%";
            }
            if (filterData) {
                if (filterData.subscription_status === "") {
                    filterWhere = {};
                    includeCondition = {
                        separate: true,
                        model: dbReader.userSubscription,
                        attributes: ['user_subscription_id', 'subscription_status', 'subscription_number', 'user_id', 'total_amount', 'next_payment_date', 'start_date'],
                        include: [{
                            separate: true,
                            model: dbReader.userSubscriptionItems,
                            attributes: ["user_subscription_item_id", "user_subscription_id", "product_name", "product_id"],
                            where: { is_deleted: 0, product_id: { [dbReader.Sequelize.Op.ne]: 0 } },
                        }],
                    };
                    includeMembershipCondition = {
                        separate: true,
                        model: dbReader.userMemberships,
                        attributes: ["user_membership_id", "membership_id", "status"],
                        where: { is_deleted: 0 },
                        include: [{
                            model: dbReader.membership,
                            attributes: ["membership_id", "membership_name"],
                            where: { is_deleted: 0 },
                            include: [{
                                separate: true,
                                model: dbReader.membershipProduct,
                                attributes: ["membership_product_id", "membership_id", "product_id"],
                                where: { is_deleted: 0, product_id: { [dbReader.Sequelize.Op.ne]: 0 } },
                                include: [{
                                    model: dbReader.products,
                                    attributes: ["product_id", "product_name"],
                                    where: { is_deleted: 0 },
                                }]
                            }]
                        }],
                        group: ["membership_id", "user_id"]
                    };
                } else if (filterData.subscription_status == 1) {
                    filterWhere = dbReader.Sequelize.where(dbReader.Sequelize.literal(`(select count(1) from sycu_user_subscriptions where subscription_status IN (2, 4) AND user_id = sycu_users.user_id)`), { [dbReader.Sequelize.Op.gt]: 0 });
                    includeCondition = {
                        separate: true,
                        model: dbReader.userSubscription,
                        attributes: ['user_subscription_id', 'subscription_status', 'subscription_number', 'user_id', 'total_amount', 'next_payment_date', 'start_date'],
                        where: { subscription_status: [2, 4] },
                        include: [{
                            model: dbReader.userSubscriptionItems,
                            attributes: ["user_subscription_item_id", "product_name", "product_id", "product_amount", "item_type"],
                            where: { is_deleted: 0, product_id: { [dbReader.Sequelize.Op.ne]: 0 } },
                        }],
                    };
                    includeMembershipCondition = {
                        separate: true,
                        model: dbReader.userMemberships,
                        attributes: ["user_membership_id", "membership_id"],
                        where: { status: [2, 4], is_deleted: 0 },
                        include: [{
                            model: dbReader.membership,
                            attributes: ["membership_id", "membership_name"],
                            where: { is_deleted: 0 },
                            include: [{
                                separate: true,
                                model: dbReader.membershipProduct,
                                attributes: ["membership_product_id", "membership_id", "product_id"],
                                where: { is_deleted: 0, product_id: { [dbReader.Sequelize.Op.ne]: 0 } },
                                include: [{
                                    model: dbReader.products,
                                    attributes: ["product_id", "product_name"],
                                    where: { is_deleted: 0 },
                                }]
                            }]
                        }],
                        group: ["membership_id", "user_id"]
                    };
                } else {
                    filterWhere = dbReader.Sequelize.where(dbReader.Sequelize.literal(`(select count(1) from sycu_user_subscriptions where subscription_status IN (2, 4) AND user_id = sycu_users.user_id)`), { [dbReader.Sequelize.Op.eq]: 0 });
                    includeCondition = {
                        separate: true,
                        model: dbReader.userSubscription,
                        attributes: ['user_subscription_id', 'subscription_status', 'subscription_number', 'user_id', 'total_amount', 'next_payment_date', 'start_date'],
                        where: { subscription_status: [3, 5, 6, 7] },
                        include: [{
                            separate: true,
                            model: dbReader.userSubscriptionItems,
                            attributes: ["user_subscription_item_id", "user_subscription_id", "product_name", "product_id"],
                            where: { is_deleted: 0, product_id: { [dbReader.Sequelize.Op.ne]: 0 } },
                        }],
                    };
                    includeMembershipCondition = {
                        separate: true,
                        model: dbReader.userMemberships,
                        attributes: ["user_membership_id", "membership_id", "status"],
                        where: { status: [3, 5, 6, 7], is_deleted: 0 },
                        include: [{
                            model: dbReader.membership,
                            attributes: ["membership_id", "membership_name"],
                            where: { is_deleted: 0 },
                            include: [{
                                separate: true,
                                model: dbReader.membershipProduct,
                                attributes: ["membership_product_id", "membership_id", "product_id"],
                                where: { is_deleted: 0, product_id: { [dbReader.Sequelize.Op.ne]: 0 } },
                                include: [{
                                    model: dbReader.products,
                                    attributes: ["product_id", "product_name"],
                                    where: { is_deleted: 0 },
                                }]
                            }]
                        }],
                        group: ["membership_id", "user_id"]
                    };
                }
            }

            if (date_range && date_range.start_date && date_range.end_date) {
                whereCondition = dbReader.Sequelize.and(
                    dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('sycu_users.created_datetime'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.gte]: date_range.start_date }),
                    dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('sycu_users.created_datetime'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.lte]: date_range.end_date }),
                    dbReader.sequelize.or(
                        { user_id: { [searchCondition]: searchData } },
                        { first_name: { [searchCondition]: searchData } },
                        { last_name: { [searchCondition]: searchData } },
                        { email: { [searchCondition]: searchData } },
                        { username: { [searchCondition]: searchData } },
                        { display_name: { [searchCondition]: searchData } }
                    ),
                    { via_portal: site_id },
                    { is_deleted: 0 },
                    filterWhere
                )
            } else {
                whereCondition = dbReader.Sequelize.and(
                    dbReader.sequelize.or(
                        { user_id: { [searchCondition]: searchData } },
                        { first_name: { [searchCondition]: searchData } },
                        { last_name: { [searchCondition]: searchData } },
                        { email: { [searchCondition]: searchData } },
                        { username: { [searchCondition]: searchData } },
                        { display_name: { [searchCondition]: searchData } }
                    ),
                    { via_portal: site_id },
                    { is_deleted: 0 },
                    filterWhere
                )
            }

            let userData = await dbReader.users.findAndCountAll({
                where: whereCondition,
                attributes: ['user_id', 'first_name', 'last_name', 'email', 'display_name', 'created_datetime'],
                include: [includeCondition, includeMembershipCondition],
                limit: rowLimit,
                offset: rowOffset,
                order: [[sortField, sortOrder]]
            });
            userData = JSON.parse(JSON.stringify(userData));
            userData.rows.forEach((element: any) => {
                let arrProducts: any = [], arrMemberships: any = [];
                element.total_active_subscription = element.user_subscriptions.length;
                element.user_subscriptions.forEach((e: any) => {
                    e.user_subscription_items.forEach((usi: any) => {
                        if (!arrProducts.some((p: any) => p.product_id == usi.product_id)) {
                            arrProducts.push({
                                "product_id": usi.product_id,
                                "product_name": usi.product_name
                            });
                        }
                    });
                });
                element.sycu_user_memberships.forEach((e: any) => {
                    arrMemberships.push({
                        "membership_id": e.sycu_membership.membership_id,
                        "membership_name": e.sycu_membership.membership_name
                    });
                });
                element.products = arrProducts;
                element.memberships = arrMemberships;
                element.subscription_list = element.user_subscriptions;
                delete element.user_subscriptions;
                delete element.sycu_user_memberships;
            });

            new SuccessResponse(EC.errorMessage(EC.success), {
                // @ts-ignore
                token: req.token,
                user_count: userData.count,
                user_data: userData.rows
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getRegisteredUserGraphData(req: Request, res: Response) {
        try {
            let { current_year_date_range, past_year_date_range, by = "", site_id = 0 } = req.body, graphData: any;
            let current_start_date = current_year_date_range ? current_year_date_range.start_date : "";
            let current_end_date = current_year_date_range ? current_year_date_range.end_date : "";
            let past_start_date = past_year_date_range ? past_year_date_range.start_date : "";
            let past_end_date = past_year_date_range ? past_year_date_range.end_date : "";
            let attributes = (by == "hour") ? ['created_datetime'] : [[dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`sycu_users`.`created_datetime`'), '%Y-%m-%d'), 'created_datetime']];
            site_id = site_id ? site_id : [1, 2, 3, 4, 5, 6];

            if (current_start_date && current_end_date && past_start_date && past_end_date) {
                graphData = await dbReader.users.findAll({
                    attributes: attributes,
                    where: dbReader.Sequelize.and(
                        dbReader.Sequelize.or(
                            dbReader.Sequelize.and(
                                dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('sycu_users.created_datetime'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.gte]: current_start_date }),
                                dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('sycu_users.created_datetime'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.lte]: current_end_date })
                            ), dbReader.Sequelize.and(
                                dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('sycu_users.created_datetime'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.gte]: past_start_date }),
                                dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('sycu_users.created_datetime'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.lte]: past_end_date })
                            )
                        ),
                        { via_portal: site_id },
                        { is_deleted: 0 }
                    )
                });
                if (graphData.length) {
                    graphData = JSON.parse(JSON.stringify(graphData));
                    let dateRange, arrayOfDatesOfCurrent: any = [], arrayOfDatesOfPrevious: any = [];
                    let getCounts = (arrCurrent: any, arrPrevious: any, type: string) => {
                        let final: any = [];
                        if (type == 'hour') {
                            for (let ele of arrCurrent) {
                                for (let obj of ele) {
                                    for (let value of graphData) {
                                        if (obj.created_date == moment(value.created_datetime).format("YYYY-MM-DD HH")) {
                                            obj.current++;
                                        }
                                    }
                                }
                            }
                            for (let ele of arrPrevious) {
                                for (let obj of ele) {
                                    for (let value of graphData) {
                                        if (obj.created_date == moment(value.created_datetime).format("YYYY-MM-DD HH")) {
                                            obj.previous++;
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
                                    for (let value of graphData) {
                                        if (obj.created_date == value.created_datetime) {
                                            obj.current++;
                                        }
                                    }
                                }
                            }
                            for (let ele of arrPrevious) {
                                for (let obj of ele) {
                                    for (let value of graphData) {
                                        if (obj.created_date == value.created_datetime) {
                                            obj.previous++;
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
                    switch (by) {
                        case "day":
                            var daysOfYear1: any = [], daysOfYear2: any = [];
                            let dateRangeOfCurrent = getDateRange(current_start_date, current_end_date, "YYYY-MM-DD");
                            let dateRangeOfPrevious = getDateRange(past_start_date, past_end_date, "YYYY-MM-DD");
                            daysOfYear1 = dateRangeOfCurrent.map(function (item: any) { return { 'created_date': item, 'start_date': item, 'end_date': item, 'current': 0 } });
                            daysOfYear2 = dateRangeOfPrevious.map(function (item: any) { return { 'created_date': item, 'start_date': item, 'end_date': item, 'previous': 0 } });
                            daysOfYear1.reverse(); daysOfYear2.reverse();
                            for (let ele of daysOfYear1) {
                                for (let value of graphData) {
                                    if (ele.created_date == value.created_datetime) {
                                        ele.current++;
                                    }
                                }
                            }
                            for (let ele of daysOfYear2) {
                                for (let value of graphData) {
                                    if (ele.created_date == value.created_datetime) {
                                        ele.previous++;
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
                            let current_count = 0, previous_count = 0;
                            final.forEach((e: any) => {
                                current_count += e.current.current_count;
                                previous_count += e.previous.previous_count;
                            });
                            new SuccessResponse(EC.errorMessage(EC.getMessage), {
                                // @ts-ignore
                                token: req.token,
                                current: current_count,
                                previous: previous_count,
                                rows: final
                            }).send(res);
                            break;
                        case "week":
                            moment.updateLocale('in', {
                                week: {
                                    dow: 1 // Monday is the first day of the week
                                }
                            });
                            var now1 = new Date(current_end_date);
                            var daysOfYear1: any = [];
                            for (var d = new Date(current_start_date); d <= now1; d.setDate(d.getDate() + 1)) {
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
                            var now2 = new Date(past_end_date);
                            var daysOfYear2: any = [];
                            for (var d = new Date(past_start_date); d <= now2; d.setDate(d.getDate() + 1)) {
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
                            let result1 = getCounts(arrayOfDatesOfCurrent, arrayOfDatesOfPrevious, by);
                            new SuccessResponse(EC.errorMessage(EC.getMessage), {
                                // @ts-ignore
                                token: req.token,
                                current: result1.current_count,
                                previous: result1.previous_count,
                                rows: result1.final
                            }).send(res);
                            break;
                        case 'month':
                            var now1 = new Date(current_end_date);
                            var daysOfYear1: any = [];
                            for (var d = new Date(current_start_date); d <= now1; d.setDate(d.getDate() + 1)) {
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
                            var now2 = new Date(past_end_date);
                            var daysOfYear2: any = [];
                            for (var d = new Date(past_start_date); d <= now2; d.setDate(d.getDate() + 1)) {
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
                            let result2 = getCounts(arrayOfDatesOfCurrent, arrayOfDatesOfPrevious, by);
                            new SuccessResponse(EC.errorMessage(EC.getMessage), {
                                // @ts-ignore
                                token: req.token,
                                current: result2.current_count,
                                previous: result2.previous_count,
                                rows: result2.final
                            }).send(res);
                            break;
                        case 'quarter':
                            var daysOfYear1: any = [], daysOfYear2: any = [];
                            for (let m = moment(current_start_date); m <= moment(current_end_date); m.add(3, 'M')) {
                                let _currentStartDate = m.format("YYYY-MM-DD"),
                                    _actualStartDate = moment(current_start_date).format("YYYY-MM-DD"),
                                    _lastDate = moment(moment(m).add(3, 'M')).format("YYYY-MM-DD"),
                                    _actualEndDate = moment(current_end_date).format("YYYY-MM-DD");
                                if ((_lastDate <= _actualEndDate || _actualEndDate >= _currentStartDate) && _actualStartDate <= _currentStartDate) {
                                    dateRange = getDateRange(m, _lastDate, "YYYY-MM-DD");
                                    daysOfYear1.push(dateRange.map(function (item: any) { return { 'created_date': item, 'start_date': _currentStartDate, 'end_date': _lastDate, 'current': 0 } }));
                                }
                            }
                            for (let m = moment(past_start_date); m <= moment(past_end_date); m.add(3, 'M')) {
                                let _currentStartDate = m.format("YYYY-MM-DD"),
                                    _actualStartDate = moment(past_start_date).format("YYYY-MM-DD"),
                                    _lastDate = moment(moment(m).add(3, 'M')).format("YYYY-MM-DD"),
                                    _actualEndDate = moment(past_end_date).format("YYYY-MM-DD");
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
                            let result3 = getCounts(arrayOfDatesOfCurrent, arrayOfDatesOfPrevious, by);
                            new SuccessResponse(EC.errorMessage(EC.getMessage), {
                                // @ts-ignore
                                token: req.token,
                                current: result3.current_count,
                                previous: result3.previous_count,
                                rows: result3.final
                            }).send(res);
                            break;
                        case 'hour':
                            for (let m = moment(current_start_date).set({ hour: 0, minute: 0, second: 0 }); m <= moment(current_end_date).set({ hour: 23, minute: 59, second: 59 }); m.add(1, 'hours')) {
                                let _currentStartDate = m.format("YYYY-MM-DD HH:mm"),
                                    _actualStartDate = moment(current_start_date).format("YYYY-MM-DD HH:mm"),
                                    _lastDate = moment(m).format("YYYY-MM-DD HH:mm"),
                                    _actualEndDate = moment(current_end_date).set({ hour: 23, minute: 59, second: 59 }).format("YYYY-MM-DD HH:mm");
                                if ((_lastDate <= _actualEndDate || _actualEndDate >= _currentStartDate) && _actualStartDate <= _currentStartDate) {
                                    dateRange = getDateRange(m, _lastDate, "YYYY-MM-DD HH");
                                    arrayOfDatesOfCurrent.push(dateRange.map(function (item: any) { return { 'created_date': item, 'start_date': _currentStartDate, 'end_date': _lastDate, 'current': 0 } }));
                                }
                                _lastDate = moment(moment(m).add(1, 'hours')).format("YYYY-MM-DD HH:mm");
                            }
                            for (let m = moment(past_start_date).set({ hour: 0, minute: 0, second: 0 }); m <= moment(past_end_date).set({ hour: 23, minute: 59, second: 59 }); m.add(1, 'hours')) {
                                let _currentStartDate = m.format("YYYY-MM-DD HH:mm"),
                                    _actualStartDate = moment(past_start_date).format("YYYY-MM-DD HH:mm"),
                                    _lastDate = moment(m).format("YYYY-MM-DD HH:mm"),
                                    _actualEndDate = moment(past_end_date).set({ hour: 23, minute: 59, second: 59 }).format("YYYY-MM-DD HH:mm");
                                if ((_lastDate <= _actualEndDate || _actualEndDate >= _currentStartDate) && _actualStartDate <= _currentStartDate) {
                                    dateRange = getDateRange(m, _lastDate, "YYYY-MM-DD HH");
                                    arrayOfDatesOfPrevious.push(dateRange.map(function (item: any) { return { 'created_date': item, 'start_date': _currentStartDate, 'end_date': _lastDate, 'previous': 0 } }));
                                }
                                _lastDate = moment(moment(m).add(1, 'hours')).format("YYYY-MM-DD HH:mm");
                            }
                            let result4 = getCounts(arrayOfDatesOfCurrent, arrayOfDatesOfPrevious, by);
                            new SuccessResponse(EC.errorMessage(EC.getMessage), {
                                // @ts-ignore
                                token: req.token,
                                current: result4.current_count,
                                previous: result4.previous_count,
                                rows: result4.final
                            }).send(res);
                            break;
                        default:
                            new SuccessResponse(EC.errorMessage(EC.success), {
                                // @ts-ignore
                                token: req.token,
                                rows: []
                            }).send(res);
                            break;
                    }
                } else new SuccessResponse(EC.noDataFound, {
                    current: 0,
                    previous: 0,
                    rows: []
                }).send(res);
            } else {
                throw new Error(EC.errorMessage("Please provide all data."));
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

//     public async getUserMembershipDetails(req: Request, res: Response) {
//         try{
//             let no_products = 0;
//             let { site_id } = req.body
//           //  site_id = 0
//                 let whereCondition = {};
//                 if (site_id) {
//                     whereCondition = {
//                         subscription_status: [2, 4, 10],
//                         site_id: site_id
//                     }
//                 } else {
//                         whereCondition = {
//                         subscription_status: [2, 4, 10]
//                      }
//                 }
//             let getCommonUserdata:any = [];
//             let kidsTotal=0,groupTotal=0,studentTotal=0;
//             let data = await dbReader.userSubscription.findAll({
//                 attributes: ['user_subscription_id'],
//                 where: whereCondition,
//                 include: [{
//                     model: dbReader.users,
//                     where: { is_deleted: 0 , user_role : 3},
//                 }]
//             });
//             let user_subscription_id = data.map((s:any) => s.user_subscription_id)
//            getCommonUserdata = await dbReader.userOrder.findAll({
//                 attributes: ['user_subscription_id', 'user_orders_id'],
//                 where: {
//                     order_status: [2, 4],
//                     user_orders_id: { [dbReader.Sequelize.Op.in]: dbReader.Sequelize.literal('(select max(user_orders_id) from sycu_user_orders where order_status in (2,4) and user_subscription_id in (' + user_subscription_id.join(',') + ') group by user_subscription_id)') }
//                 },
//                 include: [{
//                     separate: true,
//                     model: dbReader.userOrderItems,
//                     include: [{
//                         model: dbReader.products,
//                         attributes:[
//                             'product_id','category_id','is_ministry_page','ministry_type','product_duration',
//                             [dbReader.Sequelize.literal('`sycu_product->sycu_category`.`category_title`'), 'category_title']
//                         ],
//                         include : [{
//                             model : dbReader.categories,
//                             attributes : []
//                         }]
//                     }],
//                     where: { item_type: 1, is_deleted: 0 }
//                 }]
//             });
//             getCommonUserdata = JSON.parse(JSON.stringify(getCommonUserdata));
//             if(getCommonUserdata.length){
//                 no_products = user_subscription_id.length - getCommonUserdata.length;
//                 var sycuProducts:any = [];
//                     getCommonUserdata.forEach((h:any) => {
//                         h.user_order_items.map((s:any)=>s.user_subscription_id = h.user_subscription_id);
//                     });
//                     for(var i=0; i<getCommonUserdata.length; i++){
//                         var tempData = getCommonUserdata[i].user_order_items;
//                         var prod = tempData.map((h:any)=>h.sycu_product);
//                         if(prod[0] != null && prod[0] != undefined){
//                             prod.map((h:any)=>h.user_subscription_id = getCommonUserdata[i].user_subscription_id);
//                             sycuProducts.push(...prod);
//                         }
//                         else{
//                         }
//                     }
//                     let allVolumes = [...new Set(sycuProducts.map((d:any) => d.category_id))].map(category_id => {
//                         return {
//                             category_id,
//                             category_title : sycuProducts.filter((d:any) => d.category_id === category_id).map((d:any) => d.category_title),
//                         };
//                     });
//              let responseData:any = [];
//              allVolumes.forEach((h:any) => {
//                 responseData.push({
//                     "category_id": h.category_id,
//                     "category_title": h.category_title[0],
//                     "kids": {
//                         "ministry": sycuProducts.filter((s:any) => s.is_ministry_page == 0 && s.ministry_type == 1 && s.category_id == h.category_id && s.category_id != 1).length,
//                         "non_ministry": sycuProducts.filter((s:any) => s.is_ministry_page == 1 && s.ministry_type == 1 && s.category_id == h.category_id && s.category_id != 1).length,
//                          },
//                     "students": {
//                         "ministry": sycuProducts.filter((s:any) => s.is_ministry_page == 0 && s.ministry_type == 2 && s.category_id == h.category_id && s.category_id != 1).length,
//                         "non_ministry": sycuProducts.filter((s:any) => s.is_ministry_page == 1 && s.ministry_type == 2 && s.category_id == h.category_id && s.category_id != 1).length,
//                         },
//                     "groups": {
//                         "ministry": sycuProducts.filter((s:any) => s.is_ministry_page == 0 && s.ministry_type == 3 && s.category_id == h.category_id && s.category_id != 1).length,
//                         "non_ministry": sycuProducts.filter((s:any) => s.is_ministry_page == 1 && s.ministry_type == 3 && s.category_id == h.category_id && s.category_id != 1).length,
//                       },
//                      });
//                 });
//                 let grandKidsTotalMinistry:any=[],grandKidsTotalNonMinistry:any=[],grandstudentTotalMinistry:any=[],grandstudentTotalnonMinistry:any=[],
//                      grandGroupTotalMinistry:any=[],grandGroupTotalNonMinistry:any=[],othersData =[];
//                 for (var i = 0; i < responseData.length; i++) {
//                     if (responseData[i].category_id == 0) {
//                         delete responseData[i];
//                     }
//                     else{
//                         let tempData = responseData[i];
//                         let totalKidsMinistryNonministry=0, totalStudentMinistryNonministry = 0,totalGroupMinistryNonministry = 0
//                         //for kids ministry non minstry total
//                         let KidsMinistrySubscription = sycuProducts.filter((s:any) => s.is_ministry_page == 0 && s.ministry_type == 1 && s.category_id == tempData.category_id && s.category_id != 1).map((k:any)=>k.user_subscription_id);
//                         let KidsNonMinistrySubscription = sycuProducts.filter((s:any) => s.is_ministry_page == 1 && s.ministry_type == 1 && s.category_id == tempData.category_id && s.category_id != 1).map((k:any)=>k.user_subscription_id)
//                           grandKidsTotalMinistry.push(...KidsMinistrySubscription)
//                             grandKidsTotalNonMinistry.push(...KidsNonMinistrySubscription)
//                         // KidsMinistrySubscription = KidsMinistrySubscription.filter((val:any) => !KidsNonMinistrySubscription.includes(val));
//                         KidsMinistrySubscription =   [...new Set([...KidsMinistrySubscription ,...KidsNonMinistrySubscription])]; 
//                         totalKidsMinistryNonministry = KidsMinistrySubscription.length;
//                         kidsTotal = kidsTotal + totalKidsMinistryNonministry;
//                         // for students ministry non minstry total
//                         let studentMinistrySubscription = sycuProducts.filter((s:any) => s.is_ministry_page == 0 && s.ministry_type == 2 && s.category_id == tempData.category_id && s.category_id != 1).map((k:any)=>k.user_subscription_id);
//                         let studentNonMinistrySubscription = sycuProducts.filter((s:any) => s.is_ministry_page == 1 && s.ministry_type == 2 && s.category_id == tempData.category_id && s.category_id != 1).map((k:any)=>k.user_subscription_id)
//                         grandstudentTotalMinistry.push(...studentMinistrySubscription)
//                         grandstudentTotalnonMinistry.push(...studentNonMinistrySubscription)
//                         // studentMinistrySubscription = studentMinistrySubscription.filter((val:any) => !studentNonMinistrySubscription.includes(val));
//                         studentMinistrySubscription = [...new Set([...studentMinistrySubscription,...studentNonMinistrySubscription])];
//                         totalStudentMinistryNonministry = studentMinistrySubscription.length;
//                         studentTotal = studentTotal + totalStudentMinistryNonministry;
//                         // for group ministry non minstry total
//                         let groupMinistrySubscription = sycuProducts.filter((s:any) => s.is_ministry_page == 0 && s.ministry_type == 3 && s.category_id == tempData.category_id && s.category_id != 1).map((k:any)=>k.user_subscription_id);
//                         let groupNonMinistrySubscription = sycuProducts.filter((s:any) => s.is_ministry_page == 1 && s.ministry_type == 3 && s.category_id == tempData.category_id && s.category_id != 1).map((k:any)=>k.user_subscription_id)
//                         grandGroupTotalMinistry.push(...groupMinistrySubscription)
//                         grandGroupTotalNonMinistry.push(...groupNonMinistrySubscription)
//                         //  groupMinistrySubscription = groupMinistrySubscription.filter((val:any) => !groupNonMinistrySubscription.includes(val));
//                         groupMinistrySubscription = [...new Set([...groupMinistrySubscription,...groupNonMinistrySubscription])] 
//                         totalGroupMinistryNonministry = groupMinistrySubscription.length;
//                         groupTotal = groupTotal + totalGroupMinistryNonministry;
//                         // for all ministry total
//                         // KidsMinistrySubscription = sycuProducts.filter((s:any) => s.is_ministry_page == 0 && s.ministry_type == 1 && s.category_id == tempData.category_id).map((k:any)=>k.user_subscription_id);
//                         // studentMinistrySubscription = sycuProducts.filter((s:any) => s.is_ministry_page == 0 && s.ministry_type == 2 && s.category_id == tempData.category_id).map((k:any)=>k.user_subscription_id);
//                         // groupMinistrySubscription = sycuProducts.filter((s:any) => s.is_ministry_page == 0 && s.ministry_type == 3 && s.category_id == tempData.category_id).map((k:any)=>k.user_subscription_id);
//                         // KidsNonMinistrySubscription = sycuProducts.filter((s:any) => s.is_ministry_page == 1 && s.ministry_type == 1 && s.category_id == tempData.category_id).map((k:any)=>k.user_subscription_id)
//                         // studentNonMinistrySubscription = sycuProducts.filter((s:any) => s.is_ministry_page == 1 && s.ministry_type == 2 && s.category_id == tempData.category_id).map((k:any)=>k.user_subscription_id)
//                         // groupNonMinistrySubscription = sycuProducts.filter((s:any) => s.is_ministry_page == 1 && s.ministry_type == 3 && s.category_id == tempData.category_id).map((k:any)=>k.user_subscription_id)
//                         KidsMinistrySubscription = sycuProducts.filter((s:any) => s.is_ministry_page == 0 && s.ministry_type == 1 && s.category_id == tempData.category_id && s.category_id != 1).map((k:any)=>k.user_subscription_id);
// studentMinistrySubscription = sycuProducts.filter((s:any) => s.is_ministry_page == 0 && s.ministry_type == 2 && s.category_id == tempData.category_id && s.category_id != 1).map((k:any)=>k.user_subscription_id);
// groupMinistrySubscription = sycuProducts.filter((s:any) => s.is_ministry_page == 0 && s.ministry_type == 3 && s.category_id == tempData.category_id && s.category_id != 1).map((k:any)=>k.user_subscription_id);
// KidsNonMinistrySubscription = sycuProducts.filter((s:any) => s.is_ministry_page == 1 && s.ministry_type == 1 && s.category_id == tempData.category_id && s.category_id != 1).map((k:any)=>k.user_subscription_id)
// studentNonMinistrySubscription = sycuProducts.filter((s:any) => s.is_ministry_page == 1 && s.ministry_type == 2 && s.category_id == tempData.category_id && s.category_id != 1).map((k:any)=>k.user_subscription_id)
// groupNonMinistrySubscription = sycuProducts.filter((s:any) => s.is_ministry_page == 1 && s.ministry_type == 3 && s.category_id == tempData.category_id && s.category_id != 1).map((k:any)=>k.user_subscription_id)
//                         KidsMinistrySubscription = [...new Set([...KidsMinistrySubscription,...studentMinistrySubscription,...groupMinistrySubscription])];
//                         KidsNonMinistrySubscription = [...new Set([...KidsNonMinistrySubscription,...studentNonMinistrySubscription,...groupNonMinistrySubscription])]; 
//                         responseData[i].kids.total = responseData[i].kids.ministry + responseData[i].kids.non_ministry;
//                         responseData[i].students.total = responseData[i].students.ministry + responseData[i].students.non_ministry;
//                         responseData[i].groups.total = responseData[i].groups.ministry + responseData[i].groups.non_ministry;
//                         responseData[i].total_ministry = responseData[i].kids.ministry + responseData[i].students.ministry + responseData[i].groups.ministry;
//                         responseData[i].total_non_ministry = responseData[i].kids.non_ministry + responseData[i].students.non_ministry + responseData[i].groups.non_ministry;
//                         responseData[i].monthly = sycuProducts.filter((s:any) => s.product_duration == 30 && s.category_id == tempData.category_id).length
//                         responseData[i].quarterly = sycuProducts.filter((s:any) => s.product_duration == 90 && s.category_id == tempData.category_id).length
//                         responseData[i].annually = sycuProducts.filter((s:any) => s.product_duration == 365 && s.category_id == tempData.category_id).length
//                         responseData[i].total_ministry_non_ministry = responseData[i].kids.total + responseData[i].students.total + responseData[i].groups.total;
//                         othersData = sycuProducts.filter((s:any) => s.category_id == 0).map((k:any) => k.user_subscription_id);
//                     }
//                 }
//                 let grandTotalSubscription = [...new Set([...grandKidsTotalMinistry,...grandKidsTotalNonMinistry,...grandstudentTotalMinistry,...grandstudentTotalnonMinistry,...grandGroupTotalMinistry, ...grandGroupTotalNonMinistry,...othersData])];
//                 responseData = responseData.filter((s:any) => s != null);
//                 new SuccessResponse(EC.errorMessage(EC.success), {
//                     // @ts-ignore
//                     token: req.token,
//                     count: responseData.length,
//                     kids_total : kidsTotal,
//                     student_total : studentTotal,
//                     group_total : groupTotal,
//                     others: othersData.length + no_products,
//                     grand_total : kidsTotal + studentTotal + groupTotal,
//                     rows: responseData
//                 }).send(res);
//             }
//             else{
//                 ApiError.handle(new BadRequestError("No data Found"), res);
//             }
//         }
//         catch(e:any){
//             ApiError.handle(new BadRequestError(e.message), res);
//         }
//     }
// public async getUserMembershipDetails(req: Request, res: Response) {
//     try {
//         let { site_id } = req.body;

//         let allSubscriptionData = await dbReader.userMemberships.findAll({
//             attributes: ['user_id', 'membership_id'],
//             where: {
//                 site_id: site_id,
//                 is_deleted: 0,
//                 status: [2, 4, 5, 10]
//             },
//             include: [{
//                 model: dbReader.users,
//                 attributes: ['user_id'],
//                 where: { is_deleted: 0 , status: 1}
//             }, {
//                 model: dbReader.membershipProduct,
//                 attributes: ['membership_product_id'],
//                 where: { is_deleted: 0 },
//                 include: [{
//                     required: false,
//                     model: dbReader.products,
//                     attributes: ['product_id', 'category_id', 'is_ministry_page', 'product_duration', 'ministry_type',
//                     [dbReader.Sequelize.literal(`category_title`), 'category_title']
//                     ],
//                     where: { is_deleted: 0, ministry_type: [1, 2, 3], product_duration: [30, 90, 365],
//                          category_id: [341,256,EnumObject.categoryIDEnum.get('musicCategoryId').value,2,3,4,5,6]  },
//                     include: [{
//                         model: dbReader.categories,
//                         attributes: []
//                     }]
//                 }]
//             }],
//             group: ['user_id', 'membership_id']
//         });
//         allSubscriptionData = JSON.parse(JSON.stringify(allSubscriptionData));

//         let Notfullrefundcount = await dbReader.userOrder.findAll({
//             attributes: ['user_orders_id','user_id'],
//             where: {
//               order_status: [2,4,5,10],
//               site_id: site_id
//             },
//             include:[{
//               model:dbReader.refunds,
//               attributes:['refund_id','user_id'],
//               where:{refund_type:[2,3]}
//             }]
            
//           })
//           Notfullrefundcount = JSON.parse(JSON.stringify(Notfullrefundcount));
      
//           // Extract user IDs from Notfullrefundcount
//       const refundUserIds = new Set(Notfullrefundcount.map((item:any) => item.user_id));
      
//       // Filter out subscriptionCountData based on refundUserIds
//       allSubscriptionData = allSubscriptionData.filter((item:any) => !refundUserIds.has(item.user_id));

//         if (allSubscriptionData.length) {
//             let sycuProducts: any = [];

//             // Map user ID to each membership product
//             allSubscriptionData.forEach((data: any) => {
//                 let product = data.sycu_membership_product.sycu_product;
//                 if (product) {
//                     product.user_id = data.user_id;
//                     sycuProducts.push(product);
//                 }
//             });

//             // Get unique category IDs and map to category titles
//             let allVolumes = [...new Set(sycuProducts.map((d: any) => d.category_id))].map(category_id => ({
//                 category_id,
//                 category_title: sycuProducts.find((d: any) => d.category_id === category_id)?.category_title,
//             }));

//             let responseData = allVolumes.map((volume) => {
//                 let category_id = volume.category_id;
//                 return {
//                     category_id,
//                     category_title: volume.category_title,
//                     kids: {
//                         ministry: sycuProducts.filter((s: any) => s.is_ministry_page === 1 && s.ministry_type === 1 && s.category_id === category_id &&  s.category_id != 1 && s.category_id != EnumObject.categoryIDEnum.get('musicCategoryId').value).length,
//                         non_ministry: sycuProducts.filter((s: any) => s.is_ministry_page === 0 && s.ministry_type === 1 && s.category_id === category_id &&  s.category_id != 1 && s.category_id != EnumObject.categoryIDEnum.get('musicCategoryId').value).length,
//                     },
//                     students: {
//                         ministry: sycuProducts.filter((s: any) => s.is_ministry_page === 1 && s.ministry_type === 2 && s.category_id === category_id &&  s.category_id != 1 && s.category_id != EnumObject.categoryIDEnum.get('musicCategoryId').value).length,
//                         non_ministry: sycuProducts.filter((s: any) => s.is_ministry_page === 0 && s.ministry_type === 2 && s.category_id === category_id &&  s.category_id != 1 && s.category_id != EnumObject.categoryIDEnum.get('musicCategoryId').value).length,
//                     },
//                     groups: {
//                         ministry: sycuProducts.filter((s: any) => s.is_ministry_page === 1 && s.ministry_type === 3 && s.category_id === category_id &&  s.category_id != 1 && s.category_id != EnumObject.categoryIDEnum.get('musicCategoryId').value).length,
//                         non_ministry: sycuProducts.filter((s: any) => s.is_ministry_page === 0 && s.ministry_type === 3 && s.category_id === category_id &&  s.category_id != 1 && s.category_id != EnumObject.categoryIDEnum.get('musicCategoryId').value).length,
//                     },
//                 };
//             });

//             // Calculate grand totals and overall statistics
//             let grandKidsTotalMinistry: any = [], grandKidsTotalNonMinistry: any = [], grandStudentTotalMinistry: any = [], grandStudentTotalNonMinistry: any = [],
//                 grandGroupTotalMinistry: any = [], grandGroupTotalNonMinistry: any = [], othersData: any = [];
//             let KidsTotal = 0, studentTotal = 0, groupTotal = 0;

//             responseData.forEach((data: any) => {
//                 if (data.category_id !== 0 && data.category_id !== 1 && data.category_id !== EnumObject.categoryIDEnum.get('musicCategoryId').value) {
//                     let totalKidsMinistryNonministry = sycuProducts.filter((s: any) => s.category_id === data.category_id && s.ministry_type === 1 &&  s.category_id != 1 && s.category_id != EnumObject.categoryIDEnum.get('musicCategoryId').value).length;
//                     KidsTotal += totalKidsMinistryNonministry;

//                     let totalStudentMinistryNonministry = sycuProducts.filter((s: any) => s.category_id === data.category_id && s.ministry_type === 2 &&  s.category_id != 1 && s.category_id != EnumObject.categoryIDEnum.get('musicCategoryId').value).length;
//                     studentTotal += totalStudentMinistryNonministry;

//                     let totalGroupMinistryNonministry = sycuProducts.filter((s: any) => s.category_id === data.category_id && s.ministry_type === 3 &&  s.category_id != 1 && s.category_id != EnumObject.categoryIDEnum.get('musicCategoryId').value).length;
//                     groupTotal += totalGroupMinistryNonministry;

//                     data.kids.total = data.kids.ministry + data.kids.non_ministry;
//                     data.students.total = data.students.ministry + data.students.non_ministry;
//                     data.groups.total = data.groups.ministry + data.groups.non_ministry;

//                     data.total_ministry = data.kids.ministry + data.students.ministry + data.groups.ministry;
//                     data.total_non_ministry = data.kids.non_ministry + data.students.non_ministry + data.groups.non_ministry;
//                     // data.monthly = sycuProducts.filter((s) => s.product_duration == 30 && s.category_id == data.category_id).length;
//                     // data.quarterly = sycuProducts.filter((s) => s.product_duration == 90 && s.category_id == data.category_id).length;
//                     // data.annually = sycuProducts.filter((s) => s.product_duration == 365 && s.category_id == data.category_id).length;
//                     data.total_ministry_non_ministry = data.total_ministry + data.total_non_ministry;

//                     // Calculate grand totals
//                     grandKidsTotalMinistry.push(...sycuProducts.filter((s: any) => s.is_ministry_page === 0 && s.ministry_type === 1 && s.category_id === data.category_id &&  s.category_id != 1 && s.category_id != EnumObject.categoryIDEnum.get('musicCategoryId').value).map((k: any) => k.user_id));
//                     grandKidsTotalNonMinistry.push(...sycuProducts.filter((s: any) => s.is_ministry_page === 1 && s.ministry_type === 1 && s.category_id === data.category_id &&  s.category_id != 1 && s.category_id != EnumObject.categoryIDEnum.get('musicCategoryId').value).map((k: any) => k.user_id));

//                     grandStudentTotalMinistry.push(...sycuProducts.filter((s: any) => s.is_ministry_page === 0 && s.ministry_type === 2 && s.category_id === data.category_id &&  s.category_id != 1 && s.category_id != EnumObject.categoryIDEnum.get('musicCategoryId').value).map((k: any) => k.user_id));
//                     grandStudentTotalNonMinistry.push(...sycuProducts.filter((s: any) => s.is_ministry_page === 1 && s.ministry_type === 2 && s.category_id === data.category_id &&  s.category_id != 1 && s.category_id != EnumObject.categoryIDEnum.get('musicCategoryId').value).map((k: any) => k.user_id));

//                     grandGroupTotalMinistry.push(...sycuProducts.filter((s: any) => s.is_ministry_page === 0 && s.ministry_type === 3 && s.category_id === data.category_id &&  s.category_id != 1 && s.category_id != EnumObject.categoryIDEnum.get('musicCategoryId').value).map((k: any) => k.user_id));
//                     grandGroupTotalNonMinistry.push(...sycuProducts.filter((s: any) => s.is_ministry_page === 1 && s.ministry_type === 3 && s.category_id === data.category_id &&  s.category_id != 1 && s.category_id != EnumObject.categoryIDEnum.get('musicCategoryId').value).map((k: any) => k.user_id));
//                 }
//             });

//             // Compile final response
//             let grandTotalSubscription = [...new Set([...grandKidsTotalMinistry, ...grandKidsTotalNonMinistry, ...grandStudentTotalMinistry, ...grandStudentTotalNonMinistry, ...grandGroupTotalMinistry, ...grandGroupTotalNonMinistry, ...othersData])];

//             responseData = responseData.filter((s) => s != null);
//             new SuccessResponse(EC.errorMessage(EC.success), {
//                 // @ts-ignore
//                 token: req.token,
//                 count: responseData.length,
//                 kids_total: KidsTotal,
//                 student_total: studentTotal,
//                 group_total: groupTotal,
//                 grand_total: sycuProducts.length,
//                 rows: responseData
//             }).send(res);
//         }
//         else {
//             ApiError.handle(new BadRequestError("No data Found"), res);
//         }

//     } catch (e: any) {
//         ApiError.handle(new BadRequestError(e.message), res);
//     }
// }

public async getUserMembershipDetails(req: Request, res: Response) {
    try {
        let { site_id } = req.body;

        let allSubscriptionData = await dbReader.userMemberships.findAll({
            attributes: ['user_id', 'membership_id'],
            where: {
                site_id: site_id,
                is_deleted: 0,
                status: [2,4,10]
            },
            include: [{
                model: dbReader.users,
                attributes: ['user_id'],
                where: { is_deleted: 0 , status: 1}
            }, {
                model: dbReader.membershipProduct,
                attributes: ['membership_product_id'],
                where: { is_deleted: 0 },
                include: [{
                    required: false,
                    model: dbReader.products,
                    attributes: ['product_id', 'category_id', 'is_ministry_page', 'product_duration', 'ministry_type',
                    [dbReader.Sequelize.literal(`category_title`), 'category_title']
                    ],
                    where: { is_deleted: 0, ministry_type: [1, 2, 3], product_duration: [30, 90, 365],
                         category_id: [341,256,EnumObject.categoryIDEnum.get('musicCategoryId').value,2,3,4,5,6]  },
                    include: [{
                        model: dbReader.categories,
                        attributes: []
                    }]
                }]
            }],
            group: ['user_id', 'membership_id']
        });
        allSubscriptionData = JSON.parse(JSON.stringify(allSubscriptionData));



        if (allSubscriptionData.length) {
            let sycuProducts: any = [];

            // Map user ID to each membership product
            allSubscriptionData.forEach((data: any) => {
                let product = data.sycu_membership_product.sycu_product;
                if (product) {
                    product.user_id = data.user_id;
                    sycuProducts.push(product);
                }
            });

            // Get unique category IDs and map to category titles
            let allVolumes = [...new Set(sycuProducts.map((d: any) => d.category_id))].map(category_id => ({
                category_id,
                category_title: sycuProducts.find((d: any) => d.category_id === category_id)?.category_title,
            }));

            let responseData = allVolumes.map((volume) => {
                let category_id = volume.category_id;
                return {
                    category_id,
                    category_title: volume.category_title,
                    kids: {
                        ministry: sycuProducts.filter((s: any) => s.is_ministry_page === 1 && s.ministry_type === 1 && s.category_id === category_id &&  s.category_id != 1 && s.category_id != EnumObject.categoryIDEnum.get('musicCategoryId').value).length,
                        non_ministry: sycuProducts.filter((s: any) => s.is_ministry_page === 0 && s.ministry_type === 1 && s.category_id === category_id &&  s.category_id != 1 && s.category_id != EnumObject.categoryIDEnum.get('musicCategoryId').value).length,
                    },
                    students: {
                        ministry: sycuProducts.filter((s: any) => s.is_ministry_page === 1 && s.ministry_type === 2 && s.category_id === category_id &&  s.category_id != 1 && s.category_id != EnumObject.categoryIDEnum.get('musicCategoryId').value).length,
                        non_ministry: sycuProducts.filter((s: any) => s.is_ministry_page === 0 && s.ministry_type === 2 && s.category_id === category_id &&  s.category_id != 1 && s.category_id != EnumObject.categoryIDEnum.get('musicCategoryId').value).length,
                    },
                    groups: {
                        ministry: sycuProducts.filter((s: any) => s.is_ministry_page === 1 && s.ministry_type === 3 && s.category_id === category_id &&  s.category_id != 1 && s.category_id != EnumObject.categoryIDEnum.get('musicCategoryId').value).length,
                        non_ministry: sycuProducts.filter((s: any) => s.is_ministry_page === 0 && s.ministry_type === 3 && s.category_id === category_id &&  s.category_id != 1 && s.category_id != EnumObject.categoryIDEnum.get('musicCategoryId').value).length,
                    },
                };
            });

            // Calculate grand totals and overall statistics
            let grandKidsTotalMinistry: any = [], grandKidsTotalNonMinistry: any = [], grandStudentTotalMinistry: any = [], grandStudentTotalNonMinistry: any = [],
                grandGroupTotalMinistry: any = [], grandGroupTotalNonMinistry: any = [], othersData: any = [];
            let KidsTotal = 0, studentTotal = 0, groupTotal = 0;

            responseData.forEach((data: any) => {
                if (data.category_id !== 0 && data.category_id !== 1 && data.category_id !== EnumObject.categoryIDEnum.get('musicCategoryId').value) {
                    let totalKidsMinistryNonministry = sycuProducts.filter((s: any) => s.category_id === data.category_id && s.ministry_type === 1 &&  s.category_id != 1 && s.category_id != EnumObject.categoryIDEnum.get('musicCategoryId').value).length;
                    KidsTotal += totalKidsMinistryNonministry;

                    let totalStudentMinistryNonministry = sycuProducts.filter((s: any) => s.category_id === data.category_id && s.ministry_type === 2 &&  s.category_id != 1 && s.category_id != EnumObject.categoryIDEnum.get('musicCategoryId').value).length;
                    studentTotal += totalStudentMinistryNonministry;

                    let totalGroupMinistryNonministry = sycuProducts.filter((s: any) => s.category_id === data.category_id && s.ministry_type === 3 &&  s.category_id != 1 && s.category_id != EnumObject.categoryIDEnum.get('musicCategoryId').value).length;
                    groupTotal += totalGroupMinistryNonministry;

                    data.kids.total = data.kids.ministry + data.kids.non_ministry;
                    data.students.total = data.students.ministry + data.students.non_ministry;
                    data.groups.total = data.groups.ministry + data.groups.non_ministry;

                    data.total_ministry = data.kids.ministry + data.students.ministry + data.groups.ministry;
                    data.total_non_ministry = data.kids.non_ministry + data.students.non_ministry + data.groups.non_ministry;
                    // data.monthly = sycuProducts.filter((s) => s.product_duration == 30 && s.category_id == data.category_id).length;
                    // data.quarterly = sycuProducts.filter((s) => s.product_duration == 90 && s.category_id == data.category_id).length;
                    // data.annually = sycuProducts.filter((s) => s.product_duration == 365 && s.category_id == data.category_id).length;
                    data.total_ministry_non_ministry = data.total_ministry + data.total_non_ministry;

                    // Calculate grand totals
                    grandKidsTotalMinistry.push(...sycuProducts.filter((s: any) => s.is_ministry_page === 0 && s.ministry_type === 1 && s.category_id === data.category_id &&  s.category_id != 1 && s.category_id != EnumObject.categoryIDEnum.get('musicCategoryId').value).map((k: any) => k.user_id));
                    grandKidsTotalNonMinistry.push(...sycuProducts.filter((s: any) => s.is_ministry_page === 1 && s.ministry_type === 1 && s.category_id === data.category_id &&  s.category_id != 1 && s.category_id != EnumObject.categoryIDEnum.get('musicCategoryId').value).map((k: any) => k.user_id));

                    grandStudentTotalMinistry.push(...sycuProducts.filter((s: any) => s.is_ministry_page === 0 && s.ministry_type === 2 && s.category_id === data.category_id &&  s.category_id != 1 && s.category_id != EnumObject.categoryIDEnum.get('musicCategoryId').value).map((k: any) => k.user_id));
                    grandStudentTotalNonMinistry.push(...sycuProducts.filter((s: any) => s.is_ministry_page === 1 && s.ministry_type === 2 && s.category_id === data.category_id &&  s.category_id != 1 && s.category_id != EnumObject.categoryIDEnum.get('musicCategoryId').value).map((k: any) => k.user_id));

                    grandGroupTotalMinistry.push(...sycuProducts.filter((s: any) => s.is_ministry_page === 0 && s.ministry_type === 3 && s.category_id === data.category_id &&  s.category_id != 1 && s.category_id != EnumObject.categoryIDEnum.get('musicCategoryId').value).map((k: any) => k.user_id));
                    grandGroupTotalNonMinistry.push(...sycuProducts.filter((s: any) => s.is_ministry_page === 1 && s.ministry_type === 3 && s.category_id === data.category_id &&  s.category_id != 1 && s.category_id != EnumObject.categoryIDEnum.get('musicCategoryId').value).map((k: any) => k.user_id));
                }
            });

            // Compile final response
            let grandTotalSubscription = [...new Set([...grandKidsTotalMinistry, ...grandKidsTotalNonMinistry, ...grandStudentTotalMinistry, ...grandStudentTotalNonMinistry, ...grandGroupTotalMinistry, ...grandGroupTotalNonMinistry, ...othersData])];

            responseData = responseData.filter((s) => s != null);
            new SuccessResponse(EC.errorMessage(EC.success), {
                // @ts-ignore
                token: req.token,
                count: responseData.length,
                kids_total: KidsTotal,
                student_total: studentTotal,
                group_total: groupTotal,
                grand_total: sycuProducts.length,
                rows: responseData
            }).send(res);
        }
        else {
            ApiError.handle(new BadRequestError("No data Found"), res);
        }

    } catch (e: any) {
        ApiError.handle(new BadRequestError(e.message), res);
    }
}
    
}