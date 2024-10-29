import { Request, Response } from "express";
import moment from 'moment';
import _ from 'lodash';
import { ErrorController, SuccessResponse, BadRequestError, ApiError } from '../../core/index';
const { dbReader } = require('../../models/dbConfig');
const EC = new ErrorController();
const { Op } = dbReader.Sequelize;
import { getDateRange } from '../../helpers/helpers';
import { any } from "joi";

export class RevenueController {

  public async getRevenueCount(req: Request, res: Response) {
    try {
      let { range } = req.body;
      let { compared_range, site_id, tz } = req.body;

      let siteCondition = {};
      if (site_id) {
        siteCondition = { site_id: site_id }
      }
      let startDate = moment((range.start_date)).format("YYYY-MM-DD HH:mm")
      let endDate = moment((range.end_date)).format("YYYY-MM-DD HH:mm")
      let startDate1 = moment((compared_range.start_date)).format("YYYY-MM-DD HH:mm")
      let endDate1 = moment((compared_range.end_date)).format("YYYY-MM-DD HH:mm")
      if (tz == 1) {
        startDate = moment((range.start_date)).format("YYYY-MM-DD HH:mm")
        endDate = moment((range.end_date)).format("YYYY-MM-DD HH:mm")
        startDate1 = moment((compared_range.start_date)).format("YYYY-MM-DD HH:mm")
        endDate1 = moment((compared_range.end_date)).format("YYYY-MM-DD HH:mm")
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
          as: "transaction",
          model: dbReader.transactionMaster,
          where: {
            status: 'Success', type: 1, charge_id: { [Op.ne]: '' }
          },
          attributes: ['amount', 'processing_fee']
        }, {
          required: true,
          model: dbReader.userSubscription,
          where: siteCondition
        }]
      })
      currentYearData = JSON.parse(JSON.stringify(currentYearData))
      // let currentYearRefundData = await dbReader.userOrder.findAll({
      //   attributes: [[dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('`user_orders`.`created_datetime`'), '%Y-%m-%d %H:%i'), 'created_date']],
      //   where: dbReader.sequelize.and(
      //     dbReader.Sequelize.or(
      //       dbReader.Sequelize.and(
      //         dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m-%d %H:%i'), { [dbReader.Sequelize.Op.gte]: startDate }),
      //         dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m-%d %H:%i'), { [dbReader.Sequelize.Op.lte]: endDate })
      //       ),
      //       dbReader.Sequelize.and(
      //         dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m-%d %H:%i'), { [dbReader.Sequelize.Op.gte]: startDate1 }),
      //         dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m-%d %H:%i'), { [dbReader.Sequelize.Op.lte]: endDate1 })
      //       ),
      //     )
      //   ),
      //   include: [
      //     {
      //       required: true,
      //       model: dbReader.refunds,
      //       where:
      //         { status: 1 }
      //     }, {
      //       required: true,
      //       model: dbReader.userSubscription,
      //       where: siteCondition
      //     }
      //   ]
      // })
      let currentYearRefundData = await dbReader.refunds.findAll({
        attributes: [[dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('`refunds`.`created_datetime`'), '%Y-%m-%d %H:%i'), 'created_date'], 'refund_amount'],
        where: dbReader.sequelize.and(
          dbReader.Sequelize.or(
            dbReader.Sequelize.and(
              dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`refunds`.`created_datetime`'), '%Y-%m-%d %H:%i'), { [dbReader.Sequelize.Op.gte]: startDate }),
              dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`refunds`.`created_datetime`'), '%Y-%m-%d %H:%i'), { [dbReader.Sequelize.Op.lte]: endDate })
            ),
            dbReader.Sequelize.and(
              dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`refunds`.`created_datetime`'), '%Y-%m-%d %H:%i'), { [dbReader.Sequelize.Op.gte]: startDate1 }),
              dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`refunds`.`created_datetime`'), '%Y-%m-%d %H:%i'), { [dbReader.Sequelize.Op.lte]: endDate1 })
            ),
          ),
          { status: 1 }, siteCondition
        ),
        // include: [
        //   {
        //     required: true,
        //     model: dbReader.refunds,
        //     where:
        //       { status: 1 }
        //   }, {
        //     required: true,
        //     model: dbReader.userSubscription,
        //     where: siteCondition
        //   }
        // ]
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
      let d11 = currentYearData.filter((s: any) => s.created_date >= startDate && s.created_date <= endDate)
      let d22 = currentYearData.filter((s: any) => s.created_date >= startDate1 && s.created_date <= endDate1)
      d11.forEach((ed1: any) => {
        ed1.transaction.forEach((e3: any) => {
          netSales += e3.amount
          netSales6 += e3.processing_fee
        });
        ed1.user_order_items.forEach((e2: any) => {
          netSales2 += e2.product_amount
        });

      });
      d22.forEach((ed2: any) => {
        ed2.transaction.forEach((e: any) => {
          netSales1 += e.amount
          netSales7 += e.processing_fee
        })
        ed2.user_order_items.forEach((e2: any) => {
          netSales3 += e2.product_amount
        });
      });
      let _d11 = currentYearRefundData.filter((s: any) => s.created_date >= startDate && s.created_date <= endDate);
      let _d22 = currentYearRefundData.filter((s: any) => s.created_date >= startDate1 && s.created_date <= endDate1);
      _d11.forEach((ed1: any) => {
        netSales4 += ed1.refund_amount
        // ed1.refunds.forEach((e: any) => {
        // });
      });
      _d22.forEach((ed2: any) => {
        netSales5 += ed2.refund_amount
        // ed2.refunds.forEach((e: any) => {
        // })

      });
      if (currentYearData.length > 0) {
        new SuccessResponse(EC.success, {
          reports: {
            gross_sales: {
              value: netSales + netSales2,
              previousPeriodValue: netSales1 + netSales3,
            },
            coupons: {
              value: parseFloat((netSales2).toFixed(2)),
              previousPeriodValue: parseFloat((netSales3).toFixed(2)),
            },
            refunds: {
              value: parseFloat((netSales4).toFixed(2)),
              previousPeriodValue: parseFloat((netSales5).toFixed(2)),
            },
            net_sales: {
              value: parseFloat((netSales - netSales6 - netSales4).toFixed(2)),
              previousPeriodValue: parseFloat((netSales1 - netSales7 - netSales5).toFixed(2)),
            },
            processing_fees: {
              value: parseFloat((netSales6).toFixed(2)),
              previousPeriodValue: parseFloat((netSales7).toFixed(2)),
            }
          }
          // total_gross_sales: parseFloat(totalSale),
          // percentage: parseFloat(percentage)
        }).send(res);
      }
      else {
        new SuccessResponse(EC.noDataFound, {
          reports: {
            gross_sales: {
              value: 0,
              previousPeriodValue: 0,
            },
            coupons: {
              value: 0,
              previousPeriodValue: 0,
            },
            refunds: {
              value: 0,
              previousPeriodValue: 0,
            },
            net_sales: {
              value: 0,
              previousPeriodValue: 0,
            },
            processing_fees: {
              value: 0,
              previousPeriodValue: 0,
            },

          }
        }).send(res);
      }
      // let productData = await 
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
  public async getRevenueGrossSaleGraphData(req: Request, res: Response) {
    try {
      let { range, compared_range, by, type, site_id, tz } = req.body
      let startDate = moment((range.start_date)).format("YYYY-MM-DD HH:mm")
      let endDate = moment((range.end_date)).format("YYYY-MM-DD HH:mm")
      let startDate1 = moment((compared_range.start_date)).format("YYYY-MM-DD HH:mm")
      let endDate1 = moment((compared_range.end_date)).format("YYYY-MM-DD HH:mm")
      if (tz == 1) {
        startDate = moment((range.start_date)).format("YYYY-MM-DD HH:mm")
        endDate = moment((endDate)).format("YYYY-MM-DD HH:mm")
        startDate1 = moment((compared_range.start_date)).format("YYYY-MM-DD HH:mm")
        endDate1 = moment((compared_range.end_date)).format("YYYY-MM-DD HH:mm")
      }
      let siteCondition = {};
      if (site_id) {
        siteCondition = { site_id: site_id }
      }
      let attributes: any = [[dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m-%d %H:%i'), 'created_datetime'], 'user_orders_id', 'total_amount']
      switch (by) {
        case 'day':
          attributes = [[dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m-%d %H:%i'), 'created_datetime'], 'user_orders_id', 'total_amount']
          break;
        case 'week':
          attributes = [[dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m-%d'), 'created_datetime'], 'user_orders_id', 'total_amount']
          break;
        case 'month':
          attributes = [[dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m-%d'), 'created_datetime'], 'user_orders_id', 'total_amount']
          break;
        case 'quarter':
          attributes = [[dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m'), 'created_datetime'], 'user_orders_id', 'total_amount']
          break;
      }
      let currentYearData = await dbReader.userOrder.findAll({
        attributes: attributes,
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
          attributes: ['item_type', 'product_amount', 'user_orders_id', 'created_datetime', 'processing_fees']
        }, {
          model: dbReader.userOrderItems,
          where: { item_type: 1 },
          as: 'report_order',
          include: [{
            model: dbReader.products,
            attributes: ['product_id', 'site_id'],
            where: { site_id: site_id, is_deleted: 0 }
          }]
        }, {
          required: false,
          model: dbReader.transactionMaster,
          where: {
            status: 'Success', type: 1, charge_id: { [Op.ne]: '' }
          },
          attributes: ['amount', 'processing_fee']
        }, {
          required: true,
          model: dbReader.userSubscription,
          where: siteCondition
        }]
      })
      currentYearData = JSON.parse(JSON.stringify(currentYearData))
      // let currentYearRefundData = await dbReader.userOrder.findAll({
      //   attributes: attributes,
      //   where: dbReader.sequelize.and(
      //     dbReader.Sequelize.or(
      //       dbReader.Sequelize.and(
      //         dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m-%d %H:%i'), { [dbReader.Sequelize.Op.gte]: startDate }),
      //         dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m-%d %H:%i'), { [dbReader.Sequelize.Op.lte]: endDate })
      //       ),
      //       dbReader.Sequelize.and(
      //         dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m-%d %H:%i'), { [dbReader.Sequelize.Op.gte]: startDate1 }),
      //         dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m-%d %H:%i'), { [dbReader.Sequelize.Op.lte]: endDate1 })
      //       ),
      //     )
      //   ),
      //   include: [
      //     {
      //       required: true,
      //       model: dbReader.refunds,
      //       where:
      //         { status: 1 }
      //     },
      //     {
      //       required: true,
      //       model: dbReader.userSubscription,
      //       where: siteCondition
      //     }
      //   ]
      // })
      let currentYearRefundData = await dbReader.refunds.findAll({
        attributes: [[dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('`refunds`.`created_datetime`'), '%Y-%m-%d %H:%i'), 'created_date'], 'refund_amount'],
        where: dbReader.sequelize.and(
          dbReader.Sequelize.or(
            dbReader.Sequelize.and(
              dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`refunds`.`created_datetime`'), '%Y-%m-%d %H:%i'), { [dbReader.Sequelize.Op.gte]: startDate }),
              dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`refunds`.`created_datetime`'), '%Y-%m-%d %H:%i'), { [dbReader.Sequelize.Op.lte]: endDate })
            ),
            dbReader.Sequelize.and(
              dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`refunds`.`created_datetime`'), '%Y-%m-%d %H:%i'), { [dbReader.Sequelize.Op.gte]: startDate1 }),
              dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`refunds`.`created_datetime`'), '%Y-%m-%d %H:%i'), { [dbReader.Sequelize.Op.lte]: endDate1 })
            ),
          ),
          { status: 1 }, siteCondition
        ),
        // include: [
        //   {
        //     required: true,
        //     model: dbReader.refunds,
        //     where:
        //       { status: 1 }
        //   }, {
        //     required: true,
        //     model: dbReader.userSubscription,
        //     where: siteCondition
        //   }
        // ]
      })
      currentYearRefundData = JSON.parse(JSON.stringify(currentYearRefundData))
      if (currentYearData || currentYearRefundData) {
        let returnData: any = [];
        switch (by) {
          case "quarter":
            let by_quarterly_date1: any = moment(startDate).format('MM');
            let by_quarterly_date2: any = moment(endDate).format('MM');
            let by_quarterly_monthDiff1 = by_quarterly_date2 - by_quarterly_date1

            for (let index = 0; index < by_quarterly_monthDiff1; index++) {
              let b2 = moment(startDate).format("YYYY-MM-DD")
              let b22 = moment(startDate1).format("YYYY-MM-DD")
              let d1 = moment(b2).add(index, 'M').format('YYYY-MM');
              let d2 = moment(b22).add(index, 'M').format('YYYY-MM');
              let d11 = currentYearData.filter((s: any) => s.created_datetime == d1)
              let d22 = currentYearData.filter((s: any) => s.created_datetime == d2)
              let d111 = 0, d222 = 0
              d11.forEach((ed1: any) => {
                if (type == "gross_sales" || type == "net_sales") {
                  d111 += ed1.sycu_transaction_master ? ed1.sycu_transaction_master.amount : ed1.total_amount;
                }
                if (type == "net_sales" || type == "processing_fees") {
                  if (type == "processing_fees") {
                    d111 += ed1.sycu_transaction_master ? ed1.sycu_transaction_master.processing_fee : 0;
                  } else {
                    d111 -= ed1.sycu_transaction_master ? ed1.sycu_transaction_master.processing_fee : 0;
                  }
                }
                ed1.user_order_items.forEach((e2: any) => {
                  if (type == "gross_sales" || type == "coupons") {
                    d111 += e2.product_amount
                  }
                });
              });
              d22.forEach((ed2: any) => {
                if (type == "gross_sales" || type == "net_sales") {
                  d222 += ed2.sycu_transaction_master ? ed2.sycu_transaction_master.amount : ed2.total_amount;
                }
                if (type == "net_sales" || type == "processing_fees") {
                  if (type == "processing_fees") {
                    d222 += ed2.sycu_transaction_master ? ed2.sycu_transaction_master.processing_fee : 0;
                  } else {
                    d222 -= ed2.sycu_transaction_master ? ed2.sycu_transaction_master.processing_fee : 0;
                  }
                }
                ed2.user_order_items.forEach((e2: any) => {
                  if (type == "gross_sales" || type == "coupons") {
                    d222 += e2.product_amount
                  }
                });
              });
              let _d11 = currentYearRefundData.filter((s: any) => s.created_datetime == d1);
              let _d22 = currentYearRefundData.filter((s: any) => s.created_datetime == d2);
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
                    d111 -= ed2.refund_amount;
                  } else {
                    d111 += ed2.refund_amount;
                  }
                }
              });
              if ([0, 1, 2].includes(index)) {
                let td = moment(startDate).add(0, 'M').format('YYYY-MM');
                let td2 = moment(startDate1).add(0, 'M').format('YYYY-MM');
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
                let td = moment(startDate).add(3, 'M').format('YYYY-MM');
                let td2 = moment(startDate1).add(3, 'M').format('YYYY-MM');
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
                let td = moment(startDate).add(6, 'M').format('YYYY-MM');
                let td2 = moment(startDate1).add(6, 'M').format('YYYY-MM');
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
                let td = moment(startDate).add(9, 'M').format('YYYY-MM');
                let td2 = moment(startDate1).add(9, 'M').format('YYYY-MM');
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
            let a2 = moment(range.end_date).format("YYYY-MM-DD");
            let b2 = moment(range.start_date).format("YYYY-MM-DD")
            var daysOfYear1: any = [];
            for (let d = moment(b2); d <= moment(a2); d.add(1, 'days')) {
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
            let a22 = moment(compared_range.end_date).format("YYYY-MM-DD");
            let b22 = moment(compared_range.start_date).format("YYYY-MM-DD")
            var daysOfYear2: any = [];
            for (let d = moment(b22); d <= moment(a22); d.add(1, 'days')) {
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
              // let d1 = moment(startDate1).format('YYYY-MM-DD');
              // let d2 = moment(startDate2).format('YYYY-MM-DD');
              let d11 = currentYearData.filter((s: any) => s.created_datetime >= startDate1 && s.created_datetime <= lastDate1)
              let d22 = currentYearData.filter((s: any) => s.created_datetime >= startDate2 && s.created_datetime <= lastDate2)
              let d111 = 0, d222 = 0
              d11.forEach((ed1: any) => {
                if (type == "gross_sales" || type == "net_sales") {
                  d111 += ed1.sycu_transaction_master ? ed1.sycu_transaction_master.amount : ed1.total_amount;
                }
                if (type == "net_sales" || type == "processing_fees") {
                  if (type == "processing_fees") {
                    d111 += ed1.sycu_transaction_master ? ed1.sycu_transaction_master.processing_fee : 0;
                  } else {
                    d111 -= ed1.sycu_transaction_master ? ed1.sycu_transaction_master.processing_fee : 0;
                  }
                }
                ed1.user_order_items.forEach((e2: any) => {
                  if (type == "gross_sales" || type == "coupons") {
                    d111 += e2.product_amount
                  }
                });
              });
              d22.forEach((ed2: any) => {
                if (type == "gross_sales" || type == "net_sales") {
                  d222 += ed2.sycu_transaction_master ? ed2.sycu_transaction_master.amount : ed2.total_amount;
                }
                if (type == "net_sales" || type == "processing_fees") {
                  if (type == "processing_fees") {
                    d222 += ed2.sycu_transaction_master ? ed2.sycu_transaction_master.processing_fee : 0;
                  } else {
                    d222 -= ed2.sycu_transaction_master ? ed2.sycu_transaction_master.processing_fee : 0;
                  }
                }
                ed2.user_order_items.forEach((e2: any) => {
                  if (type == "gross_sales" || type == "coupons") {
                    d222 += e2.product_amount
                  }
                });
              });
              let _d11 = currentYearRefundData.filter((s: any) => s.created_datetime >= startDate1 && s.created_datetime <= lastDate1);
              let _d22 = currentYearRefundData.filter((s: any) => s.created_datetime >= startDate2 && s.created_datetime <= lastDate2);
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
                    d111 -= ed2.refund_amount;
                  } else {
                    d111 += ed2.refund_amount;
                  }
                }
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
            let a1 = moment(range.end_date).format("YYYY-MM-DD");
            let b1 = moment(range.start_date).format("YYYY-MM-DD")
            var daysOfYear1: any = [];
            for (let d = moment(b1); d <= moment(a1); d.add(1, 'days')) {
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
            // var now2 = new Date(compared_range.end_date);
            let a1111 = moment(compared_range.end_date).format("YYYY-MM-DD");
            let b1111 = moment(compared_range.start_date).format("YYYY-MM-DD")
            var daysOfYear2: any = [];
            for (let d = moment(b1111); d <= moment(a1111); d.add(1, 'days')) {
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
              let _DR1 = currentYearRefundData.filter((s: any) => s.created_datetime >= startDate1 && s.created_datetime <= lastDate1);
              let DR2 = currentYearData.filter((s: any) => s.created_datetime >= startDate2 && s.created_datetime <= lastDate2);
              let _DR2 = currentYearRefundData.filter((s: any) => s.created_datetime >= startDate2 && s.created_datetime <= lastDate2);
              let d111 = 0, d222 = 0;
              DR1.forEach((ed1: any) => {
                if (type == "gross_sales" || type == "net_sales") {
                  d111 += ed1.sycu_transaction_master ? ed1.sycu_transaction_master.amount : ed1.total_amount;
                }
                if (type == "net_sales" || type == "processing_fees") {
                  if (type == "processing_fees") {
                    d111 += ed1.sycu_transaction_master ? ed1.sycu_transaction_master.processing_fee : 0;
                  } else {
                    d111 -= ed1.sycu_transaction_master ? ed1.sycu_transaction_master.processing_fee : 0;
                  }
                }
                ed1.user_order_items.forEach((e2: any) => {
                  if (type == "gross_sales" || type == "coupons") {
                    d111 += e2.product_amount
                  }
                });
              });
              DR2.forEach((ed2: any) => {
                if (type == "gross_sales" || type == "net_sales") {
                  d222 += ed2.sycu_transaction_master ? ed2.sycu_transaction_master.amount : ed2.total_amount;
                }
                if (type == "net_sales" || type == "processing_fees") {
                  if (type == "processing_fees") {
                    d222 += ed2.sycu_transaction_master ? ed2.sycu_transaction_master.processing_fee : 0;
                  } else {
                    d222 -= ed2.sycu_transaction_master ? ed2.sycu_transaction_master.processing_fee : 0;
                  }
                }
                ed2.user_order_items.forEach((e2: any) => {
                  if (type == "gross_sales" || type == "coupons") {
                    d222 += e2.product_amount
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
                    d111 -= ed2.refund_amount;
                  } else {
                    d111 += ed2.refund_amount;
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
            let a11 = moment(endDate).format("YYYY-MM-DD");
            let b11 = moment(startDate).format("YYYY-MM-DD")
            var daysOfYear1: any = [];
            for (let d = moment(b11); d <= moment(a11); d.add(1, 'days')) {
              daysOfYear1.push({
                start_date: moment(d).format('YYYY-MM-DD')
              })
            }
            // var now2 = new Date(compared_range.end_date);
            let a111 = moment(endDate1).format("YYYY-MM-DD");
            let b111 = moment(startDate1).format("YYYY-MM-DD")
            var daysOfYear2: any = [];
            for (let d = moment(b111); d <= moment(a111); d.add(1, 'days')) {
              daysOfYear2.push({
                start_date: moment(d).format('YYYY-MM-DD')
              })
            }
            for (let index = 0; index < Math.max(daysOfYear1.length, daysOfYear2.length); index++) {
              let startDate11 = (daysOfYear1.length && daysOfYear1[index]) ? daysOfYear1[index].start_date : '';
              let startDate2 = (daysOfYear2.length && daysOfYear2[index]) ? daysOfYear2[index].start_date : '';
              let DR1 = currentYearData.filter((s: any) => moment(s.created_datetime).format("YYYY-MM-DD") == startDate11 && s.created_datetime >= range.start_date && s.created_datetime <= range.end_date);
              let _DR1 = currentYearRefundData.filter((s: any) => moment(s.created_datetime).format("YYYY-MM-DD") == startDate11 && s.created_datetime >= range.start_date && s.created_datetime <= range.end_date);
              let DR2 = currentYearData.filter((s: any) => moment(s.created_datetime).format("YYYY-MM-DD") == startDate2 && s.created_datetime >= compared_range.start_date && s.created_datetime <= compared_range.end_date);
              let _DR2 = currentYearRefundData.filter((s: any) => moment(s.created_datetime).format("YYYY-MM-DD") == startDate2 && s.created_datetime >= compared_range.start_date && s.created_datetime <= compared_range.end_date);
              let d111 = 0, d222 = 0;
              DR1.forEach((ed1: any) => {
                if (type == "gross_sales" || type == "net_sales") {
                  d111 += ed1.sycu_transaction_master ? ed1.sycu_transaction_master.amount : ed1.total_amount;
                }
                if (type == "net_sales" || type == "processing_fees") {
                  if (type == "processing_fees") {
                    d111 += ed1.sycu_transaction_master ? ed1.sycu_transaction_master.processing_fee : 0;
                  } else {
                    d111 -= ed1.sycu_transaction_master ? ed1.sycu_transaction_master.processing_fee : 0;
                  }
                }
                ed1.user_order_items.forEach((e2: any) => {
                  if (type == "gross_sales" || type == "coupons") {
                    d111 += e2.product_amount
                  }
                });
              });
              DR2.forEach((ed2: any) => {
                if (type == "gross_sales" || type == "net_sales") {
                  d222 += ed2.sycu_transaction_master ? ed2.sycu_transaction_master.amount : ed2.total_amount;
                }
                if (type == "net_sales" || type == "processing_fees") {
                  if (type == "processing_fees") {
                    d222 += ed2.sycu_transaction_master ? ed2.sycu_transaction_master.processing_fee : 0;
                  } else {
                    d222 -= ed2.sycu_transaction_master ? ed2.sycu_transaction_master.processing_fee : 0;
                  }
                }
                ed2.user_order_items.forEach((e2: any) => {
                  if (type == "gross_sales" || type == "coupons") {
                    d222 += e2.product_amount
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
                    d111 -= ed2.refund_amount;
                  } else {
                    d111 += ed2.refund_amount;
                  }
                }
              });
              returnData.push({
                cp_date_time: (daysOfYear1.length && daysOfYear1[index]) ? daysOfYear1[index].start_date : '',
                cp: d111,
                pp_date_time: (daysOfYear2.length && daysOfYear2[index]) ? daysOfYear2[index].start_date : '',
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
            let a = (
              (moment(endDate)).set({ hour: 23, minute: 59, second: 59 })).diff(moment(startDate).set({ hour: 0o0, minute: 0o0, second: 0o0 }), 'hours')
            let b = (
              (moment(endDate1)).set({ hour: 24, minute: 0, second: 0 })).diff(moment(startDate1).set({ hour: 0o0, minute: 0o0, second: 0o0 }), 'hours')
            for (let index = 0; index < Math.max(a, b); index++) {
              let _DR1 = moment(startDate).add(index, 'hours');
              let _DR2 = moment(startDate1).add(index, 'hours');
              let _RD1 = '-';
              if (moment(_DR1).format('YYYY-MM-DD HH:mm') <= moment(endDate + " 23:59:59").format('YYYY-MM-DD HH:mm')) {
                _RD1 = moment(_DR1).format('YYYY-MM-DD HH:mm')
              }
              let _RD2 = '-';
              if (moment(_DR2).format('YYYY-MM-DD HH:mm') <= moment(endDate1 + "23:59:59").format('YYYY-MM-DD HH:mm')) {
                _RD2 = moment(_DR2).format('YYYY-MM-DD HH:mm')
              }
              let d11 = currentYearData.filter((s: any) => moment(s.created_datetime).format('YYYY-MM-DD HH:mm') >= _RD1 && moment(s.created_datetime).format('YYYY-MM-DD HH:mm') < moment(_RD1).add(1, 'hours').format('YYYY-MM-DD HH:mm'))
              let d22 = currentYearData.filter((s: any) => moment(s.created_datetime).format('YYYY-MM-DD HH:mm') >= _RD2 && moment(s.created_datetime).format('YYYY-MM-DD HH:mm') < moment(_RD2).add(1, 'hours').format('YYYY-MM-DD HH:mm'))
              let d111 = 0, d222 = 0
              d11.forEach((ed1: any) => {
                if (type == "gross_sales" || type == "net_sales") {
                  d111 += ed1.sycu_transaction_master ? ed1.sycu_transaction_master.amount : ed1.total_amount;
                }
                if (type == "net_sales" || type == "processing_fees") {
                  if (type == "processing_fees") {
                    d111 += ed1.sycu_transaction_master ? ed1.sycu_transaction_master.processing_fee : 0;
                  } else {
                    d111 -= ed1.sycu_transaction_master ? ed1.sycu_transaction_master.processing_fee : 0;
                  }
                }
                ed1.user_order_items.forEach((e2: any) => {
                  if (type == "gross_sales" || type == "coupons") {
                    d111 += e2.product_amount
                  }
                });
              });
              d22.forEach((ed2: any) => {
                if (type == "gross_sales" || type == "net_sales") {
                  d222 += ed2.sycu_transaction_master ? ed2.sycu_transaction_master.amount : ed2.total_amount;
                }
                if (type == "net_sales" || type == "processing_fees") {
                  if (type == "processing_fees") {
                    d222 += ed2.sycu_transaction_master ? ed2.sycu_transaction_master.processing_fee : 0;
                  } else {
                    d222 -= ed2.sycu_transaction_master ? ed2.sycu_transaction_master.processing_fee : 0;
                  }
                }
                ed2.user_order_items.forEach((e2: any) => {
                  if (type == "gross_sales" || type == "coupons") {
                    d222 += e2.product_amount
                  }
                });
              });
              let _d11 = currentYearRefundData.filter((s: any) => moment(s.created_datetime).format('YYYY-MM-DD HH:mm') >= _RD1 && moment(s.created_datetime).format('YYYY-MM-DD HH:mm') < moment(_RD1).add(1, 'hours').format('YYYY-MM-DD HH:mm'));
              let _d22 = currentYearRefundData.filter((s: any) => moment(s.created_datetime).format('YYYY-MM-DD HH:mm') >= _RD2 && moment(s.created_datetime).format('YYYY-MM-DD HH:mm') < moment(_RD2).add(1, 'hours').format('YYYY-MM-DD HH:mm'));
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
                    d111 -= ed2.refund_amount;
                  } else {
                    d111 += ed2.refund_amount;
                  }
                }
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

  public async getRevenueListDateWise(req: Request, res: Response) {
    try {
      let { range, page_record, page_no, sort_field, sort_order, site_id, tz } = req.body;
      let startDate = moment((range.start_date)).format("YYYY-MM-DD HH:mm")
      let endDate = moment((range.end_date)).format("YYYY-MM-DD HH:mm")
      if (tz == 1) {
        startDate = moment((range.start_date)).format("YYYY-MM-DD HH:mm")
        endDate = moment((endDate)).format("YYYY-MM-DD HH:mm")
      }
      let siteCondition = {}
      if (site_id) {
        siteCondition = { site_id: site_id }
      }
      //Pagination
      var limit = page_record == undefined ? 10 : parseInt(page_record);
      var offset = page_no == undefined ? 1 : parseInt(page_no);
      // Automatic Offset and limit will set on the base of page number
      var row_limit = limit;
      var row_offset = (offset * limit) - limit;
      let currentYearData = await dbReader.userOrder.findAll({
        attributes: [[dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('`user_orders`.`created_datetime`'), '%Y-%m-%d %H:%i'), 'created_date'], 'user_orders_id'],
        where: dbReader.sequelize.and(
          { order_status: [2, 3, 4, 5, 6, 8] },
          dbReader.Sequelize.or(
            dbReader.Sequelize.and(
              dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m-%d %H:%i'), { [dbReader.Sequelize.Op.gte]: startDate }),
              dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m-%d %H:%i'), { [dbReader.Sequelize.Op.lte]: endDate })
            ),
            // dbReader.Sequelize.and(
            //   dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m-%d %H:%i'), { [dbReader.Sequelize.Op.gte]: startDate1 }),
            //   dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m-%d %H:%i'), { [dbReader.Sequelize.Op.lte]: endDate1 })
            // ),
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
          where: {
            status: 'Success', type: 1, charge_id: { [Op.ne]: '' }
          },
          attributes: ['amount', 'processing_fee']
        }, {
          required: true,
          model: dbReader.userSubscription,
          where: siteCondition
        }]
      })
      currentYearData = JSON.parse(JSON.stringify(currentYearData))
      // let currentYearRefundData = await dbReader.userOrder.findAll({
      //   attributes: [[dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('`user_orders`.`created_datetime`'), '%Y-%m-%d %H:%i'), 'created_date']],
      //   where:
      //     dbReader.Sequelize.and(
      //       dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m-%d %H:%i'), { [dbReader.Sequelize.Op.gte]: startDate }),
      //       dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m-%d %H:%i'), { [dbReader.Sequelize.Op.lte]: endDate })
      //     ),
      //   include: [
      //     {
      //       required: true,
      //       model: dbReader.refunds,
      //       where: { status: 1 }
      //     }, {
      //       required: true,
      //       model: dbReader.userSubscription,
      //       where: siteCondition
      //     }
      //   ]
      // })
      let currentYearRefundData = await dbReader.refunds.findAll({
        attributes: [[dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('`refunds`.`created_datetime`'), '%Y-%m-%d %H:%i'), 'created_date'], 'refund_amount'],
        where: dbReader.sequelize.and(
          dbReader.Sequelize.or(
            dbReader.Sequelize.and(
              dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`refunds`.`created_datetime`'), '%Y-%m-%d %H:%i'), { [dbReader.Sequelize.Op.gte]: startDate }),
              dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`refunds`.`created_datetime`'), '%Y-%m-%d %H:%i'), { [dbReader.Sequelize.Op.lte]: endDate })
            ),
          ),
          { status: 1 }, siteCondition
        ),
        // include: [
        //   {
        //     required: true,
        //     model: dbReader.refunds,
        //     where:
        //       { status: 1 }
        //   }, {
        //     required: true,
        //     model: dbReader.userSubscription,
        //     where: siteCondition
        //   }
        // ]
      })
      currentYearRefundData = JSON.parse(JSON.stringify(currentYearRefundData))
      let dateRangeOfCurrent: any = [];
      let a = moment(startDate).format("YYYY-MM-DD")
      let b = moment(endDate).format("YYYY-MM-DD")
      dateRangeOfCurrent = getDateRange(a, b, "YYYY-MM-DD");
      let processing_fee = 0;
      let arrayOfDatesOfCurrent = dateRangeOfCurrent.map(function (item: any) { return { 'created_date': item, 'orders': 0, 'gross_sales': 0, 'net_sales': 0, 'refunds': 0, 'coupons': 0, 'processing_fees': 0 } });
      arrayOfDatesOfCurrent.forEach((ele: any) => {
        currentYearRefundData.forEach((e: any) => {
          if (moment(ele.created_date).format("YYYY-MM-DD") == moment(e.created_date).format("YYYY-MM-DD")) {
            ele.refunds += e.refund_amount
          }

        });
        currentYearData.forEach((e: any) => {
          if (moment(ele.created_date).format("YYYY-MM-DD") == moment(e.created_date).format("YYYY-MM-DD")) {
            ele.orders++
            ele.gross_sales += e.sycu_transaction_master.amount
            ele.net_sales += e.sycu_transaction_master.amount
            ele.processing_fees += e.sycu_transaction_master.processing_fee
          }
          e.user_order_items.forEach((e2: any) => {

            if (moment(ele.created_date).format("YYYY-MM-DD") == moment(e.created_date).format("YYYY-MM-DD")) {
              ele.coupons += e2.product_amount
              // ele.coupons += e2.product_amount
            }
          });
        });
        ele.net_sales = ele.net_sales - ele.refunds - ele.processing_fees
        ele.gross_sales = ele.gross_sales + ele.coupons
      });
      if (currentYearData.length > 0) {
        arrayOfDatesOfCurrent.reverse()
        arrayOfDatesOfCurrent.sort(function (a: any, b: any) {
          if (sort_order == 'ASC') {
            if (sort_field == 'created_date') {
              return new Date(a.created_date).getTime() - new Date(b.created_date).getTime();
            }
            else
              return a[sort_field] - b[sort_field];
          }
          else if (sort_order == 'DESC') {
            if (sort_field == 'created_date') {
              return new Date(b.created_date).getTime() - new Date(a.created_date).getTime();
            }
            else
              return b[sort_field] - a[sort_field];
          }
          else {
            return new Date(b.created_date).getTime() - new Date(a.created_date).getTime();
          }
        });
        let count = arrayOfDatesOfCurrent.length;
        let t_orders = 0, t_gross_sales = 0, t_refunds = 0, t_coupons = 0, t_net_sales = 0, t_processing_fees = 0;
        arrayOfDatesOfCurrent.filter((e: any) => {
          t_orders += e.orders;
          t_gross_sales += e.gross_sales;
          t_refunds += e.refunds;
          t_coupons += e.coupons;
          t_net_sales += e.net_sales;
          t_processing_fees += e.processing_fees
        });
        arrayOfDatesOfCurrent = arrayOfDatesOfCurrent.splice(row_offset, row_limit);
        new SuccessResponse(EC.success, {
          count: count,
          days: count,
          orders: t_orders,
          gross_sales: t_gross_sales,
          refunds: t_refunds,
          coupons: t_coupons,
          net_sales: t_net_sales,
          processing_fees: t_processing_fees,
          rows: arrayOfDatesOfCurrent
        }).send(res);
      }
      else {
        new SuccessResponse(EC.noDataFound, {
          count: 0,
          days: dateRangeOfCurrent.length,
          orders: 0,
          gross_sales: 0,
          refunds: 0,
          coupons: 0,
          net_sales: 0,
          processing_fees: 0,
          rows: []
        }).send(res);
      }
      // let productData = await 
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

}
