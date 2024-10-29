import { Request, Response } from 'express'
import { ErrorController, SuccessResponse, BadRequestError, ApiError } from '../core/index';
import { constantVariable } from '../core/constant'
const { dbReader, dbWriter } = require('../models/dbConfig');
const { GeneralController } = require('./generalController');
const EC = new ErrorController();
const { sycu_link, cloudFront_link } = new constantVariable();

export class Calender {

  public saveCalendar = async (req: Request, res: Response) => {
    try {
      let { calendar_id, calendar_title, calendar_content, attachment, category_id } = req.body;
      let generalControllerObj = new GeneralController();
      let { user_id = 0 } = generalControllerObj.getCurrentUserDetail(req, res);
      let calender
      // let attachmentList: any = [];
      if (calendar_id != 0) {
        await dbWriter.hubCalender.update({
          calendar_title,
          calendar_content,
          category_id,
          user_id: user_id
        }, {
          where: { calendar_id: calendar_id }
        });
        if (attachment.length > 0) {
          let storedAttachment = await dbReader.hubAttachments.findAndCountAll({
            where: {
              parent_id: calendar_id,
              parent_type: 2, //1 = announcement 2 = calendar 3 = message 4 = replies 5 = comments
              is_deleted: 0
            }
          });

          // When attachments are found and need to update 
          if (storedAttachment.count > 0) {
            let deleteAttachments: any = [];
            storedAttachment.rows.forEach((store_arr: any) => {
              if (!(attachment.some((e: any) => e.hub_attachment_id == store_arr.hub_attachment_id))) {
                deleteAttachments.push(store_arr.hub_attachment_id);
              }
            });
            if (deleteAttachments.length) {
              await dbWriter.hubAttachments.update({ is_deleted: 1 }, {
                where: { hub_attachment_id: { [dbReader.Sequelize.Op.in]: deleteAttachments } }
              });
            }
          }
          let arrAttachments: any = [], updateAttachments: any = [];;
          attachment.forEach((element: any) => {
            if (element.hub_attachment_id == 0) {
              arrAttachments.push({
                attachments: element.attachments,
                attachment_name: element.attachment_name || '',
                parent_id: calendar_id,
                user_id: user_id,
                parent_type: 2
              });
            } else {
              updateAttachments.push({
                hub_attachment_id: element.hub_attachment_id,
                attachment_name: element.attachment_name
              })
            }
          });
          if (arrAttachments.length > 0) {
            await dbWriter.hubAttachments.bulkCreate(arrAttachments);
          }
          if (updateAttachments.length) {
            for (let i = 0; i < updateAttachments.length; i++) {
              await dbWriter.hubAttachments.update({
                attachment_name: updateAttachments[i].attachment_name,
              }, {
                where: {
                  hub_attachment_id: updateAttachments[i].hub_attachment_id
                }
              });
            }
          }
        } else {
          let storedAttachment = await dbReader.hubAttachments.findAndCountAll({
            where: {
              parent_id: calendar_id,
              parent_type: 2, //1 = announcement 2 = calendar 3 = message 4 = replies 5 = comments
              is_deleted: 0
            }
          });

          // When attachments are found and need to update 
          if (storedAttachment.count > 0) {
            let deleteAttachments: any = [];
            storedAttachment.rows.forEach((store_arr: any) => {
              if (!(attachment.some((e: any) => e.hub_attachment_id == store_arr.hub_attachment_id))) {
                deleteAttachments.push(store_arr.hub_attachment_id);
              }
            });
            if (deleteAttachments.length) {
              await dbWriter.hubAttachments.update({ is_deleted: 1 }, {
                where: { hub_attachment_id: { [dbReader.Sequelize.Op.in]: deleteAttachments } }
              });
            }
          }
        }
      }
      else {
        let lastSortOrder = await dbReader.hubCalender.findOne({
          attributes: [[dbReader.Sequelize.fn('MAX', dbReader.Sequelize.col('sort_order')), 'sort_order']],
          where: {
            category_id: category_id,
            is_system: 1,
            is_deleted: 0
          },
        });

        let sortOrder: any = 1;
        if (lastSortOrder && lastSortOrder.dataValues.sort_order) {
          sortOrder = lastSortOrder.dataValues.sort_order + 1;
        }
        
        calender = await dbWriter.hubCalender.create({
          calendar_title,
          calendar_content,
          category_id,
          is_system: 1,
          user_id: user_id,
          sort_order: sortOrder
        });
        if (attachment.length > 0) {
          let attachmentList: any = [];
          for (let i = 0; i < attachment.length; i++) {
            attachmentList.push({
              user_id: user_id,
              parent_id: calender.calendar_id,
              parent_type: 2,
              attachments: attachment[i].attachments,
              attachment_name: attachment[i].attachment_name || ''
            });
          }
          await dbWriter.hubAttachments.bulkCreate(attachmentList);
        }
      }
      new SuccessResponse(EC.errorMessage(EC.success, ["Calender"]), {
        // @ts-ignore
        token: req.token,
        data: calender
      }).send(res);
    }
    catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };

  public listingCalendar = async (req: Request, res: Response) => {
    try {
      let { category_id } = req.params
      let data = await dbReader.hubCalender.findAndCountAll({
        where: { is_deleted: 0, category_id: category_id, is_system: 1 },
        attributes: ['calendar_id', 'calendar_title', 'category_id', 'created_datetime',
          'calendar_content',
          'is_system',
          [dbReader.sequelize.fn("concat", dbReader.sequelize.col("first_name"), ' ', dbReader.sequelize.col("last_name")), "user_name"]],

        include: [{
          required: true,
          model: dbReader.users,
          attributes: []
        }, {
          // required: false,
          separate: true,
          model: dbReader.hubAttachments,
          where: { is_deleted: 0, parent_type: 2 },
          attributes: ['hub_attachment_id', 'attachments', 'attachment_name'],
        }],
        order: [['sort_order', 'ASC']], // Added order clause here
      });
      data = JSON.parse(JSON.stringify(data));
      if (data.rows.length > 0) {
        new SuccessResponse(EC.errorMessage(EC.getMessage, ["Calender"]), { // @ts-ignore
          token: req.token,
          count: data.rows.length,
          rows: data.rows
        }).send(res);
      } else new SuccessResponse(EC.noDataFound, {
        rows: data.rows
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };

  public getCalendarById = async (req: Request, res: Response) => {
    try {
      let { calendar_id } = req.params;
      let data = await dbReader.hubCalender.findAndCountAll({
        where: { is_deleted: 0, calendar_id: calendar_id },
        include: [{
          required: true,
          model: dbReader.users,
          attributes: []
        }, {
          // required: true,
          model: dbReader.categories,
          attributes: ['category_id', 'category_title']
        }, {
          // required: false,
          separate: true,
          model: dbReader.hubAttachments,
          where: { is_deleted: 0 },
          attributes: ['attachments'],
        }],
      },

      );
      data = JSON.parse(JSON.stringify(data));
      for (let i = 0; i < data.count; i++) {
        let announcementAttachment: any = [];
        data.rows[i].gh_attachments.map((e: any) => {

          let newStr = (e.attachments).replace(sycu_link, cloudFront_link);
          announcementAttachment.push(newStr);

        });
        data.rows[i].gh_attachments = announcementAttachment
      }

      new SuccessResponse(EC.errorMessage(EC.deleteDataSuccess, ["Calender"]), {
        // @ts-ignore
        token: req.token,
        data: data
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };

  public deleteCalendar = async (req: Request, res: Response) => {
    try {
      let { calendar_id } = req.params;
      await dbWriter.hubCalender.update({
        is_deleted: 1
      }, {
        where: { calendar_id: calendar_id }
      });

      new SuccessResponse(EC.errorMessage(EC.deleteDataSuccess, ["Calender"]), {
        // @ts-ignore
        token: req.token
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };

  public saveSortOrderOfCalendars = async (req: Request, res: Response) => {
    try {
      let { calendars = [] } = req.body;
      if (calendars.length > 0) {
        for (let i = 0; i < calendars.length; i++) {
          await dbWriter.hubCalender.update({
            sort_order: calendars[i].sort_order
          }, {
            where: { calendar_id: calendars[i].calendar_id }
          });
        }
      }

      new SuccessResponse(EC.errorMessage(EC.success, ["Calender"]), {
        // @ts-ignore
        token: req.token,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

}
