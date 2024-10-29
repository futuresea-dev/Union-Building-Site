import { Request, Response } from "express";
import {
  ErrorController,
  SuccessResponse,
  BadRequestError,
  ApiError,
} from "../core/index";
const { dbReader, dbWriter } = require("../models/dbConfig");
const { Op } = dbReader.Sequelize;
const EC = new ErrorController();

export class tutorial {
  public async saveTutorial(req: Request, res: Response) {
    try {
      //@ts-ignore
      let { user_id = 0 } = req, tutorial: any
      let {
        tutorial_id = 0,
        site_id,
        title,
        content,
        featured_image_url,
        video_url,
        button_link,
        is_active,
        tags,
        type
      } = req.body;
      if (tutorial_id) {
        tutorial = await dbWriter.tutorial.update({
          site_id: site_id,
          title: title,
          content: content,
          featured_image_url: featured_image_url || "",
          video_url: video_url || "",
          button_link: button_link || "",
          is_active: is_active || 0,
          user_id: user_id,
          updated_by: user_id,
          tags: tags.length ? tags.join(",") : "",
          type: type || 0
        }, {
          where: { tutorial_id: tutorial_id },
        });
      } else {
        tutorial = await dbWriter.tutorial.create({
          site_id: site_id,
          title: title,
          content: content,
          featured_image_url: featured_image_url || "",
          video_url: video_url || "",
          button_link: button_link || "",
          is_active: is_active || 0,
          user_id: user_id,
          updated_by: user_id,
          tags: tags.length ? tags.join(",") : "",
          type: type || 0
        });
      }
      new SuccessResponse(EC.errorMessage(EC.saveDataSuccess), {
        // @ts-ignore
        token: req.token,
        data: tutorial,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async listAllTutorials(req: Request, res: Response) {
    try {
      let { site_id } = req.params;
      let data = await dbReader.tutorial.findAll({
        where: { is_deleted: 0, site_id: site_id },
      });
      data = JSON.parse(JSON.stringify(data));
      data = data.map((s: any) => {
        s.tags = s.tags ? s.tags.split(",") : [];
        return s;
      });
      new SuccessResponse(EC.errorMessage(EC.success), {
        // @ts-ignore
        token: req.token,
        rows: data,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async listAllTutorialsv1(req: Request, res: Response) {
    try {
      let { site_id, page_no, page_record, type = [0] } = req.body;
      page_no = parseInt(page_no),
        page_record = parseInt(page_record)
      let rowOffset = 0, rowLimit;
      if (isNaN(page_record) || page_record == undefined) {
        rowLimit = 25;
      }
      else {
        rowLimit = page_record;
      }
      if (page_no) {
        rowOffset = (page_no * rowLimit) - rowLimit;
      }
      let data
      // Searching
      var searchCondition = dbReader.Sequelize.Op.ne, searchData = null;
      if (req.body.search) {
        searchCondition = Op.like;
        searchData = "%" + req.body.search + "%";
      }
      if (site_id == 0) {
        data = await dbReader.tutorial.findAndCountAll({
          attributes: ['tutorial_id', 'site_id', 'title', 'content', 'featured_image_url', 'video_url', 'button_link', 'is_active', 'created_datetime', 'updated_datetime', [dbReader.Sequelize.literal('`sycu_site`.`title`'), 'site_name'],
            [dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('updated_datetime'), '%H:%i:%s'), 'updated_datetime']],
          where: dbReader.Sequelize.and({ is_deleted: 0, is_active: 1 },
            dbReader.Sequelize.or(
              { title: { [searchCondition]: searchData } },
              { content: { [searchCondition]: searchData } },
            ),
          ),
          include: [{
            model: dbReader.sites,
            attributes: []
          }],
          limit: rowLimit,
          offset: rowOffset,
        });
      } else {
        let where = dbReader.Sequelize.and(
          { is_deleted: 0, site_id: site_id, is_active: 1 },
          dbReader.Sequelize.or(
            { title: { [searchCondition]: searchData } },
            { content: { [searchCondition]: searchData } },
          )
        )
        if (site_id.includes("3")) {
          where = dbReader.Sequelize.and(
            { is_deleted: 0, site_id: site_id, type: type, is_active: 1 },
            dbReader.Sequelize.or(
              { title: { [searchCondition]: searchData } },
              { content: { [searchCondition]: searchData } },
            )
          )
        }
        data = await dbReader.tutorial.findAndCountAll({
          attributes: ['tutorial_id', 'site_id', 'title', 'content', 'featured_image_url', 'video_url', 'button_link', 'is_active', 'created_datetime', [dbReader.Sequelize.literal('`sycu_site`.`title`'), 'site_name'],
            [dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('updated_datetime'), '%H:%i:%s'), 'updated_datetime']],
          where: where,
          include: [{
            model: dbReader.sites,
            attributes: []
          }],
          limit: rowLimit,
          offset: rowOffset,
        });
      }
      data = JSON.parse(JSON.stringify(data));
      // data.rows = data.rows.map((s: any) => {
      //   s.tags = s.tags ? s.tags.split(",") : [];
      //   return s;
      // });
      new SuccessResponse(EC.errorMessage(EC.success), {
        // @ts-ignore
        token: req.token,
        count: data.count,
        rows: data.rows,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async deleteTutorial(req: Request, res: Response) {
    try {
      let { tutorial_id } = req.params;
      await dbWriter.tutorial.update(
        { is_deleted: 1 },
        {
          where: { tutorial_id: tutorial_id },
        }
      );
      new SuccessResponse(EC.errorMessage(EC.deleteDataSuccess), {
        // @ts-ignore
        token: req.token,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async getTutorialById(req: Request, res: Response) {
    try {
      let { tutorial_id } = req.params;
      let data = await dbReader.tutorial.findOne({
        where: { is_deleted: 0, tutorial_id: tutorial_id },
      });
      data = JSON.parse(JSON.stringify(data));
      if (data) {
        data.tags = data.tags ? data.tags.split(",") : [];
      }
      new SuccessResponse(EC.errorMessage(EC.success), {
        // @ts-ignore
        token: req.token,
        data: data,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async activeInactiveTutorial(req: Request, res: Response) {
    try {
      let { is_active, tutorial_id } = req.body;
      await dbWriter.tutorial.update(
        {
          is_active: is_active,
        },
        {
          where: { tutorial_id: tutorial_id },
        }
      );
      new SuccessResponse(EC.errorMessage(EC.saveDataSuccess), {
        // @ts-ignore
        token: req.token,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
}
