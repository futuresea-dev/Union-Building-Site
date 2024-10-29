import Joi from 'joi';
import { ErrorController } from "../../core/ErrorController";

const EC = new ErrorController();

export default {
    faqIdParams: Joi.object().keys({
        faq_id: Joi.number().min(1).required()
    }),

    faqPayload: Joi.object().keys({
        faq_id: Joi.number().allow('', 0),
        content: Joi.string().allow('', null),
        title: Joi.string().required()
            .label("Title")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Title"])
            }),
        site_id: Joi.number().min(1).required()
            .label("Site id")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Site id"])
            }),
    }),

    listFaqPayload: Joi.object().keys({
        page_no: Joi.number().allow('', 0),
        page_record: Joi.number().allow('', 0),
        site_id: Joi.number().min(1).required()
            .label("Site id")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Site id"])
            }),
    }),
};
