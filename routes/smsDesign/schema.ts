import Joi from "joi";
import { ErrorController } from "../../core/ErrorController";
const EC = new ErrorController();

/*
    Joi validation for email design template.
    Code done by Smit 24-11-2021
*/
export default {
    updateSMSDesignPayload: Joi.object().keys({
        sms_design_template_id: Joi.number().required().messages({
            "any.required": EC.errorMessage(EC.smsDesignTemplateField, ["SMS Template ID"]),
        }),
        title: Joi.string().required().messages({
            "any.required": EC.errorMessage(EC.smsDesignTemplateField, ["SMS Title"]),
        }),
        sms_content: Joi.string().required().messages({
            "any.required": EC.errorMessage(EC.smsDesignTemplateField, ["SMS Content"]),
        }),
        is_status: Joi.number().messages({
            "any.required": EC.errorMessage(EC.smsDesignTemplateField, ["SMS status"]),
        }).default(1), //true
        site_id: Joi.number().messages({
            "any.required": EC.errorMessage(EC.smsDesignTemplateField, ["Site ID"]),
        }), 
    }),

    getSMSDesignDetail: Joi.object().keys({
        sms_design_template_id: Joi.number().required().messages({
            "any.required": EC.errorMessage(EC.smsDesignTemplateField, ["SMS Template ID"]),
        }),
    }),

    listSMSDesignDetail: Joi.object().keys({
        search: Joi.string().allow(null, ""),
        page_no: Joi.number().allow(null, 0),
        page_record: Joi.number().allow(null, 0),
        site_id: Joi.number().allow(null, 0)
    }),
};
