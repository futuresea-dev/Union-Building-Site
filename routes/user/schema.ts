import Joi from 'joi';
import { join } from 'lodash';
import { ErrorController } from "../../core/ErrorController";
const EC = new ErrorController();

import schema from './schema';
export default {
    listAllProductsPayload: Joi.object().keys({
        user_id: Joi.number()
            .required()
            .label("user id")
            .greater(0)
            .messages({
                "this.required": EC.errorMessage(EC.required, ["user id"]),
            }),
        sortOrder: Joi.string().allow(null, ""),
        search: Joi.string().allow(null, ""),
        sortField: Joi.string().allow(null, ""),
        page_record: Joi.number().allow(null, 0),
        site_id: Joi.number().allow(null, 0),
        page_no: Joi.number().allow(null, 0),
        filter: Joi.array().allow(null)
    }),
    userAction: Joi.object().keys({
        user_id: Joi.number().required().greater(0).label("user id").messages({
            "this.required": EC.errorMessage(EC.required, ["user id"])
        }),
        status: Joi.number().required().label("status").messages({
            "this.required": EC.errorMessage(EC.required, ["status"])
        })
    }),
    getSiteAccessDataByUserIdPayload: Joi.object().keys({
        user_id: Joi.number().required().greater(0).label("user id").messages({
            "this.required": EC.errorMessage(EC.required, ["user id"])
        })
    }),
    listLoginLogsPayload: Joi.object().keys({
        user_id: Joi.number().min(1).required(),
        search: Joi.string().allow(null, ""),
        page_record: Joi.number().allow(null, ""),
        page_no: Joi.number().allow(null, ""),
        sort_field: Joi.string().allow(null, ""),
        sort_order: Joi.string().allow(null, ""),
    }),
    sharedDashboardLimitPayload: Joi.object().keys({
        change_user_id: Joi.number().min(1).required(),
        is_shared_dashboard_unlimited: Joi.boolean().required(),
    }),
    allowCircleAccess: Joi.object().keys({
        emails: Joi.array().allow(null),
        status: Joi.number().allow(null, ""),
    }),
    facebookGroupActivity:Joi.object().keys({
        email:Joi.string().required(),
        ba_facebook_groups_id:Joi.number().required(),
        site_id:Joi.number().required(),
        activity:Joi.string().required()
    }),
    addEditFacebookGroup:Joi.object().keys({
        name:Joi.string().required(),
        fb_group_url:Joi.string(),
        ac_tag:Joi.number().required(),
        ba_facebook_groups_id:Joi.number()
    })
};
