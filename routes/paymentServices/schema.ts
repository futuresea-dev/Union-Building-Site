/*
    * Code done by Sh - 24-11-2021
    * create schema for site_payment_gateway validation 
*/
import Joi from 'joi';
import { ErrorController } from "../../core/ErrorController";
const EC = new ErrorController();

export default {
    updateSitePayload: Joi.object().keys({
        site_id: Joi.number().required()
            .label("Site id")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Site id"])
            }),
        title: Joi.string().required()
            .label("Site title")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Site title"])
            }),
        url: Joi.string().required()
            .label("Site url")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Site url"])
            }),
        description: Joi.string().allow(null, ''),
        logo: Joi.string().allow(null, ''),
        small_logo: Joi.string().allow(null, ''),
        color_code: Joi.string().allow(null, ''),
    }),
    addPaymentServicePayload: Joi.object().keys({
        site_id: Joi.number().required().messages({
            'any.required': EC.siteIdRequired
        }),
        payment_service_id: Joi.number().required().messages({
            'any.required': EC.paymentServiceIdRequired
        }),
        site_payment_service_id: Joi.number().required().messages({
            'any.required': EC.sitePaymentGatewayIdRequired
        }),
        auth_json: Joi.object().required().messages({
            'any.required': EC.authJsonRequired
        }),
    }),
    paymentServicePayload: Joi.object().keys({
        site_payment_service_id: Joi.number().required().messages({
            'any.required': EC.sitePaymentGatewayIdRequired
        })
    }),
    updatePaymentServicePayload: Joi.object().keys({
        site_payment_service_id: Joi.number().required().messages({
            'any.required': EC.sitePaymentGatewayIdRequired
        }),
        site_id: Joi.number().required().messages({
            'any.required': EC.siteIdRequired
        }),
        payment_service_id: Joi.number().required().messages({
            'any.required': EC.paymentServiceIdRequired
        }),
        auth_json: Joi.object().required().messages({
            'any.required': EC.authJsonRequired
        }),
    }),
    listPaymentServicePayload: Joi.object().keys({
        site_id: Joi.number()
            .required()
            .label("site id")
            .greater(0)
            .messages({
                "this.required": EC.errorMessage(EC.required, ["site id"]),
            })
    }),

};