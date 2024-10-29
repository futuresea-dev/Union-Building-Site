import { Request, Response } from "express";
import { ErrorController, SuccessResponse, BadRequestError, ApiError } from '../core/index';
const { dbReader, dbWriter } = require('../models/dbConfig');
const EC = new ErrorController();
import moment from "moment";

export class OrderController {

  /*
  *   Getting list of Orders  - 
  *   Code done by so 24-11-2021

  *   @params Optional
  *   user_id @Integer 
  *   order_id  @Integer 
  *   @return 
  *   Json Object   
  */
  public listOrder = async (req: Request, res: Response) => {
    try {
      let { search, orderStatus, site_id } = req.body;
      //Pagination
      var limit = req.body.page_record == undefined ? 10 : parseInt(req.body.page_record);
      var offset = req.body.page_no == undefined ? 1 : parseInt(req.body.page_no);
      // Automatic offset and limit will set on the base of page number
      var row_limit = limit;
      var row_offset = (offset * limit) - limit;
      // Added Code By So 01-12-2021
      // Getting sort field(column) and sort order(ASC) from body
      // If it is not passed in body then default values will set
      var sortField = 'user_orders_id', sortOrder = "DESC";
      if (req.body.sortField) {
        if (req.body.sortField == "user_name") {
          sortField = dbReader.Sequelize.literal('`sycu_user`.`display_name`')
        } else {
          sortField = req.body.sortField
        }
      }
      if (req.body.sortOrder) {
        sortOrder = req.body.sortOrder;
      }
      let userOrderModelData: any = {
        attributes: ['user_orders_id', 'fees_amount', 'tax_amount', 'sub_amount', 'shipping_amount', 'coupon_amount', 'created_datetime', 'user_id', 'user_subscription_id', 'user_order_number', 'order_status', 'total_amount', 'user_order_date', [dbReader.Sequelize.literal(`display_name`), 'user_name'], [dbReader.Sequelize.literal(`sycu_user.first_name`), 'first_name'], [dbReader.Sequelize.literal(`email`), 'email'], [dbReader.Sequelize.literal('`user_subscription`.`subscription_number`'), 'subscription_number'], [dbReader.Sequelize.literal('`user_subscription`.`coupon_code`'), 'coupon_code'], [dbReader.Sequelize.literal('`user_subscription`.`pg_transaction_type`'), 'pg_transaction_type']],
        include: [{
          model: dbReader.users,
          attributes: []
        }, {
          model: dbReader.userSubscription,
          attributes: [],
          where: { site_id: site_id }
        }, {
          separate: true,
          model: dbReader.userOrderItems
        }, {
          separate: true,
          model: dbReader.refunds
        }, {
          required: false,
          model: dbReader.transactionMaster,
          attributes: ['transaction_id', 'request_json', 'response_json', 'status', 'charge_id'],
          where: { type: 1 },
          include: [{
            model: dbReader.userCard
          }]
        }, {
          required: false,
          as: 'shippingAddress',
          model: dbReader.userAddress,
          attributes: ['user_address_id', 'first_name', 'last_name', 'address_line1', 'address_line2', 'city', 'company', 'zipcode', 'state_id', 'country_id', 'phone_number', 'email_address', 'customer_shipping_note', [dbReader.Sequelize.literal('`billingAddress->stateModel`.`state_code`'), 'state_code'], [dbReader.Sequelize.literal('`billingAddress->stateModel`.`name`'), 'state_name']],
          where: {
            address_type: 2
          },
          include: [{
            required: false,
            model: dbReader.stateModel,
            attributes: []
          }],
        }, {
          required: false,
          as: 'billingAddress',
          model: dbReader.userAddress,
          where: {
            address_type: 1
          },
          attributes: ['user_address_id', 'first_name', 'last_name', 'address_line1', 'address_line2', 'city', 'company', 'zipcode', 'state_id', 'country_id', 'phone_number', 'email_address', [dbReader.Sequelize.literal('`billingAddress->stateModel`.`state_code`'), 'state_code'], [dbReader.Sequelize.literal('`billingAddress->stateModel`.`name`'), 'state_name']],
          include: [{
            required: false,
            model: dbReader.stateModel,
            attributes: []
          }],
        }],
        order: [[sortField, sortOrder]],
        offset: row_offset,
        limit: row_limit
      }
      if (search) {
        userOrderModelData.where = dbReader.Sequelize.or({
          user_order_number: { [dbReader.Sequelize.Op.like]: `%${search}%` }
        }, {
          total_amount: { [dbReader.Sequelize.Op.like]: `%${search}%` }
        }, {
          user_order_date: { [dbReader.Sequelize.Op.like]: `%${search}%` }
        },
          dbReader.Sequelize.where(dbReader.Sequelize.literal('`sycu_user`.`display_name`'), { [dbReader.Sequelize.Op.like]: `%${search}%` }),
          dbReader.Sequelize.where(dbReader.Sequelize.literal('`sycu_user`.`email`'), { [dbReader.Sequelize.Op.like]: `%${search}%` }),
          dbReader.Sequelize.where(dbReader.Sequelize.literal('`sycu_user`.`mobile`'), { [dbReader.Sequelize.Op.like]: `%${search}%` })
        )
      }
      if (orderStatus) {
        if (orderStatus == 0) {
          orderStatus = [7, 1, 2, 3, 4, 5, 6, 8]
        } else if (orderStatus == 1) {
          orderStatus = [2, 3, 4, 5, 6, 8]
        } else {
          orderStatus = [7, 1]
        }
        if (userOrderModelData.where) {
          userOrderModelData.where = dbReader.Sequelize.and({
            ...userOrderModelData.where,
            order_status: orderStatus
          });
        } else {
          userOrderModelData.where = { order_status: orderStatus }
        }
      }
      let getUserOrderList = await dbReader.userOrder.findAndCountAll(userOrderModelData)
      //console.log(getUserOrderList)
      if (getUserOrderList.count > 0) {
        new SuccessResponse(EC.success, {
          //@ts-ignore
          token: req.token,
          count: getUserOrderList.count,
          order_list: getUserOrderList.rows
        }).send(res);
      } else {
        new SuccessResponse(EC.noDataFound, {}).send(res);
      }
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public getTotalOrders = async (req: Request, res: Response) => {
    try {
      let finalOrderCount: any = [], totalOrderCount = 0;

      let orderCount = await dbReader.userOrder.count({
        col: 'user_orders_id',
        group: ['order_status']
      });

      let i = 1;
      while (i <= 6) {
        var OrderCountList = orderCount.find((f: any) => f.order_status == i);
        if (OrderCountList) {
          totalOrderCount += OrderCountList.count
          finalOrderCount.push(OrderCountList);
        } else {
          var appendCount = {
            order_status: i,
            count: 0
          }
          finalOrderCount.push(appendCount);
        }
        i++;
      }
      finalOrderCount.unshift({ order_status: 0, count: totalOrderCount });
      new SuccessResponse(EC.DataFetched, {
        //@ts-ignore
        token: req.token,
        subscription: finalOrderCount
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public getOrderDetails = async (req: Request, res: Response) => {
    try {
      let { id } = req.params;
      let getOrderDetails = await dbReader.userOrder.findOne({
        where: { user_orders_id: id },
        attributes: ['user_order_number', 'sub_amount', 'total_amount', 'created_datetime', 'payment_type'],
        include: [{
          model: dbReader.users,
          attributes: ['first_name', 'last_name', 'email']
        }, {
          model: dbReader.userOrderItems,
          attributes: ['product_name', 'product_amount', 'item_type', 'updated_product_name', 'renewal_count'],
          include: [{
            required: false,
            model: dbReader.products,
            where: {
              is_deleted: 0
            }
          }]
        }, {
          model: dbReader.userSubscription,
          attributes: ['user_subscription_id', 'pg_transaction_type', 'start_date', 'end_date', 'total_amount', 'subscription_number'],
          include: [{
            model: dbReader.sites,
            attributes: ['title', 'url']
          }]
        }, {
          as: 'billingAddress',
          required: false,
          model: dbReader.userAddress,
          where: { address_type: 1 },
          attributes: ['address_line1', 'address_line2', 'city', [dbReader.Sequelize.literal('`billingAddress->stateModel`.`name`'), 'state_name'], [dbReader.Sequelize.literal('`billingAddress->countryModel`.`name`'), 'country_name'], 'zipcode'],
          include: [{
            model: dbReader.stateModel,
            attributes: []
          }, {
            model: dbReader.countryModel,
            attributes: []
          }]
        }, {
          model: dbReader.transactionMaster,
          attributes: ['transaction_id', 'transaction_details', 'status']
        }]
      });
      new SuccessResponse(EC.success, {
        //@ts-ignore
        token: req.token,
        data: getOrderDetails
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public updateOrderDetails = async (req: Request, res: Response) => {
    try {
      //@ts-ignore
      let { display_name } = req, logList: any = [], noteList: any = [];
      let { user_orders_id = 0, user_order_number, created_datetime = '', user_order_items = [] } = req.body;

      if (user_orders_id) {
        if (created_datetime) {
          await dbWriter.userOrder.update({
            user_order_date: moment(created_datetime).format("YYYY-MM-DD HH:mm:ss")
          }, {
            where: { user_orders_id: user_orders_id }
          });

          logList.push({
            type: 1,//order
            event_type_id: user_orders_id,
            message: "order #" + user_order_number + " date updated by Admin (" + display_name + ")",
          });
          noteList.push({
            type: 1,//order
            event_type_id: user_orders_id,
            message: "order #" + user_order_number + " date updated by Admin (" + display_name + ")",
          });
        }
        if (user_order_items.length) {
          let i = 0;
          while (i < user_order_items.length) {
            let userOrderItem = await dbReader.userOrderItems.findOne({
              where: { is_deleted: 0, user_order_item_id: user_order_items[i].user_order_item_id }
            });
            if (userOrderItem) {
              userOrderItem = JSON.parse(JSON.stringify(userOrderItem));
              if ((userOrderItem.updated_product_id == 0 && userOrderItem.product_id != user_order_items[i].product_id && userOrderItem.product_name != user_order_items[i].product_name) || userOrderItem.updated_product_id != user_order_items[i].product_id && userOrderItem.updated_product_name != user_order_items[i].product_name) {
                await dbWriter.userOrderItems.update({
                  product_id: user_order_items[i].product_id,
                  updated_product_id: user_order_items[i].product_id,
                  product_name: user_order_items[i].product_name,
                  updated_product_name: user_order_items[i].product_name,
                }, {
                  where: { user_order_item_id: user_order_items[i].user_order_item_id }
                });

                logList.push({
                  type: 1,//order
                  event_type_id: user_orders_id,
                  message: "order #" + user_order_number + " product updated from '" + userOrderItem.product_name + "' to '" + user_order_items[i].product_name + "' by Admin (" + display_name + ")",
                });
                noteList.push({
                  type: 1,//order
                  event_type_id: user_orders_id,
                  message: "order #" + user_order_number + " product updated from '" + userOrderItem.product_name + "' to '" + user_order_items[i].product_name + "' by Admin (" + display_name + ")",
                });
              }
              if (userOrderItem.renewal_count != user_order_items[i].renewal_count) {
                await dbWriter.userOrderItems.update({
                  renewal_count: user_order_items[i].renewal_count
                }, {
                  where: { user_order_item_id: user_order_items[i].user_order_item_id }
                });

                logList.push({
                  type: 1,//order
                  event_type_id: user_orders_id,
                  message: "order #" + user_order_number + " product renewal count updated from " + userOrderItem.renewal_count + " to " + user_order_items[i].renewal_count + " by Admin (" + display_name + ")",
                });
                noteList.push({
                  type: 1,//order
                  event_type_id: user_orders_id,
                  message: "order #" + user_order_number + " product renewal count updated from " + userOrderItem.renewal_count + " to " + user_order_items[i].renewal_count + " by Admin (" + display_name + ")",
                });
              }
            }
            i++
          }
        }
      }

      //save log
      if (logList.length)
        await dbWriter.logs.bulkCreate(logList);
      // save notes
      if (noteList.length)
        await dbWriter.notes.bulkCreate(noteList);

      new SuccessResponse(EC.success, {
        //@ts-ignore
        token: req.token
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
}