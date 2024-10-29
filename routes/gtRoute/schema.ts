import Joi from 'joi';
import { ErrorController } from "../../core/ErrorController";
const EC = new ErrorController();

export default {
    listMeetupPayload: Joi.object().keys({
        page_no: Joi.number().required(),
        page_record: Joi.number().required(),
        sort_by: Joi.string().optional().allow(null, ''),
        sort_order: Joi.string().optional().allow(null, ''),
        meetup_type: Joi.number().optional().allow(null, 0),
        meetup_category: Joi.number().optional().allow(null, 0),
        is_approved: Joi.number().optional().allow(null),
        is_proposal: Joi.number().optional().allow(null),
    }),
    deleteProposeMeetupPayload: Joi.object().keys({
        meetup_id: Joi.number().required(),
        zoom_meeting_id: Joi.number().required(),
    }),
    saveMeetupPayload: Joi.object().keys({
        meetup_id: Joi.number().allow('', 0),
        meetup_title: Joi.string().required(),
        meetup_category: Joi.number().allow('', 0),
        meetup_datetime: Joi.string().required(),
        participants_limit: Joi.number().allow('', 0),
        zoom_meeting_id: Joi.number().allow('', 0),
    }),
    acceptOrRejectMeetupPayload: Joi.object().keys({
        meetup_id: Joi.number().required(),
        is_approved: Joi.number().required(),
    })
}