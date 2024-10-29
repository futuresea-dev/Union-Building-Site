import Joi from "joi";
import { ErrorController } from "../../core/ErrorController";
const EC = new ErrorController();

/*
    Code done by santosh 21-04-2022
*/
export default {
    readErrorLogFilesPayload: Joi.object().keys({
        file_name: Joi.string().required().messages({
            "any.required": EC.errorMessage(EC.required, [" file name "]),
        })
    }),
    deleteErrorLogFiles:Joi.object().keys({
        file_name:Joi.array().required().messages({
            "any.required": EC.fileName,
        }),
        site_id:Joi.number().required().messages({
            "any.required": EC.siteId,
        }),
        password:Joi.string().required().messages({
            "any.required": EC.password,
        }),
    })

};
