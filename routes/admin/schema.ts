import Joi from 'joi';
import { join } from 'lodash';
import { ErrorController } from "../../core/ErrorController";
const EC = new ErrorController();

export default {
    idPayload: Joi.object().keys({
        id: Joi.number().min(1).required()
    }),

    saveSMSSeriesPayload: Joi.object().keys({
        site_sms_service_id: Joi.number().allow('', 0),
        is_default: Joi.number().allow(1, 0),
        sms_service_id: Joi.number().required()
            .label("SMS Service id")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["SMS Service id"]),
                'any.empty': EC.errorMessage(EC.required, ["SMS Service id"])
            }),
        site_id: Joi.number().required()
            .label("Site id")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Site id"]),
                'any.empty': EC.errorMessage(EC.required, ["Site id"])
            }),
        service_type: Joi.string().required()
            .label("Service type")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Service type"]),
                'any.empty': EC.errorMessage(EC.required, ["Service type"])
            }),
        service_type_credentials: Joi.object().required()
            .label("Service type credentials")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Service type credentials"]),
                'any.empty': EC.errorMessage(EC.required, ["Service type credentials"])
            }),
    }),
};
