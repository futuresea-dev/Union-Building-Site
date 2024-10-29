//Santosh 22-21-2021

import { Request, Response } from "express";
import {
  ErrorController,
  SuccessResponse,
  BadRequestError,
  ApiError,
} from "../core/index";
const { dbReader, dbWriter } = require("../models/dbConfig");

const EC = new ErrorController();

export class CountdownController {

  public saveCountdownConfiguration = async (req: Request, res: Response) => {
    try {
      //Receiving token and user_id from frontend
      //@ts-ignore
      let { token, user_id } = req
      let { type, type_value, created_by, updated_by } = req.body
      let cc_id = req.body.cc_id || 0;

      let sort_order = 0
      var maxSortOrder = await dbReader.countdownConfiguration.findAll({
        attributes: [[dbReader.Sequelize.fn('MAX', dbReader.Sequelize.col('sort_order')), 'sort_order']],
        where: {
          type: type
        }
      })

      maxSortOrder = JSON.parse(JSON.stringify(maxSortOrder))
      sort_order = maxSortOrder[0].sort_order
      sort_order = sort_order + 1
      if (cc_id == 0) {
        await dbWriter.countdownConfiguration.create(
          {
            created_by: user_id,
            type: type,
            type_value: type_value,
            sort_order: sort_order,
            is_deleted: 0,
          },
        );
        new SuccessResponse(
          EC.errorMessage(EC.saveDataSuccess, ["Countdown_Configuration"]),
          {
            token: token,
          }
        ).send(res);
      } else {
        await dbWriter.countdownConfiguration.update({
          type: type,
          updated_by: user_id,
          type_value: type_value,
          is_deleted: 0,
          updated_datetime: new Date(),
        }, {
          where: {
            cc_id: cc_id,
          },
        });
        new SuccessResponse(
          EC.errorMessage(EC.updatedDataSuccess, ["Countdown_Configuration"]),
          {
            token: token,
          }
        ).send(res);
      }
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };
  public listCountdownConfiguration = async (req: Request, res: Response) => {
    try {

      //Receiving token and user_id from frontend
      //@ts-ignore
      let { token } = req
      let { type } = req.params

      var countdown_configuration = await dbReader.countdownConfiguration.findAll({
        attributes: ['cc_id', 'type', 'type_value', 'sort_order'],
        where: {
          is_deleted: 0,
          type: type
        },

      });

      countdown_configuration = JSON.parse(JSON.stringify(countdown_configuration)); //Receive data in json format
      if (countdown_configuration.count = "" || 0) {
        throw new Error(EC.noDataFound)
      }
      else {
        new SuccessResponse(
          EC.errorMessage(EC.DataFetched, ["Countdown_Configurations"]),
          {
            token: token,
            countdown_configuration: countdown_configuration,
          }
        ).send(res);
      }
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };
  public deleteCountdownConfiguration = async (req: Request, res: Response) => {
    try {

      //Receiving token and user_id from frontend
      //@ts-ignore
      let { token, user_id } = req
      let { cc_id } = req.params;

      var users = await dbReader.users.findOne({
        attributes: ['user_role'],
        where: {
          user_id: user_id
        }
      })
      users = JSON.parse(JSON.stringify(users))
      var userRole = users.user_role
      if (userRole == 1 || userRole == 2) {
        await dbWriter.countdownConfiguration.update({
          is_deleted: 1,
          updated_by: user_id
        }, {
          where: {
            cc_id: cc_id
          }
        })
        new SuccessResponse(
          EC.errorMessage(EC.deleteDataSuccess, ["Countdown_Configuration"]),
          {
            token: token,
          }
        ).send(res);
      }
      else {
        throw new Error('Record already deleted or you are not authorized to delete it')
      }

      // else {
      //   throw new Error('Record already deleted or not authorized to delete it.. ')
      // }
      // var data = await dbReader.users.findAll({
      //   attributes: ['user_role'],
      //   where: {
      //     user_id: user_id,
      //     is_deleted: 0
      //   }
      // })
      // data = JSON.parse(JSON.stringify(data))
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };
  public saveDefaultCountdown = async (req: Request, res: Response) => {
    try {
      //Receiving token and user_id from frontend
      //@ts-ignore
      let { token, user_id } = req
      let { bg_type, bg_value, box_bg_color, box_title, box_title_color, box_font_style, countdown_minutes, updated_by } = req.body
      let countdown_id = req.body.countdown_id || 0;
      if (countdown_id != 0) {
        await dbWriter.countdowns.update(
          {
            updated_by: user_id,
            user_id: user_id,
            bg_type: bg_type,
            bg_value: bg_value,
            box_bg_color: box_bg_color,
            box_title: box_title,
            box_title_color: box_title_color,
            box_font_style: box_font_style,
            countdown_minutes: countdown_minutes,
          },
          {
            where: {
              is_default: 1,
              countdown_id: countdown_id
            }
          }
        );
        new SuccessResponse(
          EC.errorMessage(EC.updatedDataSuccess, ["Countdown_Configuration"]),
          {
            token: token,
          }
        ).send(res);
      }
      else {
        throw new Error(EC.error);
      }
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };

  //api for sortable order in listing of countdown configuration
  public sortCountdownConfiguration = async (req: Request, res: Response) => {
    try {
      //@ts-ignore
      let { token } = req
      let configurationArray = req.body.configuration; // array of objects of cc_id and sort_order
      let addConfigurationArray: any = []

      if (configurationArray.length > 0) {
        for (var i = 0; i < configurationArray.length; i++) {
          if (configurationArray[i].cc_id != 0) {
            addConfigurationArray.push({
              cc_id: configurationArray[i].cc_id,
              sort_order: configurationArray[i].sort_order
            })
          }
        }
      }
      else {
        throw new Error('configuration array should not be empty or null')
      }

      if (addConfigurationArray.length) {
        let updatedSortOrder = await dbWriter.countdownConfiguration.bulkCreate(
          addConfigurationArray, { updateOnDuplicate: ['sort_order'] }   // bulk updated of sort_order 
        )
        updatedSortOrder = JSON.parse(JSON.stringify(updatedSortOrder))
        new SuccessResponse(
          EC.errorMessage(EC.updatedDataSuccess),
          {
            token: token,
          }
        ).send(res);
      }
      else {
        throw new Error("addConfigurationArray is empty..")
      }
    }
    catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res)
    }
  }
  public async getDefaultCountdown(req: Request, res: Response) {
    try {
      //@ts-ignore
      let { token } = req
      var default_countdown = await dbReader.countdowns.findOne({
        attributes: ['countdown_id', 'bg_type', 'bg_value', 'box_bg_color', 'box_title', 'box_title_color', 'box_font_style', 'countdown_minutes'],
        where: {
          is_default: 1
        }
      })
      default_countdown = JSON.parse(JSON.stringify(default_countdown))
      if (default_countdown) {
        new SuccessResponse(EC.DataFetched, {
          token: token,
          default_countdown: default_countdown
        }).send(res);
      }
      else {
        throw new Error(EC.noDataFound)
      }
    }
    catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  //List details of all exported videos
  public exportCountdownVideoLogs = async (req: Request, res: Response) => {
    try {
      //@ts-ignore
      let { token } = req, exportVideoDetails, row_limit = 20, row_offset = 0;
      let { page_no, page_record } = req.body
      if (page_record) {
        row_limit = parseInt(page_record);
      }
      if (page_no) {
        row_offset = (page_no * page_record) - page_record;
      }
      exportVideoDetails = await dbReader.exportCountdownVideoRequest.findAndCountAll({
        attributes: ["request_id", "countdown_id", "user_id", "fail_reason", "retry_attempts",
          "server_process_id", "log_url", "in_process_date", "finish_date", "failed_date", "cancel_request_date", "created_datetime",
          "cancel_finish_date", "status"],
        include: [{
          model: dbReader.countdowns,
          attributes: ["exported_video_url"],
        }],
        limit: page_record,
        offset: row_offset,
        order: [['created_datetime', 'DESC']]
      })
      exportVideoDetails = JSON.parse(JSON.stringify(exportVideoDetails))
      exportVideoDetails.rows.forEach((element: any) => {
        element.request_id = (element.request_id != null) ? element.request_id : "";
        element.countdown_id = (element.countdown_id != null) ? element.countdown_id : "",
          element.user_id = (element.user_id != null) ? element.user_id : "",
          element.status = (element.status != null) ? element.status : "",
          element.server_process_id = (element.server_process_id != null) ? element.server_process_id : "",
          element.is_in_process = (element.status != null && element.status == 1) ? 1 : 0;
        element.is_in_cancel = (element.status != null && element.status == 5) ? 1 : 0;
        element.created_datetime = (element.created_datetime != null) ? element.created_datetime : "",
          element.in_process_date = (element.in_process_date != null) ? element.in_process_date : "",
          element.finish_date = (element.finish_date != null) ? element.finish_date : "",
          element.failed_date = (element.failed_date != null) ? element.failed_date : "",
          element.cancel_request_date = (element.cancel_request_date != null) ? element.cancel_request_date : "",
          element.cancel_finish_date = (element.cancel_finish_date != null) ? element.cancel_finish_date : "",
          element.retry_attempts = (element.retry_attempts != null) ? element.retry_attempts : "",
          element.fail_reason = (element.fail_reason != null) ? element.fail_reason : "",
          element.log_file = (element.log_url != null) ? element.log_url : "",
          element.exported_video = (element.gg_countdown.exported_video_url != null) ? element.gg_countdown.exported_video_url : "";
        delete element.gg_countdown;

      });
      if (exportVideoDetails.rows.length > 0) {
        new SuccessResponse(EC.success, {
          token: token,
          count: exportVideoDetails.count,
          rows: exportVideoDetails.rows
        }).send(res);
      } else {
        new SuccessResponse(EC.noDataFound, {
          token: token,
          count: exportVideoDetails.count,
          rows: exportVideoDetails.rows
        }).send(res);
      }
    }
    catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res)
    }
  }
}
