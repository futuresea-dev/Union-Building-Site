import { Request, Response } from 'express'
import { ErrorController, SuccessResponse, BadRequestError, ApiError } from '../core/index';
import { constantVariable } from '../core/constant'
const { dbReader, dbWriter } = require('../models/dbConfig');
const { GeneralController } = require('./generalController');
const EC = new ErrorController();
const { sycu_link, cloudFront_link } = new constantVariable();

export class Announcement {

  public saveAnnouncement = async (req: Request, res: Response) => {
    try {
      let { announcement_id, announcement_title, announcement_content, attachment, category_id } = req.body;
      let generalControllerObj = new GeneralController();
      let { user_id = 0 } = generalControllerObj.getCurrentUserDetail(req, res);
      let announcement
      if (announcement_id != 0) {
        await dbWriter.hubAnnouncements.update({
          announcement_title,
          announcement_content,
          category_id,
          user_id: user_id
        }, {
          where: { announcement_id: announcement_id }
        });
        if (attachment.length > 0) {
          let storedAttachment = await dbReader.hubAttachments.findAndCountAll({
            where: {
              parent_id: announcement_id,
              parent_type: 1, //1 = announcement 2 = calendar 3 = message 4 = replies 5 = comments
              is_deleted: 0
            }
          });

          // When attachments are found and need to update 
          let updateAttachments: any = [];
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

          let arrAttachments: any = [];
          attachment.forEach((element: any) => {
            if (element.hub_attachment_id == 0) {
              arrAttachments.push({
                attachments: element.attachments,
                attachment_name: element.attachment_name || '',
                parent_id: announcement_id,
                user_id: user_id,
                parent_type: 1,
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
              parent_id: announcement_id,
              parent_type: 1, //1 = announcement 2 = calendar 3 = message 4 = replies 5 = comments
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
        let lastSortOrder = await dbReader.hubAnnouncements.findOne({
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
        
        announcement = await dbWriter.hubAnnouncements.create({
          announcement_title,
          announcement_content,
          is_system: 1,
          category_id,
          user_id: user_id,
          sort_order: sortOrder
        });
        if (attachment.length > 0) {
          let attachmentList: any = [];
          for (let i = 0; i < attachment.length; i++) {
            attachmentList.push({
              user_id: user_id,
              parent_id: announcement.announcement_id,
              parent_type: 1,
              attachments: attachment[i].attachments,
              attachment_name: attachment[i].attachment_name || ''
            });
          }
          await dbWriter.hubAttachments.bulkCreate(attachmentList);
        }
      }
      new SuccessResponse(EC.errorMessage(EC.success, ["Announcement"]), {
        // @ts-ignore
        token: req.token,
        data: announcement
      }).send(res);
    }
    catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };

  public listingAnnouncements = async (req: Request, res: Response) => {
    try {
      let { category_id } = req.params;
      let data = await dbReader.hubAnnouncements.findAndCountAll({
        where: { is_deleted: 0, category_id: category_id, is_system: 1 },
        attributes: ['announcement_id', 'hub_id', 'category_id', 'announcement_title', 'announcement_content', 'is_scheduled', 'schedule_date_time', 'is_announcement_pinned', 'pinned_datetime', 'hide_comment', 'notification_allow', 'created_by', 'updated_user_id', 'connected_announcement_id', 'created_datetime',
          [dbReader.sequelize.fn("concat", dbReader.sequelize.col("first_name"), ' ', dbReader.sequelize.col("last_name")), "user_name"],
          // [dbReader.Sequelize.literal(`(SELECT COUNT(comment_id) FROM gh_comments where announcement_id =  gh_announcements.announcement_id)`), 'comment_count'],
        ],
        include: [{
          required: true,
          model: dbReader.users,
          attributes: []
        }, {
          required: false,
          model: dbReader.hubComments,
          where: { is_deleted: 0 },
          attributes: [],
        }, {
          separate: true,
          model: dbReader.hubAttachments,
          where: { is_deleted: 0, parent_type: 1 },
          attributes: ['hub_attachment_id', 'attachments', 'attachment_name'],
        }],
        order: [['sort_order', 'ASC']],
      });

      data = JSON.parse(JSON.stringify(data));
      for (let i = 0; i < data.rows.length; i++) {
        data.rows[i].schedule_date_time == null ? data.rows[i].schedule_date_time = "" : data.rows[i].schedule_date_time = data.rows[i].schedule_date_time;
        data.rows[i].pinned_datetime == null ? data.rows[i].pinned_datetime = "" : data.rows[i].pinned_datetime = data.rows[i].pinned_datetime;
      }
      if (data.rows.length > 0) {
        new SuccessResponse(EC.errorMessage(EC.getMessage, ["Announcement"]), { // @ts-ignore
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
  }

  public deleteAnnouncement = async (req: Request, res: Response) => {
    try {
      let { announcement_id } = req.params;
      await dbWriter.hubAnnouncements.update({
        is_deleted: 1
      }, {
        where: { announcement_id: announcement_id }
      });

      new SuccessResponse(EC.errorMessage(EC.deleteDataSuccess, ["HubBanners"]), {
        // @ts-ignore
        token: req.token
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };

  public getAnnouncementById = async (req: Request, res: Response) => {
    try {
      let { announcement_id } = req.params;
      let data = await dbReader.hubAnnouncements.findAndCountAll({

        where: { is_deleted: 0, announcement_id: announcement_id },

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
      });
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
  }

  public saveSortOrderOfAnnouncements = async (req: Request, res: Response) => {
    try {
      let { announcements = [] } = req.body;
      if (announcements.length > 0) {
        for (let i = 0; i < announcements.length; i++) {
          await dbWriter.hubAnnouncements.update({
            sort_order: announcements[i].sort_order
          }, {
            where: { announcement_id: announcements[i].announcement_id }
          });
        }
      }

      new SuccessResponse(EC.errorMessage(EC.success, ["Announcement"]), {
        // @ts-ignore
        token: req.token,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
}
