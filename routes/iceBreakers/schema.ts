/*
 * Code done by santosh - 14-12-2021
 * create schema for IceBreaker validation
 */
import Joi from "joi";
import { ErrorController } from "../../core/ErrorController";
const EC = new ErrorController();

export default {
  addIceBreakerPayload: Joi.object().keys({
    IceBreaker: Joi.array().items({
      icebreaker_id: Joi.number().allow(),
      is_deleted: Joi.number().optional(),
      icebreaker_title: Joi.string()
        .required()
        .messages({
          "any.required": EC.errorMessage(EC.required, [" Icebreaker title "]),
        }),



      filters: Joi.array()
        .items({
          gi_filter_id: Joi.number().allow(null, "").allow(),
          filter_type: Joi.number().default(2),
          filter_id: Joi.number()
            .required()
            .messages({
              "any.required": EC.errorMessage(EC.required, [" Filter id "]),
            }),
          is_deleted: Joi.number().optional(),
        }).allow("")


    }),
  }),
  listIceBreakerByIdPayload: Joi.object().keys({
    icebreaker_id:
      Joi.number()
        .min(1)
        .required()
        .messages({
          "any.required": EC.errorMessage(EC.required, [" Icebreaker id "]),
        }),
    is_system:
      Joi.number()
        .required()
        .messages({
          "any.required": EC.errorMessage(EC.required, [" Icebreaker id "]),
        }),
  }),
  listIceBreakerPayload: Joi.object().keys({
    page_record: Joi.number().allow(),
    page_no: Joi.number().allow(),
    search: Joi.string().allow(null, "").allow(""),
    sort_field: Joi.string().allow(null, "").allow(""),
    sort_order: Joi.string().allow(null, "").allow(""),
  }),
  listIceBreakerUserPayLoad: Joi.object().keys({
    filter_id: Joi.array().optional(),
    filter_type: Joi.number().optional().default(2),
  }),
  listIceBreakerReportData: Joi.object().keys({
    page_record: Joi.number()
      .required()
      .messages({
        "any.required": EC.errorMessage(EC.required, [" Page record"]),
      }),
    page_no: Joi.number()
      .required()
      .messages({
        "any.required": EC.errorMessage(EC.required, [" Page number"]),
      }),
    search: Joi.number().allow(""),
    start_date: Joi.string().allow(""),
    end_date: Joi.string().allow(""),
    sort_order: Joi.string().allow(),
    sort_field: Joi.string().allow(""),
  }),
  exportIceBreakerData: Joi.object().keys({
    search: Joi.number().allow(""),
    start_date: Joi.string().allow(""),
    end_date: Joi.string().allow(""),
  }),
  bulkDeleteIceBreaker: Joi.object().keys({
    icebreaker_id: Joi.array().min(1).required().messages({
      "any.required": EC.errorMessage(EC.required, ["IceBreaker id"])
    })

  })
};
