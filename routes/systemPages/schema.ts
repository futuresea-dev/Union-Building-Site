/*
    * Code done by Darshit - 02-02-2022
    * create schema for system_pages validation 
*/
import Joi from 'joi';
import { ErrorController } from "../../core/ErrorController";
const EC = new ErrorController();

export default {
    updateSystemPages: Joi.object().keys({
        system_pages_id: Joi.number().allow(0, null),
        page_title: Joi.string().allow("", null),
        json_value: Joi.object().required(),
        site_id: Joi.number().allow(0, null),
        page_type: Joi.number().allow(0, null),
        page_sub_type: Joi.number().allow(0, null),
    }),
    detailSystemPages: Joi.object().keys({
        system_pages_id: Joi.string().required()
    }),
    amazonExternalPageListPayload: Joi.object().keys({
        page_record: Joi.number().allow(),
        page_no: Joi.number().allow(),
        search: Joi.string().allow(null, "").allow(""),
        type: Joi.number().allow(0, null),
        type_id: Joi.number().allow(0, null),
    }),
    addUpdateAmazonExternalPagePayload: Joi.object().keys({
        amazon_events_id: Joi.number().allow('', 0),
        page_link_id: Joi.number().allow('', 0),
        title: Joi.string().required(),
        html_code: Joi.string().required(),
        image_url: Joi.string().allow('', null),
        color_code: Joi.string().allow('', null),
        sub_title: Joi.string().allow('', null),
        description: Joi.string().allow('', null),
        type: Joi.number().allow(0, null),
        type_id: Joi.number().allow(0, null),
    }),
    deleteAmazonExternalPagePayload: Joi.object().keys({
        amazon_events_id: Joi.number().allow()
    }),
    getQuickLinksPayload: Joi.object().keys({
        type: Joi.number().required()
    }),
    blogSiteMapReport: Joi.object().keys({
        page_no: Joi.number().allow(null,0),
        page_record: Joi.number().allow(null,0),
        search: Joi.string().allow(null, ""),
        sort_field: Joi.string().allow(null, ""),
        sort_order: Joi.string().allow(null, ""),
        filter:Joi.number().allow(null,0),
    })
}