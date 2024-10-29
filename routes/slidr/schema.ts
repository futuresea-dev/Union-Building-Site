/*
    * Code done by Darshit - 09-03-2022
    * create schema for slideshoew validation 
*/
import Joi from 'joi';
import { ErrorController } from "../../core/ErrorController";
const EC = new ErrorController();

export default {

    getSlideshowsBySeries: Joi.object().keys({
        series_id: Joi.number().required().messages({
            'any.required': EC.seriesIdRequired
        })
    }),
    createSlideshowBySeries: Joi.object().keys({
        series_id: Joi.number().required().messages({
            'any.required': EC.seriesIdRequired
        }),
        ministry_type: Joi.number().required().messages({
            'any.required': EC.ministryTypeRequired
        }),
        ministry_sub_type: Joi.number().required().messages({
            'any.required': EC.ministrySubTypeRequired
        }),
        week_number: Joi.number().required().messages({
            'any.required': EC.weekNumberRequired
        })
    }),
    createSlideshowByGame: Joi.object().keys({
        game_id: Joi.number().required().messages({
            'any.required': EC.gameIdRequired
        }),
        title: Joi.string().required()
    }),
    getSlideshowsByGame: Joi.object().keys({
        search: Joi.string().allow(null, ""),
        page_record: Joi.number().allow(null, '').default(10),
        page_no: Joi.number().allow(null, '').default(1),
    }),
    importSlideshow: Joi.object().keys({
        series_id: Joi.number().required(),
        week_no: Joi.number().required(),
        ministry_type: Joi.number().required(),
        ministry_sub_type: Joi.number().required(),
        parent_slideshow_id: Joi.number().required()
    })    

}