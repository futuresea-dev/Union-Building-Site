import Joi from 'joi';
import { join } from 'lodash';
import { ErrorController } from "../../core/ErrorController";
const EC = new ErrorController();

export default {
    transactionPayload: Joi.object().keys({
        site_id: Joi.number().allow(null, 0),
        page_record: Joi.number().allow(null, 0),
        page_no: Joi.number().allow(null, 0),
        sortField: Joi.number().allow(null, 0, ''),
        sortOrder: Joi.number().allow(null, 0),
        search: Joi.number().allow(null, 0, ''),
        filter: Joi.number().allow(null, 0),
        user_id: Joi.number()
        .required()
        .label("user id")
        .greater(0)
        .messages({
            "this.required": EC.errorMessage(EC.required, ["user id"]),
        })
    })
}
