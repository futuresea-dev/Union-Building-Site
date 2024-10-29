import { Request, Response } from "express";
import moment from 'moment';
import _ from 'lodash';
import { ErrorController, SuccessResponse, BadRequestError, ApiError } from '../../core/index';
const { dbReader } = require('../../models/dbConfig');
const EC = new ErrorController();
const { Op } = dbReader.Sequelize;
import { getDateRange } from '../../helpers/helpers';
import { any } from "joi";

export class OrderReportController {
  public async getOrderCount(req: Request, res: Response) {
    try {
      let { range } = req.body;
      let { compared_range, site_id } = req.body;
      let siteCondition = {};
      if (site_id) {
        siteCondition = { site_id: site_id }
      }
      let currentYearData = await dbReader.userOrder.findAll({
        attributes: [[dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('`user_orders`.`created_datetime`'), '%Y-%m-%d'), 'created_date'], 'user_orders_id'],
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
          where: { item_type: 1 },
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
      let amount = 0, processing_fee = 0;
      let amount1 = 0, processing_fee1 = 0;;
      let order = 0;
      let order1 = 0;
      let item = 0
      let item1 = 0
      let d11 = currentYearData.filter((s: any) => s.created_date >= range.start_date && s.created_date <= range.end_date)
      let d22 = currentYearData.filter((s: any) => s.created_date >= compared_range.start_date && s.created_date <= compared_range.end_date)
      d11.forEach((ed1: any) => {
        order++;
        amount += ed1.sycu_transaction_master.amount
        processing_fee += ed1.sycu_transaction_master.processing_fee
        ed1.user_order_items.forEach((e2: any) => {
          item++
        });
      });
      let netSales = amount - processing_fee;
      let averageOrderValue = (netSales / order) ? (netSales / order) : 0;
      let averageItemPerOrder = (item / order) ? (item / order) : 0;
      d22.forEach((ed2: any) => {
        order1++
        amount1 += ed2.sycu_transaction_master.amount
        processing_fee1 += ed2.sycu_transaction_master.processing_fee
        ed2.user_order_items.forEach((e2: any) => {
          item1++
        });
      });
      let netSales1 = amount1 - processing_fee1;
      let averageOrderValue1 = (netSales1 / order1) ? (netSales1 / order1) : 0
      let averageItemPerOrder1 = (item1 / order1) ? (item1 / order1) : 0
      if (currentYearData.length > 0) {
        new SuccessResponse(EC.success, {
          reports: {
            net_sales: {
              value: parseFloat((netSales).toFixed(2)),
              previousPeriodValue: parseFloat((netSales1).toFixed(2)),
            },
            orders: {
              value: order,
              previousPeriodValue: order1,
            },
            average_order_value: {
              value: averageOrderValue,
              previousPeriodValue: averageOrderValue1,
            },
            average_item_per_order: {
              value: averageItemPerOrder,
              previousPeriodValue: averageItemPerOrder1,
            }
          }
        }).send(res);
      }
      else {
        new SuccessResponse(EC.noDataFound, {
          reports: {
            net_sales: {
              value: 0,
              previousPeriodValue: 0,
            },
            orders: {
              value: 0,
              previousPeriodValue: 0,
            },
            average_order_value: {
              value: 0,
              previousPeriodValue: 0,
            },
            average_item_per_order: {
              value: 0,
              previousPeriodValue: 0,
            }
          }
        }).send(res);
      }
      // let productData = await 
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async getOrderGraphData(req: Request, res: Response) {
    try {
      let { range, compared_range, by, type, site_id } = req.body
      let siteCondition = {};
      if (site_id) {
        siteCondition = { site_id: site_id }
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
          where: { item_type: 1 },
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
      if (currentYearData) {
        let returnData: any = [];
        let order = 0, order1 = 0, item = 0, item1 = 0, avg = 0, avg1 = 0
        switch (by) {
          case "quarter":
            let by_quarterly_date1: any = moment(range.start_date, 'DD-MM-YYYY').format('MM');
            // let by_quarterly_date1 = moment(range.start_date, 'DD-MM-YYYY');
            let by_quarterly_date2: any = moment(range.end_date).format('MM');
            // let by_quarterly_date2 = moment(range.end_date, 'DD-MM-YYYY');
            // let by_quarterly_monthDiff1 = by_quarterly_date2.diff(by_quarterly_date1, 'month');
            let by_quarterly_monthDiff1 = by_quarterly_date2 - by_quarterly_date1
            console.log(by_quarterly_monthDiff1)
            for (let index = 0; index < by_quarterly_monthDiff1; index++) {
              let d1 = moment(range.start_date).add(index, 'M').format('YYYY-MM');
              let d2 = moment(compared_range.start_date).add(index, 'M').format('YYYY-MM');
              let d11 = currentYearData.filter((s: any) => s.created_datetime == d1)
              let d22 = currentYearData.filter((s: any) => s.created_datetime == d2)
              let d111 = 0, d222 = 0
              d11.forEach((ed1: any) => {
                console.log(ed1)
                if (type == "orders" || type == "average_order_value" || type == "average_item_per_order") {
                  if (type == "orders") {
                    d111++
                  } else {
                    order++
                  }
                }
                if (type == "net_sales" || type == "average_order_value") {
                  if (type == "net_sales") {
                    d111 += ed1.sycu_transaction_master.amount
                    d111 -= ed1.sycu_transaction_master.processing_fee
                  } else {
                    avg += ed1.sycu_transaction_master.amount,
                      avg -= ed1.sycu_transaction_master.processing_fee
                  }
                }
                ed1.user_order_items.forEach((e2: any) => {
                  if (type == "average_item_per_order") {
                    item++
                  }
                });
                if (type == "average_order_value") {
                  d111 = (avg / order)
                }
                if (type == "average_item_per_order") {
                  d111 = (item / order)
                }
              });
              d22.forEach((ed2: any) => {
                if (type == "net_sales" || type == "average_order_value") {
                  if (type == "net_sales") {
                    d222 += ed2.sycu_transaction_master.amount
                    d222 -= ed2.sycu_transaction_master.processing_fee
                  } else {
                    avg1 += ed2.sycu_transaction_master.amount,
                      avg1 -= ed2.sycu_transaction_master.processing_fee
                  }
                }
                if (type == "orders" || type == "average_order_value" || type == "average_item_per_order") {
                  if (type == "orders") {
                    d222++
                  } else {
                    order1++
                  }
                }
                ed2.user_order_items.forEach((e2: any) => {
                  if (type == "average_item_per_order") {
                    item1++
                  }
                });
                if (type == "average_order_value") {
                  d222 = (avg1 / order1)
                }
                if (type == "average_item_per_order") {
                  d222 = (item1 / order1)
                }
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
                if (type == "orders" || type == "average_order_value" || type == "average_item_per_order") {
                  if (type == "orders") {
                    d111++
                  } else {
                    order++
                  }
                }
                if (type == "net_sales" || type == "average_order_value") {
                  if (type == "net_sales") {
                    d111 += ed1.sycu_transaction_master.amount
                    d111 -= ed1.sycu_transaction_master.processing_fee
                  } else {
                    avg += ed1.sycu_transaction_master.amount,
                      avg -= ed1.sycu_transaction_master.processing_fee
                  }
                }
                ed1.user_order_items.forEach((e2: any) => {
                  if (type == "average_item_per_order") {
                    item++
                  }
                });
                if (type == "average_order_value") {
                  d111 = (avg / order)
                }
                if (type == "average_item_per_order") {
                  d111 = (item / order)
                }
              });
              d22.forEach((ed2: any) => {
                if (type == "net_sales" || type == "average_order_value") {
                  if (type == "net_sales") {
                    d222 += ed2.sycu_transaction_master.amount
                    d222 -= ed2.sycu_transaction_master.processing_fee
                  } else {
                    avg1 += ed2.sycu_transaction_master.amount,
                      avg1 -= ed2.sycu_transaction_master.processing_fee
                  }
                }
                if (type == "orders" || type == "average_order_value" || type == "average_item_per_order") {
                  if (type == "orders") {
                    d222++
                  } else {
                    order1++
                  }
                }
                ed2.user_order_items.forEach((e2: any) => {
                  if (type == "average_item_per_order") {
                    item1++
                  }
                });
                if (type == "average_order_value") {
                  d222 = (avg1 / order1)
                }
                if (type == "average_item_per_order") {
                  d222 = (item1 / order1)
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
                if (type == "orders" || type == "average_order_value" || type == "average_item_per_order") {
                  if (type == "orders") {
                    d111++
                  } else {
                    order++
                  }
                }
                if (type == "net_sales" || type == "average_order_value") {
                  if (type == "net_sales") {
                    d111 += ed1.sycu_transaction_master.amount
                    d111 -= ed1.sycu_transaction_master.processing_fee
                  } else {
                    avg += ed1.sycu_transaction_master.amount,
                      avg -= ed1.sycu_transaction_master.processing_fee
                  }
                }
                ed1.user_order_items.forEach((e2: any) => {
                  if (type == "average_item_per_order") {
                    item++
                  }
                });
                if (type == "average_order_value") {
                  d111 = (avg / order)
                }
                if (type == "average_item_per_order") {
                  d111 = (item / order)
                }
              });
              DR2.forEach((ed2: any) => {
                if (type == "net_sales" || type == "average_order_value") {
                  if (type == "net_sales") {
                    d222 += ed2.sycu_transaction_master.amount
                    d222 -= ed2.sycu_transaction_master.processing_fee
                  } else {
                    avg1 += ed2.sycu_transaction_master.amount,
                      avg1 -= ed2.sycu_transaction_master.processing_fee
                  }
                }
                if (type == "orders" || type == "average_order_value" || type == "average_item_per_order") {
                  if (type == "orders") {
                    d222++
                  } else {
                    order1++
                  }
                }
                ed2.user_order_items.forEach((e2: any) => {
                  if (type == "average_item_per_order") {
                    item1++
                  }
                });
                if (type == "average_order_value") {
                  d222 = (avg1 / order1)
                }
                if (type == "average_item_per_order") {
                  d222 = (item1 / order1)
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
              let DR1 = currentYearData.filter((s: any) => s.created_datetime == startDate1);
              let DR2 = currentYearData.filter((s: any) => s.created_datetime == startDate2);
              let d111 = 0, d222 = 0;
              DR1.forEach((ed1: any) => {
                if (type == "orders" || type == "average_order_value" || type == "average_item_per_order") {
                  if (type == "orders") {
                    d111++
                  } else {
                    order++
                  }
                }
                if (type == "net_sales" || type == "average_order_value") {
                  if (type == "net_sales") {
                    d111 += ed1.sycu_transaction_master.amount
                    d111 -= ed1.sycu_transaction_master.processing_fee
                  } else {
                    avg += ed1.sycu_transaction_master.amount,
                      avg -= ed1.sycu_transaction_master.processing_fee
                  }
                }
                ed1.user_order_items.forEach((e2: any) => {
                  if (type == "average_item_per_order") {
                    item++
                  }
                });
                if (type == "average_order_value") {
                  d111 = (avg / order)
                }
                if (type == "average_item_per_order") {
                  d111 = (item / order)
                }
              });
              DR2.forEach((ed2: any) => {
                if (type == "net_sales" || type == "average_order_value") {
                  if (type == "net_sales") {
                    d222 += ed2.sycu_transaction_master.amount
                    d222 -= ed2.sycu_transaction_master.processing_fee
                  } else {
                    avg1 += ed2.sycu_transaction_master.amount,
                      avg1 -= ed2.sycu_transaction_master.processing_fee
                  }
                }
                if (type == "orders" || type == "average_order_value" || type == "average_item_per_order") {
                  if (type == "orders") {
                    d222++
                  } else {
                    order1++
                  }
                }
                ed2.user_order_items.forEach((e2: any) => {
                  if (type == "average_item_per_order") {
                    item1++
                  }
                });
                if (type == "average_order_value") {
                  d222 = (avg1 / order1)
                }
                if (type == "average_item_per_order") {
                  d222 = (item1 / order1)
                }
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
            // console.log(DR1)
            let a = (
              (moment(range.end_date)).set({ hour: 23, minute: 59, second: 59 })).diff(moment(range.start_date).set({ hour: 0o0, minute: 0o0, second: 0o0 }), 'hours')
            console.log(a)
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
                if (type == "orders" || type == "average_order_value" || type == "average_item_per_order") {
                  if (type == "orders") {
                    d111++
                  } else {
                    order++
                  }
                }
                if (type == "net_sales" || type == "average_order_value") {
                  if (type == "net_sales") {
                    d111 += ed1.sycu_transaction_master.amount
                    d111 -= ed1.sycu_transaction_master.processing_fee
                  } else {
                    avg += ed1.sycu_transaction_master.amount,
                      avg -= ed1.sycu_transaction_master.processing_fee
                  }
                }
                ed1.user_order_items.forEach((e2: any) => {
                  if (type == "average_item_per_order") {
                    item++
                  }
                });
                if (type == "average_order_value") {
                  d111 = (avg / order)
                }
                if (type == "average_item_per_order") {
                  d111 = (item / order)
                }
              });
              d22.forEach((ed2: any) => {
                if (type == "net_sales" || type == "average_order_value") {
                  if (type == "net_sales") {
                    d222 += ed2.sycu_transaction_master.amount
                    d222 -= ed2.sycu_transaction_master.processing_fee
                  } else {
                    avg1 += ed2.sycu_transaction_master.amount,
                      avg1 -= ed2.sycu_transaction_master.processing_fee
                  }
                }
                if (type == "orders" || type == "average_order_value" || type == "average_item_per_order") {
                  if (type == "orders") {
                    d222++
                  } else {
                    order1++
                  }
                }
                ed2.user_order_items.forEach((e2: any) => {
                  if (type == "average_item_per_order") {
                    item1++
                  }
                });
                if (type == "average_order_value") {
                  d222 = (avg1 / order1)
                }
                if (type == "average_item_per_order") {
                  d222 = (item1 / order1)
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

  public async getOrderListDateWise(req: Request, res: Response) {
    try {
      let { range, page_record, page_no, sort_field, sort_order, site_id } = req.body;
      let siteCondition = {};
      if (site_id) {
        siteCondition = { site_id: site_id }
      }
      //Pagination
      var limit = page_record == undefined ? 10 : parseInt(page_record);
      var offset = page_no == undefined ? 1 : parseInt(page_no);
      // Automatic Offset and limit will set on the base of page number
      var row_limit = limit;
      var row_offset = (offset * limit) - limit;

      sort_order = sort_order ? sort_order : "DESC";
      if (sort_field == "user_name") {
        sort_field = dbReader.Sequelize.literal('`sycu_user`.`display_name`');
      } else if (sort_field == "created_date") {
        sort_field = dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('`user_orders`.`created_datetime`'), '%Y-%m-%d')
      }
      else if (sort_field == "user_order_items") {
        sort_field = dbReader.Sequelize.literal('`user_order_items`.`product_name`');
      }
      else {
        sort_field = sort_field
      }
      let currentYearData = await dbReader.userOrder.findAll({
        attributes: [[dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('`user_orders`.`created_datetime`'), '%Y-%m-%d'), 'created_date'], 'user_orders_id', 'user_order_number', 'order_status',
        [dbReader.Sequelize.literal('`sycu_user`.`display_name`'), 'user_name'], [dbReader.Sequelize.literal('`sycu_user`.`email`'), 'email'], 'site_id', [dbReader.Sequelize.literal('`sycu_transaction_master`.`amount`'), 'total_amount'],],
        where: dbReader.Sequelize.and(
          { order_status: [2, 3, 4, 5, 6, 7, 8] },
          dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.gte]: range.start_date }),
          dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.lte]: range.end_date })
        ),
        include: [{
          // separate: true,
          model: dbReader.userOrderItems,
          attributes: ['item_type', 'product_amount', 'user_orders_id', 'created_datetime', 'product_name']
        }, {
          model: dbReader.users,
          attributes: [],
        }, {
          required: true,
          model: dbReader.transactionMaster,
          where: { type: 1 },
          attributes: ['amount', 'processing_fee']
        }, {
          required: true,
          model: dbReader.transactionMaster,
          where: { status: 'Success', type: 1 },
          attributes: ['amount', 'processing_fee']
        }, {
          required: true,
          model: dbReader.userSubscription,
          where: siteCondition
        }],
        order: [[sort_field, sort_order]],
      })
      currentYearData = JSON.parse(JSON.stringify(currentYearData))
      if (currentYearData.length > 0) {
        currentYearData = currentYearData.splice(row_offset, row_limit);
        let data = await dbReader.userOrder.findAll({
          attributes: [[dbReader.Sequelize.fn('date_format', dbReader.Sequelize.col('`user_orders`.`created_datetime`'), '%Y-%m-%d'), 'created_date'], 'user_orders_id', 'user_order_number', 'order_status', 'total_amount',
          [dbReader.Sequelize.literal('`sycu_user`.`display_name`'), 'user_name'], [dbReader.Sequelize.literal('`sycu_user`.`user_id`'), 'user_id']],
          where: dbReader.Sequelize.and(
            { order_status: [2, 3, 4, 5, 6, 8] },
            dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.gte]: range.start_date }),
            dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m-%d'), { [dbReader.Sequelize.Op.lte]: range.end_date })
          ),
          include: [{
            separate: true,
            model: dbReader.userOrderItems,
            attributes: ['item_type', 'product_amount', 'user_orders_id', 'created_datetime', 'product_name', 'product_id']
          }, {
            model: dbReader.users,
            attributes: [],
          }, {
            required: true,
            model: dbReader.transactionMaster,
            where: { status: 'Success', type: 1 },
            attributes: ['amount', 'processing_fee']
          }, {
            required: true,
            model: dbReader.userSubscription,
            where: siteCondition
          }],
        })
        data = JSON.parse(JSON.stringify(data))
        let uniqueUser: any = [], uniqueProduct: any = [], uniqueCoupon: any = [], order = 0, item = 0, netSales = 0
        data.forEach((ele: any) => {
          netSales += ele.sycu_transaction_master.amount
          netSales -= ele.sycu_transaction_master.processing_fee
          order++

          if (!uniqueUser.includes(ele.user_id)) {
            uniqueUser.push(ele.user_id)
          }
          ele.user_order_items.forEach((e: any) => {
            item++
            if (e.item_type == 1) {
              if (!uniqueProduct.includes(e.product_id)) {
                uniqueProduct.push(e.product_id)
              }

            }
            if (e.item_type == 5) {
              if (!uniqueCoupon.includes(e.product_id)) {
                uniqueCoupon.push(e.product_id)
              }
            }
          });
        });
        new SuccessResponse(EC.success, {
          total_orders: order,
          customer: uniqueUser.length,
          products: uniqueProduct.length,
          item_sold: item,
          net_sales: netSales,
          coupons: uniqueCoupon.length,
          rows: currentYearData
        }).send(res);
      }
      else {
        new SuccessResponse(EC.noDataFound, {
          total_orders: 0,
          customer: 0,
          products: 0,
          item_sold: 0,
          net_sales: 0,
          coupons: 0,
          rows: []
        }).send(res);
      }
      // let productData = await 
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

}
