//Sa 31-12-2021


import Joi from "joi";
import { ErrorController } from "../../core/ErrorController";
const EC = new ErrorController();

export default {
  saveCountdownConfiguration: Joi.object().keys({
    cc_id: Joi.number()
      .required()
      .messages({
        "any.required": EC.errorMessage(EC.required, [" Countdown_configuration id "]),
      }),
    type: Joi.number()
      .required()
      .messages({
        "any.required": EC.errorMessage(EC.required, [" Countdown type "]),
      }),
    type_value: Joi.string()
      .required()
      .messages({
        "any.required": EC.errorMessage(EC.required, [" Type value "]),
      }),
    is_deleted: Joi.number().allow("").default(0),
  }),
  listCountdownConfiguration: Joi.object().keys({
    type: Joi.number()
      .required()
      .messages({
        "any.required": EC.errorMessage(EC.required, ["type"]),
      })
  }),
  deleteCountdownConfiguration: Joi.object().keys({
    cc_id: Joi
      .number()
      .min(1)
      .required()
      .messages({
        "any.required": EC.errorMessage(EC.required, ["FeatureCard id"]),
      }),
  }),
  saveDefaultCountdown: Joi.object().keys({
    countdown_id: Joi.number()
      .required()
      .messages({
        "any.required": EC.errorMessage(EC.required, [" Countdown_configuration id "]),
      }),
    bg_type: Joi.number()
      .required()
      .messages({
        "any.required": EC.errorMessage(EC.required, [" Countdown type "]),
      }),
    bg_value: Joi.string()
      .required()
      .messages({
        "any.required": EC.errorMessage(EC.required, [" Type value "]),
      }),
    box_bg_color: Joi.string()
      .required()
      .messages({
        "any.required": EC.errorMessage(EC.required, [" Type value "]),
      }),
    box_title: Joi.string()
      .required()
      .messages({
        "any.required": EC.errorMessage(EC.required, [" Type value "]),
      }),
    box_title_color: Joi.string()
      .required()
      .messages({
        "any.required": EC.errorMessage(EC.required, [" Type value "]),
      }),
    box_font_style: Joi.string()
      .required()
      .messages({
        "any.required": EC.errorMessage(EC.required, [" Type value "]),
      }),
    countdown_minutes: Joi.number()
      .required()
      .messages({
        "any.required": EC.errorMessage(EC.required, [" Type value "]),
      }),
  }),
  sortCountdownConfiguration: Joi.object().keys({
    configuration: Joi.array().items({
      cc_id:Joi.number()
      .required()
      .messages({
        "any.required": EC.errorMessage(EC.required, ["countdown configuration"]),
      }),
      sort_order: Joi.number()
      .required()
      .messages({
        "any.required": EC.errorMessage(EC.required, ["sort order "]),
      }),
    })
  }),
  exportCountdownVideo: Joi.object().keys({
    page_no: Joi.number()
        .required()
        .messages({
            "any.required": EC.errorMessage(EC.required, [" page no"]),
        }),
    page_record: Joi.number()
        .required()
        .default(0)
        .messages({
            "any.required": EC.errorMessage(EC.required, [" page record"]),
        }),
}),
};
