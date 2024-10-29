import { NextFunction, Request, Response, Router } from "express";
import { ErrorController } from "../core/ErrorController";
import { Crypto } from '../core/index';
import { SuccessResponse } from '../core/ApiResponse';
import { BadRequestError, ApiError } from '../core/ApiError';
import { enumerationController } from '../controllers/enumerationController';
import moment from "moment";
import { ActiveCampaignController } from "./thirdParty/activeCampaignController";
const { dbReader, dbWriter } = require('../models/dbConfig');
const { Op } = dbReader.Sequelize;
const crypto = new Crypto();
const EnumObject = new enumerationController();

const EC = new ErrorController();
const ac = new ActiveCampaignController();
export class UserController {

  public async listUser(req: Request, res: Response, next: NextFunction) {
    try {
      let { page_record, page_no, search, via_portal, user_role, is_customer, sortField = 'user_id', sortOrder = 'DESC' } = req.body;
      let row_limit = parseInt(page_record) || 10;
      let row_offset = page_no ? ((page_no * row_limit) - row_limit) : 0;
      let mainWhere: any = { is_deleted: 0 }, userRoleWhere = {}, siteType = {};

      if (search) {
        const searchCondition = dbReader.Sequelize.Op.like;
        const searchData = `%${search}%`;
        const searchMobile = `%${search.replace(/-/g, '')}%`;

        mainWhere = {
          [dbReader.Sequelize.Op.or]: [
            { user_id: { [searchCondition]: searchData } },
            { username: { [searchCondition]: searchData } },
            { display_name: { [searchCondition]: searchData } },
            { email: { [searchCondition]: searchData } },
            { mobile: { [searchCondition]: searchMobile } },
            { ministry_level: { [searchCondition]: searchData } },
            { status: { [searchCondition]: searchData } },
            { via_portal: { [searchCondition]: searchData } },
            { via_platform: { [searchCondition]: searchData } },
            dbReader.Sequelize.where(
              dbReader.sequelize.fn("concat", dbReader.sequelize.col("first_name"), ' ', dbReader.sequelize.col("last_name")),
              { [searchCondition]: searchData }
            ),
            dbReader.Sequelize.literal(`(select count(1) from sycu_users_email_history where sycu_users_email_history.user_id = sycu_users.user_id and email like '%${search}%' and is_deleted = 0)`),
            dbReader.Sequelize.literal(`(select count(1) from sycu_user_subscriptions where sycu_user_subscriptions.user_id = sycu_users.user_id and subscription_number like '%${search}%' and site_id != 0)`),
            dbReader.Sequelize.literal(`(select count(1) from sycu_user_orders where sycu_user_orders.user_id = sycu_users.user_id and user_order_number like '%${search}%')`),
            dbReader.Sequelize.literal(`(select count(1) from sycu_user_orders where sycu_user_orders.user_id = sycu_users.user_id and user_orders_id like '%${search}%')`)
          ]
        };
      }

      let affiliateJoin: any = [{
        separate: true,
        model: dbReader.userMemberships,
        where: { is_deleted: 0 },
        attributes: [[dbReader.Sequelize.literal(`membership_name`), 'active_memberships']],
        include: [{ model: dbReader.membership, attributes: [], where: { is_deleted: 0 } }]
      }, {
        separate: true,
        model: dbReader.userSubscription,
        attributes: [[dbReader.Sequelize.literal(`subscription_status`), 'active_subscriber']]
      }, {
        separate: true,
        model: dbReader.userEmailsHistory,
        attributes: [[dbReader.Sequelize.literal(`sycu_users_email_history.email`), 'email']]
      }, {
        separate: true,
        model: dbReader.userOrder,
        attributes: [[dbReader.Sequelize.literal(`user_order_number`), 'user_order_number']]
      }];

      if (via_portal && via_portal != 0) {
        if (via_portal != 8) {
          siteType = dbReader.Sequelize.where(
            dbReader.Sequelize.literal(`(select count(1) from sycu_app_visit_history where user_id = sycu_users.user_id and site_id = ${via_portal})`),
            { [dbReader.Sequelize.Op.gt]: 0 }
          )
        } else {
          affiliateJoin.push({
            required: true,
            as: 'affiliateUser',
            model: dbReader.affiliates,
            where: { is_deleted: 0 }
          })
        }
      }

      if (user_role == -1) {
        userRoleWhere = { user_role: [1, 2, 3] };
      } else if (user_role && !is_customer) {
        userRoleWhere = { user_role };
      } else if (!user_role && !is_customer) {
        userRoleWhere = { user_role: [1, 2] };
      } else if (is_customer && !user_role) {
        userRoleWhere = { user_role: 3 };
      }

      let sort = [sortField === 'login_datetime' ?
        dbReader.Sequelize.literal('(select created_datetime from sycu_user_login_logs where user_id = sycu_users.user_id order by created_datetime desc limit 1)') :
        sortField, sortOrder];

      let data = await dbReader.users.findAndCountAll({
        attributes: ['first_name', 'last_name', 'username', 'email', 'user_role', 'mobile', 'is_deleted', 'ministry_level', 'profile_image',
          [dbReader.Sequelize.literal('(select created_datetime from sycu_user_login_logs where user_id = sycu_users.user_id order by created_datetime desc limit 1)'), 'login_datetime']
        ],
        include: affiliateJoin,
        where: dbReader.Sequelize.and(mainWhere, siteType, userRoleWhere),
        limit: row_limit,
        offset: row_offset,
        order: [sort]
      });

      data = JSON.parse(JSON.stringify(data));
      data.rows.forEach((row: any) => {
        row.active_subscriber = row.user_subscriptions.some((e: any) => e.active_subscriber === 2 || e.active_subscriber === 4);
        delete row.user_subscriptions;
        delete row.affiliateUser;
      });

      let message = data.count > 0 ? EC.success : EC.noDataFound;
      new SuccessResponse(message, {
        user: null,
        //@ts-ignore
        token: req.token,
        data: data
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async userAction(req: Request, res: Response, next: NextFunction) {
    try {
      //@ts-ignore
      let { display_name } = req;
      let { user_id, status } = req.body;
      await dbWriter.users.update({
        status: status,
        updated_datetime: moment().format("YYYY-MM-DD HH:mm:ss")
      }, {
        where: { user_id: user_id }
      });

      let logstatus = (status == 2) ? 'deactivated' : 'activated';
      let message = "User activated successfully.";
      if (status == 2) {
        message = "User de-activated successfully.";
      }

      let logs = {
        type: 3,
        event_type_id: user_id,
        message: "Account is " + logstatus + " by (" + display_name + ") from Admin site.",
        is_system: 1,
        // @ts-ignore
        user_id: req.user_id
      }
      await dbWriter.logs.create(logs)
      await dbWriter.notes.create(logs)

      new SuccessResponse(message, {
        //@ts-ignore
        token: req.token
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  // SH-05/01/22
  //Listing all login logs based on user_id
  public async listLoginUserDetails(req: Request, res: Response, next: NextFunction) {
    try {
      let { user_id, page_record, page_no, sort_field = "", sort_order = "" } = req.body;
      let row_offset = 0, row_limit = 10;

      !sort_field ? sort_field = 'created_datetime' : sort_field
      !sort_order ? sort_order = 'DESC' : sort_order

      //Pagination 
      if (page_record) {
        row_limit = parseInt(page_record);
      }

      if (page_no) {
        row_offset = (page_no * page_record) - page_record;
      }

      let data = await dbReader.userLoginLogs.findAndCountAll({
        where: {
          user_id: user_id,
          temptoken: {
            [Op.is]: null
          }
        },
        attributes: ['parent_user_id', 'via_portal', 'via_platform', 'users_login_log_id', 'device_info', 'login_ip_address', [dbReader.sequelize.literal(`logo`), 'logo'], [dbReader.sequelize.literal(`title`), 'title'], 'created_datetime'],
        include: [{
          model: dbReader.sites,
          attributes: []
        }, {
          as: 'admin_details',
          model: dbReader.users,
          attributes: ['profile_image', 'user_id', 'first_name', 'last_name', 'email']
        }],
        limit: row_limit,
        offset: row_offset,
        order: [[sort_field, sort_order]]
      });
      data = JSON.parse(JSON.stringify(data));
      let message = data.count > 0 ? EC.success : EC.noDataFound;
      new SuccessResponse(message, {
        //@ts-ignore
        token: req.token,
        rows: data.rows,
        count: data.count
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  /*
    Get only user name and id based on like query
    code done by SO
  
  */
  public async getUserNames(req: Request, res: Response, next: NextFunction) {
    try {
      var reqBody = req.body;
      // Searching                           
      var SearchCondition = dbReader.Sequelize.Op.ne, SearchData = null;
      if (reqBody.search) {
        SearchCondition = dbReader.Sequelize.Op.like;
        SearchData = "%" + reqBody.search + "%";
      }

      // Added Code By So
      // Getting sort field(column) and sort order(ASC) from body
      // If it is not passed in body then default values will set

      var data = await dbReader.users.findAndCountAll({
        where: dbReader.Sequelize.and(
          { is_deleted: 0 },
          dbReader.Sequelize.or(
            { first_name: { [SearchCondition]: SearchData } },
            { last_name: { [SearchCondition]: SearchData } }
          )
        ),
        attributes: ['first_name', 'last_name', 'user_id', 'username']
      });
      var message = data.count > 0 ? EC.success : EC.noDataFound;
      data = JSON.parse(JSON.stringify(data));
      new SuccessResponse(message, {
        user: null,
        //@ts-ignore
        token: req.token,
        data: data
      }).send(res);
    }
    catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      //@ts-ignore
      let { display_name } = req

      if (typeof req.body.id == "undefined" || req.body.id == null) {
        throw new Error(EC.idError);
      }
      else {
        // Added Code by sourabh
        // changed code in admin. now admin can delete multiple records
        // by  sending multiple id's

        var userId = req.body.id;
        var condition = Op.in
        let logs = {}, notes = {}

        var result = await dbWriter.users.update(
          { is_deleted: 1 }, {
          where: dbWriter.Sequelize.and(
            {
              user_id: { [condition]: userId }
            })
        })
        logs = {
          type: 3,// for delete user
          event_type_id: userId,
          message: "customer is deleted by Admin (" + display_name + ")."
        }
        notes = {
          type: 3, // for delete user
          event_type_id: userId,
          message: "customer is deleted by Admin (" + display_name + ").",
          is_system: 1,
          // @ts-ignore
          user_id: req.user_id
        }
        await dbWriter.logs.create(logs)
        await dbWriter.notes.create(notes)
        if (result > 0) {
          new SuccessResponse(EC.deleteDataSuccess, {
            user: null,
            //@ts-ignore
            token: req.token,
            data: []
          }).send(res);
        }
        else {
          new SuccessResponse(EC.idError, {
            user: null,
            //@ts-ignore
            token: req.token,
            data: []
          }).send(res);
        }
      }
    }
    catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async changeUserPassword(req: Request, res: Response, next: NextFunction) {
    try {
      // decrypting password
      let decryptPassword = req.body.password;
      decryptPassword = crypto.decrypt(decryptPassword);

      // Encrypting Password
      let encryptPassword = crypto.encrypt(decryptPassword, true).toString();

      const updateUser = await dbWriter.users.update(
        { password: encryptPassword },
        { where: { user_id: req.body.user_id } }
      )

      return new SuccessResponse(EC.success, {
        //@ts-ignore
        token: req.token
      }).send(res);
    }
    catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async customerList(req: Request, res: Response, next: NextFunction) {
    var reqBody = req.body, dbSequelize = dbReader.Sequelize, sqOperator = dbSequelize.Op;
    var SearchCondition = sqOperator.ne, SearchData = null;

    try {
      if (reqBody.search) {
        SearchCondition = sqOperator.like;
        SearchData = "%" + reqBody.search + "%";
      }

      const andCondition = [
        { status: 1 },
        dbReader.Sequelize.or(
          { display_name: { [SearchCondition]: SearchData } },
          { first_name: { [SearchCondition]: SearchData } },
          { last_name: { [SearchCondition]: SearchData } },
          { email: { [SearchCondition]: SearchData } },
          { user_id: { [SearchCondition]: SearchData } },
        )
      ]

      if (reqBody.first_name)
        andCondition.push({ first_name: { [Op.like]: "%" + reqBody.first_name + "%" } })
      if (reqBody.last_name)
        andCondition.push({ last_name: { [Op.like]: "%" + reqBody.last_name + "%" } })
      if (reqBody.email)
        andCondition.push({ email: { [Op.like]: "%" + reqBody.email + "%" } })

      var data = await dbReader.users.findAndCountAll({
        attributes: ['user_id', 'first_name', 'last_name', 'email'],
        include: [
          {
            attributes: ['first_name', 'last_name', 'address_line1', 'address_line2', 'city', 'company', 'zipcode', 'state_id', 'country_id', 'phone_number', 'email_address'],
            where: {
              address_type: 1
            },
            model: dbReader.userAddress,
            as: 'billingAddress',
            limit: 1,
            order: [['user_address_id', 'DESC']]
          },
          {
            attributes: ['first_name', 'last_name', 'address_line1', 'address_line2', 'city', 'company', 'zipcode', 'state_id', 'country_id', 'phone_number'],
            where: {
              address_type: 2
            },
            model: dbReader.userAddress,
            as: 'shippingAddress',
            limit: 1,
            order: [['user_address_id', 'DESC']]
          }
        ],
        where: dbSequelize.and(
          { status: 1 },
          dbReader.Sequelize.or(
            { display_name: { [SearchCondition]: SearchData } },
            { first_name: { [SearchCondition]: SearchData } },
            { last_name: { [SearchCondition]: SearchData } },
            { email: { [SearchCondition]: SearchData } },
            { user_id: { [SearchCondition]: SearchData } },
          ),

        ),
        order: [['user_id', 'DESC']]
      });
      data = JSON.parse(JSON.stringify(data));
      data = data.rows.map((s: any) => {
        s.billingAddress = (s.billingAddress.length) ? s.billingAddress[0] : null;
        s.shippingAddress = (s.shippingAddress.length) ? s.shippingAddress[0] : null;
        return s
      });
      new SuccessResponse(EC.idError, {
        user: null,
        //@ts-ignore
        token: req.token,
        data: data
      }).send(res);

    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
  /**
   * get total users by status
   * @param req 
   * @param res 
   */
  public async getTotalUsers(req: Request, res: Response) {
    try {
      let finalUserCount: any = [], totalUserCount = 0;

      let userRoleCount = await dbReader.users.count({
        where: {
          user_role: [1, 2],
          is_deleted: 0
        },
        col: 'user_id',
        group: ['user_role']
      });

      let i = 1;
      while (i <= 2) {
        var userCountList = userRoleCount.find((f: any) => f.user_role == i);
        if (userCountList) {
          totalUserCount += userCountList.count
          finalUserCount.push(userCountList);
        } else {
          var appendCount = {
            user_role: i,
            count: 0
          }
          finalUserCount.push(appendCount);
        }
        i++;
      }

      finalUserCount.unshift({ user_role: 0, count: totalUserCount });
      new SuccessResponse(EC.DataFetched, {
        user: null,
        //@ts-ignore
        token: req.token,
        totalUsers: finalUserCount
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async listUserPaymentMethod(req: Request, res: Response) {
    try {
      let { search, page_record, page_no, filter, sortField = "pg_customer_card_id", sortOrder = "DESC", user_id, site_id } = req.body;
      let row_offset = 0, row_limit = 0;
      var dbSequelize = dbReader.Sequelize, sqOperator = dbSequelize.Op;

      var SearchCondition = sqOperator.ne, SearchData = null;
      if (search) {
        SearchCondition = sqOperator.like;
        SearchData = "%" + search + "%";
      }
      if (page_record) {
        row_limit = parseInt(page_record);
      }

      if (page_no) {
        row_offset = (page_no * page_record) - page_record;
      }
      // Searching                           
      var SearchCondition = dbReader.Sequelize.Op.ne, SearchData = null;

      let data_filter = dbReader.Sequelize.and();
      if (filter) {
        var data = filter[0];
        data_filter = dbReader.Sequelize.and(data);
      }

      // let siteIdCond = dbReader.Sequelize.Op.ne, siteIdData = null;
      // if (site_id) {
      //   siteIdCond = dbReader.Sequelize.Op.eq;
      //   siteIdData = 2;
      // }

      let order = [sortField, sortOrder];
      var data = await dbReader.userCard.findAndCountAll({
        attributes: ["pg_customer_card_id", 'site_id', 'user_id', 'stripe_customer_id', 'stripe_card_id', 'card_no', 'is_auto', 'card_holder_name', 'card_type', 'site_payment_service_id', 'created_datetime', 'updated_datetime'],
        where: dbSequelize.and(
          // { is_deleted: 0, site_id: { [siteIdCond]: siteIdData } },
          { is_deleted: 0, site_id: 2 },
          { user_id: user_id },
          data_filter,
          dbSequelize.or(
            { card_no: { [SearchCondition]: SearchData } },
            { card_holder_name: { [SearchCondition]: SearchData } },
            { card_type: { [SearchCondition]: SearchData } },
          ),
        ),
        include: [{
          attributes: ["site_id", 'title', 'logo'],
          model: dbReader.sites
        }],
        order: [order]
      });
      new SuccessResponse(data?.row?.length ? EC.success : EC.noDataFound, {
        //@ts-ignore
        token: req.token,
        count: data.count,
        rows: data.rows
      }).send(res);
    } catch (error: any) {
      ApiError.handle(new BadRequestError(error.message), res);
    }
  }

  public async getSiteAccessDataByUserId(req: Request, res: Response) {
    try {
      let { user_id } = req.params
      let returnData = [
        {
          "site_id": 2,
          "is_using": 0,
          "total_subscriptions": 0,
          "active_products": [],
          "last_access_datetime": null,
          "used_platforms": [],
          "site_data": null
        }, {
          "site_id": 3,
          "is_using": 0,
          "total_subscriptions": 0,
          "active_products": [],
          "last_access_datetime": null,
          "used_platforms": [],
          "site_data": {
            "total_message_builds": 0,
            "total_series_builds": 0,
            "total_volumes": 0
          }
        }, {
          "site_id": 4,
          "is_using": 0,
          "total_subscriptions": 0,
          "active_products": [],
          "last_access_datetime": null,
          "used_platforms": [],
          "site_data": {
            "total_games": 0,
            "total_icebreakers": 0
          }
        }, {
          "site_id": 5,
          "is_using": 0,
          "total_subscriptions": 0,
          "active_products": [],
          "last_access_datetime": null,
          "used_platforms": [],
          "site_data": {
            "total_hubs": 0,
            "total_calendar_items": 0,
            "total_announcements_items": 0
          }
        }, {
          "site_id": 6,
          "is_using": 0,
          "total_subscriptions": 0,
          "active_products": [],
          "last_access_datetime": null,
          "used_platforms": [],
          "site_data": {
            "total_feeds": 0,
            "total_slideshow": 0
          }
        }, {
          "site_id": 7,
          "is_using": 0,
          "total_subscriptions": 0,
          "active_products": [],
          "last_access_datetime": null,
          "used_platforms": [],
          "site_data": {}
        }, {
          "site_id": 8,
          "is_using": 0,
          "last_access_datetime": null,
          "used_platforms": [],
          "site_data": {
            "total_referrals": 0,
            "total_earnings": 0
          }
        }, {
          "site_id": 10,
          "is_using": 0,
          "last_access_datetime": null,
          "used_platforms": [],
          "site_data": {
            "total_habit": 0
          }
        }, {
          "site_id": 11,
          "is_using": 0,
          "last_access_datetime": null,
          "used_platforms": [],
          "site_data": {
            "total_habit": 0
          }
        }
      ]
      let messageBuilderCount = await dbReader.messageBuildList.count({
        where: { user_id: user_id, is_deleted: 0, is_restore: 0, is_system: 0, is_default_build: 0 }
      });
      let seriesBuilderCount = await dbReader.seriesBuildList.count({
        where: { user_id: user_id, is_deleted: 0 }
      });
      let volumeCount = await dbReader.volumeModel.count({
        where: { user_id: user_id, is_deleted: 0, is_restore: 0 }
      });
      let gameDataCount = await dbReader.games.count({
        where: { user_id: user_id, is_deleted: 0 }
      });
      let iceBreakerCount = await dbReader.icebreakers.count({
        where: { user_id: user_id, is_deleted: 0 }
      });
      let hubDataCount = await dbReader.hubs.count({
        where: { user_id: user_id, is_deleted: 0 }
      });
      let calendarCount = await dbReader.hubCalender.count({
        where: { user_id: user_id, is_deleted: 0 }
      });
      let announcementCount = await dbReader.hubAnnouncements.count({
        where: { user_id: user_id, is_deleted: 0 }
      });
      let feedsCount = await dbReader.feeds.count({
        where: { user_id: user_id, is_deleted: 0 }
      });
      let slideShowCount = await dbReader.slideShows.count({
        where: { user_id: user_id, is_deleted: 0 }
      });
      let habitStudentCount = await dbReader.habit.count({
        where: { is_deleted: 0, user_id: user_id, is_from: 1 },
      });
      let habitKidCount = await dbReader.habit.count({
        where: { is_deleted: 0, user_id: user_id, is_from: 2 },
      });
      let countSubscribed = await dbReader.userSubscription.findAll({
        where: { user_id: user_id, subscription_status: 2 },
        attributes: ['site_id'],
        include: [{
          separate: true,
          model: dbReader.userOrder,
          attributes: ['user_subscription_id'],
          include: [{
            model: dbReader.userOrderItems,
            attributes: ['user_orders_id'],
            separate: true,
            include: [{
              required: true,
              model: dbReader.products,
              attributes: ['product_name', 'ministry_type']
            }]
          }],
          order: [['user_orders_id', 'DESC']],
          limit: 1
        }]
      });
      countSubscribed = JSON.parse(JSON.stringify(countSubscribed));
      let usedPlatforms = await dbReader.userLoginLogs.findAll({
        attributes: ['via_platform', 'via_portal'],
        where: { user_id: user_id, via_portal: { [dbReader.Sequelize.Op.ne]: 0 }, via_platform: { [dbReader.Sequelize.Op.ne]: 0 } },
        group: ['via_portal', 'via_platform']
      });
      usedPlatforms = JSON.parse(JSON.stringify(usedPlatforms));
      let countReferrals = await dbReader.affiliateReferrals.findAll({
        attributes: ['amount'],
        where: { is_deleted: 0 },
        include: [{
          required: true,
          model: dbReader.affiliates,
          where: { user_id: user_id, is_deleted: 0 },
          attributes: []
        }]
      });
      countReferrals = JSON.parse(JSON.stringify(countReferrals));
      //Now, we have to show data in all cases whether visit history data there or now  
      // let appVisitHistoryData = await dbReader.appVisitHistory.findAll({
      //   where: { user_id: user_id }
      // });
      let shareDashboard = await dbReader.sharedPages.findAll({
        attributes: ['membership_id'],
        where: {
          receiver_user_id: user_id,
          is_deleted: 0
        },
        include: [{
          attributes: ["membership_name", "membership_id"],
          model: dbReader.membership
        }],
      })
      shareDashboard = JSON.parse(JSON.stringify(shareDashboard));
      let shareMembership: any = [];
      if (shareDashboard.length) {
        shareDashboard.forEach((e: any) => {
          e.sycu_memberships.forEach((f: any) => {
            shareMembership.push(f.membership_name);
          });
        });
      }
      let appVisitHistoryData = await dbReader.sites.findAll({
        attributes: ['site_id'],
        include: [{
          separate: true,
          model: dbReader.appVisitHistory,
          where: {
            user_id: user_id
          },
          order: [["app_visit_history_id", "DESC"]],
          limit: 1
        }]
      });
      appVisitHistoryData = JSON.parse(JSON.stringify(appVisitHistoryData));
      appVisitHistoryData.forEach((element: any) => {
        switch (element.site_id) {
          case EnumObject.siteEnum.get("curriculum").value:
            returnData[0].is_using = 1;
            returnData[0].total_subscriptions = countSubscribed.filter((s: any) => s.site_id == EnumObject.siteEnum.get("curriculum").value).length
            let _activeProduct: any = [];
            countSubscribed.filter((s: any) =>
              s.site_id == EnumObject.siteEnum.get("curriculum").value).filter((s: any) =>
                s.user_orders.length ? s.user_orders[0].user_order_items.filter((u: any) =>
                  _activeProduct.push({ "product_name": u.sycu_product.product_name, "ministry_type": u.sycu_product.ministry_type })) : "")
            //returnData[0].active_products = _activeProduct;
            returnData[0].active_products = _activeProduct.length ? _activeProduct : shareMembership;
            returnData[0].last_access_datetime = element.sycu_app_visit_histories.length ? element.sycu_app_visit_histories[0].last_access_datetime : '';
            returnData[0].used_platforms = usedPlatforms.filter((s: any) => s.via_portal == EnumObject.siteEnum.get("curriculum").value).map((s: any) => s.via_platform);
            break;
          case EnumObject.siteEnum.get("builder").value:
            returnData[1].is_using = 1;
            returnData[1].total_subscriptions = countSubscribed.filter((s: any) => s.site_id == EnumObject.siteEnum.get("builder").value).length
            returnData[1].last_access_datetime = element.sycu_app_visit_histories.length ? element.sycu_app_visit_histories[0].last_access_datetime : '';
            returnData[1].used_platforms = usedPlatforms.filter((s: any) => s.via_portal == EnumObject.siteEnum.get("builder").value).map((s: any) => s.via_platform);
            //@ts-ignore
            returnData[1].site_data.total_message_builds = messageBuilderCount;
            //@ts-ignore
            returnData[1].site_data.total_series_builds = seriesBuilderCount;
            //@ts-ignore
            returnData[1].site_data.total_volumes = volumeCount;
            break;
          case EnumObject.siteEnum.get("game").value:
            returnData[2].is_using = 1;
            returnData[2].total_subscriptions = countSubscribed.filter((s: any) => s.site_id == EnumObject.siteEnum.get("game").value).length
            returnData[2].last_access_datetime = element.sycu_app_visit_histories.length ? element.sycu_app_visit_histories[0].last_access_datetime : '';
            returnData[2].used_platforms = usedPlatforms.filter((s: any) => s.via_portal == EnumObject.siteEnum.get("game").value).map((s: any) => s.via_platform);
            //@ts-ignore
            returnData[2].site_data.total_games = gameDataCount;
            //@ts-ignore
            returnData[2].site_data.total_icebreakers = iceBreakerCount;
            break;
          case EnumObject.siteEnum.get("hub").value:
            returnData[3].is_using = 1;
            returnData[3].total_subscriptions = countSubscribed.filter((s: any) => s.site_id == EnumObject.siteEnum.get("hub").value).length
            returnData[3].last_access_datetime = element.sycu_app_visit_histories.length ? element.sycu_app_visit_histories[0].last_access_datetime : '';
            returnData[3].used_platforms = usedPlatforms.filter((s: any) => s.via_portal == EnumObject.siteEnum.get("hub").value).map((s: any) => s.via_platform);
            //@ts-ignore
            returnData[3].site_data.total_hubs = hubDataCount;
            //@ts-ignore
            returnData[3].site_data.total_calendar_items = calendarCount;
            //@ts-ignore
            returnData[3].site_data.total_announcements_items = announcementCount;
            break;
          case EnumObject.siteEnum.get("slider").value:
            returnData[4].is_using = 1;
            returnData[4].total_subscriptions = countSubscribed.filter((s: any) => s.site_id == EnumObject.siteEnum.get("slider").value).length
            returnData[4].last_access_datetime = element.sycu_app_visit_histories.length ? element.sycu_app_visit_histories[0].last_access_datetime : '';
            returnData[4].used_platforms = usedPlatforms.filter((s: any) => s.via_portal == EnumObject.siteEnum.get("slider").value).map((s: any) => s.via_platform);
            //@ts-ignore
            returnData[4].site_data.total_feeds = feedsCount;
            //@ts-ignore
            returnData[4].site_data.total_slideshow = slideShowCount;
            break;
          // case EnumObject.siteEnum.get("people").value:
          //   login_history.is_people = true;
          //   break;
          case EnumObject.siteEnum.get("affiliate").value:
            returnData[5].is_using = 1;
            returnData[5].last_access_datetime = element.sycu_app_visit_histories.length ? element.sycu_app_visit_histories[0].last_access_datetime : '';
            returnData[5].used_platforms = usedPlatforms.filter((s: any) => s.via_portal == EnumObject.siteEnum.get("affiliate").value).map((s: any) => s.via_platform);
            //@ts-ignore
            returnData[5].site_data.total_referrals = countReferrals.length;
            //@ts-ignore
            returnData[5].site_data.total_earnings = Math.round(countReferrals.reduce((partialSum, a) => partialSum + a.amount, 0));
            break;
          case EnumObject.siteEnum.get("habit Student").value:
            returnData[6].is_using = 1;
            returnData[6].last_access_datetime = element.sycu_app_visit_histories.length ? element.sycu_app_visit_histories[0].last_access_datetime : '';
            returnData[6].used_platforms = usedPlatforms.filter((s: any) => s.via_portal == EnumObject.siteEnum.get("habit Student").value).map((s: any) => s.via_platform);
            //@ts-ignore
            returnData[6].site_data.total_habit = habitStudentCount;
            break;
          case EnumObject.siteEnum.get("habit Kids").value:
            returnData[7].is_using = 1;
            returnData[7].last_access_datetime = element.sycu_app_visit_histories.length ? element.sycu_app_visit_histories[0].last_access_datetime : '';
            returnData[7].used_platforms = usedPlatforms.filter((s: any) => s.via_portal == EnumObject.siteEnum.get("habit Kids").value).map((s: any) => s.via_platform);
            //@ts-ignore
            returnData[7].site_data.total_habit = habitKidCount;
            break;
          case EnumObject.siteEnum.get("people").value:
            returnData[7].is_using = 1;
            returnData[7].last_access_datetime = element.sycu_app_visit_histories.length ? element.sycu_app_visit_histories[0].last_access_datetime : '';
            returnData[7].used_platforms = usedPlatforms.filter((s: any) => s.via_portal == EnumObject.siteEnum.get("people").value).map((s: any) => s.via_platform);
            break;
        }
      });
      new SuccessResponse(EC.success, {
        user: null,
        //@ts-ignore
        token: req.token,
        site_data: returnData
      }).send(res);
    }
    catch (error: any) {
      ApiError.handle(new BadRequestError(error.message), res);
    }
  }

  public async changeUserSharedDashboardLimit(req: Request, res: Response, next: NextFunction) {
    try {
      const requestContent: any = req;
      let userId = requestContent.user_id;
      let { change_user_id, is_shared_dashboard_unlimited } = req.body, notes: any = [];
      let user_data = await dbReader.userSettings.findOne({
        where: { user_id: change_user_id, key: 'is_shared_dashboard_unlimited' }
      });
      let userDetails = await dbReader.users.findOne({
        attributes: ['display_name'],
        where: { user_id: userId }
      });
      userDetails = JSON.parse(JSON.stringify(userDetails));
      let display_name = userDetails.display_name;
      notes = [{
        type: 5,
        event_type_id: change_user_id,
        message: "Unlimited dashboard shares option " + (is_shared_dashboard_unlimited == true ? "enabled" : "disabled") + " for the user by Admin (" + display_name + ")" + ".",
        created_datetime: new Date(),
        updated_datetime: new Date(),
        is_deleted: 0,
        is_customer: 0
      }];
      if (user_data) {
        await dbWriter.userSettings.update({
          value: is_shared_dashboard_unlimited
        }, {
          where: { user_setting_id: user_data.user_setting_id }
        });
        if (notes.length) {
          await dbWriter.notes.bulkCreate(notes);
        }
      } else {
        await dbWriter.userSettings.create({
          user_id: change_user_id,
          key: 'is_shared_dashboard_unlimited',
          value: is_shared_dashboard_unlimited
        });
        if (notes.length) {
          await dbWriter.notes.bulkCreate(notes);
        }
      }

      return new SuccessResponse(EC.success, {
        //@ts-ignore
        token: req.token
      }).send(res);
    }
    catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async getUserSharedMembership(req: Request, res: Response, next: NextFunction) {
    try {
      let { user_id } = req.params;
      let shared_data = await dbReader.sharedPages.findAll({
        where: { receiver_user_id: user_id, is_deleted: 0 },
        include: [{
          attributes: ['user_id', 'first_name', 'last_name', 'display_name', 'email', 'user_role'],
          model: dbReader.users,
          where: { is_deleted: 0 },
        }, {
          attributes: ['membership_id', 'site_id', 'membership_name'],
          model: dbReader.membership,
          where: { is_deleted: 0 },
          include: [{
            attributes: ['site_id', 'logo'],
            model: dbReader.sites,
          }]
        }, {
          separate: true,
          attributes: ['page_menu_id', 'shared_page_id', 'content_type_id'],
          model: dbReader.sharedPagesContentTypes,
          where: { is_deleted: 0 },
          include: [{
            separate: true,
            attributes: ['content_type_id', 'meta_key', 'meta_value'],
            model: dbReader.contentMeta,
            where: { meta_key: 'content_image', is_deleted: 0, },
          }]
        }]
      });

      let shareAllPages = await dbReader.shareAllPages.findAll({
        where: { receiver_user_id: user_id, is_deleted: 0 },
        include: [{
          attributes: ['user_id', 'first_name', 'last_name', 'display_name', 'email', 'user_role'],
          model: dbReader.users,
          where: { is_deleted: 0 },
        }]
      });
      shareAllPages = JSON.parse(JSON.stringify(shareAllPages));
      if (shareAllPages.length > 0) {
        shareAllPages.forEach((allPages: any) => {
          let membershipsArray: any = [];
          allPages.is_share_all_kids ? membershipsArray.push("Share All Current & Future Volumes ( Kids )") : null;
          allPages.is_share_all_students ? membershipsArray.push("Share All Current & Future Volumes ( Students )") : null;
          allPages.is_share_all_groups ? membershipsArray.push("Share All Current & Future Volumes ( Groups )") : null;
          allPages.membership_name = membershipsArray.join(", ");
        });
      }

      let returnData: any = []
      if (shared_data.length || shareAllPages.length) {
        shared_data = JSON.parse(JSON.stringify(shared_data));

        shareAllPages.forEach((allPages: any) => {
          shared_data.push(allPages);
        });
        shared_data.forEach((element: any) => {
          element.membership_name = element.sycu_memberships?.length ? element.sycu_memberships[0].membership_name : element.membership_name ? element.membership_name : "";
          element.site_logo = element.sycu_memberships?.length ? element.sycu_memberships[0].sycu_site.logo : "";
          element.sender_user = element.sycu_users?.length ? element.sycu_users[0] : "";
          element.sharedPageContentTypes?.forEach((e: any) => {
            e.content_type_image = e.content_meta?.length ? e.content_meta[0].meta_value : "";
            delete e.content_meta;
          });

          element.shared_content_types = element.sharedPageContentTypes || [];
          delete element.sycu_memberships;
          delete element.sycu_users;
          delete element.sharedPageContentTypes;
          if (returnData.some((s: any) => s.sender_user_id == element.sender_user_id)) {
            let index = returnData.findIndex((s: any) => s.sender_user_id == element.sender_user_id)
            returnData[index].membership_name = returnData[index].membership_name + ", " + element.membership_name
          } else {
            returnData.push(element)
          }
        });
      }

      return new SuccessResponse(EC.success, {
        //@ts-ignore
        token: req.token,
        shared_data: returnData
      }).send(res);
    }
    catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async getUserSharedMembershipOthers(req: Request, res: Response, next: NextFunction) {
    try {
      let { user_id } = req.params;
      let shared_data = await dbReader.sharedPages.findAll({
        where: { sender_user_id: user_id, is_deleted: 0 },
        include: [{
          required: false,
          as: 'share_user',
          attributes: ['user_id', 'first_name', 'last_name', 'display_name', 'email', 'user_role'],
          model: dbReader.users,
          where: { is_deleted: 0 },
        }, {
          attributes: ['membership_id', 'site_id', 'membership_name'],
          model: dbReader.membership,
          where: { is_deleted: 0 },
          include: [{
            attributes: ['site_id', 'logo'],
            model: dbReader.sites,
          }]
        }, {
          separate: true,
          attributes: ['page_menu_id', 'shared_page_id', 'content_type_id'],
          model: dbReader.sharedPagesContentTypes,
          where: { is_deleted: 0 },
          include: [{
            separate: true,
            attributes: ['content_type_id', 'meta_key', 'meta_value'],
            model: dbReader.contentMeta,
            where: { meta_key: 'content_image', is_deleted: 0, },
          }]
        }]
      });

      let shareAllPages = await dbReader.shareAllPages.findAll({
        where: { sender_user_id: user_id, is_deleted: 0 },
        include: [{
          required: false,
          as: 'share_user',
          attributes: ['user_id', 'first_name', 'last_name', 'display_name', 'email', 'user_role'],
          model: dbReader.users,
          where: { is_deleted: 0 },
        }]
      });
      shareAllPages = JSON.parse(JSON.stringify(shareAllPages));
      if (shareAllPages.length > 0) {
        shareAllPages.forEach((allPages: any) => {
          let membershipsArray: any = [];
          allPages.is_share_all_kids ? membershipsArray.push("Share All Current & Future Volumes ( Kids )") : null;
          allPages.is_share_all_students ? membershipsArray.push("Share All Current & Future Volumes ( Students )") : null;
          allPages.is_share_all_groups ? membershipsArray.push("Share All Current & Future Volumes ( Groups )") : null;
          allPages.membership_name = membershipsArray.join(", ");
        });
      }

      let returnData: any = []
      if (shared_data.length || shareAllPages.length) {
        shared_data = JSON.parse(JSON.stringify(shared_data));

        shareAllPages.forEach((allPages: any) => {
          shared_data.push(allPages);
        });
        shared_data.forEach((element: any) => {
          element.membership_name = element.sycu_memberships?.length ? element.sycu_memberships[0].membership_name : element.membership_name ? element.membership_name : "";
          element.site_logo = element.sycu_memberships?.length ? element.sycu_memberships[0].sycu_site.logo : "";
          element.sender_user = element.share_user?.length ? element.share_user[0] : "";
          element.sharedPageContentTypes?.forEach((e: any) => {
            e.content_type_image = e.content_meta?.length ? e.content_meta[0].meta_value : "";
            delete e.content_meta;
          });

          element.shared_content_types = element.sharedPageContentTypes || [];
          delete element.sycu_memberships;
          delete element.share_user;
          delete element.sharedPageContentTypes;
          if (returnData.some((s: any) => s.receiver_user_email == element.receiver_user_email)) {
            let index = returnData.findIndex((s: any) => s.receiver_user_email == element.receiver_user_email)
            returnData[index].membership_name = returnData[index].membership_name + ", " + element.membership_name
          } else {
            returnData.push(element)
          }
        });
      }
      if (returnData.length) {
        let i = 0;
        while (i < returnData.length) {
          if (returnData[i].receiver_user_id == 0) {
            let user_data = await dbReader.users.findOne({
              attributes: ['user_id', 'first_name', 'last_name', 'display_name', 'email', 'user_role'],
              where: { email: returnData[i].receiver_user_email, is_deleted: 0 },
            });
            if (user_data) {
              user_data = JSON.parse(JSON.stringify(user_data));
              returnData[i].receiver_user_id = user_data.user_id;
              returnData[i].sender_user = user_data;
              if (returnData[i].shared_page_id) {
                await dbWriter.sharedPages.update({
                  receiver_user_id: user_data.user_id
                }, {
                  where: { shared_page_id: returnData[i].shared_page_id }
                });
              }
              if (returnData[i].share_all_page_id) {
                await dbWriter.shareAllPages.update({
                  receiver_user_id: user_data.user_id
                }, {
                  where: { share_all_page_id: returnData[i].share_all_page_id }
                });
              }
            }
          }
          i++;
        }
      }

      return new SuccessResponse(EC.success, {
        //@ts-ignore
        token: req.token,
        shared_data: returnData
      }).send(res);
    }
    catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async allowCircleAccess(req: any, res: any) {
    try {
      let { emails = [], status = 1 } = req.body;
      let notFoundEmails: any = [];
      if (emails.length) {
        for (let i = 0; i < emails.length; i++) {
          let user = await dbReader.users.findOne({
            attributes: ['user_id'],
            where: { email: emails[i], is_deleted: 0 }
          });
          if (user) {
            user = JSON.parse(JSON.stringify(user));
            let subscriptions = await dbReader.userSubscription.findAll({
              attributes: ["user_subscription_id"],
              where: { site_id: 12, user_id: user.user_id, subscription_status: [2, 4, 10] },
            });
            if (subscriptions.length) {
              subscriptions = JSON.parse(JSON.stringify(subscriptions));
              for (let s = 0; s < subscriptions.length; s++) {
                await dbWriter.userSubscription.update({ is_circle_access: status }, {
                  where: { user_subscription_id: subscriptions[s].user_subscription_id }
                });
              }
            } else {
              notFoundEmails.push(emails[i]);
            }
          } else {
            notFoundEmails.push(emails[i]);
          }
        }
        return new SuccessResponse(EC.success, {
          emails: notFoundEmails
        }).send(res);
      } else {
        return new SuccessResponse("Email addresses not found", {}).send(res);
      }
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async getNotExecutedUsers(req: Request, res: Response) {
    try {
      let getPendingData = await dbReader.subscriptionRenewal.findAndCountAll({
        where: {
          is_executed: 0,
          is_deleted: 0,
          is_instant_payment: 0,
          renewal_date: {
            [Op.lt]: new Date()
          }
        },
        include: [{
          model: dbReader.userSubscription,
        }]
      })

      new SuccessResponse(EC.success, getPendingData).send(res);
    } catch (error: any) {
      ApiError.handle(new BadRequestError(error.message), res);
    }
  }

  /**
   * @Ritik 04-10-24
   * This API is used to add user activity in ba_facebook_groups table and add Active Campaign Tag.
   */
  public async addFacebookGroupActivity(req: Request, res: Response) {
    try {
      const {email,ba_facebook_groups_id,site_id,activity} = req.body;
      let user= await dbReader.users.findOne({
        where:{
          email
        },
        attributes:['user_id','activecampaign_contact_id','email']
      })

      user = JSON.parse(JSON.stringify(user));
      if(!user){
        // return BadRequestError.handle(new BadRequestError("User not found"), res);
        return new SuccessResponse(EC.error, {
          message: "User not found"
        }).send(res);
      }
      let checkPreviousActivity = await dbReader.baFacebookGroupActivity.findOne({
        where: {
          user_id:user.user_id,
          ba_facebook_groups_id,
          site_id
        }
      })
      if(!checkPreviousActivity){
        checkPreviousActivity= JSON.parse(JSON.stringify(checkPreviousActivity));
        let groupData = await dbReader.baFacebookGroups.findOne({
          where:{
            ba_facebook_groups_id
          }
        })
        groupData = JSON.parse(JSON.stringify(groupData));
        
        await dbWriter.baFacebookGroupActivity.create({
          user_id:user.user_id,
          ba_facebook_groups_id,
          site_id,
          activity
        })
        let tagsData = [{
          contact:user.activecampaign_contact_id,
          tag:groupData.ac_tag
        }]
        let addTagLogs=[{
            type: 4,//AC 
            event_type_id: user.user_id,
            message: groupData.ac_tag + ' tag added to contact in active campaign',
        }]
        await ac.addContactActiveCampaignTag(tagsData, addTagLogs);
        return new SuccessResponse(EC.success, {
          message: "Activity added successfully"
        }).send(res);
      }
      else{
        return new SuccessResponse(EC.success, {
          message: "Activity already added"
        }).send(res);
      }
    } catch (error:any) {
      return ApiError.handle(new BadRequestError(error.message), res);
    }
  }
  
  public async addEditFacebookGroup(req:Request,res:Response){
    try {
      const {name,fb_group_url,ac_tag,ba_facebook_groups_id=0} = req.body;
      if(ba_facebook_groups_id){
        let findGroup = await dbReader.baFacebookGroups.findOne({
          where:{
            ba_facebook_groups_id
          }
        })
        if(!findGroup){
          return new SuccessResponse(EC.error, {
            message: "Group not found"
          }).send(res);
        }
        else{
          let groupData = await dbWriter.baFacebookGroups.update({
            name,
            fb_group_url,
            ac_tag,
          },
        {
          where:{
            ba_facebook_groups_id
          }
        })
        return new SuccessResponse(EC.success, {
          message: "Group updated successfully",
          groupData
        }).send(res);
        }
      }
      else{
        let groupData = await dbWriter.baFacebookGroups.create({
          name,
          fb_group_url,
          ac_tag,
        })
        return new SuccessResponse(EC.success, {
          message: "Group added successfully",
          groupData
        }).send(res);
      }
    } catch (error:any) {
      return ApiError.handle(new BadRequestError(error.message), res);
    }
  }

  public async listFacebookGroups(req:Request,res:Response){
    try {
      const {page_no = 1 ,limit = 10,sort_by,sort_type,search} = req.body;
      let offset = (page_no-1)*limit;
      let whereStatement: any = {}
      if(search){
        whereStatement.where={
          [Op.or]:[
            {
              name: {
                [Op.like]: `%${search}%`
              }
            },
            {
              fb_group_url: {
                [Op.like]: `%${search}%`
              }
            }
          ]
        }
      }
      let listGroups = await dbReader.baFacebookGroups.findAndCountAll({
        where:whereStatement.where,
        order:[
          [sort_by,sort_type]
        ],
        offset:offset,
        limit:limit
      })
      let groupCount = await dbReader.baFacebookGroupActivity.count({
        group: ['ba_facebook_groups_id']
      })
     return new SuccessResponse(EC.success,{listGroups,groupCount}).send(res);
    } catch (error:any) {
      return ApiError.handle(new BadRequestError(error.message), res);
    }
  }

  public async listFacebookGroupActivity(req:Request,res:Response){
    try {
      const {page_no = 1 ,limit = 10,search="",filter,start_date,end_date} = req.body;
      let offset = (page_no-1)*limit;
      let whereStatement: any = {}
      if(start_date && end_date){
        whereStatement.where = {
          created_date: {
            [Op.between]: [start_date, end_date]
          }
        }
      }
      if(filter){
        whereStatement.where = {
          ...whereStatement.where,
          ...filter
        }
      }
      let userWhere = {}
      if(search){
        userWhere = {
          [Op.or]:[
            {email:{[Op.like]:`%${search}%`}},
            {first_name:{[Op.like]:`%${search}%`}},
            {last_name:{[Op.like]:`%${search}%`}},
            {username:{[Op.like]:`%${search}%`}},
          ]
        }
      }
      let listActivity = await dbReader.baFacebookGroupActivity.findAndCountAll({
        where:whereStatement.where,
        offset:offset,
        limit:limit,
        include:[
          {
            model:dbReader.users,
            attributes:['email','username','first_name','last_name'],
            where:userWhere
          },
          {
            model:dbReader.baFacebookGroups,
            attributes:['name']
          }
        ]
      })
     return new SuccessResponse(EC.success, listActivity).send(res);
    } catch (error:any) {
      return ApiError.handle(new BadRequestError(error.message), res);
    }
  }

}
