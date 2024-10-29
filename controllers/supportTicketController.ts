import { NextFunction, Request, Response } from "express";
import { ErrorController } from "../core/ErrorController";
import { SuccessResponse } from "../core/ApiResponse";
import { BadRequestError, ApiError } from "../core/ApiError";
const { dbReader, dbWriter } = require("../models/dbConfig");
const { GeneralController } = require('./generalController');
const { Op } = dbReader.Sequelize;
const moment = require('moment'); 

const EC = new ErrorController();

export class SupportTicketController {
  public async test(req: Request, res: Response) {
    try {
        var data = await dbReader.users.findAndCountAll();
      if (data) {
        new SuccessResponse(EC.errorMessage(EC.getMessage, [""]), {
          //@ts-ignore
          token: req.token,
          data: data,
        }).send(res);
      } else new SuccessResponse(EC.noDataFound, {}).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
  // get list of assigned to user and open support tickets
  public async listAssignedOpenSupportTickets(req: Request, res: Response) {
    try {
      let {page_record, page_no} = req.body;
      let row_limit = !page_record ? 10 : parseInt(page_record);
      let offset = !page_no ? 1 : parseInt(page_no);
      let row_offset = (offset * row_limit) - row_limit;
      let _sortOrder = "DESC";
      let _sortField = 'id';
      
      const requestContent: any = req;
      let userId = requestContent.user_id;
      let user_id = !userId ? 134 : userId;

      var data = await dbReader.supportTickets.findAndCountAll({
        attributes: ['id', 'subject', 'description', 'date_created', 'date_updated', 
          [dbReader.Sequelize.literal('`ba_application`.`name`'), 'application'],
          [dbReader.Sequelize.literal('`ba_support_tickets_status`.`name`'), 'status'],],
        include: [{
          required: true,
          attributes: ['display_name', 'profile_image'],
          model: dbReader.users,
          as: "users",
          where: { is_deleted: 0 }
        },{
          required: true,
          attributes: ['display_name', 'profile_image'],
          model: dbReader.users,
          as: "addedByUsers",
          where: { is_deleted: 0 }
        },{
          attributes: [],
          model: dbReader.supportTicketApplications
        },{
          required: true,
          attributes: [],
          model: dbReader.supportTicketStatus
        }, {
          separate: true,
          attributes: [[dbReader.Sequelize.literal('`ba_support_tickets_service`.`name`'), 'name'],
          [dbReader.Sequelize.literal('`ba_support_tickets_service`.`icon`'), 'icon'],
          'is_source', 'url'],
          model: dbReader.supportTicketLinks,
          include: [{
              attributes: [],
              model: dbReader.supportTicketServices
          }]
      }, {
          separate: true,
          model: dbReader.supportTicketAssignees,
          attributes:[[dbReader.Sequelize.literal('`sycu_user`.`display_name`'), 'user_name'], 
            [dbReader.Sequelize.literal('`sycu_user`.`profile_image`'), 'profile_image']],
          include: [{
            model: dbReader.users,
            attributes: [],
          }]
        }],
        where: {
          [Op.and]: [
            dbReader.Sequelize.literal('EXISTS (SELECT 1 FROM `ba_support_tickets_assignees` WHERE `ba_support_tickets_assignees`.`support_tickets_id` = `ba_support_tickets`.`id`  and `ba_support_tickets_assignees`.`users_id` = ' + user_id +')'),
            dbReader.Sequelize.literal('`ba_support_tickets_status`.`id` = 1')  
          ]
        },
        offset: row_offset,
        limit: row_limit,
        order: [[_sortField, _sortOrder]]
      });
      if (data) {
        new SuccessResponse(EC.errorMessage(EC.getMessage, [""]), {
          //@ts-ignore
          token: req.token,
          data: data,
        }).send(res);
      } else new SuccessResponse(EC.noDataFound, {}).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
  // get list of assigned to user and closed support tickets
  public async listAssignedClosedSupportTickets(req: Request, res: Response) {
    try {
      let { page_record, page_no} = req.body;
      let row_limit = !page_record ? 10 : parseInt(page_record);
      let offset = !page_no ? 1 : parseInt(page_no);
      let row_offset = (offset * row_limit) - row_limit;
      let _sortOrder = "DESC";
      let _sortField = 'id';
      
      const requestContent: any = req;
      let userId = requestContent.user_id;
      let user_id = !userId ? 134 : userId;

      var data = await dbReader.supportTickets.findAndCountAll({
        attributes: ['id', 'subject', 'description', 'date_created', 'date_updated', 
          [dbReader.Sequelize.literal('`ba_application`.`name`'), 'application'],
          [dbReader.Sequelize.literal('`ba_support_tickets_status`.`name`'), 'status'],],
        include: [{
          required: true,
          attributes: ['display_name', 'profile_image'],
          model: dbReader.users,
          as: "users",
          where: { is_deleted: 0 }
        },{
          required: true,
          attributes: ['display_name', 'profile_image'],
          model: dbReader.users,
          as: "addedByUsers",
          where: { is_deleted: 0 }
        }, {
          separate: true,
          attributes: [[dbReader.Sequelize.literal('`ba_support_tickets_service`.`name`'), 'name'],
          [dbReader.Sequelize.literal('`ba_support_tickets_service`.`icon`'), 'icon'],
          'is_source', 'url'],
          model: dbReader.supportTicketLinks,
          include: [{
              attributes: [],
              model: dbReader.supportTicketServices
          }]
        },{
          attributes: [],
          model: dbReader.supportTicketApplications
        },{
          required: true,
          attributes: [],
          model: dbReader.supportTicketStatus
        },{
          separate: true,
          model: dbReader.supportTicketAssignees,
          attributes:[[dbReader.Sequelize.literal('`sycu_user`.`display_name`'), 'user_name'], 
            [dbReader.Sequelize.literal('`sycu_user`.`profile_image`'), 'profile_image']],
          include: [{
            model: dbReader.users,
            attributes: [],
          }]
        }],
        where: {
          [Op.and]: [
            dbReader.Sequelize.literal('EXISTS (SELECT 1 FROM `ba_support_tickets_assignees` WHERE `ba_support_tickets_assignees`.`support_tickets_id` = `ba_support_tickets`.`id`  and `ba_support_tickets_assignees`.`users_id` = ' + user_id +')'),
            dbReader.Sequelize.literal('`ba_support_tickets_status`.`id` = 2')  
          ]
        },
        offset: row_offset,
        limit: row_limit,
        order: [[_sortField, _sortOrder]]
      });
      if (data) {
        new SuccessResponse(EC.errorMessage(EC.getMessage, [""]), {
          //@ts-ignore
          token: req.token,
          data: data,
        }).send(res);
      } else new SuccessResponse(EC.noDataFound, {}).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
  // get list of unassigned support tickets
  // page_no, page_record
  public async listUnassignedSupportTickets(req: Request, res: Response) {
    try {
      let { page_record, page_no } = req.body;
      let row_limit = !page_record ? 10 : parseInt(page_record);
      let offset = !page_no ? 1 : parseInt(page_no);
      let row_offset = (offset * row_limit) - row_limit;
      let _sortOrder = "DESC";
      let _sortField = 'id';

      var data = await dbReader.supportTickets.findAndCountAll({
        attributes: ['id', 'subject', 'description', 'date_created', 'date_updated', 
          [dbReader.Sequelize.literal('`ba_application`.`name`'), 'application'],
          [dbReader.Sequelize.literal('`ba_support_tickets_status`.`name`'), 'status'],],
        include: [{
          required: true,
          attributes: ['display_name', 'profile_image'],
          model: dbReader.users,
          as: "users",
          where: { is_deleted: 0 }
        },{
          required: true,
          attributes: ['display_name', 'profile_image'],
          model: dbReader.users,
          as: "addedByUsers",
          where: { is_deleted: 0 }
        }, {
          separate: true,
          attributes: [[dbReader.Sequelize.literal('`ba_support_tickets_service`.`name`'), 'name'],
          [dbReader.Sequelize.literal('`ba_support_tickets_service`.`icon`'), 'icon'],
          'is_source', 'url'],
          model: dbReader.supportTicketLinks,
          include: [{
              attributes: [],
              model: dbReader.supportTicketServices
          }]
        },{
          attributes: [],
          model: dbReader.supportTicketApplications
        },{
          required: true,
          attributes: [],
          model: dbReader.supportTicketStatus
        },{
          separate: true,
          model: dbReader.supportTicketAssignees,
          attributes:[[dbReader.Sequelize.literal('`sycu_user`.`display_name`'), 'user_name'], 
            [dbReader.Sequelize.literal('`sycu_user`.`profile_image`'), 'profile_image']],
          include: [{
            model: dbReader.users,
            attributes: [],
          }]
        }],
        where: {
          [Op.and]: [
              dbReader.Sequelize.literal('NOT EXISTS (SELECT 1 FROM `ba_support_tickets_assignees` WHERE `ba_support_tickets_assignees`.`support_tickets_id` = `ba_support_tickets`.`id`)'),
            ]
        },       
        offset: row_offset,
        limit: row_limit,
        order: [[_sortField, _sortOrder]]
      });
      if (data) {
        new SuccessResponse(EC.errorMessage(EC.getMessage, [""]), {
          //@ts-ignore
          token: req.token,
          data: data,
        }).send(res);
      } else new SuccessResponse(EC.noDataFound, {}).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
  // get list of all support tickets
  // page_no, page_record, search, sort_field, sort_order
  public async listSupportTickets(req: Request, res: Response) {
    try {
      let { page_record, page_no, search, sort_field, sort_order, type, status } = req.body;
      let row_limit = !page_record ? 10 : parseInt(page_record);
      let offset = !page_no ? 1 : parseInt(page_no);
      let row_offset = (offset * row_limit) - row_limit;
      let _sortOrder = sort_order ? sort_order : "DESC";
      let _sortField = sort_field ? sort_field : 'id';

      let SearchCondition = dbReader.Sequelize.Op.ne, SearchData = null;
      if (search) {
        SearchCondition = Op.like;
        SearchData = "%" + search + "%";
      }

      var data = await dbReader.supportTickets.findAndCountAll({
        where: dbReader.Sequelize.or(
          dbReader.Sequelize.where(dbReader.Sequelize.literal('`users`.`display_name`'), 
              { [SearchCondition]: SearchData }), 
          dbReader.Sequelize.where(dbReader.Sequelize.literal('`addedByUsers`.`display_name`'), 
              { [SearchCondition]: SearchData }), 
          { subject: { [SearchCondition]: SearchData } }, 
          { description: { [SearchCondition]: SearchData } }),
        attributes: ['id', 'subject', 'description', 'date_created', 'date_updated',
            [dbReader.Sequelize.literal('`ba_application`.`name`'), 'application'],
            [dbReader.Sequelize.literal('`ba_support_tickets_type`.`name`'), 'type'],
            [dbReader.Sequelize.literal('`ba_support_tickets_status`.`name`'), 'status'],
        ],
        include: [{
                required: true,
                attributes: ['display_name', 'profile_image'],
                model: dbReader.users,
                as: "users",
                where: { is_deleted: 0 }
            }, {
                required: true,
                attributes: ['display_name', 'profile_image'],
                model: dbReader.users,
                as: "addedByUsers",
                where: { is_deleted: 0 }
            }, {
                attributes: [],
                model: dbReader.supportTicketApplications
            }, {
                required: true,
                attributes: [],
                model: dbReader.supportTicketStatus
            }, {
                separate: true,
                attributes: [[dbReader.Sequelize.literal('`ba_support_tickets_service`.`name`'), 'name'],
                [dbReader.Sequelize.literal('`ba_support_tickets_service`.`icon`'), 'icon'],
                'is_source', 'url'],
                model: dbReader.supportTicketLinks,
                include: [{
                    attributes: [],
                    model: dbReader.supportTicketServices
                }]
            }, {
                required: true,
                attributes: [],
                model: dbReader.supportTicketTypes
            }, {
                separate: true,
                model: dbReader.supportTicketAssignees,
                attributes: [[dbReader.Sequelize.literal('`sycu_user`.`display_name`'), 'user_name'],
                    [dbReader.Sequelize.literal('`sycu_user`.`profile_image`'), 'profile_image']],
                include: [{
                        model: dbReader.users,
                        attributes: [],
                    }]
            }],
        offset: row_offset,
        limit: row_limit,
        order: [[_sortField, _sortOrder]]
    });
      if (data) {
        new SuccessResponse(EC.errorMessage(EC.getMessage, [""]), {
          //@ts-ignore
          token: req.token,
          data: data,
        }).send(res);
      } else new SuccessResponse(EC.noDataFound, {}).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
  public async getSupportTicket(req: Request, res: Response) {
    try {
      let { id } = req.body;

      var data = await dbReader.supportTickets.findAndCountAll({
        where:{ id },
        attributes: ['id', 'subject', 'description', 'date_created', 'date_updated',
          [dbReader.Sequelize.literal('`ba_application`.`name`'), 'application'],
          [dbReader.Sequelize.literal('`ba_support_tickets_type`.`name`'), 'type'],
          [dbReader.Sequelize.literal('`ba_support_tickets_status`.`name`'), 'status'],
        ],
        include: [{
              required: true,
              attributes: ['display_name', 'profile_image'],
              model: dbReader.users,
              as: "users",
              where: { is_deleted: 0 }
          }, {
              required: true,
              attributes: ['display_name', 'profile_image'],
              model: dbReader.users,
              as: "addedByUsers",
              where: { is_deleted: 0 }
          }, {
              attributes: [],
              model: dbReader.supportTicketApplications
          }, {
              required: true,
              attributes: [],
              model: dbReader.supportTicketStatus
          }, {
              separate: true,
              attributes: [[dbReader.Sequelize.literal('`ba_support_tickets_service`.`name`'), 'name'],
              [dbReader.Sequelize.literal('`ba_support_tickets_service`.`icon`'), 'icon'],
              'is_source', 'url'],
              model: dbReader.supportTicketLinks,
              include: [{
                  attributes: [],
                  model: dbReader.supportTicketServices
              }]
          }, {
              required: true,
              attributes: [],
              model: dbReader.supportTicketTypes
          }, {
              separate: true,
              model: dbReader.supportTicketAssignees,
              attributes: [[dbReader.Sequelize.literal('`sycu_user`.`display_name`'), 'user_name'],
                  [dbReader.Sequelize.literal('`sycu_user`.`profile_image`'), 'profile_image']],
              include: [{
                      model: dbReader.users,
                      attributes: [],
                  }]
          }],
      });
      if (data) {
        new SuccessResponse(EC.errorMessage(EC.getMessage, [""]), {
          //@ts-ignore
          token: req.token,
          data: data,
        }).send(res);
      } else new SuccessResponse(EC.noDataFound, {}).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
  public async getSupportTicketTypesList(req: Request, res: Response) {
    try {
        var data = await dbReader.supportTicketTypes.findAndCountAll();
      if (data) {
        new SuccessResponse(EC.errorMessage(EC.getMessage, [""]), {
          //@ts-ignore
          token: req.token,
          data: data,
        }).send(res);
      } else new SuccessResponse(EC.noDataFound, {}).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
  public async getSupportTicketApplicationsList(req: Request, res: Response) {
    try {
        var data = await dbReader.supportTicketApplications.findAndCountAll();
      if (data) {
        new SuccessResponse(EC.errorMessage(EC.getMessage, [""]), {
          //@ts-ignore
          token: req.token,
          data: data,
        }).send(res);
      } else new SuccessResponse(EC.noDataFound, {}).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
  public async getSupportTicketStatusList(req: Request, res: Response) {
    try {
        var data = await dbReader.supportTicketStatus.findAndCountAll();
      if (data) {
        new SuccessResponse(EC.errorMessage(EC.getMessage, [""]), {
          //@ts-ignore
          token: req.token,
          data: data,
        }).send(res);
      } else new SuccessResponse(EC.noDataFound, {}).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
  public async getSupportTicketServicesList(req: Request, res: Response) {
    try {
        var data = await dbReader.supportTicketServices.findAndCountAll();
      if (data) {
        new SuccessResponse(EC.errorMessage(EC.getMessage, [""]), {
          //@ts-ignore
          token: req.token,
          data: data,
        }).send(res);
      } else new SuccessResponse(EC.noDataFound, {}).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
  public async getSupportTicketNotesList(req: Request, res: Response) {
    try {
      let { page_record, page_no, id } = req.body;
      let row_limit = !page_record ? 10 : parseInt(page_record);
      let offset = !page_no ? 1 : parseInt(page_no);
      let row_offset = (offset * row_limit) - row_limit;
      let _sortOrder = "DESC";
      let _sortField = 'id';

      var data = await dbReader.supportTicketNotes.findAndCountAll({
        attributes: ["note", 
            [dbReader.Sequelize.literal('`sycu_user`.`display_name`'), 'user_name'],
            [dbReader.Sequelize.literal('`sycu_user`.`profile_image`'), 'profile_image']],
        include: [{
          model: dbReader.users,
          attributes: [],
        }],
        where:{ support_tickets_id: id },
        offset: row_offset,
        limit: row_limit,
        order: [[_sortField, _sortOrder]]
      });
      if (data) {
        new SuccessResponse(EC.errorMessage(EC.getMessage, [""]), {
          //@ts-ignore
          token: req.token,
          data: data,
        }).send(res);
      } else new SuccessResponse(EC.noDataFound, {}).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
  public async getSupportTicketActivitiesList(req: Request, res: Response) {
    try {
      let { page_record, page_no, id} = req.body;
      let row_limit = !page_record ? 10 : parseInt(page_record);
      let offset = !page_no ? 1 : parseInt(page_no);
      let row_offset = (offset * row_limit) - row_limit;
      let _sortOrder = "DESC";
      let _sortField = 'id';

      var data = await dbReader.supportTicketActivities.findAndCountAll({
        where:{ support_tickets_id: id },
        include: [{
          model: dbReader.users,
          attributes: [],
        }],
        attributes: ["activity", 
            [dbReader.Sequelize.literal('`sycu_user`.`display_name`'), 'user_name'],
            [dbReader.Sequelize.literal('`sycu_user`.`profile_image`'), 'profile_image']],
        offset: row_offset,
        limit: row_limit,
        order: [[_sortField, _sortOrder]]
      });
      if (data) {
        new SuccessResponse(EC.errorMessage(EC.getMessage, [""]), {
          //@ts-ignore
          token: req.token,
          data: data,
        }).send(res);
      } else new SuccessResponse(EC.noDataFound, {}).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async createSupportTicketNote(req: Request, res: Response) {
    try {
      let { id, note } = req.body;
      
      const requestContent: any = req;
      let userId = requestContent.user_id;
      let userName = requestContent.display_name;
      let user_id = !userId ? 134 : userId;
      let user_name = !userName ? "Jay Logan" : userId;

      const date_created = moment().format('YYYY-MM-DD HH:mm:ss');

      let data = await dbWriter.supportTicketNotes.create({
        support_tickets_id: id,
        users_id: user_id,
        note,
        date_created
      })
      dbWriter.supportTicketActivities.create({
        support_tickets_id: id,
        users_id: user_id,
        activity: `Note was added by ${user_name} : "${note}"`,
        date_created
      });
      if (data) {
        new SuccessResponse(EC.errorMessage(EC.getMessage, [""]), {
          //@ts-ignore
          token: req.token,
          data,
        }).send(res);
      } else new SuccessResponse(EC.noDataFound, {}).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
  // ----------------------------------------------------------------------
  public async getSupportTicketAssigneesList(req: Request, res: Response) {
    try {
        var data = await dbReader.supportTicketAssignees.findAndCountAll();
      if (data) {
        new SuccessResponse(EC.errorMessage(EC.getMessage, [""]), {
          //@ts-ignore
          token: req.token,
          data: data,
        }).send(res);
      } else new SuccessResponse(EC.noDataFound, {}).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
  public async getSupportTicketLinksList(req: Request, res: Response) {
    try {
        var data = await dbReader.supportTicketLinks.findAndCountAll();
      if (data) {
        new SuccessResponse(EC.errorMessage(EC.getMessage, [""]), {
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
