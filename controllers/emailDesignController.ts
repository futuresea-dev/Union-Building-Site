import { Request, Response } from "express";
import { ErrorController } from "../core/ErrorController";
import { SuccessResponse } from "../core/ApiResponse";
import { BadRequestError, ApiError } from "../core/ApiError";
const { dbReader, dbWriter } = require("../models/dbConfig");

const EC = new ErrorController();

/*
  * updating email design template data  - 
  * Code done by Smit 24-11-2021
*/
export class emailDesignController {

  //Sm 26-11-21
  public async updateEmailDesignTemplate(req: Request, res: Response) {
    try {
      let { email_design_template_id, title, subject, template_html_text, reply_on_email_address, is_status, site_id } = req.body
      //@ts-ignore
      let { user_id } = req
      if (email_design_template_id) {
        await dbWriter.emailDesignTemplate.update({
          title: title,
          subject: subject,
          template_html_text: template_html_text,
          reply_on_email_address: reply_on_email_address,
          is_status: is_status,
          is_for: site_id,
          updated_datetime: new Date(),
          updated_by: user_id
        }, {
          where: {
            email_design_template_id: email_design_template_id,
          },
        })
        //Sm 30-11-2021
        new SuccessResponse(EC.emailDesignSuccess, {
          //@ts-ignore
          token: req.token
        }).send(res)
      } else throw new Error("Please Provide Email Design Template ID...")
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res)
    }
  }

  //Sm 26-11-21
  public async listEmailDesignTemplate(req: Request, res: Response) {
    try {
      let { site_id, page_record, page_no, search } = req.body
      let row_offset = 0, row_limit = 10

      if (page_record)
        row_limit = parseInt(page_record)

      if (page_no)
        row_offset = page_no * page_record - page_record

      //searching
      //Sm 29-11-21
      let SearchCondition = dbReader.Sequelize.Op.ne, SearchData = null
      if (search) {
        SearchCondition = dbReader.Sequelize.Op.like
        SearchData = `%${search}%`
      }

      let siteCond = dbReader.Sequelize.Op.ne, siteData = null
      if (site_id) {
        siteCond = dbReader.Sequelize.Op.eq
        siteData = site_id
      }

      var emailDesignTemplateData = await dbReader.emailDesignTemplate.findAndCountAll({
        where: dbReader.Sequelize.and(
          { is_for: { [siteCond]: siteData }, is_deleted: 0 },
          dbReader.Sequelize.or(
            { title: { [SearchCondition]: SearchData } },
            { subject: { [SearchCondition]: SearchData } }
          )
        ),
        limit: row_limit,
        offset: row_offset
      })
      var message = emailDesignTemplateData.count > 0 ? EC.success : EC.noDataFound
      new SuccessResponse(message, {
        //@ts-ignore
        token: req.token,
        email_design_template_data: emailDesignTemplateData,
      }).send(res)
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res)
    }
  }

  //Sm 26-11-21
  public async getEmailDesignTemplateDetail(req: Request, res: Response) {
    try {
      // Sm 01-12-21
      let { email_design_template_id } = req.params
      if (!email_design_template_id) throw new Error("Email design template id is a required field.")

      var emailDesignTemplateData = await dbReader.emailDesignTemplate.findOne({
        where: {
          email_design_template_id: email_design_template_id,
        }
      });
      new SuccessResponse(EC.success, {
        user: null,
        //@ts-ignore
        token: req.token,
        email_design_template_detail: emailDesignTemplateData,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
}
