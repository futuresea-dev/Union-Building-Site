import Joi from 'joi';
import { join } from 'lodash';
import { ErrorController } from "../../core/ErrorController";
const EC = new ErrorController();

export default {
    listingPayload: Joi.object().keys({
        ministry_type: Joi.number().required()
    }),
    deleteGrowStoryPayload: Joi.object().keys({
        story_id: Joi.number().required()
    }),
    sortGrowStoriesPayload: Joi.object().keys({
        stories: Joi.array().required()
    }),
    updateGrowStoryStatus: Joi.object().keys({
        story_id: Joi.number().required(),
        status: Joi.number().required()
    }),
    saveGrowStoryPayload: Joi.object().keys({
        user_name: Joi.string().required(),
        ministry_type: Joi.number().required(),
        status: Joi.number().optional().allow(null, 0),
        story_id: Joi.number().optional().allow(null, 0),
        location: Joi.string().optional().allow(null, ''),
        media_url: Joi.string().optional().allow(null, ''),
        thumbnail_url: Joi.string().optional().allow(null, ''),
    }),

    deleteApplicationPayload: Joi.object().keys({
        application_ads_id: Joi.number().required()
    }),
    sortApplicationsPayload: Joi.object().keys({
        applications: Joi.array().required()
    }),
    saveApplicationAdsPayload: Joi.object().keys({
        ministry_type: Joi.number().required(),
        application_title: Joi.string().required(),
        application_sub_title: Joi.string().optional().allow(null, ''),
        application_card_title: Joi.string().required(),
        application_card_sub_title: Joi.string().required(),
        application_image: Joi.string().optional().allow(null, ''),
        application_model_image: Joi.string().optional().allow(null, ''),
        application_card_description: Joi.string().optional().allow(null, ''),
        application_ads_id: Joi.number().optional().allow(null, 0),
        application_name: Joi.string().optional().allow(null, ''),
        application_primary_color: Joi.string().optional().allow(null, ''),
        application_preview_link: Joi.string().optional().allow(null, ''),
        application_download_link: Joi.string().optional().allow(null, ''),
        application_secondary_color: Joi.string().optional().allow(null, ''),
        application_status: Joi.number().optional(),
    }),
    updateApplicationAdsStatus: Joi.object().keys({
        application_status: Joi.number().required(),
        application_ads_id: Joi.number().required()
    }),
    saveApplicationColor: Joi.object().keys({
        ministry_type: Joi.number().required(),
        application_color_id: Joi.number().optional().allow(null, 0),
        application_color_name: Joi.string().required(),
        application_color_hex: Joi.string().required(),
        application_color_type: Joi.number().optional(),
    }),
    listAllApplicationColor: Joi.object().keys({
        ministry_type: Joi.number().required()
    }),

    deleteResourcePayload: Joi.object().keys({
        resource_id: Joi.number().required()
    }),
    sortResourcesPayload: Joi.object().keys({
        resources: Joi.array().required()
    }),
    saveResourcePayload: Joi.object().keys({
        title: Joi.string().required(),
        ministry_type: Joi.number().required(),
        cta_type: Joi.number().optional().allow(null, ''),
        cta_text: Joi.string().optional().allow(null, ''),
        cta_link: Joi.string().optional().allow(null, ''),
        image_url: Joi.string().optional().allow(null, ''),
        resource_id: Joi.number().optional().allow(null, 0),
        description: Joi.string().optional().allow(null, ''),
    }),

    listAllTodoList: Joi.object().keys({
        ministry_type: Joi.number().required()
    }),
    saveToDoList: Joi.object().keys({
        todo_list_id: Joi.number().optional().allow(null, 0),
        ministry_type: Joi.number().required(),
        title: Joi.string().required(),
        type: Joi.number().required(),
        scheduled: Joi.string().optional().allow(null, ''),
        button_text: Joi.string().optional().allow(null, ''),
        additional_data: Joi.object().required(),
    }),
    deleteToDoList: Joi.object().keys({
        todo_list_id: Joi.number().required()
    }),
    sortToDoList: Joi.object().keys({
        toDos: Joi.array().required()
    }),
    countGrowStoryViews: Joi.object().keys({
        story_id: Joi.number().required(),
        user_id: Joi.number().required()
    }),
    saveChurch: Joi.object().keys({
        church_id: Joi.number().optional().allow(null, 0),
        church_name: Joi.string().required(),
        church_location: Joi.string().required()
    }),
    deleteChurch: Joi.object().keys({
        church_id: Joi.number().required(),
    }),
};
