import Joi from 'joi';
import { ErrorController } from "../../core/ErrorController";
const EC = new ErrorController();

export default {
  userGraphPayload: Joi.object().keys({
    by: Joi.string().allow(null, ''),
    current_year_date_range: Joi.object().required()
      .label("Current year date range")
      .messages({
        'any.required': EC.errorMessage(EC.required, ["Current year date range"])
      }),
    past_year_date_range: Joi.object().required()
      .label("Past year date range")
      .messages({
        'any.required': EC.errorMessage(EC.required, ["Past year date range"])
      }),
    site_id: Joi.number().allow(null, '', 0),
    tz: Joi.number().allow(null, '', 0)
  }),

  userListPayload: Joi.object().keys({
    search: Joi.string().allow(null, ''),
    page_record: Joi.number().allow(null, ''),
    page_no: Joi.number().allow(null, '', 0),
    sort_order: Joi.string().allow(null, ''),
    sort_field: Joi.string().allow(null, ''),
    date_range: Joi.object().allow({}, '', null),
    filter: Joi.object().allow({}, '', null),
    site_id: Joi.number().allow(null, '', 0),
    tz: Joi.number().allow(null, '', 0)
  }),
  chartNewPayload: Joi.object().keys({
    current_range: Joi.object().keys({
      start_date: Joi.string().required().label('Start Date'),
      end_date: Joi.string().required().label('End Date')
    }),
    previous_range: Joi.object().keys({
      start_date: Joi.string().required().label('Start Date'),
      end_date: Joi.string().required().label('End Date')
    }),
    filter_new: Joi.string().required(),
    site_id: Joi.number().allow(null, '', 0),
    tz: Joi.number().allow(null, '', 0)
  }),

  chartRenewPayload: Joi.object().keys({
    current_range: Joi.object().keys({
      start_date: Joi.string().required().label('Start Date'),
      end_date: Joi.string().required().label('End Date')
    }),
    previous_range: Joi.object().keys({
      start_date: Joi.string().required().label('Start Date'),
      end_date: Joi.string().required().label('End Date')
    }),
    filter_renew: Joi.string().required(),
    site_id: Joi.number().allow(null, '', 0),
    tz: Joi.number().allow(null, '', 0)
  }),

  dateWisePayload: Joi.object().keys({
    start_date: Joi.string().required().label('Start Date'),
    end_date: Joi.string().required().label('End Date'),
    page_no: Joi.number().allow(null, 0),
    page_record: Joi.number().allow(null, 0),
    sort_field: Joi.string().allow(null, ''),
    sort_order: Joi.string().allow(null, ''),
    site_id: Joi.number().allow(null, '', 0),
    tz: Joi.number().allow(null, '', 0)
  }),
  dateAndPagination: Joi.object().keys({
    page_record: Joi.number().allow(null, 0),
    page_no: Joi.number().allow(null, 0),
    start_date: Joi.string().required().label('Start Date'),
    end_date: Joi.string().required().label('End Date'),
    site_id: Joi.number().allow(null, 0),
    tz: Joi.number().allow(null, '', 0)
  })
}
