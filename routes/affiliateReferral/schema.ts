import Joi from 'joi';
import { ErrorController } from "../../core/ErrorController";
const EC = new ErrorController();

export default {
  saveAffiliateReferralPayload: Joi.object().keys({
    affiliate_referral_id: Joi
      .number()
      .required()
      .messages({ "any.required": EC.errorMessage(EC.required, ["Referral ID"]) }),
    affiliate_id: Joi
      .number()
      .allow(null, 0),
    affiliate_visit_id: Joi.number().required()
      .messages({ "any.required": EC.errorMessage(EC.required, ["Visitor ID"]) }),
    referral_user_id: Joi.number().allow(null, 0),
    notes: Joi.string().allow(null, ""),
    amount: Joi.number().allow(null, 0),
    user_subscription_id: Joi
      .string()
      .allow(null, "")
      .messages({ "any.required": EC.errorMessage(EC.required, ["Subscription ID"]), }),
    type: Joi.number().allow(null, 0),
    status: Joi.number().allow(null, 0)
  }),

  userListAffiliateReferralPayload: Joi.object().keys({
    search: Joi
      .string()
      .allow(null, ""),
    page_no: Joi
      .number()
      .allow(null, 0),
    page_record: Joi
      .number()
      .allow(null, 0)
  }),

  listAffiliateReferralPayload: Joi.object().keys({
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
    type: Joi
      .number()
      .allow(null, ""),
    status: Joi
      .number()
      .allow(null, ""),
    start_date: Joi.string().allow(null, "").label('Start Date'),
    end_date: Joi.string().allow(null, "").label('End Date'),
    range: Joi.object().allow(null, "")
      .label("range")
      .messages({
        'any.required': EC.errorMessage(EC.required, ["range"])
      }),
  }),

  deleteAffiliateReferralPayload: Joi.object().keys({
    affiliate_referral_id: Joi
      .number()
      .required()
      .messages({ "any.required": EC.errorMessage(EC.required, ["Referral ID"]) }),
  }),

  referralPayoutPayload: Joi.object().keys({
    affiliate_referral_id: Joi
      .number()
      .required()
      .messages({ "any.required": EC.errorMessage(EC.required, ["Referral ID"]) }),
    status: Joi
      .number()
      .required()
      .messages({ "any.required": EC.errorMessage(EC.required, ["Status"]) }),
  })
}
