import { Request, Response } from "express";
import { ErrorController } from "../core/ErrorController";
import { enumerationController } from "./enumerationController";
import { SuccessResponse } from "../core/ApiResponse";
import { BadRequestError, ApiError } from "../core/ApiError";
import moment from "moment";
const { dbReader, dbWriter } = require("../models/dbConfig");
const EC = new ErrorController();
const enumObj = new enumerationController();
const { Op } = dbReader.Sequelize;

export class FreeTrialProductController {

  // Get list of free trial products
  public async listAllFreeTrialProducts(req: Request, res: Response) {
    try {
      let freeTrialProducts = await dbReader.freeTrialProduct.findAll({
        order: ["sort_order"], where: { is_deleted: 0 },
      });
      if (freeTrialProducts.length > 0) {
        let productData = JSON.parse(JSON.stringify(freeTrialProducts));
        new SuccessResponse(EC.success, {
          //@ts-ignore
          token: req.token,
          free_trial_products: productData,
        }).send(res);
      } else {
        new SuccessResponse(EC.noDataFound, {
          //@ts-ignore
          token: req.token,
          free_trial_products: [],
        }).send(res);
      }
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  // Add or Update a free trial product
  public async saveFreeTrialProduct(req: Request, res: Response) {
    try {
      let { product_id, product_title, product_logo, product_sub_logo, product_route, site_id, is_active, sort_order } = req.body;

      if (!product_id) {
        // Create a new product
        let newProduct = await dbWriter.freeTrialProduct.create({
          product_title, product_logo, product_sub_logo, product_route,
          site_id, is_active, sort_order, is_deleted: 0,
          created_datetime: new Date(),
        });
        newProduct = JSON.parse(JSON.stringify(newProduct));
        new SuccessResponse("Free trial product has been created successfully.", {
          //@ts-ignore
          token: req.token,
          free_trial_product: newProduct,
        }).send(res);
      } else {
        // Update an existing product
        await dbWriter.freeTrialProduct.update({
          product_title, product_logo, product_sub_logo,
          product_route, site_id, is_active, sort_order, is_deleted: 0,
          updated_datetime: moment().format("YYYY-MM-DD HH:mm:ss"),
        }, {
          where: { product_id }
        });
        new SuccessResponse("Free trial product has been updated successfully.", {
          //@ts-ignore
          token: req.token,
        }).send(res);
      }
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  // Delete a free trial product
  public async deleteFreeTrialProduct(req: Request, res: Response) {
    try {
      const { product_id } = req.body;

      await dbWriter.freeTrialProduct.update({
        is_deleted: 1,
        updated_datetime: moment().format("YYYY-MM-DD HH:mm:ss"),
      }, {
        where: { product_id }
      });

      new SuccessResponse("Free trial product has been deleted successfully.", {
        //@ts-ignore
        token: req.token,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async freeTrialBuyUsersReportData(req: Request, res: Response) {
    try {
      let { discount_type = 0, page_no, page_record, subscription_filter = { id: 0, label: "All" } } = req.body;
      let fte_condition: any = {};
      if (discount_type) {
        fte_condition = { fte_coupon_version: discount_type }
      } else {
        fte_condition = { fte_coupon_version: { [Op.gt]: 0 } }
      }
      let row_limit = page_record ? parseInt(page_record) : 10;
      let offset = page_no ? parseInt(page_no) : 1;
      let row_offset = (offset * row_limit) - row_limit;

      let allFreeTrialData = await dbReader.users.findAll({
        attributes: ['user_id', 'first_name', 'last_name', 'display_name', 'email', 'fte_coupon_version'],
        where: dbReader.Sequelize.and({ fte_coupon_version: { [Op.gt]: 0 } },
          dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('created_datetime'), '%Y-%m-%d %H:%M:%S'), { [Op.gt]: '2024-07-05 04:00:00' })),
        include: [{
          separate: true,
          model: dbReader.userSubscription,
          where: { fte_coupon_version: { [Op.gt]: 0 } },
          attributes: ['user_subscription_id', 'subscription_number', 'subscription_status', 'fte_coupon_version'],
          include: [{
            separate: true,
            model: dbReader.userOrder,
            attributes: ['user_orders_id', 'total_amount'],
            where: { order_status: [2, 3, 4, 5, 6, 8, 9] },
            include: [{
              separate: true,
              model: dbReader.userOrderItems,
              attributes: ['user_order_item_id', 'product_id', 'product_name', 'item_type'],
              where: { item_type: [1, 5], is_deleted: 0 }
            }],
            order: [['user_orders_id', 'DESC']]
          }]
        }]
      });
      allFreeTrialData = JSON.parse(JSON.stringify(allFreeTrialData));


      let freeTrialData = await dbReader.users.findAndCountAll({
        attributes: ['user_id', 'first_name', 'last_name', 'display_name', 'email', 'fte_coupon_version'],
        where: dbReader.Sequelize.and(fte_condition,
          dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('created_datetime'), '%Y-%m-%d %H:%M:%S'), { [Op.gt]: '2024-07-05 04:00:00' })),
        include: [{
          separate: true,
          model: dbReader.userSubscription,
          where: {
            ...fte_condition, 
        subscription_status: { [Op.notIn]: [7] }
          },
          attributes: ['user_subscription_id', 'subscription_number', 'subscription_status', 'fte_coupon_version'],
          include: [{
            separate: true,
            model: dbReader.userOrder,
            attributes: ['user_orders_id', 'total_amount'],
            where: { order_status: [2, 3, 4, 5, 6, 8, 9] },
            include: [{
              separate: true,
              model: dbReader.userOrderItems,
              attributes: ['user_order_item_id', 'product_id', 'product_name', 'item_type'],
              where: { item_type: [1, 5], is_deleted: 0 }
            }],
            order: [['user_orders_id', 'DESC']]
          }]
        }],
       // offset: row_offset,
        //limit: row_limit
      });
      freeTrialData = JSON.parse(JSON.stringify(freeTrialData));


      let filteredData = freeTrialData.rows.filter((user: any) => {
        if (subscription_filter.id === 1 ) {
        // Check if user_subscriptions is defined and has length > 0
    if (user.user_subscriptions && user.user_subscriptions.length > 0 && user.user_subscriptions.subscription_status !==7) {
   
      return user.user_subscriptions.some((subscription: any) => {
        return subscription.user_orders && subscription.user_orders.length > 0 
      
      });
     
     
   
    } else {
      return false; // No subscriptions or empty subscriptions
    }
             
          
        }

         else if (subscription_filter.id === 2) {
          return user.user_subscriptions.length === 0;
        }
          else if (subscription_filter.id === 3) {
          return true;
        }
        else {
          return true;
        }
      });


        // Pagination on filtered data
        const totalItems = filteredData.length;
        const startIndex = row_offset;
        const endIndex = Math.min(row_offset + row_limit, totalItems);
        const paginatedData = filteredData.slice(startIndex, endIndex);

      let allFreeTrialData1 = await dbReader.users.findAll({
        attributes: ['user_id', 'first_name', 'last_name', 'display_name', 'email', 'fte_coupon_version'],
        where: dbReader.Sequelize.and({ fte_coupon_version: { [Op.gt]: 0 } },
          dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('created_datetime'), '%Y-%m-%d %H:%M:%S'), { [Op.gt]: '2024-07-05 04:00:00' })),
        include: [{
          separate: true,
          model: dbReader.userSubscription,
          where: { fte_coupon_version: { [Op.gt]: 0 },subscription_status: [1,2,3,4,5,6,10] },
          attributes: ['user_subscription_id', 'subscription_number', 'subscription_status', 'fte_coupon_version'],
          include: [{
            separate: true,
            model: dbReader.userOrder,
            attributes: ['user_orders_id', 'total_amount'],
            where: { order_status: [2, 3, 4, 5, 6, 8, 9] },
            include: [{
              separate: true,
              model: dbReader.userOrderItems,
              attributes: ['user_order_item_id', 'product_id', 'product_name', 'item_type'],
              where: { item_type: [1, 5], is_deleted: 0 }
            }],
            order: [['user_orders_id', 'DESC']]
          }]
        }]
      });
      allFreeTrialData1 = JSON.parse(JSON.stringify(allFreeTrialData1));


      let total_purchases_25 = 0, total_purchases_15 = 0, total_purchases_no = 0;
      if (allFreeTrialData1.length) {
        allFreeTrialData1.forEach((element: any) => {
          if (element.user_subscriptions.length) {
            element.user_subscriptions.forEach((ele: any) => {
              switch (ele.fte_coupon_version) {
                case 1:
                  total_purchases_25 += 1;
                  break;
                case 2:
                  total_purchases_15 += 1;
                  break;
                case 3:
                  total_purchases_no += 1;
                  break;
              }
            });
          }
        });
      }
      let countData = {
        "25_discount": {
          "total_users": allFreeTrialData.length ? allFreeTrialData.filter((f: any) => f.fte_coupon_version == 1).length : 0,
          "total_purchases": total_purchases_25,
          "total_revenue":allFreeTrialData.length  ? allFreeTrialData
          .filter((f: any) => f.fte_coupon_version == 1)
          .flatMap((user: any) => user.user_subscriptions) // Flatten user_subscriptions
          .flatMap((subscription: any) => subscription.user_orders) // Flatten user_orders
          .filter((order: any) => order.total_amount !== undefined) // Filter orders with defined total_amount
          .reduce((acc: number, order: any) => acc + order.total_amount, 0) // Sum up total_amount
      : 0,
        
        },
        "15_discount": {
          "total_users": allFreeTrialData.length ? allFreeTrialData.filter((f: any) => f.fte_coupon_version == 2).length : 0,
          "total_purchases": total_purchases_15,
          "total_revenue":allFreeTrialData.length? allFreeTrialData
          .filter((f: any) => f.fte_coupon_version == 2)
          .flatMap((user: any) => user.user_subscriptions) // Flatten user_subscriptions
          .flatMap((subscription: any) => subscription.user_orders) // Flatten user_orders
          .filter((order: any) => order.total_amount !== undefined) // Filter orders with defined total_amount
          .reduce((acc: number, order: any) => acc + order.total_amount, 0) // Sum up total_amount
      : 0,
          
        },
        "no_discount": {
          "total_users": allFreeTrialData.length ? allFreeTrialData.filter((f: any) => f.fte_coupon_version == 3).length : 0,
          "total_purchases": total_purchases_no,
          "total_revenue":allFreeTrialData.length  ? allFreeTrialData
          .filter((f: any) => f.fte_coupon_version == 3)
          .flatMap((user: any) => user.user_subscriptions) // Flatten user_subscriptions
          .flatMap((subscription: any) => subscription.user_orders) // Flatten user_orders
          .filter((order: any) => order.total_amount !== undefined) // Filter orders with defined total_amount
          .reduce((acc: number, order: any) => acc + order.total_amount, 0) // Sum up total_amount
      : 0,
        }
      }
      new SuccessResponse(EC.success, {
        //@ts-ignore
        token: req.token,
        count: filteredData.length,
        count_data: countData,
        rows: paginatedData,
        
        

        
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
}
