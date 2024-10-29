import { Request, Response } from "express";
import { ErrorController, SuccessResponse, BadRequestError, ApiError } from '../core/index';
const { dbReader, dbWriter } = require('../models/dbConfig');
const { Op } = dbReader.Sequelize;
const EC = new ErrorController();

export class FreeTrialDashboardController {

  public async getAllGrowStories(req: Request, res: Response) {
    try {
      let { ministry_type } = req.body;
      let growStories = await dbReader.growStories.findAll({
        attributes: ['story_id', 'user_name', 'thumbnail_url', 'media_url', 'location'],
        where: { is_deleted: 0, ministry_type: ministry_type, status: 1 },
        order: [['sort_order', 'ASC']]
      });
      growStories = JSON.parse(JSON.stringify(growStories));
      new SuccessResponse(EC.success, {
        //@ts-ignore
        token: req.token,
        growStories: growStories,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async getAllApplicationAds(req: Request, res: Response) {
    try {
      let { ministry_type } = req.body;
      let applicationAds = await dbReader.applicationAds.findAll({
        attributes: ['application_ads_id', 'application_title', 'application_sub_title', 'application_card_title',
          'application_card_sub_title', 'ministry_type', 'sort_order', 'application_image', 'application_model_image',
          'application_primary_color', 'application_secondary_color', 'application_preview_link', 'application_download_link',
          'application_card_description', 'application_status'],
        where: { is_deleted: 0, ministry_type: ministry_type, application_status: 1 },
        order: [['sort_order', 'ASC']]
      });
      applicationAds = JSON.parse(JSON.stringify(applicationAds));
      new SuccessResponse(EC.success, {
        //@ts-ignore
        token: req.token,
        applicationAds: applicationAds,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async getAllToDoList(req: Request, res: Response) {
    try {
      //@ts-ignore
      let { user_id = 0 } = req;
      let { ministry_type } = req.body;
      let toDoList = await dbReader.todoList.findAll({
        attributes: ['scheduled', 'title', 'type', 'todo_list_id', 'button_text', 'additional_data'],
        where: { is_deleted: 0, ministry_type: ministry_type },
        include: [{
          required: false,
          model: dbReader.userTodoList,
          where: { is_deleted: 0, user_id: user_id },
          attributes: ['user_todo_list_id', 'todo_list_id', 'user_id', 'is_completed'],
        }],
        order: [['sort_order', 'ASC']]
      });
      toDoList = JSON.parse(JSON.stringify(toDoList));
      toDoList.forEach((element: any) => {
        element.is_completed = element.user_todo_list ? element.user_todo_list.is_completed : 1;
      });
      toDoList.sort((a: any, b: any) => {
        if (a.is_completed === b.is_completed) {
          return 0;
        } else if (a.is_completed === 2) {
          return 1;
        } else {
          return -1;
        }
      });
      new SuccessResponse(EC.success, {
        //@ts-ignore
        token: req.token,
        toDo: toDoList
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async isToDoCompleted(req: Request, res: Response) {
    try {
      //@ts-ignore
      let { user_id } = req;
      let { todo_list_id, is_completed } = req.body;
      if (user_id) {
        let toDoList = await dbReader.userTodoList.findOne({
          where: { user_id: user_id, todo_list_id: todo_list_id }
        });
        if (!toDoList) {
          await dbWriter.userTodoList.create({
            todo_list_id: todo_list_id,
            user_id: user_id,
            is_completed: is_completed,
          });
        } else {
          await dbWriter.userTodoList.update({
            is_completed: is_completed,
          }, {
            where: {
              todo_list_id: todo_list_id,
              user_id: user_id,
            }
          });
        }
      }
      new SuccessResponse(EC.success, {
        //@ts-ignore
        token: req.token,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async saveFeedback(req: Request, res: Response) {
    try {
      //@ts-ignore
      let { user_id } = req;
      // 1 = Poor, 2 = Fair, 3 = Average, 4 = Happy, 5 = Excellent
      // 1 = application, 2 = todo, 3 = curriculum post feedback, 4 = VBS
      let { type, type_id, feedback_rating, feedback_review = '', curriculum_content_type = '', curriculum_tabs_id } = req.body;

      let sort_order = 0;
      let sortOrderData = await dbReader.feedBack.findAll({
        attributes: [[dbReader.Sequelize.fn("MAX", dbReader.Sequelize.col("sort_order")), "sort_order"]],
        group: 'type',
        where: { is_deleted: 0 }
      });
      if (sortOrderData.length) {
        sortOrderData = JSON.parse(JSON.stringify(sortOrderData));
        sort_order = sortOrderData[0].sort_order;
        sort_order = sort_order + 1;
      }

      await dbWriter.feedBack.create({
        type: type,
        type_id: type_id,
        feedback_rating: feedback_rating,
        feedback_review: feedback_review,
        curriculum_tabs_id: curriculum_tabs_id,
        curriculum_content_type: curriculum_content_type,
        user_id: user_id,
        sort_order: sort_order,
      });

      new SuccessResponse("Feedback saved successfully.", {
        //@ts-ignore
        token: req.token,
      }).send(res);
    }
    catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async updateFreeTrialUserCouponVariant(req: Request, res: Response) {
    try {
      // @ts-ignore
      let { user_id } = req;
      let { fte_coupon_version } = req.body;
      if (user_id && fte_coupon_version) {
        await dbWriter.users.update({
          fte_coupon_version: fte_coupon_version,
        }, {
          where: { user_id: user_id }
        });
      }
      return new SuccessResponse(EC.success, {}).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  // public async getProductsForFreeTrial(req: Request, res: Response) {
  //   try {
  //     let productsData = await dbReader.products.findAll({
  //       attributes: ['product_id', 'product_name', 'product_description', 'product_duration', 'product_price', 'ministry_type'],
  //       where: { is_deleted: 0, is_ministry_page: 1, product_type: 1, is_hidden: 0, product_duration: 365, category_id: 341 }
  //     });
  //     productsData = JSON.parse(JSON.stringify(productsData));
  //     return new SuccessResponse(EC.success, {
  //       products: productsData
  //     }).send(res);
  //   } catch (e: any) {
  //     ApiError.handle(new BadRequestError(e.message), res);
  //   }
  // }

  public async getProductsForFreeTrial(req: Request, res: Response) {
    try {
      const query = req.query as { checkout?: string };

      // Extract checkout from query and set default to 'false' if not provided
      const checkout: string = query.checkout || 'false';

      // Convert checkout to boolean
      const isCheckout: boolean = checkout === 'true';
      const categoryId = process.env.NODE_ENV == "development" ? 440 : 341;
      if (isCheckout) {
        let productsData = await dbReader.products.findAll({
          attributes: ['product_id', 'product_name', 'product_description', 'product_duration', 'product_price', 'ministry_type', 'is_ministry_page'],
          where: { is_deleted: 0, is_ministry_page: [1, 0], product_type: 1, is_hidden: 0, ministry_type: [1, 2], product_duration: [365, 90], category_id: categoryId }
        })

        productsData = JSON.parse(JSON.stringify(productsData));
        return new SuccessResponse(EC.success, {
          products: productsData
        }).send(res);
      }
      else {
        let productsData = await dbReader.products.findAll({
          attributes: ['product_id', 'product_name', 'product_description', 'product_duration', 'product_price', 'ministry_type'],
          where: { is_deleted: 0, is_ministry_page: 1, product_type: 1, is_hidden: 0, product_duration: 365, category_id: categoryId }
        });
        productsData = JSON.parse(JSON.stringify(productsData));
        return new SuccessResponse(EC.success, {
          products: productsData
        }).send(res);
      }


    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
}

