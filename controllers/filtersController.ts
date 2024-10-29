import { Request, Response } from "express";
import { ErrorController, SuccessResponse, BadRequestError, ApiError } from '../core/index';
import _ from 'lodash';
import { required } from "joi";
const { dbWriter, dbReader } = require('../models/dbConfig');
const EC = new ErrorController();

export class FiltersController {
    /*
    * Code done by Sh - 15-12-2021
    * For filters api's
    */

    // Add/Update filter 
    public async addUpdateFilter(req: Request, res: Response) {
        try {
            // Getting user detail from token
            //@ts-ignore
            let { user_id, token, role } = req
            var is_system = role;
            is_system = is_system == 3 ? 0 : 1;
            let filter_id = req.body.filter_id || 0;
            if (filter_id == 0) {
                let filterData = await dbWriter.filters.create({
                    user_id: user_id,
                    name: req.body.name,
                    slug: req.body.slug ? req.body.slug : req.body.name,
                    is_popular: req.body.is_popular ? req.body.is_popular : 0,
                    is_system: is_system,
                    short_name: req.body.short_name ? req.body.short_name : req.body.name,
                    filter_type: req.body.filter_type,
                    description: req.body.description ? req.body.description : "",
                    parent: req.body.parent ? req.body.parent : 0,
                    count: req.body.count ? req.body.count : 0,
                    created_by: user_id,
                    updated_by: user_id,
                    is_deleted: 0,
                });
                let finalResult = JSON.parse(JSON.stringify(filterData));
                filter_id = finalResult.filter_id;
                let filter = {
                    filter_id: finalResult.filter_id,
                    name: finalResult.name,
                    short_name: finalResult.short_name
                }
                new SuccessResponse(EC.saveDataSuccess, {
                    token: token,
                    ...filter
                }).send(res);
            } else {
                await dbWriter.filters.update({
                    user_id: user_id,
                    name: req.body.name,
                    slug: req.body.slug,
                    is_popular: req.body.is_popular,
                    short_name: req.body.short_name,
                    filter_type: req.body.filter_type,
                    description: req.body.description,
                    parent: req.body.parent,
                    count: req.body.count,
                    updated_by: user_id,
                    updated_datetime: new Date(),
                }, {
                    where: { filter_id: req.body.filter_id }
                });
                new SuccessResponse(EC.updatedDataSuccess, {
                    token: token,
                }).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async deleteFilter(req: Request, res: Response) {
        try {
            // Getting user detail from token
            //@ts-ignore
            let { token } = req
            await dbWriter.filters.update({ is_deleted: 1 }, { where: { filter_id: req.params.filter_id } });
            new SuccessResponse(EC.deleteDataSuccess, {
                token: token,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async deleteBulkFilter(req: Request, res: Response) {
        try {
            // Getting user detail from token
            //@ts-ignore
            let { token } = req
            await dbWriter.filters.update({ is_deleted: 1 },
                { where: { filter_id: { [dbReader.Sequelize.Op.in]: req.body.filter_id } } });
            new SuccessResponse(EC.deleteDataSuccess, {
                token: token,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async listFilter(req: Request, res: Response) {
        try {

            let { is_system, filter_type } = req.body

            // Getting user detail from token
            //@ts-ignore
            let { user_id, token } = req
            let filterType = filter_type, filterArrayData;
            if (filterType == 1) {
                filterArrayData = [1, 3];
            } else if (filterType == 2) {
                filterArrayData = [2, 3];
            }
            else if (filterType == 3) {
                filterArrayData = [1, 2, 3];
            }

            let customFilters = await dbReader.filters.findAndCountAll(
                {
                    attributes: ['filter_id', 'name', 'filter_type'],
                    where: {
                        is_system: is_system, is_deleted: 0,
                        filter_type: { [dbReader.Sequelize.Op.in]: filterArrayData }
                    }
                });
            customFilters = JSON.parse(JSON.stringify(customFilters))
            new SuccessResponse(EC.DataFetched, {
                token: token,
                count: customFilters.count,
                rows: customFilters.rows,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async filterDetail(req: Request, res: Response) {
        try {
            // Getting user detail from token
            //@ts-ignore
            let { token } = req
            let filterData = await dbReader.filters.findOne({
                where: { filter_id: req.params.filter_id }
            });
            filterData = JSON.parse(JSON.stringify(filterData))
            delete filterData.is_deleted
            new SuccessResponse(EC.DataFetched, {
                token: token,
                ...filterData,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async listFilterData(req: Request, res: Response) {
        try {
            // Getting user detail from token
            //@ts-ignore
            let { user_id, token } = req
            var reqBody = req.body;
            var row_offset = 0, row_limit = 10;
            //Pagination 
            if (reqBody.page_record) {
                row_limit = parseInt(reqBody.page_record);
            }

            if (reqBody.page_no) {
                row_offset = (reqBody.page_no * reqBody.page_record) - reqBody.page_record;
            }
            // Searching data by name, slug, description                        
            var SearchCondition = dbReader.Sequelize.Op.ne, SearchData = null;
            if (reqBody.search) {
                SearchCondition = dbReader.Sequelize.Op.like;
                SearchData = "%" + reqBody.search + "%";
            }
            var sortField = '', sortOrder = '';
            var sortJoin = [[sortField, sortOrder]];
            sortOrder = req.body.sort_order;

            if (req.body.sort_field == "name") {
                sortJoin = [dbReader.Sequelize.literal('name'), sortOrder];
            }
            else if (req.body.sort_field == "slug") {
                sortJoin = [dbReader.Sequelize.literal('slug'), sortOrder];
            }
            else if (req.body.sort_field == "description") {
                sortJoin = [dbReader.Sequelize.literal('description'), sortOrder];
            }
            else if (req.body.sort_field == "filter_count") {
                sortJoin = [dbReader.Sequelize.literal('(select count(`gi_filter_id`) as `filter_count` from `gg_gi_filters` where `gg_gi_filters`.`filter_id` = `gg_filters`.`filter_id` and `gg_gi_filters`.is_deleted = 0)'), sortOrder];
            }

            // var filterTypeCondition = dbReader.Sequelize.Op.ne, filterType = 0;
            // if (reqBody.filter_type != 0) {
            //     filterTypeCondition = dbReader.Sequelize.Op.like;
            //     filterType = reqBody.filter_type;
            // }

            let filterType = reqBody.filter_type, filterArrayData;
            let _ft = 0, _ftCond = dbReader.Sequelize.Op.ne;

            if (filterType == 1 || filterType == 2 || filterType == 3) {
                if (filterType == 1) {
                    _ft = 1;
                    _ftCond = dbReader.Sequelize.Op.eq
                    filterArrayData = [1, 3];
                }
                else if (filterType == 2) {
                    _ftCond = dbReader.Sequelize.Op.eq
                    _ft = 2;
                    filterArrayData = [2, 3];
                }
                else if (filterType == 3) {
                    filterArrayData = [1, 2, 3];
                }
                let filtersData = await dbReader.filters.findAndCountAll({
                    attributes: ['filter_id', 'name', 'slug', 'is_popular', 'is_system', 'short_name', 'description', 'filter_type'],
                    include: [{
                        attributes: ['first_name'],
                        model: dbReader.users,
                        required: false
                    }, {
                        separate: true,
                        model: dbReader.giFilters,
                        attributes: ['filter_id', [dbReader.Sequelize.literal('COUNT(`gi_filter_id`)'), 'filter_count']],
                        where: { filter_type: { [_ftCond]: _ft }, is_deleted: 0 },
                        group: ['filter_id']
                    }],
                    where: dbReader.Sequelize.and(
                        {
                            is_deleted: 0,
                            is_system: 1,
                            filter_type: { [dbReader.Sequelize.Op.in]: filterArrayData }
                        },
                        dbReader.Sequelize.or(
                            { name: { [SearchCondition]: SearchData } },
                            { slug: { [SearchCondition]: SearchData } },
                            { description: { [SearchCondition]: SearchData } }
                        ),
                    ),
                    limit: row_limit,
                    offset: row_offset,
                    order: [sortJoin]
                });
                filtersData = JSON.parse(JSON.stringify(filtersData));
                filtersData.rows.forEach((element: any) => {
                    element.created_by = (element.sycu_user && element.sycu_user.first_name) ? element.sycu_user.first_name : "";
                    delete element.sycu_user;
                    element.filter_count = (element.gg_games_icebreakers_filters.length) ? element.gg_games_icebreakers_filters[0].filter_count : 0;
                    delete element.gg_games_icebreakers_filters;
                });

                new SuccessResponse(EC.DataFetched, {
                    token: token,
                    count: filtersData.count,
                    ...filtersData,
                }).send(res);
            } else {
                throw new Error(EC.error);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
}
