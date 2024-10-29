import { Sequelize } from 'sequelize';
import { Request, Response } from "express";
import moment from 'moment';
import _ from 'lodash';
import { ErrorController, SuccessResponse, BadRequestError, ApiError } from '../core/index';
const { dbReader } = require('../models/dbConfig');
const EC = new ErrorController();
const { Op } = dbReader.Sequelize;
import { getDateRange } from '../helpers/helpers';
import { any } from "joi";

export class EmailLogController {

  public async getEmailLogData(req: Request, res: Response) {
    try {
      let { range, search, sort_field, sort_order } = req.body;
      // Searching                           
      var SearchCondition = dbReader.Sequelize.Op.ne, SearchData = null;
      if (search) {
        SearchCondition = Op.like;
        SearchData = "%" + req.body.search + "%";
      }
      var filter = dbReader.Sequelize.and();
      let titleFilter: any = {};
      if (req.body.filter) {

        var data = req.body.filter[0];
        filter = dbReader.Sequelize.and(data);
        if (data.title) {
          titleFilter.title = {
            [Op.like]: "%" + data.title + "%"
          }

        }
        delete data.title;
      }
      //Pagination
      var limit = req.body.page_record == undefined ? 10 : parseInt(req.body.page_record);
      var offset = req.body.page_no == undefined ? 1 : parseInt(req.body.page_no);

      // Automatic offset and limit will set on the base of page number
      var row_limit = limit;
      var row_offset = (offset * limit) - limit;
      var sortJoin = [[sort_field, sort_order]];
      if (sort_field) {
        if (sort_field == "created_date") {
          sortJoin = [dbReader.Sequelize.literal('created_datetime'), sort_order];
        }
        else if (sort_field == "subject") {
          sortJoin = [dbReader.Sequelize.literal('subject_mail'), sort_order];
        }
        else if (sort_field == "to") {
          sortJoin = [dbReader.Sequelize.literal('receiver'), sort_order];
        }
      } else {
        sortJoin = [dbReader.Sequelize.literal('created_datetime'), sort_order];
      }
      let logData = await dbReader.sendEmailLog.findAndCountAll({
        attributes: ['created_datetime', 'send_email_log_id',
          'site_id',
          'subject_mail',
          'receiver',
          'html_link',
          'status',
          'sender',
          'response_data',
          [dbReader.Sequelize.literal(`title`), 'site_name'],
          [dbReader.Sequelize.literal(`display_name`), 'display_name'],],
        where: dbReader.sequelize.and(
          dbReader.Sequelize.and(
            dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`sendEmailLogs`.`created_datetime`'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.gte]: range.start_date }),
            dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`sendEmailLogs`.`created_datetime`'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.lte]: range.end_date })
          ),
          dbReader.Sequelize.or(
            { subject_mail: { [SearchCondition]: SearchData } },
            { receiver: { [SearchCondition]: SearchData } },
            //{ sender: { [SearchCondition]: SearchData } },
          ),
          filter
        ),
        include: [{
          model: dbReader.sites,
          attributes: [],
          where: titleFilter
        }, {
          model: dbReader.users,
          attributes: [],
          where: {
            is_deleted: 0
          }
        }],
        offset: row_offset,
        order: [sortJoin],
        limit: row_limit
      })
      logData = JSON.parse(JSON.stringify(logData))
      if (logData.rows.length > 0) {
        new SuccessResponse(EC.success, {
          count: logData.count,
          rows: logData.rows
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
}
