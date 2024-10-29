import { Request, Response } from "express";
import { enumerationController } from '../../enumerationController';
import { ErrorController, SuccessResponse, BadRequestError, ApiError } from '../../../core/index';
import { decodeData } from '../../../helpers/helpers'
const { dbReader, dbWriter } = require('../../../models/dbConfig');
const { GeneralController } = require('../../generalController');
const { stripeMain } = require('./stripeMain');
const stripe = require("stripe")();

const EC = new ErrorController();
var EnumObject = new enumerationController();

export class StripeController {
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
    public addUpdateNewCustomer = async (req: Request, res: Response) => {

        try {
            let generalControllerObj = new GeneralController();
            let { token = null, user_role = null, user_id = 0 } = generalControllerObj.getCurrentUserDetail(req, res);
            let { email, site_id } = generalControllerObj.getCurrentUserDetail(req, res);


            let customer;
            let stripeMainObj = new stripeMain();
            customer = await stripeMainObj.addUpdateNewCustomer(email, user_id, site_id);

            new SuccessResponse(EC.errorMessage(EC.saveDataSuccess), {
                //@ts-ignore
                token: req.token,
                customer
            }).send(res);

        } catch (e: any) {
            return ApiError.handle(new BadRequestError(e.message), res);
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
    public addOrUpdateCard = async (req: Request, res: Response) => {
        try {
            let Errors = "";
            let { cardDetails, site_id, user_id } = req.body;
           
            //@ts-ignore
            let { users_login_log_id } = req

            if (cardDetails && users_login_log_id) {
                let paymentKeysData = await dbReader.paymentKeys.findOne({
                    where: { users_login_log_id: users_login_log_id, is_used: 0, user_id: user_id }
                })
                paymentKeysData = JSON.parse(JSON.stringify(paymentKeysData))
                if (paymentKeysData) {
                    try {
                        cardDetails = decodeData(paymentKeysData.payment_private_key, cardDetails)
                        var { cardNumber, cardExpMonth, cardExpYear, cardCVC, card_holder_name, country, postal_code, customer_id } = cardDetails;
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

            let cardName = card_holder_name;
            let cardDetail = { cardNumber, cardExpMonth, cardExpYear, cardCVC, cardName, country, postal_code };
            let stripeMainObj = new stripeMain();
            let sitePaymentServiceData = await stripeMainObj.getSecreteKey(site_id);

            sitePaymentServiceData = JSON.parse(JSON.stringify(sitePaymentServiceData));
            if (sitePaymentServiceData) {
                switch (sitePaymentServiceData.payment_service_id) {
                    case EnumObject.paymentServiceEnum.get("Stripe").value:
                        let site_credentials = JSON.parse(sitePaymentServiceData.auth_json);
                        let stripe_key = site_credentials.stripe_secret_key;
                        let userStripeDetails = await stripeMainObj.getCustomerDetails(user_id, site_id);
                        if (!userStripeDetails) {
                            let userDetails = await dbReader.users.findOne({
                                where: { user_id: user_id },
                                include: [{
                                    as: 'billingAddress',
                                    model: dbReader.userAddress,
                                    where: { address_type: 1, user_subscription_id: 0, is_deleted: 0 },
                                    attributes: ['address_line1', 'city', [dbReader.Sequelize.literal('`billingAddress->stateModel`.`state_code`'), 'state_code'], [dbReader.Sequelize.literal('`billingAddress->countryModel`.`country_code`'), 'country_code'], 'zipcode'],
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
                            Errors = "Sorry, we are not able to save your card, please setup billing address information.";
                            if (userDetails) {
                                let address = {
                                    line1: userDetails.billingAddress.address_line1,
                                    postal_code: userDetails.billingAddress.zipcode,
                                    city: userDetails.billingAddress.city,
                                    state: userDetails.billingAddress.state_code,
                                    country: userDetails.billingAddress.country_code,
                                };
                                let newCustomer = await stripeMainObj.stripeCustomerInfo(stripe_key, userDetails.display_name, address, userDetails.email, user_id, site_id, sitePaymentServiceData.site_payment_service_id);
                                if (newCustomer.status == true) {
                                    customer_id = newCustomer.payment_getaway_customer.id;
                                    if (!cardDetail.cardName) {
                                        cardDetail.cardName = userDetails.display_name;
                                    }
                                    Errors = "";
                                } else {
                                    Errors = newCustomer.message;
                                }
                            }
                        } else {
                            customer_id = userStripeDetails?.stripe_customer_id ?? 0;
                        }
                        if (Errors == "") {
                            let card = await stripeMainObj.stripeCustomerCardInfo(stripe_key, cardDetail, customer_id, site_id, user_id, sitePaymentServiceData.site_payment_service_id);
                            if (card.status == true) {
                                new SuccessResponse(EC.errorMessage(EC.saveDataSuccess), {
                                    //@ts-ignore
                                    token: req.token,
                                    card
                                }).send(res);
                            }
                            else {
                                Errors = card.message;
                                throw new Error(Errors);
                            }
                        } else {
                            throw new Error(Errors);
                        }
                        break;
                    default:
                        throw new Error("Payment service not available.");
                        break;
                }
            } else {
                throw new Error("Payment service not available.");
            }
        } catch (e: any) {
            return ApiError.handle(new BadRequestError(e.message), res);
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
    // Delete a saved card of the customer
    public deleteCard = async (req: Request, res: Response) => {
        try {
            //@ts-ignore
            let { display_name } = req
            let { pg_customer_card_id, site_payment_service_id = "", site_id } = req.body;
            // if (!pg_customer_card_id || !site_payment_service_id) {
            //     throw new Error("Provide all required data");
            // }
            let cardDetails: any;
            let stripeMainObj = new stripeMain();
            let sitePaymentServiceData = await stripeMainObj.getSecreteKey(site_id);
            let isCardDeleted = false;
            if (sitePaymentServiceData) {
                switch (sitePaymentServiceData.payment_service_id) {
                    case EnumObject.paymentServiceEnum.get("Stripe").value:
                        let site_credentials = JSON.parse(sitePaymentServiceData.auth_json);
                        let stripe_key = site_credentials.stripe_secret_key;

                        cardDetails = await dbReader.userCard.findOne(
                            {
                                where: { pg_customer_card_id: pg_customer_card_id, site_id: site_id/*, site_payment_service_id: sitePaymentServiceData.site_payment_service_id */ },
                            });
                        isCardDeleted = await stripeMainObj.deleteCard(stripe_key, cardDetails.stripe_card_id, cardDetails.stripe_customer_id, site_id, stripe_key, pg_customer_card_id);
                        break;
                    default:
                        throw new Error("Payment service not available.");
                        break;
                }

                await dbWriter.userSubscription.update({
                    pg_card_id: 0
                }, {
                    where: { pg_card_id: pg_customer_card_id }
                });

                await dbWriter.logs.create({
                    type: 3,
                    event_type_id: 0,
                    message: "Card (" + cardDetails ? cardDetails.stripe_card_id : '' + ") is delete by Admin (" + display_name + ")."
                })
            } else {
                throw new Error("Payment service not available.");
            }

            new SuccessResponse(EC.errorMessage(isCardDeleted ? EC.deleteDataSuccess : EC.someThingWentWrong), {
                //@ts-ignore
                token: req.token,
                isCardDeleted
            }).send(res);
        } catch (error: any) {
            return ApiError.handle(new BadRequestError(error.message), res);
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
    public CreatePayment = async (req: Request, res: Response) => {
        try {
            const { amount, cardId, customerId, email, site_id, transaction_type, type = 1, parent_id, transaction_details } = req.body;
            let generalControllerObj = new GeneralController();
            let { token = null, user_role = null, user_id = 0 } = await generalControllerObj.getCurrentUserDetail(req, res);

            let paymentDetails = { amount, cardId, customerId, email, site_id, user_id, transaction_type, type, transaction_details };
            let stripeMainObj = new stripeMain();
            let payment = await stripeMainObj.CreatePayment(paymentDetails, req)
            new SuccessResponse(EC.errorMessage(EC.saveDataSuccess), { 
                //@ts-ignore
                token: req.token,
                payment
            }).send(res);
        } catch (e: any) {
            return ApiError.handle(new BadRequestError(e.message), res);
        }
    }


    public listUserPaymentMethod = async (req: Request, res: Response) => {
        try {
            //@ts-ignore
            let { user_id } = req;
            // let { site_id = 0 } = req.body;
            // let stripeMainObj = new stripeMain();
            // let generalControllerObj = new GeneralController();
            // let { user_id = 0 } = await generalControllerObj.getCurrentUserDetail(req, res);
            // let userStripeDetails = await stripeMainObj.getCustomerDetails(user_id, site_id);
            // let customer_id = userStripeDetails?.stripe_customer_id ?? "";

            // let UserPaymentMethodList: any = [];
            // if (customer_id)
            //     UserPaymentMethodList = await stripeMainObj.customerCardList(customer_id, site_id);
            let UserPaymentMethodCardList = await dbReader.userCards.findAll({
                where: { user_id: user_id, is_deleted: 0 },
                attributes: ['pg_customer_card_id', 'site_id', 'card_type', 'card_no', 'card_holder_name'],
                order: [['pg_customer_card_id', 'DESC'], ['site_id', 'ASC']]
            });
            let message = UserPaymentMethodCardList.length > 0 ? EC.success : EC.noDataFound;
            new SuccessResponse(EC.errorMessage(message), {
                //@ts-ignore
                token: req.token,
                UserPaymentMethodCardList
            }).send(res);
        } catch (e: any) {
            return ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    /**
     *  StripeApplicationFeesList
     */
    public StripeApplicationFeesList = async (req: Request, res: Response) => {
        try {
            let stripeMainObj = new stripeMain();
            let returnData = await stripeMainObj.StripeApplicationFees(2);
            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token,
                returnData
            }).send(res);
        } catch (e: any) {
            return ApiError.handle(new BadRequestError(e.message), res);
        }
    }
}
