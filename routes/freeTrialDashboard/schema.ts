import Joi from 'joi';
import { join } from 'lodash';
import { ErrorController } from "../../core/ErrorController";
const EC = new ErrorController();

export default {
    getAllGrowStories: Joi.object().keys({
        ministry_type: Joi.number().required()
    }),
    getAllApplicationAds: Joi.object().keys({
        ministry_type: Joi.number().required()
    }),
    getAllToDoList: Joi.object().keys({
        ministry_type: Joi.number().required()
    }),
    isToDoCompleted:Joi.object().keys({
        todo_list_id: Joi.number().required(),
        is_completed: Joi.number().required()
    }),
    saveFeedback: Joi.object().keys({
        type: Joi.number().required(),
        type_id: Joi.number().required(),
        feedback_rating: Joi.number().required(),
        feedback_review: Joi.string().optional().allow(null, ''),
        curriculum_content_type: Joi.string().optional().allow(null, ''),
        curriculum_tabs_id: Joi.number().optional().allow(null, 0)
    })
};
