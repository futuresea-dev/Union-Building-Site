/*
    * Code done by Daksh 03-01-2022    
*/
import Joi from 'joi';
import { ErrorController } from "../../core/ErrorController";
const EC = new ErrorController();

export default {
    testParams: Joi.object().keys({
        did: Joi.number().min(1).required()
    })
};