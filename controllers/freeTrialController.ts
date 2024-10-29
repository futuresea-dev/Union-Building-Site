import { Request, Response } from "express";
import moment from 'moment';
import { ErrorController, SuccessResponse, BadRequestError, ApiError } from '../core/index';
const { dbReader, dbWriter } = require('../models/dbConfig');
const { Op } = dbReader.Sequelize;
const EC = new ErrorController();

export class FreeTrialController {

  //Grow Stories API

  public async listAllGrowStories(req: Request, res: Response) {
    try {
      let { ministry_type } = req.body;
      let growStories = await dbReader.growStories.findAll({
        attributes: ['story_id', 'user_name', 'thumbnail_url', 'media_url', 'location', 'ministry_type', 'status', 'sort_order'],
        where: { is_deleted: 0, ministry_type: ministry_type },
        include: [{
          separate: true,
          attributes: ['story_view_id'],
          model: dbReader.growStoriesViews,
        }],
        order: [['sort_order', 'ASC']]
      });
      growStories = JSON.parse(JSON.stringify(growStories));

      growStories.forEach((element: any) => {
        element.views = element.grow_stories_views.length;
        delete element.grow_stories_views;
      });
      new SuccessResponse(EC.success, {
        //@ts-ignore
        token: req.token,
        stories: growStories,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async saveGrowStory(req: Request, res: Response) {
    try {
      //@ts-ignore
      let { user_id = 0 } = req;
      let { story_id = 0, ministry_type, thumbnail_url = '', media_url = '', location = '', user_name = '', status = 0 } = req.body;

      if (story_id) {
        await dbWriter.growStories.update({
          thumbnail_url: thumbnail_url,
          user_name: user_name,
          media_url: media_url,
          location: location,
          status: status,
        }, {
          where: { story_id: story_id }
        });
      } else {
        let sort_order = 0;
        let sortOrderData = await dbReader.growStories.findAll({
          attributes: [[dbReader.Sequelize.fn("MAX", dbReader.Sequelize.col("sort_order")), "sort_order"]],
          where: { ministry_type: ministry_type, is_deleted: 0 }
        });
        if (sortOrderData.length) {
          sortOrderData = JSON.parse(JSON.stringify(sortOrderData));
          sort_order = sortOrderData[0].sort_order;
          sort_order = sort_order + 1;
        }

        await dbWriter.growStories.create({
          thumbnail_url: thumbnail_url,
          ministry_type: ministry_type,
          sort_order: sort_order,
          user_name: user_name,
          media_url: media_url,
          location: location,
          created_by: user_id,
          status: 1,
        });
      }

      new SuccessResponse("Story saved successfully.", {
        //@ts-ignore
        token: req.token,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async deleteGrowStory(req: Request, res: Response) {
    try {
      let { story_id } = req.body;
      if (story_id) {
        await dbWriter.growStories.update({
          is_deleted: 1
        }, {
          where: { story_id: story_id }
        });
      }
      new SuccessResponse("Story deleted successfully.", {
        //@ts-ignore
        token: req.token,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async sortGrowStories(req: Request, res: Response) {
    try {
      let { stories = [] } = req.body;
      if (stories.length) {
        let update_sort_order = "case story_id", arrayStoryId: any = [];
        stories.forEach((s: any) => {
          if (s.story_id) {
            arrayStoryId.push(s.story_id);
            update_sort_order += " when " + s.story_id + " then " + s.sort_order;
          }
        });
        if (arrayStoryId.length) {
          update_sort_order += " else sort_order end";
          await dbWriter.growStories.update({
            sort_order: dbWriter.Sequelize.literal(update_sort_order)
          }, {
            where: { story_id: arrayStoryId }
          });
        }
      }
      new SuccessResponse("Stories sorted successfully.", {
        //@ts-ignore
        token: req.token,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async updateGrowStoryStatus(req: Request, res: Response) {
    try {
      let { status, story_id } = req.body;
      if (status && story_id) {
        await dbWriter.growStories.update({
          status: status
        }, {
          where: { story_id: story_id }
        });
      }
      new SuccessResponse("Status changed successfully.", {
        //@ts-ignore
        token: req.token,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async countGrowStoryViews(req: Request, res: Response) {
    try {
      let { user_id, story_id } = req.body;
      if (user_id && story_id) {
        let checkExistingUser = await dbReader.growStoriesViews.findOne({
          where: {
            user_id: user_id,
            story_id: story_id
          }
        })
        if (!checkExistingUser) {
          await dbWriter.growStoriesViews.create({
            user_id: user_id,
            story_id: story_id
          });
        }
      }
      new SuccessResponse("Views counted successfully.", {
        //@ts-ignore
        token: req.token,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  //Application Ads API

  public async saveApplicationAds(req: Request, res: Response) {
    try {
      //@ts-ignore
      let { user_id = 0 } = req;
      let { application_ads_id = 0, ministry_type, application_title = '', application_sub_title = '',
        application_card_title = '', application_card_sub_title = '', application_image = '', application_model_image = '',
        application_primary_color = '', application_secondary_color = '', application_preview_link = '',
        application_download_link = '', application_card_description = '', application_status } = req.body;

      if (application_ads_id) {
        await dbWriter.applicationAds.update({
          application_title: application_title,
          application_sub_title: application_sub_title,
          application_card_title: application_card_title,
          application_card_sub_title: application_card_sub_title,
          application_image: application_image,
          application_model_image: application_model_image,
          application_primary_color: application_primary_color,
          application_secondary_color: application_secondary_color,
          application_preview_link: application_preview_link,
          application_download_link: application_download_link,
          application_card_description: application_card_description,
          application_status: application_status,
        }, {
          where: { application_ads_id: application_ads_id }
        });
      } else {
        let sort_order = 0;
        let sortOrderData = await dbReader.applicationAds.findAll({
          attributes: [[dbReader.Sequelize.fn("MAX", dbReader.Sequelize.col("sort_order")), "sort_order"]],
          where: { ministry_type: ministry_type, is_deleted: 0 }
        });
        if (sortOrderData.length) {
          sortOrderData = JSON.parse(JSON.stringify(sortOrderData));
          sort_order = sortOrderData[0].sort_order;
          sort_order = sort_order + 1;
        }

        await dbWriter.applicationAds.create({
          application_title: application_title,
          application_sub_title: application_sub_title,
          application_card_title: application_card_title,
          application_card_sub_title: application_card_sub_title,
          application_image: application_image,
          application_model_image: application_model_image,
          application_primary_color: application_primary_color,
          application_secondary_color: application_secondary_color,
          application_preview_link: application_preview_link,
          application_download_link: application_download_link,
          application_card_description: application_card_description,
          application_status: application_status,
          ministry_type: ministry_type,
          sort_order: sort_order,
          created_by: user_id,
        });
      }

      new SuccessResponse("Strategy card saved successfully.", {
        //@ts-ignore
        token: req.token,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async listAllApplicationAds(req: Request, res: Response) {
    try {
      let { ministry_type } = req.body;
      let applicationAdsData = await dbReader.applicationAds.findAll({
        attributes: ['application_ads_id', 'application_title', 'application_sub_title', 'application_card_title',
          'application_card_sub_title', 'ministry_type', 'sort_order', 'application_image', 'application_model_image',
          'application_primary_color', 'application_secondary_color', 'application_preview_link', 'application_download_link',
          'application_card_description', 'application_status'],
        where: { is_deleted: 0, ministry_type: ministry_type },
        include: [{
          separate: true,
          model: dbReader.feedBack,
          attributes: ['type_id', 'user_id', 'feedback_rating', 'feedback_review'],
          where: { type: 1, is_deleted: 0 },
          include: [{
            model: dbReader.users,
            attributes: ['display_name'],
          }]
        }],
        order: [['sort_order', 'ASC']]
      });
      applicationAdsData = JSON.parse(JSON.stringify(applicationAdsData));
      new SuccessResponse(EC.success, {
        //@ts-ignore
        token: req.token,
        applications: applicationAdsData,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async deleteApplicationAds(req: Request, res: Response) {
    try {
      let { application_ads_id } = req.body;
      if (application_ads_id) {
        await dbWriter.applicationAds.update({
          is_deleted: 1
        }, {
          where: { application_ads_id: application_ads_id }
        });
      }
      new SuccessResponse("Strategy card deleted successfully.", {
        //@ts-ignore
        token: req.token,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async sortApplicationAds(req: Request, res: Response) {
    try {
      let { applications = [] } = req.body;
      if (applications.length) {
        let update_sort_order = "case application_ads_id", arrayApplicationId: any = [];
        applications.forEach((s: any) => {
          if (s.application_ads_id) {
            arrayApplicationId.push(s.application_ads_id);
            update_sort_order += " when " + s.application_ads_id + " then " + s.sort_order;
          }
        });
        if (arrayApplicationId.length) {
          update_sort_order += " else sort_order end";
          await dbWriter.applicationAds.update({
            sort_order: dbWriter.Sequelize.literal(update_sort_order)
          }, {
            where: { application_ads_id: arrayApplicationId }
          });
        }
      }
      new SuccessResponse("Strategy card sorted successfully.", {
        //@ts-ignore
        token: req.token,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async updateApplicationAdsStatus(req: Request, res: Response) {
    try {
      let { application_status, application_ads_id } = req.body;
      if (application_status && application_ads_id) {
        await dbWriter.applicationAds.update({
          application_status: application_status
        }, {
          where: { application_ads_id: application_ads_id }
        });
      }
      new SuccessResponse("Status changed successfully.", {
        //@ts-ignore
        token: req.token,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
  // This 2 apis is not used
  public async saveApplicationColor(req: Request, res: Response) {
    try {
      //@ts-ignore
      let { user_id = 0 } = req;
      let { application_color_id = 0, ministry_type, application_color_name = '', application_color_hex = '', application_color_type } = req.body;

      if (application_color_id) {
        await dbWriter.applicationColor.update({
          application_color_name: application_color_name,
          application_color_hex: application_color_hex,
          application_color_type: application_color_type
        }, {
          where: { application_color_id: application_color_id }
        });
      } else {
        let sort_order = 0;
        let sortOrderData = await dbReader.applicationColor.findAll({
          attributes: [[dbReader.Sequelize.fn("MAX", dbReader.Sequelize.col("sort_order")), "sort_order"]],
          where: { ministry_type: ministry_type, is_deleted: 0 }
        });
        if (sortOrderData.length) {
          sortOrderData = JSON.parse(JSON.stringify(sortOrderData));
          sort_order = sortOrderData[0].sort_order;
          sort_order = sort_order + 1;
        }

        await dbWriter.applicationColor.create({
          application_color_name: application_color_name,
          application_color_hex: application_color_hex,
          application_color_type: application_color_type,
          ministry_type: ministry_type,
          sort_order: sort_order,
          created_by: user_id,
        });
      }

      new SuccessResponse("Application color save successfully.", {
        //@ts-ignore
        token: req.token,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async listAllApplicationColor(req: Request, res: Response) {
    try {
      let { ministry_type } = req.body;
      let applicationColorData = await dbReader.applicationColor.findAll({
        attributes: ['application_color_id', 'application_color_name', 'application_color_hex', 'application_color_type'],
        where: { is_deleted: 0, ministry_type: ministry_type },
        order: [['sort_order', 'ASC']]
      });
      applicationColorData = JSON.parse(JSON.stringify(applicationColorData));
      new SuccessResponse(EC.success, {
        //@ts-ignore
        token: req.token,
        applicationColors: applicationColorData,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  //Helpful Resources API

  public async saveHelpfulResource(req: Request, res: Response) {
    try {
      //@ts-ignore
      let { user_id = 0 } = req;
      let { resource_id = 0, ministry_type, title, description = '', cta_type = 0, cta_text = '', cta_link = '', image_url = '' } = req.body;

      if (resource_id) {
        await dbWriter.helpfulResources.update({
          description: description,
          image_url: image_url,
          cta_type: cta_type,
          cta_text: cta_text,
          cta_link: cta_link,
          title: title,
        }, {
          where: { resource_id: resource_id }
        });
      } else {
        let sort_order = 0;
        let sortOrderData = await dbReader.helpfulResources.findAll({
          attributes: [[dbReader.Sequelize.fn("MAX", dbReader.Sequelize.col("sort_order")), "sort_order"]],
          where: { ministry_type: ministry_type, is_deleted: 0 }
        });
        if (sortOrderData.length) {
          sortOrderData = JSON.parse(JSON.stringify(sortOrderData));
          sort_order = sortOrderData[0].sort_order;
          sort_order = sort_order + 1;
        }

        await dbWriter.helpfulResources.create({
          ministry_type: ministry_type,
          description: description,
          sort_order: sort_order,
          image_url: image_url,
          created_by: user_id,
          cta_type: cta_type,
          cta_text: cta_text,
          cta_link: cta_link,
          title: title,
        });
      }

      new SuccessResponse("Resource save successfully.", {
        //@ts-ignore
        token: req.token,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async listAllHelpfulResources(req: Request, res: Response) {
    try {
      let { ministry_type } = req.body;
      let resourceData = await dbReader.helpfulResources.findAll({
        attributes: ['resource_id', 'title', 'description', 'ministry_type', 'sort_order',
          'cta_type', 'cta_text', 'cta_link', 'image_url'],
        where: { is_deleted: 0, ministry_type: ministry_type },
        order: [['sort_order', 'ASC']]
      });
      resourceData = JSON.parse(JSON.stringify(resourceData));
      new SuccessResponse(EC.success, {
        //@ts-ignore
        token: req.token,
        resources: resourceData,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async deleteHelpfulResource(req: Request, res: Response) {
    try {
      let { resource_id } = req.body;
      if (resource_id) {
        await dbWriter.helpfulResources.update({
          is_deleted: 1
        }, {
          where: { resource_id: resource_id }
        });
      }
      new SuccessResponse("Resource deleted successfully.", {
        //@ts-ignore
        token: req.token,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async sortHelpfulResources(req: Request, res: Response) {
    try {
      let { resources = [] } = req.body;
      if (resources.length) {
        let update_sort_order = "case resource_id", arrayResourceId: any = [];
        resources.forEach((s: any) => {
          if (s.resource_id) {
            arrayResourceId.push(s.resource_id);
            update_sort_order += " when " + s.resource_id + " then " + s.sort_order;
          }
        });
        if (arrayResourceId.length) {
          update_sort_order += " else sort_order end";
          await dbWriter.helpfulResources.update({
            sort_order: dbWriter.Sequelize.literal(update_sort_order)
          }, {
            where: { resource_id: arrayResourceId }
          });
        }
      }
      new SuccessResponse("Resources sorted successfully.", {
        //@ts-ignore
        token: req.token,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  //ToDo List API

  public async listAllTodoList(req: Request, res: Response) {
    try {
      let { ministry_type } = req.body;
      let todoList = await dbReader.todoList.findAll({
        attributes: ['todo_list_id', 'title', 'type', 'scheduled', 'button_text', 'additional_data', 'ministry_type', 'sort_order'],
        where: { is_deleted: 0, ministry_type: ministry_type },
        include: [{
          separate: true,
          model: dbReader.feedBack,
          attributes: ['type_id', 'user_id', 'feedback_rating', 'feedback_review'],
          where: { type: 2, is_deleted: 0 },
          include: [{
            model: dbReader.users,
            attributes: ['display_name'],
          }]
        }],
        order: [['sort_order', 'ASC']]
      });
      todoList = JSON.parse(JSON.stringify(todoList));
      new SuccessResponse(EC.success, {
        //@ts-ignore
        token: req.token,
        todoList: todoList,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async saveToDoList(req: Request, res: Response) {
    try {
      //@ts-ignore
      let { user_id = 0 } = req;
      let { todo_list_id = 0, ministry_type, title, type, scheduled, button_text, additional_data } = req.body;
      // todo_type = 1: Strategy call, 2: Download Curriculum Series, 3: Lesson builder, 4: Grow Music

      if (todo_list_id) {
        await dbWriter.todoList.update({
          title: title,
          type: type,
          scheduled: scheduled,
          button_text: button_text,
          additional_data: JSON.stringify(additional_data),
        }, {
          where: { todo_list_id: todo_list_id }
        });
      } else {
        let sort_order = 0;
        let sortOrderData = await dbReader.todoList.findAll({
          attributes: [[dbReader.Sequelize.fn("MAX", dbReader.Sequelize.col("sort_order")), "sort_order"]],
          where: { ministry_type: ministry_type, is_deleted: 0 }
        });
        if (sortOrderData.length) {
          sortOrderData = JSON.parse(JSON.stringify(sortOrderData));
          sort_order = sortOrderData[0].sort_order;
          sort_order = sort_order + 1;
        }

        await dbWriter.todoList.create({
          ministry_type: ministry_type,
          sort_order: sort_order,
          title: title,
          type: type,
          scheduled: scheduled,
          button_text: button_text,
          additional_data: JSON.stringify(additional_data),
          created_by: user_id,
        });
      }
      new SuccessResponse("Todo list saved successfully.", {
        //@ts-ignore
        token: req.token,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async deleteToDoList(req: Request, res: Response) {
    try {
      let { todo_list_id } = req.body;
      if (todo_list_id) {
        await dbWriter.todoList.update({
          is_deleted: 1
        }, {
          where: { todo_list_id: todo_list_id }
        })
      }
      new SuccessResponse("Todo list deleted successfully.", {
        //@ts-ignore
        token: req.token,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async sortToDoList(req: Request, res: Response) {
    try {
      let { toDos = [] } = req.body;
      if (toDos.length) {
        let update_sort_order = "case todo_list_id", arrayToDoListId: any = [];
        toDos.forEach((s: any) => {
          if (s.todo_list_id) {
            arrayToDoListId.push(s.todo_list_id);
            update_sort_order += " when " + s.todo_list_id + " then " + s.sort_order;
          }
        });
        if (arrayToDoListId.length) {
          update_sort_order += " else sort_order end";
          await dbWriter.todoList.update({
            sort_order: dbWriter.Sequelize.literal(update_sort_order)
          }, {
            where: { todo_list_id: arrayToDoListId }
          });
        }
      }
      new SuccessResponse("Todo list sorted successfully.", {
        //@ts-ignore
        token: req.token,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  //Church List API

  public async saveChurch(req: Request, res: Response) {
    try {
      //@ts-ignore
      let { user_id = 0 } = req;
      let { church_id = 0, church_name = '', church_location = '' } = req.body;

      if (church_id) {
        await dbWriter.church.update({
          church_name: church_name,
          church_location: church_location,
          updated_datetime: moment().format("YYYY-MM-DD HH:mm:ss"),
        }, {
          where: { church_id: church_id }
        });
      } else {
        await dbWriter.church.create({
          church_name: church_name,
          church_location: church_location,
          created_user_id: user_id,
        });
      }

      new SuccessResponse("Church saved successfully.", {
        //@ts-ignore
        token: req.token,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async listAllChurch(req: Request, res: Response) {
    try {
      let churchData = await dbReader.church.findAll({
        attributes: ['church_id', 'church_name', 'church_location', 'created_user_id'],
        where: { is_deleted: 0 },
        include: [{
          separate: true,
          model: dbReader.users,
          attributes: ['display_name', 'email', 'profile_image'],
          where: { is_deleted: 0 }
        }]
      });
      churchData = JSON.parse(JSON.stringify(churchData));
      churchData.forEach((element: any) => {
        element.total_users = element.sycu_users.length ? element.sycu_users.length : 0;
      });
      new SuccessResponse(EC.success, {
        //@ts-ignore
        token: req.token,
        churchData: churchData,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async deleteChurch(req: Request, res: Response) {
    try {
      let { church_id } = req.body;
      if (church_id) {
        await dbWriter.church.update({
          is_deleted: 1
        }, {
          where: { church_id: church_id }
        })
      }
      new SuccessResponse("Church deleted successfully.", {
        //@ts-ignore
        token: req.token,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
}
