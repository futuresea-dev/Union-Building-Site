//Sa 31-12-2021

import joi from "joi";
import { ErrorController } from "../../core/ErrorController";
const EC = new ErrorController();

export default {
  saveFeaturedCard: joi.object().keys({
    featured_card_id: joi.number().optional(),
    fc_description: joi
      .string()
      .required()
      .messages({
        "any.required": EC.errorMessage(EC.required, [
          " FeaturedCard description ",
        ]),
      }),
    fc_title: joi
      .string()
      .required()
      .messages({
        "any.required": EC.errorMessage(EC.required, [" FeaturedCard title "]),
      }),
    fc_name: joi
      .string()
      .required()
      .messages({
        "any.required": EC.errorMessage(EC.required, [" FeaturedCard name "]),
      }),
    is_popular: joi
      .number()
      .required()
      .messages({
        "any.required": EC.errorMessage(EC.required, [" Popular "]),
      }),
    is_user_filter: joi
      .number()
      .required()
      .messages({
        "any.required": EC.errorMessage(EC.required, [" User filter "]),
        "any.type": EC.errorMessage(EC.typeNumber, ["User filter "]),
      }),
    fc_title_color: joi
      .string()
      .required()
      .messages({
        "any.required": EC.errorMessage(EC.required, [" Title color "]),
        "any.type": EC.errorMessage(EC.typeNumber, ["Title color "]),
      }),
    fc_description_color: joi
      .string()
      .required()
      .messages({
        "any.required": EC.errorMessage(EC.required, [" Description color "]),
        "any.type": EC.errorMessage(EC.typeNumber, ["Description color "]),
      }),
    fc_color1: joi
      .string()
      .required()
      .messages({
        "any.required": EC.errorMessage(EC.required, [" Color 1"]),
        "any.type": EC.errorMessage(EC.typeNumber, ["Color 1 "]),
      }),
    fc_color2: joi
      .string()
      .required()
      .messages({
        "any.required": EC.errorMessage(EC.required, [" Color 2 "]),
        "any.type": EC.errorMessage(EC.typeNumber, ["Color 2 "]),
      }),
    fc_image: joi
      .string()
      .required()
      .messages({
        "any.required": EC.errorMessage(EC.required, ["Featured image"]),
      }),
    fc_type: joi
      .number()
      .required()
      .messages({
        "any.required": EC.errorMessage(EC.required, ["Featured image"]),
      }),
    fc_type_value: joi
      .string()
      .required()
      .messages({
        "any.required": EC.errorMessage(EC.required, ["Featured image"]),
      }),
  }),
  listFeaturedCard: joi.object().keys({
    page_record: joi
      .number()
      .required()
      .messages({
        "any.required": EC.errorMessage(EC.required, ["Page record"]),
      }),
    page_no: joi
      .number()
      .required()
      .messages({
        "any.required": EC.errorMessage(EC.required, ["Page no"]),
      }),
    search: joi.string().allow(null, ""),
  }),
  deleteFeaturedCard: joi.object().keys({
    featured_card_id: joi
      .number()
      .min(1)
      .required()
      .messages({
        "any.required": EC.errorMessage(EC.required, ["FeatureCard id"]),
      }),
  }),
};
