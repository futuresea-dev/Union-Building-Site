import { Request, Response, NextFunction } from "express";
import { ErrorController, ApiError, AuthFailureError, BadRequestError } from '../core/index';
import { TokenValidate } from './tokenValidate';

export interface GrowHeadersRequest extends Request {
    authorization: string;
}

const EC = new ErrorController();
const TV = new TokenValidate();

module.exports = async function bearerToken(req: GrowHeadersRequest, res: Response, next: NextFunction) {
    //@ts-ignore
    let hash_key = req.hash_key
    const authorization_token = req.headers.authorization;

    if (hash_key && !authorization_token) {
        //@ts-ignore
        hash_key = req.hash_key
        next()
    } else if (authorization_token && req.baseUrl) {
        let UA_string = req.headers['user-agent'] ? req.headers['user-agent'] : "";

        let validData = await TV.isValid({
            token: authorization_token,
            header: req.headers,
            url: req.url
        }, UA_string)

        if (validData) {
            //@ts-ignore
            req.token = validData.token
            //@ts-ignore
            req.user_id = validData.user_id
            //@ts-ignore
            req.user_role = validData.user_role
            //@ts-ignore
            req.display_name = validData.display_name
            //@ts-ignore
            req.users_login_log_id = validData.users_login_log_id
            //@ts-ignore
            if (typeof req.hash_key == undefined || req.hash_key == null || req.hash_key == "") {
                //@ts-ignore
                req.hash_key = validData.useragent
            }
            next()
        } else {
            ApiError.handle(new AuthFailureError(EC.AuthFailureResponse), res);
        }
    } else {
        if (req.baseUrl) {
            if (req.originalUrl == '/api/v1/getPageLinkDetails') {
                //@ts-ignore
                req.user_id = 0
                next()
            } else {
                ApiError.handle(new AuthFailureError(EC.AuthFailureResponse), res);
            }
        } else {
            ApiError.handle(new BadRequestError(), res);
        }
    }

};
