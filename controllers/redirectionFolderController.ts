import { Request, Response } from "express"
import { ErrorController } from "../core/ErrorController"
import { SuccessResponse } from '../core/ApiResponse'
import { BadRequestError, ApiError } from '../core/ApiError'
const { dbReader, dbWriter } = require('../models/dbConfig')
const { Op } = dbReader.Sequelize;
const EC = new ErrorController()

export class RedirectionFolderController {
    public async listRedirectionFolder(req: Request, res: Response) {
        try {
            // let { page_no, page_record } = req.body;
            // let rowOffset = 0, rowLimit;
            // // If page_record is passed from body, it takes that otherwise static 10 will be passed.
            // if (isNaN(page_record) || page_record == undefined) {
            //     rowLimit = EC.pageRecordFor10Page;
            // } else {
            //     rowLimit = page_record;
            // }
            // // setting offset for page
            // if (page_no) { rowOffset = (page_no * rowLimit) - rowLimit; }
            let recurseData = await dbReader.redirectionFolder.findAll({
                where: { is_deleted: 0 },
            });
            recurseData = JSON.parse(JSON.stringify(recurseData));
            function __(arrComment: any, id: any) {
                var rd: any = [];
                arrComment.forEach((s: any) => {
                    if (s.parent_id == id) {
                        s.child_data = __(arrComment, s.redirection_folder_id);
                        rd.push(s);
                    }
                });
                // rd.sort(function (a: any, b: any) {
                //     return new Date(b.created_datetime).getTime() - new Date(a.created_datetime).getTime();
                // });
                return rd;
            }
            let result = __(recurseData, 0)
            // let count = await dbReader.redirectionFolder.count({
            //     where: { is_deleted: 0 }
            // });
            // result = result.splice(rowOffset, rowLimit);
            result.sort(function (a: any, b: any) {
                return new Date(b.created_datetime).getTime() - new Date(a.created_datetime).getTime();
            });
            new SuccessResponse("Redirection folder list fetched successfully.", {
                // @ts-ignore
                token: req.token,
                // count: count,
                rows: result
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async createUpdateRedirectionFolder(req: Request, res: Response) {
        try {
            //@ts-ignore
            let user_id = req.user_id;
            let { redirection_folder_id, parent_id, title } = req.body;
            if (redirection_folder_id && redirection_folder_id != null) {
                await dbWriter.redirectionFolder.update({ title, parent_id, updated_by:user_id, updated_datetime: new Date() }, { where: { redirection_folder_id } })
                new SuccessResponse("Redirection folder updated successfully.", {}).send(res);
            }
            else {
                await dbWriter.redirectionFolder.create({
                    title, parent_id, created_datetime: new Date(), upated_datetime: new Date(), created_by: user_id, updated_by: user_id
                })
                new SuccessResponse("Redirection folder created successfully.", {}).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async deleteRedirectionFolder(req: Request, res: Response) {
        try {
            let { redirection_folder_id } = req.params;
            await dbWriter.redirectionFolder.update({ is_deleted: 1 }, { where: { redirection_folder_id } })
            new SuccessResponse("Redirection folder deleted successfully.", {}).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
}