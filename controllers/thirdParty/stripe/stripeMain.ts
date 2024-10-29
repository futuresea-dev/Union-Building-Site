import { Request } from "express";
import moment from "moment";
import { enumerationController } from '../../enumerationController';
import { NodeMailerController } from "../nodeMailerController";
const stripe = require("stripe")();
const { dbReader, dbWriter } = require('../../../models/dbConfig');
var EnumObject = new enumerationController();
var ObjectMail = new NodeMailerController();
export class stripeMain {


    /*
       *@Olson 23-11-21
       * @method : addNewCustomer
       * @params : 
         req interface
         res interface
       * @return : object
       * @description : Create a new customer for stripe
       */
    // Create a new customer for stripe
    public addUpdateNewCustomer = async (email: string, user_id: string, site_id: any) => {
        let responsePayload;
        //router.post("/newCustomer", async (req, res) => {
        //  console.log("\n\n Body Passed:", req.body);
        try {
            if (!site_id)
                site_id = 1;

            let custom_side_id = 0;
            if (site_id) {
                custom_side_id = 2;
            }

            let stripeMainObj = new stripeMain();
            let apiKey = await stripeMainObj.getSecreteKey(site_id);
            let customer;

            customer = await stripe.customers.create(
                {
                    email: email,
                }, {
                apiKey: apiKey
            }
            );
            let dataPayload = await dbReader.stripeCustomer.findOne({
                where: {
                    user_id: user_id,
                    site_id: custom_side_id,
                    is_deleted: 0
                }
            });
            responsePayload = customer;
            if (dataPayload == null || dataPayload == "") {
                dataPayload = await dbWriter.stripeCustomer.create({
                    user_id: user_id,
                    stripe_customer_id: customer.id,
                    site_id: custom_side_id,
                    created_date: moment().unix(),
                    updated_date: moment().unix()
                });
                return { payment_getaway_customer: customer, customer_details: dataPayload };
            }
            else {
                await dbWriter.stripeCustomer.update({
                    user_id: user_id,
                    stripe_customer_id: customer.id,
                    site_id: custom_side_id,
                    created_date: moment().unix()
                }, {
                    where: { stripe_customer_id: customer.id }
                });
                return { payment_getaway_customer: customer, customer_details: dataPayload };
            }
        } catch (e: any) {
            throw new Error(e);
        }
    }

    /*
    *@Ds 31-12-2021
    * @method : addNewCustomer
    * @params :
      req interface
      res interface
    * @return : object
    * @description : Create a new customer for stripe
    */
    // Create a new customer for stripe
    public stripeCustomerInfo = async (apiKey: any, name: string, address: any, email: string, user_id: string, site_id: any, site_payment_service_id: any) => {
        try {
            let customer = await stripe.customers.create({
                name: name,
                email: email,
                address: address
            }, {
                apiKey: apiKey
            });

            site_id = 2

            if (customer) {
                let stripeCustomer = await dbWriter.stripeCustomer.create({
                    user_id: user_id,
                    stripe_customer_id: customer.id,
                    site_payment_service_id: site_payment_service_id,
                    site_id: site_id
                });
                return { status: true, payment_getaway_customer: customer, customer_details: stripeCustomer };
            } else {
                return { status: false, message: "Stripe customer creation issue." };
            }
        } catch (e: any) {
            return { status: false, message: e.message };
        }
    }

    /*
    *@Olson 23-11-21
    * @method : addNewCard
    * @params :
      req interface
      res interface
    * @return : object
    * @description : addNewCard stripe
    */
    public addOrUpdateCard = async (cardDetail: any, customerId: any, site_id: any, user_id: any) => {
        // console.log("\n\n Body Passed:", req.body);
        // Add a new card of the customer
        const {
            cardNumber,
            cardExpMonth,
            cardExpYear,
            cardCVC,
            cardName,
            country,
            postal_code
        } = cardDetail;
        if (!site_id)
            site_id = 1;

        let stripeMainObj = new stripeMain();
        let apiKey = await stripeMainObj.getSecreteKey(site_id);
        if (!cardNumber || !cardExpMonth || !cardExpYear || !cardCVC) {
            throw new Error("Please Provide All Necessary Details to save the card");
        }
        try {
            const cardToken = await stripe.tokens.create({
                card: {
                    name: cardName,
                    number: cardNumber,
                    exp_month: cardExpMonth,
                    exp_year: cardExpYear,
                    cvc: cardCVC,
                    address_country: country,
                    address_zip: postal_code,
                },
                // customer: customer.stripe_id,
                // stripe_account: StripeAccountId,
            }, {
                apiKey: apiKey
            });
            const card = await stripe.customers.createSource(customerId, {
                source: `${cardToken.id}`
            }, {
                apiKey: apiKey
            });
            if (card != null || card != "") {
                let details = await dbReader.userCard.findOne({
                    where: {
                        stripe_customer_id: card.customer,
                        site_id: site_id,
                        fingerprint: card.fingerprint,
                        is_deleted: 0
                    }
                });
                if (details == null || details == "") {
                    details = await dbWriter.userCard.create({
                        site_id: site_id,
                        user_id: user_id,
                        stripe_customer_id: card.customer,
                        fingerprint: card.fingerprint,
                        stripe_card_id: card.id,
                        card_no: card.last4,
                        card_holder_name: card.name
                    });
                    return { payment_getaway_card: card, card_details: details };
                }
                else {
                    let obj = new stripeMain();
                    obj.deleteCard('', details.stripe_card_id, details.stripe_customer_id, site_id)
                    await dbWriter.userCard.update({
                        site_id: site_id,
                        user_id: user_id,
                        stripe_customer_id: card.customer,
                        fingerprint: card.fingerprint,
                        stripe_card_id: card.id,
                        card_no: card.last4,
                        card_holder_name: card.name
                    }, {
                        where: { stripe_customer_id: card.customer, fingerprint: card.fingerprint, is_deleted: 0, site_id: site_id }
                    });
                    return { payment_getaway_card: card, card_details: details };
                }
            }
        } catch (e: any) {
            throw new Error(e);
        }
    }

    /*
    *@DS 31-12-202121
    * @method : addNewCard
    * @params :
        req interface
        res interface
    * @return : object
    * @description : addNewCard stripe
    */
    public stripeCustomerCardInfo = async (apiKey: any, cardDetail: any, customerId: any, site_id: any, user_id: any, site_payment_service_id: any) => {
        // Add a new card of the customer
        const {
            cardNumber,
            cardExpMonth,
            cardExpYear,
            cardCVC,
            cardName,
            country,
            postal_code
        } = cardDetail;

        let custom_side_id = 2

        if (!cardNumber || !cardExpMonth || !cardExpYear || !cardCVC) {
            throw new Error("Please Provide All Necessary Details to save the card");
        }
        try {
            const cardToken = await stripe.tokens.create({
                card: {
                    name: cardName,
                    number: cardNumber,
                    exp_month: cardExpMonth,
                    exp_year: cardExpYear,
                    cvc: cardCVC,
                    address_country: country,
                    address_zip: postal_code,
                }
            }, {
                apiKey: apiKey
            });
            const card = await stripe.customers.createSource(customerId, {
                source: `${cardToken.id}`
            }, {
                apiKey: apiKey
            });
            if (card != null || card != "") {
                let details = await dbReader.userCard.findOne({
                    where: {
                        stripe_customer_id: card.customer,
                        site_id: site_id,
                        fingerprint: card.fingerprint,
                        is_deleted: 0
                    }
                });
                if (details == null || details == "") {
                    details = await dbWriter.userCard.create({
                        site_id: site_id,
                        user_id: user_id,
                        stripe_customer_id: card.customer,
                        site_payment_service_id: site_payment_service_id,
                        fingerprint: card.fingerprint,
                        card_type: card.brand,
                        stripe_card_id: card.id,
                        card_no: card.last4,
                        card_holder_name: card.name
                    });
                    return { status: true, payment_getaway_card: card, card_details: details };
                } else {
                    await dbWriter.userCard.update({
                        site_id: site_id,
                        user_id: user_id,
                        stripe_customer_id: card.customer,
                        fingerprint: card.fingerprint,
                        stripe_card_id: card.id,
                        card_no: card.last4,
                        card_holder_name: card.name
                    }, {
                        where: { stripe_customer_id: card.customer, fingerprint: card.fingerprint, is_deleted: 0, site_id: site_id }
                    });
                    return { status: true, payment_getaway_card: card, card_details: details };
                }
            } else {
                return { status: false, message: "Stript customer card not create." };
            }
        } catch (e: any) {
            return { status: false, message: e.message };
        }
    }

    /*
           *@Olson 23-11-21
           * @method : deleteCard
           * @params :
             req interface
             res interface
           * @return : object
           * @description : Delete a saved card of the customer stripe
           */
    // // Delete a saved card of the customer
    public deleteCard = async (apiKey: any, cardId: any, customerId: any, site_id: any) => {
        try {
            //const { cardId, customerId } = req.body;
            if (!site_id)
                site_id = 1;
            if (!apiKey) {
                let stripeMainObj = new stripeMain();
                apiKey = await stripeMainObj.getSecreteKey(site_id);
            }
            const deleteCard = await stripe.customers.deleteSource(customerId, cardId, {
                apiKey: apiKey
            });
            if (deleteCard.deleted) {
                await dbWriter.userCard.update(
                    { is_deleted: 1 },
                    {
                        where: { stripe_card_id: cardId, site_id: site_id, }
                    });
            }
            return deleteCard;
        }
        catch (error: any) {
            throw new Error(error);
        }
    }

    /*
            *@Olson 23-11-21
            * @method : CreatePayment
            * @params :
              req interface
              res interface
            * @return : object
            * @description :  Create Payment Charge stripe
            */
    /// Create Payment Charge
    public CreatePayment = async (apiKey: any = "", paymentDetails: any, req: Request) => {
        // Create a payment charge
        let { amount, cardId, customerId, email, site_id, user_id, transaction_type, type, orderDetailsList, customer_id, pg_customer_card_id, payment_type, emailPayload, site_payment_service_id = 0, transaction_details, address_details, is_from_upgrade_downgrade } = paymentDetails;
        if (!site_id)
            site_id = 1;
        let stripeMainObj = new stripeMain();
        if (!apiKey) {
            apiKey = await stripeMainObj.getSecreteKey(site_id);
        }
        stripe.sources.create({
            type: 'ach_credit_transfer',
            currency: 'usd',
            owner: {
                email: email
            }
        }, {
            apiKey: apiKey
        });
        try {
            let description = `Stripe Charge Of Amount ${amount} for Payment`
            let orderArr: any = []
            if (orderDetailsList.length) {
                description = ""
                for (let i = 0; i < orderDetailsList.length; i++) {
                    if (orderDetailsList[i].description) {
                        description += orderDetailsList[i].description + ", "
                    }
                    if (orderDetailsList[i].user_orders_id) {
                        orderArr.push(orderDetailsList[i].user_orders_id)
                    }
                }
                if (description) {
                    description = description.slice(0, -2);
                }
            }
            const createCharge = await stripe.charges.create({
                amount: amount,
                currency: "usd",
                metadata: {
                    order_ids: orderArr.toString()
                },
                // receipt_email: email,
                customer: customerId,
                card: cardId,
                description: description,
            }, {
                apiKey: apiKey
            });
            if (createCharge.status === "succeeded") {
                let processing_fee = 0
                if (createCharge.balance_transaction) {
                    const balanceTransaction = await stripe.balanceTransactions.retrieve(
                        createCharge.balance_transaction, {
                        apiKey: apiKey
                    });
                    if (balanceTransaction) {
                        processing_fee = balanceTransaction.fee / 100
                    }
                }
                for (let i = 0; i < orderDetailsList.length; i++) {
                    let parent_id = orderDetailsList[i].user_orders_id;
                    let order_amount = orderDetailsList[i].total_amount;
                    let transactionDetails = await dbWriter.transactionMaster.create({
                        site_payment_service_id: site_payment_service_id,
                        site_id: site_id,
                        user_id: user_id,
                        response_json: JSON.stringify(createCharge),
                        request_json: JSON.stringify(req.body),
                        status: "Success",
                        txn_id: createCharge.balance_transaction || '',
                        processing_fee: processing_fee,
                        stripe_customer_id: customer_id,
                        stripe_card_id: pg_customer_card_id,
                        amount: order_amount,
                        charge_id: createCharge.id,
                        created_date: moment().unix(),
                        transaction_type: transaction_type,
                        type: type,
                        parent_id: parent_id,
                        payment_type: payment_type,
                        transaction_details: transaction_details ? transaction_details : ''
                    });
                }
                return createCharge;
            } else if (createCharge.status === "failure") {
                for (let i = 0; i < orderDetailsList.length; i++) {
                    let parent_id = orderDetailsList[i].user_orders_id;
                    let order_amount = orderDetailsList[i].total_amount;
                    let transactionDetails = await dbWriter.transactionMaster.create({
                        site_payment_service_id: site_payment_service_id,
                        site_id: site_id,
                        user_id: user_id,
                        response_json: JSON.stringify(createCharge),
                        request_json: JSON.stringify(req.body),
                        status: "failure",
                        stripe_customer_id: customer_id,
                        stripe_card_id: pg_customer_card_id,
                        amount: order_amount,
                        charge_id: createCharge.id,
                        created_date: moment().unix(),
                        transaction_type: transaction_type,
                        type: type,
                        parent_id: parent_id,
                        payment_type: payment_type,
                        transaction_details: transaction_details ? transaction_details : ''
                    });
                }
                let s = 0;
                let failed_user_subscription_id: any = [];
                if (emailPayload)
                    while (emailPayload.length > s) {
                        failed_user_subscription_id.push(emailPayload[s].user_subscription_id);
                        emailPayload[s].templateIdentifier = EnumObject.templateIdentifier.get('orderFailed').value;
                        await ObjectMail.ConvertData(emailPayload[s], function (data: any) { });
                        s++;
                    }
                if (failed_user_subscription_id.length) {
                    await dbWriter.userSubscription.update({ subscription_status: 7, updated_datetime: new Date() }, { where: { user_subscription_id: failed_user_subscription_id } });
                    await dbWriter.userOrder.update({ order_status: 7, updated_datetime: new Date() }, { where: { user_subscription_id: failed_user_subscription_id } });
                }
                return createCharge;
            } else {
                throw new Error("Please try again later for payment");
            }
        } catch (error: any) {
            if (error.message == "Invalid amount." || error.message == "Your card has insufficient funds.") {
                error.message = "Due to insufficient balance in your card, your transaction is declined. Please try again with another card."
            }
            for (let i = 0; i < orderDetailsList.length; i++) {
                let parent_id = orderDetailsList[i].user_orders_id;
                let order_amount = orderDetailsList[i].total_amount;
                let transactionDetails = await dbWriter.transactionMaster.create({
                    site_payment_service_id: site_payment_service_id,
                    site_id: site_id,
                    user_id: user_id,
                    response_json: JSON.stringify({ "message": error.message }),
                    request_json: JSON.stringify(req.body),
                    status: "failure",
                    stripe_customer_id: customer_id,
                    stripe_card_id: pg_customer_card_id,
                    amount: order_amount,
                    charge_id: '',
                    created_date: moment().unix(),
                    transaction_type: transaction_type,
                    type: type,
                    parent_id: parent_id,
                    payment_type: payment_type,
                    transaction_details: transaction_details ? transaction_details : ''
                });
            }
            let s = 0;
            let failed_user_subscription_id: any = [];
            if (emailPayload)
                while (emailPayload.length > s) {
                    failed_user_subscription_id.push(emailPayload[s].user_subscription_id);
                    emailPayload[s].templateIdentifier = EnumObject.templateIdentifier.get('orderFailed').value;
                    await ObjectMail.ConvertData(emailPayload[s], function (data: any) { });
                    s++;
                }
            if (failed_user_subscription_id.length) {
                await dbWriter.userSubscription.update({ subscription_status: 7, updated_datetime: new Date() }, { where: { user_subscription_id: failed_user_subscription_id } });
                await dbWriter.userOrder.update({ order_status: 7, updated_datetime: new Date() }, { where: { user_subscription_id: failed_user_subscription_id } });
            }
            throw new Error(error);
        }
    }

    public webhooksConstructEvent = async (site_id: any, body: any, sig: any) => {
        try {
            let endpointSecret = "whsec_K8OeBNbyblU1Tofi6u9yATVP02eqLRbC"
            if (site_id == 5) {
                endpointSecret = "whsec_Uu1wmPXoOGnselzY5nuuNG7UkMEYnpJl"
            } else if (site_id == 6) {
                endpointSecret = "whsec_wqC08MbCYC8qW7yU2XhQBoElxFVsSl8k"
            }
            let event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
            let returnData: any
            switch (event.type) {
                case 'charge.refunded':
                    console.log("charge.refunded")
                    const charge = event.data.object;
                    //console.log(JSON.stringify(charge));
                    if (charge && charge.id) {
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
                        transactionMaster = JSON.parse(JSON.stringify(transactionMaster));
                        if (transactionMaster) {
                            let amount = 0, refund_id = '', refund_status = '', refund_reason = ''
                            if (charge.refunds && charge.refunds.total_count > 0) {
                                amount = charge.refunds.data[0].amount ? charge.refunds.data[0].amount / 100 : 0
                                refund_id = charge.refunds.data[0].id
                                refund_status = charge.refunds.data[0].status
                                refund_reason = charge.refunds.data[0].reason
                            }
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
                                    orderTotal: transactionMaster.user_order.total_amount,
                                    refund_id: refundsData.refund_id,
                                    refundTotal: amount,
                                    finalTotal: transactionMaster.user_order.total_amount - amount,
                                    refundDate: refundsData.created_datetime,
                                    site: transactionMaster.site_id,
                                    user_email: transactionMaster.sycu_user.email,
                                    SiteName: 'SYCU Account'
                                }, function (data: any) {
                                    console.log('Email Send Successfully.')
                                });
                            }
                        }
                    }
                    // returnData = charge
                    break;
                case 'charge.refund.updated':
                    console.log("charge.refund.updated")
                    const refund = event.data.object;
                    console.log(refund);
                    // returnData = refund
                    break;
                default:
                    console.log(`Unhandled event type ${event.type}`);
            }
            return {
                res: true,
                data: returnData
            }
        } catch (err: any) {
            return {
                res: false,
                message: err.message
            }
        }
    }

    public refundPayment = async (charge_id: any, amount: any, site_id: any) => {
        try {
            if (!site_id)
                site_id = 1;

            let stripeMainObj = new stripeMain();
            let sitePaymentServiceData = await stripeMainObj.getSecreteKey(site_id);
            if (sitePaymentServiceData) {
                let site_credentials = JSON.parse(sitePaymentServiceData.auth_json);
                switch (sitePaymentServiceData.payment_service_id) {
                    case EnumObject.paymentServiceEnum.get("Stripe").value:
                        let stripe_key = site_credentials.stripe_secret_key;
                        const refund = await stripe.refunds.create({
                            charge: charge_id,
                            amount: Math.round(amount * 100)
                        }, {
                            apiKey: stripe_key
                        });
                        refund.amount = refund.amount / 100;
                        if (refund != null) {
                            return {
                                status: true,
                                refund: refund
                            };
                        } else {
                            return {
                                status: false,
                                refund: null,
                                message: (refund.message).includes("has been charged back") ? "This transaction has generated the dispute. Please check stripe Dashboard" : refund.message
                            };
                        }
                        break;
                    default:
                        return {
                            status: false,
                            refund: null,
                            message: "Payment method not implemented."
                        };
                        break
                }
            } else {
                return {
                    status: false,
                    refund: null,
                    message: "Payment method not implemented."
                };
            }
        } catch (error: any) {
            return {
                status: false,
                refund: null,
                message: error.message
            };
        }
    }

    public getCustomerDetails = async (user_id: any, site_id: any) => {
        site_id = 2;

        let userStripeDetails = await dbReader.stripeCustomer.findOne({
            where: {
                user_id: user_id, site_id: site_id, is_deleted: 0
            }
        });
        return userStripeDetails;
    }

    public customerCardList = async (user_id: any, site_id: any = 1, limit: any = 100, page_no: any = 0) => {
        try {
            if (!user_id) {
                throw new Error("User id not found.");
            }

            let stripeMainObj = new stripeMain();
            let sitePaymentServiceData = await stripeMainObj.getSecreteKey(site_id);

            let cardsList: any = [];
            if (sitePaymentServiceData) {
                switch (sitePaymentServiceData.payment_service_id) {
                    case EnumObject.paymentServiceEnum.get("Stripe").value:
                        cardsList = await dbReader.userCard.findAll({
                            where: {
                                user_id: user_id, site_id: site_id, is_deleted: 0, site_payment_service_id: sitePaymentServiceData.site_payment_service_id
                            },
                            attributes: ['pg_customer_card_id', 'stripe_customer_id', 'stripe_card_id', 'card_type', 'card_no']
                        });
                        break;
                    default:
                        break;
                }
            }
            return cardsList;
        } catch (err: any) {
            throw new Error(err.message);
        }
    }

    public async getSecreteKey(site_id: any = 1) {
        let stripe_key = "";
        try {
            if (!site_id)
                site_id = 1;

            var sitePaymentGatewayDetails = await dbReader.sitePaymentServices.findOne({
                where: { site_id: site_id, is_deleted: 0 }
            });
            sitePaymentGatewayDetails = JSON.parse(JSON.stringify(sitePaymentGatewayDetails));
            return sitePaymentGatewayDetails;
            // if (sitePaymentGatewayDetails) {
            //     let site_credentials = JSON.parse(sitePaymentGatewayDetails.auth_json);
            //     if (sitePaymentGatewayDetails.payment_service_id == 1) {
            //         stripe_key = site_credentials.stripe_secret_key;
            //     } else {
            //         stripe_key = site_credentials.Secret_key;
            //     }
            //     return stripe_key
            // } else {
            //     console.log("Payment Gateway not found.");
            //     return stripe_key;
            // }
        } catch (e: any) {
            console.log(e.message);
            return stripe_key;
        }
    }

    /**
     * StripeApplicationFees
     */
    public StripeApplicationFees = async (site_id = 1) => {
        try {
            let stripeMainObj = new stripeMain();
            let sitePaymentServiceData = await stripeMainObj.getSecreteKey(site_id);
            if (sitePaymentServiceData) {
                let site_credentials = JSON.parse(sitePaymentServiceData.auth_json);
                switch (sitePaymentServiceData.payment_service_id) {
                    case EnumObject.paymentServiceEnum.get("Stripe").value:
                        let stripe_key = site_credentials.stripe_secret_key;

                        const balanceTransaction = await stripe.balanceTransactions.retrieve(
                            'txn_3LGKlZFEqxr1GzVw1SIAVk5G', {
                            apiKey: stripe_key
                        });
                        return {
                            status: true,
                            applicationFees: balanceTransaction
                        };
                    default:
                        return {
                            status: false,
                            refund: null,
                            message: "Payment method not implemented."
                        };
                }
            } else {
                return {
                    status: false,
                    refund: null,
                    message: "Payment method not implemented."
                };
            }
        } catch (error: any) {
            return {
                status: false,
                refund: null,
                message: error.message
            };
        }
    }

}