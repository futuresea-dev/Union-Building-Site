import { Request, Response } from "express"
import { ErrorController } from "../core/ErrorController"
import { SuccessResponse } from '../core/ApiResponse'
import { BadRequestError, ApiError } from '../core/ApiError'
const { dbReader, dbWriter } = require('../models/dbConfig')
import { Crypto } from '../core/index';
const axios = require('axios');
import moment from "moment";
const EC = new ErrorController()
const crypto = new Crypto();
export class RedirectionController {

    public redirectionLinkList = async (req: Request, res: Response) => {
        try {
            let { page_no, page_record, search, site_id, redirection_folder_id } = req.body

            let rowLimit = page_record ? parseInt(page_record) : 50
            let rowOffset = page_no ? ((page_no * page_record) - page_record) : 0

            let searchCond = dbReader.Sequelize.Op.ne, searchData = null
            if (search) {
                searchCond = dbReader.Sequelize.Op.like
                searchData = `%${search}%`
            }

            let siteIdCond = dbReader.Sequelize.Op.ne, siteIdData = null
            if (site_id) {
                siteIdCond = dbReader.Sequelize.Op.eq;
                siteIdData = site_id
            }

            let redirectionIdCon = dbReader.Sequelize.Op.ne, redirectionData = null
            if (redirection_folder_id) {
                redirectionIdCon = dbReader.Sequelize.Op.eq;
                redirectionData = redirection_folder_id
            }

            let pageLinkData = await dbReader.pageLink.findAndCountAll({
                where: {
                    target_url: { [dbReader.Sequelize.Op.ne]: null },
                    link_type: 9, keyword: { [searchCond]: searchData },
                    site_id: { [siteIdCond]: siteIdData },
                    redirection_folder_id: { [redirectionIdCon]: redirectionData },
                    is_deleted: 0
                },
                include: [{
                    attributes: ["site_id", "url"],
                    model: dbReader.sites,
                }],
                order: [["updated_datetime", "DESC"]]
                // limit: rowLimit,
                // offset: rowOffset,
            });
            pageLinkData = JSON.parse(JSON.stringify(pageLinkData));
            pageLinkData.rows.forEach((e: any) => {
                e.site_url = e.sycu_site?.url ?? '';
                delete e.sycu_site;
            });

            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token,
                count: pageLinkData.count,
                rows: pageLinkData.rows
            }).send(res)
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res)
        }
    }

    //Sm 23-11-22 growcurriculum/stuffyoucanuse redirection related changes
    public addUpdateRedirectionLink = async (req: Request, res: Response) => {
        try {
            //@ts-ignore
            let user_id = req.user_id
            var id;
            let { page_link_id, site_id, keyword, target_url, is_disable, redirection_folder_id } = req.body
            if (page_link_id) {
                let pageLink = await dbReader.pageLink.count({
                    where: { is_deleted: 0, keyword: keyword, site_id: site_id, page_link_id: { [dbReader.Sequelize.Op.ne]: page_link_id } }
                })
                if (pageLink > 0)
                    throw new Error('Keyword already exist')
                if (site_id == -1 || site_id == -2 || site_id == -3) {
                    let url = "";
                    if (site_id == -1) {
                        url = `https://growcurriculum.org/wp-json/curriculum/addRedirectioncurriculum`;
                    } else if (site_id == -2) {
                        url = `https://stuffyoucanuse.org/wp-json/sycu/addRedirectionSycu`;
                    }
                    let data = await dbReader.pageLink.findOne({
                        attributes: ['wp_redirection_id'],
                        where: { page_link_id }
                    })
                    if (data) {
                        data = JSON.parse(JSON.stringify(data))
                        let userData = await dbReader.users.findOne({
                            attributes: ['parent_id'],
                            where: { user_id }
                        })
                        userData = JSON.parse(JSON.stringify(userData))
                        let authorization_token = await crypto.bridgeTokenEncrypt(JSON.stringify({
                            expire_time: moment().add(5, 'minutes')
                        }))
                        if (site_id == -1 || site_id == -2) {
                            await axios(url, {
                                method: 'post',
                                headers: {
                                    'Content-Type': 'application/json',
                                    SecurityToken: authorization_token
                                },
                                data: {
                                    user_id: userData.parent_id,
                                    target_url,
                                    keyword,
                                    wp_redirection_id: data.wp_redirection_id,
                                    is_deleted: 0
                                }
                            }).then(async (result: any) => {
                                if (result.status == 200) {
                                    id = result.data.redirection_id
                                    return result.data;
                                }
                            }).catch(function (error: any) {
                                throw new Error(error.message)
                            })
                        }
                    }
                }
                await dbWriter.pageLink.update({
                    site_id: site_id,
                    keyword: keyword,
                    target_url: target_url,
                    is_disable: is_disable,
                    redirection_folder_id: redirection_folder_id
                }, {
                    where: { page_link_id: page_link_id }
                })
            } else {
                let pageLink = await dbReader.pageLink.count({
                    where: { is_deleted: 0, keyword: keyword, site_id: site_id }
                })
                if (pageLink > 0)
                    throw new Error('Keyword already exist')
                if (site_id == -1 || site_id == -2 || site_id == -3) {
                    let url = "";
                    if (site_id == -1) {
                        url = `https://growcurriculum.org/wp-json/curriculum/addRedirectioncurriculum`;
                    } else if (site_id == -2) {
                        url = `https://stuffyoucanuse.org/wp-json/sycu/addRedirectionSycu`;
                    }
                    let userData = await dbReader.users.findOne({
                        attributes: ['parent_id'],
                        where: { user_id }
                    })
                    userData = JSON.parse(JSON.stringify(userData))
                    let authorization_token = await crypto.bridgeTokenEncrypt(JSON.stringify({
                        expire_time: moment().add(5, 'minutes')
                    }))
                    if (site_id == -1 || site_id == -2) {
                        await axios(url, {
                            method: 'post',
                            headers: {
                                'Content-Type': 'application/json',
                                SecurityToken: authorization_token
                            },
                            data: {
                                user_id: userData.parent_id,
                                target_url,
                                keyword,
                                wp_redirection_id: 0,
                                is_deleted: 0
                            }
                        }).then(async (result: any) => {
                            if (result.status == 200) {
                                id = result.data.redirection_id
                                return result.data;
                            }
                        }).catch(function (error: any) {
                            throw new Error(error.message)
                        })
                    }
                }
                let _pageLinkData = await dbWriter.pageLink.create({
                    data_id: 0,
                    site_id: site_id,
                    keyword: keyword,
                    target_url: target_url,
                    ui_component: 'general-external',
                    link_type: 9,
                    is_disable: is_disable,
                    redirection_folder_id: redirection_folder_id,
                    wp_redirection_id: id
                })
                page_link_id = _pageLinkData.page_link_id
            }
            let pageLinkData = await dbReader.pageLink.findOne({
                where: { page_link_id: page_link_id }
            })
            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token,
                ...pageLinkData
            }).send(res)
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res)
        }
    }

    //Sm 24-11-22 growcurriculum/stuffyoucanuse redirection related changes
    public deleteRedirectionLink = async (req: Request, res: Response) => {
        try {
            //@ts-ignore
            let user_id = req.user_id
            let { page_link_id } = req.params;
            let data = await dbReader.pageLink.findOne({
                attributes: ['site_id', 'wp_redirection_id'],
                where: { page_link_id, is_deleted: 0 }
            })
            if (data) {
                data = JSON.parse(JSON.stringify(data))
                if (data.wp_redirection_id != 0 && (data.site_id == -1 || data.site_id == -2 || data.site_id == -3)) {
                    let url = "";
                    if (data.site_id == -1) {
                        url = `https://growcurriculum.org/wp-json/curriculum/addRedirectioncurriculum`;
                    } else if (data.site_id == -2) {
                        url = `https://stuffyoucanuse.org/wp-json/sycu/addRedirectionSycu`;
                    }
                    let userData = await dbReader.users.findOne({
                        attributes: ['parent_id'],
                        where: { user_id }
                    })
                    userData = JSON.parse(JSON.stringify(userData))
                    let authorization_token = await crypto.bridgeTokenEncrypt(JSON.stringify({
                        expire_time: moment().add(5, 'minutes')
                    }))
                    if (data.site_id == -1 || data.site_id == -2) {
                        await axios(url, {
                            method: 'post',
                            headers: {
                                'Content-Type': 'application/json',
                                SecurityToken: authorization_token
                            },
                            data: {
                                user_id: userData.parent_id,
                                wp_redirection_id: data.wp_redirection_id,
                                is_deleted: 1
                            }
                        }).then(async (result: any) => {
                            if (result.status == 200) {
                                return result.data;
                            }
                        }).catch(function (error: any) {
                            throw new Error(error.message)
                        })
                    }
                }
            }
            await dbWriter.pageLink.update({
                is_deleted: 1,
                updated_datetime: new Date()
            }, {
                where: { page_link_id: page_link_id }
            })
            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token
            }).send(res)
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res)
        }
    }

    public statusRedirectionLink = async (req: Request, res: Response) => {
        try {
            let { page_link_id, is_disable } = req.body
            await dbWriter.pageLink.update({
                is_disable: is_disable,
                updated_datetime: new Date()
            }, {
                where: { page_link_id: page_link_id }
            })
            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token
            }).send(res)
        } catch (err: any) {
            ApiError.handle(new BadRequestError(err.message), res)
        }
    }

    public async updateRedirectionFolderId(req: Request, res: Response) {
        try {
            let { page_link_id, redirection_folder_id } = req.body;
            await dbWriter.pageLink.update({ redirection_folder_id }, { where: { page_link_id } })
            new SuccessResponse("Redirection folder id updated successfully.", {}).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
}
