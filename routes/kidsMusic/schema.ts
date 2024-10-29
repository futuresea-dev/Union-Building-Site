import Joi from 'joi';
import { ErrorController } from "../../core/ErrorController";
const EC = new ErrorController();

export default {
    listKidsMusicPayload: Joi.object().keys({
        search: Joi.string().allow(null, ''),
        page_record: Joi.number().allow(null, 0),
        page_no: Joi.number().allow(null, 0),
    }),
    addToLibrary: Joi.object().keys({
        music_id: Joi.number().required()
    }),
    removeFromLibrary: Joi.object().keys({
        music_id: Joi.number().required()
    })

};
