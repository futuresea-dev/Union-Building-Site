import { Request, Response } from 'express'
import { ErrorController, SuccessResponse, BadRequestError, ApiError } from '../core/index';
import { kidsMusicController } from "./kidsMusicController";
const { dbReader, dbWriter } = require('../models/dbConfig');
const { Op } = dbReader.Sequelize;
const EC = new ErrorController();
import * as dotenv from "dotenv";
dotenv.config();

export class GrowConVideoes {
    public addEditGrowConVideoes = async (req: Request, res: Response) => {
        try {
            let { id = 0, title, video_url, thumbnail_url, grow_con_folder_id = 0, product_id = 0 } = req.body;
            if (!id) {
                await dbWriter.growConVideoes.create({
                    title: title,
                    video_url: video_url,
                    thumbnail_url: thumbnail_url,
                    grow_con_folder_id: grow_con_folder_id,
                    product_id: product_id
                });
                new SuccessResponse(EC.errorMessage(EC.growConAddVideo), {}).send(res);
            } else {
                await dbWriter.growConVideoes.update({
                    title: title,
                    video_url: video_url,
                    thumbnail_url: thumbnail_url,
                    product_id: product_id
                }, {
                    where: { grow_con_video_id: id },
                });
                new SuccessResponse(EC.errorMessage(EC.growConEditVideo), {}).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public removeGrowConVideoes = async (req: Request, res: Response) => {
        try {
            let { id } = req.body;
            let data = await dbWriter.growConVideoes.update({
                is_deleted: 1
            }, {
                where: { grow_con_video_id: id }
            });
            if (data) {
                new SuccessResponse(EC.errorMessage(EC.growConDeleteVideo), {}).send(res);
            } else {
                new SuccessResponse(EC.errorMessage(EC.noDataFound), {}).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public getAllGrowConVideoes = async (req: Request, res: Response) => {
        try {
            //@ts-ignore
            let { user_id = 0 } = req;
            let { search = "", page_record = 10, page_no = 1, grow_con_folder_id = 0, is_from_admin = 0 } = req.body,
                conVideoTitleCond = Op.ne, conVideoTitleData = null, whereCondition: any, data: any, response: any;
                let folderID = process.env.GROW_CON_FOLDER_ID || 0;
            let rowLimit = page_record ? parseInt(page_record) : 10,
                rowOffset = page_no ? page_no * page_record - page_record : 0;
            if (search) {
                conVideoTitleCond = Op.like;
                conVideoTitleData = "%" + search + "%";
            }
            if (grow_con_folder_id) {
                whereCondition = {
                    is_deleted: 0,
                    grow_con_folder_id: grow_con_folder_id,
                    title: { [conVideoTitleCond]: conVideoTitleData }
                }
            } else {
                whereCondition = { is_deleted: 0, title: { [conVideoTitleCond]: conVideoTitleData } }
            }
            if (!is_from_admin && +grow_con_folder_id == +folderID && folderID) {
                let obj = new kidsMusicController();
                response = await obj.getAllKidsMusic(user_id, '');
                whereCondition = { ...whereCondition, product_id: { [Op.in]: response.myLibraryProductIDs } }
            }

            data = await dbReader.growConVideoes.findAndCountAll({
                where: whereCondition,
                order: [['grow_con_video_id', 'DESC']],
                offset: rowOffset,
                limit: rowLimit,
            });
            data = JSON.parse(JSON.stringify(data));

            new SuccessResponse(EC.growConGetVideo, {
                count: data?.count,
                rows: data?.rows
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public getAllGrowConFolders = async (req: Request, res: Response) => {
        try {
            let data = await dbReader.growConFolders.findAll({
                attributes: ['grow_con_folder_id', 'folder_name'],
                where: { is_deleted: 0 }
            });
            data = JSON.parse(JSON.stringify(data));
            new SuccessResponse(EC.success, data).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public addEditGrowConFolder = async (req: Request, res: Response) => {
        try {
            let { grow_con_folder_id = 0, folder_name } = req.body;
            if (!grow_con_folder_id) {
                await dbWriter.growConFolders.create({
                    folder_name: folder_name
                });
            } else {
                await dbWriter.growConFolders.update({
                    folder_name: folder_name
                }, {
                    where: { grow_con_folder_id: grow_con_folder_id },
                });
            }
            new SuccessResponse(EC.errorMessage(EC.success), {}).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public deleteGrowConFolder = async (req: Request, res: Response) => {
        try {
            let { id } = req.body;
            await dbWriter.growConFolders.update({
                is_deleted: 1
            }, {
                where: { grow_con_folder_id: id }
            });
            await dbWriter.growConVideoes.update({
                is_deleted: 1
            }, {
                where: { grow_con_folder_id: id }
            });
            new SuccessResponse(EC.errorMessage(EC.success), {}).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
}
