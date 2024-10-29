/*
    * Code done by Darshit - 02-02-2022
    * create schema for system_pages validation 
*/
import Joi from 'joi';
import { ErrorController } from "../../core/ErrorController";
const EC = new ErrorController();

export default {
    redirectionLinkListPayload: Joi.object().keys({
        page_record: Joi.number().allow(),
        site_id: Joi.number().allow(),
        page_no: Joi.number().allow(),
        search: Joi.string().allow(null, "").allow(""),
        redirection_folder_id: Joi.number().allow()
    }),
    redirectionFolderIdPayload: Joi.object().keys({
        page_link_id: Joi.number().allow(),
        redirection_folder_id: Joi.number().allow()
    }),
    addUpdateRedirectionLinkPayload: Joi.object().keys({
        page_link_id: Joi.number().allow('', 0),
        site_id: Joi.number().allow(),
        keyword: Joi.string().required(),
        target_url: Joi.string().required(),
        is_disable: Joi.number().allow('', 0),
        redirection_folder_id: Joi.number().allow('',0)
    }),
    deleteRedirectionLinkPayload: Joi.object().keys({
        page_link_id: Joi.number().allow()
    }),
    statusRedirectionLinkPayload: Joi.object().keys({
        page_link_id: Joi.number().allow(),
        is_disable: Joi.number().allow('', 0),
    })
}