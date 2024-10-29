import { Request, Response } from "express";
import { ErrorController } from "../core/ErrorController";
import { SuccessResponse } from '../core/ApiResponse';
import { BadRequestError, ApiError } from '../core/ApiError';
import moment from "moment";
import { timeStamp } from "../helpers/helpers";
const { dbReader, dbWriter } = require('../models/dbConfig');

const EC = new ErrorController();

export class CouponController {

    public async listAllCoupons(req: Request, res: Response) {
        try {
            let { site_id, search, page_record, page_no, sort_field = "", sort_order = "", coupon_filter = 0 } = req.body;
            // coupon_filter = 0:All, 1:General Coupon Used, 2: Scholarship Used
            let row_limit = page_record ? parseInt(page_record) : 10,
                row_offset = page_no ? ((page_no * row_limit) - row_limit) : 0;
            !sort_field ? sort_field = 'coupon_id' : sort_field
            !sort_order ? sort_order = 'DESC' : sort_order

            if (sort_field = "coupon_used_count") {
                sort_field = dbReader.Sequelize.literal(`(SELECT COUNT(coupon_id) FROM sycu_user_coupon where sycu_coupons.coupon_id = sycu_user_coupon.coupon_id)`)
            }
            // Searching                           
            let SearchCondition = dbReader.Sequelize.Op.ne, SearchData = null;
            if (search) {
                SearchCondition = dbReader.Sequelize.Op.like;
                SearchData = "%" + search + "%";
            }

            let coupon_used_count_query = '';
            if (coupon_filter == 1) {
                coupon_used_count_query = `(SELECT COUNT(c1.user_order_item_id) FROM sycu_user_order_items c1 INNER JOIN sycu_user_orders c2 On c2.user_orders_id = c1.user_orders_id AND c2.order_status IN (2,3,4,5,6,8) where c1.product_id = sycu_coupons.coupon_id AND c1.item_type = 5)`;
            } else if (coupon_filter == 2) {
                coupon_used_count_query = `(SELECT COUNT(refunds.refund_id) FROM sycu_refunds AS refunds where refunds.coupon_id = sycu_coupons.coupon_id AND refunds.refund_type = 3)`;
            } else {
                coupon_used_count_query = `(SELECT COUNT(c1.user_order_item_id) FROM sycu_user_order_items c1 INNER JOIN sycu_user_orders c2 On c2.user_orders_id = c1.user_orders_id AND c2.order_status IN (2,3,4,5,6,8) where c1.product_id = sycu_coupons.coupon_id AND c1.item_type = 5) + (SELECT COUNT(refunds.refund_id) FROM sycu_refunds AS refunds where refunds.coupon_id = sycu_coupons.coupon_id AND refunds.refund_type = 3)`;
            }

            let data = await dbReader.coupons.findAndCountAll({
                where: dbReader.Sequelize.and(
                    { is_deleted: 0, site_id: site_id },
                    dbReader.Sequelize.or(
                        { coupon_code: { [SearchCondition]: SearchData } },
                        dbReader.Sequelize.where(dbReader.Sequelize.literal('`customAlias->sycu_product`.`product_name`'), { [SearchCondition]: SearchData })
                    )
                ),
                attributes: ['coupon_id', 'site_id', 'coupon_code', 'coupon_description', 'rate_type', 'rate',
                    'updated_date', 'coupon_expire_date_time', 'max_limit', 'user_used_limit', 'min_cart_amount',
                    [dbReader.Sequelize.literal(coupon_used_count_query), 'coupon_used_count']],
                include: [{
                    required: false,
                    as: 'customAlias',
                    model: dbReader.couponsProduct,
                    where: { is_deleted: 0 },
                    attributes: ['coupons_product_id'],
                    include: [{
                        model: dbReader.products,
                        where: { is_deleted: 0 },
                        attributes: ['product_id', 'product_name']
                    }]
                }, {
                    separate: true,
                    attributes: ['coupons_product_id'],
                    model: dbReader.couponsProduct,
                    where: { is_deleted: 0 },
                    include: [{
                        where: { is_deleted: 0 },
                        model: dbReader.products,
                        attributes: ['product_id', 'product_name']
                    }]
                }, {
                    separate: true,
                    as: 'TopCoupon',
                    model: dbReader.sycuUserCoupon,
                    attributes: ['user_coupon_id', 'user_id', 'coupon_id', 'user_orders_id'],
                }, {
                    separate: true,
                    model: dbReader.userOrderItems,
                    where: { is_deleted: 0, item_type: 5 },
                    attributes: ['user_order_item_id', 'user_orders_id', 'product_id'],
                    include: [{
                        required: true,
                        model: dbReader.userOrder,
                        attributes: ['user_orders_id', 'user_id'],
                        where: { order_status: { [dbReader.Sequelize.Op.ne]: 1 } }
                    }]
                }, {
                    separate: true,
                    attributes: ['user_subscription_item_id', 'user_subscription_id'],
                    model: dbReader.userSubscriptionItems,
                    where: { is_deleted: 0, item_type: 5 },
                    include: [{
                        required: true,
                        model: dbReader.userSubscription,
                        attributes: ['user_subscription_id', 'subscription_number', 'user_id'],
                        where: { subscription_status: [2, 4, 10] },
                    }]
                }, {
                    separate: true,
                    model: dbReader.refunds,
                    attributes: ['refund_id', 'order_id', 'refund_type', 'coupon_id'],
                    where: { refund_type: 3 },
                }],
                limit: row_limit,
                offset: row_offset,
                group: ['coupon_id'],
                order: [[sort_field, sort_order]]
            });
            data = JSON.parse(JSON.stringify(data));
            data.rows.forEach((e: any) => {
                e.total_used_subscriptions = 0
                if (!e.coupon_expire_date_time || (e.coupon_expire_date_time &&
                    (moment(e.coupon_expire_date_time).format('YYYY-MM-DD') > moment().format('YYYY-MM-DD')))) {
                    let TopCouponArray: any = []
                    e.user_order_items.forEach((item: any) => {
                        TopCouponArray.push({
                            user_coupon_id: 0,
                            user_id: item.user_order.user_id,
                            coupon_id: item.product_id,
                            user_orders_id: item.user_orders_id
                        })
                    })
                    if (!e.TopCoupon || !e.TopCoupon.length || (e.TopCoupon && e.TopCoupon.length != TopCouponArray.length)) {
                        e.TopCoupon = TopCouponArray;
                    }
                    let userSubscriptions: any = []
                    e.user_subscription_items.forEach((us: any) => {
                        if (!userSubscriptions.some((i: any) => i.user_subscription_id == us.user_subscription_id)) {
                            let filterTopCoupons = e.TopCoupon.filter((f: any) => f.user_id == us.user_subscription.user_id)
                            if (e.user_used_limit == 0 || e.user_used_limit > filterTopCoupons.length) {
                                userSubscriptions.push({
                                    user_subscription_id: us.user_subscription.user_subscription_id,
                                    subscription_number: us.user_subscription.subscription_number,
                                })
                            }
                        }
                    });
                    e.total_used_subscriptions = userSubscriptions.length
                }
                delete e.user_subscription_items
                delete e.TopCoupon
            });

            let message = data.count > 0 ? EC.success : EC.noDataFound;
            new SuccessResponse(message, {
                //@ts-ignore
                token: req.token,
                count: data.count.length,
                rows: data.rows
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getCouponDetails(req: Request, res: Response) {
        try {
            if (req.params.id) {
                var rows = await dbReader.coupons.findOne({
                    where: {
                        coupon_id: req.params.id,
                        is_deleted: 0
                    },
                    attributes: ['coupon_id', 'site_id', 'coupon_code', 'coupon_description', 'rate_type', 'rate', 'updated_date', 'coupon_expire_date_time', 'max_limit', 'user_used_limit', 'min_cart_amount'],
                    include: [
                        {
                            attributes: ['coupons_product_id'],
                            separate: true,
                            where: { is_deleted: 0 },
                            model: dbReader.couponsProduct,
                            include: [{
                                where: { is_deleted: 0 },
                                model: dbReader.products,
                                attributes: ['product_id', 'product_name']
                            }],
                        },
                    ],
                });

                let message = rows != null ? EC.success : EC.noDataFound;
                new SuccessResponse(message, {
                    //@ts-ignore
                    token: req.token,
                    rows
                }).send(res);
            } else {
                throw new Error(EC.requiredFieldError);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async saveCoupon(req: Request, res: Response) {
        try {
            var reqBody = req.body;
            var coupon, couponId, couponProduct;
            var productIds = reqBody.product_id;
            //@ts-ignore
            let { user_id } = req

            if (reqBody.coupon_id) {
                let verifyCoupons = await dbReader.coupons.count({
                    where: { coupon_code: reqBody.coupon_code, is_deleted: 0, coupon_id: reqBody.coupon_id }
                })

                if (reqBody.coupon_id != null) {
                    coupon = await dbWriter.coupons.update({
                        coupon_code: reqBody.coupon_code,
                        site_id: reqBody.site_id,
                        coupon_description: reqBody.coupon_description || '',
                        rate_type: reqBody.rate_type,
                        rate: reqBody.rate,
                        coupon_expire_date_time: reqBody.coupon_expire_date_time ? reqBody.coupon_expire_date_time : null,
                        max_limit: reqBody.max_limit || 0,
                        user_used_limit: reqBody.user_used_limit || 0,
                        min_cart_amount: reqBody.min_cart_amount || 0,
                        updated_date: new Date(),
                        updated_by: user_id,
                    }, {
                        where: { coupon_id: reqBody.coupon_id }
                    });
                } else {
                    throw new Error("Coupon id doesn't match.")
                }
            } else {
                let verifyCoupons = await dbReader.coupons.count({
                    where: { coupon_code: reqBody.coupon_code, is_deleted: 0, site_id: reqBody.site_id }
                })

                if (verifyCoupons == 0) {
                    coupon = await dbWriter.coupons.create({
                        coupon_code: reqBody.coupon_code,
                        site_id: reqBody.site_id,
                        coupon_description: reqBody.coupon_description || '',
                        rate_type: reqBody.rate_type,
                        rate: reqBody.rate,
                        coupon_expire_date_time: reqBody.coupon_expire_date_time ? reqBody.coupon_expire_date_time : null,
                        max_limit: reqBody.max_limit || 0,
                        user_used_limit: reqBody.user_used_limit || 0,
                        min_cart_amount: reqBody.min_cart_amount || 0,
                        updated_date: new Date(),
                        updated_by: user_id,
                        created_by: user_id,
                    });
                } else {
                    throw new Error("Coupon has been already exist.")
                }
            }

            couponId = coupon.coupon_id || reqBody.coupon_id;

            var couponProductList = await dbReader.couponsProduct.findAll({
                where: {
                    coupon_id: couponId,
                    is_deleted: 0
                },
                attributes: ['coupons_product_id', 'product_id']
            });
            if (couponProductList.length > 0) {
                //Add new product
                var newProductIds: any = [];
                couponProductList.map((a: any) => newProductIds.push(a.product_id));
                var newCouponProducts = productIds.filter((val: any) => { return newProductIds.indexOf(val) == -1 });

                if (newCouponProducts.length > 0) {
                    for (let step = 0; step < newCouponProducts.length; step++) {
                        couponProduct = await dbWriter.couponsProduct.create({
                            coupon_id: couponId,
                            product_id: newCouponProducts[step],
                            updated_datetime: moment().unix(),
                            updated_by: reqBody.updated_by,
                        });
                    }
                }

                //Remove old product
                var removeProductIds: any = [];
                var removeCouponProduct: any = [];
                couponProductList.map((a: any) => removeProductIds.push(a.product_id));
                removeProductIds.filter((val: any) => {
                    if (!productIds.includes(val)) {
                        couponProductList.map((a: any) => {
                            (a.product_id === val) ? removeCouponProduct.push(a.coupons_product_id) : 0
                        })
                    }
                });
                if (removeCouponProduct.length > 0) {
                    dbWriter.couponsProduct.update({
                        is_deleted: 1,
                        updated_datetime: moment().unix(),
                    }, {
                        where: dbWriter.sequelize.and({ coupons_product_id: removeCouponProduct })
                    });
                }
            } else {
                if (productIds.length > 0) {
                    for (let step = 0; step < productIds.length; step++) {
                        couponProduct = await dbWriter.couponsProduct.create({
                            coupon_id: couponId,
                            product_id: productIds[step],
                            created_datetime: moment().unix(),
                            created_by: reqBody.updated_by,
                        });
                    }
                }
            }

            new SuccessResponse(EC.errorMessage(EC.saveCouponSuccess, ["coupon"]), {
                //@ts-ignore
                token: req.token,
                count: coupon.count,
                rows: coupon.rows
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async deleteCoupon(req: Request, res: Response) {
        try {
            var reqBody = req.body;
            var condition = dbReader.Sequelize.Op.in;
            if (reqBody.coupon_id) {
                dbWriter.coupons.update({
                    is_deleted: 1,
                    updated_date: moment().unix(),
                }, {
                    where: dbWriter.sequelize.and({ coupon_id: { [condition]: reqBody.coupon_id } })
                });

                new SuccessResponse(EC.deleteCouponSuccess, {
                    //@ts-ignore
                    token: req.token,
                    data: ''
                }).send(res);
            } else {
                throw new Error(EC.requiredFieldError);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
}
