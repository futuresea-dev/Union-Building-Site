import Joi from 'joi';
import { join } from 'lodash';
import { ErrorController } from "../../core/ErrorController";
const EC = new ErrorController();

export default {
  saveCalenderPayload: Joi.object().keys({
    calendar_id: Joi.number().optional(),
    calendar_title: Joi.string().required(),
    calendar_content: Joi.string().required(),
    category_id: Joi.number().required(),
    user_id: Joi.number().allow(null, 0).label('User id'),
    attachment: Joi.array().allow()
  }),

  listingCalenderPayload: Joi.object().keys({
    category_id: Joi.number().required(),
  }),

  deleteCalenderPayload: Joi.object().keys({
    calendar_id: Joi.number().required()
  }),

  saveSortOrderOfCalendars: Joi.object().keys({
    calendars: Joi.array().required()
  })
};
