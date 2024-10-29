import { Request, Response } from "express";
import { ErrorController, SuccessResponse, BadRequestError, ApiError } from '../core/index';
const { dbReader, dbWriter } = require('../models/dbConfig');
const { Op } = dbReader.Sequelize;
const EC = new ErrorController();
import moment from "moment";
import { ActiveCampaignController } from "./thirdParty/activeCampaignController";
import { checkoutController } from "./checkoutController";
var activeCampaign = new ActiveCampaignController();
var checkout = new checkoutController();

export class UserSubscriptionController {

  /*
  * Getting Subscriptions  List - 
  * Code done by so
  * @params Optional
  *   user_id @Integer 
  *   subscription id  @Integer 
  * @return 
  *   Json Object 
  */
  public listSubscription = async (req: Request, res: Response) => {
    try {
      let { subscription_status, page_record, page_no, search, user_id = 0, site_id = 0, sortField, sortOrder } = req.body;
      //Pagination
      let row_limit = !page_record ? 10 : parseInt(page_record);
      let offset = !page_no ? 1 : parseInt(page_no);
      let row_offset = (offset * row_limit) - row_limit;
      let _sortOrder = sortOrder ? sortOrder : "DESC";
      let _sortField = sortField ? sortField : 'user_subscription_id';
      let subscriptionWhere = {};
      if (user_id) {
        subscriptionWhere = { "user_id": user_id }
      }
      // Searching                           
      let SearchCondition = dbReader.Sequelize.Op.ne, SearchData = null;
      if (search) {
        SearchCondition = Op.like;
        SearchData = "%" + search + "%";
      }
      // DS 24-12-2021 
      // Sub Status 
      let subscriptionStatusCond = dbReader.Sequelize.Op.notIn, subscriptionStatusData = [0, 1];
      if (subscription_status && subscription_status != 0) {
        subscriptionStatusCond = dbReader.Sequelize.Op.eq;
        subscriptionStatusData = subscription_status;
      }
      // Filtering
      let filter = dbReader.Sequelize.and();
      if (req.body.filter) {
        let data = req.body.filter[0];
        filter = dbReader.Sequelize.and(data);
      }
      let siteCond = dbReader.Sequelize.Op.ne, siteData = null;
      if (site_id) {
        siteCond = dbReader.Sequelize.Op.eq;
        siteData = site_id;
      }

      let getUserSubscriptionList = await dbReader.userSubscription.findAndCountAll({
        where: dbReader.Sequelize.and(subscriptionWhere,
          { subscription_status: { [subscriptionStatusCond]: subscriptionStatusData } },
          { site_id: { [siteCond]: siteData } },
          dbReader.Sequelize.or(
            dbReader.Sequelize.where(dbReader.Sequelize.literal('`sycu_user`.`display_name`'), { [SearchCondition]: SearchData }),
            dbReader.Sequelize.where(dbReader.Sequelize.literal(`(SELECT user_subscription_id from sycu_user_subscription_items WHERE item_type = 1 AND user_subscription_id = user_subscription.user_subscription_id AND is_deleted = 0 AND product_name LIKE '${SearchData}' GROUP BY user_subscription_id) `), { [dbReader.Sequelize.Op.ne]: null }),
            { subscription_number: { [SearchCondition]: SearchData } },
            { total_amount: { [SearchCondition]: SearchData } }
          )),
        attributes: ['subscription_status', 'subscription_number', 'user_id', 'total_amount', 'next_payment_date', 'user_subscription_id', 'start_date', 'is_renewal', 'site_id',
          [dbReader.Sequelize.literal('`sycu_user`.`display_name`'), 'user_name']],
        include: [{
          required: true,
          attributes: [],
          model: dbReader.users,
          where: { is_deleted: 0 }
        }, {
          required: false,
          model: dbReader.disputedTransaction,
          attributes: ['status'],
          where: { is_deleted: 0 }
        }, {
          separate: true,
          model: dbReader.userSubscriptionItems,
          where: { is_deleted: 0, item_type: { [dbReader.Sequelize.Op.notIn]: [2, 3] } },
          attributes: ['user_subscription_item_id', 'user_subscription_id', 'product_name', 'product_id', 'product_amount',
            'coupon_amount', 'shipping_fees', 'processing_fees', 'created_datetime', 'item_type', 'updated_product_name',
            [dbReader.Sequelize.literal('`sycu_product->sycu_site`.`logo`'), 'site_logo']],
          include: [{
            model: dbReader.products,
            attributes: [],
            include: [{
              model: dbReader.sites,
              attributes: [],
            }]
          }]
        }, {
          separate: true,
          model: dbReader.userOrder,
          attributes: ['user_subscription_id'],
          include: [{
            separate: true,
            model: dbReader.userOrderItems,
            where: { is_deleted: 0 },
            include: [{
              model: dbReader.products,
              attributes: ['product_id', 'product_duration']
            }]
          }],
          order: [['user_order_date', 'DESC']]
        }],
        offset: row_offset,
        limit: row_limit,
        order: [[_sortField, _sortOrder]]
      });
      getUserSubscriptionList = JSON.parse(JSON.stringify(getUserSubscriptionList));
      if (getUserSubscriptionList.count > 0) {
        let s = 0
        while (s < getUserSubscriptionList.rows.length) {
          let element = getUserSubscriptionList.rows[s];
          element.disputed_status = (element.sycu_disputed_transaction) ? element.sycu_disputed_transaction.status : '';
          delete element.sycu_disputed_transaction
          element.order_count = element.user_orders.length
          // delete element.user_orders;
          element.total_amount = 0;
          let productIds: any = [], products_list: any = [], i = 0;
          element.user_subscription_items.forEach((e: any) => {
            if (e.item_type == 1) {
              productIds.push(e.product_id)
              products_list.push({
                total_amount: e.shipping_fees + e.processing_fees + e.product_amount,
                shipping_fees: e.shipping_fees,
                processing_fees: e.processing_fees,
                product_price: e.product_amount
              })
            }
          });
          while (i < element.user_subscription_items.length) {
            if (element.user_subscription_items[i].item_type == 5) {
              let userOrdersIds: any = []
              if (element.user_orders.length) {
                element.user_orders.forEach((e: any) => {
                  userOrdersIds.push(e.user_orders_id)
                });
              }

              // validate coupon code
              let couponDetails = {
                coupon_code: element.coupon_code ? element.coupon_code : '',
                coupon_ids: [element.user_subscription_items[i].product_id],
                user_id: element.user_id,
                site_id: element.site_id,
                products_list: products_list,
                product_id: productIds,
                user_subscription_id: element.user_subscription_id,
                is_instant_payment: 1
              }
              let couponValidation = await checkout.validateCouponCode(couponDetails);
              if (couponValidation && couponValidation.isVerified) {
                couponValidation.coupon_data.forEach((cd: any) => {
                  if (cd.coupon_id == element.user_subscription_items[i].product_id) {
                    element.user_subscription_items[i].product_amount = cd.coupon_discount
                  }
                })
              }

              let userCouponsData = await dbReader.coupons.findOne({
                attributes: ['coupon_id', 'coupon_expire_date_time', 'user_used_limit'],
                where: {
                  is_deleted: 0,
                  coupon_id: element.user_subscription_items[i].product_id,
                },
                include: [{
                  as: 'TopCoupon',
                  separate: true,
                  model: dbReader.sycuUserCoupon,
                  attributes: ['user_coupon_id', 'user_id', 'coupon_id', 'user_orders_id'],
                  where: { user_orders_id: userOrdersIds }
                }, {
                  separate: true,
                  model: dbReader.refunds,
                  attributes: ['refund_id', 'order_id', 'coupon_id'],
                  where: { refund_type: 3 },
                }]
              })
              if (userCouponsData) {
                userCouponsData = JSON.parse(JSON.stringify(userCouponsData));
                let TopCouponArray: any = []
                element.user_orders.forEach((orderele: any) => {
                  if (orderele.order_status != 7 && orderele.order_status != 1) {
                    orderele.user_order_items.forEach((item: any) => {
                      if (item.item_type == 5 && (item.product_id == userCouponsData.coupon_id || item.updated_product_id == userCouponsData.coupon_id)) {
                        let temp_coupon_id = (item.product_id == userCouponsData.coupon_id) ? item.product_id : item.updated_product_id;
                        TopCouponArray.push({
                          user_coupon_id: 0,
                          user_id: element.user_id,
                          coupon_id: temp_coupon_id,
                          user_orders_id: item.user_orders_id,
                          is_refund: false
                        })
                      }
                    })
                  }
                })
                if (userCouponsData.refunds && userCouponsData.refunds.length) {
                  userCouponsData.refunds.forEach((r: any) => {
                    TopCouponArray.push({
                      user_coupon_id: 0,
                      user_id: element.user_id,
                      coupon_id: r.coupon_id,
                      user_orders_id: r.order_id,
                      is_refund: true
                    })
                  });
                }
                if (!userCouponsData.TopCoupon || !userCouponsData.TopCoupon.length ||
                  (userCouponsData.TopCoupon && userCouponsData.TopCoupon.length != TopCouponArray.length)) {
                  userCouponsData.TopCoupon = TopCouponArray;
                }
                element.user_subscription_items[i].coupons = userCouponsData;
              }
            }
            i++;
          }
          element.user_subscription_items.forEach((e: any) => {
            switch (e.item_type) {
              case 1:
                element.total_amount += e.product_amount;
                break;
              case 2:
                element.total_amount += e.product_amount;
                break;
              case 3:
                element.total_amount += e.product_amount;
                break;
              case 4:
                element.total_amount += e.product_amount;
                break;
              case 5:
                let flag = true
                if (e.coupons) {
                  if (e.coupons.user_used_limit != 0 && e.coupons.TopCoupon && e.coupons.TopCoupon.length >= e.coupons.user_used_limit) {
                    flag = false
                  } else if (e.coupons.coupon_expire_date_time &&
                    (moment().format('YYYY-MM-DD') > moment(e.coupons.coupon_expire_date_time).format('YYYY-MM-DD'))) {
                    flag = false
                  }
                }
                if (flag == true) element.total_amount -= e.product_amount;
                break;
              default:
                break;
            }
          });
          element.total_amount = (element.total_amount < 0) ? 0 : element.total_amount;
          s++;
        }

        new SuccessResponse(EC.success, {
          //@ts-ignore
          token: req.token,
          count: getUserSubscriptionList.count,
          subscription_list: getUserSubscriptionList.rows
        }).send(res);
      } else {
        new SuccessResponse(EC.noDataFound, {
          //@ts-ignore
          token: req.token,
          count: 0,
          subscription_list: []
        }).send(res);
      }
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  /*
    * Getting Subscriptions details and other details of user- 
    * Code done by so 
    * @return 
    *   Json Object 
  */
  public getUserSubscriptionDetail = async (req: Request, res: Response) => {
    try {
      var userId = Number(req.params.id);
      if (userId != undefined) {
        var getUserSubscriptionDetail = await dbReader.userSubscription.findOne({
          include: [{
            model: dbReader.userOrder
          }, {
            model: dbReader.userAddress,
            where: {
              user_id: userId
            }
          }],
          where: {
            user_id: userId
          }
        });

        new SuccessResponse("", {
          //@ts-ignore
          token: req.token,
          data: getUserSubscriptionDetail
        }).send(res);
      }
      else {
        ApiError.handle(new BadRequestError(EC.userIdNullErrorMessage), res);
      }
    }
    catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async createNewSubscription(req: Request, res: Response) {
    let { user_id = 0, site_id = 0 } = req.body;
    var subscription = await dbWriter.sequelize.query(`CALL sp_createNewSubscription (${site_id})`);
    let user_data = null;
    if (user_id) {
      user_data = await dbReader.users.findOne({
        where: { user_id: user_id },
        attributes: ['user_id', 'first_name', 'last_name', 'display_name']
      });
    }
    new SuccessResponse(EC.errorMessage(EC.saveDataSuccess, ["Product folder"]), {
      user: user_data,
      //@ts-ignore
      token: req.token,
      subscription: subscription.length > 0 ? subscription[0] : null
    }).send(res);
  }

  public async updateUserSubscriptionStatus(req: Request, res: Response) {
    try {
      let { user_subscription_id, status } = req.body;
      if (user_subscription_id) {
        let findSubscription = await dbReader.userSubscription.findOne({
          attributes: ['user_subscription_id', 'subscription_number'],
          where: { user_subscription_id: user_subscription_id }
        });
        if (findSubscription) {
          findSubscription = JSON.parse(JSON.stringify(findSubscription));
          await dbWriter.userSubscription.update({
            subscription_status: status
          }, {
            where: { user_subscription_id: user_subscription_id }
          });

          try {
            let apiLogData = {
              user_id: findSubscription.user_id,
              user_subscription_id: user_subscription_id,
              subscription_status: status
            }
            await dbWriter.apiLogs.create({
              api_url: "/updateUserSubscriptionStatus",
              method: "POST",
              request: JSON.stringify(req.body),
              response: JSON.stringify(apiLogData),
              header: JSON.stringify(req.headers)
            })
          } catch (error) {

          }

          let Status = (status == 2 ? "Active" : (status == 4 ? "Pending Cancellation" : (status == 5 ? "Cancelled" : status == 6 ? "Expired" : status)))
          let logList = [{
            type: 2,
            event_type_id: user_subscription_id,
            message: "subscription #" + findSubscription.subscription_number + " status changed to '" + Status + "'",
          }]
          let noteList = [{
            type: 2,
            event_type_id: user_subscription_id,
            message: "subscription #" + findSubscription.subscription_number + " status changed to '" + Status + "'",
          }]
          if (logList.length) {
            await dbWriter.logs.bulkCreate(logList);
          }
          if (noteList.length) {
            await dbWriter.notes.bulkCreate(noteList);
          }
        }

        new SuccessResponse(EC.updatedDataSuccess, {
          //@ts-ignore
          token: req.token,
        }).send(res);
        // new SuccessResponse(EC.errorMessage(EC.updatedDataSuccess, ["Subscription"]), '').send(res);
      }
      else {
        throw new Error(EC.errorMessage(EC.required, ["Subscription id"]));
      }
    }
    catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  /**
   * get active product for subscription
   * @param req 
   * @param res 
   */
  public async userActiveProducts(req: Request, res: Response) {
    try {
      let { user_id, page_record, page_no, sort_order, sort_field } = req.body;
      let userSubscriptionItem: any = [], orderBy: any = [];
      var row_offset = 0, row_limit = 10;

      if (page_record) {
        row_limit = page_record;
      }

      if (page_no) {
        row_offset = (page_no * page_record) - page_record;
      }

      if (sort_field == 'product_name') {
        orderBy = [['product_name', sort_order]]
      } else {
        orderBy = [['product_id', 'DESC']]
      }

      let productList = await dbReader.userSubscription.findAndCountAll({
        where: {
          user_id: user_id,
          subscription_status: [2, 4]
        },
        attributes: ['user_subscription_id'],
        include: [{
          separate: true,
          model: dbReader.userSubscriptionItems,
          where: { is_deleted: 0, item_type: 1 },
          group: ['product_id', 'user_subscription_id'],
          include: [{
            model: dbReader.products,
            attributes: ['product_image'],
            include: [{
              model: dbReader.sites,
              attributes: ['logo'],
            }],
          }],
          attributes: ['product_name', 'product_id'],
          order: orderBy
        }],
        limit: row_limit,
        offset: row_offset
      });

      productList = JSON.parse(JSON.stringify(productList));
      productList.rows = productList.rows.filter((f: any) => f.user_subscription_items.length > 0);
      productList.rows.forEach((element: any) => {
        element.user_subscription_items.forEach((ele: any) => {
          if (ele.sycu_product) {
            ele.sycu_product.site_logo = ele.sycu_product.sycu_site ? ele.sycu_product.sycu_site.logo : ''
          }
        });
      });
      let productIdCountList: any = [];
      productList.rows.map((product_list_value: any, i: any) => {
        product_list_value.user_subscription_items.map((value: any) => {
          var currentIndex = productIdCountList.indexOf(value.product_id);
          if (currentIndex == -1) {
            productIdCountList.push(value.product_id);
            userSubscriptionItem.push({
              product_name: value.product_name,
              product_id: value.product_id,
              site_logo: (value.sycu_product) ? value.sycu_product.site_logo : '',
              product_image: (value.sycu_product) ? value.sycu_product.product_image : ''
            });
          }
        });
      });

      new SuccessResponse(EC.saveDataSuccess,
        {
          //@ts-ignore
          token: req.token,
          count: userSubscriptionItem.count,
          data: userSubscriptionItem
        }).send(res);

    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async updateBillingShippingAddressDetail(req: Request, res: Response) {
    try {
      let { user_id = 0, user_address_id, email_address, phone_number, address_type, is_shipping_same, first_name, last_name, address_line1, address_line2, city, state_id, country_id, zipcode, user_orders_id, company, latitude, longitude } = req.body
      if (typeof user_address_id == undefined || user_address_id == null || user_address_id == 0) {
        //create
        await dbWriter.userAddress.create({
          email_address,
          phone_number,
          address_type,
          is_shipping_same,
          address_line1,
          address_line2,
          city,
          state_id,
          country_id,
          zipcode,
          first_name,
          last_name,
          user_id,
          user_orders_id,
          company,
          latitude,
          longitude
        });
        new SuccessResponse(EC.errorMessage(EC.saveDataSuccess, ["billing details"]), {
          //@ts-ignore
          token: req.token
        }).send(res);
      } else {
        // update
        await dbWriter.userAddress.update({
          user_id: user_id,
          email_address: email_address,
          phone_number: phone_number,
          address_type: address_type,
          is_shipping_same: is_shipping_same,
          first_name,
          last_name,
          address_line1: address_line1,
          address_line2: address_line2,
          city: city,
          state_id: state_id,
          country_id: country_id,
          zipcode: zipcode,
          user_orders_id: user_orders_id,
          company: company,
          latitude: latitude,
          longitude: longitude
        }, {
          where: {
            user_address_id: user_address_id
          }
        });
        new SuccessResponse(EC.errorMessage(EC.updatedDataSuccess, ["billing details"]), {
          //@ts-ignore
          token: req.token,
        }).send(res);
      }
    }
    catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async listSubscriptionTransaction(req: Request, res: Response) {
    try {
      let { user_subscription_id } = req.body
      let userOrderData = await dbReader.userOrder.findAll({
        where: { user_subscription_id: user_subscription_id },
        attributes: ['user_orders_id']
      })
      userOrderData = JSON.parse(JSON.stringify(userOrderData))
      let oid = userOrderData.map((s: any) => s.user_orders_id)
      if (oid.length) {
        let transactionData = await dbReader.transactionMaster.findAll({
          where: { parent_id: oid },
          include: [{
            model: dbReader.userOrder
          }],
          order: [['transaction_id', 'DESC']]
        })
        new SuccessResponse(EC.success, {
          //@ts-ignore
          token: req.token,
          transaction_data: transactionData
        }).send(res);
      } else {
        new SuccessResponse(EC.noDataFound, {
          //@ts-ignore
          token: req.token
        }).send(res);
      }
    } catch (err: any) {
      ApiError.handle(new BadRequestError(err.message), res);
    }
  }

  public async changeSubscriptionStatus(req: Request, res: Response) {
    try {
      let { user_subscription_id, status } = req.body;
      let data: any;
      if (status == 2) {
        let __nextDate: any = ""
        data = await dbReader.userSubscription.findOne({
          where: { user_subscription_id: user_subscription_id },
          include: [{
            separate: true,
            model: dbReader.userSubscriptionItems,
            where: { is_deleted: 0, item_type: 1 },
            include: [{
              model: dbReader.products,
            }],
          }]
        });
        if (data) {
          data = JSON.parse(JSON.stringify(data));
          var duration = (typeof data?.user_subscription_items[0]?.sycu_product.product_duration != "undefined") ? data?.user_subscription_items[0]?.sycu_product.product_duration : 0;

          switch (duration) {
            case 365:
              __nextDate = moment(new Date(), "YYYY-MM-dd HH:mm:ss").add(1, 'y')
              break;
            case 90:
              __nextDate = moment(new Date(), "YYYY-MM-dd HH:mm:ss").add(3, 'M')
              break;
            case 30:
              __nextDate = moment(new Date(), "YYYY-MM-dd HH:mm:ss").add(1, 'M')
              break;
            default:
              __nextDate = moment(new Date(), "YYYY-MM-dd HH:mm:ss").add(duration, 'days')
              break;
          }

          await dbWriter.subscriptionRenewal.update({
            is_deleted: 1,
            end_date: __nextDate,
            updated_datetime: new Date(),
          }, {
            where: {
              user_subscription_id: user_subscription_id,
              is_executed: 0,
              is_deleted: 0,
              is_instant_payment: 0
            }
          });
        }

        await dbWriter.userSubscription.update({
          subscription_status: status,
          next_payment_date: __nextDate,
          end_date: __nextDate
        }, {
          where: { user_subscription_id: user_subscription_id }
        });

        try {
          let apiLogData = {
            user_id: data.user_id,
            user_subscription_id: user_subscription_id,
            subscription_status: status,
            next_payment_date: __nextDate,
            end_date: __nextDate
          }
          await dbWriter.apiLogs.create({
            api_url: "/changeSubscriptionStatus",
            method: "POST",
            request: JSON.stringify(req.body),
            response: JSON.stringify(apiLogData),
            header: JSON.stringify(req.headers)
          })
        } catch (error) {

        }

        let Status = (status == 2 ? "Active" : (status == 4 ? "Pending Cancellation" : (status == 5 ? "Cancelled" : status == 6 ? "Expired" : status)))
        let logList = [{
          type: 2,
          event_type_id: user_subscription_id,
          message: "subscription #" + data.subscription_number + " status changed to '" + Status + "'",
        }]
        let noteList = [{
          type: 2,
          event_type_id: user_subscription_id,
          message: "subscription #" + data.subscription_number + " status changed to '" + Status + "'",
        }]
        if (logList.length) {
          await dbWriter.logs.bulkCreate(logList);
        }
        if (noteList.length) {
          await dbWriter.notes.bulkCreate(noteList);
        }

        if (data && data.pg_transaction_type == 2) {
          // Get Last Renewal & Update Block Status
          let subscriptionRenewalDt = await dbReader.subscriptionRenewal.findOne({
            where: {
              user_subscription_id: user_subscription_id,
              is_executed: 0,
              is_deleted: 0,
              is_instant_payment: 0
            }
          });
          if (subscriptionRenewalDt) {
            subscriptionRenewalDt = JSON.parse(JSON.stringify(subscriptionRenewalDt))
            await dbWriter.subscriptionRenewal.update({
              end_date: __nextDate,
              renewal_date: __nextDate,
              updated_datetime: new Date(),
            }, {
              where: { subscription_renewal_id: subscriptionRenewalDt.subscription_renewal_id }
            });
          } else {
            await dbWriter.subscriptionRenewal.create({
              user_subscription_id: user_subscription_id,
              user_id: data.user_id,
              user_orders_id: data.last_order_id,
              end_date: __nextDate,
              site_id: data.site_id,
              attempt_count: 0,
              last_attempt_date: '',
              status: 2, // active
              renewal_date: __nextDate,
            });
          }
        }

        //==============Active Campaign Renewal Field Update=============
        let user_data = await dbReader.users.findOne({
          attributes: ["activecampaign_contact_id"],
          where: { user_id: data.user_id, is_deleted: 0 }
        });
        user_data = JSON.parse(JSON.stringify(user_data));
        let contact_id = user_data ? user_data.activecampaign_contact_id : 0;
        if (contact_id) {
          let acFieldData = {
            "contact_id": contact_id,
            "user_subscription_id": user_subscription_id,
          }
          await activeCampaign.updateActiveCampaignRenewalFields(acFieldData);
        }
      } else {
        await dbWriter.userSubscription.update({
          subscription_status: status
        }, {
          where: { user_subscription_id: user_subscription_id }
        });

        let userSubscriptionData = await dbReader.userSubscription.findOne({
          where: { user_subscription_id: user_subscription_id }
        });
        userSubscriptionData = JSON.parse(JSON.stringify(userSubscriptionData));
        try {
          let apiLogData = {
            user_id: userSubscriptionData.user_id,
            user_subscription_id: user_subscription_id,
            subscription_status: status
          }
          await dbWriter.apiLogs.create({
            api_url: "/changeSubscriptionStatus",
            method: "POST",
            request: JSON.stringify(req.body),
            response: JSON.stringify(apiLogData),
            header: JSON.stringify(req.headers)
          })
        } catch (error) {

        }

        let Status = (status == 2 ? "Active" : (status == 4 ? "Pending Cancellation" : (status == 5 ? "Cancelled" : status == 6 ? "Expired" : status)))
        let logList = [{
          type: 2,
          event_type_id: user_subscription_id,
          message: "subscription #" + userSubscriptionData.subscription_number + " status changed to '" + Status + "'",
        }]
        let noteList = [{
          type: 2,
          event_type_id: user_subscription_id,
          message: "subscription #" + userSubscriptionData.subscription_number + " status changed to '" + Status + "'",
        }]
        if (logList.length) {
          await dbWriter.logs.bulkCreate(logList);
        }
        if (noteList.length) {
          await dbWriter.notes.bulkCreate(noteList);
        }

        //==============Active Campaign Renewal Field Update=============
        let data = await dbReader.userSubscription.findOne({
          attributes: ["user_subscription_id", "user_id"],
          where: { user_subscription_id: user_subscription_id },
        });
        let user_data = await dbReader.users.findOne({
          attributes: ["activecampaign_contact_id"],
          where: { user_id: data.user_id, is_deleted: 0 }
        });
        user_data = JSON.parse(JSON.stringify(user_data));
        let contact_id = user_data ? user_data.activecampaign_contact_id : 0;
        if (status == 11 && contact_id) {
          const fieldData = {
            contact_id: contact_id,
            user_subscription_id: user_subscription_id
          }
          await activeCampaign.removeActiveCampaignRenewalFields(fieldData);
        }
      }

      new SuccessResponse(EC.errorMessage(EC.updatedDataSuccess, ["Subscription status"]), {
        //@ts-ignore
        token: req.token,
        data: data,
      }).send(res);
    } catch (err: any) {
      ApiError.handle(new BadRequestError(err.message), res);
    }
  }
}
