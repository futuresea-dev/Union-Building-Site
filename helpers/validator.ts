import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import Logger from '../core/Logger';
import { BadRequestError } from '../core/ApiError';

export enum ValidationSource {
    BODY = 'body',
    HEADER = 'headers',
    QUERY = 'query',
    PARAM = 'params',
}

export default (schema: Joi.ObjectSchema, source: ValidationSource = ValidationSource.BODY) => (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { error } = schema.validate(req[source]);

        if (!error) return next();

        const { details } = error;
        const message = details.map((i) => i.message.replace(/['"]+/g, '')).join(',');
        Logger.error(message);

        next(new BadRequestError(message));
    } catch (error) {
        next(error);
    }
};
