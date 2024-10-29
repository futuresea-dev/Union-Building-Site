import { NextFunction, Request, Response, Router } from "express";
import validator, { ValidationSource } from '../../helpers/validator';
import { SuccessResponse, BadRequestError, ApiError } from '../../core/index';
import schema from './schema';
const { dbReader, dbWriter } = require('../../models/dbConfig');
const { stripeMain } = require('../../controllers/thirdParty/stripe/stripeMain');
const stripe = require("stripe")();
import moment from "moment";
import _ from "lodash"
import { enumerationController } from '../../controllers/enumerationController';
import { NodeMailerController } from "../../controllers/thirdParty/nodeMailerController";
import { checkoutController } from "../../controllers/checkoutController";
var EnumObject = new enumerationController();
var ObjectMail = new NodeMailerController();
const { QueryTypes } = require("sequelize");
let Op = dbReader.Sequelize.Op
import axios from 'axios';

export class WebRoute {
    constructor() {

    }

    public static create(router: Router) {
        router.get("/", (req: Request, res: Response, next: NextFunction) => {
            new WebRoute().index(req, res, next);
        });

        router.get("/testParams/:did?", validator(schema.testParams, ValidationSource.PARAM), (req: Request, res: Response, next: NextFunction) => {
            res.json({
                data: "dax"
            });
        });

        router.get("/testErrorThrow", (req: Request, res: Response, next: NextFunction) => {
            ApiError.handle(new BadRequestError("Custom Error"), res);
            // new SuccessResponse("", {
            //     // @ts-ignore
            //     token: req.token,
            // }).send(res);
        });

        router.get("/StripeMissDataSetup", async (req: Request, res: Response, next: NextFunction) => {
            try {
                let MissDataCnt = await dbReader.transactionMaster.count({
                    where: { request_json: { [dbReader.Sequelize.Op.eq]: '' }, status: 'Success', charge_id: { [dbReader.Sequelize.Op.eq]: '' } }
                })
                if (MissDataCnt) {
                    let loopCnt = Math.ceil(MissDataCnt / 100)
                    let i = 0
                    let stripeMainObj = new stripeMain();
                    while (i < loopCnt) {
                        let MissData = await dbReader.transactionMaster.findAll({
                            where: { request_json: { [dbReader.Sequelize.Op.eq]: '' }, status: 'Success', charge_id: { [dbReader.Sequelize.Op.eq]: '' } },
                            limit: 100
                        })
                        MissData = JSON.parse(JSON.stringify(MissData))
                        if (MissData.length) {
                            let s = 0
                            let response_json = 'case transaction_id ', txn_id = 'case transaction_id ', processing_fee = 'case transaction_id', transaction_id = []
                            while (s < MissData.length) {
                                if (MissData[s].site_id > 0) {
                                    let sitePaymentServiceData = await stripeMainObj.getSecreteKey(MissData[s].site_id);
                                    if (sitePaymentServiceData) {
                                        let site_credentials = JSON.parse(sitePaymentServiceData.auth_json);
                                        switch (sitePaymentServiceData.payment_service_id) {
                                            case EnumObject.paymentServiceEnum.get("Stripe").value:
                                                let stripe_key = site_credentials.stripe_secret_key;
                                                const chargeData = await stripe.charges.retrieve(MissData[s].charge_id, {
                                                    apiKey: stripe_key
                                                });
                                                if (chargeData) {
                                                    let processing_fees = 0
                                                    const balanceTransaction = await stripe.balanceTransactions.retrieve(
                                                        chargeData.balance_transaction, {
                                                        apiKey: stripe_key
                                                    });
                                                    if (balanceTransaction) {
                                                        processing_fees = balanceTransaction.fee / 100
                                                    }
                                                    transaction_id.push(MissData[s].transaction_id)
                                                    response_json += "when " + MissData[s].transaction_id + " then " + JSON.stringify(chargeData)
                                                    txn_id += "when " + MissData[s].transaction_id + " then '" + chargeData.balance_transaction + "'"
                                                    processing_fee += "when " + MissData[s].transaction_id + " then " + processing_fees
                                                }
                                                break;
                                        }
                                    }
                                }
                                s++
                            }
                            if (transaction_id.length) {
                                response_json += " else response_json end"
                                txn_id += " else txn_id end"
                                processing_fee += " else processing_fee end"
                                await dbWriter.transactionMaster.update({
                                    response_json: dbWriter.Sequelize.literal(response_json),
                                    txn_id: dbWriter.Sequelize.literal(txn_id),
                                    processing_fee: dbWriter.Sequelize.literal(processing_fee),
                                }, {
                                    where: { transaction_id: transaction_id }
                                })
                            }
                        }
                    }
                }
            } catch (err: any) {
                res.json({
                    res: 1,
                    message: err.message
                });
            }
        })

        router.post("/takeStripePayment", async (req: Request, res: Response, next: NextFunction) => {
            try {
                let { site_id, user_id, total_payment_amount, cardDetails, newOrderList, pg_customer_card_id, pg_customer_id, emailPayload } = req.body
                let obj = new WebRoute();
                let payment_checkout_Detail = {
                    site_id: site_id,
                    user_id: user_id,
                    check_out_amount: Math.round(total_payment_amount * 100) ?? 0,
                    cardDetail: cardDetails,
                    orderDetailsList: newOrderList,
                    pg_customer_id: pg_customer_id,
                    pg_customer_card_id: pg_customer_card_id,
                    req: req,
                    emailPayload: emailPayload
                };
                await obj.takePaymentAndSaveCard(payment_checkout_Detail);

            } catch (err: any) {
                ApiError.handle(new BadRequestError(err.message), res);
            }
        })

        router.get("/TestService", async (req: Request, res: Response, next: NextFunction) => {
            try {
                var limit = 100;
                var offset = 0;
                var cnt = 0
                var data = [];
                do {
                    console.log("-------------------------------------")
                    console.log("Main Counter : " + ++cnt)
                    data = await dbReader.sequelize.query("SELECT user_id,(SELECT COUNT(a.`message_build_list_id`) FROM gb_message_buildlist a LEFT JOIN gb_build_elements_details b ON a.`message_build_list_id` = b.build_list_id WHERE b.is_delete = 0 AND b.is_series = 0 AND a.user_id = c.user_id AND b.`content` != '') ct FROM `sycu_users` c WHERE c.`is_deleted` = 0 HAVING ct > 0 ORDER BY c.user_id ASC limit :limit offset :offset", {
                        replacements: { limit: limit, offset: offset },
                        type: QueryTypes.SELECT,
                    });
                    offset = offset + 100;
                    var s = 0;
                    while (s < data.length) {
                        console.log((s + 1) + " - User Id : " + data[s].user_id);
                        await dbReader.sequelize.query("UPDATE `gb_build_elements_details` a LEFT JOIN `gb_message_buildlist` b ON a.build_list_id = b.`message_build_list_id` SET a.content = REPLACE(REPLACE(a.content, 'font-size: 10px;', 'font-size: 16px;'),'font-size:10px;','font-size: 16px;') WHERE (a.`content` LIKE '%font-size: 10px;%' OR a.`content` LIKE '%font-size:10px;%') AND a.is_delete = 0 AND a.is_series = 0 AND b.user_id = :user_id AND a.`content` != ''", {
                            replacements: { user_id: data[s].user_id },
                            type: QueryTypes.UPDATE,
                        });
                        s++
                    }
                } while (data.length == 0)

                new SuccessResponse("Success", {
                    data: data,
                }).send(res);
            } catch (err: any) {
                ApiError.handle(err.message, res);
            }
        })

        router.get("/updateSiteidInUserMemberships", async (req: Request, res: Response, next: NextFunction) => {
            try {
                let membershipData = await dbReader.userMemberships.findAll({
                    where: { is_deleted: 0, site_id: 0 },
                    attributes: ['user_membership_id', 'membership_id', 'site_id'],
                    include: [{
                        required: true,
                        model: dbReader.membership,
                        attributes: ['membership_id', 'site_id']
                    }]
                });
                membershipData = JSON.parse(JSON.stringify(membershipData));
                let s = 0
                while (s < membershipData.length) {
                    let site_id = (membershipData[s].sycu_membership && membershipData[s].sycu_membership.site_id) ?
                        membershipData[s].sycu_membership.site_id : membershipData[s].site_id;
                    await dbWriter.userMemberships.update({
                        site_id: site_id
                    }, {
                        where: { user_membership_id: membershipData[s].user_membership_id }
                    });
                    s++
                }
                console.log(membershipData.length)
                new SuccessResponse("Success", {
                    data: membershipData,
                }).send(res);
            } catch (err: any) {
                ApiError.handle(err.message, res);
            }
        })

        router.get("/stripDashboardPayment", async (req: Request, res: Response) => {
            try {
                let hasMore = true, newTransaction: any = [], customerIds: any = [], cardIds: any = [], lastChargeId = '';
                var row_limit = 100, page_no = 1;
                while (hasMore) {
                    newTransaction = []
                    let charges;
                    var chargeIds: any = [], transactionData: any = [];
                    if (page_no == 1) {
                        charges = await stripe.charges.list({
                            limit: row_limit
                        }, {
                        });
                        lastChargeId = charges.data[charges.data.length - 1].id;
                        charges.data.forEach((e: any) => {
                            if (e.id != '' && e.status == "succeeded" && e.object == "charge") {
                                chargeIds.push(e.id)
                            }
                        });
                    } else {
                        charges = await stripe.charges.list({
                            limit: row_limit,
                            starting_after: lastChargeId
                        }, {
                        });
                        lastChargeId = charges.data[charges.data.length - 1].id;
                        chargeIds = [];
                        charges.data.forEach((e: any) => {
                            if (e.id != '' && e.status == "succeeded" && e.object == "charge") {
                                chargeIds.push(e.id);
                            }
                        })
                    }
                    transactionData = await dbReader.transactionMaster.findAll({
                        attributes: ['transaction_id', 'charge_id'],
                        where: {
                            charge_id: { [Op.in]: chargeIds }
                        }
                    });
                    transactionData = JSON.parse(JSON.stringify(transactionData));
                    chargeIds = []
                    transactionData.forEach((e: any) => chargeIds.push(e.charge_id));
                    const filtered = charges.data.filter((e: any) => !chargeIds.includes(e.id));
                    let transactionArray: any = [];
                    if (filtered.length) {
                        filtered.forEach((e: any) => {
                            customerIds.push(e.customer);
                            cardIds.push(e.payment_method);
                            newTransaction.push(e);
                        });
                        let customersData = await dbReader.stripeCustomer.findAll({
                            where: { stripe_customer_id: { [Op.in]: customerIds } }
                        });
                        customersData = JSON.parse(JSON.stringify(customersData));
                        let cardsData = await dbReader.userCard.findAll({
                            where: { stripe_card_id: { [Op.in]: cardIds } }
                        });
                        cardsData = JSON.parse(JSON.stringify(cardsData));
                        transactionArray = []
                        for (let i = 0; i < newTransaction.length; i++) {
                            if (customersData.some((e: any) => e.stripe_customer_id == newTransaction[i].customer)) {
                                transactionArray.push({
                                    user_id: customersData.find((e: any) => e.stripe_customer_id == newTransaction[i].customer).user_id,
                                    site_id: 2,
                                    request_json: '',
                                    response_json: JSON.stringify(newTransaction[i]),
                                    status: newTransaction[i].status == 'succeeded' ? 'Success' : 'failure',
                                    stripe_customer_id: customersData.find((e: any) => e.stripe_customer_id == newTransaction[i].customer).sycu_stripe_customer_id,
                                    stripe_card_id: cardsData.find((e: any) => e.stripe_card_id == newTransaction[i].payment_method) ? cardsData.find((e: any) => e.stripe_card_id == newTransaction[i].payment_method).pg_customer_card_id : '',
                                    amount: newTransaction[i].amount / 100,
                                    charge_id: newTransaction[i].id,
                                    transaction_type: 1,
                                    type: 1,
                                    parent_id: 0,
                                    payment_type: 1,
                                    site_payment_service_id: 126,
                                    txn_id: newTransaction[i].balance_transaction,
                                    transaction_details: "Stripe Dashboard Payment"
                                });
                            }
                        }
                        // if (transactionArray.length) {
                        //     await dbWriter.transactionMaster.bulkCreate(transactionArray);
                        //     console.log("Added: ", page_no);
                        // }
                    }
                    console.log("PAGE: ", page_no, " - IN-Rec: ", transactionArray.length);
                    page_no++;
                    if (!charges.has_more) {
                        hasMore = false
                    }
                }
                new SuccessResponse("Success", {}).send(res);
            } catch (err: any) {
                ApiError.handle(new BadRequestError(err.message), res);
            }
        })

        router.get("/SeriesResourceDataSetup", async (req: Request, res: Response) => {
            try {
                let data = await dbReader.categoriesDetail.findOne({
                    where: { category_id: 184, is_deleted: 0, detail_key: "series_resources" }
                });
                data = JSON.parse(JSON.stringify(data))
                let seriesData = await dbReader.categories.findAll({
                    where: { category_id: { [dbReader.Sequelize.Op.ne]: 184 }, parent_category_id: { [dbReader.Sequelize.Op.ne]: 0 }, ministry_type: 1, is_deleted: 0 },
                    include: [{
                        required: false,
                        model: dbReader.categoriesDetail,
                        where: { detail_key: "series_resources" }
                    }]
                })
                // seriesData = JSON.stringify(JSON.parse(seriesData))
                let new_series_resources: any = [], update_series_resources_id: any = [], edit_series_resources_data = "case categories_detail_id "
                seriesData.forEach((ele: any) => {
                    let element = ele.dataValues
                    if (element.categories_details.dataValues.length) {
                        // (3) [2466, 2470, 2478]
                        update_series_resources_id.push(element.categories_details[0].dataValues.categories_detail_id)
                        edit_series_resources_data += ` when ${element.categories_details[0].dataValues.categories_detail_id} then '${data.detail_value}'`
                    } else {
                        new_series_resources.push({
                            category_id: element.category_id,
                            detail_key: 'series_resources',
                            detail_value: data.detail_value
                        })
                    }
                });
                if (update_series_resources_id.length) {
                    edit_series_resources_data += " else detail_value end"
                    await dbWriter.categoriesDetail.update({
                        detail_value: dbWriter.Sequelize.literal(edit_series_resources_data),
                        // updated_datetime: new Date()
                    }, {
                        where: { categories_detail_id: update_series_resources_id }
                    })
                }
                if (new_series_resources.length) {
                    await dbWriter.categoriesDetail.bulkCreate(new_series_resources)
                }
                res.json({
                    res: true
                })
            } catch (err: any) {
                res.json({
                    res: false,
                    message: err.message
                })
            }
        })

        router.get("/getSubscriptionChartData", async (req: Request, res: Response) => {
            try {
                let { current_range, previous_range, filter_new, site_id } = req.body;
                let siteCondition = {};
                if (site_id) {
                    siteCondition = { site_id: site_id }
                }
                if ((current_range.end_date).slice(-2) == '59') {
                    current_range.end_date = moment(current_range.end_date).add(1, 'minutes').format('YYYY-MM-DD HH:mm')
                }
                if ((previous_range.end_date).slice(-2) == '59') {
                    previous_range.end_date = moment(previous_range.end_date).add(1, 'minutes').format('YYYY-MM-DD HH:mm')
                }
                let subscriptionData = await dbReader.userOrder.findAll({
                    attributes: ['total_amount', [dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m-%d %H:%i'), 'created_datetime']],
                    where: dbReader.Sequelize.and(
                        dbReader.Sequelize.or(
                            dbReader.Sequelize.and(
                                dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('user_orders.created_datetime'), '%Y-%m-%d %H:%i'), { [Op.gte]: current_range.start_date }),
                                dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('user_orders.created_datetime'), '%Y-%m-%d %H:%i'), { [Op.lte]: current_range.end_date })
                            ),
                            dbReader.Sequelize.and(
                                dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('user_orders.created_datetime'), '%Y-%m-%d %H:%i'), { [Op.gte]: previous_range.start_date }),
                                dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('user_orders.created_datetime'), '%Y-%m-%d %H:%i'), { [Op.lte]: previous_range.end_date })
                            ),
                        ),
                        { parent_user_order_id: { [Op.eq]: 0 } },
                        { order_status: { [Op.in]: [2, 3, 4, 5, 6, 8] } }
                    ),
                    include: [{
                        required: true,
                        model: dbReader.userSubscription,
                        attributes: ['user_subscription_id', 'subscription_number'],
                        where: siteCondition,
                        include: [{
                            model: dbReader.users,
                            attributes: ['user_id', 'email']
                        }]
                    }, {
                        separate: true,
                        model: dbReader.userOrderItems,
                        attributes: ['product_name'],
                        where: { item_type: 1, is_deleted: 0 },
                    }],
                    order: [['created_datetime', 'ASC']]
                });
                if (subscriptionData.length > 0) {
                    subscriptionData = JSON.parse(JSON.stringify(subscriptionData));
                    var current_count = 0, previous_count = 0;
                    var current_total_amount = 0, previous_total_amount = 0;
                    let getCounts = (arrCurrent: any, arrPrevious: any) => {
                        var final: any = [];
                        for (let ele of arrCurrent) {
                            for (let value of subscriptionData) {
                                if (value.created_datetime >= ele.start_date && value.created_datetime <= ele.end_date) {
                                    ele.current++;
                                    current_count++;
                                    ele.total_amount = value.total_amount;
                                    current_total_amount = current_total_amount + value.total_amount
                                    ele.subscriptions.push(value)
                                }
                            }
                        }
                        for (let ele of arrPrevious) {
                            for (let value of subscriptionData) {
                                if (value.created_datetime >= ele.start_date && value.created_datetime <= ele.end_date) {
                                    ele.previous++;
                                    previous_count++;
                                    ele.total_amount = value.total_amount;
                                    previous_total_amount = previous_total_amount + value.total_amount
                                    ele.subscriptions.push(value)
                                }
                            }
                        }
                        for (let i = 0; i < Math.min(arrCurrent.length, arrPrevious.length); i++) {
                            let current: any = { "current_count": 0 }, previous: any = { "previous_count": 0 };
                            if (filter_new == 'hour') {
                                current.start_date = arrCurrent[i].start_date;
                                current.end_date = arrCurrent[i].end_date;
                                current.subscriptions = arrCurrent[i].subscriptions;
                                previous.start_date = arrPrevious[i].start_date;
                                previous.end_date = arrPrevious[i].end_date;
                                previous.subscriptions = arrPrevious[i].subscriptions;
                            }
                            else {
                                current.start_date = moment(arrCurrent[i].start_date).format('MM/DD/YY');
                                current.end_date = moment(arrCurrent[i].end_date).format('MM/DD/YY');
                                current.subscriptions = arrCurrent[i].subscriptions;
                                previous.start_date = moment(arrPrevious[i].start_date).format('MM/DD/YY');
                                previous.end_date = moment(arrPrevious[i].end_date).format('MM/DD/YY');
                                previous.subscriptions = arrPrevious[i].subscriptions;
                            }
                            current.current_count = arrCurrent[i].current;
                            previous.previous_count = arrPrevious[i].previous;
                            final.push({ "current": current, "previous": previous });
                        }
                        final.reverse();
                        return { final };
                    }
                    switch (filter_new) {
                        case 'day': //by day
                            var daysOfYear1: any = [], daysOfYear2: any = [], tempDate1: any, tempDate2: any;
                            let currentStart = moment(current_range.start_date).format('MM/DD/YY');
                            let currentEnd = moment(current_range.end_date).format('MM/DD/YY');
                            let previousStart = moment(previous_range.start_date).format('MM/DD/YY');
                            let previousEnd = moment(previous_range.end_date).format('MM/DD/YY');
                            let _diff = moment(currentEnd).diff(moment(currentStart), 'days');
                            let _diff1 = moment(previousEnd).diff(moment(previousStart), 'days');
                            if ((current_range.start_date).split(' ')[1] == '04:00') {
                                _diff = moment(currentEnd).diff(moment(currentStart), 'days') + 1;
                                _diff1 = moment(previousEnd).diff(moment(previousStart), 'days') + 1;
                            }
                            for (var a = 1; a <= _diff; a++) {
                                if (!daysOfYear1.length) {
                                    tempDate1 = moment(moment(currentStart).add(1, 'days')).set({ hour: 0, minute: 0, second: 0 });
                                    daysOfYear1.push({
                                        "start_date": current_range.start_date,
                                        "end_date": moment(tempDate1).format('YYYY-MM-DD HH:mm'),
                                        "current": 0,
                                        "total_amout": 0,
                                        "subscriptions": []
                                    });
                                } else if (a == _diff) {
                                    daysOfYear1.push({
                                        "start_date": moment(tempDate1).format('YYYY-MM-DD HH:mm'),
                                        "end_date": current_range.end_date,
                                        "current": 0,
                                        "total_amout": 0,
                                        "subscriptions": []
                                    });
                                } else {
                                    var flag: any = moment(tempDate1);
                                    flag = moment(flag.add(1, 'days')).set({ hour: 0, minute: 0, second: 0 });
                                    daysOfYear1.push({
                                        "start_date": moment(tempDate1).format('YYYY-MM-DD HH:mm'),
                                        "end_date": moment(flag).format('YYYY-MM-DD HH:mm'),
                                        "current": 0,
                                        "total_amout": 0,
                                        "subscriptions": []
                                    });
                                    tempDate1 = moment(tempDate1.add(1, 'days')).set({ hour: 0, minute: 0, second: 0 });
                                }
                            }
                            for (var b = 1; b <= _diff1; b++) {
                                if (!daysOfYear2.length) {
                                    tempDate2 = moment(moment(previousStart).add(1, 'days')).set({ hour: 0, minute: 0, second: 0 });
                                    daysOfYear2.push({
                                        "start_date": previous_range.start_date,
                                        "end_date": moment(tempDate2).format('YYYY-MM-DD HH:mm'),
                                        "previous": 0,
                                        "total_amout": 0,
                                        "subscriptions": []
                                    });
                                } else if (b == _diff1) {
                                    daysOfYear2.push({
                                        "start_date": moment(tempDate2).format('YYYY-MM-DD HH:mm'),
                                        "end_date": previous_range.end_date,
                                        "previous": 0,
                                        "total_amout": 0,
                                        "subscriptions": []
                                    });
                                } else {
                                    var flag: any = moment(tempDate2);
                                    flag = moment(flag.add(1, 'days')).set({ hour: 0, minute: 0, second: 0 });
                                    daysOfYear2.push({
                                        "start_date": moment(tempDate2).format('YYYY-MM-DD HH:mm'),
                                        "end_date": moment(flag).format('YYYY-MM-DD HH:mm'),
                                        "previous": 0,
                                        "total_amout": 0,
                                        "subscriptions": []
                                    });
                                    tempDate2 = moment(tempDate2.add(1, 'days')).set({ hour: 0, minute: 0, second: 0 });
                                }
                            }
                            daysOfYear1.reverse(); daysOfYear2.reverse();
                            var result = getCounts(daysOfYear1, daysOfYear2);
                            new SuccessResponse('', {
                                current: current_count,
                                previous: previous_count,
                                current_total_amount: current_total_amount,
                                previous_total_amount: previous_total_amount,
                                rows: result.final
                            }).send(res);
                            break;
                    }
                } else new SuccessResponse('', {
                    current: 0,
                    previous: 0,
                    rows: []
                }).send(res);
            } catch (e: any) {
                ApiError.handle(new BadRequestError(e.message), res);
            }
        })

        router.get("/getData", async (req: Request, res: Response, next: NextFunction) => {
            try {
                var config: any = {
                    method: 'get',
                    url: `http://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/athletes?lang=en&region=us&limit=600&offset=1`,
                    headers: { 'Content-Type': 'application/json' }
                };
                let data = await axios(config)
                    .then(function (response) {
                        return response.data
                    })
                    .catch(function (error) {
                        throw new Error(error.message)
                    });

                let i = 0, insertArray: any = []
                while (i < data.items.length) {
                    let config_2: any = {
                        method: 'get',
                        url: data.items[i].$ref,
                        headers: { 'Content-Type': 'application/json' }
                    };
                    let data_2 = await axios(config_2)
                        .then(function (response) {
                            return response.data
                        })
                        .catch(function (error) {
                            throw new Error(error.message)
                        });

                    if (data_2) {
                        insertArray.push({
                            original_id: data_2.id,
                            sports_type: data_2.type,
                            first_name: data_2.firstName,
                            last_name: data_2.lastName,
                            display_name: data_2.displayName,
                            short_name: data_2.shortName,
                        })

                        i++
                    }

                    console.log(data.items.length)
                    res.json({ data });
                }
            } catch (err: any) {
                res.json({ err });
            }
        })

        router.get("/CancelMembershipOnRefund", async (req: Request, res: Response, next: NextFunction) => {
            try {
                var checkoutControllerObj = new checkoutController();
                await checkoutControllerObj.CancelMembershipOnRefund(0, 0)
                new SuccessResponse("Success", {}).send(res);
            } catch (err: any) {
                ApiError.handle(new BadRequestError(err.message), res);
            }
        })

        router.get("/updateAttachmentName", async (req: Request, res: Response, next: NextFunction) => {
            try {
                let hub_attachment_ids: any = [];
                let attachments = await dbReader.hubAttachments.findAll({
                    attributes: ['hub_attachment_id', 'parent_id', 'attachments', 'attachment_name'],
                    where: {
                        [dbReader.Sequelize.Op.or]: [
                            { attachment_name: null },
                            { attachment_name: '' }
                        ],
                        parent_type: 1,
                        is_deleted: 0
                    }
                });
                attachments = JSON.parse(JSON.stringify(attachments));
                attachments.forEach((e: any) => {
                    hub_attachment_ids.push(e.hub_attachment_id);
                    e.updated_name = e.attachments.substring(e.attachments.lastIndexOf("/") + 1).replace(/\d{13}/, "");
                });

                for (let i = 0; i < attachments.length; i++) {
                    await dbWriter.hubAttachments.update({
                        attachment_name: attachments[i].updated_name,
                    }, {
                        where: {
                            hub_attachment_id: attachments[i].hub_attachment_id
                        }
                    });
                }
                new SuccessResponse("Success", { hub_attachment_ids, attachments }).send(res);
            }
            catch (err: any) {
                ApiError.handle(new BadRequestError(err), res);
            }
        });

    }

    public index(req: Request, res: Response, next: NextFunction) {
        //set message
        let options: Object = {
            "message": "Welcome to the SYCU Rest API"
        };

        //render template
        res.locals.BASE_URL = "/";

        //add title
        res.locals.title = "Master | SYCU";

        //render view
        res.render("index", options);
    }

    /**
    * take payment and save card
    * @param payment_checkout_Detail 
    * @returns 
   */
    public async takePaymentAndSaveCard(payment_checkout_Detail: any) {
        try {
            let stripeMainObj = new stripeMain();
            let { site_id, user_id, check_out_amount, cardDetail, orderDetailsList, pg_customer_card_id, req, emailPayload } = payment_checkout_Detail;

            let { cardId = "", customerId = "", customer_id = "", userEmail = "", userName = "", card_id = "" } = {};

            let checkOutPayment: any;
            let sitePaymentServiceData = await stripeMainObj.getSecreteKey(site_id);
            let throwError: string = "Payment service not available.";
            if (sitePaymentServiceData) {
                let site_credentials = JSON.parse(sitePaymentServiceData.auth_json);
                let site_payment_service_id = sitePaymentServiceData.site_payment_service_id;
                //get user and user customer details
                let userDetails = await dbReader.users.findOne({
                    where: {
                        user_id: user_id
                    },
                    include: [{
                        model: dbReader.stripeCustomer,
                    }, {
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
                    customerId = userDetails.sycu_stripe_customer?.stripe_customer_id ?? "";
                    customer_id = userDetails.sycu_stripe_customer?.sycu_stripe_customer_id ?? ""
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
                                    if (cardDetail) {
                                        cardDetail.cardName = cardDetail.cardName || userDetails.display_name;
                                        let cardDetails = await stripeMainObj.stripeCustomerCardInfo(stripe_key, cardDetail, customerId, site_id, user_id, site_payment_service_id);
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
                                    emailPayload: emailPayload
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
                                    await dbWriter.transactionMaster.create({
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
                                        payment_type: 1
                                    });
                                }
                                let s = 0;
                                let failed_user_subscription_id: any = [];
                                if (emailPayload) {
                                    while (emailPayload.length > s) {
                                        failed_user_subscription_id.push(emailPayload[s].user_subscription_id);
                                        emailPayload[s].templateIdentifier = EnumObject.templateIdentifier.get('orderFailed').value;
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
                        await dbWriter.transactionMaster.create({
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
                            payment_type: 0
                        });
                    }
                    let s = 0;
                    let failed_user_subscription_id: any = [];
                    if (emailPayload) {
                        while (emailPayload.length > s) {
                            failed_user_subscription_id.push(emailPayload[s].user_subscription_id);
                            emailPayload[s].templateIdentifier = EnumObject.templateIdentifier.get('orderFailed').value;
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
}