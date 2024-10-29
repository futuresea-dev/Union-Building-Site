/*SA-14-042-2022*/
"use strict"
import Joi from "joi";
import { ErrorController } from "../../core/ErrorController";
const EC = new ErrorController();

export default {
    listApiLogs: Joi.object().keys({
        page_record: Joi.number().required().messages({
            "any.required": EC.errorMessage(EC.required, [" Page records "]),
        }),
        page_no: Joi.number().required().messages({
            "any.required": EC.errorMessage(EC.required, ["Page no"])
        }),
        site_id: Joi.array().required().messages({
            "any.required": EC.errorMessage(EC.required, ["site_id "]),
        }),
        date_search: Joi.string().allow("")
    }),
    debuggerIsActiveOrNot: Joi.object().keys({
        site_id: Joi.array().required().messages({
            "any.required": EC.errorMessage(EC.required, ["site_id "]),
        }),
        is_debugger: Joi.bool().required().messages({
            "any.required": EC.errorMessage(EC.required, ["is_debugger"])
        })
    }),
    clearApiLogData: Joi.object().keys({
        site_id: Joi.number().required().messages({
            "any.required": EC.errorMessage(EC.required, ["site_id "]),
        }),
        delete_logs_for: Joi.number().required().messages({
            "any.required": EC.errorMessage(EC.required, ["is_debugger"])
        })
    }),
}