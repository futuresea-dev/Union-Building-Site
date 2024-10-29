import { Request, Response } from "express";
import { ErrorController } from "../../core/ErrorController";
import { SuccessResponse } from '../../core/ApiResponse';
import { BadRequestError, ApiError, AuthFailureError } from '../../core/ApiError';
import { getDateRange } from '../../helpers/helpers';
import moment from "moment";
const { dbReader, dbWriter } = require('../../models/dbConfig');
const { Op } = dbReader.Sequelize;
const EC = new ErrorController();




class Sort {
    sortOrder: any;
    data: any;
    sortField: any;
    type: any;
    constructor(data: any, sortField: any, sortOrder: any, type: any) {
        this.sortField = sortField;
        this.sortOrder = sortOrder;
        this.data = data;
        this.type = type;
    }
    byNumber(key: any) {
        if (this.sortOrder === "ASC")
            return this.data.sort((a: any, b: any) => (a[key] > b[key] ? 1 : -1));
        else return this.data.sort((a: any, b: any) => (a[key] < b[key] ? 1 : -1));
    }
    byString(key: any) {
        if (this.sortOrder === "ASC")
            return this.data.sort((a: any, b: any) =>
                a[key].toLowerCase() > b[key].toLowerCase() ? 1 : -1
            );
        else
            return this.data.sort((a: any, b: any) =>
                a[key].toLowerCase() < b[key].toLowerCase() ? 1 : -1
            );
    }
    byDate(key: any) {

        if (this.sortOrder === "ASC")
            return this.data.sort((a: any, b: any) => +new Date(a[key]) - +new Date(b[key]));
        else return this.data.sort((a: any, b: any) => +new Date(b[key]) - +new Date(a[key]));
    }

    sent_count() {
        return this.byNumber("sent_count");
    }
    failed_count() {
        return this.byNumber("failed_count");
    }
    total() {
        return this.byNumber("total");
    }
    value() {
        if (this.type === "date") return this.byDate("value");
        else return this.byString("value");
    }

    convert() {
        switch (this.sortField) {
            case "sent_count":
                return this.sent_count()
            case "failed_count":
                return this.failed_count()
            case "total":
                return this.total()
            case "value":
                return this.value()
            default: return []
        }
    }
}
class Group {
    data: any;
    successStatus: any;
    keys: any;
    response: any;
    page: any;
    limit: any;
    sortField: any;
    sortOrder: any;
    by: any;
    constructor(data: any) {
        this.data = data;
        this.successStatus = 1;
        this.keys = { date: "created_date", subject: "subject_mail" };
        this.response = new Map();
        this.page = 1;
        this.limit = null;
        this.sortField = "value";
        this.sortOrder = "DESC";
        this.by = "date";
    }
    get convert() {
        const arr: any = this._mapToArray(this.response);
        // Sort
        const sortedArray = new Sort(arr, this.sortField, this.sortOrder, this.by).convert()


        // Pagination
        const page = this.page;
        const limit = this.limit;

        const res = {
            rows: sortedArray,
            count: sortedArray.length
        }

        if (limit === null) return {
            ...res
        };
        else return {
            ...res,
            rows: sortedArray.slice((page - 1) * limit, page * limit)
        }
    }
    _mapToArray(mapData: any) {
        return [...mapData.values()];
    }
    _by(by = "date") {
        this.by = by;
        const data = this.response;
        this.data.forEach((item: any) => {
            const isSuccess = item.status === this.successStatus;
            if (!!data.get(item[this.keys[by]])) {
                const oldValue = data.get(item[this.keys[by]]);
                const newValue = {
                    ...oldValue,
                    sent_count: isSuccess ? oldValue.sent_count + 1 : oldValue.sent_count,
                    failed_count: isSuccess ? oldValue.failed_count : oldValue.failed_count + 1,
                    total: oldValue.total + 1,
                };
                data.set(item[this.keys[by]], newValue);
            } else {
                const newValue = {
                    value: item[this.keys[by]],
                    sent_count: isSuccess ? 1 : 0,
                    failed_count: isSuccess ? 0 : 1,
                    total: 1,
                };
                data.set(item[this.keys[by]], newValue);
            }
        });
        return this;
    }
    _page(page = 1) {
        this.page = page;
        return this;
    }
    _limit(limit = 25) {
        this.limit = limit;
        return this;
    }
    _sort(sortField: any, sortOrder: any) {
        this.sortField = sortField;
        this.sortOrder = sortOrder;
        return this;
    }
}


export class emailReportController {
    public async getEmailListData(req: Request, res: Response) {
        try {
            let { range, by, sort_field, sort_order, page_no, page_record } = req.body;

            // Searching                           
            var SearchCondition = dbReader.Sequelize.Op.ne, SearchData = null;
            if (req.body.search) {
                SearchCondition = Op.like;
                SearchData = "%" + req.body.search + "%";
            }

            let filter
            if (req.body.filter) {
                var data = req.body.filter;
                filter = dbReader.Sequelize.and(data);
            }


            let whereCondition;
            if (by == 'date') {
                whereCondition = dbReader.sequelize.and(
                    dbReader.Sequelize.and(
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`created_datetime`'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.gte]: range.start_date }),
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`created_datetime`'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.lte]: range.end_date })
                    ),
                    filter,
                    dbReader.Sequelize.or(
                        { subject_mail: { [SearchCondition]: SearchData } }
                    )
                )
            } else if (by == 'subject') {
                whereCondition = dbReader.sequelize.and(
                    dbReader.Sequelize.and(
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`created_datetime`'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.gte]: range.start_date }),
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`created_datetime`'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.lte]: range.end_date }),
                    ),
                    filter,
                    dbReader.Sequelize.or(
                        { subject_mail: { [SearchCondition]: SearchData } }
                    )
                )
            } else {
                whereCondition = dbReader.sequelize.and(
                    dbReader.Sequelize.and(
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`created_datetime`'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.gte]: range.start_date }),
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`created_datetime`'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.lte]: range.end_date })
                    ),
                    filter,
                    dbReader.Sequelize.or(
                        { subject_mail: { [SearchCondition]: SearchData } }
                    )
                )
            }

            let logData = await dbReader.sendEmailLog.findAll({
                attributes: [[dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('`created_datetime`'), '%Y-%m-%d'), 'created_date'], 'status', 'subject_mail', 'send_email_log_id', 'site_id'
                ],
                where: whereCondition
            })
            logData = JSON.parse(JSON.stringify(logData))
            const response: any = new Group(logData)
                ._by(by)
                ._sort(sort_field || "value", sort_order)
                ._page(page_no || 1)
                ._limit(page_record || null).convert;


            const countData = response.rows.reduce((a: any, b: any) => {
                a.sent_count += b.sent_count;
                a.failed_count += b.failed_count;
                a.total_count += b.total
                return a
            }, {
                days: moment(range.end_date).diff(range.start_date, "days") + 1,
                sent_count: 0,
                failed_count: 0,
                total_count: 0
            })

            // let dateRangeOfCurrent: any = [];
            // dateRangeOfCurrent = getDateRange(range.start_date, range.end_date, "YYYY-MM-DD");
            // let DateResponse = dateRangeOfCurrent.map(function (item: any) { return { 'value': item, 'sent_count': 0, 'failed_count': 0 ,'total':0} });
            // DateResponse.forEach((ele: any) => {
            //     logData.forEach((e: any) => {
            //         if (ele.value == e.created_date) { 
            //               ele.subject_mail = e.subject_mail
            //             if (e.status == 0) {
            //                 ele.failed_count++
            //             }
            //             if (e.status == 1) {
            //                 ele.sent_count++
            //             }
            //             ele.total = ele.sent_count + ele.failed_count
            //         }
            //     });
            // });

            // let SubjectResponse = DateResponse.map(function (item: any) { return { 'value': item.subject_mail, 'sent_count': item.sent_count, 'failed_count': item.failed_count ,'total':item.total} });
            // console.log(SubjectResponse)
            // SubjectResponse.forEach((ele: any) => {
            //     logData.forEach((e: any) => {
            //         if (ele.value == e.created_date) { 
            //             //  ele.subject_mail = e.subject_mail
            //             if (e.status == 0) {
            //                 ele.failed_count++
            //             }
            //             if (e.status == 1) {
            //                 ele.sent_count++
            //             }
            //             ele.total = ele.sent_count + ele.failed_count
            //         }
            //     });
            // });

            if (logData.length > 0) {
                new SuccessResponse(EC.success, {
                    ...response,
                    ...countData
                }).send(res);
            }
            else {
                new SuccessResponse(EC.noDataFound, {
                    rows: []
                }).send(res);
            }
            // let productData = await 
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getEmailListDataByDateAndSubject(req: Request, res: Response) {
        try {
            let { range, search, by, value, sort_field, sort_order, site_id } = req.body;
            var whereStatement: any = {};
            // Searching                           
            var SearchCondition = dbReader.Sequelize.Op.ne, SearchData = null;
            if (search) {
                SearchCondition = Op.like;
                SearchData = "%" + req.body.search + "%";
            }

            if (site_id) {
                whereStatement.site_id = site_id
            }

            //sorting
            sort_field = sort_field ? sort_field : 'created_datetime';
            sort_order = sort_order ? sort_order : 'DESC';

            //Pagination
            var limit = req.body.page_record == undefined ? 10 : parseInt(req.body.page_record);
            var offset = req.body.page_no == undefined ? 1 : parseInt(req.body.page_no);
            // Automatic offset and limit will set on the base of page number
            var row_limit = limit;
            var row_offset = (offset * limit) - limit;

            let whereCondition;
            if (by == 'date') {
                whereCondition = dbReader.sequelize.and(
                    dbReader.Sequelize.and(
                        whereStatement,
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`sendEmailLogs`.`created_datetime`'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.gte]: value }),
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`sendEmailLogs`.`created_datetime`'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.lte]: value })
                    ),
                    dbReader.Sequelize.or(
                        { subject_mail: { [SearchCondition]: SearchData } },
                        { receiver: { [SearchCondition]: SearchData } },
                        { sender: { [SearchCondition]: SearchData } },
                        [dbReader.Sequelize.where(dbReader.sequelize.fn("concat", dbReader.sequelize.col("first_name"), ' ', dbReader.sequelize.col("last_name")), { [SearchCondition]: SearchData })]
                    )
                )
            } else if (by == 'subject') {
                whereCondition = dbReader.sequelize.and(
                    whereStatement,
                    dbReader.Sequelize.and(
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`sendEmailLogs`.`created_datetime`'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.gte]: range.start_date }),
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`sendEmailLogs`.`created_datetime`'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.lte]: range.end_date }),
                    ),
                    dbReader.Sequelize.or(
                        { subject_mail: { [SearchCondition]: SearchData } },
                        { receiver: { [SearchCondition]: SearchData } },
                        { sender: { [SearchCondition]: SearchData } },
                        [dbReader.Sequelize.where(dbReader.sequelize.fn("concat", dbReader.sequelize.col("first_name"), ' ', dbReader.sequelize.col("last_name")), { [SearchCondition]: SearchData })]
                    ),
                    { subject_mail: value }
                )
            } else {
                whereCondition = dbReader.sequelize.and(
                    whereStatement,
                    dbReader.Sequelize.and(
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`sendEmailLogs`.`created_datetime`'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.gte]: range.value }),
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`sendEmailLogs`.`created_datetime`'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.lte]: range.value })
                    ),
                    dbReader.Sequelize.or(
                        { subject_mail: { [SearchCondition]: SearchData } },
                        { sender: { [SearchCondition]: SearchData } },
                        { receiver: { [SearchCondition]: SearchData } },
                        [dbReader.Sequelize.where(dbReader.sequelize.fn("concat", dbReader.sequelize.col("first_name"), ' ', dbReader.sequelize.col("last_name")), { [SearchCondition]: SearchData })]
                    )
                )
            }

            let logData = await dbReader.sendEmailLog.findAll({
                attributes: ['created_datetime', 'send_email_log_id',
                    'site_id',
                    'subject_mail',
                    'receiver',
                    'sender',
                    'html_link',
                    'status',
                    'response_data',
                    [dbReader.Sequelize.literal(`first_name`), 'first_name'],
                    [dbReader.Sequelize.literal(`last_name`), 'last_name'],
                    [dbReader.Sequelize.literal('`sycu_user`.`user_id`'), 'user_id'],
                    [dbReader.Sequelize.literal(`user_role`), 'user_role']
                ],
                where: whereCondition,
                include: [{
                    // required: true,
                    model: dbReader.users,
                    attributes: []
                }],
                order: [[sort_field, sort_order]]
                // offset: row_offset,
                // limit: row_limit
            })
            logData = JSON.parse(JSON.stringify(logData))
            let count = logData.length;
            logData = logData.splice(row_offset, row_limit);
            if (logData.length > 0) {
                new SuccessResponse(EC.success, {
                    rows: logData,
                    count: count
                }).send(res);
            }
            else {
                new SuccessResponse(EC.noDataFound, {
                    rows: []
                }).send(res);
            }

        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public getEmailGraphData = async (req: Request, res: Response) => {
        try {
            let { range, filter, site_id } = req.body;
            var whereStatement: any = {};
            let attributes: any = [[dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`created_datetime`'), '%Y-%m-%d'), 'created_datetime'], 'status'];
            switch (filter) {
                case "hour":
                    attributes = ['created_datetime', 'status'];
                    break;
            }

            if (site_id) {
                whereStatement.site_id = site_id
            }

            let logData = await dbReader.sendEmailLog.findAll({
                attributes: attributes,
                where: dbReader.sequelize.and(
                    whereStatement,
                    dbReader.Sequelize.and(
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`created_datetime`'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.gte]: range.start_date }),
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`created_datetime`'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.lte]: range.end_date })
                    ),
                ),
                // group: ['created_date']
            });
            if (logData.length > 0) {
                logData = JSON.parse(JSON.stringify(logData));
                let dateRange, arrayOfDatesOfCurrent: any = [];
                let getCounts = (arrCurrent: any, type: string) => {
                    let final: any = [];
                    if (type == 'hour') {
                        for (let ele of arrCurrent) {
                            for (let obj of ele) {
                                for (let value of logData) {
                                    if (obj.created_date == moment(value.created_datetime).format("YYYY-MM-DD HH")) {
                                        if (value.status == 0) {
                                            obj.failed_count++;
                                        }
                                        if (value.status == 1) {
                                            obj.sent_count++;
                                        }
                                    }
                                }
                            }
                        }
                        for (let i = 0; i < arrCurrent.length; i++) {
                            let current: any = { "sent_count": 0, "failed_count": 0 };
                            for (let j = 0; j < arrCurrent[i].length; j++) {
                                current.date = arrCurrent[i][j].date;
                                // current.end_date = arrCurrent[i][j].end_date;
                                current.sent_count += arrCurrent[i][j].sent_count;
                                current.failed_count += arrCurrent[i][j].failed_count;
                            }
                            final.push(current);
                        }
                    }
                    else {
                        for (let ele of arrCurrent) {
                            for (let obj of ele) {
                                for (let value of logData) {
                                    if (obj.created_date == value.created_datetime) {
                                        if (value.status == 0) {
                                            obj.failed_count++;
                                        }
                                        if (value.status == 1) {
                                            obj.sent_count++;
                                        }
                                    }
                                }
                            }
                        }
                        for (let i = 0; i < arrCurrent.length; i++) {
                            let current: any = { "sent_count": 0, "failed_count": 0 };
                            for (let j = 0; j < arrCurrent[i].length; j++) {
                                current.date = arrCurrent[i][j].date;
                                // current.end_date = arrCurrent[i][j].end_date;
                                current.sent_count += arrCurrent[i][j].sent_count;
                                current.failed_count += arrCurrent[i][j].failed_count;
                            }
                            final.push(current);
                        }
                        final.reverse();
                    }
                    let sent_count = 0, failed_count = 0;
                    final.forEach((e: any) => {
                        sent_count += e.sent_count;
                        failed_count += e.failed_count;
                    });
                    return { sent_count, failed_count, final };
                }
                switch (filter) {
                    case 'day': //by day
                        var daysOfYear1: any = [], daysOfYear2: any = [];
                        let dateRangeOfCurrent = getDateRange(range.start_date, range.end_date, "YYYY-MM-DD");
                        daysOfYear1 = dateRangeOfCurrent.map(function (item: any) { return { 'created_date': item, 'date': item, 'sent_count': 0, 'failed_count': 0 } });
                        daysOfYear1.reverse(); daysOfYear2.reverse();
                        for (let ele of daysOfYear1) {
                            for (let value of logData) {
                                if (ele.created_date == value.created_datetime) {
                                    if (value.status == 0) {
                                        ele.failed_count++;
                                    }
                                    if (value.status == 1) {
                                        ele.sent_count++;
                                    }
                                }
                            }
                        }
                        let final: any = [];
                        for (let i = 0; i < daysOfYear1.length; i++) {
                            let current: any = { "sent_count": 0 };
                            current.date = daysOfYear1[i].date;
                            // current.end_date = daysOfYear1[i].end_date;
                            current.sent_count = daysOfYear1[i].sent_count;
                            current.failed_count = daysOfYear1[i].failed_count;
                            final.push(current);
                        }
                        let sent_count = 0, failed_count = 0;
                        final.forEach((e: any) => {
                            sent_count += e.sent_count;
                            failed_count += e.failed_count;
                        });
                        new SuccessResponse(EC.errorMessage(EC.getMessage, ["New Email Chart Data"]), {
                            // @ts-ignore
                            token: req.token,
                            sent: sent_count,
                            failed: failed_count,
                            rows: final
                        }).send(res);
                        break;
                    case "week": //by week
                        moment.updateLocale('in', {
                            week: {
                                dow: 1 // Monday is the first day of the week
                            }
                        });
                        var now1 = new Date(range.end_date);
                        var daysOfYear1: any = [];
                        for (var d = new Date(range.start_date); d <= now1; d.setDate(d.getDate() + 1)) {
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
                        daysOfYear1.reverse();
                        for (let index = 0; index < daysOfYear1.length; index++) {
                            let startDate1 = daysOfYear1[index].start_date;
                            let lastDate1 = daysOfYear1[index].end_date;
                            dateRange = getDateRange(startDate1, lastDate1, "YYYY-MM-DD");
                            arrayOfDatesOfCurrent.push(dateRange.map(function (item) { return { 'created_date': item, 'date': item, 'sent_count': 0, 'failed_count': 0 } }));
                        }
                        let result1 = getCounts(arrayOfDatesOfCurrent, filter);
                        new SuccessResponse(EC.errorMessage(EC.getMessage, ["New Email Chart Data"]), {
                            // @ts-ignore
                            token: req.token,
                            sent: result1.sent_count,
                            failed: result1.failed_count,
                            rows: result1.final
                        }).send(res);
                        break;
                    case 'month': //by week
                        var now1 = new Date(range.end_date);
                        var daysOfYear1: any = [];
                        for (var d = new Date(range.start_date); d <= now1; d.setDate(d.getDate() + 1)) {
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
                        daysOfYear1.reverse();
                        for (let index = 0; index < daysOfYear1.length; index++) {
                            let startDate1 = daysOfYear1[index].start_date;
                            let lastDate1 = daysOfYear1[index].end_date;
                            dateRange = getDateRange(startDate1, lastDate1, "YYYY-MM-DD");
                            arrayOfDatesOfCurrent.push(dateRange.map(function (item) { return { 'created_date': item, 'date': item, 'sent_count': 0, 'failed_count': 0 } }));
                        }
                        let result2 = getCounts(arrayOfDatesOfCurrent, filter);
                        new SuccessResponse(EC.errorMessage(EC.getMessage, ["New Email Chart Data"]), {
                            // @ts-ignore
                            token: req.token,
                            sent: result2.sent_count,
                            failed: result2.failed_count,
                            rows: result2.final
                        }).send(res);
                        break;
                    case 'quarter': //by quarter
                        var daysOfYear1: any = [], daysOfYear2: any = [];
                        for (let m = moment(range.start_date); m <= moment(range.end_date); m.add(3, 'M')) {
                            let _currentStartDate = m.format("YYYY-MM-DD"),
                                _actualStartDate = moment(range.start_date).format("YYYY-MM-DD"),
                                _lastDate = moment(moment(m).add(3, 'M')).format("YYYY-MM-DD"),
                                _actualEndDate = moment(range.end_date).format("YYYY-MM-DD");
                            if ((_lastDate <= _actualEndDate || _actualEndDate >= _currentStartDate) && _actualStartDate <= _currentStartDate) {
                                dateRange = getDateRange(m, _lastDate, "YYYY-MM-DD");
                                daysOfYear1.push(dateRange.map(function (item: any) { return { 'created_date': item, 'date': item, 'sent_count': 0, 'failed_count': 0 } }));
                            }
                        }
                        daysOfYear1.reverse();
                        for (let index = 0; index < Math.min(daysOfYear1.length, daysOfYear2.length); index++) {
                            arrayOfDatesOfCurrent.push(daysOfYear1[index]);
                        }
                        let result3 = getCounts(arrayOfDatesOfCurrent, filter);
                        new SuccessResponse(EC.errorMessage(EC.getMessage, ["New Email Chart Data"]), {
                            // @ts-ignore
                            token: req.token,
                            sent: result3.sent_count,
                            failed: result3.failed_count,
                            rows: result3.final
                        }).send(res);
                        break;
                    case 'hour': //by hour
                        for (let m = moment(range.start_date).set({ hour: 0, minute: 0, second: 0 }); m <= moment(range.end_date).set({ hour: 23, minute: 59, second: 59 }); m.add(1, 'hours')) {
                            let _currentStartDate = m.format("YYYY-MM-DD HH:mm"),
                                _actualStartDate = moment(range.start_date).format("YYYY-MM-DD HH:mm"),
                                _lastDate = moment(m).format("YYYY-MM-DD HH:mm"),
                                _actualEndDate = moment(range.end_date).set({ hour: 23, minute: 59, second: 59 }).format("YYYY-MM-DD HH:mm");
                            if ((_lastDate <= _actualEndDate || _actualEndDate >= _currentStartDate) && _actualStartDate <= _currentStartDate) {
                                dateRange = getDateRange(m, _lastDate, "YYYY-MM-DD HH");
                                arrayOfDatesOfCurrent.push(dateRange.map(function (item: any) { return { 'created_date': item, 'date': item, 'sent_count': 0, 'failed_count': 0 } }));
                            }
                            _lastDate = moment(moment(m).add(1, 'hours')).format("YYYY-MM-DD HH:mm");
                        }
                        let result4 = getCounts(arrayOfDatesOfCurrent, filter);
                        new SuccessResponse(EC.errorMessage(EC.getMessage, ["New Email Chart Data"]), {
                            // @ts-ignore
                            //token: req.token,
                            sent: result4.sent_count,
                            failed: result4.failed_count,
                            rows: result4.final
                        }).send(res);
                        break;
                }
            } else new SuccessResponse(EC.noDataFound, {
                current: 0,
                previous: 0,
                rows: []
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

}


