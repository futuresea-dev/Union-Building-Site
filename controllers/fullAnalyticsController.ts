import { Request, Response } from "express";
import moment from "moment";
import _ from "lodash";
import {
  ErrorController,
  SuccessResponse,
  BadRequestError,
  ApiError,
} from ".././core/index";
const { dbReader, dbWriter } = require("../models/dbConfig");
const EC = new ErrorController();
const { Op } = dbReader.Sequelize;
import { getDateRange } from ".././helpers/helpers";
import { any } from "joi";
import { enumerationController } from "./enumerationController";
var EnumObject = new enumerationController();
const credentialsJsonPath = require("../../credential.json");
import {BetaAnalyticsDataClient} from '@google-analytics/data';
const path = require("path");
const credentialPath = path.join(__dirname, "../../credential.json");
const analyticsDataClient = new BetaAnalyticsDataClient({
  keyFilename: credentialPath,
});
export class FullAnalyticsController {

  public async overallPerformance(req: Request, res: Response) {
    try {
      let { range } = req.body;
      let { compared_range, site_id, tz } = req.body;
      let siteCondition = {};
      if (site_id) {
        siteCondition = { site_id: site_id }
      }
      let startDate = moment(new Date(range.start_date)).set({ hour: 0o0, minute: 0o0 }).format("YYYY-MM-DD HH:mm")
      let endDate = moment(new Date(range.end_date)).set({ hour: 23, minute: 59 }).format("YYYY-MM-DD HH:mm")
      let startDate1 = moment(new Date(compared_range.start_date)).set({ hour: 0o0, minute: 0o0 }).format("YYYY-MM-DD HH:mm")
      let endDate1 = moment(new Date(compared_range.end_date)).set({ hour: 23, minute: 59 }).format("YYYY-MM-DD HH:mm")
      if (tz == 1) {
        startDate = moment(new Date(range.start_date)).set({ hour: 0o0, minute: 0o0 }).zone("-04:00").format("YYYY-MM-DD HH:mm")
        endDate = moment(new Date(range.end_date)).set({ hour: 23, minute: 59 }).zone("-04:00").format("YYYY-MM-DD HH:mm")
        startDate1 = moment(new Date(compared_range.start_date)).set({ hour: 0o0, minute: 0o0 }).zone("-04:00").format("YYYY-MM-DD HH:mm")
        endDate1 = moment(new Date(compared_range.end_date)).set({ hour: 23, minute: 59 }).zone("-04:00").format("YYYY-MM-DD HH:mm")
      }
      let currentYearData = await dbReader.userOrder.findAll({
        attributes: [[dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('`user_orders`.`created_datetime`'), '%Y-%m-%d %H:%i'), 'created_date'], 'user_orders_id'],
        where: dbReader.sequelize.and(
          { order_status: [2, 3, 4, 5, 6, 8] },
          dbReader.Sequelize.or(
            dbReader.Sequelize.and(
              dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m-%d %H:%i'), { [dbReader.Sequelize.Op.gte]: startDate }),
              dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m-%d %H:%i'), { [dbReader.Sequelize.Op.lte]: endDate })
            ),
            dbReader.Sequelize.and(
              dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m-%d %H:%i'), { [dbReader.Sequelize.Op.gte]: startDate1 }),
              dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m-%d %H:%i'), { [dbReader.Sequelize.Op.lte]: endDate1 })
            ),
          )
        ),
        include: [{
          separate: true,
          model: dbReader.userOrderItems,
          where: { item_type: 5 },
          attributes: ['item_type', 'product_amount', 'user_orders_id', 'created_datetime']
        }, {
          required: true,
          model: dbReader.transactionMaster,
          where: { status: 'Success', type: 1 },
          attributes: ['amount', 'processing_fee']
        }, {
          required: true,
          model: dbReader.userSubscription,
          where: siteCondition
        }]
      })
      currentYearData = JSON.parse(JSON.stringify(currentYearData))
      let currentYearRefundData = await dbReader.userOrder.findAll({
        attributes: [[dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('`user_orders`.`created_datetime`'), '%Y-%m-%d %H:%i'), 'created_date']],
        where: dbReader.sequelize.and(
          dbReader.Sequelize.or(
            dbReader.Sequelize.and(
              dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m-%d %H:%i'), { [dbReader.Sequelize.Op.gte]: startDate }),
              dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m-%d %H:%i'), { [dbReader.Sequelize.Op.lte]: endDate })
            ),
            dbReader.Sequelize.and(
              dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m-%d %H:%i'), { [dbReader.Sequelize.Op.gte]: startDate1 }),
              dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m-%d %H:%i'), { [dbReader.Sequelize.Op.lte]: endDate1 })
            ),
          )
        ),
        include: [
          {
            required: true,
            model: dbReader.refunds,
            where: { status: 1 }
          }, {
            required: true,
            model: dbReader.userSubscription,
            where: siteCondition
          }
        ]
      })
      currentYearRefundData = JSON.parse(JSON.stringify(currentYearRefundData))
      let netSales = 0;
      let netSales1 = 0;
      let netSales2 = 0;
      let netSales3 = 0;
      let netSales4 = 0;
      let netSales5 = 0;
      let netSales6 = 0;
      let netSales7 = 0;
      let discountedCoupon = 0;
      let discountedCoupon1 = 0;
      let d11 = currentYearData.filter((s: any) => s.created_date >= startDate && s.created_date <= endDate)
      let d22 = currentYearData.filter((s: any) => s.created_date >= startDate1 && s.created_date <= endDate1)
      d11.forEach((ed1: any) => {
        netSales += ed1.sycu_transaction_master.amount
        netSales6 += ed1.sycu_transaction_master.processing_fee
        ed1.user_order_items.forEach((e2: any) => {
          discountedCoupon++
          netSales2 += e2.product_amount
        });
      });
      d22.forEach((ed2: any) => {
        netSales1 += ed2.sycu_transaction_master.amount
        netSales7 += ed2.sycu_transaction_master.processing_fee
        ed2.user_order_items.forEach((e2: any) => {
          discountedCoupon1++
          netSales3 += e2.product_amount
        });
      });
      let _d11 = currentYearRefundData.filter((s: any) => s.created_date >= startDate && s.created_date <= endDate);
      let _d22 = currentYearRefundData.filter((s: any) => s.created_date >= startDate1 && s.created_date <= endDate1);
      _d11.forEach((ed1: any) => {
        ed1.refunds.forEach((e: any) => {
          netSales4 += e.refund_amount
        });
      });
      _d22.forEach((ed2: any) => {
        ed2.refunds.forEach((e: any) => {
          netSales5 += e.refund_amount
        })
      });
      let yearData = await dbReader.products.findAll({
        attributes: [
          [
            dbReader.Sequelize.fn(
              "COUNT",
              dbReader.Sequelize.literal("`user_order_item`.`product_id`")
            ),
            "item_sold",
          ],
          [
            dbReader.Sequelize.fn(
              "COUNT",
              dbReader.Sequelize.literal(
                "`user_order_item->user_order`.`user_orders_id`"
              )
            ),
            "orders",
          ],
          [
            dbReader.Sequelize.fn(
              "date_format",
              dbReader.Sequelize.col(
                "`user_order_item->user_order`.`created_datetime`"
              ),
              "%Y-%m-%d"
            ),
            "created_date",
          ],
        ],
        where: dbReader.sequelize.and(
          dbReader.Sequelize.or(
            dbReader.Sequelize.and(
              dbReader.Sequelize.where(
                dbReader.Sequelize.fn(
                  "DATE_FORMAT",
                  dbReader.sequelize.col(
                    "`user_order_item->user_order`.`created_datetime`"
                  ),
                  "%Y-%m-%d"
                ),
                { [Op.gte]: range.start_date }
              ),
              dbReader.Sequelize.where(
                dbReader.Sequelize.fn(
                  "DATE_FORMAT",
                  dbReader.sequelize.col(
                    "`user_order_item->user_order`.`created_datetime`"
                  ),
                  "%Y-%m-%d"
                ),
                { [Op.lte]: range.end_date }
              )
            ),
            dbReader.Sequelize.and(
              dbReader.Sequelize.where(
                dbReader.Sequelize.fn(
                  "DATE_FORMAT",
                  dbReader.sequelize.col(
                    "`user_order_item->user_order`.`created_datetime`"
                  ),
                  "%Y-%m-%d"
                ),
                { [Op.gte]: compared_range.start_date }
              ),
              dbReader.Sequelize.where(
                dbReader.Sequelize.fn(
                  "DATE_FORMAT",
                  dbReader.sequelize.col(
                    "`user_order_item->user_order`.`created_datetime`"
                  ),
                  "%Y-%m-%d"
                ),
                { [Op.lte]: compared_range.end_date }
              )
            )
          ),
          { is_deleted: 0, site_id: site_id }
        ),
        include: [
          {
            required: true,
            model: dbReader.userOrderItems,
            attributes: [],
            where: { item_type: 1 },
            include: [
              {
                required: true,
                model: dbReader.userOrder,
                where: {
                  order_status: [2, 3, 4, 5, 6, 8],
                },
                attributes: [],
                include: [
                  {
                    required: true,
                    model: dbReader.transactionMaster,
                    where: { status: "Success" },
                    attributes: [],
                  },
                ],
              },
            ],
          },
        ],
        group: [
          "`user_order_item`.`product_id`",
          [
            dbReader.Sequelize.fn(
              "date_format",
              dbReader.Sequelize.col(
                "`user_order_item->user_order`.`created_datetime`"
              ),
              "%Y-%m-%d"
            ),
          ],
        ],
      });
      yearData = JSON.parse(JSON.stringify(yearData));
      // Current Year
      //Old
      let filterCurrentData: any = [],
        currentNetSale = 0;
      yearData.filter(function (e: any, i: any) {
        if (
          e.created_date >= range.start_date &&
          e.created_date <= range.end_date
        ) {
          currentNetSale += e.net_sale;
          filterCurrentData.push(e);
        }
      });
      //Past Year
      let filterPastData: any = [],
        pastNetSale = 0;
      yearData.filter(function (e: any, i: any) {
        if (
          e.created_date >= compared_range.start_date &&
          e.created_date <= compared_range.end_date
        ) {
          pastNetSale += e.net_sale;
          filterPastData.push(e);
        }
      });
      let current = JSON.parse(JSON.stringify(filterCurrentData));
      let current_item_sold = 0,
        current_orders = 0;
      if (current.length) {
        current.forEach((element: any) => {
          current_item_sold += element.item_sold;
          current_orders += element.orders;
        });
      }
      // Past Count
      let past = JSON.parse(JSON.stringify(filterPastData));
      let past_total_sum = 0,
        past_item_sold = 0,
        past_orders = 0;
      if (past.length) {
        past.forEach((element: any) => {
          past_item_sold += element.item_sold;
          past_orders += element.orders;
        });
      }
      let freeUserData = await dbReader.users.findAll({
        attributes: [
          "user_id",
          [
            dbReader.Sequelize.literal(
              'DATE_FORMAT(`created_datetime`,"%Y-%m-%d")'
            ),
            "created_date",
          ],
          [
            dbReader.Sequelize.literal(
              `(select count(1) from sycu_user_subscriptions where subscription_status IN (2, 4) AND user_id = sycu_users.user_id AND site_id = ${site_id})`
            ),
            "uct",
          ],
        ],
        where: dbReader.Sequelize.and(
          dbReader.Sequelize.or(
            dbReader.Sequelize.and(
              dbReader.Sequelize.where(
                dbReader.Sequelize.fn(
                  "DATE_FORMAT",
                  dbReader.sequelize.col("sycu_users.created_datetime"),
                  "%Y-%m-%d"
                ),
                { [dbReader.Sequelize.Op.gte]: range.start_date }
              ),
              dbReader.Sequelize.where(
                dbReader.Sequelize.fn(
                  "DATE_FORMAT",
                  dbReader.sequelize.col("sycu_users.created_datetime"),
                  "%Y-%m-%d"
                ),
                { [dbReader.Sequelize.Op.lte]: range.end_date }
              )
            ),
            dbReader.Sequelize.and(
              dbReader.Sequelize.where(
                dbReader.Sequelize.fn(
                  "DATE_FORMAT",
                  dbReader.sequelize.col("sycu_users.created_datetime"),
                  "%Y-%m-%d"
                ),
                { [dbReader.Sequelize.Op.gte]: compared_range.start_date }
              ),
              dbReader.Sequelize.where(
                dbReader.Sequelize.fn(
                  "DATE_FORMAT",
                  dbReader.sequelize.col("sycu_users.created_datetime"),
                  "%Y-%m-%d"
                ),
                { [dbReader.Sequelize.Op.lte]: compared_range.start_date }
              )
            )
          ),
          { is_deleted: 0 }
        ),
      });
      freeUserData = JSON.parse(JSON.stringify(freeUserData));
      // Current Year & Past Year For Free Users
      let filterCurrentDataFreeUsers = [],
        filterPastDataFreeUsers = [];
      // Current Year & Past Year For Paid Users
      let filterCurrentDataPaidUsers = [],
        filterPastDataPaidUsers = [];
      freeUserData.filter(function (e: any, i: any) {
        if (e.uct == 0) {
          if (
            e.created_date >= range.start_date &&
            e.created_date <= range.end_date
          ) {
            filterCurrentDataFreeUsers.push(e);
          }
          if (
            e.created_date >= compared_range.start_date &&
            e.created_date <= compared_range.end_date
          ) {
            filterPastDataFreeUsers.push(e);
          }
        } else {
          if (
            e.created_date >= range.start_date &&
            e.created_date <= range.end_date
          ) {
            filterCurrentDataPaidUsers.push(e);
          }
          if (
            e.created_date >= compared_range.start_date &&
            e.created_date <= compared_range.end_date
          ) {
            filterPastDataPaidUsers.push(e);
          }
        }
      });
      if (currentYearData.length > 0) {
        new SuccessResponse(EC.success, {
          reports: {
            total_sales: {
              value: netSales + netSales2,
              previousPeriodValue: netSales1 + netSales3,
            },
            net_discounted_amount: {
              value: parseFloat(netSales2.toFixed(2)),
              previousPeriodValue: parseFloat(netSales3.toFixed(2)),
            },
            discounted_orders: {
              value: discountedCoupon,
              previousPeriodValue: discountedCoupon1,
            },
            net_sales: {
              value: parseFloat((netSales - netSales6 - netSales4).toFixed(2)),
              previousPeriodValue: parseFloat((netSales1 - netSales7 - netSales5).toFixed(2)),
            },
            items_sold: {
              value: current_item_sold,
              previousPeriodValue: past_item_sold,
            },
            orders: {
              value: current_orders,
              previousPeriodValue: past_orders,
            },
            registered_users: {
              value:
                filterCurrentDataPaidUsers.length +
                filterCurrentDataFreeUsers.length,
              previousPeriodValue:
                filterPastDataPaidUsers.length + filterPastDataFreeUsers.length,
            },
            subscribed_users: {
              value: filterCurrentDataPaidUsers.length,
              previousPeriodValue: filterPastDataPaidUsers.length,
            },
          },
        }).send(res);
      } else {
        new SuccessResponse(EC.noDataFound, {
          reports: {
            total_sales: {
              value: 0,
              previousPeriodValue: 0,
            },
            net_discounted_amount: {
              value: 0,
              previousPeriodValue: 0,
            },
            discounted_orders: {
              value: 0,
              previousPeriodValue: 0,
            },
            net_sales: {
              value: 0,
              previousPeriodValue: 0
            },
            items_sold: {
              value: 0,
              previousPeriodValue: 0,
            },
            orders: {
              value: 0,
              previousPeriodValue: 0,
            },
            registered_users: {
              value: 0,
              previousPeriodValue: 0
            },
            subscribed_users: {
              value: 0,
              previousPeriodValue: 0,
            },
          },
        }).send(res);
      }
      // let productData = await
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async overallSubscription(req: Request, res: Response) {
    try {
      let { site_id = 2 } = req.body;
  
      const [results, Studentresults, groupresults] = await Promise.all([
        dbReader.userMemberships.findAll({
          attributes: ['user_id', 'membership_id'],
          where: {
            site_id: site_id,
            is_deleted: 0,
            status: [2, 4, 10]
          },
          include: [{
            model: dbReader.users,
            attributes: ['user_id'],
            where: { is_deleted: 0, status: 1 }
          }, {
            model: dbReader.membershipProduct,
            attributes: ['membership_product_id'],
            where: { is_deleted: 0 },
            include: [{
              model: dbReader.products,
              attributes: ['product_id', 'product_duration', 'ministry_type'],
              where: {
                is_deleted: 0,
                product_duration: [30, 90, 365],
                ministry_type: 1,
                category_id: [341, 256, EnumObject.categoryIDEnum.get('musicCategoryId').value, 2, 3, 4, 5, 6]
              }
            }]
          }],
          group: ['user_id', 'membership_id']
        }).then((res:any) => JSON.parse(JSON.stringify(res))),
  
        dbReader.userMemberships.findAll({
          attributes: ['user_id', 'membership_id'],
          where: {
            site_id: site_id,
            is_deleted: 0,
            status: [2, 4, 10]
          },
          include: [{
            model: dbReader.users,
            attributes: ['user_id'],
            where: { is_deleted: 0, status: 1 }
          }, {
            model: dbReader.membershipProduct,
            attributes: ['membership_product_id'],
            where: { is_deleted: 0 },
            include: [{
              model: dbReader.products,
              attributes: ['product_id', 'product_duration', 'ministry_type'],
              where: {
                is_deleted: 0,
                product_duration: [30, 90, 365],
                ministry_type: 2,
                category_id: [341, 256, EnumObject.categoryIDEnum.get('musicCategoryId').value, 2, 3, 4, 5, 6]
              }
            }]
          }],
          group: ['user_id', 'membership_id']
        }).then((res:any) => JSON.parse(JSON.stringify(res))),
  
        dbReader.userMemberships.findAll({
          attributes: ['user_id', 'membership_id'],
          where: {
            site_id: site_id,
            is_deleted: 0,
            status: [2, 4, 10]
          },
          include: [{
            model: dbReader.users,
            attributes: ['user_id'],
            where: { is_deleted: 0, status: 1 }
          }, {
            model: dbReader.membershipProduct,
            attributes: ['membership_product_id'],
            where: { is_deleted: 0 },
            include: [{
              model: dbReader.products,
              attributes: ['product_id', 'product_duration', 'ministry_type'],
              where: {
                is_deleted: 0,
                product_duration: [30, 90, 365],
                ministry_type: [1, 2, 3],
                category_id: [341, 256, EnumObject.categoryIDEnum.get('musicCategoryId').value, 2, 3, 4, 5, 6]
              }
            }]
          }],
          group: ['user_id', 'membership_id']
        }).then((res:any) => JSON.parse(JSON.stringify(res)))
      ]);
  
      let kidsCount30 = 0, kidsCount90 = 0, kidsCount365 = 0;
      let studentsCount30 = 0, studentsCount90 = 0, studentsCount365 = 0;
      let groupCount30 = 0, groupCount90 = 0, groupCount365 = 0;
  
      results.forEach((result: any) => {
        const membershipProduct = result.sycu_membership_product;
        const product = membershipProduct.sycu_product;
  
        if (product.ministry_type === 1) {
          switch (product.product_duration) {
            case 30:
              kidsCount30++;
              break;
            case 90:
              kidsCount90++;
              break;
            case 365:
              kidsCount365++;
              break;
          }
        }
      });
  
      Studentresults.forEach((result: any) => {
        const membershipProduct = result.sycu_membership_product;
        const product = membershipProduct.sycu_product;
  
        if (product.ministry_type === 2) {
          switch (product.product_duration) {
            case 30:
              studentsCount30++;
              break;
            case 90:
              studentsCount90++;
              break;
            case 365:
              studentsCount365++;
              break;
          }
        }
      });
  
      groupresults.forEach((result: any) => {
        const membershipProduct = result.sycu_membership_product;
        const product = membershipProduct.sycu_product;
  
        if (product.ministry_type === 3) {
          switch (product.product_duration) {
            case 30:
              groupCount30++;
              break;
            case 90:
              groupCount90++;
              break;
            case 365:
              groupCount365++;
              break;
          }
        }
      });
  
      new SuccessResponse(EC.success, {
        subscription: {
          grow_kids: {
            total: kidsCount30 + kidsCount90 + kidsCount365,
            monthly: kidsCount30,
            quarterly: kidsCount90,
            yearly: kidsCount365,
          },
          grow_students: {
            total: studentsCount30 + studentsCount90 + studentsCount365,
            monthly: studentsCount30,
            quarterly: studentsCount90,
            yearly: studentsCount365,
          },
          grow_groups: {
            total: groupCount30 + groupCount90 + groupCount365,
            monthly: groupCount30,
            quarterly: groupCount90,
            yearly: groupCount365,
          },
          monthly: {
            total: kidsCount30 + studentsCount30 + groupCount30,
            grow_kids: kidsCount30,
            grow_students: studentsCount30,
            grow_groups: groupCount30,
          },
          quarterly: {
            total: kidsCount90 + studentsCount90 + groupCount90,
            grow_kids: kidsCount90,
            grow_students: studentsCount90,
            grow_groups: groupCount90,
          },
          yearly: {
            total: kidsCount365 + studentsCount365 + groupCount365,
            grow_kids: kidsCount365,
            grow_students: studentsCount365,
            grow_groups: groupCount365,
          },
          active_subscriptions: {
            value: kidsCount30 + kidsCount90 + kidsCount365 + studentsCount30 + studentsCount90 + studentsCount365 + groupCount30 + groupCount90 + groupCount365,
          }
        },
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
  
  public async discountedOrderGraph(req: Request, res: Response) {
    try {
      let { range, compared_range, by, type } = req.body
      let subWhereCon = dbReader.Sequelize.Op.ne, subWhereData = null
      if (type) {
        switch (type) {
          case 'coupons':
            subWhereCon = dbReader.Sequelize.Op.eq
            subWhereData = 5
            break;
        }
      }
      let attributes: any = [[dbReader.sequelize.literal('`user_orders`.`created_datetime`'), 'created_datetime'], 'user_orders_id']

      switch (by) {
        case 'day':
          attributes = [[dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m-%d'), 'created_datetime'], 'user_orders_id']

          break;
        case 'week':
          attributes = [[dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m-%d'), 'created_datetime'], 'user_orders_id']

          break;
        case 'month':
          attributes = [[dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m'), 'created_datetime'], 'user_orders_id']
          break;
        case 'quarter':
          attributes = [[dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m'), 'created_datetime'], 'user_orders_id']
          break;
      }
      let currentYearData = await dbReader.userOrder.findAll({
        attributes: attributes,
        where: dbReader.sequelize.and(
          { order_status: [2, 3, 4, 5, 6, 8] },
          dbReader.Sequelize.or(
            dbReader.Sequelize.and(
              dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.gte]: range.start_date }),
              dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.lte]: range.end_date })
            ),
            dbReader.Sequelize.and(
              dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.gte]: compared_range.start_date }),
              dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.lte]: compared_range.end_date })
            ),
          )
        ),
        include: [{
          separate: true,
          model: dbReader.userOrderItems,
          where: { item_type: { [subWhereCon]: subWhereData } },
          attributes: ['item_type', 'product_amount', 'user_orders_id', 'created_datetime']
        }, {
          model: dbReader.transactionMaster,
          where: { status: 'Success' },
          attributes: []
        }]
      })
      currentYearData = JSON.parse(JSON.stringify(currentYearData))
      if (currentYearData) {
        let returnData: any = [];
        switch (by) {
          case "quarter":
            let by_quarterly_date1: any = moment(range.start_date, 'DD-MM-YYYY').format('MM');
            // let by_quarterly_date1 = moment(range.start_date, 'DD-MM-YYYY');
            let by_quarterly_date2: any = moment(range.end_date).format('MM');
            // let by_quarterly_date2 = moment(range.end_date, 'DD-MM-YYYY');
            // let by_quarterly_monthDiff1 = by_quarterly_date2.diff(by_quarterly_date1, 'month');
            let by_quarterly_monthDiff1 = by_quarterly_date2 - by_quarterly_date1
            for (let index = 0; index < by_quarterly_monthDiff1; index++) {
              let d1 = moment(range.start_date).add(index, 'M').format('YYYY-MM');
              let d2 = moment(compared_range.start_date).add(index, 'M').format('YYYY-MM');
              let d11 = currentYearData.filter((s: any) => s.created_datetime == d1)
              let d22 = currentYearData.filter((s: any) => s.created_datetime == d2)
              let d111 = 0, d222 = 0
              d11.forEach((ed1: any) => {
                ed1.user_order_items.forEach((e2: any) => {
                  if (type == "coupons") {
                    if (e2.item_type == 5) {
                      d111++
                    }
                  }
                });
              });
              d22.forEach((ed2: any) => {
                ed2.user_order_items.forEach((e2: any) => {
                  if (type == "coupons") {
                    if (e2.item_type == 5) {
                      d222++
                    }
                  }
                });
              });
              if ([0, 1, 2].includes(index)) {
                let td = moment(range.start_date).add(0, 'M').format('YYYY-MM');
                let td2 = moment(compared_range.start_date).add(0, 'M').format('YYYY-MM');
                if (returnData.some((e: any) => e.cp_date_time == td)) {
                  let _tdi = returnData.findIndex((e: any) => e.cp_date_time == td)
                  returnData[_tdi].cp = returnData[_tdi].cp + d111
                  returnData[_tdi].pp = returnData[_tdi].pp + d222
                } else {
                  returnData.push({
                    cp_date_time: td,
                    cp: d111,
                    pp_date_time: td2,
                    pp: d222,
                  })
                }
              } else if ([3, 4, 5].includes(index)) {
                let td = moment(range.start_date).add(3, 'M').format('YYYY-MM');
                let td2 = moment(compared_range.start_date).add(3, 'M').format('YYYY-MM');
                if (returnData.some((e: any) => e.cp_date_time == td)) {
                  let _tdi = returnData.findIndex((e: any) => e.cp_date_time == td)
                  returnData[_tdi].cp = returnData[_tdi].cp + d111
                  returnData[_tdi].pp = returnData[_tdi].pp + d222
                } else {
                  returnData.push({
                    cp_date_time: td,
                    cp: d111,
                    pp_date_time: td2,
                    pp: d222,
                  })
                }
              } else if ([6, 7, 8].includes(index)) {
                let td = moment(range.start_date).add(6, 'M').format('YYYY-MM');
                let td2 = moment(compared_range.start_date).add(6, 'M').format('YYYY-MM');
                if (returnData.some((e: any) => e.cp_date_time == td)) {
                  let _tdi = returnData.findIndex((e: any) => e.cp_date_time == td)
                  returnData[_tdi].cp = returnData[_tdi].cp + d111
                  returnData[_tdi].pp = returnData[_tdi].pp + d222
                } else {
                  returnData.push({
                    cp_date_time: td,
                    cp: d111,
                    pp_date_time: td2,
                    pp: d222,
                  })
                }
              } else if ([9, 10, 11].includes(index)) {
                let td = moment(range.start_date).add(9, 'M').format('YYYY-MM');
                let td2 = moment(compared_range.start_date).add(9, 'M').format('YYYY-MM');
                if (returnData.some((e: any) => e.cp_date_time == td)) {
                  let _tdi = returnData.findIndex((e: any) => e.cp_date_time == td)
                  returnData[_tdi].cp = returnData[_tdi].cp + d111
                  returnData[_tdi].pp = returnData[_tdi].pp + d222
                } else {
                  returnData.push({
                    cp_date_time: td,
                    cp: d111,
                    pp_date_time: td2,
                    pp: d222,
                  })
                }
              }
            }
            break;
          case "month":
            var now1 = new Date(range.end_date);
            var now11 = new Date(range.start_date)
            var daysOfYear1: any = [];
            for (var d = now11; d <= now1; d.setDate(d.getDate() + 1)) {
              let month = moment(d).format('MM');
              if (daysOfYear1.some((s: any) => s.month == month)) {
                let fi = daysOfYear1.findIndex((s: any) => s.month == month)
                daysOfYear1[fi].end_date = moment(d).format('YYYY-MM-DD')
              } else {
                daysOfYear1.push({
                  month: month,
                  start_date: moment(d).format('YYYY-MM-DD'),
                  end_date: moment(d).format('YYYY-MM-DD')
                })
              }
            }
            var now2 = new Date(compared_range.end_date);
            var now22 = new Date(compared_range.start_date)
            var daysOfYear2: any = [];
            for (var d = now22; d <= now2; d.setDate(d.getDate() + 1)) {
              let month = moment(d).format('MM');
              if (daysOfYear2.some((s: any) => s.month == month)) {
                let fi = daysOfYear2.findIndex((s: any) => s.month == month)
                daysOfYear2[fi].end_date = moment(d).format('YYYY-MM-DD')
              } else {
                daysOfYear2.push({
                  month: month,
                  start_date: moment(d).format('YYYY-MM-DD'),
                  end_date: moment(d).format('YYYY-MM-DD')
                })
              }
            }
            daysOfYear1.reverse();
            daysOfYear2.reverse();
            for (let index = 0; index < Math.min(daysOfYear1.length, daysOfYear2.length); index++) {
              let startDate1 = daysOfYear1[index] ? daysOfYear1[index].start_date : '';
              let lastDate1 = daysOfYear1[index] ? daysOfYear1[index].end_date : '';
              let startDate2 = daysOfYear2[index] ? daysOfYear2[index].start_date : '';
              let lastDate2 = daysOfYear2[index] ? daysOfYear2[index].end_date : '';
              let d1 = moment(startDate1).format('YYYY-MM');
              let d2 = moment(startDate2).format('YYYY-MM');
              let d11 = currentYearData.filter((s: any) => s.created_datetime == d1)
              let d22 = currentYearData.filter((s: any) => s.created_datetime == d2)
              let d111 = 0, d222 = 0
              d11.forEach((ed1: any) => {
                ed1.user_order_items.forEach((e2: any) => {
                  if (type == "coupons") {
                    if (e2.item_type == 5) {
                      d111++
                    }
                  }
                });
              });
              d22.forEach((ed2: any) => {
                ed2.user_order_items.forEach((e2: any) => {
                  if (type == "coupons") {
                    if (e2.item_type == 5) {
                      d222++
                    }
                  }
                });
              });
              returnData.push({
                cp_date_time: startDate1,
                cp: d111,
                pp_date_time: startDate2,
                pp: d222,
              })
            }
            returnData.reverse();
            break;
          case "week":
            moment.updateLocale('in', {
              week: {
                dow: 1 // Monday is the first day of the week
              }
            });
            var now1 = new Date(range.end_date);
            var daysOfYear1: any = [];
            for (var d = new Date(range.start_date); d <= now1; d.setDate(d.getDate() + 1)) {
              let week = moment(d).week();
              if (daysOfYear1.some((s: any) => s.week == week)) {
                let fi = daysOfYear1.findIndex((s: any) => s.week == week)
                daysOfYear1[fi].end_date = moment(d).format('YYYY-MM-DD')
              } else {
                daysOfYear1.push({
                  week: week,
                  start_date: moment(d).format('YYYY-MM-DD'),
                  end_date: moment(d).format('YYYY-MM-DD')
                })
              }
            }
            var now2 = new Date(compared_range.end_date);
            var daysOfYear2: any = [];
            for (var d = new Date(compared_range.start_date); d <= now2; d.setDate(d.getDate() + 1)) {
              let week = moment(d).week();
              if (daysOfYear2.some((s: any) => s.week == week)) {
                let fi = daysOfYear2.findIndex((s: any) => s.week == week)
                daysOfYear2[fi].end_date = moment(d).format('YYYY-MM-DD')
              } else {
                daysOfYear2.push({
                  week: week,
                  start_date: moment(d).format('YYYY-MM-DD'),
                  end_date: moment(d).format('YYYY-MM-DD')
                })
              }
            }
            daysOfYear1.reverse();
            daysOfYear2.reverse();
            for (let index = 0; index < Math.min(daysOfYear1.length, daysOfYear2.length); index++) {
              let startDate1 = daysOfYear1[index] ? daysOfYear1[index].start_date : '';
              let lastDate1 = daysOfYear1[index] ? daysOfYear1[index].end_date : '';
              let startDate2 = daysOfYear2[index] ? daysOfYear2[index].start_date : '';
              let lastDate2 = daysOfYear2[index] ? daysOfYear2[index].end_date : '';
              let DR1 = currentYearData.filter((s: any) => s.created_datetime >= startDate1 && s.created_datetime <= lastDate1);
              let DR2 = currentYearData.filter((s: any) => s.created_datetime >= startDate2 && s.created_datetime <= lastDate2);
              let d111 = 0, d222 = 0;
              DR1.forEach((ed1: any) => {
                ed1.user_order_items.forEach((e2: any) => {
                  if (type == "coupons") {
                    if (e2.item_type == 5) {
                      d111++
                    }
                  }
                });
              });
              DR2.forEach((ed2: any) => {
                ed2.user_order_items.forEach((e2: any) => {
                  if (type == "coupons") {
                    if (e2.item_type == 5) {
                      d222++
                    }
                  }
                });
              });
              returnData.push({
                cp_date_time: startDate1,
                cp: d111,
                pp_date_time: startDate2,
                pp: d222,
              });
            }
            returnData.reverse();
            break;
          case "day":
            var now1 = new Date(range.end_date);
            var daysOfYear1: any = [];
            for (var d = new Date(range.start_date); d <= now1; d.setDate(d.getDate() + 1)) {
              daysOfYear1.push({
                start_date: moment(d).format('YYYY-MM-DD')
              })
            }
            var now2 = new Date(compared_range.end_date);
            var daysOfYear2: any = [];
            for (var d = new Date(compared_range.start_date); d <= now2; d.setDate(d.getDate() + 1)) {
              daysOfYear2.push({
                start_date: moment(d).format('YYYY-MM-DD')
              })
            }
            for (let index = 0; index < Math.max(daysOfYear1.length, daysOfYear2.length); index++) {
              let startDate1 = daysOfYear1[index].start_date || ''
              let startDate2 = daysOfYear2[index].start_date || ''
              let DR1 = currentYearData.filter((s: any) => s.created_datetime == startDate1);
              let DR2 = currentYearData.filter((s: any) => s.created_datetime == startDate2);
              let d111 = 0, d222 = 0;
              DR1.forEach((ed1: any) => {
                ed1.user_order_items.forEach((e2: any) => {
                  if (type == "coupons") {
                    if (e2.item_type == 5) {
                      d111++
                    }
                  }
                });
              });
              DR2.forEach((ed2: any) => {
                ed2.user_order_items.forEach((e2: any) => {
                  if (type == "coupons") {
                    if (e2.item_type == 5) {
                      d222++
                    }
                  }
                });
              });
              returnData.push({
                cp_date_time: daysOfYear1[index].start_date || '',
                cp: d111,
                pp_date_time: daysOfYear2[index].start_date || '',
                pp: d222,
              });
            }
            break;
          case "hour":
            function diff_hours(dt2: Date, dt1: Date) {
              var diff = (dt2.getTime() - dt1.getTime()) / 1000;
              diff /= (60 * 60);
              return Math.abs(Math.round(diff));
            }
            let DR1 = diff_hours(new Date(range.start_date), new Date(range.end_date + " 23:59:59"))

            let a = (
              (moment(range.end_date)).set({ hour: 23, minute: 59, second: 59 })).diff(moment(range.start_date).set({ hour: 0o0, minute: 0o0, second: 0o0 }), 'hours')
            let DR2 = diff_hours(new Date(compared_range.start_date), new Date(compared_range.end_date + " 23:59:59"))
            let b = (
              (moment(compared_range.end_date)).set({ hour: 24, minute: 0, second: 0 })).diff(moment(compared_range.start_date).set({ hour: 0o0, minute: 0o0, second: 0o0 }), 'hours')
            for (let index = 0; index < Math.max(a, b); index++) {
              let _DR1 = moment(range.start_date).add(index, 'hours');
              let _DR2 = moment(compared_range.start_date).add(index, 'hours');
              let _RD1 = '-';
              if (moment(_DR1).format('YYYY-MM-DD HH:mm') <= moment(range.end_date + " 23:59:59").format('YYYY-MM-DD HH:mm')) {
                _RD1 = moment(_DR1).format('YYYY-MM-DD HH:mm')
              }
              let _RD2 = '-';
              if (moment(_DR2).format('YYYY-MM-DD HH:mm') <= moment(compared_range.end_date + "23:59:59").format('YYYY-MM-DD HH:mm')) {
                _RD2 = moment(_DR2).format('YYYY-MM-DD HH:mm')
              }
              let d11 = currentYearData.filter((s: any) => moment(s.created_datetime).format('YYYY-MM-DD HH:mm') >= _RD1 && moment(s.created_datetime).format('YYYY-MM-DD HH:mm') < moment(_RD1).add(1, 'hours').format('YYYY-MM-DD HH:mm'))
              let d22 = currentYearData.filter((s: any) => moment(s.created_datetime).format('YYYY-MM-DD HH:mm') >= _RD2 && moment(s.created_datetime).format('YYYY-MM-DD HH:mm') < moment(_RD2).add(1, 'hours').format('YYYY-MM-DD HH:mm'))
              let d111 = 0, d222 = 0
              d11.forEach((ed1: any) => {
                ed1.user_order_items.forEach((e2: any) => {
                  if (type == "coupons") {
                    if (e2.item_type == 5) {
                      d111++
                    }
                  }
                });
              });
              d22.forEach((ed2: any) => {
                ed2.user_order_items.forEach((e2: any) => {
                  if (type == "coupons") {
                    if (e2.item_type == 5) {
                      d222++
                    }
                  }
                });
              });
              returnData.push({
                cp_date_time: _RD1,
                cp: d111,
                pp_date_time: _RD2,
                pp: d222,
              })
            }
            break;
        }
        new SuccessResponse("Success", {
          graph: returnData
        }).send(res);
      } else {
        throw new Error("no data found")
      }
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
  public async canceledSubscriptionGraph(req: Request, res: Response) {
    try {
      let { range, compared_range, by } = req.body

      let attributes: any = [[dbReader.sequelize.literal('updated_datetime'), 'updated_datetime']]

      switch (by) {
        case 'day':
          attributes = [[dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('updated_datetime'), '%Y-%m-%d'), 'updated_datetime']]

          break;
        case 'week':
          attributes = [[dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('updated_datetime'), '%Y-%m-%d'), 'updated_datetime']]

          break;
        case 'month':
          attributes = [[dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('updated_datetime'), '%Y-%m'), 'updated_datetime']]

          break;
        case 'quarter':
          attributes = [[dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('updated_datetime'), '%Y-%m'), 'updated_datetime']]

          break;
      }
      let currentYearData = await dbReader.userSubscription.findAll({
        attributes: attributes,
        where: dbReader.sequelize.and(
          { subscription_status: 5 },
          dbReader.Sequelize.or(
            dbReader.Sequelize.and(
              dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`updated_datetime`'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.gte]: range.start_date }),
              dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`updated_datetime`'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.lte]: range.end_date })
            ),
            dbReader.Sequelize.and(
              dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`updated_datetime`'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.gte]: compared_range.start_date }),
              dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`updated_datetime`'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.lte]: compared_range.end_date })
            ),
          )
        ),
      })
      currentYearData = JSON.parse(JSON.stringify(currentYearData))

      if (currentYearData) {
        let returnData: any = [];
        switch (by) {
          case "quarter":
            let by_quarterly_date1: any = moment(range.start_date, 'DD-MM-YYYY').format('MM');
            // let by_quarterly_date1 = moment(range.start_date, 'DD-MM-YYYY');
            let by_quarterly_date2: any = moment(range.end_date).format('MM');
            // let by_quarterly_date2 = moment(range.end_date, 'DD-MM-YYYY');
            // let by_quarterly_monthDiff1 = by_quarterly_date2.diff(by_quarterly_date1, 'month');
            let by_quarterly_monthDiff1 = by_quarterly_date2 - by_quarterly_date1
            for (let index = 0; index < by_quarterly_monthDiff1; index++) {
              let d1 = moment(range.start_date).add(index, 'M').format('YYYY-MM');
              let d2 = moment(compared_range.start_date).add(index, 'M').format('YYYY-MM');
              let d11 = currentYearData.filter((s: any) => s.updated_datetime == d1)
              let d22 = currentYearData.filter((s: any) => s.updated_datetime == d2)
              let d111 = 0, d222 = 0
              d11.forEach((ed1: any) => {
                d111++
              });
              d22.forEach((ed2: any) => {
                d222++
              });
              if ([0, 1, 2].includes(index)) {
                let td = moment(range.start_date).add(0, 'M').format('YYYY-MM');
                let td2 = moment(compared_range.start_date).add(0, 'M').format('YYYY-MM');
                if (returnData.some((e: any) => e.cp_date_time == td)) {
                  let _tdi = returnData.findIndex((e: any) => e.cp_date_time == td)
                  returnData[_tdi].cp = returnData[_tdi].cp + d111
                  returnData[_tdi].pp = returnData[_tdi].pp + d222
                } else {
                  returnData.push({
                    cp_date_time: td,
                    cp: d111,
                    pp_date_time: td2,
                    pp: d222,
                  })
                }
              } else if ([3, 4, 5].includes(index)) {
                let td = moment(range.start_date).add(3, 'M').format('YYYY-MM');
                let td2 = moment(compared_range.start_date).add(3, 'M').format('YYYY-MM');
                if (returnData.some((e: any) => e.cp_date_time == td)) {
                  let _tdi = returnData.findIndex((e: any) => e.cp_date_time == td)
                  returnData[_tdi].cp = returnData[_tdi].cp + d111
                  returnData[_tdi].pp = returnData[_tdi].pp + d222
                } else {
                  returnData.push({
                    cp_date_time: td,
                    cp: d111,
                    pp_date_time: td2,
                    pp: d222,
                  })
                }
              } else if ([6, 7, 8].includes(index)) {
                let td = moment(range.start_date).add(6, 'M').format('YYYY-MM');
                let td2 = moment(compared_range.start_date).add(6, 'M').format('YYYY-MM');
                if (returnData.some((e: any) => e.cp_date_time == td)) {
                  let _tdi = returnData.findIndex((e: any) => e.cp_date_time == td)
                  returnData[_tdi].cp = returnData[_tdi].cp + d111
                  returnData[_tdi].pp = returnData[_tdi].pp + d222
                } else {
                  returnData.push({
                    cp_date_time: td,
                    cp: d111,
                    pp_date_time: td2,
                    pp: d222,
                  })
                }
              } else if ([9, 10, 11].includes(index)) {
                let td = moment(range.start_date).add(9, 'M').format('YYYY-MM');
                let td2 = moment(compared_range.start_date).add(9, 'M').format('YYYY-MM');
                if (returnData.some((e: any) => e.cp_date_time == td)) {
                  let _tdi = returnData.findIndex((e: any) => e.cp_date_time == td)
                  returnData[_tdi].cp = returnData[_tdi].cp + d111
                  returnData[_tdi].pp = returnData[_tdi].pp + d222
                } else {
                  returnData.push({
                    cp_date_time: td,
                    cp: d111,
                    pp_date_time: td2,
                    pp: d222,
                  })
                }
              }
            }
            break;
          case "month":
            var now1 = new Date(range.end_date);
            var now11 = new Date(range.start_date)
            var daysOfYear1: any = [];
            for (var d = now11; d <= now1; d.setDate(d.getDate() + 1)) {
              let month = moment(d).format('MM');
              if (daysOfYear1.some((s: any) => s.month == month)) {
                let fi = daysOfYear1.findIndex((s: any) => s.month == month)
                daysOfYear1[fi].end_date = moment(d).format('YYYY-MM-DD')
              } else {
                daysOfYear1.push({
                  month: month,
                  start_date: moment(d).format('YYYY-MM-DD'),
                  end_date: moment(d).format('YYYY-MM-DD')
                })
              }
            }
            var now2 = new Date(compared_range.end_date);
            var now22 = new Date(compared_range.start_date)
            var daysOfYear2: any = [];
            for (var d = now22; d <= now2; d.setDate(d.getDate() + 1)) {
              let month = moment(d).format('MM');
              if (daysOfYear2.some((s: any) => s.month == month)) {
                let fi = daysOfYear2.findIndex((s: any) => s.month == month)
                daysOfYear2[fi].end_date = moment(d).format('YYYY-MM-DD')
              } else {
                daysOfYear2.push({
                  month: month,
                  start_date: moment(d).format('YYYY-MM-DD'),
                  end_date: moment(d).format('YYYY-MM-DD')
                })
              }
            }
            daysOfYear1.reverse();
            daysOfYear2.reverse();
            for (let index = 0; index < Math.min(daysOfYear1.length, daysOfYear2.length); index++) {
              let startDate1 = daysOfYear1[index] ? daysOfYear1[index].start_date : '';
              let lastDate1 = daysOfYear1[index] ? daysOfYear1[index].end_date : '';
              let startDate2 = daysOfYear2[index] ? daysOfYear2[index].start_date : '';
              let lastDate2 = daysOfYear2[index] ? daysOfYear2[index].end_date : '';
              let d1 = moment(startDate1).format('YYYY-MM');
              let d2 = moment(startDate2).format('YYYY-MM');
              let d11 = currentYearData.filter((s: any) => s.updated_datetime == d1)
              let d22 = currentYearData.filter((s: any) => s.updated_datetime == d2)
              let d111 = 0, d222 = 0
              d11.forEach((ed1: any) => {
                d111++
              });
              d22.forEach((ed2: any) => {
                d222++
              });
              returnData.push({
                cp_date_time: startDate1,
                cp: d111,
                pp_date_time: startDate2,
                pp: d222,
              })
            }
            returnData.reverse();
            break;
          case "week":
            moment.updateLocale('in', {
              week: {
                dow: 1 // Monday is the first day of the week
              }
            });
            var now1 = new Date(range.end_date);
            var daysOfYear1: any = [];
            for (var d = new Date(range.start_date); d <= now1; d.setDate(d.getDate() + 1)) {
              let week = moment(d).week();
              if (daysOfYear1.some((s: any) => s.week == week)) {
                let fi = daysOfYear1.findIndex((s: any) => s.week == week)
                daysOfYear1[fi].end_date = moment(d).format('YYYY-MM-DD')
              } else {
                daysOfYear1.push({
                  week: week,
                  start_date: moment(d).format('YYYY-MM-DD'),
                  end_date: moment(d).format('YYYY-MM-DD')
                })
              }
            }
            var now2 = new Date(compared_range.end_date);
            var daysOfYear2: any = [];
            for (var d = new Date(compared_range.start_date); d <= now2; d.setDate(d.getDate() + 1)) {
              let week = moment(d).week();
              if (daysOfYear2.some((s: any) => s.week == week)) {
                let fi = daysOfYear2.findIndex((s: any) => s.week == week)
                daysOfYear2[fi].end_date = moment(d).format('YYYY-MM-DD')
              } else {
                daysOfYear2.push({
                  week: week,
                  start_date: moment(d).format('YYYY-MM-DD'),
                  end_date: moment(d).format('YYYY-MM-DD')
                })
              }
            }
            daysOfYear1.reverse();
            daysOfYear2.reverse();
            for (let index = 0; index < Math.min(daysOfYear1.length, daysOfYear2.length); index++) {
              let startDate1 = daysOfYear1[index] ? daysOfYear1[index].start_date : '';
              let lastDate1 = daysOfYear1[index] ? daysOfYear1[index].end_date : '';
              let startDate2 = daysOfYear2[index] ? daysOfYear2[index].start_date : '';
              let lastDate2 = daysOfYear2[index] ? daysOfYear2[index].end_date : '';
              let DR1 = currentYearData.filter((s: any) => s.updated_datetime >= startDate1 && s.updated_datetime <= lastDate1);
              let DR2 = currentYearData.filter((s: any) => s.updated_datetime >= startDate2 && s.updated_datetime <= lastDate2);
              let d111 = 0, d222 = 0;
              DR1.forEach((ed1: any) => {
                d111++
              });
              DR2.forEach((ed2: any) => {
                d222++
              });
              returnData.push({
                cp_date_time: startDate1,
                cp: d111,
                pp_date_time: startDate2,
                pp: d222,
              });
            }
            returnData.reverse();
            break;
          case "day":
            var now1 = new Date(range.end_date);
            var daysOfYear1: any = [];
            for (var d = new Date(range.start_date); d <= now1; d.setDate(d.getDate() + 1)) {
              daysOfYear1.push({
                start_date: moment(d).format('YYYY-MM-DD')
              })
            }
            var now2 = new Date(compared_range.end_date);
            var daysOfYear2: any = [];
            for (var d = new Date(compared_range.start_date); d <= now2; d.setDate(d.getDate() + 1)) {
              daysOfYear2.push({
                start_date: moment(d).format('YYYY-MM-DD')
              })
            }
            for (let index = 0; index < Math.min(daysOfYear1.length, daysOfYear2.length); index++) {
              let startDate1 = daysOfYear1[index].start_date || ''
              let startDate2 = daysOfYear2[index].start_date || ''
              let DR1 = currentYearData.filter((s: any) => s.updated_datetime == startDate1);
              let DR2 = currentYearData.filter((s: any) => s.updated_datetime == startDate2);
              let d111 = 0, d222 = 0;
              DR1.forEach((ed1: any) => {
                d111++
              });
              DR2.forEach((ed2: any) => {
                d222++
              });
              returnData.push({
                cp_date_time: daysOfYear1[index].start_date || '',
                cp: d111,
                pp_date_time: daysOfYear2[index].start_date || '',
                pp: d222,
              });
            }
            break;
          case "hour":
            function diff_hours(dt2: Date, dt1: Date) {
              var diff = (dt2.getTime() - dt1.getTime()) / 1000;
              diff /= (60 * 60);
              return Math.abs(Math.round(diff));
            }
            let DR1 = diff_hours(new Date(range.start_date), new Date(range.end_date + " 23:59:59"))
            let a = (
              (moment(range.end_date)).set({ hour: 23, minute: 59, second: 59 })).diff(moment(range.start_date).set({ hour: 0o0, minute: 0o0, second: 0o0 }), 'hours')
            let DR2 = diff_hours(new Date(compared_range.start_date), new Date(compared_range.end_date + " 23:59:59"))
            let b = (
              (moment(compared_range.end_date)).set({ hour: 24, minute: 0, second: 0 })).diff(moment(compared_range.start_date).set({ hour: 0o0, minute: 0o0, second: 0o0 }), 'hours')
            for (let index = 0; index < Math.max(a, b); index++) {
              let _DR1 = moment(range.start_date).add(index, 'hours');
              let _DR2 = moment(compared_range.start_date).add(index, 'hours');
              let _RD1 = '-';
              if (moment(_DR1).format('YYYY-MM-DD HH:mm') <= moment(range.end_date + " 23:59:59").format('YYYY-MM-DD HH:mm')) {
                _RD1 = moment(_DR1).format('YYYY-MM-DD HH:mm')
              }
              let _RD2 = '-';
              if (moment(_DR2).format('YYYY-MM-DD HH:mm') <= moment(compared_range.end_date + "23:59:59").format('YYYY-MM-DD HH:mm')) {
                _RD2 = moment(_DR2).format('YYYY-MM-DD HH:mm')
              }
              let d11 = currentYearData.filter((s: any) => moment(s.updated_datetime).format('YYYY-MM-DD HH:mm') >= _RD1 && moment(s.updated_datetime).format('YYYY-MM-DD HH:mm') < moment(_RD1).add(1, 'hours').format('YYYY-MM-DD HH:mm'))
              let d22 = currentYearData.filter((s: any) => moment(s.updated_datetime).format('YYYY-MM-DD HH:mm') >= _RD2 && moment(s.updated_datetime).format('YYYY-MM-DD HH:mm') < moment(_RD2).add(1, 'hours').format('YYYY-MM-DD HH:mm'))
              let d111 = 0, d222 = 0
              d11.forEach((ed1: any) => {
                d111++
              });
              d22.forEach((ed2: any) => {
                d222++
              });
              returnData.push({
                cp_date_time: _RD1,
                cp: d111,
                pp_date_time: _RD2,
                pp: d222,
              })
            }
            break;
        }
        new SuccessResponse("Success", {
          graph: returnData
        }).send(res);
      } else {
        throw new Error("no data found")
      }
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
  public async renewGraph(req: Request, res: Response) {
    try {
      let { range, compared_range, by } = req.body
      let currentYearData = await dbReader.userOrder.findAll({
        attributes: [[dbReader.Sequelize.fn("max", dbReader.Sequelize.literal('user_orders_id')), 'max_count'], 'user_subscription_id',
        [dbReader.Sequelize.fn('DATE_FORMAT', dbReader.Sequelize.fn("SUBSTRING_INDEX", dbReader.Sequelize.fn("GROUP_CONCAT", dbReader.Sequelize.literal('created_datetime order by 1 DESC')), ',', 1), '%Y-%m-%d'), 'created_datetime']],
        where: { order_status: { [Op.notIn]: [1, 7] } },
        group: ['user_subscription_id'],
        having: dbReader.Sequelize.and(dbReader.Sequelize.where(dbReader.Sequelize.fn('count', dbReader.Sequelize.col('user_subscription_id')), {
          [Op.gt]: 1,
        }), dbReader.Sequelize.or(dbReader.Sequelize.and(dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.Sequelize.fn("SUBSTRING_INDEX", dbReader.Sequelize.fn("GROUP_CONCAT", dbReader.Sequelize.literal('created_datetime order by 1 DESC')), ',', 1), '%Y-%m-%d'), { [Op.gte]: range.start_date }),
          dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.Sequelize.fn("SUBSTRING_INDEX", dbReader.Sequelize.fn("GROUP_CONCAT", dbReader.Sequelize.literal('created_datetime order by 1 DESC')), ',', 1), '%Y-%m-%d'), { [Op.gte]: range.end_date })
        ), dbReader.Sequelize.and(dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.Sequelize.fn("SUBSTRING_INDEX", dbReader.Sequelize.fn("GROUP_CONCAT", dbReader.Sequelize.literal('created_datetime order by 1 DESC')), ',', 1), '%Y-%m-%d'), { [Op.gte]: compared_range.start_date }),
          dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.Sequelize.fn("SUBSTRING_INDEX", dbReader.Sequelize.fn("GROUP_CONCAT", dbReader.Sequelize.literal('created_datetime order by 1 DESC')), ',', 1), '%Y-%m-%d'), { [Op.gte]: compared_range.start_date })
        ))),
        order: [['user_orders_id', 'DESC']],
      })
      currentYearData = JSON.parse(JSON.stringify(currentYearData))
      if (currentYearData) {
        let returnData: any = [];
        switch (by) {
          case "quarter":
            let by_quarterly_date1: any = moment(range.start_date, 'DD-MM-YYYY').format('MM');
            let by_quarterly_date2: any = moment(range.end_date).format('MM');
            let by_quarterly_monthDiff1 = by_quarterly_date2 - by_quarterly_date1
            for (let index = 0; index < by_quarterly_monthDiff1; index++) {
              let d1 = moment(range.start_date).add(index, 'M').format('YYYY-MM');
              let d2 = moment(compared_range.start_date).add(index, 'M').format('YYYY-MM');
              let d11 = currentYearData.filter((s: any) => s.created_datetime == d1)
              let d22 = currentYearData.filter((s: any) => s.created_datetime == d2)
              let d111 = 0, d222 = 0
              d11.forEach((ed1: any) => {
                d111++
              });
              d22.forEach((ed2: any) => {
                d222++
              });
              if ([0, 1, 2].includes(index)) {
                let td = moment(range.start_date).add(0, 'M').format('YYYY-MM');
                let td2 = moment(compared_range.start_date).add(0, 'M').format('YYYY-MM');
                if (returnData.some((e: any) => e.cp_date_time == td)) {
                  let _tdi = returnData.findIndex((e: any) => e.cp_date_time == td)
                  returnData[_tdi].cp = returnData[_tdi].cp + d111
                  returnData[_tdi].pp = returnData[_tdi].pp + d222
                } else {
                  returnData.push({
                    cp_date_time: td,
                    cp: d111,
                    pp_date_time: td2,
                    pp: d222,
                  })
                }
              } else if ([3, 4, 5].includes(index)) {
                let td = moment(range.start_date).add(3, 'M').format('YYYY-MM');
                let td2 = moment(compared_range.start_date).add(3, 'M').format('YYYY-MM');
                if (returnData.some((e: any) => e.cp_date_time == td)) {
                  let _tdi = returnData.findIndex((e: any) => e.cp_date_time == td)
                  returnData[_tdi].cp = returnData[_tdi].cp + d111
                  returnData[_tdi].pp = returnData[_tdi].pp + d222
                } else {
                  returnData.push({
                    cp_date_time: td,
                    cp: d111,
                    pp_date_time: td2,
                    pp: d222,
                  })
                }
              } else if ([6, 7, 8].includes(index)) {
                let td = moment(range.start_date).add(6, 'M').format('YYYY-MM');
                let td2 = moment(compared_range.start_date).add(6, 'M').format('YYYY-MM');
                if (returnData.some((e: any) => e.cp_date_time == td)) {
                  let _tdi = returnData.findIndex((e: any) => e.cp_date_time == td)
                  returnData[_tdi].cp = returnData[_tdi].cp + d111
                  returnData[_tdi].pp = returnData[_tdi].pp + d222
                } else {
                  returnData.push({
                    cp_date_time: td,
                    cp: d111,
                    pp_date_time: td2,
                    pp: d222,
                  })
                }
              } else if ([9, 10, 11].includes(index)) {
                let td = moment(range.start_date).add(9, 'M').format('YYYY-MM');
                let td2 = moment(compared_range.start_date).add(9, 'M').format('YYYY-MM');
                if (returnData.some((e: any) => e.cp_date_time == td)) {
                  let _tdi = returnData.findIndex((e: any) => e.cp_date_time == td)
                  returnData[_tdi].cp = returnData[_tdi].cp + d111
                  returnData[_tdi].pp = returnData[_tdi].pp + d222
                } else {
                  returnData.push({
                    cp_date_time: td,
                    cp: d111,
                    pp_date_time: td2,
                    pp: d222,
                  })
                }
              }
            }
            break;
          case "month":
            var now1 = new Date(range.end_date);
            var now11 = new Date(range.start_date)
            var daysOfYear1: any = [];
            for (var d = now11; d <= now1; d.setDate(d.getDate() + 1)) {
              let month = moment(d).format('MM');
              if (daysOfYear1.some((s: any) => s.month == month)) {
                let fi = daysOfYear1.findIndex((s: any) => s.month == month)
                daysOfYear1[fi].end_date = moment(d).format('YYYY-MM-DD')
              } else {
                daysOfYear1.push({
                  month: month,
                  start_date: moment(d).format('YYYY-MM-DD'),
                  end_date: moment(d).format('YYYY-MM-DD')
                })
              }
            }
            var now2 = new Date(compared_range.end_date);
            var now22 = new Date(compared_range.start_date)
            var daysOfYear2: any = [];
            for (var d = now22; d <= now2; d.setDate(d.getDate() + 1)) {
              let month = moment(d).format('MM');
              if (daysOfYear2.some((s: any) => s.month == month)) {
                let fi = daysOfYear2.findIndex((s: any) => s.month == month)
                daysOfYear2[fi].end_date = moment(d).format('YYYY-MM-DD')
              } else {
                daysOfYear2.push({
                  month: month,
                  start_date: moment(d).format('YYYY-MM-DD'),
                  end_date: moment(d).format('YYYY-MM-DD')
                })
              }
            }
            daysOfYear1.reverse();
            daysOfYear2.reverse();
            for (let index = 0; index < Math.min(daysOfYear1.length, daysOfYear2.length); index++) {
              let startDate1 = daysOfYear1[index] ? daysOfYear1[index].start_date : '';
              let lastDate1 = daysOfYear1[index] ? daysOfYear1[index].end_date : '';
              let startDate2 = daysOfYear2[index] ? daysOfYear2[index].start_date : '';
              let lastDate2 = daysOfYear2[index] ? daysOfYear2[index].end_date : '';
              let d1 = moment(startDate1).format('YYYY-MM');
              let d2 = moment(startDate2).format('YYYY-MM');
              let d11 = currentYearData.filter((s: any) => s.created_datetime == d1)
              let d22 = currentYearData.filter((s: any) => s.created_datetime == d2)
              let d111 = 0, d222 = 0
              d11.forEach((ed1: any) => {
                d111++
              });
              d22.forEach((ed2: any) => {
                d222++
              });
              returnData.push({
                cp_date_time: startDate1,
                cp: d111,
                pp_date_time: startDate2,
                pp: d222,
              })
            }
            returnData.reverse();
            break;
          case "week":
            moment.updateLocale('in', {
              week: {
                dow: 1 // Monday is the first day of the week
              }
            });
            var now1 = new Date(range.end_date);
            var daysOfYear1: any = [];
            for (var d = new Date(range.start_date); d <= now1; d.setDate(d.getDate() + 1)) {
              let week = moment(d).week();
              if (daysOfYear1.some((s: any) => s.week == week)) {
                let fi = daysOfYear1.findIndex((s: any) => s.week == week)
                daysOfYear1[fi].end_date = moment(d).format('YYYY-MM-DD')
              } else {
                daysOfYear1.push({
                  week: week,
                  start_date: moment(d).format('YYYY-MM-DD'),
                  end_date: moment(d).format('YYYY-MM-DD')
                })
              }
            }
            var now2 = new Date(compared_range.end_date);
            var daysOfYear2: any = [];
            for (var d = new Date(compared_range.start_date); d <= now2; d.setDate(d.getDate() + 1)) {
              let week = moment(d).week();
              if (daysOfYear2.some((s: any) => s.week == week)) {
                let fi = daysOfYear2.findIndex((s: any) => s.week == week)
                daysOfYear2[fi].end_date = moment(d).format('YYYY-MM-DD')
              } else {
                daysOfYear2.push({
                  week: week,
                  start_date: moment(d).format('YYYY-MM-DD'),
                  end_date: moment(d).format('YYYY-MM-DD')
                })
              }
            }
            daysOfYear1.reverse();
            daysOfYear2.reverse();
            for (let index = 0; index < Math.min(daysOfYear1.length, daysOfYear2.length); index++) {
              let startDate1 = daysOfYear1[index] ? daysOfYear1[index].start_date : '';
              let lastDate1 = daysOfYear1[index] ? daysOfYear1[index].end_date : '';
              let startDate2 = daysOfYear2[index] ? daysOfYear2[index].start_date : '';
              let lastDate2 = daysOfYear2[index] ? daysOfYear2[index].end_date : '';
              let DR1 = currentYearData.filter((s: any) => s.created_datetime >= startDate1 && s.created_datetime <= lastDate1);
              let DR2 = currentYearData.filter((s: any) => s.created_datetime >= startDate2 && s.created_datetime <= lastDate2);
              let d111 = 0, d222 = 0;
              DR1.forEach((ed1: any) => {
                d111++
              });
              DR2.forEach((ed2: any) => {
                d222++
              });
              returnData.push({
                cp_date_time: startDate1,
                cp: d111,
                pp_date_time: startDate2,
                pp: d222,
              });
            }
            returnData.reverse();
            break;
          case "day":
            var now1 = new Date(range.end_date);
            var daysOfYear1: any = [];
            for (var d = new Date(range.start_date); d <= now1; d.setDate(d.getDate() + 1)) {
              daysOfYear1.push({
                start_date: moment(d).format('YYYY-MM-DD')
              })
            }
            var now2 = new Date(compared_range.end_date);
            var daysOfYear2: any = [];
            for (var d = new Date(compared_range.start_date); d <= now2; d.setDate(d.getDate() + 1)) {
              daysOfYear2.push({
                start_date: moment(d).format('YYYY-MM-DD')
              })
            }
            for (let index = 0; index < Math.max(daysOfYear1.length, daysOfYear2.length); index++) {
              let startDate1 = daysOfYear1[index].start_date || ''
              let startDate2 = daysOfYear2[index].start_date || ''
              let DR1 = currentYearData.filter((s: any) => s.created_datetime == startDate1);
              let DR2 = currentYearData.filter((s: any) => s.created_datetime == startDate2);
              let d111 = 0, d222 = 0;
              DR1.forEach((ed1: any) => {
                d111++
              });
              DR2.forEach((ed2: any) => {
                d222++
              });
              returnData.push({
                cp_date_time: daysOfYear1[index].start_date || '',
                cp: d111,
                pp_date_time: daysOfYear2[index].start_date || '',
                pp: d222,
              });
            }
            break;
          case "hour":
            function diff_hours(dt2: Date, dt1: Date) {
              var diff = (dt2.getTime() - dt1.getTime()) / 1000;
              diff /= (60 * 60);
              return Math.abs(Math.round(diff));
            }
            let DR1 = diff_hours(new Date(range.start_date), new Date(range.end_date + " 23:59:59"))
            let a = (
              (moment(range.end_date)).set({ hour: 23, minute: 59, second: 59 })).diff(moment(range.start_date).set({ hour: 0o0, minute: 0o0, second: 0o0 }), 'hours')

            let DR2 = diff_hours(new Date(compared_range.start_date), new Date(compared_range.end_date + " 23:59:59"))
            let b = (
              (moment(compared_range.end_date)).set({ hour: 24, minute: 0, second: 0 })).diff(moment(compared_range.start_date).set({ hour: 0o0, minute: 0o0, second: 0o0 }), 'hours')
            for (let index = 0; index < Math.max(a, b); index++) {
              let _DR1 = moment(range.start_date).add(index, 'hours');
              let _DR2 = moment(compared_range.start_date).add(index, 'hours');
              let _RD1 = '-';
              if (moment(_DR1).format('YYYY-MM-DD HH:mm') <= moment(range.end_date + " 23:59:59").format('YYYY-MM-DD HH:mm')) {
                _RD1 = moment(_DR1).format('YYYY-MM-DD HH:mm')
              }
              let _RD2 = '-';
              if (moment(_DR2).format('YYYY-MM-DD HH:mm') <= moment(compared_range.end_date + "23:59:59").format('YYYY-MM-DD HH:mm')) {
                _RD2 = moment(_DR2).format('YYYY-MM-DD HH:mm')
              }
              let d11 = currentYearData.filter((s: any) => moment(s.created_datetime).format('YYYY-MM-DD HH:mm') >= _RD1 && moment(s.created_datetime).format('YYYY-MM-DD HH:mm') < moment(_RD1).add(1, 'hours').format('YYYY-MM-DD HH:mm'))
              let d22 = currentYearData.filter((s: any) => moment(s.created_datetime).format('YYYY-MM-DD HH:mm') >= _RD2 && moment(s.created_datetime).format('YYYY-MM-DD HH:mm') < moment(_RD2).add(1, 'hours').format('YYYY-MM-DD HH:mm'))
              let d111 = 0, d222 = 0
              d11.forEach((ed1: any) => {
                d111++
              });
              d22.forEach((ed2: any) => {
                d222++
              });
              returnData.push({
                cp_date_time: _RD1,
                cp: d111,
                pp_date_time: _RD2,
                pp: d222,
              })
            }
            break;
        }
        new SuccessResponse("Success", {
          graph: returnData
        }).send(res);
      } else {
        throw new Error("no data found")
      }
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
  public async netSalesGraph(req: Request, res: Response) {
    try {
      let { range, compared_range, by, type } = req.body;
      let subWhereCon = dbReader.Sequelize.Op.ne,
        subWhereData = null;
      if (type) {
        switch (type) {
          case "net_sales":
            subWhereCon = dbReader.Sequelize.Op.in;
            subWhereData = [1, 2, 3, 5];
            break;
        }
      }
      let attributes: any = [
        [
          dbReader.sequelize.literal("`user_orders`.`created_datetime`"),
          "created_datetime",
        ],
        "user_orders_id",
      ];
      let attributes1: any = ["status", "refund_amount", "created_datetime"];
      switch (by) {
        case "day":
          attributes = [
            [
              dbReader.Sequelize.fn(
                "DATE_FORMAT",
                dbReader.sequelize.literal("`user_orders`.`created_datetime`"),
                "%Y-%m-%d"
              ),
              "created_datetime",
            ],
            "user_orders_id",
          ];
          attributes1 = [
            [
              dbReader.Sequelize.fn(
                "DATE_FORMAT",
                dbReader.sequelize.literal("created_datetime"),
                "%Y-%m-%d"
              ),
              "created_datetime",
            ],
            "status",
            "refund_amount",
          ];
          break;
        case "week":
          attributes = [
            [
              dbReader.Sequelize.fn(
                "DATE_FORMAT",
                dbReader.sequelize.literal("`user_orders`.`created_datetime`"),
                "%Y-%m-%d"
              ),
              "created_datetime",
            ],
            "user_orders_id",
          ];
          attributes1 = [
            [
              dbReader.Sequelize.fn(
                "DATE_FORMAT",
                dbReader.sequelize.literal("created_datetime"),
                "%Y-%m-%d"
              ),
              "created_datetime",
            ],
            "status",
            "refund_amount",
          ];
          break;
        case "month":
          attributes = [
            [
              dbReader.Sequelize.fn(
                "DATE_FORMAT",
                dbReader.sequelize.literal("`user_orders`.`created_datetime`"),
                "%Y-%m"
              ),
              "created_datetime",
            ],
            "user_orders_id",
          ];
          attributes1 = [
            [
              dbReader.Sequelize.fn(
                "DATE_FORMAT",
                dbReader.sequelize.literal("created_datetime"),
                "%Y-%m"
              ),
              "created_datetime",
            ],
            "status",
            "refund_amount",
          ];
          break;
        case "quarter":
          attributes = [
            [
              dbReader.Sequelize.fn(
                "DATE_FORMAT",
                dbReader.sequelize.literal("`user_orders`.`created_datetime`"),
                "%Y-%m"
              ),
              "created_datetime",
            ],
            "user_orders_id",
          ];
          attributes1 = [
            [
              dbReader.Sequelize.fn(
                "DATE_FORMAT",
                dbReader.sequelize.literal("created_datetime"),
                "%Y-%m"
              ),
              "created_datetime",
            ],
            "status",
            "refund_amount",
          ];
          break;
      }
      let currentYearData = await dbReader.userOrder.findAll({
        attributes: attributes,
        where: dbReader.sequelize.and(
          { order_status: [2, 3, 4, 5, 6, 8] },
          dbReader.Sequelize.or(
            dbReader.Sequelize.and(
              dbReader.Sequelize.where(
                dbReader.Sequelize.fn(
                  "DATE_FORMAT",
                  dbReader.sequelize.literal(
                    "`user_orders`.`created_datetime`"
                  ),
                  "%Y-%m-%d"
                ),
                { [dbReader.Sequelize.Op.gte]: range.start_date }
              ),
              dbReader.Sequelize.where(
                dbReader.Sequelize.fn(
                  "DATE_FORMAT",
                  dbReader.sequelize.literal(
                    "`user_orders`.`created_datetime`"
                  ),
                  "%Y-%m-%d"
                ),
                { [dbReader.Sequelize.Op.lte]: range.end_date }
              )
            ),
            dbReader.Sequelize.and(
              dbReader.Sequelize.where(
                dbReader.Sequelize.fn(
                  "DATE_FORMAT",
                  dbReader.sequelize.literal(
                    "`user_orders`.`created_datetime`"
                  ),
                  "%Y-%m-%d"
                ),
                { [dbReader.Sequelize.Op.gte]: compared_range.start_date }
              ),
              dbReader.Sequelize.where(
                dbReader.Sequelize.fn(
                  "DATE_FORMAT",
                  dbReader.sequelize.literal(
                    "`user_orders`.`created_datetime`"
                  ),
                  "%Y-%m-%d"
                ),
                { [dbReader.Sequelize.Op.lte]: compared_range.end_date }
              )
            )
          )
        ),
        include: [
          {
            separate: true,
            model: dbReader.userOrderItems,
            where: { item_type: { [subWhereCon]: subWhereData } },
            attributes: [
              "item_type",
              "product_amount",
              "user_orders_id",
              "created_datetime",
            ],
          },
          {
            model: dbReader.transactionMaster,
            where: { status: "Success" },
            attributes: [],
          },
        ],
      });
      currentYearData = JSON.parse(JSON.stringify(currentYearData));
      let currentYearRefundData = await dbReader.refunds.findAll({
        attributes: attributes1,
        where: dbReader.sequelize.and(
          dbReader.Sequelize.or(
            dbReader.Sequelize.and(
              dbReader.Sequelize.where(
                dbReader.Sequelize.fn(
                  "DATE_FORMAT",
                  dbReader.sequelize.literal("`created_datetime`"),
                  "%Y-%m-%d"
                ),
                { [dbReader.Sequelize.Op.gte]: range.start_date }
              ),
              dbReader.Sequelize.where(
                dbReader.Sequelize.fn(
                  "DATE_FORMAT",
                  dbReader.sequelize.literal("`created_datetime`"),
                  "%Y-%m-%d"
                ),
                { [dbReader.Sequelize.Op.lte]: range.end_date }
              )
            ),
            dbReader.Sequelize.and(
              dbReader.Sequelize.where(
                dbReader.Sequelize.fn(
                  "DATE_FORMAT",
                  dbReader.sequelize.literal("`created_datetime`"),
                  "%Y-%m-%d"
                ),
                { [dbReader.Sequelize.Op.gte]: compared_range.start_date }
              ),
              dbReader.Sequelize.where(
                dbReader.Sequelize.fn(
                  "DATE_FORMAT",
                  dbReader.sequelize.literal("`created_datetime`"),
                  "%Y-%m-%d"
                ),
                { [dbReader.Sequelize.Op.lte]: compared_range.end_date }
              )
            )
          )
        ),
      });
      currentYearRefundData = JSON.parse(JSON.stringify(currentYearRefundData));
      if (currentYearData || currentYearRefundData) {
        let returnData: any = [];
        switch (by) {
          case "quarter":
            let by_quarterly_date1: any = moment(
              range.start_date,
              "DD-MM-YYYY"
            ).format("MM");
            let by_quarterly_date2: any = moment(range.end_date).format("MM");
            let by_quarterly_monthDiff1 =
              by_quarterly_date2 - by_quarterly_date1;
            for (let index = 0; index < by_quarterly_monthDiff1; index++) {
              let d1 = moment(range.start_date)
                .add(index, "M")
                .format("YYYY-MM");
              let d2 = moment(compared_range.start_date)
                .add(index, "M")
                .format("YYYY-MM");
              let d11 = currentYearData.filter(
                (s: any) => s.created_datetime == d1
              );
              let d22 = currentYearData.filter(
                (s: any) => s.created_datetime == d2
              );
              let d111 = 0,
                d222 = 0;
              d11.forEach((ed1: any) => {
                ed1.user_order_items.forEach((e2: any) => {
                  if (type == "gross_sales" || type == "net_sales") {
                    if (e2.item_type == 1) {
                      d111 += e2.product_amount;
                    }
                  }
                  if (type == "net_sales") {
                    if (e2.item_type == 2) {
                      d111 += e2.product_amount;
                    } else if (e2.item_type == 3) {
                      d111 += e2.product_amount;
                    }
                  }
                  if (type == "coupons" || type == "net_sales") {
                    if (e2.item_type == 5) {
                      if (type == "net_sales") {
                        d111 -= e2.product_amount;
                      } else {
                        d111 += e2.product_amount;
                      }
                    }
                  }
                });
              });
              d22.forEach((ed2: any) => {
                ed2.user_order_items.forEach((e2: any) => {
                  if (type == "gross_sales" || type == "net_sales") {
                    if (e2.item_type == 1) {
                      d222 += e2.product_amount;
                    }
                  }
                  if (type == "net_sales") {
                    if (e2.item_type == 2) {
                      d222 += e2.product_amount;
                    } else if (e2.item_type == 3) {
                      d222 += e2.product_amount;
                    }
                  }
                  if (type == "coupons" || type == "net_sales") {
                    if (e2.item_type == 5) {
                      if (type == "net_sales") {
                        d222 -= e2.product_amount;
                      } else {
                        d222 += e2.product_amount;
                      }
                    }
                  }
                });
              });
              let _d11 = currentYearRefundData.filter(
                (s: any) => s.created_datetime == d1
              );
              let _d22 = currentYearRefundData.filter(
                (s: any) => s.created_datetime == d2
              );
              _d11.forEach((ed1: any) => {
                if (type == "refunds" || type == "net_sales") {
                  if (type == "net_sales") {
                    d111 -= ed1.refund_amount;
                  } else {
                    d111 += ed1.refund_amount;
                  }
                }
              });
              _d22.forEach((ed2: any) => {
                if (type == "refunds" || type == "net_sales") {
                  if (type == "net_sales") {
                    d222 -= ed2.refund_amount;
                  } else {
                    d222 += ed2.refund_amount;
                  }
                }
              });
              if ([0, 1, 2].includes(index)) {
                let td = moment(range.start_date).add(0, "M").format("YYYY-MM");
                let td2 = moment(compared_range.start_date)
                  .add(0, "M")
                  .format("YYYY-MM");
                if (returnData.some((e: any) => e.cp_date_time == td)) {
                  let _tdi = returnData.findIndex(
                    (e: any) => e.cp_date_time == td
                  );
                  returnData[_tdi].cp = returnData[_tdi].cp + d111;
                  returnData[_tdi].pp = returnData[_tdi].pp + d222;
                } else {
                  returnData.push({
                    cp_date_time: td,
                    cp: d111,
                    pp_date_time: td2,
                    pp: d222,
                  });
                }
              } else if ([3, 4, 5].includes(index)) {
                let td = moment(range.start_date).add(3, "M").format("YYYY-MM");
                let td2 = moment(compared_range.start_date)
                  .add(3, "M")
                  .format("YYYY-MM");
                if (returnData.some((e: any) => e.cp_date_time == td)) {
                  let _tdi = returnData.findIndex(
                    (e: any) => e.cp_date_time == td
                  );
                  returnData[_tdi].cp = returnData[_tdi].cp + d111;
                  returnData[_tdi].pp = returnData[_tdi].pp + d222;
                } else {
                  returnData.push({
                    cp_date_time: td,
                    cp: d111,
                    pp_date_time: td2,
                    pp: d222,
                  });
                }
              } else if ([6, 7, 8].includes(index)) {
                let td = moment(range.start_date).add(6, "M").format("YYYY-MM");
                let td2 = moment(compared_range.start_date)
                  .add(6, "M")
                  .format("YYYY-MM");
                if (returnData.some((e: any) => e.cp_date_time == td)) {
                  let _tdi = returnData.findIndex(
                    (e: any) => e.cp_date_time == td
                  );
                  returnData[_tdi].cp = returnData[_tdi].cp + d111;
                  returnData[_tdi].pp = returnData[_tdi].pp + d222;
                } else {
                  returnData.push({
                    cp_date_time: td,
                    cp: d111,
                    pp_date_time: td2,
                    pp: d222,
                  });
                }
              } else if ([9, 10, 11].includes(index)) {
                let td = moment(range.start_date).add(9, "M").format("YYYY-MM");
                let td2 = moment(compared_range.start_date)
                  .add(9, "M")
                  .format("YYYY-MM");
                if (returnData.some((e: any) => e.cp_date_time == td)) {
                  let _tdi = returnData.findIndex(
                    (e: any) => e.cp_date_time == td
                  );
                  returnData[_tdi].cp = returnData[_tdi].cp + d111;
                  returnData[_tdi].pp = returnData[_tdi].pp + d222;
                } else {
                  returnData.push({
                    cp_date_time: td,
                    cp: d111,
                    pp_date_time: td2,
                    pp: d222,
                  });
                }
              }
            }
            break;
          case "month":
            var now1 = new Date(range.end_date);
            var now11 = new Date(range.start_date);
            var daysOfYear1: any = [];
            for (var d = now11; d <= now1; d.setDate(d.getDate() + 1)) {
              let month = moment(d).format("MM");
              if (daysOfYear1.some((s: any) => s.month == month)) {
                let fi = daysOfYear1.findIndex((s: any) => s.month == month);
                daysOfYear1[fi].end_date = moment(d).format("YYYY-MM-DD");
              } else {
                daysOfYear1.push({
                  month: month,
                  start_date: moment(d).format("YYYY-MM-DD"),
                  end_date: moment(d).format("YYYY-MM-DD"),
                });
              }
            }
            var now2 = new Date(compared_range.end_date);
            var now22 = new Date(compared_range.start_date);
            var daysOfYear2: any = [];
            for (var d = now22; d <= now2; d.setDate(d.getDate() + 1)) {
              let month = moment(d).format("MM");
              if (daysOfYear2.some((s: any) => s.month == month)) {
                let fi = daysOfYear2.findIndex((s: any) => s.month == month);
                daysOfYear2[fi].end_date = moment(d).format("YYYY-MM-DD");
              } else {
                daysOfYear2.push({
                  month: month,
                  start_date: moment(d).format("YYYY-MM-DD"),
                  end_date: moment(d).format("YYYY-MM-DD"),
                });
              }
            }
            daysOfYear1.reverse();
            daysOfYear2.reverse();
            for (
              let index = 0;
              index < Math.min(daysOfYear1.length, daysOfYear2.length);
              index++
            ) {
              let startDate1 = daysOfYear1[index]
                ? daysOfYear1[index].start_date
                : "";
              let lastDate1 = daysOfYear1[index]
                ? daysOfYear1[index].end_date
                : "";
              let startDate2 = daysOfYear2[index]
                ? daysOfYear2[index].start_date
                : "";
              let lastDate2 = daysOfYear2[index]
                ? daysOfYear2[index].end_date
                : "";
              let d1 = moment(startDate1).format("YYYY-MM");
              let d2 = moment(startDate2).format("YYYY-MM");
              let d11 = currentYearData.filter(
                (s: any) => s.created_datetime == d1
              );
              let d22 = currentYearData.filter(
                (s: any) => s.created_datetime == d2
              );
              let d111 = 0,
                d222 = 0;
              d11.forEach((ed1: any) => {
                ed1.user_order_items.forEach((e2: any) => {
                  if (type == "gross_sales" || type == "net_sales") {
                    if (e2.item_type == 1) {
                      d111 += e2.product_amount;
                    }
                  }
                  if (type == "net_sales") {
                    if (e2.item_type == 2) {
                      d111 += e2.product_amount;
                    } else if (e2.item_type == 3) {
                      d111 += e2.product_amount;
                    }
                  }
                  if (type == "coupons" || type == "net_sales") {
                    if (e2.item_type == 5) {
                      if (type == "net_sales") {
                        d111 -= e2.product_amount;
                      } else {
                        d111 += e2.product_amount;
                      }
                    }
                  }
                });
              });
              d22.forEach((ed2: any) => {
                ed2.user_order_items.forEach((e2: any) => {
                  if (type == "gross_sales" || type == "net_sales") {
                    if (e2.item_type == 1) {
                      d222 += e2.product_amount;
                    }
                  }
                  if (type == "net_sales") {
                    if (e2.item_type == 2) {
                      d222 += e2.product_amount;
                    } else if (e2.item_type == 3) {
                      d222 += e2.product_amount;
                    }
                  }
                  if (type == "coupons" || type == "net_sales") {
                    if (e2.item_type == 5) {
                      if (type == "net_sales") {
                        d222 -= e2.product_amount;
                      } else {
                        d222 += e2.product_amount;
                      }
                    }
                  }
                });
              });
              let _d11 = currentYearRefundData.filter(
                (s: any) => s.created_datetime == d1
              );
              let _d22 = currentYearRefundData.filter(
                (s: any) => s.created_datetime == d2
              );
              _d11.forEach((ed1: any) => {
                if (type == "refunds" || type == "net_sales") {
                  if (type == "net_sales") {
                    d111 -= ed1.refund_amount;
                  } else {
                    d111 += ed1.refund_amount;
                  }
                }
              });
              _d22.forEach((ed2: any) => {
                if (type == "refunds" || type == "net_sales") {
                  if (type == "net_sales") {
                    d222 -= ed2.refund_amount;
                  } else {
                    d222 += ed2.refund_amount;
                  }
                }
              });
              returnData.push({
                cp_date_time: startDate1,
                cp: d111,
                pp_date_time: startDate2,
                pp: d222,
              });
            }
            returnData.reverse();
            break;
          case "week":
            moment.updateLocale("in", {
              week: {
                dow: 1, // Monday is the first day of the week
              },
            });
            var now1 = new Date(range.end_date);
            var daysOfYear1: any = [];
            for (
              var d = new Date(range.start_date);
              d <= now1;
              d.setDate(d.getDate() + 1)
            ) {
              let week = moment(d).week();
              if (daysOfYear1.some((s: any) => s.week == week)) {
                let fi = daysOfYear1.findIndex((s: any) => s.week == week);
                daysOfYear1[fi].end_date = moment(d).format("YYYY-MM-DD");
              } else {
                daysOfYear1.push({
                  week: week,
                  start_date: moment(d).format("YYYY-MM-DD"),
                  end_date: moment(d).format("YYYY-MM-DD"),
                });
              }
            }
            var now2 = new Date(compared_range.end_date);
            var daysOfYear2: any = [];
            for (
              var d = new Date(compared_range.start_date);
              d <= now2;
              d.setDate(d.getDate() + 1)
            ) {
              let week = moment(d).week();
              if (daysOfYear2.some((s: any) => s.week == week)) {
                let fi = daysOfYear2.findIndex((s: any) => s.week == week);
                daysOfYear2[fi].end_date = moment(d).format("YYYY-MM-DD");
              } else {
                daysOfYear2.push({
                  week: week,
                  start_date: moment(d).format("YYYY-MM-DD"),
                  end_date: moment(d).format("YYYY-MM-DD"),
                });
              }
            }
            daysOfYear1.reverse();
            daysOfYear2.reverse();
            for (
              let index = 0;
              index < Math.min(daysOfYear1.length, daysOfYear2.length);
              index++
            ) {
              let startDate1 = daysOfYear1[index]
                ? daysOfYear1[index].start_date
                : "";
              let lastDate1 = daysOfYear1[index]
                ? daysOfYear1[index].end_date
                : "";
              let startDate2 = daysOfYear2[index]
                ? daysOfYear2[index].start_date
                : "";
              let lastDate2 = daysOfYear2[index]
                ? daysOfYear2[index].end_date
                : "";
              let DR1 = currentYearData.filter(
                (s: any) =>
                  s.created_datetime >= startDate1 &&
                  s.created_datetime <= lastDate1
              );
              let _DR1 = currentYearRefundData.filter(
                (s: any) =>
                  s.created_datetime >= startDate1 &&
                  s.created_datetime <= lastDate1
              );
              let DR2 = currentYearData.filter(
                (s: any) =>
                  s.created_datetime >= startDate2 &&
                  s.created_datetime <= lastDate2
              );
              let _DR2 = currentYearRefundData.filter(
                (s: any) =>
                  s.created_datetime >= startDate2 &&
                  s.created_datetime <= lastDate2
              );
              let d111 = 0,
                d222 = 0;
              DR1.forEach((ed1: any) => {
                ed1.user_order_items.forEach((e2: any) => {
                  if (type == "gross_sales" || type == "net_sales") {
                    if (e2.item_type == 1) {
                      d111 += e2.product_amount;
                    }
                  }
                  if (type == "net_sales") {
                    if (e2.item_type == 2) {
                      d111 += e2.product_amount;
                    } else if (e2.item_type == 3) {
                      d111 += e2.product_amount;
                    }
                  }
                  if (type == "coupons" || type == "net_sales") {
                    if (e2.item_type == 5) {
                      if (type == "net_sales") {
                        d111 -= e2.product_amount;
                      } else {
                        d111 += e2.product_amount;
                      }
                    }
                  }
                });
              });
              DR2.forEach((ed2: any) => {
                ed2.user_order_items.forEach((e2: any) => {
                  if (type == "gross_sales" || type == "net_sales") {
                    if (e2.item_type == 1) {
                      d222 += e2.product_amount;
                    }
                  }
                  if (type == "net_sales") {
                    if (e2.item_type == 2) {
                      d222 += e2.product_amount;
                    } else if (e2.item_type == 3) {
                      d222 += e2.product_amount;
                    }
                  }
                  if (type == "coupons" || type == "net_sales") {
                    if (e2.item_type == 5) {
                      if (type == "net_sales") {
                        d222 -= e2.product_amount;
                      } else {
                        d222 += e2.product_amount;
                      }
                    }
                  }
                });
              });
              _DR1.forEach((ed1: any) => {
                if (type == "refunds" || type == "net_sales") {
                  if (type == "net_sales") {
                    d111 -= ed1.refund_amount;
                  } else {
                    d111 += ed1.refund_amount;
                  }
                }
              });
              _DR2.forEach((ed2: any) => {
                if (type == "refunds" || type == "net_sales") {
                  if (type == "net_sales") {
                    d222 -= ed2.refund_amount;
                  } else {
                    d222 += ed2.refund_amount;
                  }
                }
              });
              returnData.push({
                cp_date_time: startDate1,
                cp: d111,
                pp_date_time: startDate2,
                pp: d222,
              });
            }
            returnData.reverse();
            break;
          case "day":
            var now1 = new Date(range.end_date);
            var daysOfYear1: any = [];
            for (
              var d = new Date(range.start_date);
              d <= now1;
              d.setDate(d.getDate() + 1)
            ) {
              daysOfYear1.push({
                start_date: moment(d).format("YYYY-MM-DD"),
              });
            }
            var now2 = new Date(compared_range.end_date);
            var daysOfYear2: any = [];
            for (
              var d = new Date(compared_range.start_date);
              d <= now2;
              d.setDate(d.getDate() + 1)
            ) {
              daysOfYear2.push({
                start_date: moment(d).format("YYYY-MM-DD"),
              });
            }
            for (
              let index = 0;
              index < Math.max(daysOfYear1.length, daysOfYear2.length);
              index++
            ) {
              let startDate1 = daysOfYear1[index].start_date || "";
              let startDate2 = daysOfYear2[index].start_date || "";
              let DR1 = currentYearData.filter(
                (s: any) => s.created_datetime == startDate1
              );
              let _DR1 = currentYearRefundData.filter(
                (s: any) => s.created_datetime == startDate1
              );
              let DR2 = currentYearData.filter(
                (s: any) => s.created_datetime == startDate2
              );
              let _DR2 = currentYearRefundData.filter(
                (s: any) => s.created_datetime == startDate2
              );
              let d111 = 0,
                d222 = 0;
              DR1.forEach((ed1: any) => {
                ed1.user_order_items.forEach((e2: any) => {
                  if (type == "gross_sales" || type == "net_sales") {
                    if (e2.item_type == 1) {
                      d111 += e2.product_amount;
                    }
                  }
                  if (type == "net_sales") {
                    if (e2.item_type == 2) {
                      d111 += e2.product_amount;
                    } else if (e2.item_type == 3) {
                      d111 += e2.product_amount;
                    }
                  }
                  if (type == "coupons" || type == "net_sales") {
                    if (e2.item_type == 5) {
                      if (type == "net_sales") {
                        d111 -= e2.product_amount;
                      } else {
                        d111 += e2.product_amount;
                      }
                    }
                  }
                });
              });
              DR2.forEach((ed2: any) => {
                ed2.user_order_items.forEach((e2: any) => {
                  if (type == "gross_sales" || type == "net_sales") {
                    if (e2.item_type == 1) {
                      d222 += e2.product_amount;
                    }
                  }
                  if (type == "net_sales") {
                    if (e2.item_type == 2) {
                      d222 += e2.product_amount;
                    } else if (e2.item_type == 3) {
                      d222 += e2.product_amount;
                    }
                  }
                  if (type == "coupons" || type == "net_sales") {
                    if (e2.item_type == 5) {
                      if (type == "net_sales") {
                        d222 -= e2.product_amount;
                      } else {
                        d222 += e2.product_amount;
                      }
                    }
                  }
                });
              });
              _DR1.forEach((ed1: any) => {
                if (type == "refunds" || type == "net_sales") {
                  if (type == "net_sales") {
                    d111 -= ed1.refund_amount;
                  } else {
                    d111 += ed1.refund_amount;
                  }
                }
              });
              _DR2.forEach((ed2: any) => {
                if (type == "refunds" || type == "net_sales") {
                  if (type == "net_sales") {
                    d222 -= ed2.refund_amount;
                  } else {
                    d222 += ed2.refund_amount;
                  }
                }
              });
              returnData.push({
                cp_date_time: daysOfYear1[index].start_date || "",
                cp: d111,
                pp_date_time: daysOfYear2[index].start_date || "",
                pp: d222,
              });
            }
            break;
          case "hour":
            function diff_hours(dt2: Date, dt1: Date) {
              var diff = (dt2.getTime() - dt1.getTime()) / 1000;
              diff /= 60 * 60;
              return Math.abs(Math.round(diff));
            }
            let DR1 = diff_hours(
              new Date(range.start_date),
              new Date(range.end_date + " 23:59:59")
            );
            let a = moment(range.end_date)
              .set({ hour: 23, minute: 59, second: 59 })
              .diff(
                moment(range.start_date).set({
                  hour: 0o0,
                  minute: 0o0,
                  second: 0o0,
                }),
                "hours"
              );
            let DR2 = diff_hours(
              new Date(compared_range.start_date),
              new Date(compared_range.end_date + " 23:59:59")
            );
            let b = moment(compared_range.end_date)
              .set({ hour: 24, minute: 0, second: 0 })
              .diff(
                moment(compared_range.start_date).set({
                  hour: 0o0,
                  minute: 0o0,
                  second: 0o0,
                }),
                "hours"
              );
            for (let index = 0; index < Math.max(a, b); index++) {
              let _DR1 = moment(range.start_date).add(index, "hours");
              let _DR2 = moment(compared_range.start_date).add(index, "hours");
              let _RD1 = "-";
              if (
                moment(_DR1).format("YYYY-MM-DD HH:mm") <=
                moment(range.end_date + " 23:59:59").format("YYYY-MM-DD HH:mm")
              ) {
                _RD1 = moment(_DR1).format("YYYY-MM-DD HH:mm");
              }
              let _RD2 = "-";
              if (
                moment(_DR2).format("YYYY-MM-DD HH:mm") <=
                moment(compared_range.end_date + "23:59:59").format(
                  "YYYY-MM-DD HH:mm"
                )
              ) {
                _RD2 = moment(_DR2).format("YYYY-MM-DD HH:mm");
              }
              let d11 = currentYearData.filter(
                (s: any) =>
                  moment(s.created_datetime).format("YYYY-MM-DD HH:mm") >=
                  _RD1 &&
                  moment(s.created_datetime).format("YYYY-MM-DD HH:mm") <
                  moment(_RD1).add(1, "hours").format("YYYY-MM-DD HH:mm")
              );
              let d22 = currentYearData.filter(
                (s: any) =>
                  moment(s.created_datetime).format("YYYY-MM-DD HH:mm") >=
                  _RD2 &&
                  moment(s.created_datetime).format("YYYY-MM-DD HH:mm") <
                  moment(_RD2).add(1, "hours").format("YYYY-MM-DD HH:mm")
              );
              let d111 = 0,
                d222 = 0;
              d11.forEach((ed1: any) => {
                ed1.user_order_items.forEach((e2: any) => {
                  if (type == "gross_sales" || type == "net_sales") {
                    if (e2.item_type == 1) {
                      d111 += e2.product_amount;
                    }
                  }
                  if (type == "net_sales") {
                    if (e2.item_type == 2) {
                      d111 += e2.product_amount;
                    } else if (e2.item_type == 3) {
                      d111 += e2.product_amount;
                    }
                  }
                  if (type == "coupons" || type == "net_sales") {
                    if (e2.item_type == 5) {
                      if (type == "net_sales") {
                        d111 -= e2.product_amount;
                      } else {
                        d111 += e2.product_amount;
                      }
                    }
                  }
                });
              });
              d22.forEach((ed2: any) => {
                ed2.user_order_items.forEach((e2: any) => {
                  if (type == "gross_sales" || type == "net_sales") {
                    if (e2.item_type == 1) {
                      d222 += e2.product_amount;
                    }
                  }
                  if (type == "net_sales") {
                    if (e2.item_type == 2) {
                      d222 += e2.product_amount;
                    } else if (e2.item_type == 3) {
                      d222 += e2.product_amount;
                    }
                  }
                  if (type == "coupons" || type == "net_sales") {
                    if (e2.item_type == 5) {
                      if (type == "net_sales") {
                        d222 -= e2.product_amount;
                      } else {
                        d222 += e2.product_amount;
                      }
                    }
                  }
                });
              });
              let _d11 = currentYearRefundData.filter(
                (s: any) =>
                  moment(s.created_datetime).format("YYYY-MM-DD HH:mm") >=
                  _RD1 &&
                  moment(s.created_datetime).format("YYYY-MM-DD HH:mm") <
                  moment(_RD1).add(1, "hours").format("YYYY-MM-DD HH:mm")
              );
              let _d22 = currentYearRefundData.filter(
                (s: any) =>
                  moment(s.created_datetime).format("YYYY-MM-DD HH:mm") >=
                  _RD2 &&
                  moment(s.created_datetime).format("YYYY-MM-DD HH:mm") <
                  moment(_RD2).add(1, "hours").format("YYYY-MM-DD HH:mm")
              );
              _d11.forEach((ed1: any) => {
                if (type == "refunds" || type == "net_sales") {
                  if (type == "net_sales") {
                    d111 -= ed1.refund_amount;
                  } else {
                    d111 += ed1.refund_amount;
                  }
                }
              });
              _d22.forEach((ed2: any) => {
                if (type == "refunds" || type == "net_sales") {
                  if (type == "net_sales") {
                    d222 -= ed2.refund_amount;
                  } else {
                    d222 += ed2.refund_amount;
                  }
                }
              });
              returnData.push({
                cp_date_time: _RD1,
                cp: d111,
                pp_date_time: _RD2,
                pp: d222,
              });
            }
            break;
        }
        new SuccessResponse("Success", {
          graph: returnData,
        }).send(res);
      } else {
        throw new Error("no data found");
      }
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
  public async grossSalesGraph(req: Request, res: Response) {
    try {
      let { range, compared_range, by, type } = req.body;
      let subWhereCon = dbReader.Sequelize.Op.ne,
        subWhereData = null;
      if (type) {
        switch (type) {
          case "gross_sales":
            subWhereCon = dbReader.Sequelize.Op.eq;
            subWhereData = 1;
            break;
        }
      }
      let attributes: any = [
        [
          dbReader.sequelize.literal("`user_orders`.`created_datetime`"),
          "created_datetime",
        ],
        "user_orders_id",
      ];
      let attributes1: any = ["status", "refund_amount", "created_datetime"];
      switch (by) {
        case "day":
          attributes = [
            [
              dbReader.Sequelize.fn(
                "DATE_FORMAT",
                dbReader.sequelize.literal("`user_orders`.`created_datetime`"),
                "%Y-%m-%d"
              ),
              "created_datetime",
            ],
            "user_orders_id",
          ];
          attributes1 = [
            [
              dbReader.Sequelize.fn(
                "DATE_FORMAT",
                dbReader.sequelize.literal("created_datetime"),
                "%Y-%m-%d"
              ),
              "created_datetime",
            ],
            "status",
            "refund_amount",
          ];
          break;
        case "week":
          attributes = [
            [
              dbReader.Sequelize.fn(
                "DATE_FORMAT",
                dbReader.sequelize.literal("`user_orders`.`created_datetime`"),
                "%Y-%m-%d"
              ),
              "created_datetime",
            ],
            "user_orders_id",
          ];
          attributes1 = [
            [
              dbReader.Sequelize.fn(
                "DATE_FORMAT",
                dbReader.sequelize.literal("created_datetime"),
                "%Y-%m-%d"
              ),
              "created_datetime",
            ],
            "status",
            "refund_amount",
          ];
          break;
        case "month":
          attributes = [
            [
              dbReader.Sequelize.fn(
                "DATE_FORMAT",
                dbReader.sequelize.literal("`user_orders`.`created_datetime`"),
                "%Y-%m"
              ),
              "created_datetime",
            ],
            "user_orders_id",
          ];
          attributes1 = [
            [
              dbReader.Sequelize.fn(
                "DATE_FORMAT",
                dbReader.sequelize.literal("created_datetime"),
                "%Y-%m"
              ),
              "created_datetime",
            ],
            "status",
            "refund_amount",
          ];
          break;
        case "quarter":
          attributes = [
            [
              dbReader.Sequelize.fn(
                "DATE_FORMAT",
                dbReader.sequelize.literal("`user_orders`.`created_datetime`"),
                "%Y-%m"
              ),
              "created_datetime",
            ],
            "user_orders_id",
          ];
          attributes1 = [
            [
              dbReader.Sequelize.fn(
                "DATE_FORMAT",
                dbReader.sequelize.literal("created_datetime"),
                "%Y-%m"
              ),
              "created_datetime",
            ],
            "status",
            "refund_amount",
          ];
          break;
      }
      let currentYearData = await dbReader.userOrder.findAll({
        attributes: attributes,
        where: dbReader.sequelize.and(
          { order_status: [2, 3, 4, 5, 6, 8] },
          dbReader.Sequelize.or(
            dbReader.Sequelize.and(
              dbReader.Sequelize.where(
                dbReader.Sequelize.fn(
                  "DATE_FORMAT",
                  dbReader.sequelize.literal(
                    "`user_orders`.`created_datetime`"
                  ),
                  "%Y-%m-%d"
                ),
                { [dbReader.Sequelize.Op.gte]: range.start_date }
              ),
              dbReader.Sequelize.where(
                dbReader.Sequelize.fn(
                  "DATE_FORMAT",
                  dbReader.sequelize.literal(
                    "`user_orders`.`created_datetime`"
                  ),
                  "%Y-%m-%d"
                ),
                { [dbReader.Sequelize.Op.lte]: range.end_date }
              )
            ),
            dbReader.Sequelize.and(
              dbReader.Sequelize.where(
                dbReader.Sequelize.fn(
                  "DATE_FORMAT",
                  dbReader.sequelize.literal(
                    "`user_orders`.`created_datetime`"
                  ),
                  "%Y-%m-%d"
                ),
                { [dbReader.Sequelize.Op.gte]: compared_range.start_date }
              ),
              dbReader.Sequelize.where(
                dbReader.Sequelize.fn(
                  "DATE_FORMAT",
                  dbReader.sequelize.literal(
                    "`user_orders`.`created_datetime`"
                  ),
                  "%Y-%m-%d"
                ),
                { [dbReader.Sequelize.Op.lte]: compared_range.end_date }
              )
            )
          )
        ),
        include: [
          {
            separate: true,
            model: dbReader.userOrderItems,
            where: { item_type: { [subWhereCon]: subWhereData } },
            attributes: [
              "item_type",
              "product_amount",
              "user_orders_id",
              "created_datetime",
            ],
          },
          {
            model: dbReader.transactionMaster,
            where: { status: "Success" },
            attributes: [],
          },
        ],
      });
      currentYearData = JSON.parse(JSON.stringify(currentYearData));

      if (currentYearData) {
        let returnData: any = [];
        switch (by) {
          case "quarter":
            let by_quarterly_date1: any = moment(
              range.start_date,
              "DD-MM-YYYY"
            ).format("MM");
            let by_quarterly_date2: any = moment(range.end_date).format("MM");
            let by_quarterly_monthDiff1 =
              by_quarterly_date2 - by_quarterly_date1;
            for (let index = 0; index < by_quarterly_monthDiff1; index++) {
              let d1 = moment(range.start_date)
                .add(index, "M")
                .format("YYYY-MM");
              let d2 = moment(compared_range.start_date)
                .add(index, "M")
                .format("YYYY-MM");
              let d11 = currentYearData.filter(
                (s: any) => s.created_datetime == d1
              );
              let d22 = currentYearData.filter(
                (s: any) => s.created_datetime == d2
              );
              let d111 = 0,
                d222 = 0;
              d11.forEach((ed1: any) => {
                ed1.user_order_items.forEach((e2: any) => {
                  if (type == "gross_sales") {
                    if (e2.item_type == 1) {
                      d111 += e2.product_amount;
                    }
                  }
                });
              });
              d22.forEach((ed2: any) => {
                ed2.user_order_items.forEach((e2: any) => {
                  if (type == "gross_sales") {
                    if (e2.item_type == 1) {
                      d222 += e2.product_amount;
                    }
                  }
                });
              });

              if ([0, 1, 2].includes(index)) {
                let td = moment(range.start_date).add(0, "M").format("YYYY-MM");
                let td2 = moment(compared_range.start_date)
                  .add(0, "M")
                  .format("YYYY-MM");
                if (returnData.some((e: any) => e.cp_date_time == td)) {
                  let _tdi = returnData.findIndex(
                    (e: any) => e.cp_date_time == td
                  );
                  returnData[_tdi].cp = returnData[_tdi].cp + d111;
                  returnData[_tdi].pp = returnData[_tdi].pp + d222;
                } else {
                  returnData.push({
                    cp_date_time: td,
                    cp: d111,
                    pp_date_time: td2,
                    pp: d222,
                  });
                }
              } else if ([3, 4, 5].includes(index)) {
                let td = moment(range.start_date).add(3, "M").format("YYYY-MM");
                let td2 = moment(compared_range.start_date)
                  .add(3, "M")
                  .format("YYYY-MM");
                if (returnData.some((e: any) => e.cp_date_time == td)) {
                  let _tdi = returnData.findIndex(
                    (e: any) => e.cp_date_time == td
                  );
                  returnData[_tdi].cp = returnData[_tdi].cp + d111;
                  returnData[_tdi].pp = returnData[_tdi].pp + d222;
                } else {
                  returnData.push({
                    cp_date_time: td,
                    cp: d111,
                    pp_date_time: td2,
                    pp: d222,
                  });
                }
              } else if ([6, 7, 8].includes(index)) {
                let td = moment(range.start_date).add(6, "M").format("YYYY-MM");
                let td2 = moment(compared_range.start_date)
                  .add(6, "M")
                  .format("YYYY-MM");
                if (returnData.some((e: any) => e.cp_date_time == td)) {
                  let _tdi = returnData.findIndex(
                    (e: any) => e.cp_date_time == td
                  );
                  returnData[_tdi].cp = returnData[_tdi].cp + d111;
                  returnData[_tdi].pp = returnData[_tdi].pp + d222;
                } else {
                  returnData.push({
                    cp_date_time: td,
                    cp: d111,
                    pp_date_time: td2,
                    pp: d222,
                  });
                }
              } else if ([9, 10, 11].includes(index)) {
                let td = moment(range.start_date).add(9, "M").format("YYYY-MM");
                let td2 = moment(compared_range.start_date)
                  .add(9, "M")
                  .format("YYYY-MM");
                if (returnData.some((e: any) => e.cp_date_time == td)) {
                  let _tdi = returnData.findIndex(
                    (e: any) => e.cp_date_time == td
                  );
                  returnData[_tdi].cp = returnData[_tdi].cp + d111;
                  returnData[_tdi].pp = returnData[_tdi].pp + d222;
                } else {
                  returnData.push({
                    cp_date_time: td,
                    cp: d111,
                    pp_date_time: td2,
                    pp: d222,
                  });
                }
              }
            }
            break;
          case "month":
            var now1 = new Date(range.end_date);
            var now11 = new Date(range.start_date);
            var daysOfYear1: any = [];
            for (var d = now11; d <= now1; d.setDate(d.getDate() + 1)) {
              let month = moment(d).format("MM");
              if (daysOfYear1.some((s: any) => s.month == month)) {
                let fi = daysOfYear1.findIndex((s: any) => s.month == month);
                daysOfYear1[fi].end_date = moment(d).format("YYYY-MM-DD");
              } else {
                daysOfYear1.push({
                  month: month,
                  start_date: moment(d).format("YYYY-MM-DD"),
                  end_date: moment(d).format("YYYY-MM-DD"),
                });
              }
            }
            var now2 = new Date(compared_range.end_date);
            var now22 = new Date(compared_range.start_date);
            var daysOfYear2: any = [];
            for (var d = now22; d <= now2; d.setDate(d.getDate() + 1)) {
              let month = moment(d).format("MM");
              if (daysOfYear2.some((s: any) => s.month == month)) {
                let fi = daysOfYear2.findIndex((s: any) => s.month == month);
                daysOfYear2[fi].end_date = moment(d).format("YYYY-MM-DD");
              } else {
                daysOfYear2.push({
                  month: month,
                  start_date: moment(d).format("YYYY-MM-DD"),
                  end_date: moment(d).format("YYYY-MM-DD"),
                });
              }
            }
            daysOfYear1.reverse();
            daysOfYear2.reverse();
            for (
              let index = 0;
              index < Math.min(daysOfYear1.length, daysOfYear2.length);
              index++
            ) {
              let startDate1 = daysOfYear1[index]
                ? daysOfYear1[index].start_date
                : "";
              let lastDate1 = daysOfYear1[index]
                ? daysOfYear1[index].end_date
                : "";
              let startDate2 = daysOfYear2[index]
                ? daysOfYear2[index].start_date
                : "";
              let lastDate2 = daysOfYear2[index]
                ? daysOfYear2[index].end_date
                : "";
              let d1 = moment(startDate1).format("YYYY-MM");
              let d2 = moment(startDate2).format("YYYY-MM");
              let d11 = currentYearData.filter(
                (s: any) => s.created_datetime == d1
              );
              let d22 = currentYearData.filter(
                (s: any) => s.created_datetime == d2
              );
              let d111 = 0,
                d222 = 0;
              d11.forEach((ed1: any) => {
                ed1.user_order_items.forEach((e2: any) => {
                  if (type == "gross_sales" || type == "net_sales") {
                    if (e2.item_type == 1) {
                      d111 += e2.product_amount;
                    }
                  }
                });
              });
              d22.forEach((ed2: any) => {
                ed2.user_order_items.forEach((e2: any) => {
                  if (type == "gross_sales" || type == "net_sales") {
                    if (e2.item_type == 1) {
                      d222 += e2.product_amount;
                    }
                  }
                });
              });

              returnData.push({
                cp_date_time: startDate1,
                cp: d111,
                pp_date_time: startDate2,
                pp: d222,
              });
            }
            returnData.reverse();
            break;
          case "week":
            moment.updateLocale("in", {
              week: {
                dow: 1, // Monday is the first day of the week
              },
            });
            var now1 = new Date(range.end_date);
            var daysOfYear1: any = [];
            for (
              var d = new Date(range.start_date);
              d <= now1;
              d.setDate(d.getDate() + 1)
            ) {
              let week = moment(d).week();
              if (daysOfYear1.some((s: any) => s.week == week)) {
                let fi = daysOfYear1.findIndex((s: any) => s.week == week);
                daysOfYear1[fi].end_date = moment(d).format("YYYY-MM-DD");
              } else {
                daysOfYear1.push({
                  week: week,
                  start_date: moment(d).format("YYYY-MM-DD"),
                  end_date: moment(d).format("YYYY-MM-DD"),
                });
              }
            }
            var now2 = new Date(compared_range.end_date);
            var daysOfYear2: any = [];
            for (
              var d = new Date(compared_range.start_date);
              d <= now2;
              d.setDate(d.getDate() + 1)
            ) {
              let week = moment(d).week();
              if (daysOfYear2.some((s: any) => s.week == week)) {
                let fi = daysOfYear2.findIndex((s: any) => s.week == week);
                daysOfYear2[fi].end_date = moment(d).format("YYYY-MM-DD");
              } else {
                daysOfYear2.push({
                  week: week,
                  start_date: moment(d).format("YYYY-MM-DD"),
                  end_date: moment(d).format("YYYY-MM-DD"),
                });
              }
            }
            daysOfYear1.reverse();
            daysOfYear2.reverse();
            for (
              let index = 0;
              index < Math.min(daysOfYear1.length, daysOfYear2.length);
              index++
            ) {
              let startDate1 = daysOfYear1[index]
                ? daysOfYear1[index].start_date
                : "";
              let lastDate1 = daysOfYear1[index]
                ? daysOfYear1[index].end_date
                : "";
              let startDate2 = daysOfYear2[index]
                ? daysOfYear2[index].start_date
                : "";
              let lastDate2 = daysOfYear2[index]
                ? daysOfYear2[index].end_date
                : "";
              let DR1 = currentYearData.filter(
                (s: any) =>
                  s.created_datetime >= startDate1 &&
                  s.created_datetime <= lastDate1
              );

              let DR2 = currentYearData.filter(
                (s: any) =>
                  s.created_datetime >= startDate2 &&
                  s.created_datetime <= lastDate2
              );

              let d111 = 0,
                d222 = 0;
              DR1.forEach((ed1: any) => {
                ed1.user_order_items.forEach((e2: any) => {
                  if (type == "gross_sales" || type == "net_sales") {
                    if (e2.item_type == 1) {
                      d111 += e2.product_amount;
                    }
                  }
                });
              });
              DR2.forEach((ed2: any) => {
                ed2.user_order_items.forEach((e2: any) => {
                  if (type == "gross_sales" || type == "net_sales") {
                    if (e2.item_type == 1) {
                      d222 += e2.product_amount;
                    }
                  }
                });
              });

              returnData.push({
                cp_date_time: startDate1,
                cp: d111,
                pp_date_time: startDate2,
                pp: d222,
              });
            }
            returnData.reverse();
            break;
          case "day":
            var now1 = new Date(range.end_date);
            var daysOfYear1: any = [];
            for (
              var d = new Date(range.start_date);
              d <= now1;
              d.setDate(d.getDate() + 1)
            ) {
              daysOfYear1.push({
                start_date: moment(d).format("YYYY-MM-DD"),
              });
            }
            var now2 = new Date(compared_range.end_date);
            var daysOfYear2: any = [];
            for (
              var d = new Date(compared_range.start_date);
              d <= now2;
              d.setDate(d.getDate() + 1)
            ) {
              daysOfYear2.push({
                start_date: moment(d).format("YYYY-MM-DD"),
              });
            }
            for (
              let index = 0;
              index < Math.min(daysOfYear1.length, daysOfYear2.length);
              index++
            ) {
              let startDate1 = daysOfYear1[index].start_date || "";
              let startDate2 = daysOfYear2[index].start_date || "";
              let DR1 = currentYearData.filter(
                (s: any) => s.created_datetime == startDate1
              );

              let DR2 = currentYearData.filter(
                (s: any) => s.created_datetime == startDate2
              );

              let d111 = 0,
                d222 = 0;
              DR1.forEach((ed1: any) => {
                ed1.user_order_items.forEach((e2: any) => {
                  if (type == "gross_sales" || type == "net_sales") {
                    if (e2.item_type == 1) {
                      d111 += e2.product_amount;
                    }
                  }
                });
              });
              DR2.forEach((ed2: any) => {
                ed2.user_order_items.forEach((e2: any) => {
                  if (type == "gross_sales" || type == "net_sales") {
                    if (e2.item_type == 1) {
                      d222 += e2.product_amount;
                    }
                  }
                });
              });

              returnData.push({
                cp_date_time: daysOfYear1[index].start_date || "",
                cp: d111,
                pp_date_time: daysOfYear2[index].start_date || "",
                pp: d222,
              });
            }
            break;
          case "hour":
            function diff_hours(dt2: Date, dt1: Date) {
              var diff = (dt2.getTime() - dt1.getTime()) / 1000;
              diff /= 60 * 60;
              return Math.abs(Math.round(diff));
            }
            let DR1 = diff_hours(
              new Date(range.start_date),
              new Date(range.end_date + " 23:59:59")
            );
            let a = moment(range.end_date)
              .set({ hour: 23, minute: 59, second: 59 })
              .diff(
                moment(range.start_date).set({
                  hour: 0o0,
                  minute: 0o0,
                  second: 0o0,
                }),
                "hours"
              );
            let DR2 = diff_hours(
              new Date(compared_range.start_date),
              new Date(compared_range.end_date + " 23:59:59")
            );
            let b = moment(compared_range.end_date)
              .set({ hour: 24, minute: 0, second: 0 })
              .diff(
                moment(compared_range.start_date).set({
                  hour: 0o0,
                  minute: 0o0,
                  second: 0o0,
                }),
                "hours"
              );
            for (let index = 0; index < Math.max(a, b); index++) {
              let _DR1 = moment(range.start_date).add(index, "hours");
              let _DR2 = moment(compared_range.start_date).add(index, "hours");
              let _RD1 = "-";
              if (
                moment(_DR1).format("YYYY-MM-DD HH:mm") <=
                moment(range.end_date + " 23:59:59").format("YYYY-MM-DD HH:mm")
              ) {
                _RD1 = moment(_DR1).format("YYYY-MM-DD HH:mm");
              }
              let _RD2 = "-";
              if (
                moment(_DR2).format("YYYY-MM-DD HH:mm") <=
                moment(compared_range.end_date + "23:59:59").format(
                  "YYYY-MM-DD HH:mm"
                )
              ) {
                _RD2 = moment(_DR2).format("YYYY-MM-DD HH:mm");
              }
              let d11 = currentYearData.filter(
                (s: any) =>
                  moment(s.created_datetime).format("YYYY-MM-DD HH:mm") >=
                  _RD1 &&
                  moment(s.created_datetime).format("YYYY-MM-DD HH:mm") <
                  moment(_RD1).add(1, "hours").format("YYYY-MM-DD HH:mm")
              );
              let d22 = currentYearData.filter(
                (s: any) =>
                  moment(s.created_datetime).format("YYYY-MM-DD HH:mm") >=
                  _RD2 &&
                  moment(s.created_datetime).format("YYYY-MM-DD HH:mm") <
                  moment(_RD2).add(1, "hours").format("YYYY-MM-DD HH:mm")
              );
              let d111 = 0,
                d222 = 0;
              d11.forEach((ed1: any) => {
                ed1.user_order_items.forEach((e2: any) => {
                  if (type == "gross_sales" || type == "net_sales") {
                    if (e2.item_type == 1) {
                      d111 += e2.product_amount;
                    }
                  }
                });
              });
              d22.forEach((ed2: any) => {
                ed2.user_order_items.forEach((e2: any) => {
                  if (type == "gross_sales" || type == "net_sales") {
                    if (e2.item_type == 1) {
                      d222 += e2.product_amount;
                    }
                  }
                });
              });
              returnData.push({
                cp_date_time: _RD1,
                cp: d111,
                pp_date_time: _RD2,
                pp: d222,
              });
            }
            break;
        }
        new SuccessResponse("Success", {
          graph: returnData,
        }).send(res);
      } else {
        throw new Error("no data found");
      }
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
  public async registeredUserGraph(req: Request, res: Response) {
    try {
      let { current_year_date_range, past_year_date_range, by = "" } = req.body,
        graphData: any;
      let current_start_date = current_year_date_range
        ? current_year_date_range.start_date
        : "";
      let current_end_date = current_year_date_range
        ? current_year_date_range.end_date
        : "";
      let past_start_date = past_year_date_range
        ? past_year_date_range.start_date
        : "";
      let past_end_date = past_year_date_range
        ? past_year_date_range.end_date
        : "";
      let attributes =
        by == "hour"
          ? ["created_datetime"]
          : [
            [
              dbReader.Sequelize.fn(
                "DATE_FORMAT",
                dbReader.sequelize.literal("`sycu_users`.`created_datetime`"),
                "%Y-%m-%d"
              ),
              "created_datetime",
            ],
          ];
      if (
        current_start_date &&
        current_end_date &&
        past_start_date &&
        past_end_date
      ) {
        graphData = await dbReader.users.findAll({
          attributes: attributes,
          where: dbReader.Sequelize.and(
            dbReader.Sequelize.or(
              dbReader.Sequelize.and(
                dbReader.Sequelize.where(
                  dbReader.Sequelize.fn(
                    "DATE_FORMAT",
                    dbReader.sequelize.col("sycu_users.created_datetime"),
                    "%Y-%m-%d"
                  ),
                  { [dbReader.Sequelize.Op.gte]: current_start_date }
                ),
                dbReader.Sequelize.where(
                  dbReader.Sequelize.fn(
                    "DATE_FORMAT",
                    dbReader.sequelize.col("sycu_users.created_datetime"),
                    "%Y-%m-%d"
                  ),
                  { [dbReader.Sequelize.Op.lte]: current_end_date }
                )
              ),
              dbReader.Sequelize.and(
                dbReader.Sequelize.where(
                  dbReader.Sequelize.fn(
                    "DATE_FORMAT",
                    dbReader.sequelize.col("sycu_users.created_datetime"),
                    "%Y-%m-%d"
                  ),
                  { [dbReader.Sequelize.Op.gte]: past_start_date }
                ),
                dbReader.Sequelize.where(
                  dbReader.Sequelize.fn(
                    "DATE_FORMAT",
                    dbReader.sequelize.col("sycu_users.created_datetime"),
                    "%Y-%m-%d"
                  ),
                  { [dbReader.Sequelize.Op.lte]: past_end_date }
                )
              )
            ),
            { is_deleted: 0 }
          ),
        });
        if (graphData.length) {
          graphData = JSON.parse(JSON.stringify(graphData));
          let dateRange,
            arrayOfDatesOfCurrent: any = [],
            arrayOfDatesOfPrevious: any = [];
          let getCounts = (arrCurrent: any, arrPrevious: any, type: string) => {
            let final: any = [];
            if (type == "hour") {
              for (let ele of arrCurrent) {
                for (let obj of ele) {
                  for (let value of graphData) {
                    if (
                      obj.created_date ==
                      moment(value.created_datetime).format("YYYY-MM-DD HH")
                    ) {
                      obj.current++;
                    }
                  }
                }
              }
              for (let ele of arrPrevious) {
                for (let obj of ele) {
                  for (let value of graphData) {
                    if (
                      obj.created_date ==
                      moment(value.created_datetime).format("YYYY-MM-DD HH")
                    ) {
                      obj.previous++;
                    }
                  }
                }
              }
              for (let i = 0; i < arrCurrent.length; i++) {
                let current: any = { current_count: 0 },
                  previous: any = { previous_count: 0 };
                for (let j = 0; j < arrCurrent[i].length; j++) {
                  current.start_date = arrCurrent[i][j].start_date;
                  current.end_date = arrCurrent[i][j].end_date;
                  current.current_count += arrCurrent[i][j].current;
                }
                for (let j = 0; j < arrPrevious[i].length; j++) {
                  previous.start_date = arrPrevious[i][j].start_date;
                  previous.end_date = arrPrevious[i][j].end_date;
                  previous.previous_count += arrPrevious[i][j].previous;
                }
                final.push({ current: current, previous: previous });
              }
            } else {
              for (let ele of arrCurrent) {
                for (let obj of ele) {
                  for (let value of graphData) {
                    if (obj.created_date == value.created_datetime) {
                      obj.current++;
                    }
                  }
                }
              }
              for (let ele of arrPrevious) {
                for (let obj of ele) {
                  for (let value of graphData) {
                    if (obj.created_date == value.created_datetime) {
                      obj.previous++;
                    }
                  }
                }
              }
              for (let i = 0; i < arrCurrent.length; i++) {
                let current: any = { current_count: 0 },
                  previous: any = { previous_count: 0 };
                for (let j = 0; j < arrCurrent[i].length; j++) {
                  current.start_date = arrCurrent[i][j].start_date;
                  current.end_date = arrCurrent[i][j].end_date;
                  current.current_count += arrCurrent[i][j].current;
                }
                for (let j = 0; j < arrPrevious[i].length; j++) {
                  previous.start_date = arrPrevious[i][j].start_date;
                  previous.end_date = arrPrevious[i][j].end_date;
                  previous.previous_count += arrPrevious[i][j].previous;
                }
                final.push({ current: current, previous: previous });
              }
              final.reverse();
            }
            let current_count = 0,
              previous_count = 0;
            final.forEach((e: any) => {
              current_count += e.current.current_count;
              previous_count += e.previous.previous_count;
            });
            return { current_count, previous_count, final };
          };
          switch (by) {
            case "day":
              var daysOfYear1: any = [],
                daysOfYear2: any = [];
              let dateRangeOfCurrent = getDateRange(
                current_start_date,
                current_end_date,
                "YYYY-MM-DD"
              );
              let dateRangeOfPrevious = getDateRange(
                past_start_date,
                past_end_date,
                "YYYY-MM-DD"
              );
              daysOfYear1 = dateRangeOfCurrent.map(function (item: any) {
                return {
                  created_date: item,
                  start_date: item,
                  end_date: item,
                  current: 0,
                };
              });
              daysOfYear2 = dateRangeOfPrevious.map(function (item: any) {
                return {
                  created_date: item,
                  start_date: item,
                  end_date: item,
                  previous: 0,
                };
              });
              daysOfYear1.reverse();
              daysOfYear2.reverse();
              for (let ele of daysOfYear1) {
                for (let value of graphData) {
                  if (ele.created_date == value.created_datetime) {
                    ele.current++;
                  }
                }
              }
              for (let ele of daysOfYear2) {
                for (let value of graphData) {
                  if (ele.created_date == value.created_datetime) {
                    ele.previous++;
                  }
                }
              }
              let final: any = [];
              for (
                let i = 0;
                i < Math.min(daysOfYear1.length, daysOfYear2.length);
                i++
              ) {
                let current: any = { current_count: 0 },
                  previous: any = { previous_count: 0 };
                current.start_date = daysOfYear1[i].start_date;
                current.end_date = daysOfYear1[i].end_date;
                current.current_count = daysOfYear1[i].current;
                previous.start_date = daysOfYear2[i].start_date;
                previous.end_date = daysOfYear2[i].end_date;
                previous.previous_count = daysOfYear2[i].previous;
                final.push({ current: current, previous: previous });
              }
              let current_count = 0,
                previous_count = 0;
              final.forEach((e: any) => {
                current_count += e.current.current_count;
                previous_count += e.previous.previous_count;
              });
              new SuccessResponse(EC.errorMessage(EC.getMessage), {
                // @ts-ignore
                token: req.token,
                current: current_count,
                previous: previous_count,
                rows: final,
              }).send(res);
              break;
            case "week":
              moment.updateLocale("in", {
                week: {
                  dow: 1, // Monday is the first day of the week
                },
              });
              var now1 = new Date(current_end_date);
              var daysOfYear1: any = [];
              for (
                var d = new Date(current_start_date);
                d <= now1;
                d.setDate(d.getDate() + 1)
              ) {
                let week = moment(d).week();
                if (daysOfYear1.some((s: any) => s.week == week)) {
                  let fi = daysOfYear1.findIndex((s: any) => s.week == week);
                  daysOfYear1[fi].end_date = moment(d).format("YYYY-MM-DD");
                } else {
                  daysOfYear1.push({
                    week: week,
                    start_date: moment(d).format("YYYY-MM-DD"),
                    end_date: moment(d).format("YYYY-MM-DD"),
                  });
                }
              }
              var now2 = new Date(past_end_date);
              var daysOfYear2: any = [];
              for (
                var d = new Date(past_start_date);
                d <= now2;
                d.setDate(d.getDate() + 1)
              ) {
                let week = moment(d).week();
                if (daysOfYear2.some((s: any) => s.week == week)) {
                  let fi = daysOfYear2.findIndex((s: any) => s.week == week);
                  daysOfYear2[fi].end_date = moment(d).format("YYYY-MM-DD");
                } else {
                  daysOfYear2.push({
                    week: week,
                    start_date: moment(d).format("YYYY-MM-DD"),
                    end_date: moment(d).format("YYYY-MM-DD"),
                  });
                }
              }
              daysOfYear1.reverse();
              daysOfYear2.reverse();
              for (
                let index = 0;
                index < Math.min(daysOfYear1.length, daysOfYear2.length);
                index++
              ) {
                let startDate1 = daysOfYear1[index].start_date;
                let lastDate1 = daysOfYear1[index].end_date;
                let startDate2 = daysOfYear2[index].start_date;
                let lastDate2 = daysOfYear2[index].end_date;
                dateRange = getDateRange(startDate1, lastDate1, "YYYY-MM-DD");
                arrayOfDatesOfCurrent.push(
                  dateRange.map(function (item) {
                    return {
                      created_date: item,
                      start_date: startDate1,
                      end_date: lastDate1,
                      current: 0,
                    };
                  })
                );
                dateRange = getDateRange(startDate2, lastDate2, "YYYY-MM-DD");
                arrayOfDatesOfPrevious.push(
                  dateRange.map(function (item) {
                    return {
                      created_date: item,
                      start_date: startDate2,
                      end_date: lastDate2,
                      previous: 0,
                    };
                  })
                );
              }
              let result1 = getCounts(
                arrayOfDatesOfCurrent,
                arrayOfDatesOfPrevious,
                by
              );
              new SuccessResponse(EC.errorMessage(EC.getMessage), {
                // @ts-ignore
                token: req.token,
                current: result1.current_count,
                previous: result1.previous_count,
                rows: result1.final,
              }).send(res);
              break;
            case "month":
              var now1 = new Date(current_end_date);
              var daysOfYear1: any = [];
              for (
                var d = new Date(current_start_date);
                d <= now1;
                d.setDate(d.getDate() + 1)
              ) {
                let month = moment(d).format("MM");
                if (daysOfYear1.some((s: any) => s.month == month)) {
                  let fi = daysOfYear1.findIndex((s: any) => s.month == month);
                  daysOfYear1[fi].end_date = moment(d).format("YYYY-MM-DD");
                } else {
                  daysOfYear1.push({
                    month: month,
                    start_date: moment(d).format("YYYY-MM-DD"),
                    end_date: moment(d).format("YYYY-MM-DD"),
                  });
                }
              }
              var now2 = new Date(past_end_date);
              var daysOfYear2: any = [];
              for (
                var d = new Date(past_start_date);
                d <= now2;
                d.setDate(d.getDate() + 1)
              ) {
                let month = moment(d).format("MM");
                if (daysOfYear2.some((s: any) => s.month == month)) {
                  let fi = daysOfYear2.findIndex((s: any) => s.month == month);
                  daysOfYear2[fi].end_date = moment(d).format("YYYY-MM-DD");
                } else {
                  daysOfYear2.push({
                    month: month,
                    start_date: moment(d).format("YYYY-MM-DD"),
                    end_date: moment(d).format("YYYY-MM-DD"),
                  });
                }
              }
              daysOfYear1.reverse();
              daysOfYear2.reverse();
              for (
                let index = 0;
                index < Math.min(daysOfYear1.length, daysOfYear2.length);
                index++
              ) {
                let startDate1 = daysOfYear1[index].start_date;
                let lastDate1 = daysOfYear1[index].end_date;
                let startDate2 = daysOfYear2[index].start_date;
                let lastDate2 = daysOfYear2[index].end_date;
                dateRange = getDateRange(startDate1, lastDate1, "YYYY-MM-DD");
                arrayOfDatesOfCurrent.push(
                  dateRange.map(function (item) {
                    return {
                      created_date: item,
                      start_date: startDate1,
                      end_date: lastDate1,
                      current: 0,
                    };
                  })
                );
                dateRange = getDateRange(startDate2, lastDate2, "YYYY-MM-DD");
                arrayOfDatesOfPrevious.push(
                  dateRange.map(function (item) {
                    return {
                      created_date: item,
                      start_date: startDate2,
                      end_date: lastDate2,
                      previous: 0,
                    };
                  })
                );
              }
              let result2 = getCounts(
                arrayOfDatesOfCurrent,
                arrayOfDatesOfPrevious,
                by
              );
              new SuccessResponse(EC.errorMessage(EC.getMessage), {
                // @ts-ignore
                token: req.token,
                current: result2.current_count,
                previous: result2.previous_count,
                rows: result2.final,
              }).send(res);
              break;
            case "quarter":
              var daysOfYear1: any = [],
                daysOfYear2: any = [];
              for (
                let m = moment(current_start_date);
                m <= moment(current_end_date);
                m.add(3, "M")
              ) {
                let _currentStartDate = m.format("YYYY-MM-DD"),
                  _actualStartDate =
                    moment(current_start_date).format("YYYY-MM-DD"),
                  _lastDate = moment(moment(m).add(3, "M")).format(
                    "YYYY-MM-DD"
                  ),
                  _actualEndDate =
                    moment(current_end_date).format("YYYY-MM-DD");
                if (
                  (_lastDate <= _actualEndDate ||
                    _actualEndDate >= _currentStartDate) &&
                  _actualStartDate <= _currentStartDate
                ) {
                  dateRange = getDateRange(m, _lastDate, "YYYY-MM-DD");
                  daysOfYear1.push(
                    dateRange.map(function (item: any) {
                      return {
                        created_date: item,
                        start_date: _currentStartDate,
                        end_date: _lastDate,
                        current: 0,
                      };
                    })
                  );
                }
              }
              for (
                let m = moment(past_start_date);
                m <= moment(past_end_date);
                m.add(3, "M")
              ) {
                let _currentStartDate = m.format("YYYY-MM-DD"),
                  _actualStartDate =
                    moment(past_start_date).format("YYYY-MM-DD"),
                  _lastDate = moment(moment(m).add(3, "M")).format(
                    "YYYY-MM-DD"
                  ),
                  _actualEndDate = moment(past_end_date).format("YYYY-MM-DD");
                if (
                  (_lastDate <= _actualEndDate ||
                    _actualEndDate >= _currentStartDate) &&
                  _actualStartDate <= _currentStartDate
                ) {
                  dateRange = getDateRange(m, _lastDate, "YYYY-MM-DD");
                  daysOfYear2.push(
                    dateRange.map(function (item: any) {
                      return {
                        created_date: item,
                        start_date: _currentStartDate,
                        end_date: _lastDate,
                        previous: 0,
                      };
                    })
                  );
                }
              }
              daysOfYear1.reverse();
              daysOfYear2.reverse();
              for (
                let index = 0;
                index < Math.min(daysOfYear1.length, daysOfYear2.length);
                index++
              ) {
                arrayOfDatesOfCurrent.push(daysOfYear1[index]);
                arrayOfDatesOfPrevious.push(daysOfYear2[index]);
              }
              let result3 = getCounts(
                arrayOfDatesOfCurrent,
                arrayOfDatesOfPrevious,
                by
              );
              new SuccessResponse(EC.errorMessage(EC.getMessage), {
                // @ts-ignore
                token: req.token,
                current: result3.current_count,
                previous: result3.previous_count,
                rows: result3.final,
              }).send(res);
              break;
            case "hour":
              for (
                let m = moment(current_start_date).set({
                  hour: 0,
                  minute: 0,
                  second: 0,
                });
                m <=
                moment(current_end_date).set({
                  hour: 23,
                  minute: 59,
                  second: 59,
                });
                m.add(1, "hours")
              ) {
                let _currentStartDate = m.format("YYYY-MM-DD HH:mm"),
                  _actualStartDate =
                    moment(current_start_date).format("YYYY-MM-DD HH:mm"),
                  _lastDate = moment(m).format("YYYY-MM-DD HH:mm"),
                  _actualEndDate = moment(current_end_date)
                    .set({ hour: 23, minute: 59, second: 59 })
                    .format("YYYY-MM-DD HH:mm");
                if (
                  (_lastDate <= _actualEndDate ||
                    _actualEndDate >= _currentStartDate) &&
                  _actualStartDate <= _currentStartDate
                ) {
                  dateRange = getDateRange(m, _lastDate, "YYYY-MM-DD HH");
                  arrayOfDatesOfCurrent.push(
                    dateRange.map(function (item: any) {
                      return {
                        created_date: item,
                        start_date: _currentStartDate,
                        end_date: _lastDate,
                        current: 0,
                      };
                    })
                  );
                }
                _lastDate = moment(moment(m).add(1, "hours")).format(
                  "YYYY-MM-DD HH:mm"
                );
              }
              for (
                let m = moment(past_start_date).set({
                  hour: 0,
                  minute: 0,
                  second: 0,
                });
                m <=
                moment(past_end_date).set({ hour: 23, minute: 59, second: 59 });
                m.add(1, "hours")
              ) {
                let _currentStartDate = m.format("YYYY-MM-DD HH:mm"),
                  _actualStartDate =
                    moment(past_start_date).format("YYYY-MM-DD HH:mm"),
                  _lastDate = moment(m).format("YYYY-MM-DD HH:mm"),
                  _actualEndDate = moment(past_end_date)
                    .set({ hour: 23, minute: 59, second: 59 })
                    .format("YYYY-MM-DD HH:mm");
                if (
                  (_lastDate <= _actualEndDate ||
                    _actualEndDate >= _currentStartDate) &&
                  _actualStartDate <= _currentStartDate
                ) {
                  dateRange = getDateRange(m, _lastDate, "YYYY-MM-DD HH");
                  arrayOfDatesOfPrevious.push(
                    dateRange.map(function (item: any) {
                      return {
                        created_date: item,
                        start_date: _currentStartDate,
                        end_date: _lastDate,
                        previous: 0,
                      };
                    })
                  );
                }
                _lastDate = moment(moment(m).add(1, "hours")).format(
                  "YYYY-MM-DD HH:mm"
                );
              }
              let result4 = getCounts(
                arrayOfDatesOfCurrent,
                arrayOfDatesOfPrevious,
                by
              );
              new SuccessResponse(EC.errorMessage(EC.getMessage), {
                // @ts-ignore
                token: req.token,
                current: result4.current_count,
                previous: result4.previous_count,
                rows: result4.final,
              }).send(res);
              break;
            default:
              new SuccessResponse(EC.errorMessage(EC.success), {
                // @ts-ignore
                token: req.token,
                rows: [],
              }).send(res);
              break;
          }
        } else
          new SuccessResponse(EC.noDataFound, {
            current: 0,
            previous: 0,
            rows: [],
          }).send(res);
      } else {
        throw new Error(EC.errorMessage("Please provide all data."));
      }
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
  public ordersAndProductSoldGraph = async (req: Request, res: Response) => {
    try {
      let { current_range, previous_range, filter, type } = req.body;
      let attributes: any = [
        [
          dbReader.Sequelize.fn(
            "DATE_FORMAT",
            dbReader.sequelize.literal(
              "`user_order_item->user_order`.`created_datetime`"
            ),
            "%Y-%m-%d"
          ),
          "created_datetime",
        ],
        [
          dbReader.Sequelize.literal("`user_order_item`.`product_amount`"),
          "product_amount",
        ],
      ];
      switch (filter) {
        case "hour":
          attributes = [
            [
              dbReader.Sequelize.literal(
                "`user_order_item->user_order`.`created_datetime`"
              ),
              "created_datetime",
            ],
            [
              dbReader.Sequelize.literal("`user_order_item`.`product_amount`"),
              "product_amount",
            ],
          ];
          break;
      }

      let includeCondition = [
        {
          required: true,
          model: dbReader.userOrderItems,
          attributes: [],
          where: { item_type: 1 },
          include: [
            {
              required: true,
              model: dbReader.userOrder,
              where: {
                order_status: [2, 3, 4, 5, 6, 8],
              },
              attributes: [],
              include: [
                {
                  required: true,
                  model: dbReader.transactionMaster,
                  where: { status: "Success" },
                  attributes: [],
                },
              ],
            },
          ],
        },
      ];

      let whereCondition = dbReader.sequelize.and(
        dbReader.Sequelize.or(
          dbReader.Sequelize.and(
            dbReader.Sequelize.where(
              dbReader.Sequelize.fn(
                "DATE_FORMAT",
                dbReader.sequelize.col(
                  "`user_order_item->user_order`.`created_datetime`"
                ),
                "%Y-%m-%d"
              ),
              { [Op.gte]: current_range.start_date }
            ),
            dbReader.Sequelize.where(
              dbReader.Sequelize.fn(
                "DATE_FORMAT",
                dbReader.sequelize.col(
                  "`user_order_item->user_order`.`created_datetime`"
                ),
                "%Y-%m-%d"
              ),
              { [Op.lte]: current_range.end_date }
            )
          ),
          dbReader.Sequelize.and(
            dbReader.Sequelize.where(
              dbReader.Sequelize.fn(
                "DATE_FORMAT",
                dbReader.sequelize.col(
                  "`user_order_item->user_order`.`created_datetime`"
                ),
                "%Y-%m-%d"
              ),
              { [Op.gte]: previous_range.start_date }
            ),
            dbReader.Sequelize.where(
              dbReader.Sequelize.fn(
                "DATE_FORMAT",
                dbReader.sequelize.col(
                  "`user_order_item->user_order`.`created_datetime`"
                ),
                "%Y-%m-%d"
              ),
              { [Op.lte]: previous_range.end_date }
            )
          )
        ),
        { is_deleted: 0 }
      );

      let productData = await dbReader.products.findAll({
        attributes: attributes,
        where: whereCondition,
        include: includeCondition,
        // group: ['created_date']
      });
      if (productData.length > 0) {
        productData = JSON.parse(JSON.stringify(productData));
        let dateRange,
          arrayOfDatesOfCurrent: any = [],
          arrayOfDatesOfPrevious: any = [],
          final: any = [];
        let getCounts = (arrCurrent: any, arrPrevious: any, type1: string) => {
          let final: any = [];
          if (type1 == "hour") {
            for (let ele of arrCurrent) {
              for (let obj of ele) {
                for (let value of productData) {
                  if (
                    obj.created_date ==
                    moment(value.created_datetime).format("YYYY-MM-DD HH")
                  ) {
                    if (type == "net_sale") {
                      obj.current += value.product_amount;
                    } else {
                      obj.current++;
                    }
                  }
                }
              }
            }
            for (let ele of arrPrevious) {
              for (let obj of ele) {
                for (let value of productData) {
                  if (
                    obj.created_date ==
                    moment(value.created_datetime).format("YYYY-MM-DD HH")
                  ) {
                    if (type == "net_sale") {
                      obj.previous += value.product_amount;
                    } else {
                      obj.previous++;
                    }
                  }
                }
              }
            }
            for (let i = 0; i < arrCurrent.length; i++) {
              let current: any = { current_count: 0 },
                previous: any = { previous_count: 0 };
              for (let j = 0; j < arrCurrent[i].length; j++) {
                current.start_date = arrCurrent[i][j].start_date;
                current.end_date = arrCurrent[i][j].end_date;
                current.current_count += arrCurrent[i][j].current;
              }
              for (let j = 0; j < arrPrevious[i].length; j++) {
                previous.start_date = arrPrevious[i][j].start_date;
                previous.end_date = arrPrevious[i][j].end_date;
                previous.previous_count += arrPrevious[i][j].previous;
              }
              final.push({ current: current, previous: previous });
            }
          } else {
            for (let ele of arrCurrent) {
              for (let obj of ele) {
                for (let value of productData) {
                  if (obj.created_date == value.created_datetime) {
                    if (type == "net_sale") {
                      obj.current += value.product_amount;
                    } else {
                      obj.current++;
                    }
                  }
                }
              }
            }
            for (let ele of arrPrevious) {
              for (let obj of ele) {
                for (let value of productData) {
                  if (obj.created_date == value.created_datetime) {
                    if (type == "net_sale") {
                      obj.previous += value.product_amount;
                    } else {
                      obj.previous++;
                    }
                  }
                }
              }
            }
            for (let i = 0; i < arrCurrent.length; i++) {
              let current: any = { current_count: 0 },
                previous: any = { previous_count: 0 };
              for (let j = 0; j < arrCurrent[i].length; j++) {
                current.start_date = arrCurrent[i][j].start_date;
                current.end_date = arrCurrent[i][j].end_date;
                current.current_count += arrCurrent[i][j].current;
              }
              for (let j = 0; j < arrPrevious[i].length; j++) {
                previous.start_date = arrPrevious[i][j].start_date;
                previous.end_date = arrPrevious[i][j].end_date;
                previous.previous_count += arrPrevious[i][j].previous;
              }
              final.push({ current: current, previous: previous });
            }
            final.reverse();
          }
          let current_count = 0,
            previous_count = 0;
          final.forEach((e: any) => {
            current_count += e.current.current_count;
            previous_count += e.previous.previous_count;
          });
          return { current_count, previous_count, final };
        };
        switch (filter) {
          case "day": //by day
            var daysOfYear1: any = [],
              daysOfYear2: any = [];
            let dateRangeOfCurrent = getDateRange(
              current_range.start_date,
              current_range.end_date,
              "YYYY-MM-DD"
            );
            let dateRangeOfPrevious = getDateRange(
              previous_range.start_date,
              previous_range.end_date,
              "YYYY-MM-DD"
            );
            daysOfYear1 = dateRangeOfCurrent.map(function (item: any) {
              return {
                created_date: item,
                start_date: item,
                end_date: item,
                current: 0,
              };
            });
            daysOfYear2 = dateRangeOfPrevious.map(function (item: any) {
              return {
                created_date: item,
                start_date: item,
                end_date: item,
                previous: 0,
              };
            });
            daysOfYear1.reverse();
            daysOfYear2.reverse();
            for (let ele of daysOfYear1) {
              for (let value of productData) {
                if (ele.created_date == value.created_datetime) {
                  ele.current++;
                }
              }
            }
            for (let ele of daysOfYear2) {
              for (let value of productData) {
                if (ele.created_date == value.created_datetime) {
                  ele.previous++;
                }
              }
            }
            let final: any = [];
            for (
              let i = 0;
              i < Math.min(daysOfYear1.length, daysOfYear2.length);
              i++
            ) {
              let current: any = { current_count: 0 },
                previous: any = { previous_count: 0 };
              current.start_date = daysOfYear1[i].start_date;
              current.end_date = daysOfYear1[i].end_date;
              current.current_count = daysOfYear1[i].current;
              previous.start_date = daysOfYear2[i].start_date;
              previous.end_date = daysOfYear2[i].end_date;
              previous.previous_count = daysOfYear2[i].previous;
              final.push({ current: current, previous: previous });
            }
            //final.reverse();
            let current_count = 0,
              previous_count = 0;
            final.forEach((e: any) => {
              current_count += e.current.current_count;
              previous_count += e.previous.previous_count;
            });
            new SuccessResponse(
              EC.errorMessage(EC.getMessage, ["New Production Chart Data"]),
              {
                // @ts-ignore
                token: req.token,
                current: current_count,
                previous: previous_count,
                rows: final,
              }
            ).send(res);
            break;
          case "week": //by week
            moment.updateLocale("in", {
              week: {
                dow: 1, // Monday is the first day of the week
              },
            });
            var now1 = new Date(current_range.end_date);
            var daysOfYear1: any = [];
            for (
              var d = new Date(current_range.start_date);
              d <= now1;
              d.setDate(d.getDate() + 1)
            ) {
              let week = moment(d).week();
              if (daysOfYear1.some((s: any) => s.week == week)) {
                let fi = daysOfYear1.findIndex((s: any) => s.week == week);
                daysOfYear1[fi].end_date = moment(d).format("YYYY-MM-DD");
              } else {
                daysOfYear1.push({
                  week: week,
                  start_date: moment(d).format("YYYY-MM-DD"),
                  end_date: moment(d).format("YYYY-MM-DD"),
                });
              }
            }
            var now2 = new Date(previous_range.end_date);
            var daysOfYear2: any = [];
            for (
              var d = new Date(previous_range.start_date);
              d <= now2;
              d.setDate(d.getDate() + 1)
            ) {
              let week = moment(d).week();
              if (daysOfYear2.some((s: any) => s.week == week)) {
                let fi = daysOfYear2.findIndex((s: any) => s.week == week);
                daysOfYear2[fi].end_date = moment(d).format("YYYY-MM-DD");
              } else {
                daysOfYear2.push({
                  week: week,
                  start_date: moment(d).format("YYYY-MM-DD"),
                  end_date: moment(d).format("YYYY-MM-DD"),
                });
              }
            }
            daysOfYear1.reverse();
            daysOfYear2.reverse();
            for (
              let index = 0;
              index < Math.min(daysOfYear1.length, daysOfYear2.length);
              index++
            ) {
              let startDate1 = daysOfYear1[index].start_date;
              let lastDate1 = daysOfYear1[index].end_date;
              let startDate2 = daysOfYear2[index].start_date;
              let lastDate2 = daysOfYear2[index].end_date;
              dateRange = getDateRange(startDate1, lastDate1, "YYYY-MM-DD");
              arrayOfDatesOfCurrent.push(
                dateRange.map(function (item) {
                  return {
                    created_date: item,
                    start_date: startDate1,
                    end_date: lastDate1,
                    current: 0,
                  };
                })
              );
              dateRange = getDateRange(startDate2, lastDate2, "YYYY-MM-DD");
              arrayOfDatesOfPrevious.push(
                dateRange.map(function (item) {
                  return {
                    created_date: item,
                    start_date: startDate2,
                    end_date: lastDate2,
                    previous: 0,
                  };
                })
              );
            }
            let result1 = getCounts(
              arrayOfDatesOfCurrent,
              arrayOfDatesOfPrevious,
              filter
            );
            new SuccessResponse(
              EC.errorMessage(EC.getMessage, ["New Subscription Chart Data"]),
              {
                // @ts-ignore
                token: req.token,
                current: result1.current_count,
                previous: result1.previous_count,
                rows: result1.final,
              }
            ).send(res);
            break;
          case "month": //by week
            var now1 = new Date(current_range.end_date);
            var daysOfYear1: any = [];
            for (
              var d = new Date(current_range.start_date);
              d <= now1;
              d.setDate(d.getDate() + 1)
            ) {
              let month = moment(d).format("MM");
              if (daysOfYear1.some((s: any) => s.month == month)) {
                let fi = daysOfYear1.findIndex((s: any) => s.month == month);
                daysOfYear1[fi].end_date = moment(d).format("YYYY-MM-DD");
              } else {
                daysOfYear1.push({
                  month: month,
                  start_date: moment(d).format("YYYY-MM-DD"),
                  end_date: moment(d).format("YYYY-MM-DD"),
                });
              }
            }
            var now2 = new Date(previous_range.end_date);
            var daysOfYear2: any = [];
            for (
              var d = new Date(previous_range.start_date);
              d <= now2;
              d.setDate(d.getDate() + 1)
            ) {
              let month = moment(d).format("MM");
              if (daysOfYear2.some((s: any) => s.month == month)) {
                let fi = daysOfYear2.findIndex((s: any) => s.month == month);
                daysOfYear2[fi].end_date = moment(d).format("YYYY-MM-DD");
              } else {
                daysOfYear2.push({
                  month: month,
                  start_date: moment(d).format("YYYY-MM-DD"),
                  end_date: moment(d).format("YYYY-MM-DD"),
                });
              }
            }
            daysOfYear1.reverse();
            daysOfYear2.reverse();
            for (
              let index = 0;
              index < Math.min(daysOfYear1.length, daysOfYear2.length);
              index++
            ) {
              let startDate1 = daysOfYear1[index].start_date;
              let lastDate1 = daysOfYear1[index].end_date;
              let startDate2 = daysOfYear2[index].start_date;
              let lastDate2 = daysOfYear2[index].end_date;
              dateRange = getDateRange(startDate1, lastDate1, "YYYY-MM-DD");
              arrayOfDatesOfCurrent.push(
                dateRange.map(function (item) {
                  return {
                    created_date: item,
                    start_date: startDate1,
                    end_date: lastDate1,
                    current: 0,
                  };
                })
              );
              dateRange = getDateRange(startDate2, lastDate2, "YYYY-MM-DD");
              arrayOfDatesOfPrevious.push(
                dateRange.map(function (item) {
                  return {
                    created_date: item,
                    start_date: startDate2,
                    end_date: lastDate2,
                    previous: 0,
                  };
                })
              );
            }
            let result2 = getCounts(
              arrayOfDatesOfCurrent,
              arrayOfDatesOfPrevious,
              filter
            );
            new SuccessResponse(
              EC.errorMessage(EC.getMessage, ["New Subscription Chart Data"]),
              {
                // @ts-ignore
                token: req.token,
                current: result2.current_count,
                previous: result2.previous_count,
                rows: result2.final,
              }
            ).send(res);
            break;
          case "quarter": //by quarter
            var daysOfYear1: any = [],
              daysOfYear2: any = [];
            for (
              let m = moment(current_range.start_date);
              m <= moment(current_range.end_date);
              m.add(3, "M")
            ) {
              let _currentStartDate = m.format("YYYY-MM-DD"),
                _actualStartDate = moment(current_range.start_date).format(
                  "YYYY-MM-DD"
                ),
                _lastDate = moment(moment(m).add(3, "M")).format("YYYY-MM-DD"),
                _actualEndDate = moment(current_range.end_date).format(
                  "YYYY-MM-DD"
                );
              if (
                (_lastDate <= _actualEndDate ||
                  _actualEndDate >= _currentStartDate) &&
                _actualStartDate <= _currentStartDate
              ) {
                dateRange = getDateRange(m, _lastDate, "YYYY-MM-DD");
                daysOfYear1.push(
                  dateRange.map(function (item: any) {
                    return {
                      created_date: item,
                      start_date: _currentStartDate,
                      end_date: _lastDate,
                      current: 0,
                    };
                  })
                );
              }
            }
            for (
              let m = moment(previous_range.start_date);
              m <= moment(previous_range.end_date);
              m.add(3, "M")
            ) {
              let _currentStartDate = m.format("YYYY-MM-DD"),
                _actualStartDate = moment(previous_range.start_date).format(
                  "YYYY-MM-DD"
                ),
                _lastDate = moment(moment(m).add(3, "M")).format("YYYY-MM-DD"),
                _actualEndDate = moment(previous_range.end_date).format(
                  "YYYY-MM-DD"
                );
              if (
                (_lastDate <= _actualEndDate ||
                  _actualEndDate >= _currentStartDate) &&
                _actualStartDate <= _currentStartDate
              ) {
                dateRange = getDateRange(m, _lastDate, "YYYY-MM-DD");
                daysOfYear2.push(
                  dateRange.map(function (item: any) {
                    return {
                      created_date: item,
                      start_date: _currentStartDate,
                      end_date: _lastDate,
                      previous: 0,
                    };
                  })
                );
              }
            }
            daysOfYear1.reverse();
            daysOfYear2.reverse();
            for (
              let index = 0;
              index < Math.min(daysOfYear1.length, daysOfYear2.length);
              index++
            ) {
              arrayOfDatesOfCurrent.push(daysOfYear1[index]);
              arrayOfDatesOfPrevious.push(daysOfYear2[index]);
            }
            let result3 = getCounts(
              arrayOfDatesOfCurrent,
              arrayOfDatesOfPrevious,
              filter
            );
            new SuccessResponse(
              EC.errorMessage(EC.getMessage, ["New Subscription Chart Data"]),
              {
                // @ts-ignore
                token: req.token,
                current: result3.current_count,
                previous: result3.previous_count,
                rows: result3.final,
              }
            ).send(res);
            break;
          case "hour": //by hour
            for (
              let m = moment(current_range.start_date).set({
                hour: 0,
                minute: 0,
                second: 0,
              });
              m <=
              moment(current_range.end_date).set({
                hour: 23,
                minute: 59,
                second: 59,
              });
              m.add(1, "hours")
            ) {
              let _currentStartDate = m.format("YYYY-MM-DD HH:mm"),
                _actualStartDate = moment(current_range.start_date).format(
                  "YYYY-MM-DD HH:mm"
                ),
                _lastDate = moment(m).format("YYYY-MM-DD HH:mm"),
                _actualEndDate = moment(current_range.end_date)
                  .set({ hour: 23, minute: 59, second: 59 })
                  .format("YYYY-MM-DD HH:mm");
              if (
                (_lastDate <= _actualEndDate ||
                  _actualEndDate >= _currentStartDate) &&
                _actualStartDate <= _currentStartDate
              ) {
                dateRange = getDateRange(m, _lastDate, "YYYY-MM-DD HH");
                arrayOfDatesOfCurrent.push(
                  dateRange.map(function (item: any) {
                    return {
                      created_date: item,
                      start_date: _currentStartDate,
                      end_date: _lastDate,
                      current: 0,
                    };
                  })
                );
              }
              _lastDate = moment(moment(m).add(1, "hours")).format(
                "YYYY-MM-DD HH:mm"
              );
            }
            for (
              let m = moment(previous_range.start_date).set({
                hour: 0,
                minute: 0,
                second: 0,
              });
              m <=
              moment(previous_range.end_date).set({
                hour: 23,
                minute: 59,
                second: 59,
              });
              m.add(1, "hours")
            ) {
              let _currentStartDate = m.format("YYYY-MM-DD HH:mm"),
                _actualStartDate = moment(previous_range.start_date).format(
                  "YYYY-MM-DD HH:mm"
                ),
                _lastDate = moment(m).format("YYYY-MM-DD HH:mm"),
                _actualEndDate = moment(previous_range.end_date)
                  .set({ hour: 23, minute: 59, second: 59 })
                  .format("YYYY-MM-DD HH:mm");
              if (
                (_lastDate <= _actualEndDate ||
                  _actualEndDate >= _currentStartDate) &&
                _actualStartDate <= _currentStartDate
              ) {
                dateRange = getDateRange(m, _lastDate, "YYYY-MM-DD HH");
                arrayOfDatesOfPrevious.push(
                  dateRange.map(function (item: any) {
                    return {
                      created_date: item,
                      start_date: _currentStartDate,
                      end_date: _lastDate,
                      previous: 0,
                    };
                  })
                );
              }
              _lastDate = moment(moment(m).add(1, "hours")).format(
                "YYYY-MM-DD HH:mm"
              );
            }
            let result4 = getCounts(
              arrayOfDatesOfCurrent,
              arrayOfDatesOfPrevious,
              filter
            );
            new SuccessResponse(
              EC.errorMessage(EC.getMessage, ["New Production Chart Data"]),
              {
                // @ts-ignore
                token: req.token,
                current: result4.current_count,
                previous: result4.previous_count,
                rows: result4.final,
              }
            ).send(res);
            break;
        }
      } else
        new SuccessResponse(EC.noDataFound, {
          rows: [],
        }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
  public async salesAnalyticsGraph(req: Request, res: Response) {
    try {
      let date = new Date();
      //Get Current Month Data From Database
      let startOfMonth, endOfMonth;
      if (req.body.month) {
        startOfMonth = moment(
          new Date(date.getFullYear() + "-" + req.body.month + "-01")
        ).format("YYYY-MM-DD");
        endOfMonth = moment(
          new Date(date.getFullYear(), req.body.month, 0)
        ).format("YYYY-MM-DD");
      } else {
        startOfMonth = moment(
          new Date(date.getFullYear() + "-" + (date.getMonth() + 1) + "-01")
        ).format("YYYY-MM-DD");
        endOfMonth = moment(
          new Date(date.getFullYear(), date.getMonth() + 1, 0)
        ).format("YYYY-MM-DD");
      }

      let currentMonthDates = [startOfMonth, endOfMonth];
      const currentMonthTopSellingProduct =
        await dbReader.userOrderItems.findAll({
          include: [
            {
              model: dbReader.products,
              attributes: ["product_description"],
            },
          ],
          attributes: [
            "product_id",
            "product_name",
            [
              dbReader.sequelize.literal(
                "SUM(user_order_items.product_amount - user_order_items.coupon_amount + user_order_items.shipping_fees + user_order_items.processing_fees)"
              ),
              "total_net_sales",
            ],
            [
              dbReader.Sequelize.fn(
                "COUNT",
                dbReader.Sequelize.col("user_order_items.product_id")
              ),
              "total_product",
            ],
          ],
          group: "product_id",
          where: {
            created_datetime: { [Op.between]: currentMonthDates },
            item_type: 1,
          },
          order: [[dbReader.Sequelize.literal("total_net_sales"), "DESC"]],
          // limit: 3
        });
      let filteredValuesOfCurrentMonth: any = [];
      currentMonthTopSellingProduct.filter((obj: any) => {
        filteredValuesOfCurrentMonth.push(obj.dataValues);
      });
      let totalGrossSale = 0;
      filteredValuesOfCurrentMonth.map((data: any) => {
        delete data.sycu_product;
        totalGrossSale += data.total_net_sales;
      });
      filteredValuesOfCurrentMonth.map((data: any) => {
        data.gross_sale = totalGrossSale;
        data.percentage = (
          (data.total_net_sales / totalGrossSale) *
          100
        ).toFixed(2);
      });

      let salesAnalytics = [
        { percentage: 46.7, title: "product1", amount: 2132 },
        { percentage: 31.7, title: "product2", amount: 1763 },
        { percentage: 21.7, title: "product3", amount: 973 },
      ];
      new SuccessResponse(EC.success, {
        //@ts-ignore
        token: req.token,

        salesAnalytics: filteredValuesOfCurrentMonth,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
  public async netDiscountedAmountGraph(req: Request, res: Response) {
    try {
      let { range, compared_range, by, type } = req.body;
      let subWhereCon = dbReader.Sequelize.Op.ne,
        subWhereData = null;
      if (type) {
        switch (type) {
          case "coupons":
            subWhereCon = dbReader.Sequelize.Op.eq;
            subWhereData = 5;
            break;
        }
      }
      let attributes: any = [
        [
          dbReader.sequelize.literal("`user_orders`.`created_datetime`"),
          "created_datetime",
        ],
        "user_orders_id",
      ];
      let attributes1: any = ["status", "refund_amount", "created_datetime"];
      switch (by) {
        case "day":
          attributes = [
            [
              dbReader.Sequelize.fn(
                "DATE_FORMAT",
                dbReader.sequelize.literal("`user_orders`.`created_datetime`"),
                "%Y-%m-%d"
              ),
              "created_datetime",
            ],
            "user_orders_id",
          ];
          attributes1 = [
            [
              dbReader.Sequelize.fn(
                "DATE_FORMAT",
                dbReader.sequelize.literal("created_datetime"),
                "%Y-%m-%d"
              ),
              "created_datetime",
            ],
            "status",
            "refund_amount",
          ];
          break;
        case "week":
          attributes = [
            [
              dbReader.Sequelize.fn(
                "DATE_FORMAT",
                dbReader.sequelize.literal("`user_orders`.`created_datetime`"),
                "%Y-%m-%d"
              ),
              "created_datetime",
            ],
            "user_orders_id",
          ];
          attributes1 = [
            [
              dbReader.Sequelize.fn(
                "DATE_FORMAT",
                dbReader.sequelize.literal("created_datetime"),
                "%Y-%m-%d"
              ),
              "created_datetime",
            ],
            "status",
            "refund_amount",
          ];
          break;
        case "month":
          attributes = [
            [
              dbReader.Sequelize.fn(
                "DATE_FORMAT",
                dbReader.sequelize.literal("`user_orders`.`created_datetime`"),
                "%Y-%m"
              ),
              "created_datetime",
            ],
            "user_orders_id",
          ];
          attributes1 = [
            [
              dbReader.Sequelize.fn(
                "DATE_FORMAT",
                dbReader.sequelize.literal("created_datetime"),
                "%Y-%m"
              ),
              "created_datetime",
            ],
            "status",
            "refund_amount",
          ];
          break;
        case "quarter":
          attributes = [
            [
              dbReader.Sequelize.fn(
                "DATE_FORMAT",
                dbReader.sequelize.literal("`user_orders`.`created_datetime`"),
                "%Y-%m"
              ),
              "created_datetime",
            ],
            "user_orders_id",
          ];
          attributes1 = [
            [
              dbReader.Sequelize.fn(
                "DATE_FORMAT",
                dbReader.sequelize.literal("created_datetime"),
                "%Y-%m"
              ),
              "created_datetime",
            ],
            "status",
            "refund_amount",
          ];
          break;
      }
      let currentYearData = await dbReader.userOrder.findAll({
        attributes: attributes,
        where: dbReader.sequelize.and(
          { order_status: [2, 3, 4, 5, 6, 8] },
          dbReader.Sequelize.or(
            dbReader.Sequelize.and(
              dbReader.Sequelize.where(
                dbReader.Sequelize.fn(
                  "DATE_FORMAT",
                  dbReader.sequelize.literal(
                    "`user_orders`.`created_datetime`"
                  ),
                  "%Y-%m-%d"
                ),
                { [dbReader.Sequelize.Op.gte]: range.start_date }
              ),
              dbReader.Sequelize.where(
                dbReader.Sequelize.fn(
                  "DATE_FORMAT",
                  dbReader.sequelize.literal(
                    "`user_orders`.`created_datetime`"
                  ),
                  "%Y-%m-%d"
                ),
                { [dbReader.Sequelize.Op.lte]: range.end_date }
              )
            ),
            dbReader.Sequelize.and(
              dbReader.Sequelize.where(
                dbReader.Sequelize.fn(
                  "DATE_FORMAT",
                  dbReader.sequelize.literal(
                    "`user_orders`.`created_datetime`"
                  ),
                  "%Y-%m-%d"
                ),
                { [dbReader.Sequelize.Op.gte]: compared_range.start_date }
              ),
              dbReader.Sequelize.where(
                dbReader.Sequelize.fn(
                  "DATE_FORMAT",
                  dbReader.sequelize.literal(
                    "`user_orders`.`created_datetime`"
                  ),
                  "%Y-%m-%d"
                ),
                { [dbReader.Sequelize.Op.lte]: compared_range.end_date }
              )
            )
          )
        ),
        include: [
          {
            separate: true,
            model: dbReader.userOrderItems,
            where: { item_type: { [subWhereCon]: subWhereData } },
            attributes: [
              "item_type",
              "product_amount",
              "user_orders_id",
              "created_datetime",
            ],
          },
          {
            model: dbReader.transactionMaster,
            where: { status: "Success" },
            attributes: [],
          },
        ],
      });
      currentYearData = JSON.parse(JSON.stringify(currentYearData));
      let currentYearRefundData = await dbReader.refunds.findAll({
        attributes: attributes1,
        where: dbReader.sequelize.and(
          dbReader.Sequelize.or(
            dbReader.Sequelize.and(
              dbReader.Sequelize.where(
                dbReader.Sequelize.fn(
                  "DATE_FORMAT",
                  dbReader.sequelize.literal("`created_datetime`"),
                  "%Y-%m-%d"
                ),
                { [dbReader.Sequelize.Op.gte]: range.start_date }
              ),
              dbReader.Sequelize.where(
                dbReader.Sequelize.fn(
                  "DATE_FORMAT",
                  dbReader.sequelize.literal("`created_datetime`"),
                  "%Y-%m-%d"
                ),
                { [dbReader.Sequelize.Op.lte]: range.end_date }
              )
            ),
            dbReader.Sequelize.and(
              dbReader.Sequelize.where(
                dbReader.Sequelize.fn(
                  "DATE_FORMAT",
                  dbReader.sequelize.literal("`created_datetime`"),
                  "%Y-%m-%d"
                ),
                { [dbReader.Sequelize.Op.gte]: compared_range.start_date }
              ),
              dbReader.Sequelize.where(
                dbReader.Sequelize.fn(
                  "DATE_FORMAT",
                  dbReader.sequelize.literal("`created_datetime`"),
                  "%Y-%m-%d"
                ),
                { [dbReader.Sequelize.Op.lte]: compared_range.end_date }
              )
            )
          )
        ),
      });
      currentYearRefundData = JSON.parse(JSON.stringify(currentYearRefundData));
      if (currentYearData || currentYearRefundData) {
        let returnData: any = [];
        switch (by) {
          case "quarter":
            let by_quarterly_date1: any = moment(
              range.start_date,
              "DD-MM-YYYY"
            ).format("MM");
            let by_quarterly_date2: any = moment(range.end_date).format("MM");
            let by_quarterly_monthDiff1 =
              by_quarterly_date2 - by_quarterly_date1;
            for (let index = 0; index < by_quarterly_monthDiff1; index++) {
              let d1 = moment(range.start_date)
                .add(index, "M")
                .format("YYYY-MM");
              let d2 = moment(compared_range.start_date)
                .add(index, "M")
                .format("YYYY-MM");
              let d11 = currentYearData.filter(
                (s: any) => s.created_datetime == d1
              );
              let d22 = currentYearData.filter(
                (s: any) => s.created_datetime == d2
              );
              let d111 = 0,
                d222 = 0;
              d11.forEach((ed1: any) => {
                ed1.user_order_items.forEach((e2: any) => {
                  if (type == "coupons" || type == "net_sales") {
                    if (e2.item_type == 5) {
                      if (type == "net_sales") {
                        d111 -= e2.product_amount;
                      } else {
                        d111 += e2.product_amount;
                      }
                    }
                  }
                });
              });
              d22.forEach((ed2: any) => {
                ed2.user_order_items.forEach((e2: any) => {
                  if (type == "coupons" || type == "net_sales") {
                    if (e2.item_type == 5) {
                      if (type == "net_sales") {
                        d222 -= e2.product_amount;
                      } else {
                        d222 += e2.product_amount;
                      }
                    }
                  }
                });
              });
              let _d11 = currentYearRefundData.filter(
                (s: any) => s.created_datetime == d1
              );
              let _d22 = currentYearRefundData.filter(
                (s: any) => s.created_datetime == d2
              );

              if ([0, 1, 2].includes(index)) {
                let td = moment(range.start_date).add(0, "M").format("YYYY-MM");
                let td2 = moment(compared_range.start_date)
                  .add(0, "M")
                  .format("YYYY-MM");
                if (returnData.some((e: any) => e.cp_date_time == td)) {
                  let _tdi = returnData.findIndex(
                    (e: any) => e.cp_date_time == td
                  );
                  returnData[_tdi].cp = returnData[_tdi].cp + d111;
                  returnData[_tdi].pp = returnData[_tdi].pp + d222;
                } else {
                  returnData.push({
                    cp_date_time: td,
                    cp: d111,
                    pp_date_time: td2,
                    pp: d222,
                  });
                }
              } else if ([3, 4, 5].includes(index)) {
                let td = moment(range.start_date).add(3, "M").format("YYYY-MM");
                let td2 = moment(compared_range.start_date)
                  .add(3, "M")
                  .format("YYYY-MM");
                if (returnData.some((e: any) => e.cp_date_time == td)) {
                  let _tdi = returnData.findIndex(
                    (e: any) => e.cp_date_time == td
                  );
                  returnData[_tdi].cp = returnData[_tdi].cp + d111;
                  returnData[_tdi].pp = returnData[_tdi].pp + d222;
                } else {
                  returnData.push({
                    cp_date_time: td,
                    cp: d111,
                    pp_date_time: td2,
                    pp: d222,
                  });
                }
              } else if ([6, 7, 8].includes(index)) {
                let td = moment(range.start_date).add(6, "M").format("YYYY-MM");
                let td2 = moment(compared_range.start_date)
                  .add(6, "M")
                  .format("YYYY-MM");
                if (returnData.some((e: any) => e.cp_date_time == td)) {
                  let _tdi = returnData.findIndex(
                    (e: any) => e.cp_date_time == td
                  );
                  returnData[_tdi].cp = returnData[_tdi].cp + d111;
                  returnData[_tdi].pp = returnData[_tdi].pp + d222;
                } else {
                  returnData.push({
                    cp_date_time: td,
                    cp: d111,
                    pp_date_time: td2,
                    pp: d222,
                  });
                }
              } else if ([9, 10, 11].includes(index)) {
                let td = moment(range.start_date).add(9, "M").format("YYYY-MM");
                let td2 = moment(compared_range.start_date)
                  .add(9, "M")
                  .format("YYYY-MM");
                if (returnData.some((e: any) => e.cp_date_time == td)) {
                  let _tdi = returnData.findIndex(
                    (e: any) => e.cp_date_time == td
                  );
                  returnData[_tdi].cp = returnData[_tdi].cp + d111;
                  returnData[_tdi].pp = returnData[_tdi].pp + d222;
                } else {
                  returnData.push({
                    cp_date_time: td,
                    cp: d111,
                    pp_date_time: td2,
                    pp: d222,
                  });
                }
              }
            }
            break;
          case "month":
            var now1 = new Date(range.end_date);
            var now11 = new Date(range.start_date);
            var daysOfYear1: any = [];
            for (var d = now11; d <= now1; d.setDate(d.getDate() + 1)) {
              let month = moment(d).format("MM");
              if (daysOfYear1.some((s: any) => s.month == month)) {
                let fi = daysOfYear1.findIndex((s: any) => s.month == month);
                daysOfYear1[fi].end_date = moment(d).format("YYYY-MM-DD");
              } else {
                daysOfYear1.push({
                  month: month,
                  start_date: moment(d).format("YYYY-MM-DD"),
                  end_date: moment(d).format("YYYY-MM-DD"),
                });
              }
            }
            var now2 = new Date(compared_range.end_date);
            var now22 = new Date(compared_range.start_date);
            var daysOfYear2: any = [];
            for (var d = now22; d <= now2; d.setDate(d.getDate() + 1)) {
              let month = moment(d).format("MM");
              if (daysOfYear2.some((s: any) => s.month == month)) {
                let fi = daysOfYear2.findIndex((s: any) => s.month == month);
                daysOfYear2[fi].end_date = moment(d).format("YYYY-MM-DD");
              } else {
                daysOfYear2.push({
                  month: month,
                  start_date: moment(d).format("YYYY-MM-DD"),
                  end_date: moment(d).format("YYYY-MM-DD"),
                });
              }
            }
            daysOfYear1.reverse();
            daysOfYear2.reverse();
            for (
              let index = 0;
              index < Math.min(daysOfYear1.length, daysOfYear2.length);
              index++
            ) {
              let startDate1 = daysOfYear1[index]
                ? daysOfYear1[index].start_date
                : "";
              let lastDate1 = daysOfYear1[index]
                ? daysOfYear1[index].end_date
                : "";
              let startDate2 = daysOfYear2[index]
                ? daysOfYear2[index].start_date
                : "";
              let lastDate2 = daysOfYear2[index]
                ? daysOfYear2[index].end_date
                : "";
              let d1 = moment(startDate1).format("YYYY-MM");
              let d2 = moment(startDate2).format("YYYY-MM");
              let d11 = currentYearData.filter(
                (s: any) => s.created_datetime == d1
              );
              let d22 = currentYearData.filter(
                (s: any) => s.created_datetime == d2
              );
              let d111 = 0,
                d222 = 0;
              d11.forEach((ed1: any) => {
                ed1.user_order_items.forEach((e2: any) => {
                  if (type == "coupons" || type == "net_sales") {
                    if (e2.item_type == 5) {
                      if (type == "net_sales") {
                        d111 -= e2.product_amount;
                      } else {
                        d111 += e2.product_amount;
                      }
                    }
                  }
                });
              });
              d22.forEach((ed2: any) => {
                ed2.user_order_items.forEach((e2: any) => {
                  if (type == "coupons" || type == "net_sales") {
                    if (e2.item_type == 5) {
                      if (type == "net_sales") {
                        d222 -= e2.product_amount;
                      } else {
                        d222 += e2.product_amount;
                      }
                    }
                  }
                });
              });
              let _d11 = currentYearRefundData.filter(
                (s: any) => s.created_datetime == d1
              );
              let _d22 = currentYearRefundData.filter(
                (s: any) => s.created_datetime == d2
              );
              _d11.forEach((ed1: any) => {
                if (type == "refunds" || type == "net_sales") {
                  if (type == "net_sales") {
                    d111 -= ed1.refund_amount;
                  } else {
                    d111 += ed1.refund_amount;
                  }
                }
              });
              _d22.forEach((ed2: any) => {
                if (type == "refunds" || type == "net_sales") {
                  if (type == "net_sales") {
                    d222 -= ed2.refund_amount;
                  } else {
                    d222 += ed2.refund_amount;
                  }
                }
              });
              returnData.push({
                cp_date_time: startDate1,
                cp: d111,
                pp_date_time: startDate2,
                pp: d222,
              });
            }
            returnData.reverse();
            break;
          case "week":
            moment.updateLocale("in", {
              week: {
                dow: 1, // Monday is the first day of the week
              },
            });
            var now1 = new Date(range.end_date);
            var daysOfYear1: any = [];
            for (
              var d = new Date(range.start_date);
              d <= now1;
              d.setDate(d.getDate() + 1)
            ) {
              let week = moment(d).week();
              if (daysOfYear1.some((s: any) => s.week == week)) {
                let fi = daysOfYear1.findIndex((s: any) => s.week == week);
                daysOfYear1[fi].end_date = moment(d).format("YYYY-MM-DD");
              } else {
                daysOfYear1.push({
                  week: week,
                  start_date: moment(d).format("YYYY-MM-DD"),
                  end_date: moment(d).format("YYYY-MM-DD"),
                });
              }
            }
            var now2 = new Date(compared_range.end_date);
            var daysOfYear2: any = [];
            for (
              var d = new Date(compared_range.start_date);
              d <= now2;
              d.setDate(d.getDate() + 1)
            ) {
              let week = moment(d).week();
              if (daysOfYear2.some((s: any) => s.week == week)) {
                let fi = daysOfYear2.findIndex((s: any) => s.week == week);
                daysOfYear2[fi].end_date = moment(d).format("YYYY-MM-DD");
              } else {
                daysOfYear2.push({
                  week: week,
                  start_date: moment(d).format("YYYY-MM-DD"),
                  end_date: moment(d).format("YYYY-MM-DD"),
                });
              }
            }
            daysOfYear1.reverse();
            daysOfYear2.reverse();
            for (
              let index = 0;
              index < Math.min(daysOfYear1.length, daysOfYear2.length);
              index++
            ) {
              let startDate1 = daysOfYear1[index]
                ? daysOfYear1[index].start_date
                : "";
              let lastDate1 = daysOfYear1[index]
                ? daysOfYear1[index].end_date
                : "";
              let startDate2 = daysOfYear2[index]
                ? daysOfYear2[index].start_date
                : "";
              let lastDate2 = daysOfYear2[index]
                ? daysOfYear2[index].end_date
                : "";
              let DR1 = currentYearData.filter(
                (s: any) =>
                  s.created_datetime >= startDate1 &&
                  s.created_datetime <= lastDate1
              );
              let _DR1 = currentYearRefundData.filter(
                (s: any) =>
                  s.created_datetime >= startDate1 &&
                  s.created_datetime <= lastDate1
              );
              let DR2 = currentYearData.filter(
                (s: any) =>
                  s.created_datetime >= startDate2 &&
                  s.created_datetime <= lastDate2
              );
              let _DR2 = currentYearRefundData.filter(
                (s: any) =>
                  s.created_datetime >= startDate2 &&
                  s.created_datetime <= lastDate2
              );
              let d111 = 0,
                d222 = 0;
              DR1.forEach((ed1: any) => {
                ed1.user_order_items.forEach((e2: any) => {
                  if (type == "coupons" || type == "net_sales") {
                    if (e2.item_type == 5) {
                      if (type == "net_sales") {
                        d111 -= e2.product_amount;
                      } else {
                        d111 += e2.product_amount;
                      }
                    }
                  }
                });
              });
              DR2.forEach((ed2: any) => {
                ed2.user_order_items.forEach((e2: any) => {
                  if (type == "coupons" || type == "net_sales") {
                    if (e2.item_type == 5) {
                      if (type == "net_sales") {
                        d222 -= e2.product_amount;
                      } else {
                        d222 += e2.product_amount;
                      }
                    }
                  }
                });
              });

              returnData.push({
                cp_date_time: startDate1,
                cp: d111,
                pp_date_time: startDate2,
                pp: d222,
              });
            }
            returnData.reverse();
            break;
          case "day":
            var now1 = new Date(range.end_date);
            var daysOfYear1: any = [];
            for (
              var d = new Date(range.start_date);
              d <= now1;
              d.setDate(d.getDate() + 1)
            ) {
              daysOfYear1.push({
                start_date: moment(d).format("YYYY-MM-DD"),
              });
            }
            var now2 = new Date(compared_range.end_date);
            var daysOfYear2: any = [];
            for (
              var d = new Date(compared_range.start_date);
              d <= now2;
              d.setDate(d.getDate() + 1)
            ) {
              daysOfYear2.push({
                start_date: moment(d).format("YYYY-MM-DD"),
              });
            }
            for (
              let index = 0;
              index < Math.max(daysOfYear1.length, daysOfYear2.length);
              index++
            ) {
              let startDate1 = daysOfYear1[index].start_date || "";
              let startDate2 = daysOfYear2[index].start_date || "";
              let DR1 = currentYearData.filter(
                (s: any) => s.created_datetime == startDate1
              );
              let _DR1 = currentYearRefundData.filter(
                (s: any) => s.created_datetime == startDate1
              );
              let DR2 = currentYearData.filter(
                (s: any) => s.created_datetime == startDate2
              );
              let _DR2 = currentYearRefundData.filter(
                (s: any) => s.created_datetime == startDate2
              );
              let d111 = 0,
                d222 = 0;
              DR1.forEach((ed1: any) => {
                ed1.user_order_items.forEach((e2: any) => {
                  if (type == "coupons" || type == "net_sales") {
                    if (e2.item_type == 5) {
                      if (type == "net_sales") {
                        d111 -= e2.product_amount;
                      } else {
                        d111 += e2.product_amount;
                      }
                    }
                  }
                });
              });
              DR2.forEach((ed2: any) => {
                ed2.user_order_items.forEach((e2: any) => {
                  if (type == "coupons" || type == "net_sales") {
                    if (e2.item_type == 5) {
                      if (type == "net_sales") {
                        d222 -= e2.product_amount;
                      } else {
                        d222 += e2.product_amount;
                      }
                    }
                  }
                });
              });

              returnData.push({
                cp_date_time: daysOfYear1[index].start_date || "",
                cp: d111,
                pp_date_time: daysOfYear2[index].start_date || "",
                pp: d222,
              });
            }
            break;
          case "hour":
            function diff_hours(dt2: Date, dt1: Date) {
              var diff = (dt2.getTime() - dt1.getTime()) / 1000;
              diff /= 60 * 60;
              return Math.abs(Math.round(diff));
            }
            let DR1 = diff_hours(
              new Date(range.start_date),
              new Date(range.end_date + " 23:59:59")
            );
            let a = moment(range.end_date)
              .set({ hour: 23, minute: 59, second: 59 })
              .diff(
                moment(range.start_date).set({
                  hour: 0o0,
                  minute: 0o0,
                  second: 0o0,
                }),
                "hours"
              );
            let DR2 = diff_hours(
              new Date(compared_range.start_date),
              new Date(compared_range.end_date + " 23:59:59")
            );
            let b = moment(compared_range.end_date)
              .set({ hour: 24, minute: 0, second: 0 })
              .diff(
                moment(compared_range.start_date).set({
                  hour: 0o0,
                  minute: 0o0,
                  second: 0o0,
                }),
                "hours"
              );
            for (let index = 0; index < Math.max(a, b); index++) {
              let _DR1 = moment(range.start_date).add(index, "hours");
              let _DR2 = moment(compared_range.start_date).add(index, "hours");
              let _RD1 = "-";
              if (
                moment(_DR1).format("YYYY-MM-DD HH:mm") <=
                moment(range.end_date + " 23:59:59").format("YYYY-MM-DD HH:mm")
              ) {
                _RD1 = moment(_DR1).format("YYYY-MM-DD HH:mm");
              }
              let _RD2 = "-";
              if (
                moment(_DR2).format("YYYY-MM-DD HH:mm") <=
                moment(compared_range.end_date + "23:59:59").format(
                  "YYYY-MM-DD HH:mm"
                )
              ) {
                _RD2 = moment(_DR2).format("YYYY-MM-DD HH:mm");
              }
              let d11 = currentYearData.filter(
                (s: any) =>
                  moment(s.created_datetime).format("YYYY-MM-DD HH:mm") >=
                  _RD1 &&
                  moment(s.created_datetime).format("YYYY-MM-DD HH:mm") <
                  moment(_RD1).add(1, "hours").format("YYYY-MM-DD HH:mm")
              );
              let d22 = currentYearData.filter(
                (s: any) =>
                  moment(s.created_datetime).format("YYYY-MM-DD HH:mm") >=
                  _RD2 &&
                  moment(s.created_datetime).format("YYYY-MM-DD HH:mm") <
                  moment(_RD2).add(1, "hours").format("YYYY-MM-DD HH:mm")
              );
              let d111 = 0,
                d222 = 0;
              d11.forEach((ed1: any) => {
                ed1.user_order_items.forEach((e2: any) => {
                  if (type == "coupons" || type == "net_sales") {
                    if (e2.item_type == 5) {
                      if (type == "net_sales") {
                        d111 -= e2.product_amount;
                      } else {
                        d111 += e2.product_amount;
                      }
                    }
                  }
                });
              });
              d22.forEach((ed2: any) => {
                ed2.user_order_items.forEach((e2: any) => {
                  if (type == "coupons" || type == "net_sales") {
                    if (e2.item_type == 5) {
                      if (type == "net_sales") {
                        d222 -= e2.product_amount;
                      } else {
                        d222 += e2.product_amount;
                      }
                    }
                  }
                });
              });

              returnData.push({
                cp_date_time: _RD1,
                cp: d111,
                pp_date_time: _RD2,
                pp: d222,
              });
            }
            break;
        }
        new SuccessResponse("Success", {
          graph: returnData,
        }).send(res);
      } else {
        throw new Error("no data found");
      }
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
  //Highest spent customers
  public async topCustomerByTotalSpend(req: Request, res: Response) {
    try {
      var startDate: any = "";
      var endDate: any = "";
      let dateSearch;
      if (req.body.end_date && req.body.start_date) {
        startDate = moment(req.body.start_date).format("YYYY-MM-DD");
        endDate = moment(req.body.end_date).format("YYYY-MM-DD");
        dateSearch = { [dbReader.Sequelize.Op.between]: [startDate, endDate] };
      }

      //pagination
      let { page_record, page_no, site_id } = req.body;
      if (page_record == 0) {
        page_record = 5
        page_no = 1
      }
      if (site_id != 0) {

      } else {
        site_id = { [Op.in]: [, 1, 2, 3, 4, 5, 6, 7, 8, 9] }
      }
      let totalRecords = page_record * page_no,
        pageOffset = totalRecords - page_record;

      let topTransactionCustomer = await dbReader.userOrder.findAndCountAll({
        attributes: ['user_id', 'site_id',
          [dbReader.Sequelize.literal("`first_name`"), "first_name"],
          [dbReader.Sequelize.literal("`last_name`"), "last_name"],
          [dbReader.Sequelize.literal("`user_role`"), "user_role"],
          [dbReader.Sequelize.literal("`email`"), "email"],
          [dbReader.Sequelize.fn('SUM', dbReader.Sequelize.col('sycu_transaction_master.amount')), 'total_transaction'],
          [dbReader.Sequelize.fn('COUNT', dbReader.Sequelize.col('user_orders_id')), 'orders'],
          [dbReader.Sequelize.literal('user_subscription.site_id'), "site_id"],
        ],
        include: [{
          model: dbReader.users,
          attributes: []
        }, {
          model: dbReader.transactionMaster,
          attributes: [],
          where: {
            status: "success"
          },
          group: ['sycu_transaction_master.user_id']
        },
        {
          model: dbReader.userSubscription,
          attributes: [],
          where: {
            site_id: site_id
          }
        }],

        where: dbReader.sequelize.and(
          { site_id: site_id },
          dbReader.Sequelize.and(
            dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('sycu_transaction_master.created_datetime'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.gte]: req.body.start_date }),
            dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('sycu_transaction_master.created_datetime'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.lte]: req.body.end_date })
          ),
        ),
        group: ['user_id'],
        order: [[dbReader.Sequelize.literal('total_transaction'), 'DESC']],
        limit: page_record,
        offset: pageOffset,
      })
      topTransactionCustomer = JSON.parse(JSON.stringify(topTransactionCustomer))
      new SuccessResponse(EC.DataFetched, {
        count: topTransactionCustomer.count.length,

        top_5_high_spended_customers: topTransactionCustomer.rows
      }).send(res);
    }
    catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  //top products listing by its selling
  public async topProductsByItemSold(req: Request, res: Response) {
    try {
      var startDate: any = "";
      var endDate: any = "";
      let dateSearch;
      if (req.body.end_date && req.body.start_date) {
        startDate = moment(req.body.start_date).format("YYYY-MM-DD");
        endDate = moment(req.body.end_date).format("YYYY-MM-DD");
        dateSearch = { [dbReader.Sequelize.Op.between]: [startDate, endDate] };
      }

      //pagination
      let { page_record, page_no, site_id } = req.body;
      if (page_record == 0) {
        page_record = 5
        page_no = 1
      }

      if (site_id != 0) {
        site_id = site_id
      } else {
        site_id = { [Op.in]: [1, 2, 3, 4, 5, 6, 7, 8, 9] }
      }
      let totalRecords = page_record * page_no,
        pageOffset = totalRecords - page_record;

      let topSoldedProducts = await dbReader.userOrderItems.findAndCountAll({
        attributes: ['product_id', 'product_name', 'created_datetime',
          [dbReader.Sequelize.literal('`user_order->user_subscription`.`site_id`'), 'site_id'],
          [dbReader.Sequelize.fn('COUNT', dbReader.Sequelize.col('product_id')), 'total_products'],
          [dbReader.Sequelize.fn('SUM', dbReader.Sequelize.col('product_amount')), 'total_product_amount']
        ],
        where: dbReader.Sequelize.and(
          { item_type: 1 },
          dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('user_order_items.created_datetime'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.gte]: req.body.start_date }),
          dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('user_order_items.created_datetime'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.lte]: req.body.end_date })
        ),
        include: [{
          required: true,
          model: dbReader.userOrder,
          attributes: [],
          include: [{
            required: true,
            model: dbReader.userSubscription,
            attributes: [],
            where: {
              site_id: site_id
            }
          }]
        }],
        group: ['product_id'],
        order: [[dbReader.Sequelize.literal('total_products'), 'DESC']],
        limit: page_record,
        offset: pageOffset,
      })
      topSoldedProducts = JSON.parse(JSON.stringify(topSoldedProducts))
      new SuccessResponse(EC.DataFetched, {
        count: topSoldedProducts.count.length,
        high_solded_products: topSoldedProducts.rows
      }).send(res);
    }
    catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  //coupons that are use in number of products
  public async topCouponsByNumberOfOrders(req: Request, res: Response) {
    try {

      //date functionality
      let startDate: any = "",
        endDate: any = "",
        dateSearch;
      if (req.body.end_date && req.body.start_date) {
        startDate = moment(req.body.start_date).format("YYYY-MM-DD");
        endDate = moment(req.body.end_date).format("YYYY-MM-DD");
        dateSearch = { [dbReader.Sequelize.Op.between]: [startDate, endDate] };
      }
      let { page_record, page_no, site_id } = req.body;

      if (site_id != 0) {
        site_id = site_id
      } else {
        site_id = { [Op.in]: [1, 2, 3, 4, 5, 6, 7, 8, 9] }
      }
      //pagination
      if (page_record == 0) {
        page_record = 5
        page_no = 1
      }
      let totalRecords = page_record * page_no,
        pageOffset = totalRecords - page_record;

      // let numberOfCoupons = await dbReader.sycuUserCoupon.findAndCountAll({
      //   attributes: ['coupon_id',
      //     [dbReader.Sequelize.fn('COUNT', dbReader.Sequelize.col('sycu_user_coupon.user_orders_id')), 'user_orders_count'],
      //   ],
      //   group: ['coupon_id'],

      //   include: [{
      //     as: 'TopCoupon',
      //     model: dbReader.coupons,
      //     attributes: ['coupon_code'
      //     ],
      //     where: { is_deleted: 0 },
      //   },
      //   {
      //     model: dbReader.userOrderItems,
      //     attributes: [
      //       [dbReader.Sequelize.fn('SUM', dbReader.Sequelize.col('product_amount')), 'discount_coupon_amount'],
      //     ],
      //     where: dbReader.sequelize.and(
      //       {
      //         item_type: 5,
      //       },
      //       dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('user_order_item.created_datetime'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.gte]: req.body.start_date }),
      //       dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('user_order_item.created_datetime'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.lte]: req.body.end_date })
      //     ),
      //     include: [{
      //       required: true,
      //       model: dbReader.userOrder,
      //       attributes: ["user_orders_id"],
      //       include: [{
      //         model: dbReader.userSubscription,
      //         attributes: ['site_id'],
      //         where: {
      //           site_id: site_id
      //         }
      //       }]
      //     }],
      //   }],
      //   order: [[dbReader.Sequelize.literal('user_orders_count'), 'DESC']],
      //   limit: page_record,
      //   offset: pageOffset,
      // });
      let data = await dbReader.coupons.findAndCountAll({
        where: dbReader.Sequelize.and(
          { is_deleted: 0, site_id: site_id },
          dbReader.Sequelize.or(
            dbReader.Sequelize.where(
              dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('sycu_coupons.created_datetime'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.gte]: req.body.start_date }),
            dbReader.Sequelize.where(
              dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('sycu_coupons.created_datetime'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.lte]: req.body.end_date })
          )
        ),
        attributes: ['coupon_id', 'site_id', 'coupon_code'],
        include: [{
          separate: true,
          model: dbReader.userOrderItems,
          where: { is_deleted: 0 },
          attributes: ['product_id', 'product_amount']
        }],
        order: [[dbReader.Sequelize.literal('coupon_id'), 'DESC']],
        limit: page_record,
        offset: pageOffset,
      });
      // numberOfCoupons = JSON.parse(JSON.stringify(numberOfCoupons));
      // if (numberOfCoupons.rows.length > 0) {
      //   numberOfCoupons.rows.forEach((element: any) => {
      //     element.coupon_id = element ? element.coupon_id : 0;
      //     element.user_orders_count = element ? element.user_orders_count : 0;
      //     element.coupon_code = (element.TopCoupon != null) ? element.TopCoupon.coupon_code : "";
      //     element.discount_coupon_amount = (element.user_order_item != null) ? element.user_order_item.discount_coupon_amount : 0;
      //     element.site_id = (element.user_order_item.user_order.user_subscription != null) ? element.user_order_item.user_order.user_subscription.site_id : 0;
      //     delete element.TopCoupon;
      //     delete element.user_order_item;
      //   })
      // }
      data = JSON.parse(JSON.stringify(data));
      if (data.rows.length > 0) {
        data.rows.forEach((element: any) => {
          let amount = 0;
          element.user_order_items.forEach((e: any) => {
            amount += e.product_amount
          });
          element['coupon_id'] = element ? element.coupon_id : 0;
          element['user_orders_count'] = element ? (element.user_order_items ? element.user_order_items.length : 0) : 0;
          element['coupon_code'] = element ? element.coupon_code : "";
          element['discount_coupon_amount'] = element ? (element.user_order_items ? amount : 0) : 0;
          element['site_id'] = element ? element.site_id : 0;
          delete element.user_order_items;
        });
        data.rows.sort((a: any, b: any) => b['discount_coupon_amount'] - a['discount_coupon_amount']);
      }
      else {
        var item: any = {}
        item.coupon_id = 0;
        item.user_orders_count = 0;
        item.coupon_code = "";
        item.discount_coupon_amount = 0;
        // numberOfCoupons[0] = item;
        data[0] = item;
      }
      // new SuccessResponse(EC.DataFetched, {
      //   count: numberOfCoupons.count.length,
      //   top_5_highest_coupons_use_in_product: numberOfCoupons.rows
      // }).send(res);
      new SuccessResponse(EC.DataFetched, {
        count: data.count.length,
        top_5_highest_coupons_use_in_product: data.rows
      }).send(res);
    }
    catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
  public async saveUserAnalyticsConfigurationData(req: Request, res: Response) {
    try {
      //getting userId from token
      const requestContent: any = req;
      let userId = requestContent.user_id;
      let { analytics_dashboard_settings } = req.body;
      let updateData;
      let data = await dbReader.userSettings.findOne({
        where: {
          user_id: userId
        }
      })
      if (data) {
        updateData = await dbWriter.userSettings.update(
          {
            value: analytics_dashboard_settings
          },
          {
            where: {
              user_id: userId
            }
          }
        )
        // let result = await dbReader.userSettings.findOne({
        //   where: {
        //     user_id: userId
        //   }
        // })
        new SuccessResponse(EC.success, {
          //@ts-ignore
          token: req.token,
          //flag: true,
          // data:result.value
        }).send(res);
      }
      else {
        await dbWriter.userSettings.create({
          user_id: userId,
          key: "analytics_dashboard",
          value: analytics_dashboard_settings
        })
        new SuccessResponse(EC.success, {
          //@ts-ignore
          token: req.token,
          //flag: false,
          data: {}
        }).send(res);
      }
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  // Sm 27-06-22
  public async getUserAnalyticsConfigurationData(req: Request, res: Response) {
    try {
      //getting userId from token
      const requestContent: any = req;
      let userId = requestContent.user_id;
      let data = await dbReader.userSettings.findOne({
        where: {
          user_id: userId
        }
      })
      if (data) {
        new SuccessResponse(EC.success, {
          //@ts-ignore
          token: req.token,
          data: data.value
        }).send(res);
      }
      else {
        new SuccessResponse(EC.success, {
          //@ts-ignore
          token: req.token,
          data: null
        }).send(res);
      }
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
  public async getMonthWiseSubscriptionCount(req: Request, res: Response) {
    try {
      let { year, month, ministry_type } = req.body;
      let ministryTypeCondition: any,
        order_status: any = {
          2: "completed",
          5: "cancelled"
        }
      if (ministry_type) {
        ministryTypeCondition = {
          required: true,
          attributes: ['product_id', 'ministry_type'],
          model: dbReader.products,
          where: { ministry_type: ministry_type }
        }
      } else {
        ministryTypeCondition = {
          attributes: ['product_id', 'ministry_type'],
          model: dbReader.products,
        }
      }
      // Completed =
      let OrderwhereCondition = dbReader.Sequelize.and(
        dbReader.Sequelize.and(
          (dbReader.Sequelize.where(dbReader.Sequelize.fn('MONTH', dbReader.Sequelize.col('`user_orders`.`created_datetime`')), month)),
          (dbReader.Sequelize.where(dbReader.Sequelize.fn('YEAR', dbReader.Sequelize.col('`user_orders`.`created_datetime`')), year))
        ),
        { order_status: 2 }
      )
      let userOrderData = await dbReader.userOrder.findAll({
        attributes: ['order_status',
          [dbReader.Sequelize.fn('COUNT', dbReader.Sequelize.literal('`user_orders`.`user_orders_id`')), 'status_count']
        ],
        where: OrderwhereCondition,
        include: [{
          attributes: ['user_order_item_id', 'product_id'],
          model: dbReader.userOrderItems,
          include: [ministryTypeCondition]
        }],
        order: [['user_orders_id', 'DESC']],
        group: ['order_status']
      });
      //------------------------------------------------------ //
      // Cancelled
      let subscriptionwhereCondition = dbReader.Sequelize.and(
        dbReader.Sequelize.and(
          (dbReader.Sequelize.where(dbReader.Sequelize.fn('MONTH', dbReader.Sequelize.col('`user_subscription`.`updated_datetime`')), month)),
          (dbReader.Sequelize.where(dbReader.Sequelize.fn('YEAR', dbReader.Sequelize.col('`user_subscription`.`updated_datetime`')), year))
        ),
        { subscription_status: 5 }
      )
      let subscriptionData = await dbReader.userSubscription.findAll({
        attributes: ['subscription_status',
          [dbReader.Sequelize.fn('COUNT', dbReader.Sequelize.literal('`user_subscription`.`user_subscription_id`')), 'status_count1']
        ],
        where: subscriptionwhereCondition,
        include: [{
          model: dbReader.userSubscriptionItems,
          where: { item_type: 1, is_deleted: 0 },
          attributes: ['product_name', 'product_amount'],
          include: [ministryTypeCondition]
        }],
        order: [['user_subscription_id', 'DESC']],
        group: ['subscription_status']
      })
      //------------------------------------------------------ //
      // Due - Pending Due
      let duepnduewhereCondition = dbReader.Sequelize.and(
        dbReader.Sequelize.and(
          (dbReader.Sequelize.where(dbReader.Sequelize.fn('MONTH', dbReader.Sequelize.col('`user_subscription`.`next_payment_date`')), month)),
          (dbReader.Sequelize.where(dbReader.Sequelize.fn('YEAR', dbReader.Sequelize.col('`user_subscription`.`next_payment_date`')), year))
        ),
        { subscription_status: { [Op.in]: [2, 3, 7] } }
      )
      let duepndueData = await dbReader.userSubscription.findAll({
        attributes: ['subscription_status',
          [dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('`user_subscription`.`next_payment_date`'), '%Y-%m-%d'), 'next_payment_date'],
          // [dbReader.Sequelize.fn('COUNT', dbReader.Sequelize.literal('user_subscription_id')), 'status_count1']
        ],
        where: duepnduewhereCondition,
        include: [{
          attributes: ['product_name', 'product_amount'],
          model: dbReader.userSubscriptionItems,
          where: { item_type: 1, is_deleted: 0 },
          include: [ministryTypeCondition]
        }],
        order: [['user_subscription_id', 'DESC']],
        // group: ['subscription_status']
      })
      duepndueData = JSON.parse(JSON.stringify(duepndueData));
      let due = 0, pending_due = 0;
      duepndueData.forEach((e: any) => {
        if (e.next_payment_date >= moment(new Date()).format('YYYY-MM-DD') && (e.subscription_status == 2 || e.subscription_status == 3)) {
          due++
        }
        else if (e.next_payment_date < moment(new Date()).format('YYYY-MM-DD') && (e.subscription_status == 3 || e.subscription_status == 7)) {
          pending_due++
        }
      })
      // ------------------------------------------------------------- //
      let data: any = {};
      if (userOrderData.length > 0 || subscriptionData.length > 0 || duepndueData.length > 0) {
        if (userOrderData.length > 0) {
          userOrderData = JSON.parse(JSON.stringify(userOrderData));
          for (let i = 0; i < userOrderData.length; i++) {
            data[order_status[userOrderData[i].order_status]] = userOrderData[i].status_count
          }
        } else {
          data[order_status[2]] = 0
        }
        if (subscriptionData.length > 0) {
          subscriptionData = JSON.parse(JSON.stringify(subscriptionData));
          for (let i = 0; i < subscriptionData.length; i++) {
            data[order_status[subscriptionData[i].subscription_status]] = subscriptionData[i].status_count1
          }
        }
        else {
          data[order_status[5]] = 0
        }
        data["due"] = due;
        data["pending_due"] = pending_due;
        new SuccessResponse(EC.errorMessage(EC.getMessage, ["Success"]), {
          ...data
        }).send(res);
      }
      else new SuccessResponse(EC.noDataFound, { // @ts-ignore
        token: req.token,
        completed: 0,
        cancelled: 0,
        due: 0,
        pending_due: 0
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
  // public async getMonthWiseSubscriptionTableData(req: Request, res: Response) {
  //   try {
  //     let { year, month, sort_field, sort_order, ministry_type } = req.body;
  //     let data1: any = [], data2: any = [], data3: any = [], data4: any = [], ministryTypeCondition: any;
  //     //Pagination
  //     var limit = req.body.page_record == undefined ? 10 : parseInt(req.body.page_record);
  //     var offset = req.body.page_no == undefined ? 1 : parseInt(req.body.page_no);
  //     // Automatic Offset and limit will set on the base of page number
  //     var row_limit = limit;
  //     var row_offset = (offset * limit) - limit;
  //     if (ministry_type) {
  //       ministryTypeCondition = {
  //         required: true,
  //         attributes: ['product_id', 'ministry_type'],
  //         model: dbReader.products,
  //         where: { ministry_type: ministry_type }
  //       }
  //     } else {
  //       ministryTypeCondition = {
  //         attributes: ['product_id', 'ministry_type'],
  //         model: dbReader.products,
  //       }
  //     }
  //     let order_status: any = {
  //       2: "renewed",
  //       5: "cancelled"
  //     }
  //     // Completed =
  //     let OrderwhereCondition = dbReader.Sequelize.and(
  //       dbReader.Sequelize.and(
  //         (dbReader.Sequelize.where(dbReader.Sequelize.fn('MONTH', dbReader.Sequelize.col('`user_orders`.`created_datetime`')), month)),
  //         (dbReader.Sequelize.where(dbReader.Sequelize.fn('YEAR', dbReader.Sequelize.col('`user_orders`.`created_datetime`')), year))
  //       ),
  //       { order_status: 2 }
  //     )
  //     let userOrderData = await dbReader.userOrder.findAll({
  //       attributes: ['order_status',
  //         [dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('`user_orders`.`created_datetime`'), '%Y-%m-%d'), 'created_date'],
  //         [dbReader.Sequelize.fn('COUNT', dbReader.Sequelize.literal('`user_orders`.`user_orders_id`')), 'status_count']
  //       ],
  //       where: OrderwhereCondition,
  //       include: [{
  //         attributes: ['user_order_item_id', 'product_id'],
  //         model: dbReader.userOrderItems,
  //         include: [ministryTypeCondition]
  //       }],
  //       order: [['user_orders_id', 'DESC']],
  //       group: ['order_status', 'created_date']
  //     });
  //     //------------------------------------------------------ //
  //     // Cancelled
  //     let subscriptionwhereCondition = dbReader.Sequelize.and(
  //       dbReader.Sequelize.and(
  //         (dbReader.Sequelize.where(dbReader.Sequelize.fn('MONTH', dbReader.Sequelize.col('`user_subscription`.`updated_datetime`')), month)),
  //         (dbReader.Sequelize.where(dbReader.Sequelize.fn('YEAR', dbReader.Sequelize.col('`user_subscription`.`updated_datetime`')), year))
  //       ),
  //       { subscription_status: 5 }
  //     )
  //     let subscriptionData = await dbReader.userSubscription.findAll({
  //       attributes: ['subscription_status',
  //         [dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('`user_subscription`.`updated_datetime`'), '%Y-%m-%d'), 'created_date'],
  //         [dbReader.Sequelize.fn('COUNT', dbReader.Sequelize.literal('`user_subscription`.`user_subscription_id`')), 'status_count1']
  //       ],
  //       where: subscriptionwhereCondition,
  //       include: [{
  //         model: dbReader.userSubscriptionItems,
  //         where: { item_type: 1, is_deleted: 0 },
  //         attributes: ['product_name', 'product_amount'],
  //         include: [ministryTypeCondition]
  //       }],
  //       order: [['user_subscription_id', 'DESC']],
  //       group: ['subscription_status', 'updated_datetime']
  //     })
  //     //------------------------------------------------------ //
  //     // Due - Pending Due
  //     let duepnduewhereCondition = dbReader.Sequelize.and(
  //       dbReader.Sequelize.and(
  //         (dbReader.Sequelize.where(dbReader.Sequelize.fn('MONTH', dbReader.Sequelize.col('`user_subscription`.`next_payment_date`')), month)),
  //         (dbReader.Sequelize.where(dbReader.Sequelize.fn('YEAR', dbReader.Sequelize.col('`user_subscription`.`next_payment_date`')), year))
  //       ),
  //       { subscription_status: { [Op.in]: [2, 3, 7] } }
  //     )
  //     let duepndueData = await dbReader.userSubscription.findAll({
  //       attributes: ['subscription_status',
  //         [dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('`user_subscription`.`next_payment_date`'), '%Y-%m-%d'), 'next_payment_date'],
  //         // [dbReader.Sequelize.fn('COUNT', dbReader.Sequelize.literal('user_subscription_id')), 'status_count1']
  //       ],
  //       where: duepnduewhereCondition,
  //       include: [{
  //         model: dbReader.userSubscriptionItems,
  //         where: { item_type: 1, is_deleted: 0 },
  //         attributes: ['product_name', 'product_amount'],
  //         include: [ministryTypeCondition]
  //       }],
  //       order: [['user_subscription_id', 'DESC']],
  //       // group: ['subscription_status']
  //     })
  //     duepndueData = JSON.parse(JSON.stringify(duepndueData));
  //     duepndueData.forEach((e: any) => {
  //       if (e.next_payment_date >= moment(new Date()).format('YYYY-MM-DD') && (e.subscription_status == 2 || e.subscription_status == 3)) {
  //         data1.push({
  //           "due": 1,
  //           "Date": e.next_payment_date
  //         });
  //       }
  //       else if (e.next_payment_date < moment(new Date()).format('YYYY-MM-DD') && (e.subscription_status == 3 || e.subscription_status == 7)) {
  //         data2.push({
  //           "over_due": 1,
  //           "Date": e.next_payment_date
  //         });
  //       }
  //     })
  //     // ------------------------------------------------------------- //
  //     if (userOrderData.length > 0 || subscriptionData.length > 0 || duepndueData.length > 0) {
  //       if (userOrderData.length > 0) {
  //         userOrderData = JSON.parse(JSON.stringify(userOrderData));
  //         for (let i = 0; i < userOrderData.length; i++) {
  //           data3.push({
  //             [order_status[userOrderData[i].order_status]]: userOrderData[i].status_count,
  //             "Date": userOrderData[i].created_date
  //           });
  //         }
  //       }
  //       if (subscriptionData.length > 0) {
  //         subscriptionData = JSON.parse(JSON.stringify(subscriptionData));
  //         for (let i = 0; i < subscriptionData.length; i++) {
  //           data4.push({
  //             [order_status[subscriptionData[i].subscription_status]]: subscriptionData[i].status_count1,
  //             "Date": subscriptionData[i].created_date
  //           });
  //         }
  //       }
  //       var check = data1.length + data2.length + data3.length + data4.length;
  //       let finalResult: any = [];
  //       if (check) {
  //         finalResult = [...new Set(data3.map((d: any) => d.Date))].map(Date => {
  //           return {
  //             Date,
  //             renewed: data3.filter((d: any) => d.Date === Date).map((d: any) => d.renewed).length,
  //             cancelled: data4.filter((d: any) => d.Date === Date).map((d: any) => d.cancelled).length,
  //             due: data1.filter((d: any) => d.Date === Date).map((d: any) => d.due).length,
  //             over_due: data2.filter((d: any) => d.Date === Date).map((d: any) => d.over_due).length,
  //           };
  //         });
  //       }
  //       let renewed_count = 0, due_count = 0, cancelled_count = 0, over_due_count = 0;
  //       finalResult.forEach((e: any) => {
  //         renewed_count += e.renewed,
  //           cancelled_count += e.cancelled,
  //           due_count += e.due,
  //           over_due_count += e.over_due
  //       })
  //       finalResult.sort(function (a: any, b: any) {
  //         if (sort_order == 'ASC') {
  //           if (sort_field == 'Date') {
  //             return new Date(a.Date).getTime() - new Date(b.Date).getTime();
  //           } else return a[sort_field] - b[sort_field];
  //         } else if (sort_order == 'DESC') {
  //           if (sort_field == 'Date') {
  //             return new Date(b.Date).getTime() - new Date(a.Date).getTime();
  //           } else return b[sort_field] - a[sort_field];
  //         } else {
  //           return new Date(b.Date).getTime() - new Date(a.Date).getTime();
  //         }
  //       });
  //       let count = finalResult.length;
  //       finalResult = finalResult.splice(row_offset, row_limit);
  //       new SuccessResponse(EC.errorMessage(EC.getMessage, ["Success"]), {
  //         count: count,
  //         rows: finalResult,
  //         renewed_count,
  //         cancelled_count,
  //         due_count,
  //         over_due_count
  //       }).send(res);
  //     }
  //     else new SuccessResponse(EC.noDataFound, {
  //       // @ts-ignore
  //       token: req.token,
  //       count: 0,
  //       rows: [],
  //       renewed_count: 0,
  //       cancelled_count: 0,
  //       due_count: 0,
  //       over_due_count: 0
  //     }).send(res);
  //   } catch (e: any) {
  //     ApiError.handle(new BadRequestError(e.message), res);
  //   }
  // }
  // public async getRenewSubscriptionDataDateWise(req: Request, res: Response) {
  //   try {
  //     let { date, type, ministry_type, is_coupon_code } = req.body;
  //     //Pagination
  //     var limit = req.body.page_record == undefined ? 10 : parseInt(req.body.page_record);
  //     var offset = req.body.page_no == undefined ? 1 : parseInt(req.body.page_no);
  //     // Automatic Offset and limit will set on the base of page number
  //     var row_limit = limit;
  //     var row_offset = (offset * limit) - limit;
  //     /* Searching */
  //     var reqBody = req.body, SearchCondition = dbReader.Sequelize.Op.ne, SearchData = null;
  //     if (reqBody.search) {
  //       SearchCondition = dbReader.Sequelize.Op.like;
  //       SearchData = "%" + reqBody.search + "%";
  //     }
  //     let condition: any = {}, couponCodeCondition: any = {};
  //     if (ministry_type) {
  //       condition = {
  //         required: true,
  //         attributes: ['product_id', 'ministry_type'],
  //         model: dbReader.products,
  //         where: { ministry_type: ministry_type }
  //       }
  //     } else {
  //       condition = {
  //         attributes: ['product_id', 'ministry_type'],
  //         model: dbReader.products,
  //       }
  //     }
  //     if (is_coupon_code && is_coupon_code == 1) {
  //       couponCodeCondition = { coupon_code: { [Op.ne]: "" } }
  //     } else if (is_coupon_code && is_coupon_code == 2) {
  //       couponCodeCondition = { coupon_code: "" }
  //     }

  //     let duepnduewhereCondition = dbReader.Sequelize.and(
  //       dbReader.Sequelize.or(
  //         { subscription_number: { [SearchCondition]: SearchData } },
  //         //dbReader.Sequelize.where(dbReader.sequelize.literal(`(select count(1) from sycu_user_subscription_items where user_subscription_id = user_subscription.user_subscription_id and product_name like '%${reqBody.search}%')`), 1)
  //         [dbReader.Sequelize.where(dbReader.sequelize.col('`user_subscription_items`.`product_name`'), { [SearchCondition]: SearchData })],
  //       ),
  //       (dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_subscription`.`next_payment_date`'), '%Y-%m-%d'), { [Op.eq]: date })),
  //       { subscription_status: { [Op.in]: [2, 3] } },
  //       couponCodeCondition
  //     )
  //     let duepndueData = await dbReader.userSubscription.findAll({
  //       attributes: ['subscription_status', 'subscription_number', 'user_subscription_id', 'user_id', 'coupon_code',
  //         [dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('`user_subscription`.`next_payment_date`'), '%Y-%m-%d'), 'next_payment_date']
  //       ],
  //       where: duepnduewhereCondition,
  //       include: [{
  //         model: dbReader.userSubscriptionItems,
  //         where: { item_type: 1, is_deleted: 0 },
  //         attributes: ['product_name', 'product_amount'],
  //         include: [condition]
  //       }, {
  //         attributes: ['user_id', 'email'],
  //         model: dbReader.users,
  //       }],
  //       order: [['user_subscription_id', 'DESC']]
  //     })
  //     let flag = false;
  //     if (duepndueData.length) {
  //       duepndueData.forEach((e: any) => {
  //         if (e.next_payment_date >= moment(new Date()).format('YYYY-MM-DD') && (e.subscription_status == 2 || e.subscription_status == 3)) {
  //           flag = true;
  //         }
  //       })
  //       let count = duepndueData.length;
  //       duepndueData = duepndueData.splice(row_offset, row_limit);
  //       if (flag) {
  //         new SuccessResponse(EC.success, {
  //           //@ts-ignore
  //           token: req.token,
  //           count: count,
  //           rows: duepndueData
  //         }).send(res);
  //       }
  //       else {
  //         new SuccessResponse(EC.success, {
  //           //@ts-ignore
  //           token: req.token,
  //           count: 0,
  //           rows: []
  //         }).send(res);
  //       }
  //     }
  //     else {
  //       new SuccessResponse(EC.success, {
  //         //@ts-ignore
  //         token: req.token,
  //         count: 0,
  //         rows: []
  //       }).send(res);
  //     }
  //   } catch (e: any) {
  //     ApiError.handle(new BadRequestError(e.message), res);
  //   }
  // }

  //dev apis - AB
  public async getMonthWiseSubscriptionTableData(req: Request, res: Response) {
    try {
      let { year, month, sort_field, sort_order, ministry_type } = req.body;
      let dueData: any = [], overDueData: any = [], finalResult: any = [], ministryTypeCondition: any, productCondition: any;
      let row_limit = req.body.page_record == undefined ? 10 : parseInt(req.body.page_record);
      let offset = req.body.page_no == undefined ? 1 : parseInt(req.body.page_no);
      let row_offset = (offset * row_limit) - row_limit;

      if (ministry_type) {
        ministryTypeCondition = {
          required: true,
          attributes: ['product_id', 'ministry_type'],
          model: dbReader.products,
          where: { is_deleted: 0, ministry_type: ministry_type }
        }
        productCondition = { is_deleted: 0, ministry_type: ministry_type };
      } else {
        ministryTypeCondition = {
          attributes: ['product_id', 'ministry_type'],
          model: dbReader.products,
          where: { is_deleted: 0 }
        }
        productCondition = { is_deleted: 0 };
      }

      // Completed
      // let userOrderData = await dbReader.transactionMaster.findAll({
      //   attributes: ["transaction_id", [dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('`sycu_transaction_master`.`created_datetime`'), '%Y-%m-%d'), 'created_date']],
      //   where: dbReader.Sequelize.and({ status: "Success" }, { amount: { [Op.gt]: 0 } }, dbReader.Sequelize.and(
      //     (dbReader.Sequelize.where(dbReader.Sequelize.fn('MONTH', dbReader.Sequelize.col('`sycu_transaction_master.created_datetime`')), month)),
      //     (dbReader.Sequelize.where(dbReader.Sequelize.fn('YEAR', dbReader.Sequelize.col('`sycu_transaction_master.created_datetime`')), year))
      //   )),
      //   include: [{
      //     attributes: [],
      //     model: dbReader.users,
      //     where: { is_deleted: 0, user_role: 3 }
      //   }, {
      //     required: true,
      //     as: "succes_subscription",
      //     model: dbReader.userOrder,
      //     where: { order_status: [2, 3, 4, 5, 8] },
      //     include: [{
      //       required: true,
      //       attributes: [],
      //       as: "succes_subscription_check",
      //       model: dbReader.userSubscription,
      //       where: dbReader.Sequelize.where(
      //         dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`succes_subscription->succes_subscription_check`.`created_datetime`'), '%Y-%m-%d'),
      //         { [Op.ne]: dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('sycu_transaction_master.created_datetime'), '%Y-%m-%d') }),
      //       include: [{
      //         required: true,
      //         attributes: [],
      //         as: "succes_subscription_items_check",
      //         model: dbReader.userSubscriptionItems,
      //         where: { item_type: 1, is_deleted: 0 },
      //         include: [{
      //           required: true,
      //           attributes: [],
      //           model: dbReader.products,
      //           where: productCondition
      //         }]
      //       }]
      //     }]
      //   }, {
      //     required: true,
      //     as: "succes_subscription",
      //     model: dbReader.userOrder,
      //     attributes: ['user_orders_id'],
      //     where: { order_status: [2, 3, 4, 5, 8] },
      //     include: [{
      //       attributes: ['user_subscription_id'],
      //       model: dbReader.userSubscription,
      //       include: [{
      //         separate: true,
      //         attributes: ["user_subscription_item_id"],
      //         model: dbReader.userSubscriptionItems,
      //         where: { item_type: 1, is_deleted: 0 },
      //         include: [{
      //           required: true,
      //           attributes: [],
      //           model: dbReader.products,
      //           where: productCondition
      //         }]
      //       }]
      //     }]
      //   }],
      //   group: ['transaction_id']
      // })
      // let userOrderDataOld = await dbReader.userOrder.findAll({
      //   attributes: ['order_status',
      //     [dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('`user_orders`.`created_datetime`'), '%Y-%m-%d'), 'created_date'],
      //     [dbReader.Sequelize.fn('COUNT', dbReader.Sequelize.literal('`user_orders`.`user_orders_id`')), 'status_count']
      //   ],
      //   where: dbReader.Sequelize.and({ order_status: [2, 3, 4, 5, 6, 8] },
      //     dbReader.Sequelize.and(
      //       (dbReader.Sequelize.where(dbReader.Sequelize.fn('MONTH', dbReader.Sequelize.col('`user_orders`.`created_datetime`')), month)),
      //       (dbReader.Sequelize.where(dbReader.Sequelize.fn('YEAR', dbReader.Sequelize.col('`user_orders`.`created_datetime`')), year))
      //     )
      //   ),
      //   include: [{
      //     attributes: [],
      //     model: dbReader.users,
      //     where: { is_deleted: 0 }
      //   }, {
      //     required: true,
      //     attributes: ["created_datetime", "transaction_id"],
      //     model: dbReader.transactionMaster,
      //     where: { status: "Success" }
      //   }, {
      //     attributes: ['user_order_item_id', 'product_id'],
      //     model: dbReader.userOrderItems,
      //     where: { item_type: 1, is_deleted: 0 },
      //     include: [ministryTypeCondition]
      //   }],
      //   order: [['user_orders_id', 'DESC']],
      //   group: ['order_status', 'created_date']
      // });
      //------------------------------------------------------ //

      // Cancelled
      // let subscriptionData = await dbReader.userSubscription.findAll({
      //   attributes: ['subscription_status',
      //     [dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('`user_subscription`.`updated_datetime`'), '%Y-%m-%d'), 'created_date'],
      //     [dbReader.Sequelize.fn('COUNT', dbReader.Sequelize.literal('`user_subscription`.`user_subscription_id`')), 'status_count1']
      //   ],
      //   where: dbReader.Sequelize.and(
      //     dbReader.Sequelize.and(
      //       (dbReader.Sequelize.where(dbReader.Sequelize.fn('MONTH', dbReader.Sequelize.col('`user_subscription`.`updated_datetime`')), month)),
      //       (dbReader.Sequelize.where(dbReader.Sequelize.fn('YEAR', dbReader.Sequelize.col('`user_subscription`.`updated_datetime`')), year))
      //     ),
      //     { subscription_status: 5 }
      //   ),
      //   include: [{
      //     model: dbReader.userSubscriptionItems,
      //     where: { item_type: 1, is_deleted: 0 },
      //     attributes: ['product_name', 'product_amount'],
      //     include: [ministryTypeCondition]
      //   }],
      //   order: [['user_subscription_id', 'DESC']],
      //   group: ['subscription_status', 'created_date']
      // })

      let userOrderData = await dbReader.transactionMaster.findAll({
        attributes: ["transaction_id", [dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('`sycu_transaction_master`.`created_datetime`'), '%Y-%m-%d'), 'created_date']],
        where: dbReader.Sequelize.and({ status: "Success" }, { amount: { [Op.gt]: 0 } }, dbReader.Sequelize.and(
          (dbReader.Sequelize.where(dbReader.Sequelize.fn('MONTH', dbReader.Sequelize.col('`sycu_transaction_master.created_datetime`')), month)),
          (dbReader.Sequelize.where(dbReader.Sequelize.fn('YEAR', dbReader.Sequelize.col('`sycu_transaction_master.created_datetime`')), year))
        )),
        include: [{
          attributes: [],
          model: dbReader.users,
          where: { is_deleted: 0, user_role: 3 }
        }, {
          required: true,
          as: "succes_subscription",
          model: dbReader.userOrder,
          where: { order_status: [2, 3, 4, 5, 8] },
          include: [{
            attributes: [],
            required: true,
            as: 'report_order',
            model: dbReader.userOrderItems,
            where: { item_type: 1, is_deleted: 0, renewal_count: 1 },
            include: [{
              attributes: [],
              model: dbReader.products,
              where: productCondition
            }]
          }, {
            required: true,
            attributes: [],
            as: "succes_subscription_check",
            model: dbReader.userSubscription,
            where: dbReader.Sequelize.where(
              dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`succes_subscription->succes_subscription_check`.`created_datetime`'), '%Y-%m-%d'),
              { [Op.ne]: dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('sycu_transaction_master.created_datetime'), '%Y-%m-%d') }
            )
          }]
        }, {
          required: true,
          attributes: ['user_orders_id'],
          as: "succes_subscription",
          model: dbReader.userOrder,
          where: { order_status: [2, 3, 4, 5, 8] },
          include: [{
            attributes: ['user_order_item_id', 'renewal_count',
              [dbReader.sequelize.literal('`sycu_product`.`ministry_type`'), "ministry_type"],
              [dbReader.sequelize.literal('`sycu_product`.`is_ministry_page`'), "is_ministry_page"],
              [dbReader.sequelize.literal('`sycu_product`.`product_name`'), "product_name"],
              [dbReader.sequelize.literal('`sycu_product`.`product_id`'), "product_id"],
              [dbReader.sequelize.literal('`updated_product`.`product_name`'), "updated_product_name"],
              [dbReader.sequelize.literal('`updated_product`.`product_id`'), "updated_product_id"],
            ],
            separate: true,
            model: dbReader.userOrderItems,
            where: { item_type: 1, is_deleted: 0, renewal_count: 1 },
            include: [{
              attributes: [],
              model: dbReader.products,
              where: productCondition
            }, {
              required: false,
              attributes: [],
              as: 'updated_product',
              model: dbReader.products,
              where: productCondition
            }]
          }, {
            attributes: [],
            model: dbReader.userSubscription,
          }]
        }],
        group: ['`succes_subscription->user_subscription`.`subscription_number`', '`succes_subscription->report_order->sycu_product`.`product_id`']
      })

      let cancelSubscriptionData = await dbReader.userSubscription.findAll({
        attributes: ['subscription_status',
          [dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('`user_subscription`.`status_updated_date`'), '%Y-%m-%d'), 'created_date']],
        where: dbReader.Sequelize.and({ subscription_status: [4, 5] }, dbReader.Sequelize.and(
          (dbReader.Sequelize.where(dbReader.Sequelize.fn('MONTH', dbReader.Sequelize.col('`user_subscription`.`status_updated_date`')), month)),
          (dbReader.Sequelize.where(dbReader.Sequelize.fn('YEAR', dbReader.Sequelize.col('`user_subscription`.`status_updated_date`')), year))
        )),
        include: [{
          attributes: [],
          model: dbReader.users,
          where: { user_role: 3, is_deleted: 0 },
        }, {
          as: "succes_subscription_items_check",
          attributes: [],
          required: true,
          model: dbReader.userSubscriptionItems,
          where: { item_type: 1, is_deleted: 0 },
          include: [{
            attributes: [],
            required: true,
            model: dbReader.products,
            where: productCondition
          }]
        }, {
          separate: true,
          attributes: ["user_subscription_item_id",
            [dbReader.sequelize.literal('`sycu_product`.`ministry_type`'), "ministry_type"],
            [dbReader.sequelize.literal('`sycu_product`.`is_ministry_page`'), "is_ministry_page"],
            [dbReader.sequelize.literal('`sycu_product`.`product_name`'), "product_name"]
          ],
          model: dbReader.userSubscriptionItems,
          where: { item_type: 1, is_deleted: 0 },
          include: [{
            attributes: [],
            required: true,
            model: dbReader.products,
            where: productCondition
          }]
        }],
        group: ['user_subscription_id']
      })
      //------------------------------------------------------ //

      // Due - Pending Due
      let duepndueData = await dbReader.userSubscription.findAll({
        attributes: ['subscription_status',
          [dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('`user_subscription`.`end_date`'), '%Y-%m-%d'), 'end_date'],
          [dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('`user_subscription`.`next_payment_date`'), '%Y-%m-%d'), 'next_payment_date'],
          // [dbReader.Sequelize.fn('COUNT', dbReader.Sequelize.literal('user_subscription_id')), 'status_count1']
        ],
        where: dbReader.Sequelize.and(
          dbReader.Sequelize.and(
            (dbReader.Sequelize.where(dbReader.Sequelize.fn('MONTH', dbReader.Sequelize.col('`user_subscription`.`end_date`')), month)),
            (dbReader.Sequelize.where(dbReader.Sequelize.fn('YEAR', dbReader.Sequelize.col('`user_subscription`.`end_date`')), year))
          ),
          { subscription_status: { [Op.in]: [2, 3, 7] } }
        ),
        include: [{
          model: dbReader.userSubscriptionItems,
          where: { item_type: 1, is_deleted: 0 },
          attributes: ['product_name', 'product_amount'],
          include: [ministryTypeCondition]
        }],
        order: [['user_subscription_id', 'DESC']],
        // group: ['subscription_status']
      });
      duepndueData = JSON.parse(JSON.stringify(duepndueData));
      duepndueData.forEach((e: any) => {
        if (e.end_date >= moment(new Date()).format('YYYY-MM-DD') && (e.subscription_status == 2 || e.subscription_status == 3)) {
          dueData.push({
            "due": 1,
            "Date": e.end_date
          });
        }
        else if (e.end_date < moment(new Date()).format('YYYY-MM-DD') && (e.subscription_status == 3 || e.subscription_status == 7)) {
          overDueData.push({
            "over_due": 1,
            "Date": e.end_date
          });
        }
      })
      // ------------------------------------------------------------- //
      if (userOrderData.length > 0 || cancelSubscriptionData.length > 0 || duepndueData.length > 0) {
        userOrderData = JSON.parse(JSON.stringify(userOrderData));
        cancelSubscriptionData = JSON.parse(JSON.stringify(cancelSubscriptionData));
        if (dueData.length || overDueData.length || userOrderData.length || cancelSubscriptionData.length) {
          var startDate = moment([year, month - 1]);
          var endDate = moment(startDate).endOf('month');
          let dateRangeOfCurrent = getDateRange(startDate, endDate, "YYYY-MM-DD");
          // dateRangeOfCurrent = dateRangeOfCurrent.filter((e: any) => moment(e) <= moment(new Date()));
          finalResult = dateRangeOfCurrent.map(Date => {
            return {
              Date,
              renewed: userOrderData.filter((d: any) => d.created_date === Date).length,
              cancelled: cancelSubscriptionData.filter((d: any) => d.created_date === Date).length,
              due: dueData.filter((d: any) => d.Date === Date).map((d: any) => d.due).length,
              over_due: overDueData.filter((d: any) => d.Date === Date).map((d: any) => d.over_due).length,
            };
          });
        }
        let renewed_count = 0, due_count = 0, cancelled_count = 0, over_due_count = 0;
        finalResult.forEach((e: any) => {
          renewed_count += e.renewed,
            cancelled_count += e.cancelled,
            due_count += e.due,
            over_due_count += e.over_due
        })
        finalResult.sort(function (a: any, b: any) {
          if (sort_order == 'ASC') {
            if (sort_field == 'Date') {
              return new Date(a.Date).getTime() - new Date(b.Date).getTime();
            } else return a[sort_field] - b[sort_field];
          } else if (sort_order == 'DESC') {
            if (sort_field == 'Date') {
              return new Date(b.Date).getTime() - new Date(a.Date).getTime();
            } else return b[sort_field] - a[sort_field];
          } else {
            return new Date(b.Date).getTime() - new Date(a.Date).getTime();
          }
        });
        let count = finalResult.length;
        finalResult = finalResult.splice(row_offset, row_limit);
        new SuccessResponse(EC.errorMessage(EC.getMessage, ["Success"]), {
          count: count,
          rows: finalResult,
          renewed_count,
          cancelled_count,
          due_count,
          over_due_count
        }).send(res);
      }
      else new SuccessResponse(EC.noDataFound, {
        // @ts-ignore
        token: req.token,
        count: 0,
        rows: [],
        renewed_count: 0,
        cancelled_count: 0,
        due_count: 0,
        over_due_count: 0
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  /*public async getRenewSubscriptionDataDateWise(req: Request, res: Response) {
    try {
      let { date, start_date, end_date, type, ministry_type, is_coupon_code, search } = req.body;
      //Pagination
      var limit = req.body.page_record == undefined ? 10 : parseInt(req.body.page_record);
      var offset = req.body.page_no == undefined ? 1 : parseInt(req.body.page_no);
      // Automatic Offset and limit will set on the base of page number
      var row_limit = limit;
      var row_offset = (offset * limit) - limit;
      // Searching
      var SearchCondition = dbReader.Sequelize.Op.ne, SearchData = null;
      if (search) {
        SearchCondition = dbReader.Sequelize.Op.like;
        SearchData = "%" + search + "%";
      }
      //------------------------------------------------------ //
      // due/overdue
      let duepndueData: any, condition: any = {}, couponCodeCondition: any = {};
      if (ministry_type) {
        condition = {
          required: true,
          attributes: ['product_id', 'ministry_type'],
          model: dbReader.products,
          where: { ministry_type: ministry_type }
        }
      } else {
        condition = {
          attributes: ['product_id', 'ministry_type'],
          model: dbReader.products,
        }
      }

      if (is_coupon_code && is_coupon_code == 1) {
        couponCodeCondition = { coupon_code: { [Op.ne]: "" } }
      } else if (is_coupon_code && is_coupon_code == 2) {
        couponCodeCondition = { coupon_code: "" }
      }

      if (type == 1 || type == 2) {
        let duepnduewhereCondition: any;
        if (start_date && end_date && start_date != end_date) {
          duepnduewhereCondition = dbReader.Sequelize.and(
            dbReader.Sequelize.or(
              { subscription_number: { [SearchCondition]: SearchData } },
              [dbReader.Sequelize.where(dbReader.sequelize.col('`user_subscription_items`.`product_name`'), { [SearchCondition]: SearchData })],
            ),
            (dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_subscription`.`end_date`'), '%Y-%m-%d'), { [Op.gte]: start_date })),
            (dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_subscription`.`end_date`'), '%Y-%m-%d'), { [Op.lte]: end_date })),
            { subscription_status: { [Op.in]: [2, 3, 7] } },
            couponCodeCondition
          )
        } else {
          duepnduewhereCondition = dbReader.Sequelize.and(
            dbReader.Sequelize.or(
              { subscription_number: { [SearchCondition]: SearchData } },
              [dbReader.Sequelize.where(dbReader.sequelize.col('`user_subscription_items`.`product_name`'), { [SearchCondition]: SearchData })],
            ),
            (dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_subscription`.`end_date`'), '%Y-%m-%d'), { [Op.eq]: date })),
            { subscription_status: { [Op.in]: [2, 3, 7] } },
            couponCodeCondition
          )
        }
        duepndueData = await dbReader.userSubscription.findAll({
          attributes: ['subscription_status', 'subscription_number', 'user_subscription_id', 'user_id', 'end_date', 'coupon_code',
            [dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('`user_subscription`.`next_payment_date`'), '%Y-%m-%d'), 'end_date1']
          ],
          where: duepnduewhereCondition,
          include: [{
            model: dbReader.userSubscriptionItems,
            where: { item_type: 1, is_deleted: 0 },
            attributes: ['product_name', 'product_amount'],
            include: [condition]
          }, {
            attributes: ['user_id', 'email'],
            model: dbReader.users,
          }],
          order: [['end_date', 'ASC']]
        });
        duepndueData = JSON.parse(JSON.stringify(duepndueData));
      }

      let data: any = [];
      switch (type) {
        case 1: // due data
          data = duepndueData.filter((e: any) => e.end_date1 >= moment(new Date()).format('YYYY-MM-DD') && (e.subscription_status == 2 || e.subscription_status == 3));
          break;
        case 2: // over-due data
          data = duepndueData.filter((e: any) => e.end_date1 < moment(new Date()).format('YYYY-MM-DD') && (e.subscription_status == 3 || e.subscription_status == 7));
          break;
        case 3: // renewed data
          let OrderwhereCondition: any;
          if (start_date && end_date && start_date != end_date) {
            OrderwhereCondition = dbReader.Sequelize.and({ order_status: [2, 3, 4, 5, 6, 8] }, dbReader.Sequelize.and(
              (dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_orders`.`created_datetime`'), '%Y-%m-%d'), { [Op.gte]: start_date })),
              (dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_orders`.`created_datetime`'), '%Y-%m-%d'), { [Op.lte]: end_date }))
            ))
          } else {
            OrderwhereCondition = dbReader.Sequelize.and({ order_status: [2, 3, 4, 5, 6, 8] },
              (dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_orders`.`created_datetime`'), '%Y-%m-%d'), { [Op.eq]: date }))
            )
          }
          let userOrderData = await dbReader.userOrder.findAll({
            attributes: [[dbReader.Sequelize.literal('subscription_status'), 'subscription_status'],
            [dbReader.Sequelize.literal('subscription_number'), 'subscription_number'], 'user_subscription_id', 'user_id'],
            where: OrderwhereCondition,
            include: [{
              required: true,
              model: dbReader.userSubscription,
              attributes: ['user_subscription_id', 'end_date', 'coupon_code'],
              where: couponCodeCondition,
              include: [{
                attributes: ['user_id', 'email'],
                model: dbReader.users,
                where: { is_deleted: 0, user_role: 3 }
              }]
            }],
            order: [['created_datetime', 'ASC']],
            group: ['user_subscription_id']
          });
          userOrderData = JSON.parse(JSON.stringify(userOrderData));
          let subIds: any = [];
          if (userOrderData.length) {
            userOrderData.forEach((e: any) => {
              subIds.push(e.user_subscription_id);
              e.end_date = e.user_subscription.end_date;
              delete e.user_subscription.end_date;
            });
            if (subIds.length) {
              let items = await dbReader.userSubscriptionItems.findAll({
                attributes: ['product_name', 'product_amount', 'user_subscription_id'],
                where: [dbReader.Sequelize.or(
                  // { subscription_number: { [SearchCondition]: SearchData } },
                  [dbReader.Sequelize.where(dbReader.sequelize.col('`user_subscription_items`.`product_name`'), { [SearchCondition]: SearchData })],
                ), { item_type: 1, is_deleted: 0, user_subscription_id: { [Op.in]: subIds } }],
                include: [condition]
              });
              items = JSON.parse(JSON.stringify(items));
              if (items.length) {
                userOrderData.forEach((e: any) => {
                  e["user_subscription_items"] = [];
                  if (items.some((el: any) => el.user_subscription_id == e.user_subscription_id)) {
                    let sub_items = items.find((el: any) => el.user_subscription_id == e.user_subscription_id);
                    delete sub_items.user_subscription_id;
                    e.user_subscription_items.push(sub_items);
                  }
                });
              }
            }
            if (ministry_type || search) {
              userOrderData = userOrderData.filter((e: any) => e.user_subscription_items && e.user_subscription_items.length);
            }
          }
          data = userOrderData;
          break;
        case 4: // cancelled data
          let subscriptionwhereCondition: any;
          if (start_date && end_date && start_date != end_date) {
            subscriptionwhereCondition = dbReader.Sequelize.and(
              dbReader.Sequelize.or(
                { subscription_number: { [SearchCondition]: SearchData } },
                [dbReader.Sequelize.where(dbReader.sequelize.col('`user_subscription_items`.`product_name`'), { [SearchCondition]: SearchData })],
              ),
              dbReader.Sequelize.and(
                (dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_subscription`.`updated_datetime`'), '%Y-%m-%d'), { [Op.gte]: start_date })),
                (dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_subscription`.`updated_datetime`'), '%Y-%m-%d'), { [Op.lte]: end_date }))
              ), { subscription_status: [4, 5] }, couponCodeCondition,
            )
          } else {
            subscriptionwhereCondition = dbReader.Sequelize.and(
              dbReader.Sequelize.or(
                { subscription_number: { [SearchCondition]: SearchData } },
                [dbReader.Sequelize.where(dbReader.sequelize.col('`user_subscription_items`.`product_name`'), { [SearchCondition]: SearchData })],
              ),
              dbReader.Sequelize.and({ subscription_status: [4, 5] }, couponCodeCondition,
                (dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_subscription`.`status_updated_date`'), '%Y-%m-%d'), { [Op.eq]: date }))
              )
            )
          }
          let subscriptionData = await dbReader.userSubscription.findAll({
            attributes: ['subscription_status', 'subscription_number', 'user_subscription_id', 'user_id', 'end_date', 'coupon_code'],
            where: subscriptionwhereCondition,
            include: [{
              model: dbReader.userSubscriptionItems,
              where: { item_type: 1, is_deleted: 0 },
              attributes: ['product_name', 'product_amount'],
              include: [condition]
            }, {
              attributes: ['user_id', 'email'],
              model: dbReader.users,
              where: { is_deleted: 0, user_role: 3 }
            }],
            order: [['end_date', 'ASC']],
            // group: ['subscription_status', 'updated_datetime']
          })
          data = JSON.parse(JSON.stringify(subscriptionData));
          break;
        default:
          break;
      }

      if (type == 1 || type == 2 || type == 4) {
        data.forEach((element: any) => {
          let user_subscription = {
            coupon_code: element.coupon_code ? element.coupon_code : "",
            sycu_user: element.sycu_user,
          };
          element.user_subscription = user_subscription;
          delete element.sycu_user;
          delete element.coupon_code;
        });
      }
      let count = data.length;
      data = data.splice(row_offset, row_limit);
      new SuccessResponse(EC.success, {
        //@ts-ignore
        token: req.token,
        count: count,
        rows: data
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }*/

  public async getRenewSubscriptionDataDateWise(req: Request, res: Response) {
    try {
      let { date, start_date, end_date, type, ministry_type, is_coupon_code, search } = req.body;
      let row_limit = req.body.page_record == undefined ? 10 : parseInt(req.body.page_record);
      let offset = req.body.page_no == undefined ? 1 : parseInt(req.body.page_no);
      let row_offset = (offset * row_limit) - row_limit;
      /* Searching */
      let SearchCondition = dbReader.Sequelize.Op.ne, SearchData = null;
      if (search) {
        SearchCondition = dbReader.Sequelize.Op.like;
        SearchData = "%" + search + "%";
      }

      let ministryTypeCondition: any, productCondition: any = {}, FinalResponseRows: any = [], FinalResponseCount = 0;
      if (ministry_type) {
        ministryTypeCondition = {
          required: true,
          attributes: ['product_id', 'ministry_type'],
          model: dbReader.products,
          where: { is_deleted: 0, ministry_type: ministry_type }
        }
        productCondition = { is_deleted: 0, ministry_type: ministry_type };
      } else {
        ministryTypeCondition = {
          attributes: ['product_id', 'ministry_type'],
          model: dbReader.products,
          where: { is_deleted: 0 }
        }
        productCondition = { is_deleted: 0 };
      }

      if (type == 1 || type == 2) {
        let condition: any;
        if (ministry_type) {
          condition = {
            required: true,
            attributes: ['product_id', 'ministry_type'],
            model: dbReader.products,
            where: { ministry_type: ministry_type }
          }
        } else {
          condition = {
            attributes: ['product_id', 'ministry_type'],
            model: dbReader.products,
          }
        }

        let duepndueData = await dbReader.userSubscription.findAll({
          attributes: ['subscription_status', 'subscription_number', 'user_subscription_id', 'user_id', 'end_date', 'coupon_code',
            [dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('`user_subscription`.`next_payment_date`'), '%Y-%m-%d'), 'end_date1']
          ],
          where: dbReader.Sequelize.and(dbReader.Sequelize.or(
            { subscription_number: { [SearchCondition]: SearchData } },
            [dbReader.Sequelize.where(dbReader.sequelize.col('`user_subscription_items`.`product_name`'), { [SearchCondition]: SearchData })],
          ), { subscription_status: { [Op.in]: [2, 3, 7] } },
            (dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_subscription`.`end_date`'), '%Y-%m-%d'), { [Op.eq]: date }))),
          include: [{
            model: dbReader.userSubscriptionItems,
            where: { item_type: 1, is_deleted: 0 },
            attributes: ['product_name', 'product_amount'],
            include: [condition]
          }, {
            attributes: ['user_id', 'email'],
            model: dbReader.users,
          }],
          order: [['end_date', 'ASC']]
        });
        duepndueData = JSON.parse(JSON.stringify(duepndueData));
        switch (type) {
          case 1: // due data
            duepndueData = duepndueData.filter((e: any) => e.end_date1 >= moment(new Date()).format('YYYY-MM-DD') && (e.subscription_status == 2 || e.subscription_status == 3));
            break;
          case 2: // over-due data
            duepndueData = duepndueData.filter((e: any) => e.end_date1 < moment(new Date()).format('YYYY-MM-DD') && (e.subscription_status == 3 || e.subscription_status == 7));
            break;
        }
        FinalResponseCount = duepndueData.length;
        duepndueData.forEach((ele: any) => {
          FinalResponseRows.push({
            user_id: ele.user_id,
            user_name: '',
            email: ele.sycu_user.email,
            end_date: ele.end_date ? ele.end_date : "",
            subscription_number: ele.subscription_number ?? "",
            subscription_status: ele.subscription_status ?? "",
            user_subscription: { coupon_code: ele.coupon_code, sycu_user: ele.sycu_user },
            user_subscription_items: ele.user_subscription_items,
          })
        })
      } else if (type == 3) {
        let userOrderData = await dbReader.transactionMaster.findAndCountAll({
          attributes: ["transaction_id", [dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('`sycu_transaction_master`.`created_datetime`'), '%Y-%m-%d'), 'created_date'],
            [dbReader.sequelize.fn("concat", dbReader.sequelize.literal('`sycu_user`.`first_name`'), ' ', dbReader.sequelize.literal('`sycu_user`.`last_name`')), "user_name"],
            [dbReader.sequelize.literal('`sycu_user`.`email`'), "email"], [dbReader.sequelize.literal('`sycu_user`.`user_id`'), "user_id"]],
          where: dbReader.Sequelize.and({ status: "Success" }, { amount: { [Op.gt]: 0 } }, dbReader.Sequelize.and(
            dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`sycu_transaction_master.created_datetime`'), '%Y-%m-%d'), { [Op.eq]: date }),
            dbReader.Sequelize.or(
              [dbReader.Sequelize.where(dbReader.sequelize.fn("concat", dbReader.sequelize.col("first_name"), ' ', dbReader.sequelize.col("last_name")), { [SearchCondition]: SearchData })],
              [dbReader.Sequelize.where(dbReader.sequelize.col('`sycu_user`.`email`'), { [SearchCondition]: SearchData })],
              [dbReader.Sequelize.where(dbReader.sequelize.col('`succes_subscription->user_subscription`.`subscription_number`'), { [SearchCondition]: SearchData })],
              [dbReader.Sequelize.where(dbReader.sequelize.col('`succes_subscription->succes_subscription_check->succes_subscription_items_check->sycu_product`.`product_name`'), { [SearchCondition]: SearchData })]
            )
          )),
          include: [{
            attributes: [],
            model: dbReader.users,
            where: { is_deleted: 0, user_role: 3 }
          }, {
            required: true,
            as: "succes_subscription",
            model: dbReader.userOrder,
            where: { order_status: [2, 3, 4, 5, 8] },
            include: [{
              required: true,
              attributes: [],
              as: "succes_subscription_check",
              model: dbReader.userSubscription,
              where: dbReader.Sequelize.where(
                dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`succes_subscription->succes_subscription_check`.`created_datetime`'), '%Y-%m-%d'),
                { [Op.ne]: dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('sycu_transaction_master.created_datetime'), '%Y-%m-%d') }),
              include: [{
                required: true,
                attributes: [],
                as: "succes_subscription_items_check",
                model: dbReader.userSubscriptionItems,
                where: { item_type: 1, is_deleted: 0 },
                include: [{
                  attributes: [],
                  required: true,
                  model: dbReader.products,
                  where: productCondition
                }]
              }]
            }]
          }, {
            required: true,
            as: "succes_subscription",
            attributes: ['user_orders_id'],
            model: dbReader.userOrder,
            where: { order_status: [2, 3, 4, 5, 8] },
            include: [{
              attributes: ['user_subscription_id', 'subscription_number', 'subscription_status', 'end_date'],
              model: dbReader.userSubscription,
              include: [{
                separate: true,
                attributes: ["user_subscription_item_id", "product_name", "product_amount"],
                model: dbReader.userSubscriptionItems,
                where: { item_type: 1, is_deleted: 0 },
                include: [{
                  required: true,
                  attributes: ["product_id", "ministry_type"],
                  model: dbReader.products,
                  where: productCondition
                }]
              }]
            }]
          }],
          group: ['transaction_id'],
          limit: row_limit,
          offset: row_offset,
        });
        userOrderData = JSON.parse(JSON.stringify(userOrderData));
        FinalResponseCount = userOrderData.count.length;
        userOrderData.rows.forEach((ele: any) => {
          FinalResponseRows.push({
            user_id: ele.user_id,
            user_name: ele.user_name,
            email: ele.email,
            end_date: ele.succes_subscription?.user_subscription?.end_date ?? "",
            subscription_number: ele.succes_subscription?.user_subscription?.subscription_number ?? "",
            subscription_status: ele.succes_subscription?.user_subscription?.subscription_status ?? "",
            user_subscription: ele.succes_subscription?.user_subscription,
            user_subscription_items: ele.succes_subscription?.user_subscription.user_subscription_items,
          })
        })
      } else if (type == 4) {
        let cancelSubscriptionData = await dbReader.userSubscription.findAndCountAll({
          attributes: ['user_subscription_id', 'subscription_status', 'subscription_number', 'end_date',
            [dbReader.sequelize.fn("concat", dbReader.sequelize.literal('`sycu_user`.`first_name`'), ' ', dbReader.sequelize.literal('`sycu_user`.`last_name`')), "user_name"],
            [dbReader.sequelize.literal('`sycu_user`.`email`'), "email"], [dbReader.sequelize.literal('`sycu_user`.`user_id`'), "user_id"],
            [dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('`user_subscription`.`status_updated_date`'), '%Y-%m-%d'), 'created_date']],
          where: dbReader.Sequelize.and({ subscription_status: [4, 5] }, { subscription_number: { [SearchCondition]: SearchData } },
            dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_subscription`.`status_updated_date`'), '%Y-%m-%d'), { [Op.eq]: date }),
            dbReader.Sequelize.or(
              [dbReader.Sequelize.where(dbReader.sequelize.fn("concat", dbReader.sequelize.col("first_name"), ' ', dbReader.sequelize.col("last_name")), { [SearchCondition]: SearchData })],
              [dbReader.Sequelize.where(dbReader.sequelize.col('`sycu_user`.`email`'), { [SearchCondition]: SearchData })],
              // [dbReader.Sequelize.where(dbReader.sequelize.col('`succes_subscription->succes_subscription_check->succes_subscription_items_check->sycu_product`.`product_name`'), { [SearchCondition]: SearchData })]
            )),
          include: [{
            attributes: [],
            model: dbReader.users,
            where: { user_role: 3, is_deleted: 0 },
          }, {
            as: "succes_subscription_items_check",
            attributes: [],
            required: true,
            model: dbReader.userSubscriptionItems,
            where: { item_type: 1, is_deleted: 0 },
            include: [{
              attributes: [],
              required: true,
              model: dbReader.products,
              where: productCondition
            }]
          }, {
            separate: true,
            attributes: ["user_subscription_item_id", "product_name", "product_amount"],
            model: dbReader.userSubscriptionItems,
            where: { item_type: 1, is_deleted: 0 },
            include: [{
              attributes: ["product_id", "ministry_type"],
              required: true,
              model: dbReader.products,
              where: productCondition
            }]
          }],
          group: ['user_subscription_id'],
          limit: row_limit,
          offset: row_offset,
        });
        cancelSubscriptionData = JSON.parse(JSON.stringify(cancelSubscriptionData));
        FinalResponseCount = cancelSubscriptionData.count.length;
        cancelSubscriptionData.rows.forEach((ele: any) => {
          FinalResponseRows.push({
            user_id: ele.user_id,
            user_name: ele.user_name,
            email: ele.email,
            end_date: ele.end_date ? ele.end_date : "",
            subscription_number: ele.subscription_number ?? "",
            subscription_status: ele.subscription_status ?? "",
            user_subscription: { coupon_code: "", sycu_user: { email: ele.email, user_id: ele.user_id } },
            user_subscription_items: ele.user_subscription_items,
          })
        })
      }

      new SuccessResponse(EC.success, {
        //@ts-ignore
        token: req.token,
        count: FinalResponseCount,
        rows: FinalResponseRows
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async getRealtimeReport (req: Request, res: Response) {
    try {
      const [data] = await analyticsDataClient.runRealtimeReport({
        property: `properties/${process.env.PROPERTY_ID}`,
        dimensions: [
          {
            name: 'country',
          },
        ],
        metrics: [
          {
            name: 'activeUsers',
          },
        ],
      });
      const resToSend = await printRunReportResponse(data);
      new SuccessResponse(EC.success, resToSend).send(res);
    } catch (error:any) {
      ApiError.handle(new BadRequestError(error.message), res);
    }
  }
  public async batchReport(req:Request,res:Response){
    try {
      //  start_date is 7 days ago
      let {start_date,end_date} = req.body;
      // let start_date = new Date();
      // start_date.setDate(start_date.getDate() - 7);
      // let end_date = new Date();
      // let start_date_string = start_date.toISOString().split('T')[0];
      // let end_date_string = end_date.toISOString().split('T')[0];
      const response:any = await analyticsDataClient.batchRunReports({
        property: `properties/${process.env.PROPERTY_ID}`,
        requests: [
          {
            dimensions: [
              {
                name: 'country',
              },
              {
                name: 'region',
              },
              {
                name: 'city',
              },
            ],
            metrics: [
              {
                name: 'activeUsers',
              },
            ],
            dateRanges: [
              {
                startDate: start_date,
                endDate: end_date,
              },
            ],
          },
          {
            dimensions: [
              {
                name: 'browser',
              },
            ],
            metrics: [
              {
                name: 'activeUsers',
              },
            ],
            dateRanges: [
              {
                startDate: start_date,
                endDate: end_date,
              },
            ],
          },
          {
            dimensions: [
              {
                name: 'fullPageUrl',
              },
            ],
            metrics: [
              {
                name: 'activeUsers',
              },
            ],
            dateRanges: [
              {
                startDate: start_date,
                endDate: end_date,
              },
            ],
          },
          {
            dimensions: [
              {
                name: 'operatingSystem',
              },
            ],
            metrics: [
              {
                name: 'activeUsers',
              },
            ],
            dateRanges: [
              {
                startDate: start_date,
                endDate: end_date,
              },
            ],
          },
          {
            dimensions: [
              {
                name: 'mobileDeviceBranding',
              },
            ],
            metrics: [
              {
                name: 'activeUsers',
              },
            ],
            dateRanges: [
              {
                startDate: start_date,
                endDate: end_date,
              },
            ],
          },
        ],
      });


      let resToSend:any = [];

      for(let i=0;i<response.length;i++){
        if(response[i]){
          for(let j=0;j<response[i].reports.length;j++){
            if(response[i].reports[j]){
              let getData = await printRunReportResponse2(response[i].reports[j]);

              resToSend.push({name:`Report ${j+1}`,data:getData})
            }
          }
        }
      }

      new SuccessResponse(EC.success, resToSend).send(res);
    } catch (error:any) {
      ApiError.handle(new BadRequestError(error.message), res);
    }

  }
}

function printRunReportResponse(response:any) {
  let dataToSend:any = [];
  response.rows.forEach((row:any) => {
    dataToSend.push({country: row.dimensionValues[0].value, activeUsers: row.metricValues[0].value});
  });
  return dataToSend;
}
function printRunReportResponse2(response:any) {
  let reportData:any = [];
  
  response.rows.forEach((row:any) => {
    if(reportData.some((item:any) => item.dimension === row.dimensionValues[0].value)){
      let  index = reportData.findIndex((ele:any) => ele.dimension === row.dimensionValues[0].value);
      let oldData = parseInt(reportData[index].metric);
      let newData = parseInt(row.metricValues[0].value);
      reportData[index].metric = (oldData + newData).toString();
    }
    else{
      reportData.push({dimension: row.dimensionValues[0].value, metric: row.metricValues[0].value});
    }
  });
  return reportData;
}

