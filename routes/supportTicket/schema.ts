import Joi from 'joi';
import { ErrorController } from "../../core/ErrorController";
const EC = new ErrorController();

export default {
    listAllTicketsPayload: Joi.object().keys({
        site_id: Joi.number()
            .required()
            .label("site id")
            .greater(0)
            .messages({
                "this.required": EC.errorMessage(EC.required, ["site id"]),
            }),
        page_record: Joi.number().allow(null, 0),
        page_no: Joi.number().allow(null, 0),
        filter: Joi.array().allow(null, 0),
        search: Joi.string().allow(null, ""),
        sort_order: Joi.string().allow(null, ""),
        sort_field: Joi.string().allow(null, ""),
        category_id: Joi.number().allow(null, 0)
    })
};
