import { Request, Response } from 'express'
import { ErrorController, SuccessResponse, BadRequestError, ApiError } from '../core/index';
const { dbReader, dbWriter } = require('../models/dbConfig');
const { Op } = dbReader.Sequelize;
const EC = new ErrorController();

export class Resource {

    public async saveResource(req: Request, res: Response) {
        try {
            //@ts-ignore
            let resource: any;
            let { id = 0, type, title, size, extension, parent_id, path } = req.body;

            if (id) {
                let data = await dbReader.resource.findOne({
                    where: { id: id, is_deleted: 0 }
                })
                if (data) {
                    resource = await dbWriter.resource.update({
                        title: title,
                        type: type,
                        size: size,
                        extension: extension,
                        parent_id: parent_id,
                        updated_datetime: new Date()
                    }, {
                        where: { id: id }
                    });
                } else {
                    throw new Error("The file or folder you are trying to update is not valid")
                }
            } else {
                let name_data = await dbReader.resource.findAll({
                    where: { is_deleted: 0, parent_id: parent_id }
                })
                name_data = JSON.parse(JSON.stringify(name_data))
                if (name_data.find((e: any) => e.title == title && e.extension == extension)) {
                    throw new Error("Folder/File already exist")
                } else {
                    resource = await dbWriter.resource.create({
                        title: title,
                        type: type,
                        size: size,
                        extension: extension,
                        parent_id: parent_id,
                        path: path,
                        // relative_path: decodeURI(path),
                        relative_path: String(decodeURIComponent(String(path))).replace(/\+/gi, " "),
                        bucket_path: path,
                        is_downloaded: type == 0 ? 1 : 0,
                    });
                    resource = JSON.parse(JSON.stringify(resource))
                }
                if (resource.parent_id == 0) {
                    await dbWriter.resource.update({
                        super_parent_id: resource.id
                    }, { where: { id: resource.id } })
                } else {
                    let data = await dbReader.resource.findOne({
                        where: { is_deleted: 0, id: resource.parent_id }
                    })
                    data = JSON.parse(JSON.stringify(data))
                    await dbWriter.resource.update({
                        super_parent_id: data.super_parent_id
                    }, { where: { id: resource.id } })
                }

            }

            new SuccessResponse(EC.errorMessage(EC.saveDataSuccess), {
                // @ts-ignore
                token: req.token,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async listAllResource(req: Request, res: Response) {
        try {
            let { page_no, page_record, parent_id, is_deleted = 0, sortOrder, sort_field } = req.body;
            let rowLimit = page_record ? parseInt(page_record) : 20;
            let rowOffset = page_no ? ((page_no * page_record) - page_record) : 0;
            // Searching                           
            var SearchCondition = dbReader.Sequelize.Op.ne, SearchData = null;
            if (req.body.search) {
                SearchCondition = Op.like;
                SearchData = "%" + req.body.search + "%";
            }
            sortOrder = sortOrder ? sortOrder : "DESC";
            sort_field = "title"
            let orderCondition
            if (is_deleted == 0) {
                orderCondition = [["type", "DESC"], [dbReader.Sequelize.literal('title REGEXP "^[a-zA-Z0-9]"')], ['title', 'ASC'], [sort_field, sortOrder]]
            } else {
                orderCondition = [["updated_datetime", "DESC"]]
            }

            let cond_val = -1, cond = dbReader.Sequelize.Op.ne;
            if (req.headers.origin?.includes("cloud")) {
                cond_val = 1;
                cond = dbReader.Sequelize.Op.eq;
            }

            let data = await dbReader.resource.findAndCountAll({
                where: dbReader.sequelize.and({
                    parent_id: parent_id,
                    is_deleted: is_deleted,
                    is_downloaded: { [cond]: cond_val }
                },
                    dbReader.Sequelize.or(
                        { title: { [SearchCondition]: SearchData } }
                    )
                ),
                attributes: ['created_datetime', 'extension', 'id', 'parent_id', 'is_deleted', 'path', 'relative_path', 'bucket_path', 'super_parent_id', 'title', 'type', 'updated_datetime', 'is_downloaded',
                    [dbReader.Sequelize.fn('if', dbReader.Sequelize.where(dbReader.Sequelize.literal('type'), 0), 0, dbReader.Sequelize.literal('size')), 'size']
                ],
                order: orderCondition,
                limit: rowLimit,
                offset: rowOffset,
            });
            // let recurseData = await dbReader.resource.findAndCountAll({
            //     where: dbReader.sequelize.and(
            //         { is_deleted: 0 },
            //     ),
            // });
            // function __(arr: any, _id: any) {
            //     var rd: any = [];
            //     arr.forEach((s: any) => {
            //         if (s.parent_id == _id) {
            //             s.total_size += __(arr, s.id);
            //             // s.total_size += s.size
            //         }
            //         // s.total_size += s.size
            //         rd.push(s)
            //     });
            //     return rd;
            // }
            // let data1 = __(recurseData.rows, 0);
            if (data.count > 0) {
                data = JSON.parse(JSON.stringify(data))
                new SuccessResponse(EC.errorMessage(EC.success), {
                    // @ts-ignore
                    token: req.token,
                    count: data.count,
                    rows: data.rows
                }).send(res);
            } else {
                new SuccessResponse(EC.errorMessage(EC.noDataFound), {
                    // @ts-ignore
                }).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async deleteResource(req: Request, res: Response) {
        try {
            let { id, is_deleted } = req.body;
            let deleted = is_deleted == 0 ? 1 : 0;
            let recurseData = await dbReader.resource.findAndCountAll({
                where: dbReader.sequelize.and({ is_deleted: deleted }),
            });
            recurseData = JSON.parse(JSON.stringify(recurseData));
            let rd: any = [];
            function __(arr: any, _id: any) {
                arr.forEach((s: any) => {
                    if (s.parent_id == _id) {
                        s.child = __(arr, s.id);
                        rd.push(s.id);
                    }
                });
                return rd;
            }
            let data1: any = [];
            id.forEach((element: any) => {
                data1 = __(recurseData.rows, element);
                data1.push(element)
            });
            
            if(is_deleted == 1){
                await dbWriter.resource.update({ is_deleted: is_deleted, is_downloaded: 0 }, {
                    where: { id: { [Op.in]: data1 } }
                });
            } else {
                await dbWriter.resource.update({ is_deleted: is_deleted }, {
                    where: { id: { [Op.in]: data1 } }
                });
            }
            new SuccessResponse(EC.errorMessage(EC.deleteDataSuccess), {
                // @ts-ignore
                token: req.token,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
}