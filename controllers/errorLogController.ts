import { Request, Response } from "express";
import { ErrorController, SuccessResponse, BadRequestError, ApiError } from '../core/index';
import _ from 'lodash';
const EC = new ErrorController();
const fs = require('fs')
import { RandomString } from "../helpers/helpers";
const { dbReader,dbWriter } = require("../models/dbConfig");

export class ErrorLogController {
    //List of Error log files
    public async errorFileList(req: Request, res: Response) {
        try {
            var files = fs.readdirSync('ErrorLogs/');
            var filesArr: any = [];
            let ct = 1;
            files.forEach((element: any) => {
                filesArr.push({
                    error_log_id: ct++,
                    file_name: element
                })
            })
            new SuccessResponse(EC.success, {
                filesArr
            }).send(res);
        }
        catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    };

    //Read error log files..
    public async readErrorLogFiles(req: Request, res: Response) {
        try {
            let { file_name } = req.body;
            let data = fs.readFileSync('ErrorLogs/' + file_name, 'utf8')
            new SuccessResponse(EC.success, {
                data
            }).send(res);
        }
        catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    // Sm - Delete error Log file
    public async deleteErrorLogFiles(req: Request, res: Response) {
        try {
            let { file_name, site_id, password } = req.body;

            let response = await dbReader.systemConfiguration.findOne({
                where: {
                    site_id: site_id,
                    delete_log_pass: password
                }
            })

            if (response) {
                file_name.forEach((e: any) => {
                    let data = 'ErrorLogs/' + e;
                    fs.unlinkSync(data);
                })

                let newpass = RandomString(6)

                await dbWriter.systemConfiguration.update(
                    { delete_log_pass: newpass },
                    {
                        where: {
                            site_id: site_id
                        }
                    }
                )
                new SuccessResponse(EC.success, {}).send(res);
            }
            else {
                ApiError.handle(new BadRequestError("Password doesn't match."), res);
            }


        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
}
