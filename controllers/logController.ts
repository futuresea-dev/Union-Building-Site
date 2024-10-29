//SA - 14-04-2022
"use strict"
import { Request, Response } from "express";
import {
    ErrorController,
    SuccessResponse,
    BadRequestError,
    ApiError,
} from "../core/index";
import moment from 'moment'
const { dbReader, dbWriter } = require("../models/dbConfig");
const EC = new ErrorController();
const { Op } = dbReader.Sequelize;
export class LogController {
    //List api logs of particular sites
    public listApiLogs = async (req: Request, res: Response) => {
        try {
            let whereCond: any = "";
            let { page_no, page_record, site_id, date_search } = req.body,
                totalRecord = page_record * page_no,
                pageOffset = totalRecord - page_record, logList;
            if (date_search) {
                date_search = moment(date_search).format("YYYY-MM-DD")
                date_search = date_search.split(" ")[0]
                whereCond = dbReader.Sequelize.where(dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col("`sycu_api_log`.`created_datetime`"), '%Y-%m-%d'), { [dbReader.Sequelize.Op.eq]: date_search })
            }
            else {
                whereCond
            }
            if (site_id.length > 0) {
                if (site_id == 0) {
                    logList = await dbReader.apiLogs.findAndCountAll({
                        attributes: ['api_log_id', 'api_url', 'method', 'request', [dbReader.Sequelize.literal('`sycu_site`.`title`'), 'site_name'], 'response',
                            'created_datetime', 'updated_datetime', 'header'],
                        include: [
                            {
                                model: dbReader.sites,
                                attributes: [],
                            }
                        ],
                        where: whereCond,
                        limit: page_record,
                        offset: pageOffset,
                        order: [['created_datetime', 'DESC']]
                    });
                }
                else {
                    logList = await dbReader.apiLogs.findAndCountAll({
                        attributes: ['api_log_id', 'api_url', 'method', 'request', [dbReader.Sequelize.literal('`sycu_site`.`title`'), 'site_name'], 'response', 'header',
                            'created_datetime', 'updated_datetime'],

                        include: [
                            {
                                model: dbReader.sites,
                                attributes: [],
                                where: { site_id: { [dbReader.Sequelize.Op.in]: site_id } }
                            }
                        ],
                        where: dbReader.sequelize.and({ site_id: { [dbReader.Sequelize.Op.in]: site_id } },
                            whereCond),
                        limit: page_record,
                        offset: pageOffset,
                        order: [['created_datetime', 'DESC']]
                    });
                }


                logList = JSON.parse(JSON.stringify(logList));
                new SuccessResponse(EC.errorMessage(EC.DataFetched), {
                    count: logList.count,
                    rows: logList.rows
                }).send(res);
            }
            else {
                throw new Error(EC.error);
            }
        }
        catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    //List all sites details
    public sitesList = async (req: Request, res: Response) => {
        try {
            let sitesList = await dbReader.sites.findAll({
                attributes: ['site_id', 'title', 'url', 'is_debugger', 'api_url'],
            });
            sitesList = JSON.parse(JSON.stringify(sitesList))
            if (sitesList.length > 0) {
                new SuccessResponse(EC.errorMessage(EC.DataFetched), {
                    sitesList
                }).send(res);
            }
            else {
                throw new Error(EC.error);
            }
        }
        catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    //Change status of debugger option
    public debuggerIsActiveOrNot = async (req: Request, res: Response) => {
        try {
            let { site_id, is_debugger } = req.body;
            if (site_id.length > 0) {
                if (is_debugger == true) {
                    if (site_id == 0) {
                        await dbWriter.sites.update({
                            is_debugger: 1,
                        }, {
                            where: { site_id: { [dbReader.Sequelize.Op.in]: [1, 2, 3, 4, 5, 6, 7, 8,9] } }
                        });

                        new SuccessResponse(EC.errorMessage(EC.success), {
                        }).send(res);
                    }
                    else {
                        await dbWriter.sites.update({
                            is_debugger: 1,
                        },
                            {
                                where: { site_id: { [dbReader.Sequelize.Op.in]: site_id } }
                            });

                        new SuccessResponse(EC.errorMessage(EC.success), {
                        }).send(res);
                    }
                }
                else if (is_debugger == false) {
                    if (site_id == 0) {
                        await dbWriter.sites.update({
                            is_debugger: 0,
                        }, { where: { site_id: { [dbReader.Sequelize.Op.in]: [1, 2, 3, 4, 5, 6, 7, 8] } } })
                    }
                    else {
                        await dbWriter.sites.update({
                            is_debugger: 0,
                        }, { where: { site_id: { [dbReader.Sequelize.Op.in]: site_id } } })
                    }
                    new SuccessResponse(EC.errorMessage(EC.success), {
                    }).send(res);
                }
                else {
                    throw new Error(EC.error);
                }
            }
            else {
                throw new Error(EC.error);
            }

        }
        catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public clearApiLogData = async (req: Request, res: Response) => {
        try {
            let { delete_logs_for, site_id } = req.body;
            let whereCond: any = "", data, apiLogIds: any = [], deleteLogs;
            let today = moment(new Date()).format("YYYY-MM-DD");
            let delete_for = (delete_logs_for == 1) ? "clear_all_logs" : (delete_logs_for == 2) ? "keep_last_day_data" : (delete_logs_for == 3) ? "keep_last_week_data" : (delete_logs_for == 4) ? "keep_last_15_days_data"
                : (delete_logs_for == 5) ? "keep_this_month_data" : (delete_logs_for == 6) ? "keep_last_month_data" : "no_data"

            switch (delete_for) {

                case "clear_all_logs":
                    data = await dbReader.apiLogs.findAndCountAll({
                        attributes: ['api_log_id'],
                        where: {
                            site_id: site_id
                        }
                    })
                    data = JSON.parse(JSON.stringify(data));
                    break;

                case "keep_last_day_data": //delete all api logs except today and yesterday
                    let yesterday = moment(new Date(Date.now() - 864e5)).format("YYYY-MM-DD");
                    whereCond = dbReader.Sequelize.where(dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col("`created_datetime`"), '%Y-%m-%d'), { [dbReader.Sequelize.Op.between]: [yesterday, today] })
                    data = await dbReader.apiLogs.findAndCountAll({
                        attributes: ['api_log_id'],
                        where: dbReader.sequelize.and({ site_id: site_id }, whereCond),
                    });
                    data = JSON.parse(JSON.stringify(data));
                    break;

                case "keep_last_week_data": //delete all api logs except from today to a week
                    let week = moment(new Date(Date.now() - 6804e5)).format("YYYY-MM-DD");
                    whereCond = dbReader.Sequelize.where(dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col("`created_datetime`"), '%Y-%m-%d'), { [dbReader.Sequelize.Op.between]: [week, today] })
                    data = await dbReader.apiLogs.findAndCountAll({
                        attributes: ['api_log_id'],
                        where: dbReader.sequelize.and({ site_id: site_id }, whereCond),
                    });
                    data = JSON.parse(JSON.stringify(data));
                    break;

                case "keep_last_15_days_data"://delete all api logs except from today to 15 days
                    let halfMonth = moment(new Date(Date.now() - 1296e6)).format("YYYY-MM-DD");
                    whereCond = dbReader.Sequelize.where(dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col("`created_datetime`"), '%Y-%m-%d'), { [dbReader.Sequelize.Op.between]: [halfMonth, today] })
                    data = await dbReader.apiLogs.findAndCountAll({
                        attributes: ['api_log_id'],
                        where: dbReader.sequelize.and({ site_id: site_id }, whereCond),
                    });
                    data = JSON.parse(JSON.stringify(data));
                    break;

                case "keep_this_month_data"://delete all api logs except from today to a month
                    let month = moment(new Date(Date.now() - 2592e6)).format("YYYY-MM-DD");
                    whereCond = dbReader.Sequelize.where(dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col("`created_datetime`"), '%Y-%m-%d'), { [dbReader.Sequelize.Op.between]: [month, today] })
                    data = await dbReader.apiLogs.findAndCountAll({
                        attributes: ['api_log_id'],
                        where: dbReader.sequelize.and({ site_id: site_id }, whereCond),
                    });
                    data = JSON.parse(JSON.stringify(data));
                    break;

                case "keep_last_month_data"://delete all api logs except from today to a last month
                    let lastMonth = moment(new Date(Date.now() - 5184e6)).format("YYYY-MM-DD");
                    whereCond = dbReader.Sequelize.where(dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col("`created_datetime`"), '%Y-%m-%d'), { [dbReader.Sequelize.Op.between]: [lastMonth, today] })
                    data = await dbReader.apiLogs.findAndCountAll({
                        attributes: ['api_log_id'],
                        where: dbReader.sequelize.and({ site_id: site_id }, whereCond),
                    });
                    data = JSON.parse(JSON.stringify(data));
                    break;

                case "no_data":
                    break;
                default:
                    break;
            }

            if (delete_for != "no_data") {
                let whereUpdate;

                data.rows.forEach((element: any) => {
                    apiLogIds.push(element.api_log_id)
                });
                console.log("array->", apiLogIds)
                if (delete_for == "clear_all_logs") {
                    whereUpdate = { [dbReader.Sequelize.Op.in]: apiLogIds }
                }
                else {
                    whereUpdate = { [dbReader.Sequelize.Op.notIn]: apiLogIds }
                }
                if (apiLogIds.length > 0) {
                    deleteLogs = await dbWriter.apiLogs.destroy({
                        where: dbReader.sequelize.and({ api_log_id: whereUpdate },
                            { site_id: site_id }),
                    })
                    if (deleteLogs > 0) {
                        new SuccessResponse(EC.errorMessage(EC.updatedDataSuccess), {
                            count: data.count,
                        }).send(res);
                    }
                    else {
                        new SuccessResponse(EC.errorMessage(EC.noDataFound), {
                            count: data.count,
                        }).send(res);
                    }
                }
            }
            else {
                new SuccessResponse(EC.errorMessage(EC.noDataFound), {
                }).send(res);
            }
        }
        catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
}
