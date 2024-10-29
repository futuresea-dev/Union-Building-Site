import Joi from 'joi';
import { ErrorController } from "../../core/ErrorController";
const EC = new ErrorController();

export default {
  listAffiliatePayoutPayload: Joi.object().keys({
    search: Joi.alternatives().try(Joi.string().allow(null, ""), Joi.number().allow(null, 0)),
    page_no: Joi
      .number()
      .allow(null, 0),
    page_record: Joi
      .number()
      .allow(null, 0),
    sort_field: Joi
      .string()
      .allow(null, ""),
    sort_order: Joi
      .string()
      .allow(null, ""),
    payment_method: Joi
      .number()
      .allow(null, ""),
    status: Joi
      .number()
      .allow(null, ""),
      start_date: Joi.string().allow(null, "").label('Start Date'),
    end_date: Joi.string().allow(null, "").label('End Date')
  })
}
