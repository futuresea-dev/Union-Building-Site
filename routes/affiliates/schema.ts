import Joi from 'joi';
import { ErrorController } from "../../core/ErrorController";
const EC = new ErrorController();

export default {
    listAffiliate: Joi.object().keys({
        affiliate_id: Joi.number().optional().allow(null),
        page_no: Joi.number().optional().allow(null),
        page_record: Joi.number().optional().allow(null),
        search: Joi.string().optional().allow(""),
        filter: Joi.array().allow(null),
        filter_type: Joi.number().optional().allow(null, 0),
        sortField: Joi.string().optional().allow(null, ""),
        sortOrder: Joi.string().optional().allow(null, "")
    }),

    deleteAffiliate: Joi.object().keys({
        affiliate_id: Joi.number().required().messages({
            'any.required': EC.affiliateId
        })
    }),

    addUpdateAffiliate: Joi.object().keys({
        affiliate_id: Joi.number().allow(null, ""),
        user_id: Joi.number().allow(null, ""),
        affiliate_code: Joi.string().allow(""),
        renewal_level: Joi.number(),
        rate_type: Joi.number(),
        rate: Joi.number(),
        first_renewal_rate: Joi.number(),
        second_renewal_rate: Joi.number(),
        consecutive_renewal_rate: Joi.number(),
        status: Joi.number(),
        user_name: Joi.string().allow(""),
        is_curriculum: Joi.number().allow(null, 0, 1),
        is_grow_con: Joi.number().allow(null, 0, 1),
        grow_con_expire_time: Joi.string().allow("", null),
        two_plus_year_commission_rate:Joi.number().allow(null, 0),
        two_plus_year_commission_rate_type:Joi.number().allow(null, 0)
    }),

    getAffiliateDetails: Joi.object().keys({
        affiliate_id: Joi.number().required(),
        page_no: Joi.number().optional().allow(null),
        page_record: Joi.number().optional().allow(null),
        type: Joi.string().optional().allow(""),
        status: Joi.number().optional().allow(null),
        search: Joi.string().optional().allow(""),
        sort_field: Joi.string().allow(null, ""),
        sort_order: Joi.string().allow(null, "")
    })
}
