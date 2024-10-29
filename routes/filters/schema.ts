/*
    * Code done by Sh - 15-12-2021
    * Create schema for filters validation 
*/
import Joi from 'joi';
import { ErrorController } from "../../core/ErrorController";
const EC = new ErrorController();

export default {   
    filterPayload: Joi.object().keys({
        filter_id: Joi.number().optional().messages({
            'any.required': EC.filterIdRequired,
        }),
        name: Joi.string().required().messages({
            'any.required': EC.nameRequired,
        }),
        slug: Joi.string().allow(null, ''),
        is_popular: Joi.number().allow(null, '').default(0),
        short_name: Joi.string().allow(null, ''),
        filter_type: Joi.number().required().messages({
            'any.required': EC.filterTypeRequired,
        }),
        description: Joi.string().allow(null, ''),
        parent: Joi.number().optional(),
        count: Joi.number().optional(),
    }),
    listFilterPayload: Joi.object().keys({
        filter_type: Joi.number().required().messages({
            'any.required': EC.filterTypeRequired,
        }),
        is_system:Joi.number().required().messages({
            "any.required": EC.errorMessage(EC.required, ["is_system"])
        }),
        // search: Joi.string().allow(null, ''),
    }),
    listFilterDataPayload: Joi.object().keys({
        filter_type: Joi.number().required().messages({
            'any.required': EC.filterTypeRequired,
        }),
        page_record: Joi.number().required().messages({
            'any.required': EC.pageRecordRequired,
        }),
        page_no: Joi.number().required().messages({
            'any.required': EC.pageNoRequired,
        }),
        search: Joi.string().allow(null, ''),
        sort_field: Joi.string().optional(),
        sort_order: Joi.string().optional(),
    }),
    filterDetailPayload: Joi.object().keys({
        filter_id: Joi.number().required().messages({
            'any.required': EC.filterIdRequired,
        })
    }),
    deleteFilterPayload: Joi.object().keys({
        filter_id: Joi.number().required().messages({
            'any.required': EC.filterIdRequired,
        })
    }),
    deleteBulkFilterPayload: Joi.object().keys({
        filter_id: Joi.array().required().messages({
        })
    }),
};