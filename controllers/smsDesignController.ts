import { Request, Response } from "express";
import { ErrorController } from "../core/ErrorController";
import { SuccessResponse } from "../core/ApiResponse";
import { BadRequestError, ApiError } from "../core/ApiError";
const { dbReader, dbWriter } = require("../models/dbConfig");
const { GeneralController } = require('./generalController');

const EC = new ErrorController();

export class SMSDesignController {
  public async updateSMSDesign(req: Request, res: Response) {
    try {
      let { sms_design_template_id, title, sms_content, is_status, site_id } = req.body;
      
      let generalControllerObj = new GeneralController();
      let { user_id = 0 } = generalControllerObj.getCurrentUserDetail(req, res);
      
      await dbWriter.smsDesignTemplate.update(
        {
          title: title,
          sms_content: sms_content,
          is_status: is_status,
          site_id: site_id,
          updated_datetime: new Date(),
          updated_by: user_id,
        },
        {
          where: {
            sms_design_template_id: sms_design_template_id,
          },
        }
      );
      new SuccessResponse(EC.errorMessage(EC.savedMessage, ["SMS template"]), {
        //@ts-ignore
        token: req.token
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async listSMSDesign(req: Request, res: Response) {
    try {
      let { search, page_record, page_no, site_id = 5 } = req.body;
      let row_offset = 0, row_limit = 10;
      if (page_no) {
        row_offset = page_no * page_record - page_record;
      }
      //searching
      let SearchCondition = dbReader.Sequelize.Op.ne, SearchData = null;
      if (search) {
        SearchCondition = dbReader.Sequelize.Op.like;
        SearchData = "%" + search + "%";
      }
      let data = await dbReader.smsDesignTemplate.findAndCountAll({
        where:  dbReader.Sequelize.and(
          { site_id: site_id },
          dbReader.Sequelize.or(
            { title: { [SearchCondition]: SearchData } },
            { sms_content: { [SearchCondition]: SearchData } },
          )),
        limit: row_limit,
        offset: row_offset
      });
      if (data.rows.length > 0) {
        new SuccessResponse(EC.errorMessage(EC.getMessage, ["SMS Template"]), {
          //@ts-ignore
          token: req.token,
          count: data.count,
          rows: data.rows,
        }).send(res);
      } else new SuccessResponse(EC.noDataFound, {}).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async getSMSDesignDetail(req: Request, res: Response) {
    try {
      let { sms_design_template_id } = req.params;

      let data = await dbReader.smsDesignTemplate.findOne({
        attributes: ['sms_design_template_id', 'title', 'sms_content', 'site_id'],
        where: {
          sms_design_template_id: sms_design_template_id,
        }
      });
      if (data) {
        new SuccessResponse(EC.errorMessage(EC.getMessage, ["SMS Template"]), {
          //@ts-ignore
          token: req.token,
          data: data,
        }).send(res);
      } else new SuccessResponse(EC.noDataFound, {}).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
}
