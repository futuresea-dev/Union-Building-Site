import Joi from 'joi';
import { ErrorController } from "../../core/ErrorController";
const EC = new ErrorController();

export default {
  listAffiliatesVisitDataPayload: Joi.object().keys({
    search: Joi
      .string()
      .allow(null, ""),
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
    converted: Joi
      .number()
      .allow(null, 0),
      start_date: Joi.string().allow(null, "").label('Start Date'),
    end_date: Joi.string().allow(null, "").label('End Date')
  }),
}
