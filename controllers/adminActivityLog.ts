//Sm & So
import { Request, Response } from "express";
import { ErrorController, SuccessResponse, BadRequestError, ApiError } from '../core/index';
const { dbReader, dbWriter } = require('../models/dbConfig');
const { Op } = dbReader.Sequelize;
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWSACCESSKEYID,
  secretAccessKey: process.env.AWSSECRETACCESSKEY,
});
const EC = new ErrorController();

export class AdminActivityLog {

  public getAdminActivityLog = async (req: Request, res: Response) => {
    try {

      const requestContent: any = req;
      let userId = requestContent.user_id;

      //Pagination
      var limit = req.body.page_record == undefined ? 10 : parseInt(req.body.page_record);
      var offset = req.body.page_no == undefined ? 1 : parseInt(req.body.page_no);

      // Automatic Offset and limit will set on the base of page number 
      var row_limit = limit;
      var row_offset = offset * limit - limit;


      var sortField = "admin_activity_log_id",
        sortOrder = "DESC";

      if (req.body.sortField) {
        sortField = req.body.sortField;
      }
      if (req.body.sortOrder) {
        sortOrder = req.body.sortOrder;
      }

      // Searching
      var searchCondition = dbReader.Sequelize.Op.ne,
        searchData = null;
      if (req.body.search) {
        searchCondition = Op.like;
        searchData = "%" + req.body.search + "%";
      }

      // Filtering
      var filter = dbReader.Sequelize.and();

      if (req.body.filter) {
        var data = req.body.filter[0];
        filter = dbReader.Sequelize.and(data);
      }

      // If folder is is available then give record of that folder
      // otherwise all record
      let id,
        idCondition = Op.ne;
      if (req.body.admin_activity_log_id && req.body.admin_activity_log_id != 0) {
        idCondition = Op.in;
        id = [req.body.admin_activity_log_id];
      } else {
        id = 0;
      }

      let getAdminActivityLog = await dbReader.adminActivityModel.findAndCountAll(
        {
          attributes: [
            "admin_activity_log_id",
            "user_id",
            "activity_type",
            "module",
            "submodule",
            "description",
            "created_datetime",
            [dbReader.Sequelize.literal("first_name"), "first_name"],
            [dbReader.Sequelize.literal("last_name"), "last_name"],
            [dbReader.Sequelize.literal("email"), "email"],
            [dbReader.Sequelize.literal("profile_image"), "profile_image"],
          ],
          include: [
            {
              required: false,
              model: dbReader.users,
              attributes: [],
              where: {
                is_deleted: 0
              }
            }
          ],
          where: dbReader.Sequelize.and(
            {
              is_deleted: 0,
              admin_activity_log_id: {
                [idCondition]: id,
              }
            },
            dbReader.Sequelize.or(
              { activity_type: { [searchCondition]: searchData } },
              { module: { [searchCondition]: searchData } },
              { submodule: { [searchCondition]: searchData } },
              { description: { [searchCondition]: searchData } }
            ),
            filter
          ),
          offset: row_offset,
          order: [[sortField, sortOrder]],
          limit: row_limit,
        }
      );

      if (getAdminActivityLog.count > 0) {

        new SuccessResponse(EC.listAdminLogs, {
          //@ts-ignore
          token: req.token,
          count: getAdminActivityLog.count,
          rows: getAdminActivityLog.rows,
        }).send(res);

      } else {
        new SuccessResponse(EC.noDataFound, {
          //@ts-ignore
          token: req.token,
          rows: [],
        }).send(res);
      }

    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);

    }
  }

  public addAdminActivityLog = async (req: Request, res: Response) => {
    try {
      // Getting user Id from bearer token
      const requestContent: any = req;
      let userId = requestContent.user_id;

      let { activity_type, module, submodule, description } = req.body;

      let insertAdminActivityLog = await dbWriter.adminActivityModel.create({
        user_id: userId,
        activity_type: activity_type,
        module: module,
        submodule: submodule,
        description: description
      });


      insertAdminActivityLog = JSON.parse(JSON.stringify(insertAdminActivityLog));
      new SuccessResponse(EC.success, {
        //@ts-ignore
        token: req.token,
        ...insertAdminActivityLog,
      }).send(res);

    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);

    }
  }

  public userWiseAdminActivityLog = async (req: Request, res: Response) => {
    try {
      let { current_date_range, user_id } = req.body;
      //Pagination
      var limit = req.body.page_record == undefined ? 10 : parseInt(req.body.page_record);
      var offset = req.body.page_no == undefined ? 1 : parseInt(req.body.page_no);
      // Automatic Offset and limit will set on the base of page number 
      var row_limit = limit;
      var row_offset = offset * limit - limit;
      var sortField = "admin_activity_log_id",
        sortOrder = "DESC";
      if (req.body.sortField) {
        sortField = req.body.sortField;
      }
      if (req.body.sortOrder) {
        sortOrder = req.body.sortOrder;
      }
      // Searching
      var searchCondition = dbReader.Sequelize.Op.ne,
        searchData = null;
      if (req.body.search) {
        searchCondition = Op.like;
        searchData = "%" + req.body.search + "%";
      }
      let getAdminActivityLog = await dbReader.adminActivityModel.findAndCountAll(
        {
          attributes: [
            "admin_activity_log_id",
            "user_id",
            "activity_type",
            "module",
            "submodule",
            "description",
            "created_datetime",
            // [dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('`sycu_admin_activity_logs`.`created_datetime`'), '%Y-%m-%d'), 'created_datetime'],
            [dbReader.Sequelize.literal("first_name"), "first_name"],
            [dbReader.Sequelize.literal("last_name"), "last_name"],
            [dbReader.Sequelize.literal("email"), "email"],
            [dbReader.Sequelize.literal("profile_image"), "profile_image"],
          ],
          include: [
            {
              model: dbReader.users,
              attributes: [],
              where: {
                is_deleted: 0
              }
            }
          ],
          where: dbReader.Sequelize.and(
            { user_id: user_id },
            dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`sycu_admin_activity_logs.created_datetime`'), '%Y-%m-%d'), { [Op.gte]: current_date_range.start_date }),
            dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`sycu_admin_activity_logs.created_datetime`'), '%Y-%m-%d'), { [Op.lte]: current_date_range.end_date }),
            dbReader.Sequelize.or(
              { activity_type: { [searchCondition]: searchData } },
              { module: { [searchCondition]: searchData } },
              { submodule: { [searchCondition]: searchData } },
              { description: { [searchCondition]: searchData } }
            ),
          ),
          offset: row_offset,
          order: [[sortField, sortOrder]],
          limit: row_limit,
        }
      );
      if (getAdminActivityLog.count > 0) {
        new SuccessResponse(EC.listAdminLogs, {
          //@ts-ignore
          token: req.token,
          count: getAdminActivityLog.count,
          rows: getAdminActivityLog.rows,
        }).send(res);
      } else {
        new SuccessResponse(EC.noDataFound, {
          //@ts-ignore
          token: req.token,
          rows: [],
        }).send(res);
      }
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

}