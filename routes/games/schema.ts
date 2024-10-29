/*
    * Code done by Sh - 14-12-2021
    * create schema for games validation 
*/
import Joi from 'joi';
import { ErrorController } from "../../core/ErrorController";
const EC = new ErrorController();

export default {   
    addGamePayload: Joi.object().keys({
        game_id: Joi.number().optional(),
        is_hidden: Joi.number().optional(),
        category_id: Joi.number().optional(),
        game_description: Joi.string().required().messages({
            'any.required': EC.gameDescriptionRequired,
        }),
        is_description_hide: Joi.number().allow(null, 0),
        game_title: Joi.string().required().messages({
            'any.required': EC.gameTitleRequired,
        }),
        what_to_get: Joi.string().allow(null, ''),
        what_to_prep: Joi.string().allow(null, ''),
        how_to_play: Joi.string().allow(null, ''),
        pro_tips: Joi.string().allow(null, ''),
        is_pro_tips_hide: Joi.number().allow(null, 0),
        slide_link: Joi.string().allow(null, ''),
        attachment: Joi.array().min(1) .items({
            game_attachment_id: Joi.number().allow(null, "").allow(),
            attachment_url: Joi.string().required(),
            attachment_type: Joi.number().required(),
          }).required()
          .messages({
            "any.required": EC.errorMessage(EC.required, [" Filters"]),
          }),
        filters: Joi.array().min(1)
        .items({
          gi_filter_id: Joi.number().allow(null, "").allow(),
          filter_id: Joi.number()
            .required()
            .messages({
              "any.required": EC.errorMessage(EC.required, [" Filter id "]),
            }),
            filter_type: Joi.number()
            .required()
            .messages({
              "any.required": EC.errorMessage(EC.required, [" Filter type "]),
            }),
          is_deleted: Joi.number().optional(),
        }).required()
        .messages({
          "any.required": EC.errorMessage(EC.required, [" Filters"]),
        }),
    }),
    listGamePayload: Joi.object().keys({
        page_record: Joi.number().allow(null, ''),
        page_no: Joi.number().allow(null, ''),
        search: Joi.string().allow(null, ''),
        is_system: Joi.number().required(),
        sort_order: Joi.string().allow(null, ''),
        sort_field: Joi.string().allow(null, ''),
        category_id: Joi.number().allow(0),
    }),
    listUserGamePayload: Joi.object().keys({
        page_record: Joi.number().allow(null, ''),
        page_no: Joi.number().allow(null, ''),
        search: Joi.string().allow(null, ''),
    }),
    gameDetailPayload: Joi.object().keys({
        game_id: Joi.number().min(1).required()
    }),
    deleteGamePayload: Joi.object().keys({
        game_id: Joi.number().min(1).required()
    }),
    deleteBulkGamePayload: Joi.object().keys({
        game_id: Joi.array().required()
    }),
    listGameRatingPayload: Joi.object().keys({
        page_record: Joi.number().allow(null, ''),
        page_no: Joi.number().allow(null, ''),
        search: Joi.string().allow(null, ''),
    }),
    gameReportDataPayload: Joi.object().keys({
        sort_field: Joi.string().allow(null, ''),
        sort_order: Joi.string().allow(null, ''),
        page_record: Joi.number().allow(null, ''),
        page_no: Joi.number().allow(null, ''),
        ministry_level: Joi.number().allow(null, ''),
        start_date: Joi.string().allow(null, ''),
        end_date: Joi.string().allow(null, ''),
    }),
    gameReportPayload: Joi.object().keys({
        sort_field: Joi.string().allow(null, ''),
        sort_order: Joi.string().allow(null, ''),
        ministry_level: Joi.number().allow(null, ''),
        start_date: Joi.string().allow(null, ''),
        end_date: Joi.string().allow(null, ''),
    }),
    addNotificationPayload: Joi.object().keys({
        notification_title: Joi.string().required(),
        notification_description: Joi.string().required(),
        notification_type: Joi.number().required(),
        notification_type_id: Joi.number().required(),
        user_id: Joi.array().required(),
    }),
    sentNotificationPayload: Joi.object().keys({
        notification_title: Joi.string().required(),
        notification_description: Joi.string().required(),
        notification_type: Joi.number().required(),
        notification_type_id: Joi.number().required(),
        user_id: Joi.array().required(),
    }),
    readSentNotificationPayload: Joi.object().keys({
        notification_sent_id: Joi.number().required(),
    }),
    listGameReviewPayload: Joi.object().keys({
        user_id: Joi.number().allow(null, ''),
        game_id: Joi.number().allow(null, ''),
        sort_order: Joi.string().allow(null, ''),
        sort_field: Joi.string().allow(null, ''),
        page_record: Joi.number().allow(null, ''),
        page_no: Joi.number().allow(null, ''),

    }),
    deleteGameReview: Joi.object().keys({
        rating_ids: Joi.array().required().messages({
            "any.required": EC.errorMessage(EC.required, [" rating ids "]),
        })
    }),
    getUsersPayload: Joi.object().keys({
        via_platform: Joi.number().allow(0, ''),
        page_record: Joi.number().allow(0, ''),
        page_no: Joi.number().allow(0, ''),
        search: Joi.string().allow('', null),
    }),
    notificationPayload: Joi.object().keys({
        user_type: Joi.number().allow(0, ''),//[1=all, 2=ios, 3=android]
        game_id: Joi.number().allow(0, ''),
        user_ids: Joi.array().required().messages({
            "any.required": EC.errorMessage(EC.required, [" user ids "]),
        }),
        notification_title: Joi.string().required().label("Notification title")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Notification title"]),
                'any.empty': EC.errorMessage(EC.required, ["Notification title"])
            }),
        notification_description: Joi.string().required().label("Notification description")
            .messages({
                'any.required': EC.errorMessage(EC.required, ["Notification description"]),
                'any.empty': EC.errorMessage(EC.required, ["Notification description"])
            }),
    }),
};
