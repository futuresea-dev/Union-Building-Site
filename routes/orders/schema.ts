import Joi from 'joi';
import { ErrorController } from "../../core/ErrorController";
const EC = new ErrorController();

export default {
    orderListPayload: Joi.object().keys({
        user_id: Joi.number().allow(null).messages({
            'any.required': EC.userIdMessageError
        }),
        order_id: Joi.number().allow(null).messages({
            'any.required': EC.orderIdMessageError
        })
    }),

    orderDetailsPayload: Joi.object().keys({
        id: Joi.number().min(1).required().label('Order id')
    }),
};