import Joi from 'joi';
import { ErrorController } from "../../core/ErrorController";

const EC = new ErrorController();

export default {
    siteIdParams: Joi.object().keys({
        site_id: Joi.number().min(1).required()
    }),

    tutorialIdParams: Joi.object().keys({
        tutorial_id: Joi.number().min(1).required()
    }),

    siteIdParamsV1: Joi.object().keys({
        site_id: Joi.array().allow('', 0),
        search: Joi.string().allow(''),
        type: Joi.array().allow('', 0),
        page_no: Joi.number().allow(null, 0),
        page_record: Joi.number().allow(null, 0),
    }),

    tutorialPayload: Joi.object().keys({
        tutorial_id: Joi.number().allow('', 0),
        featured_image_url: Joi.string().allow(''),
        video_url: Joi.string().allow(''),
        button_link: Joi.string().allow(''),
        is_active: Joi.number().allow(0, 1),
        type: Joi.number().allow('', 0),
        site_id: Joi.number().required()
            .label("Site id")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Site id"])
            }),
        title: Joi.string().required()
            .label("Title")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Title"])
            }),
        content: Joi.string().required()
            .label("Content")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Content"])
            }),
        tags: Joi.array().allow('')
    }),

    activeTutorialPayload: Joi.object().keys({
        tutorial_id: Joi.number().required()
            .label("Tutorial id")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Tutorial id"])
            }),
        is_active: Joi.number().required().allow(0, 1),
    }),
};
