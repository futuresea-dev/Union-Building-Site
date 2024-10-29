import e, { Request, Response } from "express";
import { ErrorController } from "../core/ErrorController";
import { SuccessResponse } from '../core/ApiResponse';
import { BadRequestError, ApiError } from '../core/ApiError';
import { NodeMailerController } from "./thirdParty/nodeMailerController";
import { enumerationController } from '../controllers/enumerationController';
import { HubSpotController } from "./thirdParty/hubSpotController";
import { ActiveCampaignController } from "./thirdParty/activeCampaignController";
import { groupBy } from "lodash";
import _ from "lodash"
import { timestamp, dateTime, decodeData, keyGeneration } from '../helpers/helpers'
const { dbReader, dbWriter } = require('../models/dbConfig');
const { stripeMain } = require('./thirdParty/stripe/stripeMain');
import { CircleAPIs } from "./thirdParty/CircleAPIs";
const { WickedReportsAPIs } = require('./thirdParty/WickedReportsAPIs');
import moment from "moment";
import { ShipbobController } from "./shipbobController";
import { GeneralController } from "./generalController";
const { v4: uuidv4 } = require("uuid");
const axios = require('axios').default;
const stripe = require('stripe')();
const { Op } = dbReader.Sequelize;
const EC = new ErrorController();
var ObjectMail = new NodeMailerController();
var EnumObject = new enumerationController();
var ObjHubspot = new HubSpotController();
var activeCampaign = new ActiveCampaignController();
var generl = new GeneralController();

export class checkoutController {

    /**
     * save Admin subscription
     * @param req
     * @param res
     */
    public async checkOutAdminSubscription(req: Request, res: Response) {
        let checkOutLog = await dbWriter.checkOutLogs.create({
            user_id: 0,
            request: JSON.stringify(req.body)
        });
        checkOutLog = JSON.parse(JSON.stringify(checkOutLog));
        try {
            let { user_email, first_name, ip_address, products = [], old_products = [], product_change = false, coupon_code = '', is_edit, subscription_number, subscription_id, user_id, billingAddress, shippingAddress, site_id = 2, startDate, nextDate, fees, shippings, taxes, discount = null, subscriptionStatus, pg_customer_card_id = 0, cardDetails = null, is_start_date = 0, is_next_date = 0, is_billing_address = 0, is_shipping_address = 0, is_save = 0, type = 1, paymentCheckDetails = null, coupon_ids = [] } = req.body
            //@ts-ignore
            let { users_login_log_id, display_name } = req
            let _user_subscription_id, _subscription_number;
            let _user_order_id: any;
            const self = new checkoutController();
            let { token } = self.getCurrentUserDetail(req, res);

            //site Id Condition
            if (site_id == 0) {
                new SuccessResponse(EC.invalidSiteId, {
                    token
                }).send(res)
            } else {
                if (type == 2) {
                    let paymentCheckData = await dbReader.paymentCheck.findOne({
                        where: { check_number: paymentCheckDetails.check_number, user_id: user_id }
                    })
                    if (paymentCheckData) {
                        throw new Error("Check Number cannot be same. Please enter new check number");
                    }
                } else {
                    if (cardDetails && users_login_log_id) {
                        let paymentKeysData = await dbReader.paymentKeys.findOne({
                            where: { users_login_log_id: users_login_log_id, is_used: 0, user_id: user_id }
                        })
                        paymentKeysData = JSON.parse(JSON.stringify(paymentKeysData))
                        if (paymentKeysData) {
                            try {
                                cardDetails = decodeData(paymentKeysData.payment_private_key, cardDetails)
                                await dbWriter.paymentKeys.update({
                                    is_used: 1
                                }, {
                                    where: { sycu_payment_key_id: paymentKeysData.sycu_payment_key_id }
                                })
                            } catch (err) {
                                throw new Error("The payment failed due to some issue with the card, please try again.")
                            }
                        } else {
                            throw new Error("The payment failed due to some issue with the card, please try again.")
                        }
                    }
                }
                // Get Product From Request Data
                let products_list: any = [], membership_name_list: any = [];

                // ShipBob Create Order Object
                let createShipbobOrder: any = {},
                    shipbobProducts: any = [],
                    recipient: any = {},
                    order_number

                if (products && products.length) {
                    products_list = await dbReader.products.findAll({
                        where: { is_deleted: 0, product_id: products.map((s: any) => s.id) },
                        include: [{
                            separate: true,
                            model: dbReader.membershipProduct,
                            where: { is_deleted: 0 },
                            include: [{
                                required: true,
                                model: dbReader.membership,
                                attributes: ['membership_name'],
                                where: { is_deleted: 0 }
                            }]
                        }]
                    })
                    products_list = JSON.parse(JSON.stringify(products_list));
                    let is_ship_product = products_list.filter((s: any) => s.is_shippable == 1).map((s: any) => s.product_id)
                    if (is_ship_product.length && (billingAddress || shippingAddress)) {
                        let getMapShipbobProduct = await dbReader.shipbobSycuProductModel.findAll({
                            attributes: ['shipbob_product_id', 'sycu_product_name'],
                            where: {
                                sycu_product_id: is_ship_product
                            }
                        })
                        getMapShipbobProduct = JSON.parse(JSON.stringify(getMapShipbobProduct))

                        let is_ship_product_reference = getMapShipbobProduct.map((s: any) => s.shipbob_product_id)
                        let getMapShipbobProductReference = await dbReader.shipbobProductModel.findAll({
                            attributes: ['reference_id', 'title'],
                            where: {
                                shipbob_product_id: is_ship_product_reference,
                                is_active: 1
                            }
                        })

                        getMapShipbobProductReference = JSON.parse(JSON.stringify(getMapShipbobProductReference))

                        for (var n = 0; n < getMapShipbobProductReference.length; n++) {
                            shipbobProducts.push({
                                reference_id: getMapShipbobProductReference[n].reference_id.toString(),
                                quantity: 1,
                                quantity_unit_of_measure_code: "",
                                external_line_id: 0,
                                name: getMapShipbobProductReference[n].title.toString()
                            })
                        }
                    }
                }

                // validate coupon code
                let couponValidation: any = null
                if (coupon_code || coupon_ids.length) {
                    let couponDetails = {
                        coupon_code: coupon_code,
                        coupon_ids: coupon_ids ? coupon_ids : [],
                        user_id: user_id,
                        site_id: site_id,
                        products_list: products_list,
                        product_id: products.map((s: any) => s.id),
                        fees: fees,
                        user_subscription_id: subscription_id,
                        is_instant_payment: 0
                    };
                    // check for invalid coupon
                    couponValidation = await self.validateCouponCode(couponDetails)
                    if (!couponValidation.isVerified) {
                        couponValidation.message = (couponValidation.message == "Coupon Not Valid for products.") ?
                            "Product update cannot proceed. The applied coupon is not valid for this product." : couponValidation.message;
                        throw new Error(couponValidation.message)
                    }
                } else {
                    if (products && products.length && is_edit == 1) {
                        await dbWriter.userSubscription.update({
                            coupon_code: '',
                            coupon_ids: ''
                        }, {
                            where: { user_subscription_id: subscription_id }
                        });
                    }
                }

                // Group product based on their duration
                let product_duration_group: any = groupBy(products_list, "product_duration")
                let _temp_product_duration_group: any = [];
                Object.keys(product_duration_group).map((v, i) => {
                    let items: any = product_duration_group[Object.keys(product_duration_group)[i]]
                    _temp_product_duration_group.push(items)
                })

                let newSubscriptionList: any = [], newGeoData: any = [], newSubscriptionItemList: any = [], newSubscriptionAddress: any = [], newOrderList = [], newOrderItemList: any = [], newOrderAddress: any = [], newUserMembershipsList: any = [], logList: any = [], noteList: any = [], subscriptionRenewalLogList: any = [], emailPayload: any = [], newMasterAddress: any = []
                startDate = (startDate) ? startDate : moment().format("YYYY-MM-DD HH:mm:ss")

                let totalOrderCount = _temp_product_duration_group.length
                let i = 0, total_payment_amount = 0
                let hubspot_subscription_id = 0, hubspot_subscription_number = 0, hubspot_user_orders_id = 0, hubspot_user_order_number = 0;

                // Base on product duration make subscriptions & orders
                if (is_edit == 0) {
                    if (_temp_product_duration_group.length > i) {
                        let existMembership = await dbReader.userMemberships.findAll({
                            where: { user_id: user_id, status: 2, is_deleted: 0 }
                        })
                        existMembership = JSON.parse(JSON.stringify(existMembership))
                        while (_temp_product_duration_group.length > i) {

                            // Email Generate Variables
                            let OrderDetails: any = [];
                            let is_product_duration = true;
                            let productDetails: any = [];
                            let shipping_amount = 0, fees_amount = 0, tax_amount = 0, final_amount = 0, renew_amount = 0, reccuring_amount = 0, sub_amount = 0, coupon_amount = 0;
                            let _temp_sub_data = [{
                                subscription_id: subscription_id,
                                subscription_number: subscription_number
                            }];
                            if (i != 0) {
                                _temp_sub_data = await dbWriter.sequelize.query('call sp_createNewSubscription(0)');
                            }
                            if (_temp_sub_data.length) {
                                let _temp_order_data: any = [], _pid = [];
                                // Creat new order if order is not created
                                // if (is_edit == 0) {
                                _temp_order_data = await dbWriter.sequelize.query(`call sp_createNewOrder(${_temp_sub_data[0].subscription_id})`);
                                // }
                                let items: any = _temp_product_duration_group[i];

                                startDate = moment(startDate, 'YYYY-MM-DD HH:mm').toDate();
                                let __nextDate: any = ""
                                switch (items[0].product_duration) {
                                    case 365:
                                        __nextDate = moment(startDate, "YYYY-MM-dd HH:mm").add(1, 'y')
                                        break;
                                    case 90:
                                        __nextDate = moment(startDate, "YYYY-MM-dd HH:mm").add(3, 'M')
                                        break;
                                    case 30:
                                        __nextDate = moment(startDate, "YYYY-MM-dd HH:mm").add(1, 'M')
                                        break;
                                    default:
                                        __nextDate = moment(startDate, "YYYY-MM-dd HH:mm").add(items[0].product_duration, 'days')
                                        break;
                                }
                                let _nextDate = (nextDate) ? nextDate : __nextDate;

                                let description = "Main Product: "

                                // DB Product List
                                let is_recurring_product = 0;
                                items.map(async (p: any) => {
                                    if (p.product_duration == 0) {
                                        is_product_duration = false;
                                    }
                                    is_recurring_product = p.is_recurring_product;
                                    _pid.push(p.product_id);
                                    description += p.product_name + ", "
                                    final_amount += p.product_price;
                                    renew_amount += p.product_price;
                                    reccuring_amount += p.product_price;
                                    sub_amount += p.product_price;
                                    OrderDetails.push({
                                        product_name: p.product_name,
                                        product_amount: p.product_price,
                                    });
                                    productDetails.push({
                                        product_name: p.product_name,
                                        product_duration: p.product_duration,
                                        renewal_count: 1
                                    });
                                    newOrderItemList.push({
                                        user_orders_id: _temp_order_data[0].user_orders_id,
                                        item_type: 1,
                                        product_id: p.product_id,
                                        product_name: p.product_name,
                                        product_amount: p.product_price,
                                        shipping_fees: 0,
                                        processing_fees: 0,
                                        coupon_amount: 0,
                                    });

                                    newSubscriptionItemList.push({
                                        user_subscription_item_id: (products.some((s: any) => s.id == p.product_id)) ? products.find((s: any) => s.id == p.product_id).user_subscription_item_id || 0 : 0,
                                        user_subscription_id: _temp_sub_data[0].subscription_id,
                                        item_type: 1,
                                        product_id: p.product_id,
                                        product_name: p.product_name,
                                        product_amount: p.product_price,
                                        shipping_fees: 0,
                                        processing_fees: 0,
                                        coupon_amount: 0,
                                    });

                                    let membership_status = 2
                                    if (type == 2) {
                                        if (paymentCheckDetails.is_payment_confirmed == 0) {
                                            membership_status = 9
                                        }
                                    }
                                    if (p.sycu_membership_products && p.sycu_membership_products.length) {
                                        p.sycu_membership_products.forEach((s: any) => {
                                            if (s.membership_id != 0) {
                                                if (!existMembership.some((m: any) => m.membership_id == s.membership_id)) {
                                                    membership_name_list.push(s.sycu_membership.membership_name)
                                                    newUserMembershipsList.push({
                                                        user_id: user_id,
                                                        membership_id: s.membership_id,
                                                        status: membership_status,
                                                        site_id: site_id,
                                                        user_subscription_id: _temp_sub_data[0].subscription_id,
                                                        user_orders_id: _temp_order_data[0].user_orders_id
                                                    })
                                                }
                                            }
                                        });
                                    }
                                });

                                //add fees into array
                                if (fees) {
                                    final_amount += (fees.total / totalOrderCount);
                                    fees_amount += (fees.total / totalOrderCount);

                                    if (is_edit == 0) {
                                        OrderDetails.push({
                                            product_name: fees.item_name,
                                            product_amount: fees.total / totalOrderCount,
                                        });
                                        newOrderItemList.push({
                                            user_orders_id: _temp_order_data[0].user_orders_id,
                                            item_type: 2,
                                            product_id: 0,
                                            product_name: fees.item_name,
                                            product_amount: fees.total / totalOrderCount,
                                            shipping_fees: 0,
                                            processing_fees: 0,
                                            coupon_amount: 0,
                                        });
                                    }

                                    newSubscriptionItemList.push({
                                        user_subscription_item_id: fees.user_subscription_item_id || 0,
                                        user_subscription_id: _temp_sub_data[0].subscription_id,
                                        item_type: 2,
                                        product_id: 0,
                                        product_name: fees.item_name,
                                        product_amount: fees.total / totalOrderCount,
                                        shipping_fees: 0,
                                        processing_fees: 0,
                                        coupon_amount: 0,
                                    });
                                }
                                _user_subscription_id = _temp_sub_data[0].subscription_id;
                                _subscription_number = _temp_sub_data[0].subscription_number;
                                _user_order_id = _temp_order_data[0].user_orders_id;
                                //add shipping into array
                                let ct1 = 0
                                if (shippings) {
                                    if (ct1++ == 0) {
                                        final_amount += (shippings.total / totalOrderCount);
                                        shipping_amount += (shippings.total / totalOrderCount);
                                        if (is_edit == 0) {
                                            OrderDetails.push({
                                                product_name: shippings.item_name,
                                                product_amount: shippings.total / totalOrderCount,
                                            });
                                            newOrderItemList.push({
                                                user_orders_id: _temp_order_data[0].user_orders_id,
                                                item_type: 3,
                                                product_id: 0,
                                                product_name: shippings.item_name,
                                                product_amount: shippings.total / totalOrderCount,
                                                shipping_fees: 0,
                                                processing_fees: 0,
                                                coupon_amount: 0,
                                            });
                                        }
                                        newSubscriptionItemList.push({
                                            user_subscription_item_id: shippings.user_subscription_item_id || 0,
                                            user_subscription_id: _temp_sub_data[0].subscription_id,
                                            item_type: 3,
                                            product_id: 0,
                                            product_name: shippings.item_name,
                                            product_amount: shippings.total / totalOrderCount,
                                            shipping_fees: 0,
                                            processing_fees: 0,
                                            coupon_amount: 0,
                                        });
                                    }
                                }

                                //add taxes into array
                                let ct2 = 0
                                if (taxes) {
                                    if (ct2++ == 0) {
                                        final_amount += (taxes.total / totalOrderCount);
                                        tax_amount += (taxes.total / totalOrderCount);

                                        OrderDetails.push({
                                            product_name: taxes.item_name,
                                            product_amount: taxes.total / totalOrderCount,
                                        });
                                        newOrderItemList.push({
                                            user_orders_id: _temp_order_data[0].user_orders_id,
                                            item_type: 4,
                                            product_id: 0,
                                            product_name: taxes.item_name,
                                            product_amount: taxes.total / totalOrderCount,
                                            shipping_fees: 0,
                                            processing_fees: 0,
                                            coupon_amount: 0,
                                        });
                                        newSubscriptionItemList.push({
                                            user_subscription_item_id: taxes.user_subscription_item_id || 0,
                                            user_subscription_id: _temp_sub_data[0].subscription_id,
                                            item_type: 4,
                                            product_id: 0,
                                            product_name: taxes.item_name,
                                            product_amount: taxes.total / totalOrderCount,
                                            shipping_fees: 0,
                                            processing_fees: 0,
                                            coupon_amount: 0,
                                        });
                                    }
                                }

                                //add coupon Data
                                if ((coupon_code || coupon_ids.length) && couponValidation && couponValidation.billingAmount.coupon_discount != 0) {
                                    renew_amount -= (couponValidation.billingAmount.coupon_discount / totalOrderCount);
                                    final_amount -= (couponValidation.billingAmount.coupon_discount / totalOrderCount);
                                    coupon_amount += (couponValidation.billingAmount.coupon_discount / totalOrderCount);

                                    if (couponValidation.coupon_data && couponValidation.coupon_data.length) {
                                        couponValidation.coupon_data.forEach((s: any) => {
                                            OrderDetails.push({
                                                product_name: `Coupon("${s.coupon_code}") Discount`,
                                                product_amount: s.coupon_discount / totalOrderCount,
                                            });
                                            newOrderItemList.push({
                                                user_orders_id: _temp_order_data[0].user_orders_id,
                                                item_type: 5,
                                                product_id: s.coupon_id,
                                                product_name: `Coupon("${s.coupon_code}") Discount`,
                                                product_amount: parseFloat((s.coupon_discount / totalOrderCount) + ""),
                                                shipping_fees: 0,
                                                processing_fees: 0,
                                                coupon_amount: 0,
                                            });
                                            newSubscriptionItemList.push({
                                                user_subscription_item_id: taxes.user_subscription_item_id || 0,
                                                user_subscription_id: _temp_sub_data[0].subscription_id,
                                                item_type: 5,
                                                product_id: s.coupon_id,
                                                product_name: `Coupon("${s.coupon_code}") Discount`,
                                                product_amount: parseFloat((s.coupon_discount / totalOrderCount) + ""),
                                                shipping_fees: 0,
                                                processing_fees: 0,
                                                coupon_amount: 0,
                                            });
                                        });
                                    }
                                }

                                // Prepare subscription list to update existing.
                                newSubscriptionList.push({
                                    subscription_id: _temp_sub_data[0].subscription_id,
                                    is_from: 1,
                                    coupon_code: coupon_code,
                                    is_recurring_subscription: is_recurring_product,
                                    is_renewal: is_recurring_product,
                                    user_id: user_id,
                                    total_amount: final_amount,
                                    site_id: site_id,
                                    subscription_number: _temp_sub_data[0].subscription_number,
                                    start_date: moment(startDate).format("YYYY-MM-DD HH:mm:ss"),
                                    end_date: is_product_duration ? moment(_nextDate).format("YYYY-MM-DD HH:mm:ss") : '',
                                    subscription_status: subscriptionStatus,
                                    next_payment_date: is_product_duration ? moment(_nextDate).format("YYYY-MM-DD HH:mm:ss") : '',
                                    last_order_date: moment().format("YYYY-MM-DD HH:mm:ss"),
                                    trial_end_date: 0,
                                });
                                createShipbobOrder.subscription_number = _temp_sub_data[0].subscription_number;
                                // Billing Master Address
                                if (billingAddress && billingAddress.user_address_id == 0) {
                                    newMasterAddress.push({
                                        user_address_id: 0,
                                        parent_user_address_id: 0,
                                        first_name: billingAddress.first_name,
                                        last_name: billingAddress.last_name,
                                        email_address: billingAddress.email_address,
                                        phone_number: billingAddress.phone_number,
                                        address_type: 1, // billing address type
                                        address_line1: billingAddress.address_line1,
                                        address_line2: billingAddress.address_line2,
                                        city: billingAddress.city,
                                        state_id: billingAddress.state_id,
                                        country_id: billingAddress.country_id,
                                        company: billingAddress.company,
                                        user_orders_id: 0,
                                        user_subscription_id: 0,
                                        user_id: user_id,
                                        customer_shipping_note: '',
                                        zipcode: (billingAddress.zipcode) ? billingAddress.zipcode : "",
                                        latitude: (billingAddress.latitude) ? billingAddress.latitude : 0,
                                        longitude: (billingAddress.longitude) ? billingAddress.longitude : 0,
                                    });
                                }

                                // Shipping Master Address
                                if (shippingAddress && shippingAddress.user_address_id == 0) {
                                    newMasterAddress.push({
                                        user_address_id: 0,
                                        parent_user_address_id: 0,
                                        first_name: shippingAddress.first_name,
                                        last_name: shippingAddress.last_name,
                                        email_address: shippingAddress.email_address,
                                        phone_number: shippingAddress.phone_number,
                                        address_type: 2, // shipping address type
                                        address_line1: shippingAddress.address_line1,
                                        address_line2: shippingAddress.address_line2,
                                        city: shippingAddress.city,
                                        state_id: shippingAddress.state_id,
                                        country_id: shippingAddress.country_id,
                                        company: shippingAddress.company,
                                        user_orders_id: 0,
                                        user_subscription_id: 0,
                                        user_id: user_id,
                                        customer_shipping_note: shippingAddress.customer_shipping_note,
                                        zipcode: (shippingAddress.zipcode) ? shippingAddress.zipcode : "",
                                        latitude: (shippingAddress.latitude) ? shippingAddress.latitude : 0,
                                        longitude: (shippingAddress.longitude) ? shippingAddress.longitude : 0,
                                    });
                                }

                                //Billing Address
                                if (billingAddress) {
                                    newSubscriptionAddress.push({
                                        user_address_id: (billingAddress.is_master == 1) ? 0 : (billingAddress.user_address_id || 0),
                                        parent_user_address_id: billingAddress.user_address_id,
                                        first_name: billingAddress.first_name,
                                        last_name: billingAddress.last_name,
                                        email_address: billingAddress.email_address,
                                        phone_number: billingAddress.phone_number,
                                        address_type: 1, // billing address type
                                        address_line1: billingAddress.address_line1,
                                        address_line2: billingAddress.address_line2,
                                        city: billingAddress.city,
                                        state_id: billingAddress.state_id,
                                        country_id: billingAddress.country_id,
                                        company: billingAddress.company,
                                        user_orders_id: 0,
                                        user_subscription_id: _temp_sub_data[0].subscription_id,
                                        user_id: user_id,
                                        customer_shipping_note: '',
                                        zipcode: (billingAddress.zipcode) ? billingAddress.zipcode : "",
                                        latitude: (billingAddress.latitude) ? billingAddress.latitude : 0,
                                        longitude: (billingAddress.longitude) ? billingAddress.longitude : 0,
                                    });
                                }

                                //Shipping Address
                                if (shippingAddress) {
                                    newSubscriptionAddress.push({
                                        user_address_id: (shippingAddress.is_master == 1) ? 0 : (shippingAddress.user_address_id || 0),
                                        parent_user_address_id: shippingAddress.user_address_id,
                                        first_name: shippingAddress.first_name,
                                        last_name: shippingAddress.last_name,
                                        email_address: shippingAddress.email_address,
                                        phone_number: shippingAddress.phone_number,
                                        address_type: 2, // shipping address type
                                        address_line1: shippingAddress.address_line1,
                                        address_line2: shippingAddress.address_line2,
                                        city: shippingAddress.city,
                                        state_id: shippingAddress.state_id,
                                        country_id: shippingAddress.country_id,
                                        company: shippingAddress.company,
                                        user_orders_id: 0,
                                        user_subscription_id: _temp_sub_data[0].subscription_id,
                                        user_id: user_id,
                                        customer_shipping_note: shippingAddress.customer_shipping_note,
                                        zipcode: (shippingAddress.zipcode) ? shippingAddress.zipcode : "",
                                        latitude: (shippingAddress.latitude) ? shippingAddress.latitude : 0,
                                        longitude: (shippingAddress.longitude) ? shippingAddress.longitude : 0,
                                    });
                                }

                                description = description.slice(0, -2);
                                description += " | Order number: #" + _temp_sub_data[0].subscription_number

                                // Update order data if order created very first time for a subscription
                                let od = moment().format("YYYY-MM-DD HH:mm:ss");

                                newOrderList.push({
                                    user_orders_id: _temp_order_data[0].user_orders_id,
                                    user_order_date: od,
                                    user_order_number: _temp_order_data[0].user_order_number,
                                    user_subscription_id: _temp_sub_data[0].subscription_id,
                                    user_id: user_id,
                                    order_status: 1,
                                    site_id: site_id,
                                    sub_amount: sub_amount,
                                    coupon_amount: parseFloat(coupon_amount + ""),
                                    shipping_amount: shipping_amount,
                                    fees_amount: fees_amount,
                                    tax_amount: tax_amount,
                                    total_amount: final_amount,
                                    ip_address: ip_address || '',
                                    description: description
                                });

                                //Billing Address
                                if (billingAddress) {
                                    newOrderAddress.push({
                                        parent_user_address_id: billingAddress.user_address_id,
                                        first_name: billingAddress.first_name,
                                        last_name: billingAddress.last_name,
                                        email_address: billingAddress.email_address,
                                        phone_number: billingAddress.phone_number,
                                        address_type: 1, // billing address type
                                        address_line1: billingAddress.address_line1,
                                        address_line2: billingAddress.address_line2,
                                        city: billingAddress.city,
                                        state_id: billingAddress.state_id,
                                        country_id: billingAddress.country_id,
                                        company: billingAddress.company,
                                        user_orders_id: _temp_order_data[0].user_orders_id,
                                        user_subscription_id: 0,
                                        user_id: user_id,
                                        zipcode: (billingAddress.zipcode) ? billingAddress.zipcode : "",
                                        latitude: (billingAddress.latitude) ? billingAddress.latitude : 0,
                                        longitude: (billingAddress.longitude) ? billingAddress.longitude : 0,
                                        customer_shipping_note: '',
                                        user_address_id: 0
                                    });
                                }

                                //Shipping Address
                                if (shippingAddress) {
                                    newOrderAddress.push({
                                        parent_user_address_id: shippingAddress.user_address_id,
                                        first_name: shippingAddress.first_name,
                                        last_name: shippingAddress.last_name,
                                        email_address: shippingAddress.email_address,
                                        phone_number: shippingAddress.phone_number,
                                        address_type: 2, // shipping address type
                                        address_line1: shippingAddress.address_line1,
                                        address_line2: shippingAddress.address_line2,
                                        city: shippingAddress.city,
                                        state_id: shippingAddress.state_id,
                                        country_id: shippingAddress.country_id,
                                        company: shippingAddress.company,
                                        user_orders_id: _temp_order_data[0].user_orders_id,
                                        user_subscription_id: 0,
                                        user_id: user_id,
                                        user_address_id: 0,
                                        zipcode: (shippingAddress.zipcode) ? shippingAddress.zipcode : "",
                                        latitude: (shippingAddress.latitude) ? shippingAddress.latitude : 0,
                                        longitude: (shippingAddress.longitude) ? shippingAddress.longitude : 0,
                                        customer_shipping_note: shippingAddress.customer_shipping_note
                                    });
                                }

                                // Email
                                emailPayload.push({
                                    user_subscription_id: _temp_sub_data[0].subscription_id,
                                    isRecurringSubscription: is_recurring_product,
                                    user_id: user_id,
                                    first_name: first_name || '',
                                    user_email: user_email || '',
                                    orderNumber: (_temp_order_data) ? _temp_order_data[0].user_order_number : '',
                                    subscriptionNumber: (_temp_sub_data) ? _temp_sub_data[0].subscription_number : '',
                                    orderCreatedDate: od,
                                    OrderDetails: OrderDetails,
                                    productDetails: productDetails,
                                    userOrderId: _temp_order_data[0].user_orders_id,
                                    orderSubTotal: sub_amount,
                                    paymentMethod: (type == 2) ? 2 : 1,
                                    orderTotal: final_amount,
                                    SubscriptionDetails: [{
                                        start_date: moment(startDate).format("YYYY-MM-DD HH:mm:ss"),
                                        end_date: moment(_nextDate).format("YYYY-MM-DD HH:mm:ss"),
                                        total_amount: reccuring_amount
                                    }],
                                    site: site_id,
                                    templateIdentifier: EnumObject.templateIdentifier.get('orderPurchaseSuccessfully').value,
                                    billingAddress: billingAddress ? (billingAddress.address_line1 + " " + billingAddress.address_line2 + "," + billingAddress.city + "," + billingAddress.state_name || '' + "," + billingAddress.country_name || '') : '',
                                    SiteName: 'Grow ' + ((EnumObject.siteIdEnum.get(site_id.toString()).value) ? _.capitalize(EnumObject.siteIdEnum.get(site_id.toString()).value) : 'Account')
                                });

                                // add logs for user order and subscription
                                if (shippingAddress) {
                                    order_number = (_temp_order_data) ? _temp_order_data[0].user_order_number : '';
                                    recipient.name = (first_name) ? first_name : user_email;
                                    createShipbobOrder.user_id = user_id;
                                    let recipientStateName = "", recipientCountryName = "US";
                                    if (shippingAddress.state_id) {
                                        let stateName = await dbReader.stateModel.findOne({
                                            attributes: ["name"],
                                            where: {
                                                state_id: shippingAddress.state_id
                                            }
                                        });
                                        if (stateName) {
                                            recipientStateName = stateName.name;
                                        }
                                    }
                                    if (shippingAddress.country_id) {
                                        let countryName = await dbReader.countryModel.findOne({
                                            attributes: ["name"],
                                            where: {
                                                country_id: shippingAddress.country_id
                                            }
                                        });
                                        if (countryName) {
                                            recipientCountryName = countryName.name;
                                        }
                                    }
                                    recipient.address = {
                                        type: "MarkFor",
                                        address1: shippingAddress.address_line1,
                                        address2: shippingAddress.address_line2,
                                        company_name: "",
                                        city: shippingAddress.city,
                                        state: recipientStateName,
                                        country: recipientCountryName,
                                        zip_code: (shippingAddress.zipcode) ? shippingAddress.zipcode : ""
                                    }
                                    recipient.email = user_email;
                                    recipient.phone_number = "";
                                }

                                hubspot_subscription_id = _temp_sub_data[0].subscription_id;
                                hubspot_subscription_number = _temp_sub_data[0].subscription_number;
                                hubspot_user_orders_id = _temp_order_data[0].user_orders_id;
                                hubspot_user_order_number = _temp_order_data[0].user_order_number;

                                // add logs for user order and subscription
                                logList.push({
                                    type: 1,//order
                                    event_type_id: _temp_order_data[0].user_orders_id,
                                    message: "order #" + _temp_order_data[0].user_order_number + " purchased by Admin (" + display_name + ")",
                                });
                                logList.push({
                                    type: 2,
                                    event_type_id: _temp_sub_data[0].subscription_id,
                                    message: "subscription #" + _temp_sub_data[0].subscription_number + " purchased by Admin (" + display_name + ")",
                                });

                                // add notes for user order, subscription and activity
                                noteList.push({
                                    type: 1,//order
                                    event_type_id: _temp_order_data[0].user_orders_id,
                                    message: "order #" + _temp_order_data[0].user_order_number + " purchased by Admin (" + display_name + ")",
                                });
                                noteList.push({
                                    type: 2,
                                    event_type_id: _temp_sub_data[0].subscription_id,
                                    message: "subscription #" + _temp_sub_data[0].subscription_number + " purchased by Admin (" + display_name + ")",
                                });

                                // If Membership found then add logs & notes
                                if (membership_name_list.length) {
                                    logList.push({
                                        type: 1,//order
                                        event_type_id: _temp_order_data[0].user_orders_id,
                                        message: "Order #" + _temp_order_data[0].user_order_number + " has assigned new memberships " + membership_name_list,
                                    });
                                    logList.push({
                                        type: 2,
                                        event_type_id: _temp_sub_data[0].subscription_id,
                                        message: "Subscription #" + _temp_sub_data[0].subscription_number + " has assigned new memberships " + membership_name_list,
                                    });
                                    // add notes for user order, subscription and activity
                                    noteList.push({
                                        type: 1,//order
                                        event_type_id: _temp_order_data[0].user_orders_id,
                                        message: "Order #" + _temp_order_data[0].user_order_number + " has assigned new memberships " + membership_name_list,
                                    });
                                    noteList.push({
                                        type: 2,
                                        event_type_id: _temp_sub_data[0].subscription_id,
                                        message: "Subscription #" + _temp_sub_data[0].subscription_number + " has assigned new memberships " + membership_name_list,
                                    });
                                }

                                // subscription renewal log
                                if (is_product_duration) {
                                    subscriptionRenewalLogList.push({
                                        user_subscription_id: _temp_sub_data[0].subscription_id,
                                        user_orders_id: _temp_order_data[0].user_orders_id,
                                        user_id: user_id,
                                        end_date: moment(_nextDate).format('YYYY-MM-DD HH:mm:ss'),
                                        attempt_count: 0,
                                        renewal_date: moment(_nextDate).format('YYYY-MM-DD HH:mm:ss'),
                                        is_deleted: 0,
                                        is_executed: 0
                                    });
                                }
                            }
                            total_payment_amount += final_amount;
                            i++;
                        }
                    }
                } else {
                    let message = "subscription #" + subscription_number + " update by Admin (" + display_name + ")";
                    let final_amount = 0;
                    if (_temp_product_duration_group.length > i) {
                        while (_temp_product_duration_group.length > i) {
                            let items: any = _temp_product_duration_group[i];
                            // DB Product List
                            items.map(async (p: any) => {
                                final_amount += p.product_price;
                                newSubscriptionItemList.push({
                                    user_subscription_item_id: (products.some((s: any) => s.id == p.product_id)) ? products.find((s: any) => s.id == p.product_id).user_subscription_item_id || 0 : 0,
                                    user_subscription_id: subscription_id,
                                    item_type: 1,
                                    product_id: p.product_id,
                                    product_name: p.product_name,
                                    product_amount: p.product_price,
                                    shipping_fees: 0,
                                    processing_fees: 0,
                                    coupon_amount: 0,
                                });
                            });

                            //add fees into array
                            if (fees) {
                                final_amount += (fees.total / totalOrderCount);
                                newSubscriptionItemList.push({
                                    user_subscription_item_id: fees.user_subscription_item_id || 0,
                                    user_subscription_id: subscription_id,
                                    item_type: 2,
                                    product_id: 0,
                                    product_name: fees.item_name,
                                    product_amount: fees.total / totalOrderCount,
                                    shipping_fees: 0,
                                    processing_fees: 0,
                                    coupon_amount: 0,
                                });
                            }

                            //add shipping into array
                            if (shippings) {
                                final_amount += (shippings.total / totalOrderCount);
                                newSubscriptionItemList.push({
                                    user_subscription_item_id: shippings.user_subscription_item_id || 0,
                                    user_subscription_id: subscription_id,
                                    item_type: 3,
                                    product_id: 0,
                                    product_name: shippings.item_name,
                                    product_amount: shippings.total / totalOrderCount,
                                    shipping_fees: 0,
                                    processing_fees: 0,
                                    coupon_amount: 0,
                                });
                            }

                            //add taxes into array
                            if (taxes) {
                                final_amount += (taxes.total / totalOrderCount);
                                newSubscriptionItemList.push({
                                    user_subscription_item_id: taxes.user_subscription_item_id || 0,
                                    user_subscription_id: subscription_id,
                                    item_type: 4,
                                    product_id: 0,
                                    product_name: taxes.item_name,
                                    product_amount: taxes.total / totalOrderCount,
                                    shipping_fees: 0,
                                    processing_fees: 0,
                                    coupon_amount: 0,
                                });
                            }

                            //Coupon Discount
                            if (coupon_code || coupon_ids.length) {
                                message = "subscription #" + subscription_number + " coupon added by Admin (" + display_name + ")";
                                if (couponValidation && couponValidation.billingAmount.coupon_discount != 0) {
                                    final_amount -= (couponValidation.billingAmount.coupon_discount);
                                    if (couponValidation.coupon_data && couponValidation.coupon_data.length) {
                                        couponValidation.coupon_data.forEach((element: any) => {
                                            newSubscriptionItemList.push({
                                                user_subscription_item_id: (discount) ? discount.user_subscription_item_id : 0,
                                                user_subscription_id: subscription_id,
                                                item_type: 5,
                                                product_id: element.coupon_id,
                                                product_name: `Coupon("${element.coupon_code}") Discount`,
                                                product_amount: element.coupon_discount,
                                                shipping_fees: 0,
                                                processing_fees: 0,
                                                coupon_amount: 0,
                                            });
                                        });
                                    }
                                }
                            } else {
                                if (discount) {
                                    final_amount += (discount.total);
                                    newSubscriptionItemList.push({
                                        user_subscription_item_id: discount.user_subscription_item_id || 0,
                                        user_subscription_id: subscription_id,
                                        item_type: 4,
                                        product_id: 0,
                                        product_name: discount.item_name,
                                        product_amount: discount.total,
                                        shipping_fees: 0,
                                        processing_fees: 0,
                                        coupon_amount: 0,
                                    });
                                } else {
                                    message = "subscription #" + subscription_number + " product update by Admin (" + display_name + ")";
                                }
                            }
                            i++;
                        }
                    }

                    let _nextDate = (nextDate) ? nextDate : null
                    startDate = moment(startDate, 'YYYY-MM-DD HH:mm').toDate()
                    if (is_start_date || is_next_date || (coupon_code || (coupon_ids && coupon_ids.length)) || final_amount) {
                        let upData: any = null;
                        if (is_start_date) {
                            message = "subscription #" + subscription_number + " start date update by Admin (" + display_name + ")";
                            upData = {
                                start_date: moment(startDate).format("YYYY-MM-DD HH:mm:ss")
                            };
                        }
                        if (is_next_date) {
                            message = "subscription #" + subscription_number + " next date (" + moment(_nextDate).format('MM-DD-YYYY') + " UTC) update by Admin (" + display_name + ")"; // DVL
                            upData = {
                                end_date: _nextDate,
                                next_payment_date: _nextDate,
                            }
                            if (subscription_id) {
                                let lastUserOrder = await dbReader.userOrder.findOne({
                                    where: {
                                        user_subscription_id: subscription_id,
                                        order_status: [2, 3]
                                    },
                                    attributes: ["user_orders_id"],
                                    order: [['user_orders_id', 'DESC']],
                                    limit: 1
                                })
                                lastUserOrder = JSON.parse(JSON.stringify(lastUserOrder));
                                if (is_save == 0 && moment(_nextDate).format('YYYY-MM-DD HH:mm:ss') >= moment().format('YYYY-MM-DD HH:mm:ss')) {
                                    if (moment(_nextDate).format('YYYY-MM-DD') == moment().format('YYYY-MM-DD')) {
                                        if ((moment(_nextDate).format('HH:mm:ss') == '00:00:00')) {
                                            await new Promise(resolve => setTimeout(resolve, 3000));
                                        }

                                        /* delete subscriptionRenewal of that user */
                                        let subscriptionRenewalDt = await dbReader.subscriptionRenewal.findOne({
                                            where: {
                                                user_subscription_id: subscription_id,
                                                is_executed: 0,
                                                is_deleted: 0
                                            }
                                        });
                                        let attempt_count = 0
                                        if (subscriptionRenewalDt) {
                                            attempt_count = subscriptionRenewalDt.attempt_count
                                        }

                                        // After 1 hr set
                                        let new_time = moment().add(1, 'hours')

                                        await dbWriter.subscriptionRenewal.update({
                                            is_deleted: 1,
                                            updated_datetime: new Date(),
                                            note: 'Update next payment date (' + new_time + ') by admin'
                                        }, {
                                            where: {
                                                user_subscription_id: subscription_id,
                                                is_executed: 0,
                                                is_deleted: 0,
                                                is_instant_payment: 0
                                            }
                                        });

                                        await dbWriter.subscriptionRenewalCronLog.update({
                                            is_deleted: 1
                                        }, {
                                            where: {
                                                user_subscription_id: subscription_id,
                                                is_deleted: 0,
                                                is_executed: 0
                                            }
                                        })

                                        let subscriptionRenewalData = await dbWriter.subscriptionRenewal.create({
                                            attempt_count: attempt_count,
                                            renewal_date: new_time.format("YYYY-MM-DD HH:mm:ss"),
                                            user_subscription_id: subscription_id,
                                            user_orders_id: (lastUserOrder) ? lastUserOrder.user_orders_id : 0,
                                            site_id: site_id,
                                            user_id: user_id,
                                            is_executed: 1
                                        });
                                        if (subscriptionRenewalData) {
                                            let uuid = uuidv4();
                                            await dbWriter.subscriptionRenewalCronLog.create({
                                                subscription_renewal_id: subscriptionRenewalData.subscription_renewal_id,
                                                user_subscription_id: subscription_id,
                                                is_executed: 0,
                                                end_date: new_time.format("YYYY-MM-DD HH:mm:ss"),
                                                renewal_date: new_time.format("YYYY-MM-DD HH:mm:ss"),
                                                uuid: uuid
                                            });
                                            try {
                                                await axios.get('https://api.accounts.stuffyoucanuse.org/api/v1/updateSubscriptionRenewalCron/' + uuid);
                                            } catch (e: any) {
                                                console.log(e.message);
                                            }
                                        }
                                    } else {
                                        let getLastRenewalDate = await dbReader.userSubscription.findOne({
                                            where: { user_subscription_id: subscription_id },
                                            attributes: ['next_payment_date'],
                                        })
                                        if (getLastRenewalDate && getLastRenewalDate.next_payment_date != moment(_nextDate).format('YYYY-MM-DD HH:mm:ss')) {
                                            // upData.next_payment_date = moment(_nextDate).add(1, 'hours').format('YYYY-MM-DD HH:mm:ss')
                                            upData.next_payment_date = moment(_nextDate).format('YYYY-MM-DD HH:mm:ss')
                                            upData.subscription_status = 2

                                            /* delete subscriptionRenewal of that user */
                                            await dbWriter.subscriptionRenewal.update({
                                                is_deleted: 1,
                                                updated_datetime: new Date(),
                                                note: 'Update next payment date (' + new Date() + ') by admin'
                                            }, {
                                                where: {
                                                    user_subscription_id: subscription_id,
                                                    is_executed: 0,
                                                    is_deleted: 0,
                                                    is_instant_payment: 0
                                                }
                                            });

                                            await dbWriter.subscriptionRenewalCronLog.update({
                                                is_deleted: 1
                                            }, {
                                                where: {
                                                    user_subscription_id: subscription_id,
                                                    is_deleted: 0,
                                                    is_executed: 0
                                                }
                                            })

                                            if (lastUserOrder) {
                                                await dbWriter.userOrder.update({
                                                    order_status: 2,
                                                    payment_type: 1
                                                }, {
                                                    where: { user_orders_id: lastUserOrder.user_orders_id }
                                                });
                                                await dbWriter.userMemberships.update({
                                                    order_status: 2
                                                }, {
                                                    where: { user_subscription_id: subscription_id }
                                                });
                                                await dbWriter.subscriptionRenewal.create({
                                                    attempt_count: 0,
                                                    renewal_date: upData.next_payment_date,
                                                    user_subscription_id: subscription_id,
                                                    user_orders_id: lastUserOrder.user_orders_id,
                                                    site_id: site_id,
                                                    user_id: user_id,
                                                });
                                            } else {
                                                await dbWriter.subscriptionRenewal.create({
                                                    attempt_count: 0,
                                                    renewal_date: upData.next_payment_date,
                                                    user_subscription_id: subscription_id,
                                                    user_orders_id: 0,
                                                    site_id: site_id,
                                                    user_id: user_id,
                                                });
                                            }
                                        }
                                    }

                                } else {
                                    if (is_save == 1) {
                                        if (checkOutLog) {
                                            await dbWriter.checkOutLogs.update({
                                                user_id: user_id ? user_id : 0,
                                                subscription_id: subscription_id,
                                                is_instant_payment: 1
                                            }, {
                                                where: { checkout_log_id: checkOutLog.checkout_log_id }
                                            });
                                        }
                                        // Instant Payment
                                        let nc = new checkoutController();
                                        let instantPaymentData = await nc.instantPayment(req, subscription_id)
                                        if (instantPaymentData.res) {
                                            upData = {
                                                updated_datetime: moment().format("YYYY-MM-DD HH:mm:ss")
                                            }
                                            if (checkOutLog) {
                                                await dbWriter.checkOutLogs.update({
                                                    response: JSON.stringify(instantPaymentData),
                                                    api_status: "Success",
                                                }, {
                                                    where: { checkout_log_id: checkOutLog.checkout_log_id }
                                                });
                                            }
                                        } else {
                                            if (checkOutLog) {
                                                await dbWriter.checkOutLogs.update({
                                                    response: JSON.stringify(instantPaymentData),
                                                    api_status: "Fail",
                                                }, {
                                                    where: { checkout_log_id: checkOutLog.checkout_log_id }
                                                });
                                            }
                                            throw new Error(instantPaymentData.err)
                                        }
                                    } else if (is_save == 2) {
                                        /* delete subscriptionRenewal of that user */
                                        let subscriptionRenewalDt = await dbReader.subscriptionRenewal.findOne({
                                            where: {
                                                user_subscription_id: subscription_id,
                                                is_executed: 0,
                                                is_deleted: 0
                                            }
                                        });
                                        let attempt_count = 0
                                        if (subscriptionRenewalDt) {
                                            attempt_count = subscriptionRenewalDt.attempt_count
                                        }

                                        // After 1 hr set
                                        let new_time = moment().add(1, 'hours')

                                        await dbWriter.subscriptionRenewal.update({
                                            is_deleted: 1,
                                            updated_datetime: new Date(),
                                            note: 'Update next payment date (' + new_time + ') by admin'
                                        }, {
                                            where: {
                                                user_subscription_id: subscription_id,
                                                is_executed: 0,
                                                is_deleted: 0,
                                                is_instant_payment: 0
                                            }
                                        });

                                        await dbWriter.subscriptionRenewalCronLog.update({
                                            is_deleted: 1
                                        }, {
                                            where: {
                                                user_subscription_id: subscription_id,
                                                is_deleted: 0,
                                                is_executed: 0
                                            }
                                        })

                                        let subscriptionRenewalData = await dbWriter.subscriptionRenewal.create({
                                            attempt_count: attempt_count,
                                            renewal_date: new_time.format("YYYY-MM-DD HH:mm:ss"),
                                            user_subscription_id: subscription_id,
                                            user_orders_id: (lastUserOrder) ? lastUserOrder.user_orders_id : 0,
                                            site_id: site_id,
                                            user_id: user_id,
                                            is_executed: 1
                                        });
                                        if (subscriptionRenewalData) {
                                            let uuid = uuidv4();
                                            await dbWriter.subscriptionRenewalCronLog.create({
                                                subscription_renewal_id: subscriptionRenewalData.subscription_renewal_id,
                                                user_subscription_id: subscription_id,
                                                is_executed: 0,
                                                end_date: new_time.format("YYYY-MM-DD HH:mm:ss"),
                                                renewal_date: new_time.format("YYYY-MM-DD HH:mm:ss"),
                                                uuid: uuid
                                            });
                                            try {
                                                await axios.get('https://api.accounts.stuffyoucanuse.org/api/v1/updateSubscriptionRenewalCron/' + uuid);
                                            } catch (e: any) {
                                                console.log(e.message);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        if (coupon_code || (coupon_ids && coupon_ids.length))
                            upData = {
                                coupon_code: coupon_code,
                                coupon_ids: (coupon_ids && coupon_ids.length) ? coupon_ids.join(',') : ''
                            };
                        if (final_amount)
                            upData = {
                                ...upData,
                                total_amount: final_amount
                            }

                        await dbWriter.userSubscription.update(upData, {
                            where: { user_subscription_id: subscription_id }
                        });
                    }
                    if (is_billing_address && billingAddress) {
                        if (billingAddress.user_address_id) {
                            message = "subscription #" + subscription_number + " billing address update by Admin (" + display_name + ")";
                        } else {
                            message = "subscription #" + subscription_number + " billing address added by Admin (" + display_name + ")";
                        }
                        //Billing Address
                        newSubscriptionAddress.push({
                            user_address_id: (billingAddress.is_master == 1) ? 0 : (billingAddress.user_address_id || 0),
                            parent_user_address_id: billingAddress.user_address_id,
                            first_name: billingAddress.first_name,
                            last_name: billingAddress.last_name,
                            email_address: billingAddress.email_address,
                            phone_number: billingAddress.phone_number,
                            address_type: 1, // billing address type
                            address_line1: billingAddress.address_line1,
                            address_line2: billingAddress.address_line2,
                            city: billingAddress.city,
                            state_id: billingAddress.state_id,
                            country_id: billingAddress.country_id,
                            company: billingAddress.company,
                            user_orders_id: 0,
                            user_subscription_id: subscription_id,
                            user_id: user_id,
                            zipcode: (billingAddress.zipcode) ? billingAddress.zipcode : "",
                            latitude: (billingAddress.latitude) ? billingAddress.latitude : 0,
                            longitude: (billingAddress.longitude) ? billingAddress.longitude : 0,
                        });
                    }
                    if (is_shipping_address && shippingAddress) {
                        if (shippingAddress.user_address_id) {
                            message = "subscription #" + subscription_number + " shipping address update by Admin (" + display_name + ")";
                        } else {
                            message = "subscription #" + subscription_number + " shipping address added by Admin (" + display_name + ")";
                        }
                        //Shipping Address
                        newSubscriptionAddress.push({
                            user_address_id: (shippingAddress.is_master == 1) ? 0 : (shippingAddress.user_address_id || 0),
                            parent_user_address_id: shippingAddress.user_address_id,
                            first_name: shippingAddress.first_name,
                            last_name: shippingAddress.last_name,
                            email_address: shippingAddress.email_address,
                            phone_number: shippingAddress.phone_number,
                            address_type: 2, // shipping address type
                            address_line1: shippingAddress.address_line1,
                            address_line2: shippingAddress.address_line2,
                            city: shippingAddress.city,
                            state_id: shippingAddress.state_id,
                            country_id: shippingAddress.country_id,
                            company: shippingAddress.company,
                            user_orders_id: 0,
                            user_subscription_id: subscription_id,
                            customer_shipping_note: shippingAddress.customer_shipping_note,
                            user_id: user_id,
                            zipcode: (shippingAddress.zipcode) ? shippingAddress.zipcode : "",
                            latitude: (shippingAddress.latitude) ? shippingAddress.latitude : 0,
                            longitude: (shippingAddress.longitude) ? shippingAddress.longitude : 0,
                        });
                    }
                    if (pg_customer_card_id != 0 || cardDetails || paymentCheckDetails) {
                        if (paymentCheckDetails) {
                            message = "subscription #" + subscription_number + " check payment method update by Admin (" + display_name + ")";
                            let paymentCheck = await dbWriter.paymentCheck.create({
                                account_holder_name: paymentCheckDetails.account_holder_name,
                                site_id: site_id,
                                user_id: user_id,
                                amount: paymentCheckDetails.amount,
                                check_number: paymentCheckDetails.check_number,
                                order_id: 0,
                                user_subscription_id: subscription_id ?? 0,
                                is_payment_confirmed: paymentCheckDetails.is_payment_confirmed,
                                created_date: moment().unix(),
                            });
                            await dbWriter.userSubscription.update({
                                pg_customer_id: 0,
                                pg_card_id: paymentCheck.payment_check_id,
                                pg_transaction_type: type,
                                is_renewal: 2
                            }, {
                                where: { user_subscription_id: subscription_id }
                            });
                        } else {
                            message = "subscription #" + subscription_number + " card payment method update by Admin (" + display_name + ")";
                            let stripeMainObj = new stripeMain();
                            let sitePaymentServiceData = await stripeMainObj.getSecreteKey(site_id);
                            let throwError: string = "Payment service not available.";

                            let custom_site_id = site_id
                            if (site_id == 2 || site_id == 3 || site_id == 4 || site_id == 5 || site_id == 6) {
                                custom_site_id = 2;
                            }

                            if (sitePaymentServiceData) {
                                let site_credentials = JSON.parse(sitePaymentServiceData.auth_json);
                                let site_payment_service_id = sitePaymentServiceData.site_payment_service_id;
                                //get user and user customer details
                                let userDetails = await dbReader.users.findOne({
                                    where: {
                                        user_id: user_id
                                    },
                                    include: [{
                                        required: false,
                                        model: dbReader.stripeCustomer,
                                        where: { site_id: custom_site_id }
                                    }, {
                                        required: false,
                                        as: 'billingAddressOne',
                                        model: dbReader.userAddress,
                                        where: { address_type: 1, user_subscription_id: 0, user_orders_id: 0, is_deleted: 0 },
                                        attributes: ['address_line1', 'city', 'latitude', 'longitude', [dbReader.Sequelize.literal('`billingAddressOne->stateModel`.`state_code`'), 'state_code'], [dbReader.Sequelize.literal('`billingAddressOne->countryModel`.`country_code`'), 'country_code'], 'zipcode'],
                                        include: [{
                                            model: dbReader.stateModel,
                                            attributes: []
                                        }, {
                                            model: dbReader.countryModel,
                                            attributes: []
                                        }]
                                    }, {
                                        required: false,
                                        model: dbReader.userSubscription,
                                        where: { user_subscription_id: subscription_id },
                                        include: [{
                                            as: 'billingAddress',
                                            required: false,
                                            model: dbReader.userAddress,
                                            where: { address_type: 1, user_orders_id: 0, is_deleted: 0 },
                                            attributes: ['address_line1', 'city', 'latitude', 'longitude', [dbReader.Sequelize.literal('`user_subscriptions->billingAddress->stateModel`.`state_code`'), 'state_code'], [dbReader.Sequelize.literal('`user_subscriptions->billingAddress->countryModel`.`country_code`'), 'country_code'], 'zipcode'],
                                            include: [{
                                                model: dbReader.stateModel,
                                                attributes: []
                                            }, {
                                                model: dbReader.countryModel,
                                                attributes: []
                                            }]
                                        }]
                                    }]
                                });
                                userDetails = JSON.parse(JSON.stringify(userDetails));
                                throwError = "Payment Failed. Please provide your billing address details correctly.";
                                if (userDetails && (userDetails.billingAddressOne || (userDetails.user_subscriptions.length && userDetails.user_subscriptions[0].billingAddress))) {
                                    user_email = userDetails.email;
                                    let customerId = userDetails.sycu_stripe_customer?.stripe_customer_id ?? "";
                                    let customer_id = userDetails.sycu_stripe_customer?.sycu_stripe_customer_id ?? ""
                                    let userEmail = userDetails.email;
                                    let cardId = 0, card_id = 0;
                                    let userName = userDetails.display_name;
                                    switch (sitePaymentServiceData.payment_service_id) {
                                        case EnumObject.paymentServiceEnum.get("Stripe").value:
                                            let stripe_key = site_credentials.stripe_secret_key;
                                            if (pg_customer_card_id == 0) {
                                                // create customer on stripe if not available
                                                if (!customerId) {
                                                    let address = {
                                                        line1: userDetails.billingAddressOne ? userDetails.billingAddressOne.address_line1 : userDetails.user_subscriptions[0].billingAddress.address_line1,
                                                        postal_code: userDetails.billingAddressOne ? userDetails.billingAddressOne.zipcode : userDetails.user_subscriptions[0].billingAddress.zipcode,
                                                        city: userDetails.billingAddressOne ? userDetails.billingAddressOne.city : userDetails.user_subscriptions[0].billingAddress.city,
                                                        state: userDetails.billingAddressOne ? userDetails.billingAddressOne.state_code : userDetails.user_subscriptions[0].billingAddress.state_code,
                                                        country: userDetails.billingAddressOne ? userDetails.billingAddressOne.country_code : userDetails.user_subscriptions[0].billingAddress.country_code,
                                                    };
                                                    var stripe_customer = await stripeMainObj.stripeCustomerInfo(stripe_key, userName, address, userEmail, user_id, site_id, site_payment_service_id)
                                                    if (stripe_customer.status) {
                                                        customerId = stripe_customer.payment_getaway_customer.id;
                                                        customer_id = stripe_customer.customer_details.sycu_stripe_customer_id;
                                                    } else {
                                                        throwError = stripe_customer.message;
                                                    }
                                                }

                                                if (customerId) {
                                                    // add card on stripe if not available
                                                    cardDetails.cardName = cardDetails.cardName || userDetails.display_name;
                                                    let _cardDetails = await stripeMainObj.stripeCustomerCardInfo(stripe_key, cardDetails, customerId, site_id, user_id, site_payment_service_id);
                                                    if (_cardDetails.status) {
                                                        cardId = _cardDetails.payment_getaway_card.id;
                                                        card_id = _cardDetails.card_details.pg_customer_card_id;
                                                        let getLastRenewalDate = await dbReader.userSubscription.findOne({
                                                            where: { user_subscription_id: subscription_id },
                                                            attributes: ['next_payment_date', 'pg_transaction_type', 'user_subscription_id', 'site_id', 'user_id', 'is_renewal'],
                                                        })
                                                        let is_enable_renewal = 0
                                                        let userSubscriptionUpdateData: any = { pg_customer_id: customer_id, pg_card_id: card_id, pg_transaction_type: 1 }
                                                        if (getLastRenewalDate.pg_transaction_type == 2) {
                                                            is_enable_renewal = 1
                                                        } else {
                                                            is_enable_renewal = getLastRenewalDate.is_renewal
                                                        }
                                                        if (is_enable_renewal == 1) {
                                                            userSubscriptionUpdateData.is_renewal = 1
                                                            await self.updateSubscriptionRenewal(getLastRenewalDate)
                                                        }
                                                        await dbWriter.userSubscription.update(userSubscriptionUpdateData, { where: { user_subscription_id: subscription_id } });
                                                        break;
                                                    } else {
                                                        throwError = _cardDetails.message;
                                                        throw new Error(throwError);
                                                    }
                                                } else {
                                                    throw new Error(throwError);
                                                }
                                            } else {
                                                let cardDetailsObj = await dbReader.userCard.findOne({
                                                    where: { pg_customer_card_id: pg_customer_card_id }
                                                });
                                                cardDetailsObj = JSON.parse(JSON.stringify(cardDetailsObj));
                                                if (cardDetailsObj) {
                                                    cardId = cardDetailsObj.stripe_card_id;
                                                    card_id = pg_customer_card_id;
                                                    let getLastRenewalDate = await dbReader.userSubscription.findOne({
                                                        where: { user_subscription_id: subscription_id },
                                                        attributes: ['next_payment_date', 'pg_transaction_type', 'user_subscription_id', 'site_id', 'user_id', 'is_renewal'],
                                                    })
                                                    let is_enable_renewal = 0
                                                    let userSubscriptionUpdateData: any = { pg_customer_id: customer_id, pg_card_id: card_id, pg_transaction_type: 1 }
                                                    if (getLastRenewalDate.pg_transaction_type == 2) {
                                                        is_enable_renewal = 1
                                                    } else {
                                                        is_enable_renewal = getLastRenewalDate.is_renewal
                                                    }
                                                    if (is_enable_renewal == 1) {
                                                        userSubscriptionUpdateData.is_renewal = 1
                                                        await self.updateSubscriptionRenewal(getLastRenewalDate)
                                                    }
                                                    await dbWriter.userSubscription.update(userSubscriptionUpdateData, { where: { user_subscription_id: subscription_id } });
                                                    break;
                                                } else {
                                                    throw new Error("Selected Card not exist.");
                                                }
                                            }
                                        default:
                                            throw new Error("Payment service not available.");
                                    }
                                } else {
                                    throw new Error(throwError);
                                }
                            } else {
                                throw new Error(throwError);
                            }
                        }
                    }

                    hubspot_subscription_id = subscription_id;
                    hubspot_subscription_number = subscription_number;

                    logList.push({
                        type: 2,
                        event_type_id: subscription_id,
                        message: message,
                    })
                    noteList.push({
                        type: 2,
                        event_type_id: subscription_id,
                        message: message,
                    })

                    if (product_change && products.length && old_products.length) {
                        if (products.length <= 1 && old_products.length <= 1) {
                            let lastUserOrder = await dbReader.userOrder.findOne({
                                where: {
                                    user_subscription_id: subscription_id,
                                    order_status: [2, 3]
                                },
                                order: [['user_orders_id', 'DESC']],
                                limit: 1
                            });
                            if (lastUserOrder) {
                                lastUserOrder = JSON.parse(JSON.stringify(lastUserOrder));
                                let productsData = await dbReader.products.findOne({
                                    where: { product_id: products[0].id },
                                    attributes: ["product_id", "product_name", "product_price"],
                                });
                                await dbWriter.userOrderItems.update({ is_deleted: 1 }, {
                                    where: {
                                        user_orders_id: lastUserOrder.user_orders_id,
                                        product_id: old_products[0].id,
                                        is_deleted: 0,
                                    }
                                });
                                await dbWriter.userOrderItems.create({
                                    user_orders_id: lastUserOrder.user_orders_id,
                                    item_type: 1,
                                    product_name: productsData.product_name,
                                    product_id: productsData.product_id,
                                    product_amount: productsData.product_price,
                                });

                                message = "product changed from '" + old_products[0].item_name + "' to '" + productsData.product_name + "' update by Admin (" + display_name + ")";
                                logList.push({
                                    type: 2,
                                    event_type_id: subscription_id,
                                    message: message,
                                })
                                noteList.push({
                                    type: 2,
                                    event_type_id: subscription_id,
                                    message: message,
                                })

                                //======================4. ActiveCampagin CODE==================//
                                let activecampaign_response = await dbReader.thirdParty.findOne({
                                    attributes: ['is_active'],
                                    where: { thirdparty_id: 8 }
                                });
                                activecampaign_response = JSON.parse(JSON.stringify(activecampaign_response));
                                let getUser = await dbReader.users.findOne({
                                    attributes: ['activecampaign_contact_id'],
                                    where: { user_id: user_id }
                                });
                                getUser = JSON.parse(JSON.stringify(getUser));
                                let activecampaign_contact_id = getUser ? getUser.activecampaign_contact_id : 0;
                                if (activecampaign_response.is_active == 1 && activecampaign_contact_id != 0) {
                                    let productList = products.map((s: any) => s.id);
                                    let addOrRemoveFlag = "add";
                                    let activeCampaignData = {
                                        "products": productList,
                                        "contact_id": activecampaign_contact_id,
                                        "user_id": user_id
                                    }
                                    await activeCampaign.activeCampaignMapProductsData(activeCampaignData, addOrRemoveFlag);
                                }
                            }
                        }
                    }
                }

                let masterAddressData: any = []
                if (newMasterAddress.length) {
                    //delete previous subscriptions same address
                    await dbWriter.userAddress.update({
                        is_deleted: 1
                    }, {
                        where: { user_subscription_id: _user_subscription_id }
                    })
                    masterAddressData = await dbWriter.userAddress.bulkCreate(newMasterAddress)
                }

                let user_orders_id: any = [];
                if (newOrderList.length) {
                    let user_order_date = "case user_orders_id", user_order_number = "case user_orders_id", user_subscription_id = "case user_orders_id", user_id = "case user_orders_id", order_status = "case user_orders_id", sub_amount = "case user_orders_id", coupon_amount = "case user_orders_id", shipping_amount = "case user_orders_id", fees_amount = "case user_orders_id", tax_amount = "case user_orders_id", total_amount = "case user_orders_id", site_id = "case user_orders_id", ip_address = "case user_orders_id";

                    newOrderList.forEach(async (element: any) => {
                        user_orders_id.push(element.user_orders_id);
                        user_order_date += " when " + element.user_orders_id + " then '" + element.user_order_date + "'";
                        user_order_number += " when " + element.user_orders_id + " then " + element.user_order_number;
                        user_subscription_id += " when " + element.user_orders_id + " then " + element.user_subscription_id;
                        user_id += " when " + element.user_orders_id + " then " + element.user_id;
                        site_id += " when " + element.user_orders_id + " then " + element.site_id;
                        order_status += " when " + element.user_orders_id + " then " + element.order_status;
                        sub_amount += " when " + element.user_orders_id + " then " + element.sub_amount;
                        coupon_amount += " when " + element.user_orders_id + " then " + element.coupon_amount;
                        shipping_amount += " when " + element.user_orders_id + " then " + element.shipping_amount;
                        fees_amount += " when " + element.user_orders_id + " then " + element.fees_amount;
                        tax_amount += " when " + element.user_orders_id + " then " + element.tax_amount;
                        total_amount += " when " + element.user_orders_id + " then " + element.total_amount;
                        // ip_address += " when " + element.user_orders_id + " then " + element.ip_address;
                    });
                    if (user_orders_id.length) {
                        user_order_date += " else user_order_date end";
                        user_order_number += " else user_order_number end";
                        user_subscription_id += " else user_subscription_id end";
                        user_id += " else user_id end";
                        site_id += " else site_id end";
                        order_status += " else order_status end";
                        sub_amount += " else sub_amount end";
                        coupon_amount += " else coupon_amount end";
                        shipping_amount += " else shipping_amount end";
                        fees_amount += " else fees_amount end";
                        tax_amount += " else tax_amount end";
                        total_amount += " else total_amount end";
                        // ip_address += " else ip_address end";


                        await dbWriter.userOrder.update({
                            user_order_date: dbWriter.Sequelize.literal(user_order_date),
                            user_order_number: dbWriter.Sequelize.literal(user_order_number),
                            user_subscription_id: dbWriter.Sequelize.literal(user_subscription_id),
                            user_id: dbWriter.Sequelize.literal(user_id),
                            site_id: dbWriter.Sequelize.literal(site_id),
                            order_status: dbWriter.Sequelize.literal(order_status),
                            sub_amount: dbWriter.Sequelize.literal(sub_amount),
                            coupon_amount: dbWriter.Sequelize.literal(coupon_amount),
                            shipping_amount: dbWriter.Sequelize.literal(shipping_amount),
                            fees_amount: dbWriter.Sequelize.literal(fees_amount),
                            tax_amount: dbWriter.Sequelize.literal(tax_amount),
                            total_amount: dbWriter.Sequelize.literal(total_amount),
                            is_from: 1
                            // ip_address: dbWriter.Sequelize.literal(ip_address)
                        }, {
                            where: { user_orders_id: user_orders_id }
                        });
                    }
                }

                if (newOrderItemList.length) {
                    let orderItemData = await dbWriter.userOrderItems.bulkCreate(newOrderItemList);
                    orderItemData = JSON.parse(JSON.stringify(orderItemData));
                    orderItemData.forEach((element: any) => {
                        let config_id = 0
                        if (element.product_name.includes("Kid")) {
                            // config_id = EnumObject.geoConfigData.get("kids").value
                            config_id = 1
                        } else if (element.product_name.includes("Student")) {
                            // config_id = EnumObject.geoConfigData.get("students").value
                            config_id = 2
                        } else if (element.product_name.includes("Group")) {
                            // config_id = EnumObject.geoConfigData.get("groups").value
                            config_id = 3
                        } else if (element.product_name.includes("Hub")) {
                            // config_id = EnumObject.geoConfigData.get("hub").value
                            config_id = 4
                        } else if (element.product_name.includes("Slider")) {
                            // config_id = EnumObject.geoConfigData.get("slider").value
                            config_id = 5
                        } else if (element.product_name.includes("People")) {
                            // config_id = EnumObject.geoConfigData.get("people").value
                            config_id = 6
                        } else if (element.product_name.includes("Builder")) {
                            // config_id = EnumObject.geoConfigData.get("builder").value
                            config_id = 7
                        } else if (element.product_name.includes("Together")) {
                            config_id = 8
                        }
                        if (element.item_type == 1 && billingAddress) {
                            newGeoData.push({
                                email_address: billingAddress.email_address,
                                user_id: user_id,
                                user_orders_id: element.user_orders_id,
                                user_order_item_id: element.user_order_item_id,
                                user_subscription_id: subscription_id,
                                first_name: billingAddress.first_name,
                                last_name: billingAddress.last_name,
                                address: billingAddress.address_line1 + " " + billingAddress.address_line2 + "," + billingAddress.city + "," + billingAddress.state_name || '' + "," + billingAddress.country_name || '',
                                user_address_id: billingAddress.user_address_id || 0,
                                product_id: element.product_id,
                                zipcode: billingAddress.zipcode,
                                latitude: billingAddress.latitude || 0,
                                longitude: billingAddress.longitude || 0,
                                geo_config_id: config_id,
                            })
                        }
                    });

                }

                if (newOrderAddress.length) {
                    if (masterAddressData.length) {
                        newOrderAddress.forEach((element: any) => {
                            if (masterAddressData.some((e: any) => e.address_type == element.address_type)) {
                                element.parent_user_address_id = masterAddressData.find((e: any) => e.address_type == element.address_type).user_address_id;
                            }
                        });
                    }

                    //delete previous subscriptions same address
                    await dbWriter.userAddress.update({
                        is_deleted: 1
                    }, {
                        where: { user_subscription_id: _user_subscription_id }
                    })

                    await dbWriter.userAddress.bulkCreate(newOrderAddress);
                }

                try {
                    let apiLogData = {
                        user_id: user_id,
                        user_subscription_id: _user_subscription_id,
                        newSubscriptionList: newSubscriptionList,
                    }
                    await dbWriter.apiLogs.create({
                        api_url: "/checkOutAdminSubscription",
                        method: "POST",
                        request: JSON.stringify(req.body),
                        response: JSON.stringify(apiLogData),
                        header: JSON.stringify(req.headers)
                    })
                } catch (error) {

                }

                let update_subscription_id: any = [];
                if (newSubscriptionList.length) {
                    let end_date = "case user_subscription_id", start_date = "case user_subscription_id", pg_customer_id = "case user_subscription_id",
                        pg_card_id = "case user_subscription_id", site_id = "case user_subscription_id", pg_transaction_type = "case user_subscription_id",
                        subscription_status = "case user_subscription_id", next_payment_date = "case user_subscription_id", trial_end_date = "case user_subscription_id",
                        last_order_date = "case user_subscription_id", user_id = "case user_subscription_id", total_amount = "case user_subscription_id",
                        subscription_number = "case user_subscription_id", coupon_code_edit = "case user_subscription_id", is_recurring_subscription_edit = "case user_subscription_id",
                        is_from = "case user_subscription_id", last_order_id_edit = "case user_subscription_id", coupon_ids_edit = "case user_subscription_id";

                    newSubscriptionList.forEach((element: any) => {
                        update_subscription_id.push(element.subscription_id);
                        let coupon_ids_string_data = (coupon_ids && coupon_ids.length) ? coupon_ids.join(',') : '';

                        user_id += " when " + element.subscription_id + " then " + element.user_id;
                        site_id += " when " + element.subscription_id + " then " + element.site_id;
                        end_date += " when " + element.subscription_id + " then '" + element.end_date + "'";
                        start_date += " when " + element.subscription_id + " then '" + element.start_date + "'";
                        next_payment_date += " when " + element.subscription_id + " then '" + element.next_payment_date + "'";
                        trial_end_date += " when " + element.subscription_id + " then '" + element.trial_end_date + "'";
                        last_order_date += " when " + element.subscription_id + " then '" + element.last_order_date + "'";
                        total_amount += " when " + element.subscription_id + " then " + element.total_amount;
                        subscription_number += " when " + element.subscription_id + " then " + element.subscription_number;
                        pg_customer_id += " when " + element.subscription_id + " then " + element.pg_customer_id;
                        pg_card_id += " when " + element.subscription_id + " then " + element.pg_card_id;
                        is_recurring_subscription_edit += " when " + element.subscription_id + " then " + element.is_recurring_subscription;
                        // pg_transaction_type += " when " + element.subscription_id + " then " + element.pg_transaction_type;
                        subscription_status += " when " + element.subscription_id + " then " + element.subscription_status;
                        coupon_code_edit += " when " + element.subscription_id + " then '" + coupon_code + "'";
                        coupon_ids_edit += " when " + element.subscription_id + " then '" + coupon_ids_string_data + "'";
                        is_from += " when " + element.subscription_id + " then " + element.is_from;
                        last_order_id_edit += " when " + element.subscription_id + " then " + _user_order_id;
                    });
                    if (update_subscription_id.length) {
                        user_id += " else user_id end";
                        site_id += " else site_id end";
                        end_date += " else end_date end";
                        start_date += " else start_date end";
                        next_payment_date += " else next_payment_date end";
                        trial_end_date += " else trial_end_date end";
                        last_order_date += " else last_order_date end";
                        total_amount += " else total_amount end";
                        subscription_number += " else subscription_number end";
                        pg_customer_id += " else pg_customer_id end";
                        is_recurring_subscription_edit += " else is_recurring_subscription end";
                        pg_card_id += " else pg_card_id end";
                        // pg_transaction_type += " else pg_transaction_type end";
                        subscription_status += " else subscription_status end";
                        coupon_code_edit += " else coupon_code end";
                        coupon_ids_edit += " else coupon_ids end";
                        is_from += " else is_from end";
                        last_order_id_edit += " else last_order_id end";
                        await dbWriter.userSubscription.update({
                            user_id: dbWriter.Sequelize.literal(user_id),
                            is_from: dbWriter.Sequelize.literal(is_from),
                            start_date: dbWriter.Sequelize.literal(start_date),
                            end_date: dbWriter.Sequelize.literal(end_date),
                            next_payment_date: dbWriter.Sequelize.literal(next_payment_date),
                            trial_end_date: dbWriter.Sequelize.literal(trial_end_date),
                            last_order_date: dbWriter.Sequelize.literal(last_order_date),
                            total_amount: dbWriter.Sequelize.literal(total_amount),
                            subscription_number: dbWriter.Sequelize.literal(subscription_number),
                            is_recurring_subscription: dbWriter.Sequelize.literal(is_recurring_subscription_edit),
                            is_renewal: dbWriter.Sequelize.literal(is_recurring_subscription_edit),
                            // pg_customer_id: dbWriter.Sequelize.literal(pg_customer_id),
                            // pg_card_id: dbWriter.Sequelize.literal(pg_card_id),
                            // pg_transaction_type: dbWriter.Sequelize.literal(pg_transaction_type),
                            subscription_status: dbWriter.Sequelize.literal(subscription_status),
                            site_id: dbWriter.Sequelize.literal(site_id),
                            coupon_code: dbWriter.Sequelize.literal(coupon_code_edit),
                            coupon_ids: dbWriter.Sequelize.literal(coupon_ids_edit),
                            last_order_id: dbWriter.Sequelize.literal(last_order_id_edit)
                        }, {
                            where: { user_subscription_id: update_subscription_id }
                        });
                    }
                }

                if (newSubscriptionItemList.length) {
                    let subItem: any = [], user_subscription_id: any = [], updated_product_name = '',
                        is_deleted = "case user_subscription_item_id ", product_name = "case user_subscription_item_id ",
                        product_amount = "case user_subscription_item_id ", shipping_fees = "case user_subscription_item_id ",
                        processing_fees = "case user_subscription_item_id ", coupon_amount = "case user_subscription_item_id ";

                    newSubscriptionItemList.forEach((element: any) => {
                        if (element.user_subscription_item_id == 0) {
                            subItem.push(element);
                        } else {
                            user_subscription_id.push(element.user_subscription_id);
                            updated_product_name = element.product_name;
                            is_deleted += " when " + element.user_subscription_item_id + " then 0";
                            product_name += " when " + element.user_subscription_item_id + " then '" + element.product_name + "'";
                            product_amount += " when " + element.user_subscription_item_id + " then " + element.product_amount + "";
                            shipping_fees += " when " + element.user_subscription_item_id + " then " + element.shipping_fees + "";
                            processing_fees += " when " + element.user_subscription_item_id + " then " + element.processing_fees + "";
                            coupon_amount += " when " + element.user_subscription_item_id + " then " + element.coupon_amount + "";
                        }
                    });

                    if (user_subscription_id.length) {
                        is_deleted += " else 1 end";
                        product_name += " else product_name end";
                        shipping_fees += " else shipping_fees end";
                        processing_fees += " else processing_fees end";
                        coupon_amount += " else coupon_amount end";

                        await dbWriter.userSubscriptionItems.update({
                            product_name: dbWriter.Sequelize.literal(product_name),
                            shipping_fees: dbWriter.Sequelize.literal(shipping_fees),
                            processing_fees: dbWriter.Sequelize.literal(processing_fees),
                            coupon_amount: dbWriter.Sequelize.literal(coupon_amount),
                            is_deleted: dbWriter.Sequelize.literal(is_deleted),
                        }, {
                            where: { user_subscription_id: user_subscription_id, is_deleted: 0 }
                        });

                        logList.push({
                            type: 2,
                            event_type_id: subscription_id,
                            message: "subscription #" + subscription_number + " products has been updated to " + updated_product_name + " by Admin (" + display_name + ")"
                        })
                        noteList.push({
                            type: 2,
                            event_type_id: subscription_id,
                            message: "subscription #" + subscription_number + " products has been updated to " + updated_product_name + " by Admin (" + display_name + ")"
                        })
                    } else {
                        await dbWriter.userSubscriptionItems.update({
                            is_deleted: 1,
                            updated_datetime: moment().format("YYYY-MM-DD HH:mm:ss")
                        }, {
                            where: { user_subscription_id: subscription_id }
                        });
                        logList.push({
                            type: 2,
                            event_type_id: subscription_id,
                            message: "subscription #" + subscription_number + " old products has been deleted."
                        })
                        noteList.push({
                            type: 2,
                            event_type_id: subscription_id,
                            message: "subscription #" + subscription_number + " old products has been deleted."
                        })
                    }
                    if (subItem.length) {
                        await dbWriter.userSubscriptionItems.bulkCreate(subItem);
                    }
                }

                if (newSubscriptionAddress.length) {
                    if (masterAddressData.length) {
                        newSubscriptionAddress.forEach((element: any) => {
                            if (masterAddressData.some((e: any) => e.address_type == element.address_type)) {
                                element.parent_user_address_id = masterAddressData.find((e: any) => e.address_type == element.address_type).user_address_id;
                            }
                        });
                    }
                    let subAddress: any = [], user_address_id: any = [], customer_shipping_note = "case user_address_id ", zipcode = "case user_address_id ", latitude = "case user_address_id", longitude = "case user_address_id", first_name = "case user_address_id ", last_name = "case user_address_id ", email_address = "case user_address_id ", phone_number = "case user_address_id ", address_type = "case user_address_id ", address_line1 = "case user_address_id ", address_line2 = "case user_address_id ", city = "case user_address_id ", state_id = "case user_address_id ", country_id = "case user_address_id ", company = "case user_address_id ", user_orders_id = "case user_address_id ", user_subscription_id = "case user_address_id ", user_id = "case user_address_id ", parent_user_address_id = "case user_address_id ";
                    newSubscriptionAddress.forEach((element: any) => {
                        if (element.user_address_id == 0) {
                            subAddress.push(element);
                        } else {
                            user_address_id.push(element.user_address_id);
                            first_name += " when " + element.user_address_id + " then '" + element.first_name + "'";
                            last_name += " when " + element.user_address_id + " then '" + element.last_name + "'";
                            email_address += " when " + element.user_address_id + " then '" + element.email_address + "'";
                            phone_number += " when " + element.user_address_id + " then '" + element.phone_number + "'";
                            address_type += " when " + element.user_address_id + " then '" + element.address_type + "'";
                            address_line1 += " when " + element.user_address_id + " then '" + element.address_line1 + "'";
                            address_line2 += " when " + element.user_address_id + " then '" + element.address_line2 + "'";
                            state_id += " when " + element.user_address_id + " then " + element.state_id + "";
                            country_id += " when " + element.user_address_id + " then " + element.country_id + "";
                            company += " when " + element.user_address_id + " then '" + element.company + "'";
                            user_orders_id += " when " + element.user_address_id + " then " + element.user_orders_id + "";
                            user_subscription_id += " when " + element.user_address_id + " then " + element.user_subscription_id + "";
                            user_id += " when " + element.user_address_id + " then " + element.user_id + "";
                            zipcode += " when " + element.user_address_id + " then '" + element.zipcode + "'";
                            latitude += " when " + element.user_address_id + " then '" + element.latitude + "'";
                            longitude += " when " + element.user_address_id + " then '" + element.longitude + "'";
                            customer_shipping_note += " when " + element.user_address_id + " then '" + element.customer_shipping_note + "'";
                            city += " when " + element.user_address_id + " then '" + element.city + "'";
                            parent_user_address_id += " when " + element.user_address_id + " then " + element.parent_user_address_id;
                        }
                    });

                    if (subAddress.length) {
                        await dbWriter.userAddress.bulkCreate(subAddress);
                    }
                    if (user_address_id.length) {
                        first_name += " else first_name end";
                        last_name += " else last_name end";
                        email_address += " else email_address end";
                        phone_number += " else phone_number end";
                        address_type += " else address_type end";
                        address_line1 += " else address_line1 end";
                        address_line2 += " else address_line2 end";
                        state_id += " else state_id end";
                        country_id += " else country_id end";
                        company += " else company end";
                        user_orders_id += " else user_orders_id end";
                        user_subscription_id += " else user_subscription_id end";
                        user_id += " else user_id end";
                        zipcode += " else zipcode end";
                        latitude += " else latitude end";
                        longitude += " else longitude end";
                        customer_shipping_note += " else customer_shipping_note end";
                        parent_user_address_id += " else parent_user_address_id end";
                        city += " else city end";

                        await dbWriter.userAddress.update({
                            first_name: dbWriter.Sequelize.literal(first_name),
                            last_name: dbWriter.Sequelize.literal(last_name),
                            email_address: dbWriter.Sequelize.literal(email_address),
                            phone_number: dbWriter.Sequelize.literal(phone_number),
                            address_type: dbWriter.Sequelize.literal(address_type),
                            address_line1: dbWriter.Sequelize.literal(address_line1),
                            address_line2: dbWriter.Sequelize.literal(address_line2),
                            state_id: dbWriter.Sequelize.literal(state_id),
                            country_id: dbWriter.Sequelize.literal(country_id),
                            company: dbWriter.Sequelize.literal(company),
                            user_orders_id: dbWriter.Sequelize.literal(user_orders_id),
                            user_subscription_id: dbWriter.Sequelize.literal(user_subscription_id),
                            user_id: dbWriter.Sequelize.literal(user_id),
                            zipcode: dbWriter.Sequelize.literal(zipcode),
                            latitude: dbWriter.Sequelize.literal(latitude),
                            longitude: dbWriter.Sequelize.literal(longitude),
                            customer_shipping_note: dbWriter.Sequelize.literal(customer_shipping_note),
                            parent_user_address_id: dbWriter.Sequelize.literal(parent_user_address_id),
                            city: dbWriter.Sequelize.literal(city)
                        }, {
                            where: { user_address_id: user_address_id }
                        });

                    }
                }

                if (is_edit == 0) {
                    // take payment and save transaction log
                    let paymentResponse: any = {
                        isPaymentSuccessful: true,
                        paymentDetails: {
                            pg_customer_id: 0,
                            pg_card_id: 0,
                            pg_transaction_type: type
                        }
                    }
                    if (total_payment_amount != 0) {
                        if (type == 2) {
                            //-------------------CHECK PAYMENT CODE(DP)-------------------------
                            let response_json = { message: "Failed with blank product" },
                                status = "failure";
                            if (newSubscriptionItemList.length) {
                                response_json = { message: "Purchase with coupon" };
                                status = "Success";
                            } else {
                                paymentResponse = {
                                    isPaymentSuccessful: false,
                                    message: "Failed with blank product",
                                };
                            }
                            let checkPaymentDetails = await dbWriter.paymentCheck.create({
                                account_holder_name: paymentCheckDetails.account_holder_name,
                                site_id: site_id,
                                user_id: user_id,
                                amount: paymentCheckDetails.amount,
                                check_number: paymentCheckDetails.check_number,
                                order_id: 0,
                                user_subscription_id: subscription_id ?? 0,
                                is_payment_confirmed: paymentCheckDetails.is_payment_confirmed,
                                created_date: moment().unix(),
                            });
                            paymentResponse.payment_check_id = checkPaymentDetails.payment_check_id
                            for (let i = 0; i < newOrderList.length; i++) {
                                let parent_id = newOrderList[i].user_orders_id;
                                let transactionDetails = await dbWriter.transactionMaster.create({
                                    site_payment_service_id: 0,
                                    site_id: site_id,
                                    user_id: user_id,
                                    response_json: JSON.stringify(response_json),
                                    request_json: JSON.stringify(req.body),
                                    status: status,
                                    stripe_customer_id: 0,
                                    stripe_card_id: checkPaymentDetails.payment_check_id,
                                    amount: paymentCheckDetails.amount,
                                    charge_id: "",
                                    created_date: moment().unix(),
                                    transaction_type: 2, //for check
                                    type: 1,
                                    parent_id: parent_id,
                                    payment_type: 1,
                                    transaction_details: 'Subscription purchased'
                                });
                                await dbWriter.userOrderItems.update({
                                    transaction_id: transactionDetails.transaction_id
                                }, {
                                    where: { user_orders_id: parent_id, transaction_id: 0 }
                                });
                                await dbWriter.userAddress.update({
                                    transaction_id: transactionDetails.transaction_id
                                }, {
                                    where: { user_orders_id: parent_id, transaction_id: 0 }
                                });
                            }
                        } else {
                            let obj = new checkoutController();
                            let payment_checkout_Detail = {
                                site_id: site_id,
                                user_id: user_id,
                                check_out_amount: Math.round(total_payment_amount * 100) ?? 0,
                                cardDetail: cardDetails,
                                orderDetailsList: newOrderList,
                                pg_customer_card_id,
                                req: req,
                                emailPayload: emailPayload,
                                transaction_details: 'Subscription purchased'
                            };
                            paymentResponse = await obj.takePaymentAndSaveCard(payment_checkout_Detail);
                        }
                    } else {
                        let response_json = { message: "Failed with blank product" },
                            status = "failure";
                        if (newSubscriptionItemList.length) {
                            response_json = { message: "Purchase with coupon" };
                            status = "Success";

                        } else {
                            paymentResponse = {
                                isPaymentSuccessful: false,
                                message: "Failed with blank product",
                            };
                        }
                        for (let i = 0; i < newOrderList.length; i++) {
                            let parent_id = newOrderList[i].user_orders_id;
                            // if (type = 1) {
                            let transactionDetails = await dbWriter.transactionMaster.create({
                                site_payment_service_id: 0,
                                site_id: site_id,
                                user_id: user_id,
                                response_json: JSON.stringify(response_json),
                                request_json: JSON.stringify(req.body),
                                status: status,
                                stripe_customer_id: 0,
                                stripe_card_id: 0,
                                amount: 0,
                                charge_id: "",
                                created_date: moment().unix(),
                                transaction_type: 1,
                                type: 1,
                                parent_id: parent_id,
                                payment_type: 1,
                                transaction_details: 'Subscription purchased'
                            });
                            await dbWriter.userOrderItems.update({
                                transaction_id: transactionDetails.transaction_id
                            }, {
                                where: { user_orders_id: parent_id, transaction_id: 0 }
                            });
                            await dbWriter.userAddress.update({
                                transaction_id: transactionDetails.transaction_id
                            }, {
                                where: { user_orders_id: parent_id, transaction_id: 0 }
                            });
                            // }
                        }
                    }
                    // payment success
                    if (paymentResponse.isPaymentSuccessful) {
                        if (newUserMembershipsList.length)
                            await dbWriter.userMemberships.bulkCreate(newUserMembershipsList);

                        let userSubscriptionData: any = { subscription_status: (type == 2 && paymentCheckDetails.is_payment_confirmed == 0) ? 9 : 2 }
                        if (newGeoData.length && userSubscriptionData.subscription_status == 2) {
                            await dbWriter.geoData.bulkCreate(newGeoData);
                        }

                        if (type == 2) {
                            if (paymentCheckDetails.is_payment_confirmed == 1) {
                                emailPayload = emailPayload.map((s: any) => {
                                    return {
                                        ...s,
                                        isCheckPayment: true
                                    }
                                })
                            } else {
                                emailPayload = emailPayload.map((s: any) => {
                                    return {
                                        ...s,
                                        templateIdentifier: ''
                                    }
                                })
                            }
                        }

                        if (total_payment_amount != 0) {
                            if (type == 2) {
                                userSubscriptionData.pg_customer_id = 0
                                userSubscriptionData.pg_card_id = paymentResponse.payment_check_id
                                userSubscriptionData.pg_transaction_type = 2
                                userSubscriptionData.is_renewal = 2
                            } else {
                                let { pg_customer_id, pg_card_id, pg_transaction_type } = paymentResponse.paymentDetails;
                                userSubscriptionData.pg_customer_id = pg_customer_id
                                userSubscriptionData.pg_card_id = pg_card_id
                                userSubscriptionData.pg_transaction_type = pg_transaction_type
                            }
                        } else {
                            let { pg_customer_id, pg_card_id, pg_transaction_type } = paymentResponse.paymentDetails;
                            userSubscriptionData.pg_customer_id = pg_customer_id
                            userSubscriptionData.pg_card_id = pg_card_id
                            userSubscriptionData.pg_transaction_type = pg_transaction_type
                        }
                        await dbWriter.userSubscription.update(userSubscriptionData, { where: { user_subscription_id: update_subscription_id } });

                        if (type == 1) {
                            //save subscription renewal log
                            await dbWriter.subscriptionRenewal.bulkCreate(subscriptionRenewalLogList);
                        }

                        // update order status to active or pending check
                        let order_status = 2
                        if (type == 2) {
                            if (paymentCheckDetails.is_payment_confirmed == 0) {
                                order_status = 9
                            }
                        }
                        await dbWriter.userOrder.update({ order_status: order_status }, { where: { user_orders_id: user_orders_id } });

                        // save user coupon
                        if (coupon_code || (coupon_ids && coupon_ids.length)) {
                            let CouponsList: any = [];
                            for (let i = 0; i < user_orders_id.length; i++) {
                                if (couponValidation && couponValidation.coupon_data && couponValidation.coupon_data.length) {
                                    couponValidation.coupon_data.forEach((s: any) => {
                                        CouponsList.push({
                                            user_id: user_id,
                                            coupon_id: s.coupon_id,
                                            user_orders_id: user_orders_id[i]
                                        });
                                    });
                                }
                            }
                            await dbWriter.sycuUserCoupon.bulkCreate(CouponsList);
                        }

                        // Circle User Add in Space
                        // Daksh
                        const paymentConfirm = (type == 1) ? true : ((type == 2 && paymentCheckDetails.is_payment_confirmed == 1) ? true : false)
                        if (site_id == EnumObject.siteEnum.get('together').value && paymentConfirm) {
                            const CircleAPIsObj = new CircleAPIs();
                            let cd = await CircleAPIsObj.userActionInSpace({
                                user_email: user_email,
                                Method: 'POST',
                                user_id: user_id
                            });
                            if (newSubscriptionList && newSubscriptionList.length) {
                                newSubscriptionList.forEach((element: any) => {
                                    if (cd.success) {
                                        logList.push({
                                            type: 2,
                                            event_type_id: element.subscription_id,
                                            message: "subscription #" + element.subscription_number + " - User added in Circle Private Space.",
                                        });
                                        noteList.push({
                                            type: 2,
                                            event_type_id: element.subscription_id,
                                            message: "Subscription #" + element.subscription_number + " - User added in Circle Private Space.",
                                        })
                                    } else {
                                        logList.push({
                                            type: 2,
                                            event_type_id: element.subscription_id,
                                            message: "subscription #" + element.subscription_number + " - " + cd.message,
                                        });
                                        noteList.push({
                                            type: 2,
                                            event_type_id: element.subscription_id,
                                            message: "Subscription #" + element.subscription_number + " - " + cd.message,
                                        })
                                    }
                                });
                            }
                        }

                        // Background Email Functionality
                        let s = 0;
                        while (emailPayload.length > s) {
                            if (emailPayload[s].templateIdentifier) {
                                await ObjectMail.ConvertData(emailPayload[s], function (data: any) { });
                            }
                            s++;
                        }

                        try {
                            //AB - 27/6/2023 group product stop renewal if cycle complete
                            let renewalOffFlag: any = false, groupProductItemId: any = [];
                            let productData = await dbReader.products.findAll({
                                attributes: ['product_id', 'product_name', 'product_duration', 'ministry_type'],
                                where: { is_deleted: 0, product_id: products.map((s: any) => s.id) }
                            });
                            if (productData.length) {
                                productData = JSON.parse(JSON.stringify(productData));
                                productData.forEach((p: any) => {
                                    if (p.ministry_type == 3) {
                                        groupProductItemId.push(p.product_id);
                                        if (p.product_duration == 365) {
                                            renewalOffFlag = true;
                                        }
                                    }
                                });
                            }
                            let otherMinistryProductFlag = (groupProductItemId.length && newOrderItemList.some((oi: any) => oi.item_type == 1 && !groupProductItemId.includes(oi.product_id))) ? true : false;
                            if (renewalOffFlag && !otherMinistryProductFlag) {
                                //update is_recurring_subscription 
                                await dbWriter.userSubscription.update({
                                    is_recurring_subscription: 0
                                }, {
                                    where: { user_subscription_id: _user_subscription_id }
                                });
                            }
                            if (otherMinistryProductFlag) {
                                let staticEmailPayload = {
                                    site: site_id,
                                    user_id: 149148,
                                    user_email: 'dakshs@differenzsystem.com',
                                    subscriptionNumber: _subscription_number,
                                    templateIdentifier: EnumObject.templateIdentifier.get('growAlert').value
                                }
                                await ObjectMail.ConvertData(staticEmailPayload, function (data: any) { });
                            }
                        } catch (e: any) {
                            console.log(e.message)
                        }
                    }
                }

                //save log
                if (logList.length)
                    await dbWriter.logs.bulkCreate(logList);
                // save notes
                if (noteList.length)
                    await dbWriter.notes.bulkCreate(noteList);

                //transfer data to shipbob
                //skip few developers orders for testing purpose
                if (is_shipping_address && user_id != 119675 && user_id != 14442 && is_edit == 0) {
                    let response = await dbReader.thirdParty.findOne({
                        attributes: ['is_active'],
                        where: {
                            thirdparty_id: 7
                        }
                    });

                    if (response.is_active == 1) {
                        if (shipbobProducts.length > 0) {
                            let getShipbobChannels = await dbReader.shipbobChannelModel.findOne({
                                attributes: ['shipbob_channel_id'],
                                where: {
                                    is_selected: 1
                                }
                            });
                            let channel_id = 0;
                            if (getShipbobChannels) {
                                getShipbobChannels = JSON.parse(JSON.stringify(getShipbobChannels));
                                channel_id = getShipbobChannels.shipbob_channel_id
                            }
                            let getShipbobMethods = await dbReader.shipbobMethodsModel.findOne({
                                attributes: ['title'],
                                where: {
                                    is_default: 1
                                }
                            });

                            let shipbob_method = "Shippment";
                            if (getShipbobMethods) {
                                getShipbobMethods = JSON.parse(JSON.stringify(getShipbobMethods));
                                shipbob_method = getShipbobMethods.title
                            }

                            createShipbobOrder.user_subscription_id = _user_subscription_id;
                            createShipbobOrder.user_order_id = _user_order_id;
                            createShipbobOrder.shipbob_channel_id = channel_id;
                            createShipbobOrder.shipping_method = shipbob_method;
                            createShipbobOrder.recipient = recipient;
                            createShipbobOrder.products = shipbobProducts;
                            createShipbobOrder.order_number = order_number;
                            createShipbobOrder.reference_id = uuidv4();
                            createShipbobOrder.is_extra_pay = products_list.some((e: any) => e.product_type == 2) ? true : false
                            let callMethod = new ShipbobController();
                            let shipbob_response = products_list.some((e: any) => e.product_type == 2) ? callMethod.addUpdateShipbobOrder(createShipbobOrder, 0, 0, 4) : callMethod.addUpdateShipbobOrder(createShipbobOrder, 0, 0, 3);
                        }
                    }
                }

                new SuccessResponse(EC.checkOutSuccess, {
                    token
                }).send(res);

                try {
                    //======================4. ActiveCampagin CODE==================//
                    let activecampaign_response = await dbReader.thirdParty.findOne({
                        attributes: ['is_active'],
                        where: { thirdparty_id: 8 }
                    });
                    activecampaign_response = JSON.parse(JSON.stringify(activecampaign_response));
                    let getUser = await dbReader.users.findOne({
                        attributes: ['activecampaign_contact_id'],
                        where: { user_id: user_id }
                    });
                    getUser = JSON.parse(JSON.stringify(getUser));
                    let updateACRenewalFlag = false;
                    let activecampaign_contact_id = getUser ? getUser.activecampaign_contact_id : 0;
                    if (activecampaign_response.is_active == 1 && activecampaign_contact_id != 0) {
                        //========================Map Product Data into AC=========================
                        if (!products_list.some((e: any) => e.product_type == 2) && is_edit == 0) {
                            updateACRenewalFlag = true
                            let productList = products.map((s: any) => s.id);
                            let addOrRemoveFlag = "add";
                            let activeCampaignData = {
                                "products": productList,
                                "contact_id": activecampaign_contact_id,
                                "user_id": user_id
                            }
                            await activeCampaign.activeCampaignMapProductsData(activeCampaignData, addOrRemoveFlag);
                        } else if (is_edit == 1 && is_save != 1) {
                            updateACRenewalFlag = true
                        }
                    }
                    if (updateACRenewalFlag == true) {
                        //==============Active Campaign Renewal Field Update=============
                        let acFieldData = {
                            "contact_id": activecampaign_contact_id,
                            "user_subscription_id": subscription_id,
                        }
                        await activeCampaign.updateActiveCampaignRenewalFields(acFieldData);
                    }
                } catch (e: any) {
                    console.log(e.message);
                }
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    /**
   * cancelSubscription
   * @param req
   * @param res
  =>  */
    public async cancelSubscription(req: Request, res: Response) {
        try {
            let { user_subscription_id, note } = req.body;
            //@ts-ignore
            let { display_name } = req;
            let logList: any = [], noteList: any = []

            /* find user_subscription_id */
            let findSubscription = await dbReader.userSubscription.findOne({
                where: { user_subscription_id: user_subscription_id },
                include: [{
                    separate: true,
                    model: dbReader.userOrder,
                    attributes: ['user_orders_id', 'user_subscription_id'],
                    order: [["user_orders_id", "DESC"]],
                    limit: 1,
                    include: [{
                        separate: true,
                        model: dbReader.userOrderItems,
                        where: { item_type: 1 },
                        include: [{
                            model: dbReader.products,
                        }]
                    }]
                }]
            })
            if (findSubscription) {
                findSubscription = JSON.parse(JSON.stringify(findSubscription));
                /* set pending cancellation status  */
                let userSubscriptionUpData: any = {
                    subscription_status: 5,
                    updated_datetime: new Date(),
                    status_updated_date: new Date()
                }
                if (note) {
                    userSubscriptionUpData.subscription_note = note || ''
                }
                await dbWriter.userSubscription.update(userSubscriptionUpData, {
                    where: { user_subscription_id: user_subscription_id }
                })
                await dbWriter.geoData.update({
                    is_deleted: 0
                }, {
                    where: { user_subscription_id: user_subscription_id }
                })
                noteList.push({
                    type: 2, //Subscription
                    event_type_id: user_subscription_id,
                    message: "Subscription #" + findSubscription.subscription_number + " has been cancelled successfully by Admin (" + display_name + ")",
                })

                let lastUserOrder = await dbReader.userOrder.findOne({
                    where: { user_subscription_id: user_subscription_id, order_status: [2, 4] },
                    attributes: ["user_orders_id", "user_order_number"],
                    order: [['user_orders_id', 'DESC']],
                    limit: 1
                })
                if (lastUserOrder) {
                    lastUserOrder = JSON.parse(JSON.stringify(lastUserOrder))
                    noteList.push({
                        type: 1, //order
                        event_type_id: lastUserOrder.user_orders_id,
                        message: "Order #" + lastUserOrder.user_order_number + " has been cancelled successfully by Admin (" + display_name + ")",
                    })

                    /* cancel all order of user  */
                    await dbWriter.userOrder.update({
                        order_status: 5,
                        updated_datetime: new Date()
                    }, {
                        where: { user_subscription_id: user_subscription_id, user_orders_id: lastUserOrder.user_orders_id }
                    });
                }

                /* cancel all membership of user  */
                await dbWriter.userMemberships.update({
                    status: 5,
                    updated_datetime: new Date()
                }, {
                    where: { user_subscription_id: user_subscription_id }
                });

                /* delete subscriptionRenewal of that user */
                await dbWriter.subscriptionRenewal.update({
                    is_deleted: 1,
                    end_date: new Date(),
                    updated_datetime: new Date(),
                    note: 'Cancel subscription call action by admin'
                }, {
                    where: {
                        user_subscription_id: user_subscription_id,
                        is_executed: 0,
                        is_deleted: 0,
                        is_instant_payment: 0
                    }
                });

                await dbWriter.subscriptionRenewalCronLog.update({
                    is_deleted: 1
                }, {
                    where: {
                        user_subscription_id: user_subscription_id,
                        is_deleted: 0,
                        is_executed: 0
                    }
                })

                // Circle User Add in Space
                // Daksh
                if (findSubscription.site_id == EnumObject.siteEnum.get('together').value) {
                    let userData = await dbReader.users.findOne({
                        where: { user_id: findSubscription.user_id }
                    })
                    if (userData) {
                        userData = JSON.parse(JSON.stringify(userData))
                        const CircleAPIsObj = new CircleAPIs();
                        let cd: any = await CircleAPIsObj.userActionInSpace({
                            user_email: userData.email,
                            Method: 'DELETE',
                            user_id: findSubscription.user_id
                        });
                        if (cd.success) {
                            logList.push({
                                type: 2,
                                event_type_id: user_subscription_id,
                                message: "subscription #" + findSubscription.subscription_number + " - User remove from Circle Private Space.",
                            });
                            noteList = [{
                                type: 2,
                                event_type_id: user_subscription_id,
                                message: "Subscription #" + findSubscription.subscription_number + " - User remove from Circle Private Space.",
                            }]
                        } else {
                            logList.push({
                                type: 2,
                                event_type_id: user_subscription_id,
                                message: "subscription #" + findSubscription.subscription_number + " - " + cd.message,
                            });
                            noteList = [{
                                type: 2,
                                event_type_id: user_subscription_id,
                                message: "Subscription #" + findSubscription.subscription_number + " - " + cd.message,
                            }]
                        }
                    }
                }

                try {
                    //---------------- Update Active Campaign Tags & List --------------//
                    let productIdArray: any = [];
                    let subscription_items = await dbReader.userSubscriptionItems.findAll({
                        attributes: ["product_id"],
                        where: { user_subscription_id: user_subscription_id, is_deleted: 0, product_id: { [dbReader.Sequelize.Op.ne]: 0 } }
                    });
                    subscription_items = JSON.parse(JSON.stringify(subscription_items));
                    subscription_items.forEach((e: any) => { productIdArray.push(e.product_id) });
                    let user_data = await dbReader.users.findOne({
                        attributes: ["email", "activecampaign_contact_id"],
                        where: { user_id: findSubscription.user_id, is_deleted: 0 }
                    });
                    user_data = JSON.parse(JSON.stringify(user_data));
                    let contact_id = user_data ? user_data.activecampaign_contact_id : 0;
                    if (contact_id) {
                        const addOrRemoveFlag = "remove";
                        const activeCampaignData = {
                            'products': productIdArray,
                            'contact_id': contact_id,
                            'user_id': findSubscription.user_id,
                        }
                        const fieldData = {
                            contact_id: contact_id,
                            user_subscription_id: user_subscription_id
                        }
                        let kids_flag: any = false, students_flag: any = false, group_flag: any = false, hub_flag: any = false,
                            slides_flag: any = false, people_flag: any = false, together_flag: any = false, builder_flag: any = false,
                            creative_board_flag: any = false, removeTagsData: any = [], removeTagLogs: any = [], tagsData: any = [], addTagLogs: any = [];

                        findSubscription.user_orders[findSubscription.user_orders.length - 1]?.user_order_items.forEach((e: any) => {
                            if (e.sycu_product && e.sycu_product.ministry_type == 1 && e.sycu_product.site_id == EnumObject.siteEnum.get("curriculum").value) {
                                kids_flag = true;
                            }
                            if (e.sycu_product && e.sycu_product.ministry_type == 2 && e.sycu_product.site_id == EnumObject.siteEnum.get("curriculum").value) {
                                students_flag = true;
                            }
                            if (e.sycu_product && e.sycu_product.ministry_type == 3 && e.sycu_product.site_id == EnumObject.siteEnum.get("curriculum").value) {
                                group_flag = true;
                            }
                            if (e.sycu_product && e.sycu_product.site_id == EnumObject.siteEnum.get("hub").value) {
                                hub_flag = true;
                            }
                            if (e.sycu_product && e.sycu_product.site_id == EnumObject.siteEnum.get("slider").value) {
                                slides_flag = true;
                            }
                            if (e.sycu_product && e.sycu_product.site_id == EnumObject.siteEnum.get("people").value) {
                                people_flag = true;
                            }
                            if (e.sycu_product && e.sycu_product.site_id == EnumObject.siteEnum.get("together").value) {
                                together_flag = true;
                            }
                            if (e.sycu_product && e.sycu_product.site_id == EnumObject.siteEnum.get("builder").value) {
                                builder_flag = true;
                            }
                            if (e.sycu_product && e.sycu_product.site_id == EnumObject.siteEnum.get("board").value) {
                                creative_board_flag = true;
                            }
                        });

                        if (kids_flag) {
                            removeTagsData.push({
                                contact: contact_id,
                                tag: EnumObject.activecampaignTags.get("pending-cancellation-kids").value,
                            }, {
                                contact: contact_id,
                                tag: EnumObject.activecampaignTags.get("active-customer-grow-kids").value,
                            })
                            removeTagLogs.push({
                                type: 4,//AC 
                                event_type_id: findSubscription.user_id,
                                message: `'${EnumObject.activecampaignTagsTitle.get("pending-cancellation-kids").value}' tag removed from contact in active campaign`,
                            }, {
                                type: 4,//AC 
                                event_type_id: findSubscription.user_id,
                                message: `'${EnumObject.activecampaignTagsTitle.get("active-customer-grow-kids").value}' tag removed from contact in active campaign`,
                            })
                            tagsData.push({
                                contact: contact_id,
                                tag: EnumObject.activecampaignTags.get("inactive-customer-kids").value,
                            });
                            addTagLogs.push({
                                type: 4,//AC
                                event_type_id: findSubscription.user_id,
                                message: `'${EnumObject.activecampaignTagsTitle.get("inactive-customer-kids").value}' tag added to contact in active campaign`,
                            });
                        }
                        if (students_flag) {
                            removeTagsData.push({
                                contact: contact_id,
                                tag: EnumObject.activecampaignTags.get("pending-cancellation-students").value,
                            }, {
                                contact: contact_id,
                                tag: EnumObject.activecampaignTags.get("active-customer-grow-students").value,
                            })
                            removeTagLogs.push({
                                type: 4,//AC 
                                event_type_id: findSubscription.user_id,
                                message: `'${EnumObject.activecampaignTagsTitle.get("pending-cancellation-students").value}' tag removed from contact in active campaign`,
                            }, {
                                type: 4,//AC 
                                event_type_id: findSubscription.user_id,
                                message: `'${EnumObject.activecampaignTagsTitle.get("active-customer-grow-students").value}' tag removed from contact in active campaign`,
                            })
                            tagsData.push({
                                contact: contact_id,
                                tag: EnumObject.activecampaignTags.get("inactive-customer-students").value,
                            });
                            addTagLogs.push({
                                type: 4,//AC
                                event_type_id: findSubscription.user_id,
                                message: `'${EnumObject.activecampaignTagsTitle.get("inactive-customer-students").value}' tag added to contact in active campaign`,
                            });
                        }
                        if (group_flag) {
                            removeTagsData.push({
                                contact: contact_id,
                                tag: EnumObject.activecampaignTags.get("pending-cancellation-groups").value,
                            }, {
                                contact: contact_id,
                                tag: EnumObject.activecampaignTags.get("active-customer-grow-groups").value,
                            })
                            removeTagLogs.push({
                                type: 4,//AC 
                                event_type_id: findSubscription.user_id,
                                message: `'${EnumObject.activecampaignTagsTitle.get("pending-cancellation-groups").value}' tag removed from contact in active campaign`,
                            }, {
                                type: 4,//AC 
                                event_type_id: findSubscription.user_id,
                                message: `'${EnumObject.activecampaignTagsTitle.get("active-customer-grow-groups").value}' tag removed from contact in active campaign`,
                            })
                            tagsData.push({
                                contact: contact_id,
                                tag: EnumObject.activecampaignTags.get("inactive-customer-groups").value,
                            });
                            addTagLogs.push({
                                type: 4,//AC
                                event_type_id: findSubscription.user_id,
                                message: `'${EnumObject.activecampaignTagsTitle.get("inactive-customer-groups").value}' tag added to contact in active campaign`,
                            });
                        }
                        if (hub_flag) {
                            removeTagsData.push({
                                contact: contact_id,
                                tag: EnumObject.activecampaignTags.get("pending-cancellation-hubs").value,
                            }, {
                                contact: contact_id,
                                tag: EnumObject.activecampaignTags.get("active-customer-grow-hubs").value,
                            })
                            removeTagLogs.push({
                                type: 4,//AC 
                                event_type_id: findSubscription.user_id,
                                message: `'${EnumObject.activecampaignTagsTitle.get("pending-cancellation-hubs").value}' tag removed from contact in active campaign`,
                            }, {
                                type: 4,//AC 
                                event_type_id: findSubscription.user_id,
                                message: `'${EnumObject.activecampaignTagsTitle.get("active-customer-grow-hubs").value}' tag removed from contact in active campaign`,
                            })
                            tagsData.push({
                                contact: contact_id,
                                tag: EnumObject.activecampaignTags.get("inactive-customer-hubs").value,
                            });
                            addTagLogs.push({
                                type: 4,//AC
                                event_type_id: findSubscription.user_id,
                                message: `'${EnumObject.activecampaignTagsTitle.get("inactive-customer-hubs").value}' tag added to contact in active campaign`,
                            });
                        }
                        if (slides_flag) {
                            removeTagsData.push({
                                contact: contact_id,
                                tag: EnumObject.activecampaignTags.get("pending-cancellation-slides").value,
                            }, {
                                contact: contact_id,
                                tag: EnumObject.activecampaignTags.get("active-customer-grow-slides").value,
                            })
                            removeTagLogs.push({
                                type: 4,//AC 
                                event_type_id: findSubscription.user_id,
                                message: `'${EnumObject.activecampaignTagsTitle.get("pending-cancellation-slides").value}' tag removed from contact in active campaign`,
                            }, {
                                type: 4,//AC 
                                event_type_id: findSubscription.user_id,
                                message: `'${EnumObject.activecampaignTagsTitle.get("active-customer-grow-slides").value}' tag removed from contact in active campaign`,
                            })
                            tagsData.push({
                                contact: contact_id,
                                tag: EnumObject.activecampaignTags.get("inactive-customer-slides").value,
                            });
                            addTagLogs.push({
                                type: 4,//AC
                                event_type_id: findSubscription.user_id,
                                message: `'${EnumObject.activecampaignTagsTitle.get("inactive-customer-slides").value}' tag added to contact in active campaign`,
                            });
                        }
                        if (people_flag) {
                            removeTagsData.push({
                                contact: contact_id,
                                tag: EnumObject.activecampaignTags.get("pending-cancellation-people").value,
                            }, {
                                contact: contact_id,
                                tag: EnumObject.activecampaignTags.get("active-customer-grow-people").value,
                            })
                            removeTagLogs.push({
                                type: 4,//AC 
                                event_type_id: findSubscription.user_id,
                                message: `'${EnumObject.activecampaignTagsTitle.get("pending-cancellation-people").value}' tag removed from contact in active campaign`,
                            }, {
                                type: 4,//AC 
                                event_type_id: findSubscription.user_id,
                                message: `'${EnumObject.activecampaignTagsTitle.get("active-customer-grow-people").value}' tag removed from contact in active campaign`,
                            })
                            tagsData.push({
                                contact: contact_id,
                                tag: EnumObject.activecampaignTags.get("inactive-customer-people").value,
                            });
                            addTagLogs.push({
                                type: 4,//AC
                                event_type_id: findSubscription.user_id,
                                message: `'${EnumObject.activecampaignTagsTitle.get("inactive-customer-people").value}' tag added to contact in active campaign`,
                            });
                        }
                        if (together_flag) {
                            removeTagsData.push({
                                contact: contact_id,
                                tag: EnumObject.activecampaignTags.get("pending-cancellation-grow-together").value,
                            }, {
                                contact: contact_id,
                                tag: EnumObject.activecampaignTags.get("active-customer-grow-together").value,
                            })
                            removeTagLogs.push({
                                type: 4,//AC 
                                event_type_id: findSubscription.user_id,
                                message: `'${EnumObject.activecampaignTagsTitle.get("pending-cancellation-grow-together").value}' tag removed from contact in active campaign`,
                            }, {
                                type: 4,//AC 
                                event_type_id: findSubscription.user_id,
                                message: `'${EnumObject.activecampaignTagsTitle.get("active-customer-grow-together").value}' tag removed from contact in active campaign`,
                            })
                            tagsData.push({
                                contact: contact_id,
                                tag: EnumObject.activecampaignTags.get("inactive-customer-grow-together").value,
                            });
                            addTagLogs.push({
                                type: 4,//AC
                                event_type_id: findSubscription.user_id,
                                message: `'${EnumObject.activecampaignTagsTitle.get("inactive-customer-grow-together").value}' tag added to contact in active campaign`,
                            });
                        }
                        if (builder_flag) {
                            removeTagsData.push({
                                contact: contact_id,
                                tag: EnumObject.activecampaignTags.get("pending-cancellation-lesson-builder").value,
                            }, {
                                contact: contact_id,
                                tag: EnumObject.activecampaignTags.get("active-customer-grow-lesson-builder").value,
                            })
                            removeTagLogs.push({
                                type: 4,//AC 
                                event_type_id: findSubscription.user_id,
                                message: `'${EnumObject.activecampaignTagsTitle.get("pending-cancellation-lesson-builder").value}' tag removed from contact in active campaign`,
                            }, {
                                type: 4,//AC 
                                event_type_id: findSubscription.user_id,
                                message: `'${EnumObject.activecampaignTagsTitle.get("active-customer-grow-lesson-builder").value}' tag removed from contact in active campaign`,
                            })
                            tagsData.push({
                                contact: contact_id,
                                tag: EnumObject.activecampaignTags.get("inactive-customer-lesson-builder").value,
                            });
                            addTagLogs.push({
                                type: 4,//AC
                                event_type_id: findSubscription.user_id,
                                message: `'${EnumObject.activecampaignTagsTitle.get("inactive-customer-lesson-builder").value}' tag added to contact in active campaign`,
                            });
                        }
                        if (creative_board_flag) {
                            removeTagsData.push({
                                contact: contact_id,
                                tag: EnumObject.activecampaignTags.get("pending-cancellation-creative-board").value,
                            }, {
                                contact: contact_id,
                                tag: EnumObject.activecampaignTags.get("active-customer-grow-creative-board").value,
                            })
                            removeTagLogs.push({
                                type: 4,//AC 
                                event_type_id: findSubscription.user_id,
                                message: `'${EnumObject.activecampaignTagsTitle.get("pending-cancellation-creative-board").value}' tag removed from contact in active campaign`,
                            }, {
                                type: 4,//AC 
                                event_type_id: findSubscription.user_id,
                                message: `'${EnumObject.activecampaignTagsTitle.get("active-customer-grow-creative-board").value}' tag removed from contact in active campaign`,
                            })
                            tagsData.push({
                                contact: contact_id,
                                tag: EnumObject.activecampaignTags.get("inactive-customer-creative-board").value,
                            });
                            addTagLogs.push({
                                type: 4,//AC
                                event_type_id: findSubscription.user_id,
                                message: `'${EnumObject.activecampaignTagsTitle.get("inactive-customer-creative-board").value}' tag added to contact in active campaign`,
                            });
                        }

                        if (findSubscription.subscription_note) {
                            if (findSubscription.cancel_reason_type == 1 || findSubscription.subscription_note == "Budget") {
                                tagsData.push({
                                    contact: contact_id,
                                    tag: EnumObject.activecampaignTags.get("cancelled-curriculum-budget").value,
                                });
                                addTagLogs.push({
                                    type: 4,//AC
                                    event_type_id: findSubscription.user_id,
                                    message: `'${EnumObject.activecampaignTagsTitle.get("cancelled-curriculum-budget").value}' tag added to contact in active campaign`,
                                });
                            } else if (findSubscription.cancel_reason_type == 2 || findSubscription.subscription_note == "Dissatisfied with Resources") {
                                tagsData.push({
                                    contact: contact_id,
                                    tag: EnumObject.activecampaignTags.get("cancelled-curriculum-dissatisfied").value,
                                });
                                addTagLogs.push({
                                    type: 4,//AC
                                    event_type_id: findSubscription.user_id,
                                    message: `'${EnumObject.activecampaignTagsTitle.get("cancelled-curriculum-dissatisfied").value}' tag added to contact in active campaign`,
                                });
                            } else if (findSubscription.cancel_reason_type == 3 || findSubscription.subscription_note == "No Longer Serving in Role") {
                                tagsData.push({
                                    contact: contact_id,
                                    tag: EnumObject.activecampaignTags.get("cancelled-curriculum-role").value,
                                });
                                addTagLogs.push({
                                    type: 4,//AC
                                    event_type_id: findSubscription.user_id,
                                    message: `'${EnumObject.activecampaignTagsTitle.get("cancelled-curriculum-role").value}' tag added to contact in active campaign`,
                                });
                            } else if (findSubscription.cancel_reason_type == 5 || findSubscription.subscription_note == "Switch to a different curriculum") {
                                tagsData.push({
                                    contact: contact_id,
                                    tag: EnumObject.activecampaignTags.get("cancelled-curriculum-switch").value,
                                });
                                addTagLogs.push({
                                    type: 4,//AC
                                    event_type_id: findSubscription.user_id,
                                    message: `'${EnumObject.activecampaignTagsTitle.get("cancelled-curriculum-switch").value}' tag added to contact in active campaign`,
                                });
                            } else {
                                tagsData.push({
                                    contact: contact_id,
                                    tag: EnumObject.activecampaignTags.get("cancelled-curriculum-other").value,
                                });
                                addTagLogs.push({
                                    type: 4,//AC
                                    event_type_id: findSubscription.user_id,
                                    message: `'${EnumObject.activecampaignTagsTitle.get("cancelled-curriculum-other").value}' tag added to contact in active campaign`,
                                });
                            }
                        } else {
                            tagsData.push({
                                contact: contact_id,
                                tag: EnumObject.activecampaignTags.get("cancelled-curriculum-other").value,
                            });
                            addTagLogs.push({
                                type: 4,//AC
                                event_type_id: findSubscription.user_id,
                                message: `'${EnumObject.activecampaignTagsTitle.get("cancelled-curriculum-other").value}' tag added to contact in active campaign`,
                            });
                        }

                        await activeCampaign.activeCampaignMapProductsData(activeCampaignData, addOrRemoveFlag);
                        await activeCampaign.updateActiveCancelationFields(activeCampaignData);
                        if (removeTagsData.length) {
                            await activeCampaign.removeContactActiveCampaignTag(removeTagsData, false, removeTagLogs);
                        }
                        await activeCampaign.removeActiveCampaignRenewalFields(fieldData);
                        if (tagsData.length) {
                            await activeCampaign.addContactActiveCampaignTag(tagsData, addTagLogs);
                        }
                    }
                } catch (e: any) {
                    console.log("Error in ActiveCampaign API call")
                }

                //save log
                if (logList.length) {
                    await dbWriter.logs.bulkCreate(logList);
                }

                // save notes
                if (noteList.length) {
                    await dbWriter.notes.bulkCreate(noteList);
                }

                new SuccessResponse(EC.approveCancelSubscriptionSuccess, {
                    //@ts-ignore
                    token: req.token
                }).send(res);
            } else {
                /* throw error if user_subscription_id not found in db */
                ApiError.handle(new BadRequestError(EC.noDataFound), res);
            }
        } catch (error: any) {
            ApiError.handle(new BadRequestError(error.message), res);
        }
    }

    /**
       * reactiveSubscription
       * @param req
       * @param res
    */
    public async reactiveSubscription(req: Request, res: Response) {
        try {
            let { user_subscription_id } = req.body;

            /* find user_subscription_id */
            let findSubscription = await dbReader.userSubscription.findOne({
                where: { user_subscription_id: user_subscription_id },
                include: [{
                    separate: true,
                    model: dbReader.userOrder,
                    attributes: ['user_orders_id', 'user_subscription_id'],
                    order: [["user_orders_id", "DESC"]],
                    limit: 1,
                    include: [{
                        separate: true,
                        model: dbReader.userOrderItems,
                        where: { item_type: 1, is_deleted: 0 },
                        include: [{
                            model: dbReader.products,
                        }]
                    }]
                }]
            })
            if (findSubscription) {
                findSubscription = JSON.parse(JSON.stringify(findSubscription));
                /* set pending cancellation status  */
                await dbWriter.userSubscription.update({
                    subscription_status: 2,
                    updated_datetime: new Date()
                }, {
                    where: { user_subscription_id: user_subscription_id }
                })

                let lastUserOrder = await dbReader.userOrder.findOne({
                    where: {
                        user_subscription_id: user_subscription_id,
                        order_status: [4, 5]
                    },
                    attributes: ["user_orders_id"],
                    order: [['user_orders_id', 'DESC']],
                    limit: 1
                })
                if (lastUserOrder) {
                    lastUserOrder = JSON.parse(JSON.stringify(lastUserOrder))

                    /* cancel all order of user  */
                    await dbWriter.userOrder.update({
                        order_status: 2,
                        updated_datetime: new Date()
                    }, {
                        where: { user_subscription_id: user_subscription_id, user_orders_id: lastUserOrder.user_orders_id }
                    });

                    /* cancel all membership of user  */
                    await dbWriter.userMemberships.update({
                        is_deleted: 0,
                        updated_datetime: new Date()
                    }, {
                        where: { user_subscription_id: user_subscription_id, user_orders_id: lastUserOrder.user_orders_id }
                    });
                }

                try {
                    let apiLogData = {
                        user_id: findSubscription.user_id,
                        user_subscription_id: user_subscription_id,
                        subscription_status: 2
                    }
                    await dbWriter.apiLogs.create({
                        api_url: "/reactiveSubscription",
                        method: "POST",
                        request: JSON.stringify(req.body),
                        response: JSON.stringify(apiLogData),
                        header: JSON.stringify(req.headers)
                    })
                } catch (error) {

                }

                let logList = [{
                    type: 2,
                    event_type_id: user_subscription_id,
                    message: "subscription #" + findSubscription.subscription_number + " is reactivated.",
                }]
                let noteList = [{
                    type: 2,
                    event_type_id: user_subscription_id,
                    message: "subscription #" + findSubscription.subscription_number + " is reactivated.",
                }]
                if (logList.length) {
                    await dbWriter.logs.bulkCreate(logList);
                }
                if (noteList.length) {
                    await dbWriter.notes.bulkCreate(noteList);
                }

                //---------------- Update Active Campaign Tags & List --------------//
                let productIdArray: any = [], removeTagsData: any = [], removeTagLogs: any = [], slides_flag: any = false,
                    kids_flag: any = false, students_flag: any = false, group_flag: any = false, hub_flag: any = false,
                    people_flag: any = false, together_flag: any = false, builder_flag: any = false, creative_board_flag: any = false;

                let subscription_items = await dbReader.userSubscriptionItems.findAll({
                    where: { user_subscription_id: user_subscription_id, is_deleted: 0, item_type: 1 },
                    attributes: ["product_id"],
                });
                subscription_items = JSON.parse(JSON.stringify(subscription_items));
                subscription_items.forEach((e: any) => {
                    if (e.product_id != 0) productIdArray.push(e.product_id)
                });

                let user_data = await dbReader.users.findOne({
                    attributes: ["email", "activecampaign_contact_id"],
                    where: { user_id: findSubscription.user_id, is_deleted: 0 }
                });
                user_data = JSON.parse(JSON.stringify(user_data));
                let contact_id = user_data ? user_data.activecampaign_contact_id : 0;

                const addOrRemoveFlag = "add";
                const activeCampaignData = {
                    'products': productIdArray,
                    'contact_id': contact_id,
                    'user_id': findSubscription.user_id,
                }
                await activeCampaign.activeCampaignMapProductsData(activeCampaignData, addOrRemoveFlag);

                //remove cancel tags
                findSubscription.user_orders[findSubscription.user_orders.length - 1]?.user_order_items.forEach((e: any) => {
                    if (e.sycu_product && e.sycu_product.ministry_type == 1 && e.sycu_product.site_id == EnumObject.siteEnum.get("curriculum").value) {
                        kids_flag = true;
                    }
                    if (e.sycu_product && e.sycu_product.ministry_type == 2 && e.sycu_product.site_id == EnumObject.siteEnum.get("curriculum").value) {
                        students_flag = true;
                    }
                    if (e.sycu_product && e.sycu_product.ministry_type == 3 && e.sycu_product.site_id == EnumObject.siteEnum.get("curriculum").value) {
                        group_flag = true;
                    }
                    if (e.sycu_product && e.sycu_product.site_id == EnumObject.siteEnum.get("hub").value) {
                        hub_flag = true;
                    }
                    if (e.sycu_product && e.sycu_product.site_id == EnumObject.siteEnum.get("slider").value) {
                        slides_flag = true;
                    }
                    if (e.sycu_product && e.sycu_product.site_id == EnumObject.siteEnum.get("people").value) {
                        people_flag = true;
                    }
                    if (e.sycu_product && e.sycu_product.site_id == EnumObject.siteEnum.get("together").value) {
                        together_flag = true;
                    }
                    if (e.sycu_product && e.sycu_product.site_id == EnumObject.siteEnum.get("builder").value) {
                        builder_flag = true;
                    }
                    if (e.sycu_product && e.sycu_product.site_id == EnumObject.siteEnum.get("board").value) {
                        creative_board_flag = true;
                    }
                });

                if (kids_flag) {
                    removeTagsData.push({
                        contact: contact_id,
                        tag: EnumObject.activecampaignTags.get("pending-cancellation-kids").value,
                    }, {
                        contact: contact_id,
                        tag: EnumObject.activecampaignTags.get("inactive-customer-kids").value,
                    })
                    removeTagLogs.push({
                        type: 4,//AC 
                        event_type_id: findSubscription.user_id,
                        message: `'${EnumObject.activecampaignTagsTitle.get("pending-cancellation-kids").value}' tag removed from contact in active campaign`,
                    }, {
                        type: 4,//AC 
                        event_type_id: findSubscription.user_id,
                        message: `'${EnumObject.activecampaignTagsTitle.get("inactive-customer-kids").value}' tag removed from contact in active campaign`,
                    })
                }
                if (students_flag) {
                    removeTagsData.push({
                        contact: contact_id,
                        tag: EnumObject.activecampaignTags.get("pending-cancellation-students").value,
                    }, {
                        contact: contact_id,
                        tag: EnumObject.activecampaignTags.get("inactive-customer-students").value,
                    })
                    removeTagLogs.push({
                        type: 4,//AC 
                        event_type_id: findSubscription.user_id,
                        message: `'${EnumObject.activecampaignTagsTitle.get("pending-cancellation-students").value}' tag removed from contact in active campaign`,
                    }, {
                        type: 4,//AC 
                        event_type_id: findSubscription.user_id,
                        message: `'${EnumObject.activecampaignTagsTitle.get("inactive-customer-students").value}' tag removed from contact in active campaign`,
                    })
                }
                if (group_flag) {
                    removeTagsData.push({
                        contact: contact_id,
                        tag: EnumObject.activecampaignTags.get("pending-cancellation-groups").value,
                    }, {
                        contact: contact_id,
                        tag: EnumObject.activecampaignTags.get("inactive-customer-groups").value,
                    })
                    removeTagLogs.push({
                        type: 4,//AC 
                        event_type_id: findSubscription.user_id,
                        message: `'${EnumObject.activecampaignTagsTitle.get("pending-cancellation-groups").value}' tag removed from contact in active campaign`,
                    }, {
                        type: 4,//AC 
                        event_type_id: findSubscription.user_id,
                        message: `'${EnumObject.activecampaignTagsTitle.get("inactive-customer-groups").value}' tag removed from contact in active campaign`,
                    })
                }
                if (hub_flag) {
                    removeTagsData.push({
                        contact: contact_id,
                        tag: EnumObject.activecampaignTags.get("pending-cancellation-hubs").value,
                    }, {
                        contact: contact_id,
                        tag: EnumObject.activecampaignTags.get("inactive-customer-hubs").value,
                    })
                    removeTagLogs.push({
                        type: 4,//AC 
                        event_type_id: findSubscription.user_id,
                        message: `'${EnumObject.activecampaignTagsTitle.get("pending-cancellation-hubs").value}' tag removed from contact in active campaign`,
                    }, {
                        type: 4,//AC 
                        event_type_id: findSubscription.user_id,
                        message: `'${EnumObject.activecampaignTagsTitle.get("inactive-customer-hubs").value}' tag removed from contact in active campaign`,
                    })
                }
                if (slides_flag) {
                    removeTagsData.push({
                        contact: contact_id,
                        tag: EnumObject.activecampaignTags.get("pending-cancellation-slides").value,
                    }, {
                        contact: contact_id,
                        tag: EnumObject.activecampaignTags.get("inactive-customer-slides").value,
                    })
                    removeTagLogs.push({
                        type: 4,//AC 
                        event_type_id: findSubscription.user_id,
                        message: `'${EnumObject.activecampaignTagsTitle.get("pending-cancellation-slides").value}' tag removed from contact in active campaign`,
                    }, {
                        type: 4,//AC 
                        event_type_id: findSubscription.user_id,
                        message: `'${EnumObject.activecampaignTagsTitle.get("inactive-customer-slides").value}' tag removed from contact in active campaign`,
                    })
                }
                if (people_flag) {
                    removeTagsData.push({
                        contact: contact_id,
                        tag: EnumObject.activecampaignTags.get("pending-cancellation-people").value,
                    }, {
                        contact: contact_id,
                        tag: EnumObject.activecampaignTags.get("inactive-customer-people").value,
                    })
                    removeTagLogs.push({
                        type: 4,//AC 
                        event_type_id: findSubscription.user_id,
                        message: `'${EnumObject.activecampaignTagsTitle.get("pending-cancellation-people").value}' tag removed from contact in active campaign`,
                    }, {
                        type: 4,//AC 
                        event_type_id: findSubscription.user_id,
                        message: `'${EnumObject.activecampaignTagsTitle.get("inactive-customer-people").value}' tag removed from contact in active campaign`,
                    })
                }
                if (together_flag) {
                    removeTagsData.push({
                        contact: contact_id,
                        tag: EnumObject.activecampaignTags.get("pending-cancellation-grow-together").value,
                    }, {
                        contact: contact_id,
                        tag: EnumObject.activecampaignTags.get("inactive-customer-grow-together").value,
                    })
                    removeTagLogs.push({
                        type: 4,//AC 
                        event_type_id: findSubscription.user_id,
                        message: `'${EnumObject.activecampaignTagsTitle.get("pending-cancellation-grow-together").value}' tag removed from contact in active campaign`,
                    }, {
                        type: 4,//AC 
                        event_type_id: findSubscription.user_id,
                        message: `'${EnumObject.activecampaignTagsTitle.get("inactive-customer-grow-together").value}' tag removed from contact in active campaign`,
                    })
                }
                if (builder_flag) {
                    removeTagsData.push({
                        contact: contact_id,
                        tag: EnumObject.activecampaignTags.get("pending-cancellation-lesson-builder").value,
                    }, {
                        contact: contact_id,
                        tag: EnumObject.activecampaignTags.get("inactive-customer-lesson-builder").value,
                    })
                    removeTagLogs.push({
                        type: 4,//AC 
                        event_type_id: findSubscription.user_id,
                        message: `'${EnumObject.activecampaignTagsTitle.get("pending-cancellation-lesson-builder").value}' tag removed from contact in active campaign`,
                    }, {
                        type: 4,//AC 
                        event_type_id: findSubscription.user_id,
                        message: `'${EnumObject.activecampaignTagsTitle.get("inactive-customer-lesson-builder").value}' tag removed from contact in active campaign`,
                    })
                }
                if (creative_board_flag) {
                    removeTagsData.push({
                        contact: contact_id,
                        tag: EnumObject.activecampaignTags.get("pending-cancellation-creative-board").value,
                    }, {
                        contact: contact_id,
                        tag: EnumObject.activecampaignTags.get("inactive-customer-creative-board").value,
                    })
                    removeTagLogs.push({
                        type: 4,//AC 
                        event_type_id: findSubscription.user_id,
                        message: `'${EnumObject.activecampaignTagsTitle.get("pending-cancellation-creative-board").value}' tag removed from contact in active campaign`,
                    }, {
                        type: 4,//AC 
                        event_type_id: findSubscription.user_id,
                        message: `'${EnumObject.activecampaignTagsTitle.get("inactive-customer-creative-board").value}' tag removed from contact in active campaign`,
                    })
                }

                if (findSubscription.subscription_note) {
                    if (findSubscription.cancel_reason_type == 1 || findSubscription.subscription_note == "Budget") {
                        removeTagsData.push({
                            contact: contact_id,
                            tag: EnumObject.activecampaignTags.get("cancelled-curriculum-budget").value,
                        });
                        removeTagLogs.push({
                            type: 4,//AC
                            event_type_id: findSubscription.user_id,
                            message: `'${EnumObject.activecampaignTagsTitle.get("cancelled-curriculum-budget").value}' tag removed from contact in active campaign`,
                        });
                    } else if (findSubscription.cancel_reason_type == 2 || findSubscription.subscription_note == "Dissatisfied with Resources") {
                        removeTagsData.push({
                            contact: contact_id,
                            tag: EnumObject.activecampaignTags.get("cancelled-curriculum-dissatisfied").value,
                        });
                        removeTagLogs.push({
                            type: 4,//AC
                            event_type_id: findSubscription.user_id,
                            message: `'${EnumObject.activecampaignTagsTitle.get("cancelled-curriculum-dissatisfied").value}' tag removed from contact in active campaign`,
                        });
                    } else if (findSubscription.cancel_reason_type == 3 || findSubscription.subscription_note == "No Longer Serving in Role") {
                        removeTagsData.push({
                            contact: contact_id,
                            tag: EnumObject.activecampaignTags.get("cancelled-curriculum-role").value,
                        });
                        removeTagLogs.push({
                            type: 4,//AC
                            event_type_id: findSubscription.user_id,
                            message: `'${EnumObject.activecampaignTagsTitle.get("cancelled-curriculum-role").value}' tag removed from contact in active campaign`,
                        });
                    } else if (findSubscription.cancel_reason_type == 5 || findSubscription.subscription_note == "Switch to a different curriculum") {
                        removeTagsData.push({
                            contact: contact_id,
                            tag: EnumObject.activecampaignTags.get("cancelled-curriculum-switch").value,
                        });
                        removeTagLogs.push({
                            type: 4,//AC
                            event_type_id: findSubscription.user_id,
                            message: `'${EnumObject.activecampaignTagsTitle.get("cancelled-curriculum-switch").value}' tag removed from contact in active campaign`,
                        });
                    } else {
                        removeTagsData.push({
                            contact: contact_id,
                            tag: EnumObject.activecampaignTags.get("cancelled-curriculum-other").value,
                        });
                        removeTagLogs.push({
                            type: 4,//AC
                            event_type_id: findSubscription.user_id,
                            message: `'${EnumObject.activecampaignTagsTitle.get("cancelled-curriculum-other").value}' tag removed from contact in active campaign`,
                        });
                    }
                } else {
                    removeTagsData.push({
                        contact: contact_id,
                        tag: EnumObject.activecampaignTags.get("cancelled-curriculum-other").value,
                    });
                    removeTagLogs.push({
                        type: 4,//AC
                        event_type_id: findSubscription.user_id,
                        message: `'${EnumObject.activecampaignTagsTitle.get("cancelled-curriculum-other").value}' tag removed from contact in active campaign`,
                    });
                }
                if (removeTagsData.length) {
                    await activeCampaign.removeContactActiveCampaignTag(removeTagsData, false, removeTagLogs);
                }

                new SuccessResponse(EC.updatedDataSuccess, {
                    //@ts-ignore
                    token: req.token
                }).send(res);
            } else {
                /* throw error if user_subscription_id not found in db */
                ApiError.handle(new BadRequestError(EC.noDataFound), res);
            }
        } catch (error: any) {
            ApiError.handle(new BadRequestError(error.message), res);
        }
    }

    /**
      * reactiveSubscription
      * @param req
      * @param res
   */
    public refundTransaction = async (req: Request, res: Response) => {
        try {
            let { transaction_id, amount, site_id, user_id, refund_type = 1, scholarship_code = '', coupon_id = 0 } = req.body;
            site_id = 2;
            //@ts-ignore
            let { display_name } = req
            let transactionMaster = await dbReader.transactionMaster.findOne({
                where: { status: "Success", transaction_id: transaction_id },
                include: [{
                    required: true,
                    model: dbReader.userOrder,
                    attributes: ['user_subscription_id', 'user_order_number', 'created_datetime', 'user_orders_id', 'total_amount', 'sub_amount'],
                    include: [{
                        required: true,
                        model: dbReader.userSubscription,
                        attributes: ['subscription_number'],
                    }, {
                        separate: true,
                        model: dbReader.userOrderItems,
                        order: ['item_type']
                    }]
                }, {
                    required: true,
                    model: dbReader.users,
                    attributes: ['first_name', 'email']
                }]
            });
            if (transactionMaster) {
                transactionMaster = JSON.parse(JSON.stringify(transactionMaster));
                let refundedData = await dbReader.refunds.findAll({
                    where: {
                        status: "Success",
                        transaction_id: transaction_id,
                        order_id: transactionMaster.parent_id
                    }
                });
                refundedData = JSON.parse(JSON.stringify(refundedData));
                let refundedAmt = 0;
                refundedData.forEach((element: any) => {
                    refundedAmt += element.refund_amount;
                });
                if (amount <= (transactionMaster.amount - refundedAmt)) {
                    let { charge_id, stripe_customer_id, stripe_card_id } = transactionMaster;
                    let stripeMainObj = new stripeMain();
                    let refundData = await stripeMainObj.refundPayment(charge_id, amount, site_id);
                    if (refundData.status) {
                        let refund = refundData.refund;
                        var transaction = await dbWriter.transactionMaster.create({
                            user_id: user_id,
                            site_id: transactionMaster.site_id,
                            transaction_type: 1,
                            type: 2,
                            parent_id: transactionMaster.parent_id,
                            request_json: JSON.stringify({ "charge_id": charge_id, "amount": amount }),
                            response_json: JSON.stringify(refund),
                            status: 'Success',
                            stripe_customer_id: stripe_customer_id,
                            stripe_card_id: stripe_card_id,
                            amount: amount,
                            created_datetime: moment().format("YYYY-MM-DD HH:mm:ss"),
                            charge_id: charge_id,
                            payment_type: 1,
                            transaction_details: 'Refund Transaction'
                        });
                        let refundsData = await dbWriter.refunds.create({
                            user_id: user_id,
                            site_id: transactionMaster.site_id,
                            charge_id: charge_id,
                            order_id: transactionMaster.parent_id,
                            transaction_id: transaction.transaction_id,
                            stripe_refund_id: refund.id,
                            pg_customer_id: stripe_customer_id,
                            pg_card_id: stripe_card_id,
                            status: refund.status == "succeeded" ? 1 : 5,
                            refund_type: refund_type == 3 ? 3 : 1,
                            refund_amount: amount,
                            refund_reason: req.body.refund_reason ? req.body.refund_reason : null,
                            scholarship_code: scholarship_code,
                            coupon_id: coupon_id,
                            created_datetime: moment().format("YYYY-MM-DD HH:mm:ss")
                        });

                        let tempRefData = await dbReader.refunds.findAll({
                            where: { order_id: transactionMaster.parent_id }
                        })
                        let tempRefAmount: any = 0, refundMailData: any = []
                        tempRefData.forEach((e: any) => {
                            let tempDate = new Date(e.created_datetime)
                            let date = moment(tempDate).format('MMMM DD, YYYY, hh:mm A');
                            refundMailData.push({ 'amount': parseFloat(e.refund_amount).toFixed(2), 'date': date })
                            tempRefAmount += e.refund_amount
                        })

                        if (transactionMaster.sycu_user && transactionMaster.user_order && transactionMaster.user_order.user_order_items) {
                            let OrderDetails: any = []
                            transactionMaster.user_order.user_order_items.forEach((element: any) => {
                                OrderDetails.push({
                                    product_name: element.product_name,
                                    product_amount: element.product_amount
                                })
                            });
                            let orderTotal: any = parseFloat(transactionMaster.user_order.total_amount).toFixed(2)
                            tempRefAmount = parseFloat(tempRefAmount).toFixed(2)
                            await ObjectMail.ConvertData({
                                templateIdentifier: EnumObject.templateIdentifier.get('orderRefundSuccessfully').value,
                                orderNumber: transactionMaster.user_order.user_order_number,
                                user_id: user_id,
                                first_name: transactionMaster.sycu_user.first_name,
                                user_subscription_id: transactionMaster.user_order.user_subscription_id,
                                subscriptionNumber: transactionMaster.user_order.user_subscription.subscription_number,
                                userOrderId: transactionMaster.user_order.user_orders_id,
                                orderCreatedDate: transactionMaster.user_order.created_datetime,
                                OrderDetails: OrderDetails,
                                orderSubTotal: transactionMaster.user_order.sub_amount,
                                paymentMethod: 1,
                                orderTotal: orderTotal,
                                refund_id: refundsData.refund_id,
                                refundData: refundMailData,
                                finalTotal: (refund_type == 3) ? amount : (orderTotal - tempRefAmount),
                                site: transactionMaster.site_id,
                                user_email: transactionMaster.sycu_user.email,
                                SiteName: 'SYCU Account'
                            }, function (data: any) {
                                console.log('Email Send Successfully.')
                            });
                        }

                        // Cancel Membership Code
                        let subscriptionId = (transactionMaster.user_order) ? transactionMaster.user_order.user_subscription_id : 0
                        await this.CancelMembershipOnRefund(subscriptionId, user_id)

                        if (refund_type == 3 && scholarship_code) {
                            let message = "'" + scholarship_code + "' scholarship code applied on refund of order #" + transactionMaster.user_order.user_order_number + " by Admin (" + display_name + ")";
                            let logList = [{
                                type: 2,
                                event_type_id: subscriptionId,
                                message: message,
                            }]
                            let noteList = [{
                                type: 2,
                                event_type_id: subscriptionId,
                                message: message,
                            }]

                            //save log
                            if (logList.length)
                                await dbWriter.logs.bulkCreate(logList);
                            // save notes
                            if (noteList.length)
                                await dbWriter.notes.bulkCreate(noteList);
                        }

                        //if fully refunded then update renewal_count to 0 for hide
                        if (amount == (transactionMaster.amount - refundedAmt)) {
                            await dbWriter.userOrderItems.update({
                                renewal_count: 0,
                                updated_datetime: new Date()
                            }, {
                                where: { user_orders_id: transactionMaster.parent_id, is_deleted: 0, item_type: 1 }
                            });
                        }

                        new SuccessResponse(EC.success, {
                            //@ts-ignore
                            token: req.token
                        }).send(res);
                    } else {
                        throw new Error((refundData.message).includes("has been charged back") ? "This transaction has generated the dispute. Please check stripe Dashboard" : refundData.message)
                    }
                } else {
                    throw new Error("Refund amount is higher then paid amount.")
                }
            } else {
                throw new Error("Transaction not found.")
            }
        } catch (error: any) {
            ApiError.handle(new BadRequestError(error.message), res);
        }
    }

    public CancelMembershipOnRefund = async (subscription_id: number, user_id: number) => {
        try {
            let findSubscription = await dbReader.userSubscription.findOne({
                where: { user_subscription_id: subscription_id },
                include: [{
                    separate: true,
                    model: dbReader.userOrder,
                    attributes: ['user_orders_id', 'user_subscription_id', 'total_amount'],
                    where: { order_status: { [dbReader.Sequelize.Op.ne]: 7 } },
                    include: [{
                        separate: true,
                        model: dbReader.userOrderItems,
                        attributes: ['user_order_item_id', 'product_id', 'updated_product_id'],
                        where: { item_type: 1, is_deleted: 0 },
                        include: [{
                            model: dbReader.products,
                            attributes: ['product_id', 'product_name', 'product_duration', 'category_id', 'ministry_type'],
                            where: { is_deleted: 0 },
                        }, {
                            required: false,
                            as: 'updated_product',
                            model: dbReader.products,
                            attributes: ['product_id', 'product_name', 'product_duration', 'category_id', 'ministry_type'],
                        }]
                    }, {
                        separate: true,
                        model: dbReader.refunds
                    }],
                    order: [['user_orders_id', 'DESC']]
                }]
            });
            let refundProductIds: any = [], tempProductIds: any = [];

            findSubscription = JSON.parse(JSON.stringify(findSubscription));
            if (findSubscription) {
                findSubscription.user_orders.forEach((o: any, index: any) => {
                    if (o.refunds.length) {
                        let total_refund = 0;
                        o.refunds.forEach((r: any) => { total_refund += r.refund_amount; });
                        if (o.total_amount == total_refund) {
                            o.user_order_items.forEach((oi: any) => {
                                if (oi.updated_product_id) {
                                    refundProductIds.push({
                                        product_id: oi.updated_product_id,
                                        product_duration: oi.updated_product.product_duration,
                                        ministry_type: oi.updated_product.ministry_type,
                                        category_id: oi.updated_product.category_id,
                                    });
                                }
                                else {
                                    refundProductIds.push({
                                        product_id: oi.product_id,
                                        product_duration: oi.sycu_product.product_duration,
                                        ministry_type: oi.sycu_product.ministry_type,
                                        category_id: oi.sycu_product.category_id,
                                    });
                                }
                            });
                        } else {
                            o.user_order_items.forEach((oi: any) => {
                                if (oi.updated_product_id) {
                                    tempProductIds.push({
                                        product_id: oi.updated_product_id,
                                        product_duration: oi.updated_product.product_duration,
                                        ministry_type: oi.updated_product.ministry_type,
                                        category_id: oi.updated_product.category_id,
                                        status: findSubscription.subscription_status
                                    });
                                }
                                else {
                                    tempProductIds.push({
                                        product_id: oi.product_id,
                                        product_duration: oi.sycu_product.product_duration,
                                        ministry_type: oi.sycu_product.ministry_type,
                                        category_id: oi.sycu_product.category_id,
                                        status: findSubscription.subscription_status
                                    });
                                }
                            });
                        }
                    } else {
                        o.user_order_items.forEach((oi: any) => {
                            if (oi.updated_product_id) {
                                tempProductIds.push({
                                    product_id: oi.updated_product_id,
                                    product_duration: oi.updated_product.product_duration,
                                    ministry_type: oi.updated_product.ministry_type,
                                    category_id: oi.updated_product.category_id,
                                    status: findSubscription.subscription_status
                                });
                            }
                            else {
                                tempProductIds.push({
                                    product_id: oi.product_id,
                                    product_duration: oi.sycu_product.product_duration,
                                    ministry_type: oi.sycu_product.ministry_type,
                                    category_id: oi.sycu_product.category_id,
                                    status: findSubscription.subscription_status
                                });
                            }
                        });
                    }
                });

                tempProductIds = JSON.parse(JSON.stringify(tempProductIds))
                tempProductIds.filter((g: any) => {
                    if (g.status == 2 || g.product_duration == 365) {
                        refundProductIds = refundProductIds.filter((e: any, i: any) => {
                            if (!(g.category_id == e.category_id && g.ministry_type == e.ministry_type)) {
                                return true
                            }
                        })
                    } else if (g.status == 5 && g.product_duration == 90) {
                        let pc = tempProductIds.filter((u: any) => u.category_id == g.category_id && u.ministry_type == g.ministry_type).length
                        if (pc >= 4) {
                            refundProductIds = refundProductIds.filter((e: any, i: any) => {
                                if (!(g.category_id == e.category_id && g.ministry_type == e.ministry_type)) {
                                    return true
                                }
                            })
                        }
                    } else if (g.status == 5 && g.product_duration == 30) {
                        let pc = tempProductIds.filter((u: any) => u.category_id == g.category_id && u.ministry_type == g.ministry_type).length
                        if (pc >= 12) {
                            refundProductIds = refundProductIds.filter((e: any, i: any) => {
                                if (!(g.category_id == e.category_id && g.ministry_type == e.ministry_type)) {
                                    return true
                                }
                            })
                        }
                    }
                });
                let data = await dbReader.userMemberships.findAll({
                    where: dbReader.Sequelize.and(
                        { is_deleted: 0 },
                        { user_id: user_id, user_subscription_id: subscription_id },
                        { status: { [dbReader.Sequelize.Op.notIn]: [1, 12] } },
                    ),
                    attributes: ['user_membership_id', 'status'],
                    include: [{
                        attributes: ["membership_id", "membership_name"],
                        model: dbReader.membership,
                        where: { is_deleted: 0 },
                        include: [{
                            model: dbReader.sites,
                            attributes: ["logo"],
                        }, {
                            separate: true,
                            model: dbReader.membershipProduct,
                            attributes: ['membership_product_id', 'product_id'],
                            where: { is_deleted: 0 }
                        }]
                    }]
                });
                data = JSON.parse(JSON.stringify(data));
                let updateMembershipData: any = []
                data.forEach((element: any) => {
                    if (element.sycu_membership.sycu_membership_products.some((p: any) =>
                        refundProductIds.some((s: any) => s.product_id == p.product_id))) {
                        updateMembershipData.push(element.user_membership_id)
                    }
                });
                if (updateMembershipData.length) {
                    await dbWriter.userMemberships.update({
                        status: 12,
                        updated_datetime: new Date()
                    }, {
                        where: { user_membership_id: updateMembershipData }
                    })
                    return {
                        res: true,
                        message: "Success"
                    }
                } else {
                    throw new Error("No Subscription Membership Found.")
                }
            } else {
                throw new Error("No Subscription Found.")
            }
        } catch (err: any) {
            return {
                res: false,
                message: err.message
            }
        }
    }

    public refundTransactionReceipt = async (req: Request, res: Response) => {
        try {
            let transaction_id = 0;
            let { email_address = '' } = req.body;
            if (req.body.transaction_id) {
                transaction_id = req.body.transaction_id
            } else {
                transaction_id = parseInt(req.params.transaction_id)
            }
            //@ts-ignore
            let { user_id } = req;
            let transactionMaster = await dbReader.transactionMaster.findOne({
                where: {
                    status: "Success",
                    transaction_id: transaction_id
                },
                include: [{
                    required: true,
                    model: dbReader.userOrder,
                    attributes: ['user_subscription_id', 'user_order_number', 'created_datetime', 'user_orders_id'],
                    include: [{
                        required: true,
                        model: dbReader.userSubscription,
                        attributes: ['subscription_number'],
                    }, {
                        separate: true,
                        model: dbReader.userOrderItems,
                        order: ['item_type']
                    }]
                }, {
                    required: true,
                    model: dbReader.users,
                    attributes: ['first_name', 'email']
                }, {
                    required: true,
                    model: dbReader.refunds,
                    attributes: ['refund_id']
                }]
            });
            transactionMaster = JSON.parse(JSON.stringify(transactionMaster));
            if (transactionMaster && transactionMaster.sycu_user && transactionMaster.user_order && transactionMaster.user_order.user_order_items) {
                let OrderDetails: any = []
                transactionMaster.user_order.user_order_items.forEach((element: any) => {
                    OrderDetails.push({
                        product_name: element.product_name,
                        product_amount: element.product_amount
                    })
                });
                await ObjectMail.ConvertData({
                    templateIdentifier: EnumObject.templateIdentifier.get('orderRefundSuccessfully').value,
                    orderNumber: transactionMaster.user_order.user_order_number,
                    user_id: transactionMaster.user_id,
                    first_name: transactionMaster.sycu_user.first_name,
                    user_subscription_id: transactionMaster.user_order.user_subscription_id,
                    subscriptionNumber: transactionMaster.user_order.user_subscription.subscription_number,
                    userOrderId: transactionMaster.user_order.user_orders_id,
                    orderCreatedDate: transactionMaster.user_order.created_datetime,
                    OrderDetails: OrderDetails,
                    orderSubTotal: transactionMaster.user_order.sub_amount,
                    paymentMethod: 1,
                    orderTotal: transactionMaster.user_order.total_amount,
                    refund_id: transactionMaster.refund.refund_id,
                    refundTotal: transactionMaster.amount,
                    finalTotal: transactionMaster.user_order.total_amount - transactionMaster.amount,
                    refundDate: transactionMaster.created_datetime,
                    site: transactionMaster.site_id,
                    user_email: (email_address) ? email_address : transactionMaster.sycu_user.email,
                    SiteName: 'SYCU Account'
                }, function (data: any) {
                    console.log('Email Send Successfully.')
                });

                new SuccessResponse(EC.success, {
                    //@ts-ignore
                    token: req.token
                }).send(res);

            } else {
                throw new Error("Refund not found.")
            }
        } catch (error: any) {
            ApiError.handle(new BadRequestError(error.message), res);
        }
    }

    public chargeTransactionReceipt = async (req: Request, res: Response) => {
        try {
            let transaction_id = 0;
            let { email_address = '' } = req.body;
            if (req.body.transaction_id) {
                transaction_id = req.body.transaction_id
            } else {
                transaction_id = parseInt(req.params.transaction_id)
            }
            let transactionMaster = await dbReader.transactionMaster.findOne({
                where: {
                    status: "Success",
                    transaction_id: transaction_id
                },
                include: [{
                    required: true,
                    model: dbReader.userOrder,
                    attributes: ['user_subscription_id', 'user_order_number', 'created_datetime', 'user_orders_id'],
                    include: [{
                        required: true,
                        model: dbReader.userSubscription,
                        attributes: ['subscription_number', 'start_date', 'end_date', 'total_amount', 'next_payment_date'],
                    }, {
                        separate: true,
                        model: dbReader.userOrderItems,
                        order: ['item_type']
                    }, {
                        as: 'billingAddress',
                        required: false,
                        model: dbReader.userAddress,
                        where: { address_type: 1, user_subscription_id: 0, is_deleted: 0 },
                        attributes: ['first_name', 'last_name', 'address_line1', 'address_line2', 'city', 'company', 'zipcode', 'state_id', 'country_id', 'phone_number', 'customer_shipping_note', [dbReader.Sequelize.literal('`user_order->billingAddress->stateModel`.`state_code`'), 'state_code'], [dbReader.Sequelize.literal('`user_order->billingAddress->stateModel`.`name`'), 'state_name'], [dbReader.Sequelize.literal('`user_order->billingAddress->countryModel`.`name`'), 'country_name']],
                        include: [{
                            model: dbReader.stateModel,
                            attributes: []
                        }, {
                            model: dbReader.countryModel,
                            attributes: []
                        }]
                    }]
                }, {
                    required: true,
                    model: dbReader.users,
                    attributes: ['first_name', 'email']
                }]
            });
            transactionMaster = JSON.parse(JSON.stringify(transactionMaster));
            if (transactionMaster && transactionMaster.user_order && transactionMaster.sycu_user && transactionMaster.user_order.user_order_items) {
                let OrderDetails: any = []
                transactionMaster.user_order.user_order_items.forEach((element: any) => {
                    if (element.item_type == 5) {
                        OrderDetails.push({
                            product_name: "Discount",
                            product_amount: element.product_amount
                        })
                    }
                    else {
                        OrderDetails.push({
                            product_name: element.product_name,
                            product_amount: element.product_amount
                        })
                    }

                });
                let billingAddress = transactionMaster.user_order.billingAddress
                await ObjectMail.ConvertData({
                    templateIdentifier: (transactionMaster.status == "Success") ? EnumObject.templateIdentifier.get('orderPurchaseSuccessfully').value : EnumObject.templateIdentifier.get('orderFailed').value,
                    user_subscription_id: transactionMaster.user_order.user_subscription_id,
                    isRecurringSubscription: transactionMaster.user_order.user_subscription.is_recurring_subscription || 0,
                    user_id: transactionMaster.user_id,
                    first_name: transactionMaster.sycu_user.first_name,
                    user_email: (email_address) ? email_address : transactionMaster.sycu_user.email,
                    orderNumber: transactionMaster.user_order.user_order_number,
                    subscriptionNumber: transactionMaster.user_order.user_subscription.subscription_number,
                    orderCreatedDate: transactionMaster.user_order.created_datetime,
                    OrderDetails: OrderDetails,
                    userOrderId: transactionMaster.user_order.user_orders_id,
                    orderSubTotal: transactionMaster.user_order.sub_amount,
                    paymentMethod: 1,
                    orderTotal: transactionMaster.user_order.total_amount,
                    SubscriptionDetails: [{
                        start_date: moment(transactionMaster.user_order.user_subscription.start_date).format("YYYY-MM-DD HH:mm:ss"),
                        end_date: (transactionMaster.user_order.user_subscription.end_date || transactionMaster.user_order.user_subscription.next_payment_date) ? moment(transactionMaster.user_order.user_subscription.end_date || transactionMaster.user_order.user_subscription.next_payment_date).format("YYYY-MM-DD HH:mm:ss") : '',
                        total_amount: transactionMaster.user_order.user_subscription.total_amount
                    }],
                    site: transactionMaster.site_id,
                    billingAddress: (billingAddress) ? (billingAddress.address_line1 + " " + billingAddress.address_line2 + ", " + billingAddress.city + ", " + billingAddress.state_name || '' + ", " + billingAddress.country_name || '') : '',
                    SiteName: 'SYCU Account'
                }, function (data: any) {
                    console.log('Email Send Successfully.')
                });
                new SuccessResponse(EC.chargeReceiptSuccess, {
                    //@ts-ignore
                    token: req.token
                }).send(res);
            } else {
                throw new Error("Transaction not found.")
            }
        } catch (error: any) {
            ApiError.handle(new BadRequestError(error.message), res);
        }

    }

    public updateSubscriptionRenewal = async (requestData: any) => {
        if (requestData) {
            let subscriptionRenewal = await dbReader.subscriptionRenewal.findOne({
                where: { user_subscription_id: requestData.user_subscription_id, is_executed: 0, is_instant_payment: 0, is_deleted: 0 }
            })
            if (subscriptionRenewal) {
                if (requestData.next_payment_date) {
                    await dbWriter.subscriptionRenewal.update({
                        renewal_date: requestData.next_payment_date,
                        updated_datetime: new Date(),
                    }, {
                        where: {
                            user_subscription_id: requestData.user_subscription_id,
                            is_executed: 0,
                            is_instant_payment: 0,
                            is_deleted: 0
                        }
                    });
                }
            } else {
                let subscriptionRenewalCronLog = await dbReader.subscriptionRenewalCronLog.findOne({
                    where: { is_executed: 0, is_deleted: 0, is_instant_payment: 0, user_subscription_id: requestData.user_subscription_id }
                })
                let attempt_count = 0
                if (subscriptionRenewalCronLog) {
                    attempt_count = subscriptionRenewalCronLog.attempt_count
                    await dbWriter.subscriptionRenewalCronLog.update({
                        is_deleted: 1
                    }, {
                        where: { is_executed: 0, is_deleted: 0, is_instant_payment: 0, user_subscription_id: requestData.user_subscription_id }
                    })
                }
                if (moment(requestData.next_payment_date).format('YYYY-MM-DD') > moment().format('YYYY-MM-DD')) {
                    await dbWriter.subscriptionRenewal.create({
                        attempt_count: 0,
                        renewal_date: requestData.next_payment_date,
                        user_subscription_id: requestData.user_subscription_id,
                        user_orders_id: 0,
                        site_id: requestData.site_id,
                        user_id: requestData.user_id,
                    });
                } else if (moment(requestData.next_payment_date).format('YYYY-MM-DD') == moment().format('YYYY-MM-DD')
                    || moment(requestData.next_payment_date).format('YYYY-MM-DD') < moment().format('YYYY-MM-DD')) {
                    if ([2, 4].includes(requestData.subscription_status)) {
                        // After 1 hr set
                        let new_time = moment().add(1, 'hours')
                        let subscriptionRenewalData = await dbWriter.subscriptionRenewal.create({
                            attempt_count: attempt_count,
                            renewal_date: new_time.format("YYYY-MM-DD HH:mm:ss"),
                            user_subscription_id: requestData.user_subscription_id,
                            user_orders_id: 0,
                            site_id: requestData.site_id,
                            user_id: requestData.user_id,
                            is_executed: 1
                        });
                        if (subscriptionRenewalData) {
                            let uuid = uuidv4();
                            await dbWriter.subscriptionRenewalCronLog.create({
                                subscription_renewal_id: subscriptionRenewalData.subscription_renewal_id,
                                user_subscription_id: requestData.user_subscription_id,
                                is_executed: 0,
                                end_date: new_time.format("YYYY-MM-DD HH:mm:ss"),
                                renewal_date: new_time.format("YYYY-MM-DD HH:mm:ss"),
                                uuid: uuid
                            });
                            try {
                                await axios.get('https://api.accounts.stuffyoucanuse.org/api/v1/updateSubscriptionRenewalCron/' + uuid);
                            } catch (e: any) {
                                console.log(e.message);
                            }
                        }
                    }
                }
            }
        }
        return true
    }

    /**
     * validate coupon code
     * @param couponDetails
     * @returns
    */
    public async validateCouponCode(couponDetails: any) {
        let {
            coupon_code,
            user_id,
            products_list = [],
            site_id = 0,
            product_id,
            fees,
            coupon_ids = [],
            user_subscription_id = 0,
            is_instant_payment = 0
        } = couponDetails;

        let {
            sub_amount = 0,
            total_amount = 0,
            total_shipping_fees = 0,
            total_processing_fees = 0,
            coupon_discount = 0
        }: any = 0;
        let error_type = 0, ct = 0;
        products_list.map(function (item: any, index: any) {
            let shipping_fees = 0, processing_fees = 0
            if (ct++ == 0) {
                if (fees) {
                    processing_fees = parseFloat(fees.total);
                }
                shipping_fees = item.shipping_fees;
            }
            item.total_amount = item.shipping_fees + item.processing_fees + item.product_price;
            total_shipping_fees += shipping_fees;
            total_processing_fees += processing_fees;
            sub_amount += item.product_price;
        }, 0.0);
        total_amount = sub_amount + total_shipping_fees + total_processing_fees;

        let billingAmount = {
            total_amount,
            total_shipping_fees,
            total_processing_fees,
            sub_amount,
            coupon_discount
        }
        try {
            let whereCondition: any = {}
            if (coupon_code || coupon_ids.length > 0) {
                whereCondition = {
                    coupon_code: coupon_code,
                    is_deleted: 0,
                    site_id: site_id
                }
                if (coupon_ids.length > 0) {
                    if (coupon_code) {
                        whereCondition = dbReader.Sequelize.and(
                            dbReader.Sequelize.or(
                                { coupon_id: { [dbReader.Sequelize.Op.in]: coupon_ids } },
                                { coupon_code: coupon_code }
                            ),
                            { is_deleted: 0, site_id: site_id }
                        )
                    } else {
                        whereCondition = {
                            coupon_id: coupon_ids,
                            is_deleted: 0,
                            site_id: site_id
                        };
                    }
                }
                let couponDataDB = await dbReader.coupons.findAll({
                    attributes: ['coupon_id', 'coupon_code', 'coupon_description', 'rate_type', 'rate', 'updated_date',
                        'coupon_expire_date_time', 'max_limit', 'user_used_limit', 'min_cart_amount'],
                    where: whereCondition,
                    include: [{
                        separate: true,
                        model: dbReader.couponsProduct,
                        where: { is_deleted: 0 }
                    }, {
                        separate: true,
                        model: dbReader.refunds,
                        attributes: ['refund_id'],
                        where: { refund_type: 3 }
                    }]
                });
                if (couponDataDB.length) {
                    couponDataDB = JSON.parse(JSON.stringify(couponDataDB));
                    let coupons_data: any = [], s = 0
                    let coupon_id = 0, coupon_code = ""
                    while (couponDataDB.length > s) {
                        let couponData = couponDataDB[s]
                        if (couponData.sycu_coupons_products.length)
                            if (!couponData.sycu_coupons_products.some((s: any) => product_id.includes(s.product_id))) {
                                error_type = 1
                                throw new Error("Coupon Not Valid for products.");
                            }

                        if (couponData.min_cart_amount > total_amount) {
                            error_type = 2
                            throw new Error("Coupon mim cart amount not match.");
                        }
                        if (couponData.coupon_expire_date_time) {
                            let getDate = couponData.coupon_expire_date_time;
                            let currentDate = new Date().toISOString()
                            const dateIsAfter = moment(currentDate).isAfter(moment(getDate));
                            if (dateIsAfter) {
                                error_type = 3
                                throw new Error("Coupon has expire.");
                            }
                        }
                        if (couponData.max_limit != 0) {
                            var usedCouponData = await dbReader.sycuUserCoupon.count({
                                where: { coupon_id: couponData.coupon_id },
                            });
                            if (usedCouponData >= couponData.max_limit) {
                                error_type = 4
                                throw new Error("Coupon limit exclude.");
                            }
                        }
                        if (couponData.user_used_limit != 0) {
                            let TopCouponArray: any = [];
                            let userUsedCouponData = await dbReader.sycuUserCoupon.count({
                                where: { coupon_id: couponData.coupon_id, user_id: user_id }
                            });
                            let subscriptionDetails = await dbReader.userSubscription.findOne({
                                where: { user_subscription_id: user_subscription_id },
                                include: [{
                                    separate: true,
                                    model: dbReader.userOrder,
                                    where: { order_status: [2, 3, 8, 9, 10] },
                                    order: ["user_orders_id", "order_status"],
                                    include: [{
                                        separate: true,
                                        model: dbReader.userOrderItems,
                                        where: { item_type: 5, is_deleted: 0 },
                                        attributes: ["user_order_item_id", "user_orders_id", "product_id", "updated_product_id"]
                                    }]
                                }]
                            });
                            if (subscriptionDetails) {
                                subscriptionDetails = JSON.parse(JSON.stringify(subscriptionDetails));
                                if (subscriptionDetails.user_orders && subscriptionDetails.user_orders.length) {
                                    subscriptionDetails.user_orders.forEach((orderEle: any) => {
                                        if (orderEle.order_status != 7 && orderEle.user_order_items && orderEle.user_order_items.length) {
                                            orderEle.user_order_items.forEach((item: any) => {
                                                if (item.product_id == couponData.coupon_id || item.updated_product_id == couponData.coupon_id) {
                                                    TopCouponArray.push({
                                                        user_id: subscriptionDetails.user_id,
                                                        coupon_id: item.product_id,
                                                    })
                                                }
                                            })
                                        }
                                    })
                                }
                            }
                            if (userUsedCouponData == 0 || (userUsedCouponData && userUsedCouponData != TopCouponArray.length)) {
                                userUsedCouponData = TopCouponArray.length;
                            }
                            if (couponData.refunds && couponData.refunds.length) {
                                userUsedCouponData += couponData.refunds.length;
                            }
                            if (userUsedCouponData >= couponData.user_used_limit) {
                                error_type = 5
                                throw new Error("Coupon already used.");
                            }
                        }
                        if ([378186, 378187, 407304, 407305].includes(couponData.coupon_id)) {
                            error_type = 6
                            throw new Error("You can't use this coupon.");
                        }
                        if (couponData.rate_type == 1) {
                            let discount = (couponData.rate == 100) ?
                                ((billingAmount.total_amount * couponData.rate) / 100) :
                                ((billingAmount.sub_amount * couponData.rate) / 100);

                            if ((billingAmount.total_amount - discount) < 0) {
                                billingAmount.coupon_discount = billingAmount.coupon_discount + parseFloat((billingAmount.total_amount).toFixed(2));
                                billingAmount.total_amount = 0;
                                coupons_data.push({
                                    coupon_id: couponData.coupon_id,
                                    total_amount: 0,
                                    coupon_discount: parseFloat((billingAmount.total_amount).toFixed(2)),
                                    coupon_code: couponData.coupon_code
                                });
                            } else {
                                billingAmount.total_amount -= discount;
                                billingAmount.total_amount = parseFloat((billingAmount.total_amount).toFixed(2));
                                billingAmount.coupon_discount += discount;
                                billingAmount.coupon_discount = parseFloat((billingAmount.coupon_discount).toFixed(2));
                                coupons_data.push({
                                    coupon_id: couponData.coupon_id,
                                    total_amount: (is_instant_payment == 1) ? parseFloat((discount).toFixed(2)) : parseFloat((billingAmount.total_amount).toFixed(2)),
                                    coupon_discount: parseFloat((discount).toFixed(2)),
                                    coupon_code: couponData.coupon_code
                                });
                            }
                        } else {
                            if ((billingAmount.total_amount - couponData.rate) < 0) {
                                billingAmount.coupon_discount = billingAmount.coupon_discount + parseFloat((billingAmount.total_amount).toFixed(2));
                                if (is_instant_payment || is_instant_payment == 1) {
                                    billingAmount.total_amount = 0;
                                    coupons_data.push({
                                        coupon_id: couponData.coupon_id,
                                        total_amount: 0,
                                        coupon_discount: parseFloat((billingAmount.total_amount).toFixed(2)),
                                        coupon_code: couponData.coupon_code
                                    });
                                } else {
                                    coupons_data.push({
                                        coupon_id: couponData.coupon_id,
                                        total_amount: 0,
                                        coupon_discount: parseFloat((billingAmount.total_amount).toFixed(2)),
                                        coupon_code: couponData.coupon_code
                                    });
                                    billingAmount.total_amount = 0;
                                }
                            } else {
                                billingAmount.total_amount -= couponData.rate;
                                billingAmount.total_amount = parseFloat((billingAmount.total_amount).toFixed(2));
                                billingAmount.coupon_discount += couponData.rate;
                                billingAmount.coupon_discount = parseFloat((billingAmount.coupon_discount).toFixed(2));
                                coupons_data.push({
                                    coupon_id: couponData.coupon_id,
                                    total_amount: parseFloat((couponData.rate).toFixed(2)),
                                    coupon_discount: parseFloat((couponData.rate).toFixed(2)),
                                    coupon_code: couponData.coupon_code
                                });
                            }
                        }
                        if ((!is_instant_payment || is_instant_payment == 0) && couponData.coupon_code == coupon_code) {
                            coupon_id = couponData.coupon_id
                            coupon_code = couponData.coupon_code
                        }
                        s++
                    }
                    return {
                        isVerified: true,
                        billingAmount: billingAmount,
                        coupon_id: coupon_id,
                        coupon_code: coupon_code,
                        coupon_data: coupons_data
                    };
                } else {
                    throw new Error("Coupon not found.")
                }
            } else {
                throw new Error("Coupon not found.")
            }
        } catch (err: any) {
            return {
                error_type: error_type || 0,
                isVerified: false,
                message: err.message,
                billingAmount: billingAmount,
                coupon_id: 0
            };
        }
    }

    /**
     * take payment and save card
     * @param payment_checkout_Detail
     * @returns
    */
    public async takePaymentAndSaveCard(payment_checkout_Detail: any) {
        try {
            let stripeMainObj = new stripeMain();
            let { site_id, user_id, check_out_amount, cardDetail, orderDetailsList, pg_customer_card_id, req, emailPayload, transaction_details, address_details, is_from_upgrade_downgrade } = payment_checkout_Detail;

            let { cardId = "", customerId = "", customer_id = "", userEmail = "", userName = "", card_id = "" } = {};

            let custom_site_id = 2

            let checkOutPayment: any;
            let sitePaymentServiceData = await stripeMainObj.getSecreteKey(2);
            let throwError: string = "Payment service not available.";
            if (sitePaymentServiceData) {
                let site_credentials = JSON.parse(sitePaymentServiceData.auth_json);
                let site_payment_service_id = sitePaymentServiceData.site_payment_service_id;
                //get user and user customer details

                let billingAddressOneRequired = false
                if (pg_customer_card_id == 0) {
                    billingAddressOneRequired = true
                }

                let userDetails = await dbReader.users.findOne({
                    where: {
                        user_id: user_id
                    },
                    include: [{
                        required: false,
                        model: dbReader.stripeCustomer,
                        where: {
                            site_id: custom_site_id
                        }
                    }, {
                        required: billingAddressOneRequired,
                        as: 'billingAddressOne',
                        model: dbReader.userAddress,
                        where: { address_type: 1, user_subscription_id: 0, is_deleted: 0, user_orders_id: 0 },
                        attributes: ['address_line1', 'city', [dbReader.Sequelize.literal('`billingAddressOne->stateModel`.`state_code`'), 'state_code'], [dbReader.Sequelize.literal('`billingAddressOne->countryModel`.`country_code`'), 'country_code'], 'zipcode'],
                        include: [{
                            model: dbReader.stateModel,
                            attributes: []
                        }, {
                            model: dbReader.countryModel,
                            attributes: []
                        }]
                    }]
                });
                userDetails = JSON.parse(JSON.stringify(userDetails));
                throwError = "Payment Failed. Please provide your billing address details correctly.";
                if (userDetails) {

                    let userCardsWhere: any = {}, stripeCustomer: any = {};
                    if (pg_customer_card_id) {
                        userCardsWhere = { pg_customer_card_id: pg_customer_card_id }
                    } else {
                        userCardsWhere = { user_id: user_id }
                    }
                    let userCard = await dbReader.userCard.findOne({
                        where: userCardsWhere
                    });
                    customerId = userCard?.stripe_customer_id ?? "";
                    if (userCard) {
                        stripeCustomer = await dbReader.stripeCustomer.findOne({
                            where: { stripe_customer_id: userCard.stripe_customer_id }
                        });
                    }
                    customer_id = stripeCustomer?.sycu_stripe_customer_id ?? "";

                    // customerId = userDetails.sycu_stripe_customer?.stripe_customer_id ?? "";
                    // customer_id = userDetails.sycu_stripe_customer?.sycu_stripe_customer_id ?? ""
                    userEmail = userDetails.email;
                    userName = userDetails.display_name;
                    switch (sitePaymentServiceData.payment_service_id) {
                        case EnumObject.paymentServiceEnum.get("Stripe").value:
                            let stripe_key = site_credentials.stripe_secret_key;
                            if (pg_customer_card_id == 0) {
                                // create customer on stripe if not available
                                if (!customerId) {
                                    let address = {
                                        line1: userDetails.billingAddressOne.address_line1,
                                        postal_code: userDetails.billingAddressOne.zipcode,
                                        city: userDetails.billingAddressOne.city,
                                        state: userDetails.billingAddressOne.state_code,
                                        country: userDetails.billingAddressOne.country_code,
                                    };
                                    var stripe_customer = await stripeMainObj.stripeCustomerInfo(stripe_key, userName, address, userEmail, user_id, 2, site_payment_service_id)
                                    if (stripe_customer.status) {
                                        customerId = stripe_customer.payment_getaway_customer.id;
                                        customer_id = stripe_customer.customer_details.sycu_stripe_customer_id;
                                    } else {
                                        throwError = stripe_customer.message;
                                    }
                                }

                                if (customerId) {
                                    // add card on stripe if not available
                                    if (cardDetail) {
                                        cardDetail.cardName = cardDetail.cardName || userDetails.display_name;
                                        let cardDetails = await stripeMainObj.stripeCustomerCardInfo(stripe_key, cardDetail, customerId, 2, user_id, site_payment_service_id);
                                        if (cardDetails.status) {
                                            cardId = cardDetails.payment_getaway_card.id;
                                            card_id = cardDetails.card_details.pg_customer_card_id;
                                        } else {
                                            throwError = cardDetails.message;
                                        }
                                    }
                                }
                            } else {
                                let cardDetailsObj = await dbReader.userCard.findOne({
                                    where: { pg_customer_card_id: pg_customer_card_id }
                                });
                                cardDetailsObj = JSON.parse(JSON.stringify(cardDetailsObj));
                                if (cardDetailsObj) {
                                    cardId = cardDetailsObj.stripe_card_id;
                                    card_id = pg_customer_card_id;
                                }
                            }
                            if (customerId && cardId) {
                                let paymentDetails = {
                                    site_payment_service_id: site_payment_service_id,
                                    amount: check_out_amount,
                                    cardId: cardId,
                                    customerId: customerId,
                                    email: userEmail,
                                    transaction_type: 1,
                                    type: 1,
                                    site_id: site_id,
                                    user_id: user_id,
                                    orderDetailsList: orderDetailsList,
                                    customer_id: customer_id,
                                    pg_customer_card_id: card_id,
                                    payment_type: 1,
                                    emailPayload: emailPayload,
                                    transaction_details: transaction_details,
                                };
                                // Take payment 
                                let req = {
                                    body: paymentDetails
                                };
                                checkOutPayment = await stripeMainObj.CreatePayment(stripe_key, paymentDetails, req);
                                break;
                            } else {
                                if (!customerId && !cardId) {
                                    throwError = "There is no card found with a subscription. The payment can't proceed further. Please attach a valid card with a subscription."
                                } else if (!cardId) {
                                    throwError = "There is no card found with a subscription. The payment can't proceed further. Please attach a valid card with a subscription."
                                }
                                for (let i = 0; i < orderDetailsList.length; i++) {
                                    let parent_id = orderDetailsList[i].user_orders_id;
                                    let order_amount = orderDetailsList[i].total_amount;
                                    let transactionDetails = await dbWriter.transactionMaster.create({
                                        site_payment_service_id: site_payment_service_id,
                                        site_id: site_id,
                                        user_id: user_id,
                                        response_json: JSON.stringify({ "message": throwError }),
                                        request_json: JSON.stringify(_.omit(payment_checkout_Detail, 'req')),
                                        status: "failure",
                                        stripe_customer_id: customer_id,
                                        stripe_card_id: pg_customer_card_id,
                                        amount: order_amount,
                                        charge_id: '',
                                        created_date: moment().unix(),
                                        transaction_type: 1,
                                        type: 1,
                                        parent_id: parent_id,
                                        payment_type: 1,
                                        transaction_details: transaction_details ? transaction_details : ''
                                    });
                                }
                                let s = 0;
                                let failed_user_subscription_id: any = [];
                                if (emailPayload) {
                                    while (emailPayload.length > s) {
                                        failed_user_subscription_id.push(emailPayload[s].user_subscription_id);
                                        emailPayload[s].templateIdentifier = EnumObject.templateIdentifier.get('orderFailed').value;
                                        emailPayload[s].failedFlag = 1;
                                        await ObjectMail.ConvertData(emailPayload[s], function (data: any) { });
                                        s++;
                                    }
                                }
                                if (failed_user_subscription_id.length) {
                                    await dbWriter.userSubscription.update({ subscription_status: 7, updated_datetime: new Date() }, { where: { user_subscription_id: failed_user_subscription_id } });
                                    await dbWriter.userOrder.update({ order_status: 7, updated_datetime: new Date() }, { where: { user_subscription_id: failed_user_subscription_id } });
                                }
                                throw new Error(throwError);
                            }
                        default:
                            throw new Error("Payment service not available.");
                    }
                } else {
                    for (let i = 0; i < orderDetailsList.length; i++) {
                        let parent_id = orderDetailsList[i].user_orders_id;
                        let order_amount = orderDetailsList[i].total_amount;
                        let transactionDetails = await dbWriter.transactionMaster.create({
                            site_payment_service_id: site_payment_service_id,
                            site_id: site_id,
                            user_id: user_id,
                            response_json: JSON.stringify({}),
                            request_json: JSON.stringify(payment_checkout_Detail),
                            status: "failure",
                            stripe_customer_id: customer_id,
                            stripe_card_id: pg_customer_card_id,
                            amount: order_amount,
                            charge_id: '',
                            created_date: moment().unix(),
                            transaction_type: 1,
                            type: 1,
                            parent_id: parent_id,
                            payment_type: 0,
                            transaction_details: transaction_details ? transaction_details : ''
                        });
                    }
                    let s = 0;
                    let failed_user_subscription_id: any = [];
                    if (emailPayload) {
                        while (emailPayload.length > s) {
                            failed_user_subscription_id.push(emailPayload[s].user_subscription_id);
                            emailPayload[s].templateIdentifier = EnumObject.templateIdentifier.get('orderFailed').value;
                            emailPayload[s].failedFlag = 1;
                            await ObjectMail.ConvertData(emailPayload[s], function (data: any) { });
                            s++;
                        }
                    }
                    if (failed_user_subscription_id.length) {
                        await dbWriter.userSubscription.update({ subscription_status: 7, updated_datetime: new Date() }, { where: { user_subscription_id: failed_user_subscription_id } });
                        await dbWriter.userOrder.update({ order_status: 7, updated_datetime: new Date() }, { where: { user_subscription_id: failed_user_subscription_id } });
                    }
                    throw new Error(throwError);
                }
            } else {
                throw new Error(throwError);
            }
            return { isPaymentSuccessful: checkOutPayment.status === "succeeded", paymentDetails: { pg_customer_id: customer_id, pg_card_id: card_id, pg_transaction_type: 1 } };
        } catch (err: any) {
            throw new Error(err.message);
        }
    }

    /**
    * get order details by order id
    * @param req 
    * @param res 
    */
    public async getOrderDetails(req: Request, res: Response) {
        try {
            let body = req.body;
            let orderId = body.order_id;
            let isRenewal = body.is_renewal;
            let obj = new checkoutController();
            let orderList = await dbReader.userOrder.findOne({
                where: {
                    user_orders_id: orderId
                },
                include: [{
                    required: false,
                    attributes: ['first_name', 'last_name', 'address_line1', 'address_line2', 'city', 'company', 'zipcode', 'state_id', 'country_id', 'phone_number', 'email_address', [dbReader.Sequelize.literal('`billingAddress->stateModel`.`name`'), 'state_name'], [dbReader.Sequelize.literal('`billingAddress->countryModel`.`name`'), 'country_name']],
                    where: { address_type: 1 },
                    include: [{
                        required: false,
                        model: dbReader.stateModel,
                        attributes: []
                    }, {
                        required: false,
                        model: dbReader.countryModel,
                        attributes: []
                    }],
                    model: dbReader.userAddress,
                    as: 'billingAddress'
                }, {
                    required: false,
                    attributes: ['first_name', 'last_name', 'address_line1', 'address_line2', 'city', 'company', 'zipcode', 'state_id', 'country_id', 'phone_number', 'customer_shipping_note', [dbReader.Sequelize.literal('`shippingAddress->stateModel`.`name`'), 'state_name'], [dbReader.Sequelize.literal('`shippingAddress->countryModel`.`name`'), 'country_name']],
                    where: { address_type: 2 },
                    include: [{
                        required: false,
                        model: dbReader.stateModel,
                        attributes: []
                    }, {
                        required: false,
                        model: dbReader.countryModel,
                        attributes: []
                    }],
                    model: dbReader.userAddress,
                    as: 'shippingAddress'
                }, {
                    model: dbReader.users,
                    attributes: ['user_id', 'display_name', 'email']
                }, {
                    separate: true,
                    model: dbReader.userOrderItems,
                    where: { is_deleted: 0 }
                }, {
                    model: dbReader.transactionMaster,
                    attributes: []
                }, {
                    where: {
                        type: 1
                    },
                    separate: true,
                    model: dbReader.orderNotes,
                }, {
                    separate: false,
                    model: dbReader.userOrder,
                    as: 'relatedOrders'
                }, {
                    separate: false,
                    model: dbReader.userOrder,
                    as: 'ParentOrder'
                }, {
                    model: dbReader.userSubscription,
                }]
            });

            orderList = JSON.parse(JSON.stringify(orderList));

            new SuccessResponse(EC.errorMessage(EC.saveDataSuccess, ["Product"]), {
                user: null,
                //@ts-ignore
                token: req.token,
                rows: orderList
            }).send(res);

        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    /**
     * get subscription details by subscription id
     * @param req
     * @param res
     */
    public async getSubscriptionDetails(req: Request, res: Response) {
        try {
            let { id } = req.params;
            let subscriptionId = id;
            const self = new checkoutController();
            let subscriptionList = await dbReader.userSubscription.findOne({
                attributes: ['is_recurring_subscription', 'subscription_note', 'is_renewal', 'coupon_code', 'user_subscription_id',
                    'subscription_number', 'user_id', 'subscription_status', 'pg_transaction_type', 'site_id', 'total_amount',
                    'start_date', 'end_date', 'next_payment_date', 'trial_end_date', 'last_order_date', 'created_datetime', 'updated_datetime',
                    [dbReader.Sequelize.literal('`sycu_stripe_customer`.`stripe_customer_id`'), 'pg_customer_id'],
                    [dbReader.Sequelize.fn('if', dbReader.Sequelize.where(dbReader.Sequelize.literal('pg_transaction_type'), 1),
                        dbReader.Sequelize.literal('`userCard`.`stripe_card_id`'), dbReader.Sequelize.literal('`sycu_payment_check`.`check_number`')), 'pg_card_id']],
                where: { user_subscription_id: subscriptionId },
                include: [{
                    required: false,
                    as: 'transaction_card',
                    model: dbReader.userCard,
                    where: { is_deleted: 0 }
                }, {
                    separate: true,
                    model: dbReader.userOrder,
                    where: { order_status: { [dbReader.Sequelize.Op.ne]: 1 } },
                    include: [{
                        separate: true,
                        model: dbReader.userOrderItems,
                        where: { is_deleted: 0 },
                        include: [{
                            model: dbReader.products,
                            attributes: ['product_id', 'product_duration']
                        }]
                    }, {
                        required: false,
                        model: dbReader.transactionMaster,
                        attributes: ['transaction_id', 'transaction_type', 'request_json', 'response_json', 'status',
                            'parent_id', 'stripe_customer_id', 'stripe_card_id', 'charge_id', 'transaction_details'],
                        where: { type: 1 },
                        include: [{
                            model: dbReader.userCard
                        }, {
                            model: dbReader.stripeCustomer,
                            attributes: ['sycu_stripe_customer_id', 'stripe_customer_id']
                        }, {
                            required: false,
                            model: dbReader.paymentCheck
                        }]
                    }, {
                        separate: true,
                        model: dbReader.refunds
                    }, {
                        required: false,
                        as: 'shippingAddress',
                        model: dbReader.userAddress,
                        attributes: ['user_address_id', 'first_name', 'last_name', 'address_line1', 'address_line2', 'city',
                            'company', 'zipcode', 'state_id', 'country_id', 'phone_number', 'email_address', 'customer_shipping_note',
                            [dbReader.Sequelize.literal('`billingAddress->stateModel`.`state_code`'), 'state_code'],
                            [dbReader.Sequelize.literal('`billingAddress->stateModel`.`name`'), 'state_name']],
                        where: { address_type: 2, is_deleted: 0 },
                        include: [{
                            required: false,
                            model: dbReader.stateModel,
                            attributes: []
                        }]
                    }, {
                        required: false,
                        as: 'billingAddress',
                        model: dbReader.userAddress,
                        where: { address_type: 1, is_deleted: 0 },
                        attributes: ['user_address_id', 'first_name', 'last_name', 'address_line1', 'address_line2',
                            'city', 'company', 'zipcode', 'state_id', 'country_id', 'phone_number', 'email_address',
                            [dbReader.Sequelize.literal('`billingAddress->stateModel`.`state_code`'), 'state_code'],
                            [dbReader.Sequelize.literal('`billingAddress->stateModel`.`name`'), 'state_name']],
                        include: [{
                            required: false,
                            model: dbReader.stateModel,
                            attributes: []
                        }]
                    }, {
                        required: false,
                        model: dbReader.disputedTransaction,
                        attributes: ['status'],
                        where: { is_deleted: 0 }
                    }],
                    order: [['user_order_date', 'DESC']]
                }, {
                    separate: true,
                    model: dbReader.userMemberships,
                    where: { is_deleted: 0, status: 1 },
                    attributes: ['user_id', [dbReader.Sequelize.literal('`sycu_membership`.`membership_name`'), 'membership_name']],
                    include: [{
                        model: dbReader.membership,
                        attributes: []
                    }]
                }, {
                    separate: true,
                    model: dbReader.userSubscriptionItems,
                    attributes: ['user_subscription_item_id', 'user_subscription_id', 'product_name', 'product_id', 'product_amount',
                        'coupon_amount', 'shipping_fees', 'processing_fees', 'created_datetime', 'item_type', 'updated_product_name',
                        [dbReader.Sequelize.literal('`sycu_product`.`product_duration`'), 'product_duration'],
                        [dbReader.Sequelize.literal('`sycu_product`.`category_id`'), 'category_id'],
                        [dbReader.Sequelize.literal('`sycu_product`.`ministry_type`'), 'ministry_type'],
                        [dbReader.Sequelize.literal('`sycu_product`.`is_ministry_page`'), 'is_ministry_page'],
                        [dbReader.Sequelize.literal('`sycu_product`.`product_type`'), 'product_type']],
                    where: { is_deleted: 0, item_type: { [dbReader.Sequelize.Op.notIn]: [2, 3] } },
                    include: [{
                        model: dbReader.products,
                        attributes: []
                    }]
                }, {
                    required: false,
                    as: 'shippingAddress',
                    model: dbReader.userAddress,
                    attributes: ['user_address_id', 'first_name', 'last_name', 'address_line1', 'address_line2', 'city', 'company',
                        'zipcode', 'state_id', 'country_id', 'phone_number', 'email_address', 'customer_shipping_note',
                        [dbReader.Sequelize.literal('`billingAddress->stateModel`.`state_code`'), 'state_code'],
                        [dbReader.Sequelize.literal('`billingAddress->stateModel`.`name`'), 'state_name']],
                    where: { address_type: 2, is_deleted: 0 },
                    include: [{
                        required: false,
                        model: dbReader.stateModel,
                        attributes: []
                    }]
                }, {
                    model: dbReader.users,
                    attributes: ['user_id', 'first_name', 'last_name', 'email']
                }, {
                    model: dbReader.stripeCustomer,
                    required: false,
                    // attributes: [],
                    where: dbReader.sequelize.where(dbReader.sequelize.literal('`sycu_stripe_customer`.`user_id`'),
                        dbReader.sequelize.literal('`user_subscription`.`user_id`'))
                }, {
                    model: dbReader.userCard,
                    required: false,
                    // attributes: [],
                    where: dbReader.sequelize.and({ is_deleted: 0 },
                        dbReader.sequelize.where(dbReader.sequelize.literal('`sycu_stripe_customer`.`user_id`'),
                            dbReader.sequelize.literal('`user_subscription`.`user_id`'))
                    )
                }, {
                    required: false,
                    as: 'billingAddress',
                    model: dbReader.userAddress,
                    where: { address_type: 1, is_deleted: 0 },
                    attributes: ['user_address_id', 'first_name', 'last_name', 'address_line1', 'address_line2',
                        'city', 'company', 'zipcode', 'state_id', 'country_id', 'phone_number', 'email_address',
                        [dbReader.Sequelize.literal('`billingAddress->stateModel`.`state_code`'), 'state_code'],
                        [dbReader.Sequelize.literal('`billingAddress->stateModel`.`name`'), 'state_name']],
                    include: [{
                        required: false,
                        model: dbReader.stateModel,
                        attributes: []
                    }]
                }, {
                    required: false,
                    model: dbReader.paymentCheck,
                    include: [{
                        required: false,
                        model: dbReader.transactionMaster,
                        attributes: ['parent_id', 'transaction_type']
                    }]
                }, {
                    required: false,
                    model: dbReader.disputedTransaction,
                    attributes: ['status'],
                    where: { is_deleted: 0 }
                }]
            });
            if (subscriptionList) {
                subscriptionList = JSON.parse(JSON.stringify(subscriptionList));
                subscriptionList.is_payment_confirmed = -1
                if (subscriptionList.sycu_payment_check) {
                    if (subscriptionList.sycu_payment_check.sycu_transaction_master && subscriptionList.sycu_payment_check.sycu_transaction_master.transaction_type == 2) {
                        subscriptionList.sycu_payment_check.order_id = subscriptionList.sycu_payment_check.sycu_transaction_master.parent_id
                        delete subscriptionList.sycu_payment_check.sycu_transaction_master
                    } else {
                        delete subscriptionList.sycu_payment_check.sycu_transaction_master
                    }
                }
                subscriptionList.sycu_payment_checks = subscriptionList.sycu_payment_check ? subscriptionList.sycu_payment_check : null
                subscriptionList.disputed_status = (subscriptionList.sycu_disputed_transaction) ? subscriptionList.sycu_disputed_transaction.status : '';
                delete subscriptionList.sycu_disputed_transaction
                if (subscriptionList.user_orders.length) {
                    subscriptionList.user_orders.forEach((e: any) => {
                        e.disputed_status = (e.sycu_disputed_transaction) ? e.sycu_disputed_transaction.status : '';
                        // e.sycu_transaction_master = e.orderTransactions;
                        e.billingAddress = e.billingAddressForSubscription;
                        e.shippingAddress = e.shippingAddressForSubscription;
                        delete e.sycu_disputed_transaction, delete e.billingAddressForSubscription, delete e.shippingAddressForSubscription
                    })
                }
                if (subscriptionList.user_orders && subscriptionList.user_orders.length && subscriptionList.user_orders[0] && subscriptionList.pg_transaction_type == 2 &&
                    subscriptionList.user_orders[0].sycu_transaction_master && subscriptionList.user_orders[0].sycu_transaction_master.transaction_type == 2 &&
                    subscriptionList.user_orders[0].sycu_transaction_master.sycu_payment_check) {
                    subscriptionList.is_payment_confirmed = subscriptionList.user_orders[0].sycu_transaction_master.sycu_payment_check.is_payment_confirmed
                }
            }
            subscriptionList.total_amount = 0;
            let productIds: any = [], products_list: any = [], i = 0;
            if (subscriptionList.user_subscription_items && subscriptionList.user_subscription_items.length) {
                subscriptionList.user_subscription_items.forEach((e: any) => {
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
                while (i < subscriptionList.user_subscription_items.length) {
                    if (subscriptionList.user_subscription_items[i].item_type == 5) {
                        // validate coupon code
                        let couponDetails = {
                            coupon_code: subscriptionList.coupon_code ? subscriptionList.coupon_code : '',
                            coupon_ids: [subscriptionList.user_subscription_items[i].product_id],
                            user_id: subscriptionList.user_id,
                            site_id: subscriptionList.site_id,
                            products_list: products_list,
                            product_id: productIds,
                            user_subscription_id: subscriptionId,
                            is_instant_payment: 1
                        }
                        let couponValidation = await self.validateCouponCode(couponDetails)
                        if (couponValidation && couponValidation.isVerified && couponValidation.coupon_data && couponValidation.coupon_data.length) {
                            couponValidation.coupon_data.forEach((cd: any) => {
                                if (cd.coupon_id == subscriptionList.user_subscription_items[i].product_id) {
                                    subscriptionList.user_subscription_items[i].product_amount = cd.coupon_discount
                                }
                            })
                        }

                        let userOrdersIds: any = []
                        if (subscriptionList.user_orders.length) {
                            subscriptionList.user_orders.forEach((e: any) => {
                                userOrdersIds.push(e.user_orders_id)
                            });
                        }
                        let userCouponsData = await dbReader.coupons.findOne({
                            attributes: ['coupon_id', 'coupon_expire_date_time', 'user_used_limit'],
                            where: {
                                is_deleted: 0,
                                coupon_id: subscriptionList.user_subscription_items[i].product_id,
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
                            let TopCouponArray: any = []
                            userCouponsData = JSON.parse(JSON.stringify(userCouponsData));
                            if (subscriptionList && subscriptionList.user_orders && subscriptionList.user_orders.length) {
                                subscriptionList.user_orders.forEach((orderEle: any) => {
                                    if (orderEle.order_status != 7) {
                                        orderEle.user_order_items.forEach((item: any) => {
                                            if (item.item_type == 5 && (item.product_id == userCouponsData.coupon_id || item.updated_product_id == userCouponsData.coupon_id)) {
                                                let temp_coupon_id = (item.product_id == userCouponsData.coupon_id) ? item.product_id : item.updated_product_id;
                                                TopCouponArray.push({
                                                    user_coupon_id: 0,
                                                    user_id: subscriptionList.user_id,
                                                    coupon_id: temp_coupon_id,
                                                    user_orders_id: item.user_orders_id,
                                                    is_refund: false
                                                })
                                            }
                                        })
                                    }
                                })
                            }
                            if (userCouponsData.refunds && userCouponsData.refunds.length) {
                                userCouponsData.refunds.forEach((r: any) => {
                                    TopCouponArray.push({
                                        user_coupon_id: 0,
                                        user_id: subscriptionList.user_id,
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
                            subscriptionList.user_subscription_items[i].coupons = userCouponsData;
                        }
                    }
                    i++;
                }
                subscriptionList.user_subscription_items.forEach((e: any) => {
                    switch (e.item_type) {
                        case 1:
                            subscriptionList.total_amount += e.product_amount;
                            break;
                        case 2:
                            subscriptionList.total_amount += e.product_amount;
                            break;
                        case 3:
                            subscriptionList.total_amount += e.product_amount;
                            break;
                        case 4:
                            subscriptionList.total_amount += e.product_amount;
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
                            if (flag == true) subscriptionList.total_amount -= e.product_amount;
                            break;
                        default:
                            break;
                    }
                });
            }

            new SuccessResponse(EC.DataFetched, {
                user: null,
                //@ts-ignore
                token: req.token,
                subscription: subscriptionList
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    /**
     * get current user details
     * @param req
     * @param res
     * @returns
     */
    public getCurrentUserDetail(req: Request, res: Response) {
        //@ts-ignore
        let { hash_key, token, user_role, user_id, admin_user_id } = req;
        let isAdmin = user_role == 2 || user_role == 1;
        if (isAdmin && typeof req.body.user_id != undefined && req.body.user_id != null && req.body.user_id != "") {
            admin_user_id = user_id;
            user_id = req.body.user_id;
        }
        return { hash_key, token, user_role, user_id };
    }

    /**
     * get total number of subscriptions by subscription status
     * @param req
     * @param res
     */
    public async getTotalSubscriptions(req: Request, res: Response) {
        try {
            let { site_id } = req.params;
            let finalSubscriptionCount: any = [], totalSubscriptionCount = 0;

            let siteCond = dbReader.Sequelize.Op.ne, siteData = null;
            if (site_id) {
                siteCond = dbReader.Sequelize.Op.eq;
                siteData = site_id;
            }

            let subscriptionCount = await dbReader.userSubscription.count({
                where: { subscription_status: { [dbReader.Sequelize.Op.ne]: 0 }, site_id: { [siteCond]: siteData } },
                col: 'user_subscription_id',
                group: ['subscription_status']
            });

            let i = 1;
            while (i <= 8) {
                var subscriptionCountList = subscriptionCount.find((f: any) => f.subscription_status == i);
                if (subscriptionCountList) {
                    totalSubscriptionCount += subscriptionCountList.count
                    finalSubscriptionCount.push(subscriptionCountList);
                } else {
                    var appendCount = {
                        subscription_status: i,
                        count: 0
                    }
                    finalSubscriptionCount.push(appendCount);
                }
                i++;
            }

            finalSubscriptionCount.unshift({ subscription_status: 0, count: totalSubscriptionCount });

            new SuccessResponse(EC.DataFetched, {
                user: null,
                //@ts-ignore
                token: req.token,
                subscription: finalSubscriptionCount
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getSubscriptionData(req: Request, res: Response) {
        try {
            let { user_subscription_id } = req.params;
            let subscriptionData = await dbReader.userSubscription.findOne({
                where: { user_subscription_id: user_subscription_id },
                attributes: ['user_subscription_id', 'subscription_number', 'site_id']
            });
            subscriptionData = JSON.parse(JSON.stringify(subscriptionData));
            new SuccessResponse(EC.DataFetched, {
                user: null,
                //@ts-ignore
                token: req.token,
                ...subscriptionData
            }).send(res);
        } catch (err: any) {
            ApiError.handle(new BadRequestError(err.message), res);
        }
    }

    /*
    * rejectCancelSubscriptionRequest
    * @param req
    * @param res
    */
    public async rejectCancelSubscriptionRequest(req: Request, res: Response) {
        try {
            let { user_subscription_id } = req.body;
            // @ts-ignore
            let { display_name } = req

            /* find user_subscription_id */
            let findSubscription = await dbReader.userSubscription.findOne({
                where: { user_subscription_id: user_subscription_id },
                include: [{
                    separate: true,
                    model: dbReader.userOrder,
                    attributes: ['user_orders_id', 'user_subscription_id'],
                    order: [["user_orders_id", "DESC"]],
                    limit: 1,
                    include: [{
                        separate: true,
                        model: dbReader.userOrderItems,
                        where: { item_type: 1 },
                        include: [{
                            model: dbReader.products,
                        }]
                    }]
                }]
            })
            if (findSubscription) {
                findSubscription = JSON.parse(JSON.stringify(findSubscription));
                /* set pending cancellation status  */
                await dbWriter.userSubscription.update({
                    subscription_status: 2,
                    updated_datetime: new Date()
                }, {
                    where: { user_subscription_id: user_subscription_id }
                })

                let lastUserOrder = await dbReader.userOrder.findOne({
                    where: {
                        user_subscription_id: user_subscription_id,
                        order_status: 4
                    },
                    attributes: ["user_orders_id"],
                    order: [['user_orders_id', 'DESC']]
                })
                if (lastUserOrder) {
                    lastUserOrder = JSON.parse(JSON.stringify(lastUserOrder))
                    /* cancel all order of user  */
                    await dbWriter.userOrder.update({
                        order_status: 2,
                        updated_datetime: new Date()
                    }, {
                        where: { user_subscription_id: user_subscription_id, user_orders_id: lastUserOrder.user_orders_id }
                    });

                    /* retrieving membership of user  */
                    findSubscription = JSON.parse(JSON.stringify(findSubscription));
                    await dbWriter.userMemberships.update({
                        status: 2,
                        is_deleted: 0,
                        expires: findSubscription.next_payment_date,
                        updated_datetime: new Date()
                    }, {
                        where: { user_subscription_id: user_subscription_id, status: 4 }
                    });
                }

                try {
                    let apiLogData = {
                        user_id: findSubscription.user_id,
                        user_subscription_id: user_subscription_id,
                        subscription_status: 2
                    }
                    await dbWriter.apiLogs.create({
                        api_url: "/rejectCancelSubscriptionRequest",
                        method: "POST",
                        request: JSON.stringify(req.body),
                        response: JSON.stringify(apiLogData),
                        header: JSON.stringify(req.headers)
                    })
                } catch (error) {

                }

                let logList = [{
                    type: 2,
                    event_type_id: user_subscription_id,
                    message: "subscription #" + findSubscription.subscription_number + " reactivated while cancellation request rejected.",
                }]
                let noteList = [{
                    type: 2,
                    event_type_id: user_subscription_id,
                    message: "subscription #" + findSubscription.subscription_number + " reactivated while cancellation request rejected.",
                }]
                if (logList.length) {
                    await dbWriter.logs.bulkCreate(logList);
                }
                if (noteList.length) {
                    await dbWriter.notes.bulkCreate(noteList);
                }

                try {
                    //---------------- Update Active Campaign Tags & List --------------//
                    let productIdArray: any = [];
                    let subscription_items = await dbReader.userSubscriptionItems.findAll({
                        attributes: ["product_id"],
                        where: { user_subscription_id: user_subscription_id, is_deleted: 0 }
                    });
                    subscription_items = JSON.parse(JSON.stringify(subscription_items));
                    subscription_items.forEach((e: any) => {
                        if (e.product_id != 0) productIdArray.push(e.product_id)
                    });
                    let user_data = await dbReader.users.findOne({
                        attributes: ["email", "activecampaign_contact_id"],
                        where: { user_id: findSubscription.user_id, is_deleted: 0 }
                    });
                    user_data = JSON.parse(JSON.stringify(user_data));
                    let contact_id = user_data ? user_data.activecampaign_contact_id : 0;
                    if (contact_id) {
                        const addOrRemoveFlag = "add";
                        const activeCampaignData = {
                            'products': productIdArray,
                            'contact_id': contact_id,
                            'user_id': findSubscription.user_id,
                        }
                        let kids_flag: any = false, students_flag: any = false, removeTagsData: any = [], removeTagLogs: any = [];
                        findSubscription.user_orders[findSubscription.user_orders.length - 1]?.user_order_items.forEach((e: any) => {
                            if (e.sycu_product && e.sycu_product.ministry_type == 1 && e.sycu_product.site_id == 2) {
                                kids_flag = true;
                            }
                            if (e.sycu_product && e.sycu_product.ministry_type == 2 && e.sycu_product.site_id == 2) {
                                students_flag = true;
                            }
                        });
                        if (kids_flag) {
                            removeTagsData.push({
                                contact: contact_id,
                                tag: EnumObject.activecampaignTags.get("pending-cancellation-kids").value,
                            })
                            removeTagLogs.push({
                                type: 4,//AC 
                                event_type_id: findSubscription.user_id,
                                message: `'${EnumObject.activecampaignTagsTitle.get("pending-cancellation-kids").value}' tag removed from contact in active campaign`,
                            })
                        }
                        if (students_flag) {
                            removeTagsData.push({
                                contact: contact_id,
                                tag: EnumObject.activecampaignTags.get("pending-cancellation-students").value,
                            })
                            removeTagLogs.push({
                                type: 4,//AC 
                                event_type_id: findSubscription.user_id,
                                message: `'${EnumObject.activecampaignTagsTitle.get("pending-cancellation-students").value}' tag removed from contact in active campaign`,
                            })
                        }
                        await activeCampaign.activeCampaignMapProductsData(activeCampaignData, addOrRemoveFlag);
                        await activeCampaign.removeContactActiveCampaignTag(removeTagsData, false, removeTagLogs);
                    }
                } catch (e: any) {
                    console.log("Error in ActiveCampaign API call")
                }

                await dbWriter.notes.create({
                    type: 2, //Subscription
                    event_type_id: user_subscription_id,
                    message: "Subscription #" + findSubscription.subscription_number + " cancel request has been rejected by Admin (" + display_name + ")",
                    is_system: 1,
                    // @ts-ignore
                    user_id: req.user_id
                });

                new SuccessResponse(EC.rejectCancelSubscriptionSuccess, {
                    //@ts-ignore
                    token: req.token
                }).send(res);
            } else {
                /* throw error if user_subscription_id not found in db */
                new SuccessResponse(EC.noDataFound, {
                    //@ts-ignore
                    token: req.token
                }).send(res);
            }
        } catch (error: any) {
            ApiError.handle(new BadRequestError(error.message), res);
        }
    }

    // public async stripeWebhookAction(req: Request, res: Response) {
    //     try {
    //         const charge = req.body.data ? (req.body.data.object || null) : null;
    //         if (charge && charge.id) {
    //             let transactionMaster = await dbReader.transactionMaster.findOne({
    //                 where: { charge_id: charge.id },
    //                 include: [{
    //                     required: true,
    //                     model: dbReader.userOrder,
    //                     attributes: ['user_subscription_id', 'user_order_number', 'created_datetime', 'user_orders_id', 'total_amount', 'sub_amount'],
    //                     include: [{
    //                         required: true,
    //                         model: dbReader.userSubscription,
    //                         attributes: ['subscription_number'],
    //                     }, {
    //                         separate: true,
    //                         model: dbReader.userOrderItems,
    //                         order: ['item_type']
    //                     }]
    //                 }, {
    //                     required: true,
    //                     model: dbReader.users,
    //                     attributes: ['first_name', 'email']
    //                 }]
    //             })
    //             transactionMaster = JSON.parse(JSON.stringify(transactionMaster));
    //             if (transactionMaster) {
    //                 let amount = 0, refund_id = '', refund_status = '', refund_reason = ''
    //                 if (charge.refunds && charge.refunds.total_count > 0) {
    //                     amount = charge.refunds.data[0].amount ? charge.refunds.data[0].amount / 100 : 0
    //                     refund_id = charge.refunds.data[0].id
    //                     refund_status = charge.refunds.data[0].status
    //                     refund_reason = charge.refunds.data[0].reason
    //                 }
    //                 let existReturnData = await dbReader.refunds.count({
    //                     where: { stripe_refund_id: refund_id }
    //                 });
    //                 if (existReturnData == 0) {
    //                     var transaction = await dbWriter.transactionMaster.create({
    //                         user_id: transactionMaster.user_id,
    //                         site_id: transactionMaster.site_id,
    //                         transaction_type: 1,
    //                         type: 2,
    //                         parent_id: transactionMaster.parent_id,
    //                         request_json: JSON.stringify({ "charge_id": transactionMaster.charge_id }),
    //                         response_json: JSON.stringify(charge),
    //                         status: 'Success',
    //                         stripe_customer_id: transactionMaster.stripe_customer_id,
    //                         stripe_card_id: transactionMaster.stripe_card_id,
    //                         amount: amount,
    //                         created_datetime: moment().format("YYYY-MM-DD HH:mm:ss"),
    //                         charge_id: transactionMaster.charge_id,
    //                         payment_type: 1,
    //                         transaction_details: 'Subscription purchased'
    //                     });
    //                     let refundsData = await dbWriter.refunds.create({
    //                         user_id: transactionMaster.user_id,
    //                         site_id: transactionMaster.site_id,
    //                         charge_id: transactionMaster.charge_id,
    //                         order_id: transactionMaster.parent_id,
    //                         transaction_id: transaction.transaction_id,
    //                         stripe_refund_id: refund_id,
    //                         pg_customer_id: transactionMaster.stripe_customer_id,
    //                         pg_card_id: transactionMaster.stripe_card_id,
    //                         status: refund_status == "succeeded" ? 1 : 5,
    //                         refund_type: 1,
    //                         refund_amount: amount,
    //                         refund_reason: refund_reason ? refund_reason : null,
    //                         created_datetime: moment().format("YYYY-MM-DD HH:mm:ss")
    //                     });

    //                     let tempRefData = await dbReader.refunds.findAll({
    //                         where: {
    //                             order_id: transactionMaster.parent_id
    //                         }
    //                     })
    //                     let tempRefAmount: any = 0;
    //                     let refundData: any = []
    //                     tempRefData.forEach((e: any) => {
    //                         let tempDate = new Date(e.created_datetime)
    //                         let date = moment(tempDate).format('MMMM DD, YYYY, hh:mm A');
    //                         refundData.push({ 'amount': parseFloat(e.refund_amount).toFixed(2), 'date': date })
    //                         tempRefAmount += e.refund_amount
    //                     })

    //                     let orderTotal: any = parseFloat(transactionMaster.user_order.total_amount).toFixed(2)
    //                     tempRefAmount = parseFloat(tempRefAmount).toFixed(2)
    //                     if (transactionMaster.sycu_user && transactionMaster.user_order && transactionMaster.user_order.user_order_items) {
    //                         let OrderDetails: any = []
    //                         transactionMaster.user_order.user_order_items.forEach((element: any) => {
    //                             OrderDetails.push({
    //                                 product_name: element.product_name,
    //                                 product_amount: element.product_amount
    //                             })
    //                         });
    //                         await ObjectMail.ConvertData({
    //                             templateIdentifier: EnumObject.templateIdentifier.get('orderRefundSuccessfully').value,
    //                             orderNumber: transactionMaster.user_order.user_order_number,
    //                             user_id: transactionMaster.user_id,
    //                             first_name: transactionMaster.sycu_user.first_name,
    //                             user_subscription_id: transactionMaster.user_order.user_subscription_id,
    //                             subscriptionNumber: transactionMaster.user_order.user_subscription.subscription_number,
    //                             userOrderId: transactionMaster.user_order.user_orders_id,
    //                             orderCreatedDate: transactionMaster.user_order.created_datetime,
    //                             OrderDetails: OrderDetails,
    //                             orderSubTotal: transactionMaster.user_order.sub_amount,
    //                             paymentMethod: 1,
    //                             orderTotal: orderTotal,
    //                             refund_id: refundsData.refund_id,
    //                             refundData: refundData,
    //                             finalTotal: orderTotal - tempRefAmount,
    //                             site: transactionMaster.site_id,
    //                             user_email: transactionMaster.sycu_user.email,
    //                             SiteName: 'SYCU Account'
    //                         }, function (data: any) {
    //                             console.log('Email Send Successfully.')
    //                         });
    //                     }
    //                 }
    //                 new SuccessResponse(EC.success, {}).send(res)
    //             } else {
    //                 throw new Error("Transaction data not found.")
    //             }
    //         } else {
    //             throw new Error("Charge data not found.")
    //         }
    //     } catch (error: any) {
    //         ApiError.handle(new BadRequestError(error.message), res)
    //     }
    // }

    public async stripeWebhookAction(req: Request, res: Response) {
        try {
            let disputedTransactionId = 0, disputeStatus = '';
            const charge = req.body.data ? (req.body.data.object || null) : null;
            if (charge && charge.id) {
                //Raised dispute transaction
                if (req.body.type == "charge.dispute.created") {
                    let transactionData = await dbReader.transactionMaster.findOne({
                        attributes: ['transaction_id', 'amount'],
                        include: [{
                            attributes: ['user_orders_Id'],
                            model: dbReader.userOrder,
                            include: [{
                                attributes: ['user_subscription_id'],
                                model: dbReader.userSubscription,
                            }]
                        }],
                        where: { charge_id: charge.charge }
                    })
                    transactionData = JSON.parse(JSON.stringify(transactionData));
                    transactionData.transaction_id = transactionData ? transactionData.transaction_id : 0;
                    transactionData.amount = transactionData ? transactionData.amount : 0;
                    transactionData.user_orders_id = (transactionData && transactionData.user_order) ? transactionData.user_order.user_orders_Id : 0;
                    transactionData.user_subscription_id = (transactionData.user_order && transactionData.user_order.user_subscription) ? transactionData.user_order.user_subscription.user_subscription_id : 0;
                    //Insert a new entry in dispute transaction model while dispute created.
                    let disputeUpdateData = await dbReader.disputedTransaction.findOne({
                        where: { dispute_id: charge.id }
                    })
                    if (disputeUpdateData) {
                        disputeUpdateData = JSON.parse(JSON.stringify(disputeUpdateData))
                        disputedTransactionId = disputeUpdateData.disputed_transaction_id
                        disputeStatus = 'Updated'
                        await dbWriter.disputedTransaction.update({
                            reason: charge.reason ? charge.reason : '',
                            status: charge.status ? charge.status : '',
                        }, {
                            where: { dispute_id: charge.id }
                        })
                        new SuccessResponse(EC.success, {}).send(res)
                    } else {
                        let saveDispute = await dbWriter.disputedTransaction.create({
                            charge_id: charge.charge,
                            disputed_date: new Date(),
                            dispute_id: charge.id,
                            transaction_id: transactionData.transaction_id,
                            user_subscription_id: transactionData.user_subscription_id,
                            user_orders_id: transactionData.user_orders_id,
                            created_datetime: new Date(),
                            updated_datetime: new Date(),
                            amount: transactionData.amount,
                            reason: charge.reason ? charge.reason : '',
                            status: charge.status ? charge.status : '',
                            is_deleted: 0
                        })
                        if (saveDispute) {
                            saveDispute = JSON.parse(JSON.stringify(saveDispute))
                            disputedTransactionId = saveDispute.disputed_transaction_id
                            disputeStatus = 'Created'
                            new SuccessResponse(EC.success, {}).send(res)
                        }
                    }
                } else if (req.body.type == "charge.dispute.updated") {
                    //Insert a new entry in dispute transaction model while dispute created.
                    let disputeUpdateData = await dbReader.disputedTransaction.findOne({
                        where: { dispute_id: charge.id }
                    })
                    if (disputeUpdateData) {
                        disputeUpdateData = JSON.parse(JSON.stringify(disputeUpdateData))
                        disputedTransactionId = disputeUpdateData.disputed_transaction_id
                        disputeStatus = 'Updated'
                    }
                    await dbWriter.disputedTransaction.update({
                        reason: charge.reason ? charge.reason : '',
                        status: charge.status ? charge.status : '',
                    }, {
                        where: { dispute_id: charge.id }
                    })
                    new SuccessResponse(EC.success, {}).send(res)
                } else if (req.body.type == "charge.dispute.closed") {
                    //Insert a new entry in dispute transaction model while dispute created.
                    let disputeUpdateData = await dbReader.disputedTransaction.findOne({
                        where: { dispute_id: charge.id }
                    })
                    if (disputeUpdateData) {
                        disputeUpdateData = JSON.parse(JSON.stringify(disputeUpdateData))
                        disputedTransactionId = disputeUpdateData.disputed_transaction_id
                        disputeStatus = 'Updated'
                    }
                    await dbWriter.disputedTransaction.update({
                        reason: charge.reason ? charge.reason : '',
                        status: charge.status ? charge.status : '',
                    }, {
                        where: { dispute_id: charge.id }
                    })
                    new SuccessResponse(EC.success, {}).send(res)
                } else if (req.body.type == "charge.dispute.funds_reinstated") {
                    //Insert a new entry in dispute transaction model while dispute created.
                    let disputeUpdateData = await dbReader.disputedTransaction.findOne({
                        where: { dispute_id: charge.id }
                    })
                    if (disputeUpdateData) {
                        disputeUpdateData = JSON.parse(JSON.stringify(disputeUpdateData))
                        disputedTransactionId = disputeUpdateData.disputed_transaction_id
                        disputeStatus = 'Updated'
                    }
                    await dbWriter.disputedTransaction.update({
                        reason: charge.reason ? charge.reason : '',
                        status: charge.status ? charge.status : '',
                    }, {
                        where: { dispute_id: charge.id }
                    })
                    new SuccessResponse(EC.success, {}).send(res)
                } else if (req.body.type == "charge.dispute.funds_withdrawn") {
                    //Insert a new entry in dispute transaction model while dispute created.
                    let disputeUpdateData = await dbReader.disputedTransaction.findOne({
                        where: { dispute_id: charge.id }
                    })
                    if (disputeUpdateData) {
                        disputeUpdateData = JSON.parse(JSON.stringify(disputeUpdateData))
                        disputedTransactionId = disputeUpdateData.disputed_transaction_id
                        disputeStatus = 'Updated'
                    }
                    await dbWriter.disputedTransaction.update({
                        reason: charge.reason ? charge.reason : '',
                        status: charge.status ? charge.status : '',
                    }, {
                        where: { dispute_id: charge.id }
                    })
                    new SuccessResponse(EC.success, {}).send(res)
                } else if (req.body.type == "charge.refunded") {
                    let transactionMaster = await dbReader.transactionMaster.findOne({
                        where: { charge_id: charge.id },
                        include: [{
                            required: true,
                            model: dbReader.userOrder,
                            attributes: ['user_subscription_id', 'user_order_number', 'created_datetime', 'user_orders_id', 'total_amount', 'sub_amount'],
                            include: [{
                                required: true,
                                model: dbReader.userSubscription,
                                attributes: ['subscription_number'],
                            }, {
                                separate: true,
                                model: dbReader.userOrderItems,
                                order: ['item_type']
                            }]
                        }, {
                            required: true,
                            model: dbReader.users,
                            attributes: ['first_name', 'email']
                        }]
                    })
                    if (transactionMaster) {
                        transactionMaster = JSON.parse(JSON.stringify(transactionMaster));
                        let amount = 0, refund_id = '', refund_status = '', refund_reason = ''
                        if (charge.refunds && charge.refunds.total_count > 0) {
                            amount = charge.refunds.data[0].amount ? charge.refunds.data[0].amount / 100 : 0
                            refund_id = charge.refunds.data[0].id
                            refund_status = charge.refunds.data[0].status
                            refund_reason = charge.refunds.data[0].reason
                        }
                        let existReturnData = await dbReader.refunds.count({
                            where: { stripe_refund_id: refund_id }
                        });
                        if (existReturnData == 0) {
                            var transaction = await dbWriter.transactionMaster.create({
                                user_id: transactionMaster.user_id,
                                site_id: transactionMaster.site_id,
                                transaction_type: 1,
                                type: 2,
                                parent_id: transactionMaster.parent_id,
                                request_json: JSON.stringify({ "charge_id": transactionMaster.charge_id }),
                                response_json: JSON.stringify(charge),
                                status: 'Success',
                                stripe_customer_id: transactionMaster.stripe_customer_id,
                                stripe_card_id: transactionMaster.stripe_card_id,
                                amount: amount,
                                created_datetime: moment().format("YYYY-MM-DD HH:mm:ss"),
                                charge_id: transactionMaster.charge_id,
                                payment_type: 1,
                                transaction_details: 'Subscription purchased'
                            });
                            let refundsData = await dbWriter.refunds.create({
                                user_id: transactionMaster.user_id,
                                site_id: transactionMaster.site_id,
                                charge_id: transactionMaster.charge_id,
                                order_id: transactionMaster.parent_id,
                                transaction_id: transaction.transaction_id,
                                stripe_refund_id: refund_id,
                                pg_customer_id: transactionMaster.stripe_customer_id,
                                pg_card_id: transactionMaster.stripe_card_id,
                                status: refund_status == "succeeded" ? 1 : 5,
                                refund_type: 1,
                                refund_amount: amount,
                                refund_reason: refund_reason ? refund_reason : null,
                                created_datetime: moment().format("YYYY-MM-DD HH:mm:ss")
                            });
                            let tempRefData = await dbReader.refunds.findAll({
                                where: {
                                    order_id: transactionMaster.parent_id
                                }
                            })
                            let tempRefAmount: any = 0;
                            let refundData: any = []
                            tempRefData.forEach((e: any) => {
                                let tempDate = new Date(e.created_datetime)
                                let date = moment(tempDate).format('MMMM DD, YYYY, hh:mm A');
                                refundData.push({ 'amount': parseFloat(e.refund_amount).toFixed(2), 'date': date })
                                tempRefAmount += e.refund_amount
                            })
                            let orderTotal: any = parseFloat(transactionMaster.user_order.total_amount).toFixed(2)
                            tempRefAmount = parseFloat(tempRefAmount).toFixed(2)
                            if (transactionMaster.sycu_user && transactionMaster.user_order && transactionMaster.user_order.user_order_items) {
                                let OrderDetails: any = []
                                transactionMaster.user_order.user_order_items.forEach((element: any) => {
                                    OrderDetails.push({
                                        product_name: element.product_name,
                                        product_amount: element.product_amount
                                    })
                                });
                                await ObjectMail.ConvertData({
                                    templateIdentifier: EnumObject.templateIdentifier.get('orderRefundSuccessfully').value,
                                    orderNumber: transactionMaster.user_order.user_order_number,
                                    user_id: transactionMaster.user_id,
                                    first_name: transactionMaster.sycu_user.first_name,
                                    user_subscription_id: transactionMaster.user_order.user_subscription_id,
                                    subscriptionNumber: transactionMaster.user_order.user_subscription.subscription_number,
                                    userOrderId: transactionMaster.user_order.user_orders_id,
                                    orderCreatedDate: transactionMaster.user_order.created_datetime,
                                    OrderDetails: OrderDetails,
                                    orderSubTotal: transactionMaster.user_order.sub_amount,
                                    paymentMethod: 1,
                                    orderTotal: orderTotal,
                                    refund_id: refundsData.refund_id,
                                    refundData: refundData,
                                    finalTotal: orderTotal - tempRefAmount,
                                    site: transactionMaster.site_id,
                                    user_email: transactionMaster.sycu_user.email,
                                    SiteName: 'SYCU Account'
                                }, function (data: any) {
                                    console.log('Email Send Successfully.')
                                });
                            }
                        }
                        new SuccessResponse(EC.success, {}).send(res)
                    } else {
                        throw new Error("Transaction data not found.")
                    }
                } else if (req.body.type == "charge.succeeded") {
                    if (Object.keys(req.body.data.object.metadata).length === 0) {
                        var stripe_user_data = await dbReader.stripeCustomer.findOne({
                            where: { stripe_customer_id: req.body.data.object.customer },
                            attributes: ['user_id', 'sycu_stripe_customer_id']
                        })
                        if (stripe_user_data) {
                            stripe_user_data = JSON.parse(JSON.stringify(stripe_user_data));
                            var transaction = await dbWriter.transactionMaster.create({
                                user_id: stripe_user_data.user_id,
                                site_id: 0,
                                transaction_type: 1,
                                type: 2,
                                parent_id: 0,
                                request_json: JSON.stringify({ "charge_id": req.body.data.object.id }),
                                response_json: JSON.stringify(charge),
                                status: 'Success',
                                stripe_customer_id: stripe_user_data.sycu_stripe_customer_id,
                                stripe_card_id: 0,
                                amount: req.body.data.object.amount / 100,
                                created_datetime: moment().format("YYYY-MM-DD HH:mm:ss"),
                                charge_id: req.body.data.object.id,
                                payment_type: 1,
                                transaction_details: 'Stripe Dashboard Payment'
                            });
                        }
                    }
                    new SuccessResponse(EC.success, {}).send(res)
                }
            } else {
                throw new Error("Charge data not found.")
            }

            await dbWriter.disputeLogs.create({
                disputed_transaction_id: disputedTransactionId,
                charge_id: charge.id,
                charge: charge ? JSON.stringify(charge) : '',
                request_body: JSON.stringify(req.body),
                status: disputeStatus
            });
        } catch (error: any) {
            ApiError.handle(new BadRequestError(error.message), res)
        }
    }

    public async instantPayment(req: any, subscription_id: any) {
        try {
            //@ts-ignore
            let { display_name, user_role } = req
            let userSubscriptionData = await dbReader.userSubscription.findOne({
                where: { user_subscription_id: subscription_id },
                include: [{
                    separate: true,
                    model: dbReader.userSubscriptionItems,
                    where: { item_type: [1, 4], is_deleted: 0 },
                    include: [{
                        model: dbReader.products,
                        include: [{
                            model: dbReader.categories,
                            attributes: ['volume_count', 'category_id']
                        }]
                    }, {
                        required: false,
                        as: 'updated_sub_product',
                        model: dbReader.products,
                        include: [{
                            model: dbReader.categories,
                            attributes: ["volume_count", "category_id"],
                        }]
                    }],
                    order: ['item_type']
                }, {
                    model: dbReader.users,
                    where: { is_deleted: 0 }
                }, {
                    separate: true,
                    as: 'subscription_address',
                    model: dbReader.userAddress,
                    where: { is_deleted: 0 },
                    include: [{
                        model: dbReader.stateModel,
                        attributes: [['name', 'state_name']]
                    }, {
                        model: dbReader.countryModel,
                        attributes: [['name', 'country_name']]
                    }]
                }, {
                    separate: true,
                    as: 'user_memberships',
                    model: dbReader.userMemberships,
                    where: { is_deleted: 0, status: 2 }
                }, {
                    separate: true,
                    model: dbReader.userOrder,
                    where: { order_status: [2, 3, 8, 9, 10] },
                    order: ['user_orders_id', 'order_status'],
                    include: [{
                        model: dbReader.transactionMaster
                    }, {
                        separate: true,
                        model: dbReader.userOrderItems,
                        attributes: ['user_order_item_id', 'user_orders_id', 'product_id', 'item_type', 'renewal_count'],
                        where: { item_type: 1, is_deleted: 0 },
                        include: [{
                            model: dbReader.products,
                            attributes: ['product_duration', 'category_id', 'ministry_type', 'is_ministry_page'],
                            include: [{
                                model: dbReader.categories,
                                attributes: ['volume_count', 'category_id']
                            }]
                        }, {
                            required: false,
                            as: 'updated_product',
                            model: dbReader.products,
                            attributes: ["product_duration", "category_id", "ministry_type", "is_ministry_page", "is_shippable"],
                            include: [{
                                model: dbReader.categories,
                                attributes: ["volume_count", "category_id"],
                            }]
                        }]
                    }]
                }]
            });
            if (userSubscriptionData) {
                userSubscriptionData = JSON.parse(JSON.stringify(userSubscriptionData));
                let subscription_item = userSubscriptionData.user_subscription_items
                if (subscription_item.length) {
                    // Get Last Renewal & Update Block Status
                    let subscriptionRenewalDt = await dbReader.subscriptionRenewal.findOne({
                        where: {
                            user_subscription_id: subscription_id,
                            is_executed: 0,
                            is_deleted: 0,
                            is_instant_payment: 0
                        }
                    });
                    let _attempt_count = 0, _renewal_date = '', _subscription_renewal_id = 0
                    if (subscriptionRenewalDt) {
                        _attempt_count = subscriptionRenewalDt.attempt_count
                        _renewal_date = subscriptionRenewalDt.renewal_date
                        _subscription_renewal_id = subscriptionRenewalDt.subscription_renewal_id
                    }
                    await dbWriter.subscriptionRenewal.update({
                        is_instant_payment: 1,
                        end_date: new Date(),
                        updated_datetime: new Date(),
                        note: 'Instance payment activity called, delete this one and create new.'
                    }, {
                        where: {
                            user_subscription_id: subscription_id,
                            is_executed: 0,
                            is_deleted: 0,
                            is_instant_payment: 0
                        }
                    });
                    await dbWriter.subscriptionRenewalCronLog.update({
                        is_instant_payment: 1,
                        end_date: new Date()
                    }, {
                        where: {
                            user_subscription_id: subscription_id,
                            is_deleted: 0,
                            is_executed: 0
                        }
                    })
                    // Over

                    const self = new checkoutController();
                    let wrOrderItem: any = [],
                        wrPayment: any = [],
                        wickedReportOrderDetails: any = [],
                        hubSpotNewMembershipList: any = [],
                        hubSpotProductList: any = [];

                    let userSubscription = userSubscriptionData,
                        subscription_status = userSubscription?.subscription_status ?? "",
                        _user_subscription_id = userSubscription.user_subscription_id,
                        _is_recurring_subscription = userSubscription.is_recurring_subscription,
                        _site_id = userSubscription.site_id,
                        _user_id = userSubscription.user_id,
                        email = userSubscription.sycu_user?.email,
                        _subscription_number = userSubscription.subscription_number,
                        coupon_code = userSubscription.coupon_code,
                        coupon_ids = userSubscription.coupon_ids ? userSubscription.coupon_ids.split(',') : [],
                        pg_transaction_type = userSubscription.pg_transaction_type,
                        _pg_card_id = userSubscription.pg_card_id,
                        billingAddress: any = null

                    let shipping_amount = 0,
                        fees_amount = 0,
                        tax_amount = 0,
                        coupon_amount = 0,
                        final_amount = 0,
                        sub_amount = 0,
                        renew_amount = 0,
                        reccuring_amount = 0,
                        ip_address = (userSubscription?.user_orders) ? (userSubscription?.user_orders[0]?.ip_address ?? 0) : 0,
                        newOrderItemList: any = [],
                        geoDataList: any = [],
                        newOrderList: any = [],
                        newOrderAddress: any = [],
                        productIdsList: any = [],
                        OrderDetails: any = [],
                        productDetails: any = []

                    let logs: any = [],
                        notes: any = []

                    let description = "Main Product: "

                    // For Check Coupon Code Validity
                    let couponValidation: any = null, current_order_ministry_type: any = []
                    if (coupon_code || coupon_ids.length) {
                        let productIds: any = [], products_list: any = [];
                        subscription_item.forEach((element: any) => {
                            if (element.item_type == 1) {
                                //check if product is quarterly then renew with same price instead of product price
                                let basicQuarterlyProductFlag: any = false,
                                    basicProductFlag = (element.sycu_product.product_name.includes('Basic') || element.product_name.includes('Basic')) ? true : false,
                                    quarterlyProductFlag = ((element.sycu_product.product_name.includes('Quarterly') || element.product_name.includes('Quarterly')) && element.sycu_product.product_duration == 90) ? true : false;
                                if (element.item_type == 1 && basicProductFlag && quarterlyProductFlag) {
                                    basicQuarterlyProductFlag = true;
                                }
                                let product_total_amount = (basicQuarterlyProductFlag || basicQuarterlyProductFlag == true)
                                    ? element.product_amount : element.sycu_product.product_price;

                                productIds.push(element.product_id)
                                products_list.push({
                                    total_amount: element.sycu_product.shipping_fees + element.sycu_product.processing_fees + product_total_amount,
                                    shipping_fees: element.sycu_product.shipping_fees,
                                    processing_fees: element.sycu_product.processing_fees,
                                    product_price: product_total_amount
                                })
                            }
                        })

                        // validate coupon code
                        let couponDetails = {
                            coupon_code: coupon_code,
                            coupon_ids: coupon_ids ? coupon_ids : [],
                            user_id: _user_id,
                            site_id: _site_id,
                            products_list: products_list,
                            product_id: productIds,
                            user_subscription_id: subscription_id,
                            is_instant_payment: 1
                        }
                        couponValidation = await self.validateCouponCode(couponDetails)
                    }

                    var _temp_order_data = await dbWriter.sequelize.query(`call sp_createNewOrder(${_user_subscription_id})`)
                    let _user_order_id = 0;

                    // updating last order id of subsciption
                    await dbWriter.userSubscription.update({
                        last_order_id: _temp_order_data[0].user_orders_id
                    }, {
                        where: { user_subscription_id: _user_subscription_id }
                    });

                    subscription_item.forEach((element: any) => {
                        switch (element.item_type) {
                            case 1:
                                current_order_ministry_type.push({
                                    user_subscription_item_id: element.user_subscription_item_id,
                                    ministry_type: element.sycu_product.ministry_type,
                                    is_ministry_page: element.sycu_product.is_ministry_page,
                                    product_duration: element.sycu_product.product_duration,
                                    updated_product_name: element.updated_product_name,
                                    updated_product_id: element.updated_product_id,
                                })
                                productIdsList.push(element.product_id);
                                hubSpotProductList.push(element.product_id);
                                description += element.sycu_product.product_name + ", "
                                break;
                            case 2:
                                fees_amount = element.product_amount
                                break;
                            case 3:
                                shipping_amount = element.product_amount
                                break;
                            case 4:
                                tax_amount = element.product_amount
                                break;
                        }
                        if (element.item_type != 5) {
                            //check if product is quarterly then renew with same price instead of product price
                            let basicQuarterlyProductFlag: any = false,
                                basicProductFlag = (element.sycu_product.product_name.includes('Basic') || element.product_name.includes('Basic')) ? true : false,
                                quarterlyProductFlag = ((element.sycu_product.product_name.includes('Quarterly') || element.product_name.includes('Quarterly')) && element.sycu_product.product_duration == 90) ? true : false;
                            if (element.item_type == 1 && basicProductFlag && quarterlyProductFlag) {
                                basicQuarterlyProductFlag = true;
                            }

                            if (element.item_type == 1) {
                                renew_amount += ((basicQuarterlyProductFlag || basicQuarterlyProductFlag == true) ? element.product_amount : element.sycu_product.product_price)
                                reccuring_amount += ((basicQuarterlyProductFlag || basicQuarterlyProductFlag == true) ? element.product_amount : element.sycu_product.product_price)
                            }

                            OrderDetails.push({
                                user_orders_id: _temp_order_data[0].user_orders_id,
                                product_id: element.product_id,
                                user_subscription_item_id: element.user_subscription_item_id,
                                product_name: (element.item_type == 1) ? element.sycu_product.product_name : element.product_name,
                                product_amount: (element.item_type == 1)
                                    ? ((basicQuarterlyProductFlag || basicQuarterlyProductFlag == true)
                                        ? element.product_amount
                                        : element.sycu_product.product_price)
                                    : element.product_amount,
                                ministry_type: (element.item_type == 1) ? element.sycu_product.ministry_type : '',
                                is_ministry_page: (element.item_type == 1) ? element.sycu_product.is_ministry_page : '',
                                product_duration: (element.item_type == 1) ? element.sycu_product.product_duration : '',
                                item_type: element.item_type,
                                updated_product_name: (element.item_type == 1) ? element.updated_product_name : '',
                                updated_product_id: (element.item_type == 1) ? element.updated_product_id : '',
                            });
                            _user_order_id = _temp_order_data[0].user_orders_id;

                            final_amount += (element.item_type == 1)
                                ? ((basicQuarterlyProductFlag || basicQuarterlyProductFlag == true)
                                    ? element.product_amount
                                    : element.sycu_product.product_price)
                                : element.product_amount;
                            sub_amount += (element.item_type == 1)
                                ? ((basicQuarterlyProductFlag || basicQuarterlyProductFlag == true)
                                    ? element.product_amount
                                    : element.sycu_product.product_price)
                                : element.product_amount;

                            newOrderItemList.push({
                                user_orders_id: _temp_order_data[0].user_orders_id,
                                product_id: element.product_id,
                                product_name: (element.item_type == 1) ? element.sycu_product.product_name : element.product_name,
                                product_amount: (element.item_type == 1)
                                    ? ((basicQuarterlyProductFlag || basicQuarterlyProductFlag == true)
                                        ? element.product_amount
                                        : element.sycu_product.product_price)
                                    : element.product_amount,
                                shipping_fees: 0,
                                processing_fees: 0,
                                coupon_amount: 0,
                                renewal_count: 1,
                                item_type: element.item_type,
                                updated_product_name: (element.item_type == 1) ? element.updated_product_name : '',
                                updated_product_id: (element.item_type == 1) ? element.updated_product_id : ''
                            });
                            wrOrderItem.push({
                                order_item_id: _temp_order_data[0].user_orders_id,
                                product_id: element.product_id,
                                qty: 1,
                                price: (element.item_type == 1)
                                    ? ((basicQuarterlyProductFlag || basicQuarterlyProductFlag == true)
                                        ? element.product_amount
                                        : element.sycu_product.product_price)
                                    : element.product_amount
                            });
                        }
                    })

                    if ((coupon_code || coupon_ids) && couponValidation && couponValidation.billingAmount.coupon_discount != 0) {
                        renew_amount -= couponValidation.billingAmount.coupon_discount;
                        final_amount -= couponValidation.billingAmount.coupon_discount;
                        coupon_amount += couponValidation.billingAmount.coupon_discount;

                        if (couponValidation.coupon_data && couponValidation.coupon_data.length) {
                            couponValidation.coupon_data.forEach((s: any) => {
                                OrderDetails.push({
                                    user_orders_id: _temp_order_data[0].user_orders_id,
                                    product_id: s.coupon_id,
                                    user_subscription_item_id: 0,
                                    product_name: `Coupon("${s.coupon_code}") Discount`,
                                    product_amount: parseFloat(s.coupon_discount),
                                    ministry_type: '',
                                    is_ministry_page: '',
                                    product_duration: '',
                                    item_type: 5,
                                    updated_product_name: '',
                                    updated_product_id: '',
                                });
                                newOrderItemList.push({
                                    user_orders_id: _temp_order_data[0].user_orders_id,
                                    product_id: s.coupon_id,
                                    product_name: `Coupon("${s.coupon_code}") Discount`,
                                    product_amount: parseFloat(s.coupon_discount),
                                    shipping_fees: 0,
                                    processing_fees: 0,
                                    coupon_amount: 0,
                                    renewal_count: 1,
                                    item_type: 5,
                                    updated_product_name: '',
                                    updated_product_id: '',
                                });
                            })
                        }
                    }

                    let emailDataAddress = "";
                    if (userSubscription.subscription_address.length) {
                        userSubscription.subscription_address.forEach((element: any) => {
                            let orderAddress = JSON.parse(JSON.stringify(element));
                            const state_name = (orderAddress.stateModel) ? orderAddress.stateModel.state_name : (orderAddress.state_code ? orderAddress.state_code : ''),
                                country_name = (orderAddress.countryModel) ? orderAddress.countryModel.country_name : (orderAddress.country_code ? orderAddress.country_code : '')

                            delete orderAddress.stateModel;
                            delete orderAddress.countryModel;

                            orderAddress.user_address_id = 0;
                            orderAddress.user_subscription_id = 0;
                            orderAddress.user_orders_id = _temp_order_data[0].user_orders_id;
                            newOrderAddress.push(orderAddress);
                            if (!billingAddress) {
                                billingAddress = { ...orderAddress, state_name, country_name }
                            }

                            emailDataAddress = orderAddress.address_line1 + " " + orderAddress.address_line2 + "," + orderAddress.city + "," + state_name || '' + "," + country_name || ''
                        })
                    }

                    description = description.slice(0, -2);
                    description += " | Order number: " + _subscription_number

                    let order_date = moment().format("YYYY-MM-DD HH:mm:ss");
                    newOrderList.push({
                        user_orders_id: _temp_order_data[0].user_orders_id,
                        parent_user_order_id: userSubscription?.user_orders ? (userSubscription?.user_orders[userSubscription?.user_orders.length - 1]?.user_orders_id ?? 0) : 0,
                        user_order_date: order_date,
                        user_order_number: _temp_order_data[0].user_order_number,
                        user_subscription_id: _user_subscription_id,
                        user_id: _user_id,
                        order_status: 1,
                        sub_amount: sub_amount,
                        coupon_amount: parseFloat(coupon_amount + ""),
                        shipping_amount: shipping_amount,
                        fees_amount: fees_amount,
                        tax_amount: tax_amount,
                        total_amount: final_amount,
                        ip_address: ip_address,
                        description: description
                    });
                    wrPayment.push({
                        payment_date: moment(order_date).format('YYYY-MM-DD HH:mm:ss'),
                        amount: final_amount,
                        // [1=APPROVED, 2=FAILED, 3=REFUNDED, 4=PARTIALLY REFUNDED]
                        status: 1
                    });
                    wickedReportOrderDetails.push({
                        user_id: userSubscription.sycu_user?.user_id,
                        order_id: _temp_order_data[0].user_orders_id,
                        order_date: moment(order_date).format('YYYY-MM-DD HH:mm:ss'),
                        user_email: userSubscription.sycu_user?.email,
                        order_amount: final_amount,
                        country: billingAddress ? billingAddress.country_name : '',
                        city: billingAddress ? billingAddress.city : '',
                        state: billingAddress ? billingAddress.state_name : '',
                        subscription_id: _user_subscription_id,
                        user_IP: ip_address,
                        order_item: wrOrderItem,
                        payment: wrPayment
                    });
                    await dbWriter.userOrder.update({
                        parent_user_order_id: userSubscription?.user_orders ? (userSubscription?.user_orders[userSubscription?.user_orders.length - 1]?.user_orders_id ?? 0) : 0,
                        user_order_date: order_date,
                        user_order_number: _temp_order_data[0].user_order_number,
                        user_subscription_id: _user_subscription_id,
                        site_id: _site_id,
                        user_id: _user_id,
                        order_status: 1,
                        is_update: 1,
                        sub_amount: sub_amount,
                        coupon_amount: parseFloat(coupon_amount + ""),
                        shipping_amount: shipping_amount,
                        fees_amount: fees_amount,
                        tax_amount: tax_amount,
                        total_amount: final_amount,
                        is_from: 3
                    }, {
                        where: { user_orders_id: _temp_order_data[0].user_orders_id }
                    })

                    if (newOrderAddress.length) {
                        await dbWriter.userAddress.bulkCreate(newOrderAddress)
                    }

                    let site_payment_service_id = 0
                    if (userSubscription?.user_orders && userSubscription.user_orders[userSubscription.user_orders.length - 1] && userSubscription.user_orders[userSubscription.user_orders.length - 1].sycu_transaction_master) {
                        site_payment_service_id = userSubscription.user_orders[userSubscription.user_orders.length - 1].sycu_transaction_master.site_payment_service_id;
                    }

                    // Daksh Sorathia - Shift Code From Success payment Condition
                    // 2022-05-18
                    // Reason : Pass new membership name in stripe description

                    let duration = subscription_item ? subscription_item[0].sycu_product?.product_duration || 0 : 0;
                    let __nextDate: any = ""
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
                    // let end_date = moment(moment(moment().format("YYYY-MM-DD HH:mm:ss")).add(duration, 'days')).format("YYYY-MM-DD HH:mm:ss");
                    let end_date = __nextDate

                    // add membership or update membership details
                    // let existingMembership = userSubscription.user_memberships;
                    let existingSubscriptionMembership = userSubscription.user_memberships.filter((um: any) => um.user_subscription_id == _user_subscription_id);
                    let membershipDetailList = await dbReader.membership.findAll({
                        where: { is_deleted: 0 },
                        include: [{
                            where: { product_id: productIdsList, is_deleted: 0 },
                            model: dbReader.membershipProduct,
                            include: [{
                                model: dbReader.products,
                                include: [{
                                    model: dbReader.categories,
                                }]
                            }]
                        }]
                    });
                    membershipDetailList = JSON.parse(JSON.stringify(membershipDetailList))
                    let addMembershipIds = membershipDetailList.filter((f: any) => !existingSubscriptionMembership.some((a: any) => a.membership_id == f.membership_id)) ?? [];

                    // add membership for the new product
                    // 29-04-2022 - Daksh
                    let userMembershipList: any = [], _userMembershipList: any = []
                    let _description = ""
                    let newOrderMinistryType: any = [], newOrderMinistryPage: any = []
                    for (let i = 0; i < addMembershipIds.length; i++) {
                        if (addMembershipIds[i].membership_id != 0) {
                            newOrderMinistryPage = newOrderMinistryPage.concat(addMembershipIds[i].sycu_membership_products.map((s: any) => s.sycu_product.is_ministry_page))
                            newOrderMinistryType = newOrderMinistryType.concat(addMembershipIds[i].sycu_membership_products.map((s: any) => s.sycu_product.ministry_type))
                            _userMembershipList.push({
                                product_ids: addMembershipIds[i].sycu_membership_products,
                                user_id: _user_id,
                                membership_id: addMembershipIds[i].membership_id,
                                status: 2,
                                user_orders_id: _temp_order_data[0].user_orders_id,
                                user_subscription_id: userSubscription.user_subscription_id,
                                start_date: dateTime(timestamp()),
                                expires: end_date,
                                site_id: _site_id,
                                membership_name: addMembershipIds[i].membership_name
                            });
                        }
                    }

                    // Allocate New Volume based on renewal counts                                     
                    if (userSubscription.user_orders && userSubscription.user_orders.length) {
                        let renewal_counts_data: any = []
                        userSubscription.user_orders.forEach((element: any) => {
                            element.user_order_items.forEach((element1: any) => {
                                let orderProduct = (element1.sycu_product.product_duration > 360)
                                    ? (element1.updated_product ? element1.updated_product : element1.sycu_product)
                                    : element1.sycu_product;

                                if (element1.sycu_product.product_duration > 360) {
                                    subscription_item.forEach((si: any) => {
                                        if (si.item_type == 1) {
                                            let subProduct = si.updated_sub_product ? si.updated_sub_product : si.sycu_product;
                                            if (subProduct.sycu_category && subProduct.sycu_category.volume_count > orderProduct.sycu_category.volume_count) {
                                                orderProduct = subProduct
                                            }
                                        }
                                    })
                                }

                                let ind2 = renewal_counts_data.findIndex((element2: any) => element2.ministry_type == element1.sycu_product.ministry_type)
                                if (ind2 >= 0) {
                                    renewal_counts_data[ind2].product_duration = renewal_counts_data[ind2].product_duration + orderProduct.product_duration
                                    renewal_counts_data[ind2].is_ministry_page = orderProduct.is_ministry_page
                                    renewal_counts_data[ind2].product_id = orderProduct.product_id
                                    renewal_counts_data[ind2].last_product_duration = orderProduct.product_duration;
                                    renewal_counts_data[ind2].last_product_volume_count = orderProduct && orderProduct.sycu_category ? orderProduct.sycu_category.volume_count : 0;
                                } else {
                                    hubSpotProductList.push(orderProduct.product_id);
                                    renewal_counts_data.push({
                                        product_duration: orderProduct.product_duration,
                                        is_ministry_page: orderProduct.is_ministry_page,
                                        category_id: orderProduct.category_id,
                                        product_id: orderProduct.product_id,
                                        ministry_type: orderProduct.ministry_type,
                                        volume_count: orderProduct.sycu_category ? orderProduct.sycu_category.volume_count : 0,
                                        last_product_duration: orderProduct.product_duration,
                                        last_product_volume_count: orderProduct && orderProduct.sycu_category ? orderProduct.sycu_category.volume_count : 0,
                                    })
                                }
                            })
                        })
                        if (renewal_counts_data.length) {
                            let nvc = 8
                            renewal_counts_data.forEach((element: any) => {
                                if (element.last_product_duration > 360) {
                                    element.new_vol = ((element.last_product_volume_count + 1) > 7) ? nvc : (element.last_product_volume_count + 1);
                                } else {
                                    let ct = Math.floor(element.product_duration / 360);
                                    if (ct >= 1 && element.volume_count != 0) {
                                        element.new_vol = ((element.volume_count + ct) > 7) ? nvc : (element.volume_count + ct);
                                    } else {
                                        element.new_vol = 0;
                                    }
                                }
                            })
                            let _count_vol = renewal_counts_data.filter((e: any) => e.new_vol != 0).map((e: any) => e.new_vol)
                            if (_count_vol.length) {
                                let category = await dbReader.categories.findAll({
                                    where: { is_deleted: 0, parent_category_id: 0, volume_count: _count_vol },
                                    include: [{
                                        separate: true,
                                        model: dbReader.membership,
                                        where: {
                                            is_deleted: 0,
                                            ministry_type: current_order_ministry_type.map((s: any) => s.ministry_type),
                                            is_ministry_page: current_order_ministry_type.map((s: any) => s.is_ministry_page)
                                        }
                                    }]
                                })
                                if (category.length) {
                                    category = JSON.parse(JSON.stringify(category));
                                    category.forEach((element: any) => {
                                        let _volume_counts = element.volume_count
                                        if (element.sycu_memberships.length) {
                                            element.sycu_memberships.forEach((element2: any) => {
                                                if (renewal_counts_data.some((s: any) => s.new_vol == _volume_counts && s.ministry_type == element2.ministry_type) &&
                                                    current_order_ministry_type.some((s: any) => s.ministry_type == element2.ministry_type && s.is_ministry_page == element2.is_ministry_page)) {
                                                    if (!existingSubscriptionMembership.some((m: any) => m.membership_id == element2.membership_id)) {
                                                        if (element2.membership_id != 0) {
                                                            userMembershipList.push({
                                                                user_id: _user_id,
                                                                membership_id: element2.membership_id,
                                                                user_subscription_id: _user_subscription_id,
                                                                status: 2,
                                                                user_orders_id: _temp_order_data[0].user_orders_id,
                                                                start_date: dateTime(timestamp()),
                                                                expires: end_date,
                                                                site_id: _site_id,
                                                                ministry_type: element2.ministry_type,
                                                                membership_name: element2.membership_name
                                                            })
                                                        }
                                                    } else {
                                                        let ind3 = _userMembershipList.findIndex((_element: any) => _element.product_ids.some((u: any) => u.sycu_product.ministry_type == element2.ministry_type) && _element.product_ids.some((u: any) => u.sycu_product.sycu_category.volume_count <= _volume_counts))
                                                        if (ind3 >= 0) {
                                                            _userMembershipList.splice(ind3, 1);
                                                        }
                                                    }
                                                }
                                            })
                                        } else {
                                            let ind3 = _userMembershipList.findIndex((_element: any) => _element.product_ids.some((u: any) => u.sycu_product.ministry_type == current_order_ministry_type.map((s: any) => s.ministry_type)) && _element.product_ids.some((u: any) => u.sycu_product.is_ministry_page == current_order_ministry_type.map((s: any) => s.is_ministry_page)))
                                            if (ind3 >= 0) {
                                                _userMembershipList.splice(ind3, 1);
                                            }
                                        }
                                    })
                                } else {
                                    let ind3 = _userMembershipList.findIndex((_element: any) => _element.product_ids.some((u: any) => u.sycu_product.ministry_type == current_order_ministry_type.map((s: any) => s.ministry_type)) && _element.product_ids.some((u: any) => u.sycu_product.is_ministry_page == current_order_ministry_type.map((s: any) => s.is_ministry_page)))
                                    if (ind3 >= 0) {
                                        _userMembershipList.splice(ind3, 1);
                                    }
                                }
                            }
                        }
                    }

                    _userMembershipList.forEach((_element: any) => {
                        if (!userMembershipList.some((g: any) => _element.product_ids.some((u: any) => u.sycu_product.ministry_type == g.ministry_type))) {
                            delete _element.product_ids
                            userMembershipList.push(_element)
                        }
                    });

                    let membership_name_list: any = [];
                    userMembershipList.forEach((element: any) => {
                        hubSpotNewMembershipList.push(element.membership_id);
                        delete element.ministry_type
                        _description += element.membership_name + ", "
                        membership_name_list.push(element.membership_name);
                        delete element.membership_name
                    });

                    // Related to email receipt changes
                    // Daksh 24-06-2022
                    let updateSubscriptionItemData: any = []
                    if (hubSpotNewMembershipList.length) {
                        let newMembershipProducts = await dbReader.membershipProduct.findAll({
                            where: { membership_id: hubSpotNewMembershipList, is_deleted: 0 },
                            include: [{
                                separate: true,
                                as: 'membership_products',
                                model: dbReader.products,
                                where: {
                                    is_deleted: 0,
                                    ministry_type: current_order_ministry_type.map((s: any) => s.ministry_type),
                                    is_ministry_page: current_order_ministry_type.map((s: any) => s.is_ministry_page),
                                    product_duration: current_order_ministry_type.map((s: any) => s.product_duration)
                                }
                            }]
                        })
                        if (newMembershipProducts.length) {
                            newMembershipProducts = JSON.parse(JSON.stringify(newMembershipProducts))
                            newMembershipProducts.forEach((element: any) => {
                                if (element && element.membership_products && element.membership_products.length) {
                                    element.membership_products.forEach((element: any) => {
                                        let _ind = OrderDetails.findIndex((s: any) => s.ministry_type == element.ministry_type &&
                                            s.is_ministry_page == element.is_ministry_page && s.product_duration == element.product_duration)
                                        if (_ind >= 0) {
                                            OrderDetails[_ind].updated_product_name = element.product_name
                                            OrderDetails[_ind].updated_product_id = element.product_id

                                            updateSubscriptionItemData.push({
                                                user_subscription_item_id: OrderDetails[_ind].user_subscription_item_id,
                                                updated_product_amount: element.product_price,
                                                updated_product_name: element.product_name,
                                                updated_product_id: element.product_id
                                            })

                                            let _ind1 = newOrderItemList.findIndex((s: any) => s.user_orders_id == OrderDetails[_ind].user_orders_id &&
                                                s.item_type == OrderDetails[_ind].item_type && s.product_id == OrderDetails[_ind].product_id)
                                            if (_ind1 >= 0) {
                                                newOrderItemList[_ind1].updated_product_name = element.product_name
                                                newOrderItemList[_ind1].updated_product_id = element.product_id
                                            }
                                        }
                                    });
                                }
                            });
                        }
                    }

                    if (newOrderItemList.length) {
                        //add renewal count in order item
                        let arrPastProducts: any = [];
                        if (userSubscriptionData.user_orders && userSubscriptionData.user_orders.length) {
                            userSubscriptionData.user_orders.forEach((element: any) => {
                                if (element.order_status != 1 && element.order_status != 7 && element.user_order_items.length) {
                                    element.user_order_items.forEach((item: any) => {
                                        if (item.renewal_count != 0 && item.sycu_product.product_duration != 365) {
                                            arrPastProducts.push({
                                                "product_id": item.product_id,
                                                "renewal_count": item.renewal_count,
                                                "user_orders_id": item.user_orders_id,
                                                "ministry_type": item.sycu_product.ministry_type,
                                                "product_duration": item.sycu_product.product_duration,
                                            });
                                        }
                                    });
                                }
                            });
                        }

                        let s = 0;
                        while (s < newOrderItemList.length) {
                            let productData = await dbReader.products.findOne({
                                where: { product_id: newOrderItemList[s].product_id }
                            });
                            if (productData) {
                                productData = JSON.parse(JSON.stringify(productData));
                                let past_products = arrPastProducts.filter((p: any) =>
                                    p.ministry_type == productData.ministry_type &&
                                    p.product_duration == productData.product_duration);

                                if (past_products.length) {
                                    past_products = past_products.sort(function (a: any, b: any) {
                                        return b.user_orders_id - a.user_orders_id;
                                    });
                                    let count = past_products[0].renewal_count;
                                    if (past_products[0].product_duration == 30) {
                                        newOrderItemList[s].renewal_count = count >= 12 ? 1 : count + 1;
                                    }
                                    if (past_products[0].product_duration == 90) {
                                        newOrderItemList[s].renewal_count = count >= 4 ? 1 : count + 1;
                                    }
                                }
                                if (newOrderItemList[s].item_type == 1) {
                                    productDetails.push({
                                        product_name: newOrderItemList[s].updated_product_name ?
                                            newOrderItemList[s].updated_product_name : newOrderItemList[s].product_name,
                                        product_duration: productData.product_duration,
                                        renewal_count: newOrderItemList[s].renewal_count,
                                    });
                                }
                            }
                            s++;
                        }

                        let addressData = userSubscriptionData.subscription_address.filter((e: any) => e.address_type == 1).length ?
                            userSubscriptionData.subscription_address.filter((e: any) => e.address_type == 1) :
                            userSubscriptionData.subscription_address.filter((e: any) => e.address_type == 2)

                        let orderItemData = await dbWriter.userOrderItems.bulkCreate(newOrderItemList)
                        if (orderItemData.length) {
                            orderItemData = JSON.parse(JSON.stringify(orderItemData))
                            orderItemData.forEach((element: any) => {
                                let config_id = 0
                                if (element.product_name.includes("Kid")) {
                                    // config_id = EnumObject.geoConfigData.get("kids").value
                                    config_id = 1
                                } else if (element.product_name.includes("Student")) {
                                    // config_id = EnumObject.geoConfigData.get("students").value
                                    config_id = 2
                                } else if (element.product_name.includes("Group")) {
                                    // config_id = EnumObject.geoConfigData.get("groups").value
                                    config_id = 3
                                } else if (element.product_name.includes("Hub")) {
                                    // config_id = EnumObject.geoConfigData.get("hub").value
                                    config_id = 4
                                } else if (element.product_name.includes("Slider")) {
                                    // config_id = EnumObject.geoConfigData.get("slider").value
                                    config_id = 5
                                } else if (element.product_name.includes("People")) {
                                    // config_id = EnumObject.geoConfigData.get("people").value
                                    config_id = 6
                                } else if (element.product_name.includes("Builder")) {
                                    // config_id = EnumObject.geoConfigData.get("builder").value
                                    config_id = 7
                                } else if (element.product_name.includes("Together")) {
                                    // config_id = EnumObject.geoConfigData.get("builder").value
                                    config_id = 8
                                }
                                if (element.item_type == 1) {
                                    geoDataList.push({
                                        email_address: userSubscription.sycu_user.email,
                                        user_id: _user_id,
                                        user_orders_id: element.user_orders_id,
                                        user_order_item_id: element.user_order_item_id,
                                        user_subscription_id: userSubscriptionData.user_subscription_id,
                                        first_name: userSubscription.sycu_user.first_name,
                                        last_name: userSubscription.sycu_user.last_name,
                                        address: (addressData.length) ? (addressData[0].address_line1 + " " + addressData[0].address_line2 + "," + addressData[0].city + "," + (addressData[0]?.stateModel?.state_name ?? '') + "," + (addressData[0]?.countryModel?.country_name ?? '')) : '',
                                        user_address_id: (addressData.length) ? addressData[0].user_address_id : 0,
                                        product_id: element.product_id,
                                        // city: addressData[0].city,
                                        zipcode: (addressData.length) ? addressData[0].zipcode : '',
                                        latitude: (addressData.length) ? (addressData[0].latitude || 0) : 0,
                                        longitude: (addressData.length) ? (addressData[0].longitude || 0) : 0,
                                        geo_config_id: config_id,
                                    })
                                }
                            });
                        }
                    }

                    // Membership title list
                    if (_description) {
                        _description = _description.substring(0, _description.length - 2);
                        description += ` | Renewed Subscription With Product: ${_description}`
                        if (newOrderList.length) {
                            newOrderList[0].description = description
                        }
                    }

                    let paymentResponse: any = {
                        isPaymentSuccessful: true,
                        message: ''
                    }
                    let subStatus = hubSpotNewMembershipList.length ? 'Subscription renewed' : ''
                    // Email
                    let emailPayload = [{
                        user_subscription_id: _user_subscription_id,
                        // Renew: subStatus == 'Subscription renewed' ? "Renew" : subStatus == 'Subscription renewed' ? "Payment" : "",
                        Renew: subStatus == 'Subscription renewed' ? "Renew" : "Payment",
                        isRecurringSubscription: _is_recurring_subscription || 0,
                        user_id: _user_id,
                        first_name: userSubscription.sycu_user?.first_name || '',
                        user_email: userSubscription.sycu_user?.email || '',
                        orderNumber: (_temp_order_data) ? _temp_order_data[0].user_order_number : '',
                        subscriptionNumber: _subscription_number,
                        orderCreatedDate: moment().format("YYYY-MM-DD HH:mm:ss"),
                        OrderDetails: OrderDetails,
                        productDetails: productDetails,
                        userOrderId: _temp_order_data[0].user_orders_id,
                        orderSubTotal: sub_amount,
                        paymentMethod: 1,
                        orderTotal: final_amount,
                        SubscriptionDetails: [{
                            start_date: moment().format("YYYY-MM-DD HH:mm:ss"),
                            end_date: moment(end_date).format("YYYY-MM-DD HH:mm:ss"),
                            total_amount: reccuring_amount
                        }],
                        site: _site_id,
                        templateIdentifier: EnumObject.templateIdentifier.get('orderRenewedSuccessfully').value,
                        failedFlag: 0,
                        billingAddress: emailDataAddress,
                        SiteName: 'Grow ' + ((EnumObject.siteIdEnum.get(_site_id.toString()).value) ? _.capitalize(EnumObject.siteIdEnum.get(_site_id.toString()).value) : 'Account')
                    }]

                    // Daksh => 26-01-2023
                    let is_payment_confirmed = 1,
                        response_json = JSON.stringify({ "message": "Purchase with coupon and check attached with subscription" }),
                        global_status = 2,
                        transaction_status = "Success"

                    if (final_amount != 0) {
                        if (pg_transaction_type == 1) {
                            if (userSubscription.pg_customer_id && userSubscription.pg_card_id) {
                                // Take payment
                                let paymentDetails = {
                                    site_id: _site_id,
                                    user_id: _user_id,
                                    check_out_amount: Math.round(final_amount * 100) ?? 0,
                                    orderDetailsList: newOrderList,
                                    // Last Payment Made From Details
                                    _site_payment_service_id: site_payment_service_id,
                                    // System Customer Table PK_ID
                                    pg_customer_id: userSubscription.pg_customer_id,
                                    // System Card Table PK_ID
                                    pg_customer_card_id: userSubscription.pg_card_id,
                                    transaction_details: hubSpotNewMembershipList.length ? 'Subscription renewed' : ''
                                }
                                try {
                                    paymentResponse = await self.takePaymentAndSaveCard(paymentDetails);
                                } catch (e: any) {
                                    paymentResponse = {
                                        isPaymentSuccessful: false,
                                        message: e.message
                                    }
                                }
                            } else {
                                paymentResponse = {
                                    isPaymentSuccessful: false,
                                    message: "There is no card found with a subscription. The payment can't proceed further. Please attach a valid card with a subscription."
                                }
                                for (let i = 0; i < newOrderList.length; i++) {
                                    let parent_id = newOrderList[i].user_orders_id;
                                    await dbWriter.transactionMaster.create({
                                        site_payment_service_id: 0,
                                        site_id: _site_id,
                                        user_id: _user_id,
                                        response_json: JSON.stringify(paymentResponse),
                                        request_json: JSON.stringify({
                                            subscription_id: subscription_id
                                        }),
                                        status: "failure",
                                        stripe_customer_id: 0,
                                        stripe_card_id: 0,
                                        amount: final_amount,
                                        charge_id: '',
                                        created_date: moment().unix(),
                                        transaction_type: 1,
                                        type: 1,
                                        parent_id: parent_id,
                                        payment_type: 1,
                                        transaction_details: hubSpotNewMembershipList.length ? 'Subscription renewed' : ''
                                    });
                                }
                            }
                        } else {
                            let paymentCheck = await dbReader.paymentCheck.findOne({
                                where: { payment_check_id: _pg_card_id }
                            });
                            if (paymentCheck) {
                                is_payment_confirmed = paymentCheck.is_payment_confirmed
                                response_json = JSON.stringify(paymentCheck)
                            }
                            if (is_payment_confirmed == 0) {
                                global_status = 9
                                transaction_status = "Pending Check"
                            }
                            for (let i = 0; i < newOrderList.length; i++) {
                                let parent_id = newOrderList[i].user_orders_id;
                                await dbWriter.transactionMaster.create({
                                    site_payment_service_id: 0,
                                    site_id: _site_id,
                                    user_id: _user_id,
                                    response_json: response_json,
                                    request_json: JSON.stringify({
                                        subscription_id: subscription_id
                                    }),
                                    status: transaction_status,
                                    stripe_customer_id: 0,
                                    stripe_card_id: _pg_card_id,
                                    amount: final_amount,
                                    charge_id: '',
                                    created_date: moment().unix(),
                                    transaction_type: pg_transaction_type,
                                    type: 1,
                                    parent_id: parent_id,
                                    payment_type: 1,
                                    transaction_details: hubSpotNewMembershipList.length ? 'Subscription renewed' : ''
                                });
                            }
                        }
                    } else {
                        for (let i = 0; i < newOrderList.length; i++) {
                            let parent_id = newOrderList[i].user_orders_id;
                            await dbWriter.transactionMaster.create({
                                site_payment_service_id: 0,
                                site_id: _site_id,
                                user_id: _user_id,
                                response_json: JSON.stringify({ "message": "Purchase with coupon" }),
                                request_json: JSON.stringify({ subscription_id: subscription_id }),
                                status: 'Success',
                                stripe_customer_id: 0,
                                stripe_card_id: 0,
                                amount: 0,
                                charge_id: '',
                                created_date: moment().unix(),
                                transaction_type: 1,
                                type: 1,
                                parent_id: parent_id,
                                payment_type: 1,
                                transaction_details: hubSpotNewMembershipList.length ? 'Subscription renewed' : ''
                            });
                        }
                    }

                    let res_data = true, message_data = ''

                    // payment success
                    let templateIdentifier = EnumObject.templateIdentifier.get('orderFailed').value;
                    let getUser = await dbReader.users.findOne({
                        attributes: ['activecampaign_contact_id'],
                        where: { user_id: _user_id }
                    });
                    getUser = JSON.parse(JSON.stringify(getUser));
                    let contact_id = getUser ? (getUser.activecampaign_contact_id ? getUser.activecampaign_contact_id : 0) : 0;
                    if (paymentResponse.isPaymentSuccessful) {
                        // Order item add after data update in array & subscription item update
                        // Daksh 24-06-2022
                        if (updateSubscriptionItemData.length) {
                            let _update_subscription_item_id: any = [],
                                updated_product_amount = "case user_subscription_item_id",
                                updated_product_name = "case user_subscription_item_id",
                                updated_product_id = "case user_subscription_item_id";

                            updateSubscriptionItemData.forEach((element: any) => {
                                _update_subscription_item_id.push(element.user_subscription_item_id);
                                updated_product_amount += " when " + element.user_subscription_item_id + " then '" + element.updated_product_amount + "'";
                                updated_product_name += " when " + element.user_subscription_item_id + " then '" + element.updated_product_name + "'";
                                updated_product_id += " when " + element.user_subscription_item_id + " then " + element.updated_product_id;
                            });
                            if (_update_subscription_item_id.length) {
                                updated_product_amount += " else product_amount end";
                                updated_product_name += " else updated_product_name end";
                                updated_product_id += " else updated_product_id end";
                                await dbWriter.userSubscriptionItems.update({
                                    updated_product_name: dbWriter.Sequelize.literal(updated_product_name),
                                    updated_product_id: dbWriter.Sequelize.literal(updated_product_id),
                                    // product_amount: dbWriter.Sequelize.literal(updated_product_amount),
                                    updated_datetime: moment().format("YYYY-MM-DD HH:mm:ss")
                                }, {
                                    where: { user_subscription_item_id: _update_subscription_item_id }
                                });
                            }
                        }

                        templateIdentifier = EnumObject.templateIdentifier.get('orderRenewedSuccessfully').value;
                        if (pg_transaction_type == 2) {
                            if (is_payment_confirmed == 1) {
                                emailPayload = emailPayload.map((s: any) => {
                                    return {
                                        ...s,
                                        isCheckPayment: true,
                                        paymentMethod: 2
                                    }
                                })
                            } else {
                                templateIdentifier = '';
                            }
                        }

                        // affiliate available
                        let affiliateReferrals = await dbReader.affiliateReferrals.findAll({
                            where: dbReader.Sequelize.where(dbReader.Sequelize.fn('FIND_IN_SET', _user_subscription_id, dbReader.Sequelize.col('user_subscription_id')), { [dbReader.Sequelize.Op.gt]: 0 }),
                            order: ['affiliate_referral_id'],
                            include: [{
                                model: dbReader.affiliates
                            }]
                        })
                        affiliateReferrals = JSON.parse(JSON.stringify(affiliateReferrals));
                        if (affiliateReferrals.length && affiliateReferrals[0].affiliate.renewal_level < affiliateReferrals.length) {
                            let affiliate_id = affiliateReferrals[0].affiliate_id,
                                affiliate_visit_id = affiliateReferrals[0].affiliate_visit_id,
                                amount = 0
                            switch (affiliateReferrals.length) {
                                case 1:
                                    // first_renewal_rate
                                    if (affiliateReferrals[0].affiliate.first_renewal_rate != 0) {
                                        if (affiliateReferrals[0].affiliate.rate_type == 1) {
                                            amount = (final_amount * affiliateReferrals[0].affiliate.first_renewal_rate) / 100
                                        } else {
                                            amount = final_amount * affiliateReferrals[0].affiliate.first_renewal_rate
                                        }
                                    }
                                    break;
                                case 2:
                                    // second_renewal_rate
                                    if (affiliateReferrals[0].affiliate.second_renewal_rate != 0) {
                                        if (affiliateReferrals[0].affiliate.rate_type == 1) {
                                            amount = (final_amount * affiliateReferrals[0].affiliate.second_renewal_rate) / 100
                                        } else {
                                            amount = final_amount * affiliateReferrals[0].affiliate.second_renewal_rate
                                        }
                                    }
                                    break;
                                default:
                                    // consecutive_renewal_rate
                                    if (affiliateReferrals[0].affiliate.consecutive_renewal_rate != 0) {
                                        if (affiliateReferrals[0].affiliate.rate_type == 1) {
                                            amount = (final_amount * affiliateReferrals[0].affiliate.consecutive_renewal_rate) / 100
                                        } else {
                                            amount = final_amount * affiliateReferrals[0].affiliate.consecutive_renewal_rate
                                        }
                                    }
                                    break;
                            }
                            if (amount != 0) {
                                await dbWriter.affiliateReferrals.create({
                                    affiliate_id: affiliate_id,
                                    affiliate_visit_id: affiliate_visit_id,
                                    referral_user_id: _user_id,
                                    notes: '',
                                    amount: amount,
                                    status: 0,
                                    type: 1,
                                    user_subscription_id: _user_subscription_id
                                })
                            }
                        }

                        let log_content_title = 'User'
                        if (user_role != 3) { log_content_title = 'Admin' }
                        logs = [{
                            type: 1,//order
                            event_type_id: _temp_order_data[0].user_orders_id,
                            message: "Order #" + _temp_order_data[0].user_order_number + " instant renewed successfully by " + log_content_title + " (" + display_name + ")",
                        }, {
                            type: 2,
                            event_type_id: _user_subscription_id,
                            message: "Subscription #" + _subscription_number + " instant renewed successfully by " + log_content_title + " (" + display_name + ")",
                        }]
                        notes = [{
                            type: 1,//order 
                            event_type_id: _temp_order_data[0].user_orders_id,
                            message: "Order #" + _temp_order_data[0].user_order_number + " instant renewed successfully by " + log_content_title + " (" + display_name + ").",
                        }, {
                            type: 2,
                            event_type_id: _user_subscription_id,
                            message: "Subscription #" + _subscription_number + " instant renewed successfully by " + log_content_title + " (" + display_name + ").",
                        }]

                        if (membership_name_list.length) {
                            notes = [...notes, {
                                type: 1,//order                               
                                event_type_id: _temp_order_data[0].user_orders_id,
                                message: "Order #" + _temp_order_data[0].user_order_number + " has assigned new memberships " + membership_name_list,
                            }, {
                                type: 2,
                                event_type_id: _user_subscription_id,
                                message: "Subscription #" + _subscription_number + " has assigned new memberships " + membership_name_list,
                            }]
                        }

                        // if the status is pending-cancellation the the status would not change for subscription
                        await dbWriter.userSubscription.update({
                            subscription_status: global_status,
                            end_date: end_date,
                            next_payment_date: end_date,
                            is_renewal_notice_send: 0
                        }, {
                            where: { user_subscription_id: _user_subscription_id }
                        });

                        try {
                            let apiLogData = {
                                user_id: _user_id,
                                user_subscription_id: _user_subscription_id,
                                subscription_status: global_status,
                                end_date: end_date,
                                next_payment_date: end_date,
                                is_renewal_notice_send: 0
                            }
                            await dbWriter.apiLogs.create({
                                api_url: "/subscriptionInstantPayment",
                                method: "POST",
                                request: JSON.stringify(req.body),
                                response: JSON.stringify(apiLogData),
                                header: JSON.stringify(req.headers)
                            })
                        } catch (error) {

                        }

                        if (userSubscription?.user_orders) {
                            await dbWriter.userOrder.update({
                                order_status: 8
                            }, {
                                where: { user_orders_id: userSubscription?.user_orders[userSubscription?.user_orders.length - 1]?.user_orders_id ?? 0 }
                            });
                        }

                        await dbWriter.userOrder.update({
                            order_status: global_status
                        }, {
                            where: { user_orders_id: _temp_order_data[0].user_orders_id ?? 0 }
                        });
                        if (global_status == 2 || global_status == 4) {
                            if (geoDataList.length) {
                                await dbWriter.geoData.bulkCreate(geoDataList)
                            }
                        }
                        // save user coupon
                        if ((coupon_code || coupon_ids) && couponValidation && couponValidation.coupon_data && couponValidation.coupon_data.length) {
                            let CouponsList: any = [];
                            couponValidation.coupon_data.forEach((s: any) => {
                                CouponsList.push({
                                    user_id: _user_id,
                                    coupon_id: s.coupon_id,
                                    user_orders_id: _temp_order_data[0].user_orders_id
                                });
                            })
                            if (CouponsList.length)
                                await dbWriter.sycuUserCoupon.bulkCreate(CouponsList);
                        }

                        if (pg_transaction_type != 2) {
                            await dbWriter.subscriptionRenewal.create({
                                user_subscription_id: _user_subscription_id,
                                user_id: _user_id,
                                user_orders_id: _temp_order_data[0].user_orders_id,
                                end_date: end_date,
                                site_id: _site_id,
                                attempt_count: 0,
                                last_attempt_date: dateTime(timestamp()),
                                status: 2, // active
                                renewal_date: end_date,
                            });
                        }

                        // Circle User Add in Space
                        // Daksh
                        const paymentConfirm = (pg_transaction_type == 1) ? true : ((pg_transaction_type == 2 && is_payment_confirmed == 1) ? true : false)
                        if (_site_id == EnumObject.siteEnum.get('together').value && paymentConfirm) {
                            const CircleAPIsObj = new CircleAPIs();
                            let cd = await CircleAPIsObj.userActionInSpace({
                                user_email: userSubscription.sycu_user?.email,
                                Method: 'POST',
                                user_id: _user_id
                            });
                            if (cd.success) {
                                logs.push({
                                    type: 2,
                                    event_type_id: _user_subscription_id,
                                    message: "subscription #" + _subscription_number + " - User added in Circle Private Space.",
                                });
                                notes.push({
                                    type: 2,
                                    event_type_id: _user_subscription_id,
                                    message: "Subscription #" + _subscription_number + " - User added in Circle Private Space.",
                                })
                            } else {
                                logs.push({
                                    type: 2,
                                    event_type_id: _user_subscription_id,
                                    message: "subscription #" + _subscription_number + " - " + cd.message,
                                });
                                notes.push({
                                    type: 2,
                                    event_type_id: _user_subscription_id,
                                    message: "Subscription #" + _subscription_number + " - " + cd.message,
                                })
                            }
                        }

                        if (existingSubscriptionMembership.length)
                            await dbWriter.userMemberships.update({
                                status: global_status,
                                end_date: end_date
                            }, {
                                where: { user_membership_id: existingSubscriptionMembership.map((s0: any) => s0.user_membership_id) }
                            });

                        await dbWriter.userMemberships.update({
                            status: global_status,
                            end_date: end_date
                        }, {
                            where: { user_subscription_id: _user_subscription_id, status: 3 }
                        });

                        if (userMembershipList.length) {
                            if (global_status != 2) {
                                userMembershipList.forEach((element: any) => {
                                    element.status = global_status
                                });
                            }
                            await dbWriter.userMemberships.bulkCreate(userMembershipList)
                        }

                        //=======4. ActiveCampagin CODE===========//
                        let activecampaign_response = await dbReader.thirdParty.findOne({
                            attributes: ['is_active'],
                            where: { thirdparty_id: 8, is_active: 1 }
                        });
                        activecampaign_response = JSON.parse(JSON.stringify(activecampaign_response));
                        if (activecampaign_response && contact_id != 0) {
                            let activeCampaignData = {
                                "products": hubSpotProductList,
                                "contact_id": contact_id,
                                "user_id": _user_id
                            }
                            await activeCampaign.activeCampaignMapProductsData(activeCampaignData, "add");

                            //==============Active Campaign Renewal Field Update=============
                            let acFieldData = {
                                "contact_id": contact_id,
                                "user_subscription_id": subscription_id,
                            }
                            await activeCampaign.updateActiveCampaignRenewalFields(acFieldData);
                        }

                        //=======5.WICKED REPORT CODE===========//
                        //Transferring Product Data to Wicked Report Third Party
                        let WickedReportsAPIsObj = new WickedReportsAPIs();
                        WickedReportsAPIsObj.CreateOrder(wickedReportOrderDetails);

                        //=======6.Shipbob REPORT CODE===========//
                        //Transferring Shipable Product Data to Shpbob Third Party API
                        if (userSubscriptionData.user_id != 119675 && userSubscriptionData.user_id != 14442 && userSubscription.subscription_address.length) {
                            try {
                                //shipbob orders
                                let response = await dbReader.thirdParty.findOne({
                                    attributes: ["is_active"],
                                    where: {
                                        thirdparty_id: 7,
                                    },
                                });
                                response = JSON.parse(JSON.stringify(response));
                                if (response.is_active == 1) {
                                    // getting product shippable status
                                    let is_shippable: any;
                                    if (hubSpotNewMembershipList.length) {
                                        let newProduct = await dbReader.userSubscriptionItems.findAll({
                                            where: {
                                                user_subscription_id: _user_subscription_id,
                                                updated_product_id: {
                                                    [Op.ne]: null
                                                }
                                            }
                                        });
                                        newProduct = JSON.parse(JSON.stringify(newProduct));

                                        if (newProduct.length) {
                                            let prodIds = newProduct.map((h: any) => h.updated_product_id)
                                            // getting product shippable status
                                            is_shippable = await dbReader.products.findAll({
                                                attributes: ["product_id", "is_shippable"],
                                                where: {
                                                    is_deleted: 0,
                                                    product_id: {
                                                        [Op.in]: prodIds
                                                    }
                                                }
                                            });
                                        }
                                    }
                                    else {
                                        let productIds = subscription_item.map((h: any) => h.updated_product_id);
                                        if (productIds == undefined || productIds == null) {
                                            productIds = subscription_item.map((h: any) => h.product_id);
                                        }
                                        is_shippable = await dbReader.products.findAll({
                                            attributes: ["product_id", "is_shippable"],
                                            where: {
                                                is_deleted: 0,
                                                product_id: {
                                                    [Op.in]: productIds
                                                }
                                            }
                                        });
                                    }

                                    is_shippable = JSON.parse(JSON.stringify(is_shippable));
                                    let shipbobProductIds = is_shippable
                                        .filter((element: any) => element.is_shippable === 1)
                                        .map((s: any) => s.product_id);

                                    if (shipbobProductIds.length > 0) {
                                        let createShipbobOrder: any = {};
                                        let shipbobProducts: any = [];
                                        let recipient: any = {};

                                        let getMapShipbobProduct = await dbReader.shipbobSycuProductModel.findAll({
                                            attributes: ["shipbob_product_id", "sycu_product_name"],
                                            where: {
                                                sycu_product_id: {
                                                    [Op.in]: shipbobProductIds,
                                                },
                                            },
                                        });

                                        getMapShipbobProduct = JSON.parse(
                                            JSON.stringify(getMapShipbobProduct)
                                        );
                                        let is_ship_product_reference = getMapShipbobProduct.map(
                                            (s: any) => s.shipbob_product_id
                                        );
                                        let getMapShipbobProductReference = await dbReader.shipbobProductModel.findAll(
                                            {
                                                attributes: ["reference_id", "title"],
                                                where: {
                                                    shipbob_product_id: {
                                                        [Op.in]: is_ship_product_reference,
                                                    },
                                                    is_active: 1
                                                },
                                            }
                                        );

                                        getMapShipbobProductReference = JSON.parse(
                                            JSON.stringify(getMapShipbobProductReference)
                                        );
                                        getMapShipbobProductReference.forEach(
                                            (element: any) => {
                                                shipbobProducts.push({
                                                    reference_id: element.reference_id.toString(),
                                                    quantity: 1,
                                                    quantity_unit_of_measure_code: "",
                                                    external_line_id: 0,
                                                    name: element.title.toString(),
                                                });
                                            }
                                        );

                                        if (shipbobProducts.length > 0) {
                                            let getShipbobChannels = await dbReader.shipbobChannelModel.findOne(
                                                {
                                                    attributes: ["shipbob_channel_id"],
                                                    where: {
                                                        is_selected: 1,
                                                    },
                                                }
                                            );
                                            let channel_id = 0;
                                            if (getShipbobChannels) {
                                                getShipbobChannels = JSON.parse(
                                                    JSON.stringify(getShipbobChannels)
                                                );
                                                channel_id = getShipbobChannels.shipbob_channel_id;
                                            }
                                            let getShipbobMethods = await dbReader.shipbobMethodsModel.findOne(
                                                {
                                                    attributes: ["title"],
                                                    where: {
                                                        is_default: 1,
                                                    },
                                                }
                                            );

                                            let shipbob_method = "Shippment";
                                            if (getShipbobMethods) {
                                                getShipbobMethods = JSON.parse(
                                                    JSON.stringify(getShipbobMethods)
                                                );
                                                shipbob_method = getShipbobMethods.title;
                                            }
                                            let recipientStateName = "",
                                                recipientCountryName = "USA";


                                            let addressindex = userSubscriptionData.subscription_address.filter((h: any) => h.address_type == 2);

                                            if (addressindex.length > 0) {
                                                let getAddressType = addressindex[0];
                                                recipientCountryName = getAddressType.countryModel.country_name ? getAddressType.countryModel.country_name : "";
                                                recipientStateName = getAddressType.stateModel ? getAddressType.stateModel.state_name : "";
                                                recipient.address = {
                                                    address1: getAddressType.address_line1 ? getAddressType.address_line1 : "",
                                                    address2: getAddressType.address_line2 ? getAddressType.address_line2 : "",
                                                    company_name: "",
                                                    city: getAddressType.city ? getAddressType.city : "",
                                                    state: recipientStateName || "",
                                                    country: recipientCountryName || "",
                                                    zip_code: getAddressType.zipcode ? getAddressType.zipcode : "",
                                                };
                                            } else {
                                                let getAddressType = userSubscriptionData.subscription_address.find((s: any) => s.address_type == 1);

                                                if (getAddressType.length > 0) {
                                                    getAddressType = getAddressType[0];
                                                    recipientCountryName = getAddressType.countryModel.country_name ? getAddressType.countryModel.country_name : "";
                                                    recipientStateName = getAddressType.stateModel ? getAddressType.stateModel.state_name : "";

                                                    recipient.address = {
                                                        address1: getAddressType.address_line1 ? getAddressType.address_line1 : "",
                                                        address2: getAddressType.address_line2 ? getAddressType.address_line2 : "",
                                                        company_name: "",
                                                        city: getAddressType.city ? getAddressType.city : "",
                                                        state: recipientStateName || "",
                                                        country: recipientCountryName || "",
                                                        zip_code: getAddressType.zipcode ? getAddressType.zipcode : "",
                                                    };
                                                }
                                                else {
                                                    recipient.address = {
                                                        address1: "",
                                                        address2: "",
                                                        company_name: "",
                                                        city: "",
                                                        state: "",
                                                        country: "",
                                                        zip_code: "",
                                                    };
                                                }

                                            }

                                            recipient.name = userSubscriptionData.sycu_user.first_name ? userSubscriptionData.sycu_user.first_name : userSubscriptionData.sycu_user.email;
                                            recipient.email = userSubscriptionData.sycu_user.email ? userSubscriptionData.sycu_user.email : "";
                                            recipient.phone_number = userSubscriptionData.sycu_user.mobile ? userSubscriptionData.sycu_user.mobile : "";

                                            createShipbobOrder.user_id = userSubscriptionData.user_id;
                                            createShipbobOrder.user_subscription_id = subscription_item[0].user_subscription_id;
                                            createShipbobOrder.user_order_id = _user_order_id;
                                            createShipbobOrder.subscription_number = userSubscriptionData.subscription_number
                                            createShipbobOrder.shipbob_channel_id = channel_id;
                                            createShipbobOrder.shipping_method = shipbob_method;
                                            createShipbobOrder.recipient = recipient;
                                            createShipbobOrder.products = shipbobProducts;
                                            createShipbobOrder.order_number = userSubscriptionData.user_orders[0].user_order_number;
                                            createShipbobOrder.reference_id = uuidv4();
                                            createShipbobOrder.is_extra_pay = false
                                            let callMethod = new ShipbobController();
                                            let shipbob_response = callMethod.addUpdateShipbobOrder(createShipbobOrder, 0, 0, 4);
                                        }
                                    }
                                }
                            } catch (e: any) {
                                console.log(e);
                            }
                        }

                        try {
                            //AB - 27/6/2023 group product stop renewal if cycle complete
                            await generl.checkGroupProductRenewalCycle(subscription_id);
                        } catch (e: any) {
                            console.log(e.message)
                        }
                    } else {
                        let removeRenewalFieldFlag = false
                        res_data = false
                        message_data = paymentResponse.message
                        await dbWriter.userOrder.update({
                            order_status: 7,
                            payment_type: 3
                        }, {
                            where: { user_orders_id: _temp_order_data[0].user_orders_id }
                        });

                        //increase end date  on bases of attempt_count                       
                        logs = [{
                            type: 1,//order 
                            event_type_id: _temp_order_data[0].user_orders_id,
                            message: "Order #" + _temp_order_data[0].user_order_number + " renewal failed.",
                        }, {
                            type: 2,
                            event_type_id: _user_subscription_id,
                            message: "Subscription #" + _subscription_number + " renewal failed.",
                        }]

                        notes = [{
                            type: 1,//order 
                            event_type_id: _temp_order_data[0].user_orders_id,
                            is_customer: 0,
                            message: "Order #" + _temp_order_data[0].user_order_number + " Err : " + paymentResponse.message,
                        }, {
                            type: 2,
                            event_type_id: _user_subscription_id,
                            is_customer: 0,
                            message: "Subscription #" + _subscription_number + " Err : " + paymentResponse.message,
                        }]

                        if (paymentResponse.message.includes("not have a linked card")) {
                            notes.push({
                                type: 2,
                                event_type_id: _user_subscription_id,
                                is_customer: 1,
                                message: "Subscription #" + _subscription_number + " Problem : Please update your credit card and try again.",
                            })
                        } else {
                            notes.push({
                                type: 2,
                                event_type_id: _user_subscription_id,
                                is_customer: 1,
                                message: "Subscription #" + _subscription_number + " Problem : " + paymentResponse.message,
                            })
                        }

                        if (subscription_status != 5) {
                            if (_subscription_renewal_id && _renewal_date && _renewal_date >= moment().format('YYYY-MM-DD HH:mm:ss')) {
                                await dbWriter.subscriptionRenewal.update({
                                    is_instant_payment: 0,
                                    end_date: new Date(),
                                    updated_datetime: new Date(),
                                    note: ''
                                }, {
                                    where: {
                                        user_subscription_id: subscription_id,
                                        subscription_renewal_id: _subscription_renewal_id,
                                        is_executed: 0,
                                        is_instant_payment: 1,
                                        is_deleted: 0
                                    }
                                });
                                await dbWriter.subscriptionRenewalCronLog.update({
                                    is_instant_payment: 0,
                                    end_date: new Date()
                                }, {
                                    where: {
                                        user_subscription_id: subscription_id,
                                        subscription_renewal_id: _subscription_renewal_id,
                                        is_instant_payment: 1,
                                        is_deleted: 0,
                                        is_executed: 0
                                    }
                                })
                            } else {
                                let order_ids = userSubscription?.user_orders ? userSubscription?.user_orders[userSubscription?.user_orders.length - 1]?.user_orders_id : 0;
                                let renewal_date: any = moment(moment().format()).add(1, 'days');
                                if (_attempt_count) {
                                    switch (_attempt_count) {
                                        case 1:
                                            renewal_date = moment(moment().format()).add(1, 'days');
                                            break;
                                        case 2:
                                            renewal_date = moment(moment().format()).add(3, 'days');
                                            break;
                                        case 3:
                                            renewal_date = moment(moment().format()).add(5, 'days');
                                            break;
                                        case 4:
                                            renewal_date = moment(moment().format()).add(8, 'days');
                                            break;
                                        case 5:
                                            renewal_date = moment(moment().format()).add(13, 'days');
                                            break;
                                        case 6:
                                            renewal_date = "";
                                            break;
                                    }
                                }
                                if (renewal_date) {
                                    await dbWriter.subscriptionRenewal.create({
                                        attempt_count: _attempt_count,
                                        renewal_date: renewal_date,
                                        user_subscription_id: _user_subscription_id,
                                        user_orders_id: order_ids,
                                        site_id: _site_id,
                                        user_id: _user_id,
                                    })
                                    await dbWriter.userSubscription.update({
                                        next_payment_date: renewal_date,
                                        subscription_status: 3,
                                    }, {
                                        where: { user_subscription_id: _user_subscription_id }
                                    });
                                } else {
                                    removeRenewalFieldFlag = true
                                    await dbWriter.userSubscription.update({
                                        subscription_status: 6,
                                        status_updated_date: moment(moment().format())
                                    }, {
                                        where: { user_subscription_id: _user_subscription_id }
                                    });

                                    logs = [{
                                        type: 1,//order 
                                        event_type_id: _temp_order_data[0].user_orders_id,
                                        message: "Order #" + _temp_order_data[0].user_order_number + " renewal expire.",
                                    }, {
                                        type: 2,
                                        event_type_id: _user_subscription_id,
                                        message: "Subscription #" + _subscription_number + " renewal expire.",
                                    }]

                                    notes = [{
                                        type: 1,//order 
                                        event_type_id: _temp_order_data[0].user_orders_id,
                                        is_customer: 0,
                                        message: "Order #" + _temp_order_data[0].user_order_number + " renewal expire",
                                    }, {
                                        type: 2,
                                        event_type_id: _user_subscription_id,
                                        is_customer: 0,
                                        message: "Subscription #" + _subscription_number + " renewal expire",
                                    }, {
                                        type: 1,//order 
                                        event_type_id: _temp_order_data[0].user_orders_id,
                                        is_customer: 0,
                                        message: "Order #" + _temp_order_data[0].user_order_number + " renewal expire",
                                    }, {
                                        type: 2,
                                        event_type_id: _user_subscription_id,
                                        is_customer: 0,
                                        message: "Subscription #" + _subscription_number + " renewal expire",
                                    }]

                                    await dbWriter.userMemberships.update({
                                        status: 6,
                                        end_date: end_date
                                    }, {
                                        where: { user_subscription_id: _user_subscription_id, status: 3 }
                                    });
                                }
                            }
                        }

                        try {
                            //====================== ActiveCampagin Code==================//
                            let activecampaign_response = await dbReader.thirdParty.findOne({
                                attributes: ['is_active'],
                                where: { thirdparty_id: 8 }
                            });
                            activecampaign_response = JSON.parse(JSON.stringify(activecampaign_response));
                            if (activecampaign_response.is_active == 1 && contact_id) {
                                //================= ActiveCampagin Failed Tag==================//
                                let activeCampaignData = {
                                    "products": hubSpotProductList,
                                    "contact_id": contact_id,
                                    "user_id": _user_id
                                }
                                await activeCampaign.activeCampaignAddFailedTags(activeCampaignData);

                                //============== Active Campaign Renewal Custome Contact Field Update =============
                                let acFieldData = {
                                    "contact_id": contact_id,
                                    "user_subscription_id": subscription_id,
                                }
                                await activeCampaign.updateActiveCampaignRenewalFields(acFieldData);

                                if (removeRenewalFieldFlag) {
                                    //==============Active Campaign Remove Renewal Field=============
                                    let fieldData = {
                                        "contact_id": contact_id,
                                        "user_subscription_id": subscription_id,
                                    }
                                    await activeCampaign.removeActiveCampaignRenewalFields(fieldData);
                                }
                            }
                        } catch (e: any) {
                            console.log(e.message)
                        }

                        // Circle User Add in Space
                        // Daksh
                        const paymentConfirm = (pg_transaction_type == 1) ? true : ((pg_transaction_type == 2 && is_payment_confirmed == 1) ? true : false)
                        if (_site_id == EnumObject.siteEnum.get('together').value && paymentConfirm && ![3, 5, 6].includes(subscription_status)) {
                            const CircleAPIsObj = new CircleAPIs();
                            let cd = await CircleAPIsObj.userActionInSpace({
                                user_email: userSubscription.sycu_user?.email,
                                Method: 'DELETE',
                                user_id: _user_id
                            });
                            if (cd.success) {
                                logs.push({
                                    type: 2,
                                    event_type_id: _user_subscription_id,
                                    message: "subscription #" + _subscription_number + " - User remove in Circle Private Space.",
                                });
                                notes.push({
                                    type: 2,
                                    event_type_id: _user_subscription_id,
                                    message: "Subscription #" + _subscription_number + " - User remove in Circle Private Space.",
                                })
                            } else {
                                logs.push({
                                    type: 2,
                                    event_type_id: _user_subscription_id,
                                    message: "subscription #" + _subscription_number + " - " + cd.message,
                                });
                                notes.push({
                                    type: 2,
                                    event_type_id: _user_subscription_id,
                                    message: "Subscription #" + _subscription_number + " - " + cd.message,
                                })
                            }
                        }
                    }

                    if (emailPayload) {
                        let s = 0;
                        while (emailPayload.length > s) {
                            if (templateIdentifier) {
                                emailPayload[s].templateIdentifier = templateIdentifier;
                                emailPayload[s].failedFlag = templateIdentifier == '4' ? 1 : 0
                                await ObjectMail.ConvertData(emailPayload[s], function (data: any) { });
                            }
                            s++;
                        }
                    }

                    if (logs.length)
                        await dbWriter.logs.bulkCreate(logs)

                    if (notes.length)
                        await dbWriter.notes.bulkCreate(notes)

                    return {
                        res: res_data,
                        err: message_data
                    }
                } else {
                    throw new Error("Item not found")
                }
            } else {
                throw new Error("Subscription not found.")
            }
        } catch (e: any) {
            return {
                res: false,
                err: e.message
            }
        }
    }

    public async generatePaymentToken(req: Request, res: Response) {
        try {
            //@ts-ignore
            let { users_login_log_id } = req
            let { user_id } = req.params
            let { privateKey, publicKey } = keyGeneration();
            await dbWriter.paymentKeys.update({
                is_used: 1,
                updated_datetime: new Date()
            }, {
                where: { users_login_log_id: users_login_log_id, user_id: user_id }
            })
            let paymentKeys = await dbWriter.paymentKeys.create({
                payment_public_key: publicKey,
                user_id: user_id,
                payment_private_key: privateKey,
                users_login_log_id: users_login_log_id
            })
            new SuccessResponse(EC.updatedDataSuccess, {
                //@ts-ignore
                token: req.token,
                paymentPublicKey: publicKey,
                sycu_payment_key_id: paymentKeys.sycu_payment_key_id
            }).send(res);
        } catch (err: any) {
            ApiError.handle(new BadRequestError(err.message), res);
        }
    }

    public async subscriptionRenewalStatus(req: Request, res: Response) {
        try {
            //@ts-ignore
            let { display_name } = req
            let { user_subscription_id } = req.body
            // let { privateKey, publicKey } = keyGeneration();
            let key = 0, reccuringKey = 0
            let upData: any = null;
            let data = await dbReader.userSubscription.findOne({
                where: { user_subscription_id: user_subscription_id }
            })
            if (data.is_renewal == 1) {
                key = 2,
                    reccuringKey = 0
            } else if (data.is_renewal == 2 || data.is_renewal == 0) {
                key = 1,
                    reccuringKey = 1
            }
            await dbWriter.userSubscription.update({
                is_renewal: key,
                is_recurring_subscription: reccuringKey,
                updated_datetime: new Date()
            }, {
                where: { user_subscription_id: user_subscription_id }
            })
            let logs = {}, notes = {}
            if (key == 2) {
                await dbWriter.subscriptionRenewal.update({
                    is_deleted: 1,
                    end_date: new Date(),
                    updated_datetime: new Date(),
                    note: 'Subscription paused by admin'
                }, {
                    where: {
                        user_subscription_id: user_subscription_id,
                        is_executed: 0,
                        is_deleted: 0,
                        is_instant_payment: 0
                    }
                });
                await dbWriter.subscriptionRenewalCronLog.update({
                    is_deleted: 1
                }, {
                    where: {
                        user_subscription_id: user_subscription_id,
                        is_deleted: 0,
                        is_executed: 0
                    }
                })
                logs = {
                    type: 2,
                    event_type_id: user_subscription_id,
                    message: "Auto-renewal disabled by " + display_name,
                }
                notes = {
                    type: 2,
                    event_type_id: user_subscription_id,
                    is_customer: 0,
                    message: "Auto-renewal disabled by " + display_name,
                    is_system: 1,
                    // @ts-ignore
                    user_id: req.user_id
                }
                await dbWriter.logs.create(logs)
                await dbWriter.notes.create(notes)
            } else if (key == 1) {
                if (new Date() == data.next_payment_date || data.next_payment_date < new Date()) {
                    let nc = new checkoutController();
                    let instantPaymentData = await nc.instantPayment(req, user_subscription_id)
                    if (instantPaymentData.res) {
                        upData = {
                            updated_datetime: moment().format("YYYY-MM-DD HH:mm:ss")
                        }
                        logs = {
                            type: 2,
                            event_type_id: user_subscription_id,
                            message: "Auto-renewal enabled by Admin (" + display_name + ")."
                        }
                        notes = {
                            type: 2,
                            event_type_id: user_subscription_id,
                            is_customer: 0,
                            message: "Auto-renewal enabled by Admin (" + display_name + ").",
                            is_system: 1,
                            // @ts-ignore
                            user_id: req.user_id
                        }
                        await dbWriter.logs.create(logs)
                        await dbWriter.notes.create(notes)
                    } else {
                        throw new Error(instantPaymentData.err)
                    }
                } else {
                    await dbWriter.subscriptionRenewal.create({
                        attempt_count: 0,
                        renewal_date: data.next_payment_date,
                        user_subscription_id: user_subscription_id,
                        user_orders_id: data.user_orders_id,
                        site_id: data.site_id,
                        user_id: data.user_id,
                    });
                    logs = {
                        type: 2,
                        event_type_id: user_subscription_id,
                        message: "Auto-renewal enabled by Admin (" + display_name + ")."
                    }
                    notes = {
                        type: 2,
                        event_type_id: user_subscription_id,
                        is_customer: 0,
                        message: "Auto-renewal enabled by Admin (" + display_name + ").",
                        is_system: 1,
                        // @ts-ignore
                        user_id: req.user_id
                    }
                    await dbWriter.logs.create(logs)
                    await dbWriter.notes.create(notes)
                }
            }
            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token,
            }).send(res);
        } catch (err: any) {
            ApiError.handle(new BadRequestError(err.message), res);
        }
    }

    public async updateCheckStatus(req: Request, res: Response) {
        try {
            //@ts-ignore
            let { display_name } = req
            let { user_subscription_id } = req.params
            let logList: any = [], noteList: any = [], emailPayload: any = []
            let userSubscription = await dbReader.userSubscription.findOne({
                where: { user_subscription_id: user_subscription_id },
                include: [{
                    model: dbReader.users
                }, {
                    separate: true,
                    as: 'subscription_address',
                    model: dbReader.userAddress,
                    where: { is_deleted: 0 },
                    include: [{
                        model: dbReader.stateModel,
                        attributes: [['name', 'state_name']]
                    }, {
                        model: dbReader.countryModel,
                        attributes: [['name', 'country_name']]
                    }]
                }]
            });
            if (userSubscription) {
                userSubscription = JSON.parse(JSON.stringify(userSubscription));
                await dbWriter.paymentCheck.update({
                    is_payment_confirmed: 1
                }, {
                    where: { payment_check_id: userSubscription.pg_card_id }
                })
                await dbWriter.userSubscription.update({
                    subscription_status: 2
                }, {
                    where: { user_subscription_id: user_subscription_id }
                })
                let userOrderData = await dbReader.userOrder.findOne({
                    where: { user_subscription_id: user_subscription_id, order_status: 9 },
                    include: [{
                        separate: true,
                        model: dbReader.userOrderItems,
                        where: { item_type: 1 },
                        attributes: ['updated_product_name', 'product_name', 'product_amount', 'user_orders_id', 'renewal_count'],
                        include: [{
                            model: dbReader.products,
                        }]
                    }],
                    order: [['user_orders_id', 'DESC']]
                })
                if (userOrderData) {
                    userOrderData = JSON.parse(JSON.stringify(userOrderData));
                    await dbWriter.userOrder.update({
                        order_status: 2
                    }, {
                        where: { user_orders_id: userOrderData.user_orders_id }
                    })
                    await dbWriter.transactionMaster.update({
                        status: "Success"
                    }, {
                        where: { parent_id: userOrderData.user_orders_id }
                    })

                    let productDetails: any = [];
                    if (userOrderData.user_order_items && userOrderData.user_order_items.length) {
                        userOrderData.user_order_items.forEach((element: any) => {
                            productDetails.push({
                                product_duration: element.sycu_product.product_duration,
                                product_name: element.updated_product_name || element.product_name,
                                renewal_count: element.renewal_count
                            })
                        });
                    }

                    let billingAddress: any = null
                    if (userSubscription.subscription_address && userSubscription.subscription_address.length) {
                        userSubscription.subscription_address.forEach((element: any) => {
                            let orderAddress = JSON.parse(JSON.stringify(element));
                            const state_name = (orderAddress.stateModel) ? orderAddress.stateModel.state_name : (orderAddress.state_code ? orderAddress.state_code : ''),
                                country_name = (orderAddress.countryModel) ? orderAddress.countryModel.country_name : (orderAddress.country_code ? orderAddress.country_code : '')

                            delete orderAddress.stateModel;
                            delete orderAddress.countryModel;

                            orderAddress.user_address_id = 0;
                            orderAddress.user_subscription_id = 0;
                            orderAddress.user_orders_id = userOrderData.user_orders_id;
                            billingAddress = { ...orderAddress, state_name, country_name }
                        })
                    }

                    // Email
                    emailPayload.push({
                        user_subscription_id: user_subscription_id,
                        isRecurringSubscription: userSubscription.is_recurring_subscription,
                        user_id: userSubscription.user_id,
                        first_name: userSubscription.sycu_user.first_name || '',
                        user_email: userSubscription.sycu_user.email || '',
                        orderNumber: userOrderData.user_order_number || '',
                        subscriptionNumber: userSubscription.subscription_number,
                        orderCreatedDate: userSubscription.created_datetime,
                        OrderDetails: userOrderData.user_order_items,
                        productDetails: productDetails,
                        userOrderId: userOrderData.user_orders_id,
                        orderSubTotal: userSubscription.sub_amount,
                        paymentMethod: 2,
                        isCheckPayment: true,
                        orderTotal: userSubscription.total_amount,
                        SubscriptionDetails: [{
                            start_date: moment(userSubscription.start_date).format("YYYY-MM-DD HH:mm:ss"),
                            end_date: moment(userSubscription.next_payment_date).format("YYYY-MM-DD HH:mm:ss"),
                            total_amount: userSubscription.total_amount
                        }],
                        site: userSubscription.site_id,
                        failedFlag: 0,
                        templateIdentifier: EnumObject.templateIdentifier.get('orderPurchaseSuccessfully').value,
                        billingAddress: billingAddress.address_line1 + " " + billingAddress.address_line2 + "," + billingAddress.city + "," + billingAddress.state_name || '' + "," + billingAddress.country_name || '',
                        SiteName: 'Grow ' + ((EnumObject.siteIdEnum.get(userSubscription.site_id.toString()).value) ? _.capitalize(EnumObject.siteIdEnum.get(userSubscription.site_id.toString()).value) : 'Account')
                    });

                }
                await dbWriter.userMemberships.update({
                    status: 2
                }, {
                    where: { user_subscription_id: user_subscription_id }
                })
                logList.push({
                    type: 2,
                    event_type_id: user_subscription_id,
                    message: "subscription #" + userSubscription.subscription_number + " Confirmed by Admin (" + display_name + ")",
                });
                noteList.push({
                    type: 2,
                    event_type_id: user_subscription_id,
                    message: "subscription #" + userSubscription.subscription_number + " Confirmed by Admin (" + display_name + ")",
                });
                //save log
                if (logList.length)
                    await dbWriter.logs.bulkCreate(logList);
                // save notes
                if (noteList.length)
                    await dbWriter.notes.bulkCreate(noteList);

                if (emailPayload) {
                    let s = 0;
                    while (emailPayload.length > s) {
                        await ObjectMail.ConvertData(emailPayload[s], function (data: any) { });
                        s++;
                    }
                }

                new SuccessResponse(EC.updatedDataSuccess, {}).send(res);
            } else {
                throw new Error("No subscription found")
            }
        } catch (err: any) {
            ApiError.handle(new BadRequestError(err.message), res);
        }
    }

    /**Disputed transaction list **/
    //Sa 15-11-2022
    public async getDisputedTransaction(req: Request, res: Response) {
        try {
            let { start_date, end_date, sort_field, sort_order, search } = req.body;
            // let todays_date = moment().format('YYYY-MM-DD');
            //Searching
            var searchCondition = dbReader.Sequelize.Op.ne, searchData = null;
            if (search) {
                searchCondition = Op.like;
                searchData = '%' + search + '%';
            }
            //Pagination
            var limit = req.body.page_record == undefined ? 10 : parseInt(req.body.page_record);
            var offset = req.body.page_no == undefined ? 1 : parseInt(req.body.page_no);
            // Automatic Offset and limit will set on the base of page number
            var row_limit = limit;
            var row_offset = (offset * limit) - limit;
            //sorting
            sort_field = sort_field ? sort_field : 'disputed_date';
            sort_order = sort_order ? sort_order : 'DESC';
            let Data = await dbReader.disputedTransaction.findAll({
                attributes: ['disputed_transaction_id', 'charge_id', 'disputed_date', 'transaction_id', 'user_subscription_id', 'user_orders_id', 'status', 'reason', 'dispute_id', 'evidence_submited', [dbReader.Sequelize.literal("subscription_number"), "user_subscription_number"]],
                where: dbReader.Sequelize.and(
                    dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('disputed_date'), '%Y-%m-%d'), { [Op.gte]: start_date }),
                    dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('disputed_date'), '%Y-%m-%d'), { [Op.lte]: end_date }),
                    dbReader.Sequelize.or(
                        { user_subscription_id: { [searchCondition]: searchData } },
                        { charge_id: { [searchCondition]: searchData } },
                        { status: { [searchCondition]: searchData } },
                    )
                ),
                include: [
                    {
                        required: false,
                        attributes: ['transaction_id', 'charge_id', 'amount'],
                        model: dbReader.transactionMaster,
                        include: [{
                            model: dbReader.users,
                            attributes: ['user_id']
                        }]
                    },
                    {
                        required: false,
                        attributes: [],
                        model: dbReader.userSubscription
                    }
                ]
            })
            Data = JSON.parse(JSON.stringify(Data))
            Data.sort(function (a: any, b: any) {
                if (sort_order == 'ASC') {
                    if (sort_field == 'disputed_date') {
                        return new Date(a.disputed_date).getTime() - new Date(b.disputed_date).getTime();
                    } else return a[sort_field] - b[sort_field];
                } else if (sort_order == 'DESC') {
                    if (sort_field == 'disputed_date') {
                        return new Date(b.disputed_date).getTime() - new Date(a.disputed_date).getTime();
                    } else return b[sort_field] - a[sort_field];
                } else {
                    return new Date(b.disputed_date).getTime() - new Date(a.disputed_date).getTime();
                }
            });
            let count = Data.length;
            Data.forEach((element: any) => {
                element.disputed_amount = (element && element.sycu_transaction_master != null) ? element.sycu_transaction_master.amount : 0.00;
                let user = element.sycu_transaction_master;
                element.user_id = (user && user.sycu_user != null) ? user.sycu_user.user_id : 0;
                delete element.sycu_transaction_master;

            });
            Data = Data.splice(row_offset, row_limit);
            new SuccessResponse("Success", {
                count: count,
                rows: Data
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async submitDisputeEvidence(req: Request, res: Response) {
        try {
            let { dispute_id, user_id, user_subscription_id } = req.body;
            let billingAddress = await dbReader.userAddress.findOne({
                where: { user_id: user_id, address_type: 1, is_deleted: 0 },
                include: [{
                    required: false,
                    model: dbReader.stateModel,
                    attributes: ['name', 'state_code']
                }, {
                    required: false,
                    model: dbReader.countryModel,
                    attributes: ['name']
                }]
            });
            billingAddress = JSON.parse(JSON.stringify(billingAddress));
            let country_name = billingAddress?.sycu_country?.name;
            if (billingAddress && billingAddress.sycu_state && billingAddress.sycu_state.state_code) {
                let stateEnumArr = Object.keys(EnumObject.stateEnum);
                country_name = stateEnumArr.includes(billingAddress.sycu_state.state_code) ? "-" : billingAddress.sycu_country.name;
            }
            let addressLine = billingAddress.address_line1 + (billingAddress.address_line2 ? ', ' + billingAddress.address_line2 : '');
            let billing_address = addressLine + ', ' + billingAddress.state_code || '' + ', ' + billingAddress.city || '' + ', ' + billingAddress.zipcode || '' + ', ' + country_name || '';

            let userData = await dbReader.users.findOne({
                attributes: ['user_id', 'first_name', 'last_name', 'email'],
                where: { user_id: user_id }
            });
            userData = JSON.parse(JSON.stringify(userData));
            let customer_name = userData.first_name + ' ' + userData.last_name;

            let subscriptionData = await dbReader.userSubscriptionItems.findOne({
                attributes: ['product_name'],
                where: { user_subscription_id: user_subscription_id }
            });
            subscriptionData = JSON.parse(JSON.stringify(subscriptionData));

            let evidenceData = {
                "access_activity_log": null,
                "billing_address": billing_address,
                "cancellation_policy": null,
                "cancellation_policy_disclosure": null,
                "cancellation_rebuttal": null,
                "customer_communication": null,
                "customer_email_address": userData.email,
                "customer_name": customer_name,
                "customer_purchase_ip": null,
                "customer_signature": null,
                "duplicate_charge_documentation": null,
                "duplicate_charge_explanation": null,
                "duplicate_charge_id": null,
                "product_description": subscriptionData.product_name,
                "receipt": null,
                "refund_policy": null,
                "refund_policy_disclosure": null,
                "refund_refusal_explanation": null,
                "service_date": null,
                "service_documentation": null,
                "shipping_address": null,
                "shipping_carrier": null,
                "shipping_date": null,
                "shipping_documentation": null,
                "shipping_tracking_number": null,
                "uncategorized_file": null,
                "uncategorized_text": null
            };

            let stripeMainObj = new stripeMain();
            let sitePaymentServiceData = await stripeMainObj.getSecreteKey();
            let site_credentials = JSON.parse(sitePaymentServiceData.auth_json);
            let stripe_key = site_credentials.stripe_secret_key;
            const dispute = await stripe.disputes.update(
                dispute_id,
                { evidence: evidenceData },
                { apiKey: stripe_key }
            );

            await dbWriter.disputedEvidence.create({
                dispute_id: dispute_id,
                user_id: user_id,
                evidence_data: JSON.stringify(evidenceData),
                dispute: JSON.stringify(dispute),
            });

            await dbWriter.disputedTransaction.update({
                evidence_submited: 1,
            }, {
                where: { dispute_id: dispute_id }
            });

            new SuccessResponse(EC.updatedDataSuccess, {
                dispute: evidenceData
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    // public async disputedTransection(req: Request, res: Response) {
    //     try {
    //         const charge = req.body.data ? (req.body.data.object || null) : null;
    //         if (charge && charge.id) {
    //             let transactionMaster = await dbReader.transactionMaster.findOne({
    //                 where: { charge_id: charge.id },
    //                 include: [{
    //                     required: true,
    //                     model: dbReader.userOrder,
    //                     attributes: ['user_subscription_id', 'user_order_number', 'created_datetime', 'user_orders_id', 'total_amount', 'sub_amount'],
    //                     include: [{
    //                         required: true,
    //                         model: dbReader.userSubscription,
    //                         attributes: ['subscription_number'],
    //                     }, {
    //                         separate: true,
    //                         model: dbReader.userOrderItems,
    //                         order: ['item_type']
    //                     }]
    //                 }, {
    //                     required: true,
    //                     model: dbReader.users,
    //                     attributes: ['first_name', 'email']
    //                 }]
    //             })
    //             transactionMaster = JSON.parse(JSON.stringify(transactionMaster));
    //             if (transactionMaster) {
    //                 let amount = 0, refund_id = '', refund_status = '', refund_reason = ''
    //                 if (charge.refunds && charge.refunds.total_count > 0) {
    //                     amount = charge.refunds.data[0].amount ? charge.refunds.data[0].amount / 100 : 0
    //                     refund_id = charge.refunds.data[0].id
    //                     refund_status = charge.refunds.data[0].status
    //                     refund_reason = charge.refunds.data[0].reason
    //                 }
    //                 let existReturnData = await dbReader.refunds.count({
    //                     where: { stripe_refund_id: refund_id }
    //                 });
    //                 if (existReturnData == 0) {
    //                     var transaction = await dbWriter.transactionMaster.create({
    //                         user_id: transactionMaster.user_id,
    //                         site_id: transactionMaster.site_id,
    //                         transaction_type: 1,
    //                         type: 2,f
    //                         parent_id: transactionMaster.parent_id,
    //                         request_json: JSON.stringify({ "charge_id": transactionMaster.charge_id }),
    //                         response_json: JSON.stringify(charge),
    //                         status: 'Success',
    //                         stripe_customer_id: transactionMaster.stripe_customer_id,
    //                         stripe_card_id: transactionMaster.stripe_card_id,
    //                         amount: amount,
    //                         created_datetime: moment().format("YYYY-MM-DD HH:mm:ss"),
    //                         charge_id: transactionMaster.charge_id,
    //                         payment_type: 1,
    //                         transaction_details: 'Subscription purchased'
    //                     });
    //                     let refundsData = await dbWriter.refunds.create({
    //                         user_id: transactionMaster.user_id,
    //                         site_id: transactionMaster.site_id,
    //                         charge_id: transactionMaster.charge_id,
    //                         order_id: transactionMaster.parent_id,
    //                         transaction_id: transaction.transaction_id,
    //                         stripe_refund_id: refund_id,
    //                         pg_customer_id: transactionMaster.stripe_customer_id,
    //                         pg_card_id: transactionMaster.stripe_card_id,
    //                         status: refund_status == "succeeded" ? 1 : 5,
    //                         refund_type: 1,
    //                         refund_amount: amount,
    //                         refund_reason: refund_reason ? refund_reason : null,
    //                         created_datetime: moment().format("YYYY-MM-DD HH:mm:ss")
    //                     });

    //                     let tempRefData = await dbReader.refunds.findAll({
    //                         where: {
    //                             order_id: transactionMaster.parent_id
    //                         }
    //                     })
    //                     let tempRefAmount: any = 0;
    //                     let refundData: any = []
    //                     tempRefData.forEach((e: any) => {
    //                         let tempDate = new Date(e.created_datetime)
    //                         let date = moment(tempDate).format('MMMM DD, YYYY, hh:mm A');
    //                         refundData.push({ 'amount': parseFloat(e.refund_amount).toFixed(2), 'date': date })
    //                         tempRefAmount += e.refund_amount
    //                     })

    //                     let orderTotal: any = parseFloat(transactionMaster.user_order.total_amount).toFixed(2)
    //                     tempRefAmount = parseFloat(tempRefAmount).toFixed(2)
    //                     if (transactionMaster.sycu_user && transactionMaster.user_order && transactionMaster.user_order.user_order_items) {
    //                         let OrderDetails: any = []
    //                         transactionMaster.user_order.user_order_items.forEach((element: any) => {
    //                             OrderDetails.push({
    //                                 product_name: element.product_name,
    //                                 product_amount: element.product_amount
    //                             })
    //                         });
    //                         await ObjectMail.ConvertData({
    //                             templateIdentifier: EnumObject.templateIdentifier.get('orderRefundSuccessfully').value,
    //                             orderNumber: transactionMaster.user_order.user_order_number,
    //                             user_id: transactionMaster.user_id,
    //                             first_name: transactionMaster.sycu_user.first_name,
    //                             user_subscription_id: transactionMaster.user_order.user_subscription_id,
    //                             subscriptionNumber: transactionMaster.user_order.user_subscription.subscription_number,
    //                             userOrderId: transactionMaster.user_order.user_orders_id,
    //                             orderCreatedDate: transactionMaster.user_order.created_datetime,
    //                             OrderDetails: OrderDetails,
    //                             orderSubTotal: transactionMaster.user_order.sub_amount,
    //                             paymentMethod: 1,
    //                             orderTotal: orderTotal,
    //                             refund_id: refundsData.refund_id,
    //                             refundData: refundData,
    //                             finalTotal: orderTotal - tempRefAmount,
    //                             site: transactionMaster.site_id,
    //                             user_email: transactionMaster.sycu_user.email,
    //                             SiteName: 'SYCU Account'
    //                         }, function (data: any) {
    //                             console.log('Email Send Successfully.')
    //                         });
    //                     }
    //                 }
    //                 new SuccessResponse(EC.success, {}).send(res)
    //             } else {
    //                 throw new Error("Transaction data not found.")
    //             }
    //         } else {
    //             throw new Error("Charge data not found.")
    //         }
    //     } catch (error: any) {
    //         ApiError.handle(new BadRequestError(error.message), res)
    //     }
    // }

    public async subscriptionInstantPayment(req: Request, res: Response) {
        try {
            let { subscription_ids = [] } = req.body;
            if (subscription_ids.length) {
                let i = 0;
                let nc = new checkoutController();
                while (i < subscription_ids.length) {
                    let subscription_id = subscription_ids[i];
                    await dbWriter.logs.create({
                        type: 2,
                        event_type_id: subscription_id,
                        message: "User attempted to update card information, triggering the Instant Payment feature.",
                    })
                    await dbWriter.notes.create({
                        type: 2,
                        event_type_id: subscription_id,
                        message: "User attempted to update card information, triggering the Instant Payment feature.",
                        is_customer: 0,
                        is_system: 1,
                        // @ts-ignore
                        user_id: req.user_id
                    })
                    let instantPaymentData = await nc.instantPayment(req, subscription_id);
                    if (!instantPaymentData.res) {
                        if (instantPaymentData.err.includes("not have a linked card")) {
                            throw new Error("Please update your credit card and try again.");
                        } else {
                            throw new Error(instantPaymentData.err);
                        }
                    }
                    i++;
                }
                new SuccessResponse("Paid Successfully", { data: true }).send(res);
            } else {
                throw new Error("Please provide the subscription ids.");
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async updateSubscriptionStatus(req: Request, res: Response) {
        try {
            //@ts-ignore
            let { user_id = 0, display_name } = req;
            let { user_subscription_id = 0 } = req.params;

            if (user_subscription_id) {
                let userSubscription = await dbReader.userSubscription.findOne({
                    where: { user_subscription_id: user_subscription_id }
                });
                userSubscription = JSON.parse(JSON.stringify(userSubscription));
                let new_next_payment_date = moment(userSubscription.next_payment_date).add(1, 'days').format("YYYY-MM-DD");

                let data = await dbWriter.userSubscription.update({
                    subscription_status: 3,
                    next_payment_date: new_next_payment_date
                }, {
                    where: { user_subscription_id: user_subscription_id }
                });

                let logdata = await dbWriter.notes.create({
                    type: 2, //Subscription
                    event_type_id: user_subscription_id,
                    message: "Subscription #" + userSubscription.subscription_number + " moved to On Holde from Expire by Admin (" + display_name + ")",
                    is_system: 1,
                    // @ts-ignore
                    user_id: req.user_id
                });

                let lastUserOrder = await dbReader.userOrder.findOne({
                    where: {
                        user_subscription_id: user_subscription_id,
                        order_status: { [Op.ne]: 7 }
                    },
                    order: [['user_orders_id', 'DESC']],
                    limit: 1
                })

                let lastorderrenewal = await dbWriter.subscriptionRenewal.create({
                    attempt_count: 0,
                    renewal_date: new_next_payment_date,
                    user_subscription_id: user_subscription_id,
                    user_orders_id: (lastUserOrder) ? lastUserOrder.user_orders_id : 0,
                    user_id: user_id,
                    end_date: userSubscription.end_date
                });

                new SuccessResponse(EC.updatedDataSuccess, {
                    userSubscription: userSubscription,
                    data: data,
                    logdata: logdata,
                    lastUserOrder: lastUserOrder,
                    lastorderrenewal: lastorderrenewal
                }).send(res);
            } else {
                throw new Error("Please pass user_subscription_id.")
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
}
