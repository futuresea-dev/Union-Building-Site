import { Request, Response } from "express";
import { ErrorController } from "../core/ErrorController";
import { checkoutController } from "./checkoutController";
import { SuccessResponse } from '../core/ApiResponse';
import { BadRequestError, ApiError } from '../core/ApiError';
import { GeneralController } from "./generalController";
import moment from "moment";
const { stripeMain } = require('./thirdParty/stripe/stripeMain');
const { dbReader, dbWriter } = require('../models/dbConfig');
const { WickedReportsAPIs } = require('./thirdParty/WickedReportsAPIs');
const EC = new ErrorController();
const Checkout = new checkoutController();

export class RefundController {

    public addOrderRefund = async (req: Request, res: Response) => {
        try {
            let generalControllerObj = new GeneralController();
            let { user_id = 0 } = generalControllerObj.getCurrentUserDetail(req, res);
            let { user_orders_id, refund_amount, refund_type } = req.body;
            let orderDetails = await dbReader.userOrder.findOne({
                include: [{
                    model: dbReader.transactionMaster,
                    where: {
                        status: "Success"
                    }
                }],
                where: {
                    user_orders_id: user_orders_id
                }
            });
            var refund = null;
            let { charge_id, stripe_customer_id, stripe_card_id } = orderDetails.sycu_transaction_master;
            let { total_amount } = orderDetails;
            let wickedReportRefund: any = [];
            var stripeRefund = async () => {
                let stripeMainObj = new stripeMain();
                refund = await stripeMainObj.refundPayment(charge_id, refund_amount);
                var transaction = await dbWriter.transactionMaster.create({
                    user_id: user_id,
                    site_id: 1,
                    transaction_type: 1,
                    type: 2,
                    parent_id: user_orders_id,
                    request_json: JSON.stringify({ "charge_id": charge_id, "amount": refund_amount }),
                    response_json: JSON.stringify(refund),
                    status: refund.status,
                    stripe_customer_id: stripe_customer_id,
                    stripe_card_id: stripe_card_id,
                    amount: refund_amount,
                    created_datetime: moment().format("YYYY-MM-DD HH:mm:ss"),
                    charge_id: charge_id,
                    payment_type: 1,
                    transaction_details: ''
                });
                let response = await dbWriter.refunds.create({
                    user_id: user_id,
                    site_id: 1,
                    charge_id: charge_id,
                    order_id: user_orders_id,
                    transaction_id: transaction.transaction_id,
                    stripe_refund_id: refund.id,
                    pg_customer_id: stripe_customer_id,
                    pg_card_id: stripe_card_id,
                    status: refund.status == "succeeded" ? 1 : 5,
                    refund_type: refund_type,
                    refund_amount: refund_amount,
                    refund_reason: req.body.refund_reason ? req.body.refund_reason : null,
                    created_datetime: moment().format("YYYY-MM-DD HH:mm:ss")
                });
                wickedReportRefund[0].refund_id = response.refund_id;
                let WickedReportsAPIsObj = new WickedReportsAPIs();
                WickedReportsAPIsObj.CreatePaymentItem(wickedReportRefund);
                new SuccessResponse(EC.saveDataSuccess, []).send(res);
            }

            wickedReportRefund.push({
                site_id: 1,
                order_id: user_orders_id,
                status: "REFUNDED",
                amount: refund_amount,
                paymentDate: moment().format("YYYY-MM-DD HH:mm:ss")
            });
            if (refund_type == 1) { wickedReportRefund[0].status = 3; stripeRefund(); }
            else {
                if (refund_amount == total_amount) {
                    wickedReportRefund[0].status = 3; stripeRefund();

                }
                if (total_amount > refund_amount) {
                    wickedReportRefund[0].status = 4;
                    let previousRefundDetails = await dbReader.refunds.findAll({
                        include: [{
                            model: dbReader.userOrder
                        }],
                        where: {
                            order_id: user_orders_id
                        },
                    });
                    if (previousRefundDetails.length > 0) {
                        let count_amount = 0;
                        for (let i = 0; i < previousRefundDetails.length; i++) {
                            count_amount += Number.parseInt(previousRefundDetails[i].refund_amount);
                        }
                        total_amount -= count_amount;
                        if (total_amount > refund_amount) { wickedReportRefund[0].status = 4; stripeRefund(); }
                        else { new SuccessResponse(EC.amountGreaterThanRefund, []).send(res); }
                    } else { stripeRefund(); }
                } else { new SuccessResponse(EC.amountGreaterThanRefund, []).send(res); }
            }
        } catch (error: any) {
            ApiError.handle(new BadRequestError(error.message), res);
        }
    }

    public applyScholarshipRefundCheck = async (req: Request, res: Response) => {
        try {
            let { scholarship_code = '', user_subscription_id, user_orders_id } = req.body;
            if (scholarship_code && user_subscription_id && user_orders_id) {
                let couponData = await dbReader.coupons.findOne({
                    where: { coupon_code: scholarship_code, is_deleted: 0 },
                    attributes: ['coupon_id']
                });
                if (couponData) {
                    //check any coupon was already applied on order
                    let orderCouponExists = await dbReader.userOrderItems.findOne({
                        where: { user_orders_id: user_orders_id, item_type: 5, is_deleted: 0 },
                        attributes: ['user_order_item_id']
                    });
                    if (!orderCouponExists) {
                        let subscriptionData = await dbReader.userSubscription.findOne({
                            where: { user_subscription_id: user_subscription_id }
                        });
                        subscriptionData = JSON.parse(JSON.stringify(subscriptionData));
                        let ordersData = await dbReader.userOrder.findOne({
                            where: { user_orders_id: user_orders_id },
                            include: [{
                                separate: true,
                                model: dbReader.userOrderItems,
                                where: { is_deleted: 0 }
                            }]
                        });
                        ordersData = JSON.parse(JSON.stringify(ordersData));
                        let productIds: any = [], products_list: any = [], refund_discount = 0;
                        let userOrderItems = ordersData.user_order_items.filter((fi: any) => fi.item_type == 1);
                        if (userOrderItems.length == 1) {
                            let product_id = userOrderItems[0].updated_product_id ?
                                userOrderItems[0].updated_product_id : userOrderItems[0].product_id;
                            productIds.push(product_id);
                            products_list.push({
                                shipping_fees: 0,
                                processing_fees: 0,
                                total_amount: ordersData.total_amount,
                                product_price: ordersData.sub_amount
                            })
                        } else {
                            userOrderItems.forEach((element: any) => {
                                let product_id = element.updated_product_id ?
                                    element.updated_product_id : element.product_id;
                                productIds.push(product_id);
                                products_list.push({
                                    shipping_fees: 0,
                                    processing_fees: 0,
                                    total_amount: element.product_amount,
                                    product_price: element.product_amount
                                })
                            });
                        }

                        // validate coupon code
                        let couponDetails = {
                            coupon_code: scholarship_code,
                            coupon_ids: [couponData.coupon_id],
                            user_id: subscriptionData.user_id,
                            site_id: subscriptionData.site_id,
                            products_list: products_list,
                            product_id: productIds,
                            user_subscription_id: user_subscription_id,
                            is_instant_payment: 1
                        }
                        let couponValidation = await Checkout.validateCouponCode(couponDetails);
                        if (!couponValidation.isVerified) {
                            throw new Error(couponValidation.message)
                        }
                        if (couponValidation && couponValidation.isVerified) {
                            couponValidation.coupon_data.forEach((cd: any) => {
                                if (cd.coupon_id == couponData.coupon_id) {
                                    refund_discount = cd.coupon_discount;
                                }
                            })
                        }
                        let refund_amount = refund_discount;
                        new SuccessResponse(EC.success, {
                            //@ts-ignore
                            token: req.token,
                            refund_amount: refund_amount,
                            coupon_id: couponData.coupon_id
                        }).send(res);
                    } else {
                        throw new Error("Coupon already applied in this order.");
                    }
                } else {
                    throw new Error("Coupon not found.");
                }
            } else {
                throw new Error("Please provide valid data!");
            }
        } catch (error: any) {
            ApiError.handle(new BadRequestError(error.message), res);
        }
    }
}