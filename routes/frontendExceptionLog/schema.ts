import Joi from 'joi';
import { ErrorController } from "../../core/ErrorController";
const EC = new ErrorController();

export default {
    saveAllErrorFromFrontend: Joi.object().keys({
        api_name: Joi.string().optional(),
        function_name: Joi.string().optional(),
        error_message: Joi.string().optional(),
        error_object: Joi.object().optional(),
        site_id: Joi.number().optional(),
        user_id: Joi.object().optional()
    }),
};