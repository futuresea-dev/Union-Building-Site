import Joi from 'joi';
import { ErrorController } from "../../core/ErrorController";
const EC = new ErrorController();

export default {
    userACStatusUpdatePayload: Joi.object().keys({
        user_id: Joi.number()
            .required()
            .label("user id")
            .greater(0)
            .messages({
                "this.required": EC.errorMessage(EC.required, ["user id"]),
            })
    }),
    freeTrialUserReport:Joi.object().keys({
        search: Joi.string().allow("", null),
        range:Joi.object().keys({
            start_date: Joi.string(),
            end_date: Joi.string()
          }),
        page_no: Joi.number().allow("", null),
        page_record: Joi.number().allow("", null),
      })
};
