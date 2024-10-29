/*
    * Code done by ayushi 1-12-2021
    * create schema for Checkout validation 
*/
import Joi from 'joi';
import { AllowNull } from 'sequelize-typescript';
import { ErrorController } from "../../core/ErrorController";
const EC = new ErrorController();

export default {
    checkOutUserSubscriptionPayload: Joi.object().keys({
        coupon_code: Joi.string().allow("", null),
        total_amount: Joi.number()
            .label("total amount")
            .required()
            .messages({
                'any.empty': EC.errorMessage(EC.required, ["total amount"]),
                'any.required': EC.errorMessage(EC.required, ["total amount"]),
                'any.type': EC.errorMessage(EC.typeNumber, ["total amount"])

            }),
        cardDetails: Joi.object()
            .label("card details")
            .required()
            .messages({
                'any.empty': EC.errorMessage(EC.required, ["card details"]),
                'any.required': EC.errorMessage(EC.required, ["card details"]),
            })
            .keys({
                cardNumber: Joi.string()
                    .label("card number")
                    .required()
                    .messages({
                        'any.empty': EC.errorMessage(EC.required, ["card number"]),
                        'any.required': EC.errorMessage(EC.required, ["card number"]),
                        'any.type': EC.errorMessage(EC.typeString, ["card number"])

                    }),
                cardExpMonth: Joi.number()
                    .label("expiry month")
                    .required()
                    .messages({
                        'any.empty': EC.errorMessage(EC.required, ["expiry month"]),
                        'any.required': EC.errorMessage(EC.required, ["expiry month"]),
                        'any.type': EC.errorMessage(EC.typeNumber, ["expiry month"])

                    }),
                cardExpYear: Joi.number()
                    .label("expiry year")
                    .required()
                    .messages({
                        'any.empty': EC.errorMessage(EC.required, ["expiry year"]),
                        'any.required': EC.errorMessage(EC.required, ["expiry year"]),
                        'any.type': EC.errorMessage(EC.typeNumber, ["expiry year"])

                    }),
                cardCVC: Joi.number()
                    .label("CVV")
                    .required()
                    .messages({
                        'any.empty': EC.errorMessage(EC.required, ["CVV"]),
                        'any.required': EC.errorMessage(EC.required, ["CVV"]),
                        'any.type': EC.errorMessage(EC.typeNumber, ["CVV"])

                    }),
            })
    }),
    saveBillingDetailPayload: Joi.object().keys({
        user_address_id: Joi.number()
            .messages({
                'any.required': EC.errorMessage(EC.required, ["user address id"]),
                'any.empty': EC.errorMessage(EC.required, ["user address id"]),
                'string.pattern.base': EC.errorMessage(EC.validFormate, ["user address id"])
            }),
        user_id: Joi.number().allow(null)
            .messages({
                'any.required': EC.errorMessage(EC.required, ["user id"]),
                'any.empty': EC.errorMessage(EC.required, ["user id"]),
                'string.pattern.base': EC.errorMessage(EC.validFormate, ["user id"])
            }),
        email_address: Joi.string()
            .required()
            .regex(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)
            .messages({
                'any.required': EC.errorMessage(EC.required, ["email"]),
                'any.empty': EC.errorMessage(EC.required, ["email"]),
                'string.pattern.base': EC.errorMessage(EC.validFormate, ["email"])
            }),
        phone_number: Joi.string()
            .required()
            .regex(/^[0-9]{10}$/)
            .messages({
                'any.required': EC.errorMessage(EC.required, ["phone number"]),
                'any.empty': EC.errorMessage(EC.required, ["phone number"]),
                'string.pattern.base': EC.errorMessage(EC.validFormate, ["phone number"])
            }),
        address_type: Joi.number()
            .required()
            .messages({
                'any.required': EC.errorMessage(EC.required, ["address type"]),
                'any.empty': EC.errorMessage(EC.required, ["address type"]),

            }),
        is_shipping_same: Joi.number()
            .required()
            .messages({
                'any.required': EC.errorMessage(EC.required, ["is shipping same"]),
                'any.empty': EC.errorMessage(EC.required, ["is shipping same"]),

            }),
        first_name: Joi.string()
            .required()
            .messages({
                'any.required': EC.errorMessage(EC.required, ["name"]),
                'any.empty': EC.errorMessage(EC.required, ["name"]),

            }),
        last_name: Joi.string()
            .required()
            .messages({
                'any.required': EC.errorMessage(EC.required, ["name"]),
                'any.empty': EC.errorMessage(EC.required, ["name"]),

            }),
        name: Joi.string()
            .messages({
                'any.required': EC.errorMessage(EC.required, ["name"]),
                'any.empty': EC.errorMessage(EC.required, ["name"]),

            }),
        address_line1: Joi.string()
            .required()
            .messages({
                'any.required': EC.errorMessage(EC.required, ["address line 1"]),
                'any.empty': EC.errorMessage(EC.required, ["address line 1"]),

            }),
        address_line2: Joi.string()
            .required()
            .messages({
                'any.required': EC.errorMessage(EC.required, ["address line 2"]),
                'any.empty': EC.errorMessage(EC.required, ["address line 2"]),

            }),
        city: Joi.string()
            .required()
            .messages({
                'any.required': EC.errorMessage(EC.required, ["city"]),
                'any.empty': EC.errorMessage(EC.required, ["city"]),

            }),
        state_id: Joi.number()
            .required()
            .messages({
                'any.required': EC.errorMessage(EC.required, ["state id"]),
                'any.empty': EC.errorMessage(EC.required, ["state id"]),

            }),
        country_id: Joi.number()
            .required()
            .messages({
                'any.required': EC.errorMessage(EC.required, ["country id"]),
                'any.empty': EC.errorMessage(EC.required, ["country id"]),

            }),
        zipcode: Joi.string()
            .required()
            .messages({
                'any.required': EC.errorMessage(EC.required, ["zipcode"]),
                'any.empty': EC.errorMessage(EC.required, ["zipcode"]),

            }),
    }),
    saveUserCartDetailPayload: Joi.object().keys({
        user_cart_id: Joi.number(),
        user_id: Joi.number()
            .messages({
                'any.required': EC.errorMessage(EC.required, ["user id"]),
                'any.empty': EC.errorMessage(EC.required, ["user id"])
            }),
        site_id: Joi.number()
            .required()
            .messages({
                'any.required': EC.errorMessage(EC.required, ["site id"]),
                'any.empty': EC.errorMessage(EC.required, ["site id"]),
                'string.pattern.base': EC.errorMessage(EC.validFormate, ["site id"])
            }),
        product_id: Joi.array()
            .min(1)
            .items(Joi.number().required().messages({ 'any.type': EC.errorMessage(EC.typeNumber, ["Product ids"]) }))
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Product ids"]),
                'any.empty': EC.errorMessage(EC.required, ["Product ids"]),
                'string.pattern.base': EC.errorMessage(EC.validFormate, ["Product ids"])
            }),
    }),
    getUserCartDetailPayload: Joi.object().keys({
        user_cart_id: Joi.number(),
        user_id: Joi.number()
            .label("User id"),
        site_id: Joi.number()
            .required()
            .messages({
                'any.required': EC.errorMessage(EC.required, ["site id"]),
                'any.empty': EC.errorMessage(EC.required, ["site id"]),
                'string.pattern.base': EC.errorMessage(EC.validFormate, ["site id"])
            })
    }),
    deleteUserCartDetailPayload: Joi.object().keys({
        user_cart_id: Joi.number().label("user cart id"),
    }),
    confirmPagePayload: Joi.object().keys({
        product_id: Joi.array()
            .required()
            .messages({
                "this.required": EC.errorMessage(EC.required, ["Product id"]),
                "this.empty": EC.errorMessage(EC.required, ["Product id"]),
                "this.type": EC.errorMessage(EC.typeNumber, ["Product id"])
            }),
        site_id: Joi.number()
            .required()
            .messages({
                "this.required": EC.errorMessage(EC.required, ["Site id"]),
                "this.empty": EC.errorMessage(EC.required, ["Site id"]),
                "this.type": EC.errorMessage(EC.typeNumber, ["Site id"])
            }),
        return_url: Joi.string()
            .required()
            .messages({
                "this.required": EC.errorMessage(EC.required, ["Return URL"]),
                "this.empty": EC.errorMessage(EC.required, ["Return URL"]),
                "this.type": EC.errorMessage(EC.typeString, ["Return URL"])
            })
    }),
    cancelSubscription: Joi.object().keys({
        user_subscription_id: Joi.number().required(),
        note: Joi.string().allow(null, "")
    }),
    reactiveSubscription: Joi.object().keys({
        user_subscription_id: Joi.number().required()
    }),
    refundTransaction: Joi.object().keys({
        user_subscription_id: Joi.number().required(),
        user_orders_id: Joi.number().required(),
        user_id: Joi.number().required(),
        transaction_id: Joi.number().required(),
        amount: Joi.number().required(),
        site_id: Joi.number().required(),
        refund_type: Joi.number().optional().allow(null, 0),
        scholarship_code: Joi.string().optional().allow(null, ''),
        coupon_id: Joi.number().optional().allow(null, '', 0),
    }),
    refundTransactionReceipt: Joi.object().keys({
        transaction_id: Joi.number().required()
    }),
    chargeTransactionReceipt: Joi.object().keys({
        transaction_id: Joi.number().required()
    }),
    refundTransactionReceiptPost: Joi.object().keys({
        transaction_id: Joi.number().required(),
        email_address: Joi.string().allow("", null)
    }),
    chargeTransactionReceiptPost: Joi.object().keys({
        transaction_id: Joi.number().required(),
        email_address: Joi.string().allow("", null)
    }),
    getPaymentTokenPayload: Joi.object().keys({
        user_id: Joi.number().required()
    })
};