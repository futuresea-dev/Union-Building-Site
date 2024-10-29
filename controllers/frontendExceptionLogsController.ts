import { Request, Response } from "express";
import { ErrorController, SuccessResponse, BadRequestError, ApiError } from '../core/index';
const { dbWriter } = require('../models/dbConfig');
const EC = new ErrorController();

export class FrontEndExceptionLogsController {

    public async saveAllErrorFromFrontend(req: Request, res: Response) {
        try {
            //@ts-ignore
            let { user_id = 0 } = req;
            let { api_name, function_name, error_message, error_object, site_id } = req.body;
            if (error_object) {
                error_object = JSON.stringify(error_object);
            }
            let data = await dbWriter.frontendExceptionLogs.create({
                api_name: api_name,
                function_name: function_name,
                error_message: error_message,
                error_object: error_object,
                site_id: site_id,
                user_id: user_id
            });
            if (data) {
                new SuccessResponse(EC.success, {
                    data: data
                }).send(res);
            } else {
                new SuccessResponse(EC.success, {
                    data: []
                }).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

}
