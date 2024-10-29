/*
    * Code done by Sheetal 24-11-2021
    * create schema for site_payment_gateway validation 
*/
import Joi from 'joi';
import { ErrorController } from "../../core/ErrorController";
const EC = new ErrorController();

export default {
    addSitePaymentGatewayPayload: Joi.object().keys({
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
    sitePaymentGatewayPayload: Joi.object().keys({
        site_payment_service_id: Joi.number().required().messages({
            'any.required': EC.sitePaymentGatewayIdRequired
        })
    })
};