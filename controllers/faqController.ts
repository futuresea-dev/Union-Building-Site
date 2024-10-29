import { Request, Response } from 'express'
import { ErrorController, SuccessResponse, BadRequestError, ApiError } from '../core/index';
const { dbReader, dbWriter } = require('../models/dbConfig');
const EC = new ErrorController();

export class FAQ {

  public async saveFaq(req: Request, res: Response) {
    try {
      //@ts-ignore
      let { user_id = 0 } = req, faq: any;
      let { faq_id = 0, site_id, title, content } = req.body;

      if (faq_id) {
        faq = await dbWriter.faq.update({
          title: title,
          content: content || "",
          updated_by: user_id
        }, {
          where: { faq_id: faq_id }
        });
      } else {
        let sort_order = 0;
        let sortOrderData = await dbReader.faq.findAll({
          attributes: [[dbReader.Sequelize.fn('MAX', dbReader.Sequelize.col('sort_order')), 'sort_order']],
        });
        sortOrderData = JSON.parse(JSON.stringify(sortOrderData));
        sort_order = sortOrderData[0].sort_order;
        sort_order = sort_order + 1;

        faq = await dbWriter.faq.create({
          site_id: site_id,
          title: title,
          content: content || "",
          sort_order: sort_order,
          is_deleted: 0,
          created_by: user_id,
          updated_by: user_id
        });
      }

      new SuccessResponse(EC.errorMessage(EC.saveDataSuccess), {
        // @ts-ignore
        token: req.token,
        data: faq
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async listAllFaq(req: Request, res: Response) {
    try {
      let { page_no, page_record, site_id } = req.body;
      let rowLimit = page_record ? parseInt(page_record) : 50;
      let rowOffset = page_no ? ((page_no * page_record) - page_record) : 0;

      let data = await dbReader.faq.findAndCountAll({
        where: { is_deleted: 0, site_id: site_id },
        limit: rowLimit,
        offset: rowOffset,
      });

      new SuccessResponse(EC.errorMessage(EC.success), {
        // @ts-ignore
        token: req.token,
        count: data.count,
        rows: data.rows
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async deleteFaq(req: Request, res: Response) {
    try {
      let { faq_id } = req.params;
      await dbWriter.faq.update({ is_deleted: 1 }, {
        where: { faq_id: faq_id }
      });
      new SuccessResponse(EC.errorMessage(EC.deleteDataSuccess), {
        // @ts-ignore
        token: req.token
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async getFaqDetails(req: Request, res: Response) {
    try {
      let { faq_id } = req.params;
      let data = await dbReader.faq.findOne({
        where: { is_deleted: 0, faq_id: faq_id },
      });
      new SuccessResponse(EC.errorMessage(EC.success), {
        // @ts-ignore
        token: req.token,
        data: data
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async sortFaq(req: Request, res: Response) {
    try {
      let { faq_ids = [] } = req.body, sortOrder = 0;
      let sort_order = "case faq_id", faqIds: any = [];

      if (faq_ids.length) {
        faq_ids.forEach((element: any) => {
          faqIds.push(element);
          sortOrder = sortOrder + 1;
          sort_order += " when " + element + " then " + sortOrder;
        });

        if (faqIds && faqIds.length) {
          sort_order += " else sort_order end";
          await dbWriter.faq.update({
            sort_order: dbWriter.Sequelize.literal(sort_order),
          }, {
            where: { faq_id: { [dbReader.Sequelize.Op.in]: faqIds } }
          });
        }
      }

      new SuccessResponse(EC.errorMessage(EC.saveDataSuccess), {
        // @ts-ignore
        token: req.token,
        data: true
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
}