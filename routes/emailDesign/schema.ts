import Joi from "joi";
import { ErrorController } from "../../core/ErrorController";
const EC = new ErrorController();

/*
    Joi validation for email design template.
    Code done by Smit 24-11-2021
*/
export default {
    emailDesignPayload: Joi.object().keys({
        email_design_template_id: Joi.number().required().messages({
            "any.required": EC.emailDesignTemplateId,
        }),
        title: Joi.string().required().messages({
            "any.required": EC.emailDesignTemplateTitle,
        }),
        reply_on_email_address: Joi.string().required().messages({
            "any.required": EC.replyOnEmailAddress,
        }),
        template_html_text: Joi.string().required().messages({
            "any.required": EC.templateHtmlText,
        }),
        subject: Joi.string().required().messages({
            "any.required": EC.subject,
        }),
        is_status: Joi.number().messages({
            "any.required": EC.isStatus,
        }).default(1), //true
        site_id: Joi.number().messages({
            "any.required": EC.isFor,
        }), // 1-Auth 2-sub 3-hub ...
    }),
    // getEmailDesignDetail: Joi.object().keys({
    //     id: Joi.string().guid().required().messages({
    //         "any.required": EC.emailDesignTemplateId,
    //     }),
    // })
};
