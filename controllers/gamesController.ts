import { Request, Response } from "express";
import { ErrorController, SuccessResponse, BadRequestError, ApiError } from '../core/index';
const { dbWriter, dbReader } = require('../models/dbConfig');
import { sendNotificationToAndroid, sendNotificationToIos, getNumberWithDecimalInMultipleOfFive } from '../helpers/helpers'
import moment from 'moment';
const EC = new ErrorController();
const { Op } = dbReader.Sequelize;

export class GamesController {

    // Add/Update Game from database
    public async addUpdateGame(req: Request, res: Response) {
        try {
            // Getting user detail from token
            const requestContent: any = req;
            const token = requestContent.token;
            let user_role = requestContent.role;
            const user_id = requestContent.user_id;
            let is_system = user_role == 3 ? 0 : 1;
            let game_id = req.body.game_id || 0;
            let attachmentArray = req.body.attachment;
            let gameSlug = req.body.game_title.toLowerCase().replace(/[^A-Z0-9]+/ig, "-");

            if (game_id == 0) {
                let pageLink = await dbReader.pageLink.findAll({
                    where: { is_deleted: 0, keyword: gameSlug, site_id: 4 }
                });
                let is_validate = pageLink.length ? false : true;
                if (is_validate == false) {
                    gameSlug = gameSlug + '-' + moment().unix();
                }

                let gameData = await dbWriter.games.create({
                    user_id: user_id,
                    category_id: req.body.category_id ? req.body.category_id : 0,
                    game_description: req.body.game_description,
                    is_description_hide: req.body.is_description_hide ? req.body.is_description_hide : 0,
                    game_title: req.body.game_title,
                    what_to_get: req.body.what_to_get ? req.body.what_to_get : "",
                    what_to_prep: req.body.what_to_prep ? req.body.what_to_prep : "",
                    how_to_play: req.body.how_to_play ? req.body.how_to_play : "",
                    pro_tips: req.body.pro_tips ? req.body.pro_tips : "",
                    is_pro_tips_hide: req.body.is_pro_tips_hide ? req.body.is_pro_tips_hide : 0,
                    slide_link: req.body.slide_link ? req.body.slide_link : "",
                    is_system: is_system,
                    is_deleted: 0,
                });
                game_id = gameData.dataValues.game_id;
                await dbWriter.pageLink.create({
                    data_id: game_id,
                    ui_component: "game",
                    keyword: gameSlug,
                    link_type: 3,
                    site_id: 4
                });
            } else {
                let pageLink = await dbReader.pageLink.findOne({
                    where: { site_id: 4, is_deleted: 0, link_type: 3, data_id: game_id }
                });
                if (!pageLink) {
                    let pageLink = await dbReader.pageLink.findAll({
                        where: { is_deleted: 0, keyword: gameSlug, site_id: 4 }
                    });
                    let is_validate = pageLink.length ? false : true;
                    if (is_validate == false) {
                        gameSlug = gameSlug + '-' + moment().unix();
                    }
                    await dbWriter.pageLink.create({
                        data_id: game_id,
                        site_id: 4,
                        keyword: gameSlug,
                        ui_component: "game",
                        link_type: 3
                    });
                }
                await dbWriter.games.update({
                    category_id: req.body.category_id,
                    game_description: req.body.game_description,
                    is_description_hide: req.body.is_description_hide,
                    game_title: req.body.game_title,
                    what_to_get: req.body.what_to_get,
                    what_to_prep: req.body.what_to_prep,
                    how_to_play: req.body.how_to_play,
                    pro_tips: req.body.pro_tips,
                    is_pro_tips_hide: req.body.is_pro_tips_hide,
                    slide_link: req.body.slide_link,
                    updated_datetime: new Date(),
                    is_hidden: req.body.is_hidden
                }, {
                    where: { game_id: req.body.game_id }
                });
            }

            let addAttachmentArray: any = [];
            let existGameAttachment: any = [];
            if (req.body.attachment && attachmentArray.length > 0) {
                attachmentArray.filter(async (obj: any) => {
                    obj.game_attachment_id = obj.game_attachment_id || 0;
                    if (obj.game_attachment_id == 0) {
                        addAttachmentArray.push({
                            parent_id: game_id,
                            user_id: user_id,
                            parent_type: 1,
                            attachment_url: obj.attachment_url,
                            attachment_type: obj.attachment_type,
                            is_deleted: 0
                        });
                    } else {
                        existGameAttachment.push(obj.game_attachment_id);
                    }
                });
            }
            //Delete Attachment
            if (existGameAttachment.length) {
                await dbWriter.attachment.update({
                    is_deleted: 1,
                }, {
                    where: {
                        parent_id: game_id,
                        game_attachment_id: { [Op.notIn]: existGameAttachment }
                    }
                });

            } else {
                await dbWriter.attachment.update({
                    is_deleted: 1,
                }, {
                    where: {
                        parent_id: game_id,
                    }
                });
            }
            //Add Attachment
            if (addAttachmentArray.length) {
                await dbWriter.attachment.bulkCreate(addAttachmentArray)
            }

            let filtersArray = req.body.filters;
            let addFiltersArray: any = [];
            let existGameFilters: any = [];
            if (req.body.filters && filtersArray.length > 0) {
                filtersArray.filter(async (obj: any) => {
                    obj.gi_filter_id = obj.gi_filter_id || 0;
                    if (obj.gi_filter_id == 0) {
                        addFiltersArray.push({
                            filter_id: obj.filter_id,
                            user_id: user_id,
                            type_id: game_id,
                            filter_type: 1,
                            is_deleted: 0
                        });
                    } else {
                        existGameFilters.push(obj.gi_filter_id);
                    }
                });

            }
            if (existGameFilters.length) {
                await dbWriter.giFilters.update({
                    is_deleted: 1,
                }, {
                    where: {
                        type_id: game_id,
                        gi_filter_id: { [Op.notIn]: existGameFilters },
                        filter_type: 1
                    }
                });
            } else {
                await dbWriter.giFilters.update({
                    is_deleted: 1,
                }, {
                    where: {
                        type_id: game_id,
                        filter_type: 1
                    }
                });
            }
            if (addFiltersArray.length) {
                await dbWriter.giFilters.bulkCreate(addFiltersArray)
            }
            new SuccessResponse(EC.saveDataSuccess, {
                token: token,
            }).send(res);

        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async listGame(req: Request, res: Response) {
        try {
            // Getting user detail from token
            const requestContent: any = req;
            const token = requestContent.token;
            let reqBody = req.body, whereCondition: any;
            let sort_order = reqBody.sort_order ? reqBody.sort_order : "DESC";
            let sort_field = reqBody.sort_field ? reqBody.sort_field : "game_id";
            let row_limit = reqBody.page_record ? parseInt(reqBody.page_record) : 10;
            let row_offset = reqBody.page_no ? (reqBody.page_no * reqBody.page_record) - reqBody.page_record : 0;

            // Searching                           
            let SearchCondition = dbReader.Sequelize.Op.ne, SearchData = null;
            if (reqBody.search) {
                SearchCondition = dbReader.Sequelize.Op.like;
                SearchData = "%" + reqBody.search + "%";
            }
            let sortJoin
            if (sort_field == 'rating') {
                sortJoin = [dbReader.Sequelize.literal('(select avg(`rating`) as rating from `gg_ratings` where `gg_ratings`.`game_id` = `sycu_game_games`.`game_id`)'), sort_order];
            }
            else if (sort_field == 'played') {
                sortJoin = [dbReader.Sequelize.literal('(select count(`played_game_id`) as total_played from `gg_played_games` where `gg_played_games`.`game_id` = `sycu_game_games`.`game_id` and is_played = 1)'), sort_order];
            }
            else if (sort_field == 'favourites') {
                sortJoin = [dbReader.Sequelize.literal('(select count(`favourited_game_id`) as total_favourites from `gg_favourited_games` where `gg_favourited_games`.`game_id` = `sycu_game_games`.`game_id` and is_favourite = 1)'), sort_order];
            }
            else if (sort_field == 'total_view') {
                sortJoin = [dbReader.Sequelize.literal('(select count(`view_id`) as total_view from `gg_most_viewed_games` where `gg_most_viewed_games`.`game_id` = `sycu_game_games`.`game_id`)'), sort_order];
            }
            else if (sort_field == 'total_review') {
                sortJoin = [dbReader.Sequelize.literal('(select count(`rating_id`) as total_review from `gg_ratings` where `gg_ratings`.`game_id` = `sycu_game_games`.`game_id`)'), sort_order];
            }
            else if (sort_field == 'game_title') {
                sortJoin = [dbReader.Sequelize.literal('game_title'), sort_order]
            } else {
                sortJoin = [dbReader.Sequelize.literal('game_id'), sort_order]
            }

            if (reqBody.category_id) {
                whereCondition = { is_deleted: 0, is_system: reqBody.is_system, category_id: reqBody.category_id, game_title: { [SearchCondition]: SearchData } };
            } else {
                whereCondition = { is_deleted: 0, is_system: reqBody.is_system, game_title: { [SearchCondition]: SearchData } };
            }


            let listGame = await dbReader.games.findAndCountAll({
                attributes: ['game_id', 'category_id', 'game_title', 'game_description', 'is_description_hide', 'is_pro_tips_hide', 'slide_link', 'created_datetime', 'is_hidden',
                    [dbReader.Sequelize.literal('`first_name`'), 'author'],
                    [dbReader.Sequelize.literal('`keyword`'), 'redirect_keyword'],
                                    ],
                where: whereCondition,
                include: [{
                    separate: true,
                    model: dbReader.attachment,
                    where: { parent_type: 1, is_deleted: 0 },
                    attributes: ['game_attachment_id', 'attachment_url', 'attachment_type']
                }, {
                    separate: true,
                    model: dbReader.giFilters,
                    where: { filter_type: 1, is_deleted: 0, added_by_system: reqBody.is_system },
                    attributes: ['gi_filter_id',
                        [dbReader.Sequelize.literal(`name`), 'filter_name'],
                        [dbReader.Sequelize.literal(`gg_games_icebreakers_filters.filter_id`), 'filter_id']
                    ],
                    include: [{
                        model: dbReader.filters,
                        where: { is_system: 1 },
                        attributes: [],
                    }]
                }, {
                    separate: true,
                    model: dbReader.ratings,
                    attributes: [
                        [dbReader.Sequelize.fn('AVG', dbReader.Sequelize.col('rating')), 'rating'],
                        [dbReader.Sequelize.literal('COUNT(review)'), 'total_review']
                    ],
                    group: ['game_id']
                }, {
                    separate: true,
                    model: dbReader.favouritedGames,
                    where: { is_favourite: 1 },
                    attributes: ['game_id', 'favourited_game_id'],
                    limit: 1
                }, {
                    separate: true,
                    model: dbReader.playedGames,
                    where: { is_played: 1 },
                    attributes: ['game_id', 'played_game_id'],
                    limit: 1
                }, {
                    separate: true,
                    model: dbReader.mostViewedGames,
                    attributes: [[dbReader.Sequelize.literal('COUNT(`view_id`)'), 'total_view']],
                    group: ['game_id']
                }, {
                    model: dbReader.users,
                    attributes: [],
                },
                {
                    separate: true,
                    model: dbReader.slideShows,
                    attributes: ['slideshow_id'],
                     where: { is_deleted: 0 },
                    group: ['game_id']
                },
                {
                    model: dbReader.pageLink,
                    attributes: [],
                    where: {
                        site_id: 4,
                        link_type: 3
                    }
                }],
                limit: row_limit,
                offset: row_offset,
                order: [[sortJoin]],
            });
            
            listGame =JSON.parse(JSON.stringify(listGame))

            listGame.rows.forEach((element: any) => {
                element.favourites = (element.gg_favourited_games.length) ? element.gg_favourited_games.length : 0;
                delete element.gg_favourited_games;
                element.played = (element.gg_played_games.length) ? element.gg_played_games.length : 0;
                delete element.gg_played_games;
                element.total_view = (element.gg_most_viewed_games.length) ? element.gg_most_viewed_games[0].total_view : 0;
                delete element.gg_most_viewed_games;
                element.rating = (element.gg_ratings.length) ? getNumberWithDecimalInMultipleOfFive(element.gg_ratings[0].rating) : 0;
                element.total_review = (element.gg_ratings.length) ? element.gg_ratings.length : 0;
                delete element.gg_ratings;
                element.attachment = element.sycu_game_attachments;
                delete element.sycu_game_attachments;
                element.slideshow_id = (element.gs_slideshows.length) ? element.gs_slideshows[0].slideshow_id : 0;
                delete element.gs_slideshows;
                element.filters = element.gg_games_icebreakers_filters;
                delete element.gg_games_icebreakers_filters;
            });
          
            new SuccessResponse(EC.DataFetched, {
                token: token,
                count: listGame.count,
                rows: listGame.rows,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async gameDetail(req: Request, res: Response) {
        try {
            // Getting user detail from token
            const requestContent: any = req;
            const token = requestContent.token;
            let gameDetail = await dbReader.games.findAll({
                include: [
                    {
                        separate: true,
                        model: dbReader.attachment,
                        attributes: ['game_attachment_id', 'attachment_url', 'attachment_type'],
                        where: { parent_type: 1, is_deleted: 0 },
                    },
                    {
                        separate: true,
                        model: dbReader.giFilters,
                        attributes: ['gi_filter_id', [dbReader.Sequelize.literal(`name`), 'filter_name'],
                            [dbReader.Sequelize.literal(`gg_games_icebreakers_filters.filter_id`), 'filter_id']],
                        include: [{
                            model: dbReader.filters,
                            attributes: [],
                        }],
                        where: { filter_type: 1, is_deleted: 0 },
                    },
                    {
                        separate: true,
                        model: dbReader.ratings,
                        attributes: ['game_id', [dbReader.Sequelize.fn('AVG', dbReader.Sequelize.col('rating')), 'rating'],
                            [dbReader.Sequelize.literal('COUNT(review)'), 'total_review']],
                        group: ['game_id']
                    },
                    {
                        separate: true,
                        model: dbReader.favouritedGames,
                        attributes: ['game_id', 'favourited_game_id'],
                        where: { is_favourite: 1 },
                    },
                    {
                        separate: true,
                        model: dbReader.playedGames,
                        attributes: ['game_id', 'played_game_id'],
                        where: { is_played: 1 }
                    },
                    {
                        separate: true,
                        model: dbReader.mostViewedGames,
                        attributes: ['game_id', [dbReader.Sequelize.literal('COUNT(`view_id`)'), 'total_view']],
                        group: ['game_id']
                    },
                    {
                        model: dbReader.users,
                        attributes: [],
                    },
                ],
                attributes: ['game_id', 'category_id', 'game_title', 'game_description', 'is_description_hide', 'what_to_get', 'what_to_prep', 'how_to_play', 'pro_tips', 'is_pro_tips_hide','is_hidden',
                    [dbReader.Sequelize.literal('`display_name`'), 'Author'], 'slide_link', 'created_datetime', 'updated_datetime'
                ],
                where: { game_id: req.params.game_id },
            });
            gameDetail = JSON.parse(JSON.stringify(gameDetail));
            gameDetail.forEach((element: any) => {
                element.favourites = (element.gg_favourited_games.length) ? 1 : 0;
                delete element.gg_favourited_games;
                element.played = (element.gg_played_games.length) ? 1 : 0;
                delete element.gg_played_games;
                element.rating = (element.gg_ratings.length) ? element.gg_ratings[0].rating : 0;
                element.total_review = (element.gg_ratings.length) ? element.gg_ratings[0].total_review : 0;
                delete element.gg_ratings;
                element.attachment = element.sycu_game_attachments;
                delete element.sycu_game_attachments;
                element.filters = element.gg_games_icebreakers_filters;
                delete element.gg_games_icebreakers_filters;
                element.total_view = (element.gg_most_viewed_games.length) ? element.gg_most_viewed_games[0].total_view : 0;
                delete element.gg_most_viewed_games;
            });
            new SuccessResponse(EC.DataFetched, {
                token: token,
                ...gameDetail[0],
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async deleteGame(req: Request, res: Response) {
        try {
            // Getting user detail from token
            const requestContent: any = req;
            const token = requestContent.token;
            await dbWriter.games.update({ is_deleted: 1 }, { where: { game_id: req.params.game_id } });
            await dbWriter.pageLink.update({ is_deleted: 1 }, { where: { data_id: req.params.game_id, site_id: 4, link_type: 3 } });
            new SuccessResponse(EC.deleteDataSuccess, {
                token: token,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async deleteBulkGame(req: Request, res: Response) {
        try {
            // Getting user detail from token
            const requestContent: any = req;
            const token = requestContent.token;
            const user_id = requestContent.user_id;
            await dbWriter.games.update({ is_deleted: 1, updated_by: user_id }, { where: { game_id: { [dbReader.Sequelize.Op.in]: req.body.game_id } } });
            new SuccessResponse(EC.deleteDataSuccess, {
                token: token,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    //Display Ratings Of Game
    public async listGameRating(req: Request, res: Response) {
        try {
            // Getting user detail from token
            const requestContent: any = req;
            const token = requestContent.token;
            var reqBody = req.body;
            var row_offset = 0, row_limit = 10;
            //Pagination 
            if (reqBody.page_record) {
                row_limit = parseInt(reqBody.page_record);
            }

            if (reqBody.page_no) {
                row_offset = (reqBody.page_no * reqBody.page_record) - reqBody.page_record;
            }
            // Searching Data by game_title or display_name/user_name
            var SearchData = { [dbReader.Sequelize.Op.ne]: "" };
            if (reqBody.search) {
                SearchData = { [dbReader.Sequelize.Op.like]: reqBody.search };
            }
            var listGameRatings = await dbReader.ratings.findAndCountAll({
                include: [
                    {
                        separate: true,
                        model: dbReader.attachment,
                        attributes: ['game_attachment_id', 'attachment_url'],
                        where: { parent_type: 2, is_deleted: 0 },
                    },
                    {
                        model: dbReader.users,
                        attributes: [],
                    },
                    {
                        required: true,
                        model: dbReader.games,
                        attributes: [],
                        where: { is_deleted: 0 },
                    },
                ],
                attributes: ['rating_id', 'user_id', 'rating', 'game_id', 'review',
                    [dbReader.Sequelize.literal('`display_name`'), 'user_name'],
                    [dbReader.Sequelize.literal('`profile_image`'), 'profile_image'],
                    [dbReader.Sequelize.literal('`game_title`'), 'game_title'],
                    'created_datetime', 'updated_datetime',],
                where: dbReader.sequelize.or((dbReader.sequelize.where(dbReader.sequelize.col('`display_name`'), SearchData)),
                    (dbReader.sequelize.where(dbReader.sequelize.col('`game_title`'), SearchData))),
                limit: row_limit,
                offset: row_offset,
            });

            new SuccessResponse(EC.DataFetched, {
                token: token,
                count: listGameRatings.count,
                rows: listGameRatings.rows,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    //Game Report with pagination
    public async gameReportData(req: Request, res: Response) {
        try {
            // Getting user detail from token
            const requestContent: any = req;
            const token = requestContent.token;
            var reqBody = req.body;
            var row_offset = 0, row_limit = 10;
            //Pagination 
            if (reqBody.page_record) {
                row_limit = parseInt(reqBody.page_record);
            }

            if (reqBody.page_no) {
                row_offset = (reqBody.page_no * reqBody.page_record) - reqBody.page_record;
            }
            var startDate: any = "";
            var endDate: any = "";

            // Searching  
            var SearchData = { [dbReader.Sequelize.Op.ne]: "" };
            var dateSearch: any = { [dbReader.Sequelize.Op.ne]: "" };
            if (reqBody.ministry_level) {
                SearchData = { [dbReader.Sequelize.Op.like]: reqBody.ministry_level };
            }
            if (reqBody.end_date && reqBody.start_date) {
                startDate = moment(reqBody.start_date).format("YYYY-MM-DD");
                endDate = moment(reqBody.end_date).format("YYYY-MM-DD");
                dateSearch = { [dbReader.Sequelize.Op.between]: [startDate, endDate] };
            }

            var sortField = 'game_title', sortOrder = 'ASC';
            var sortJoin = [[sortField, sortOrder]];
            sortOrder = req.body.sort_order;
            if (req.body.sort_field == "game_title") {
                sortJoin = [dbReader.Sequelize.literal('game_title'), sortOrder];
            }
            else if (req.body.sort_field == "author") {
                sortJoin = [dbReader.Sequelize.literal('(select `display_name` as author from `sycu_users` where `sycu_users`.`user_id` = `sycu_game_games`.`user_id`)'), sortOrder];
            }
            else if (req.body.sort_field == "total_playedCount") {
                sortJoin = [dbReader.Sequelize.literal('(select count(`played_game_id`) as count from `gg_played_games` where `gg_played_games`.`game_id` = `sycu_game_games`.`game_id`)'), sortOrder];
            }
            else if (req.body.sort_field == "total_favouriteCount") {
                sortJoin = [dbReader.Sequelize.literal('(select count(`favourited_game_id`) as count from `gg_favourited_games` where `gg_favourited_games`.`game_id` = `sycu_game_games`.`game_id`)'), sortOrder];
            }
            else if (req.body.sort_field == "total_views") {
                sortJoin = [dbReader.Sequelize.literal('(select count(`view_id`) as count from `gg_most_viewed_games` where `gg_most_viewed_games`.`game_id` = `sycu_game_games`.`game_id`)'), sortOrder];
            }
            else if (req.body.sort_field == "total_shares") {
                sortJoin = [dbReader.Sequelize.literal('(select count(`share_id`) as count from `gg_shared_games` where `gg_shared_games`.`game_id` = `sycu_game_games`.`game_id`)'), sortOrder];
            }
            var gameReport = await dbReader.games.findAndCountAll({
                include: [
                    {
                        separate: true,
                        model: dbReader.attachment,
                        attributes: ['attachment_url'],
                        where: { parent_type: 1, attachment_type: 1, is_deleted: 0 },
                        limit: 1
                    },
                    {
                        model: dbReader.users,
                        attributes: [],
                    },
                    {
                        separate: true,
                        model: dbReader.ratings,
                        attributes: ['review'],
                        group: ['game_id']
                    },
                    {
                        separate: true,
                        model: dbReader.mostViewedGames,
                        attributes: [[dbReader.Sequelize.literal('COUNT(`view_id`)'), 'total_views']],
                        group: ['game_id']
                    },
                    {
                        separate: true,
                        model: dbReader.favouritedGames,
                        attributes: ['favourited_game_id', [dbReader.Sequelize.literal('COUNT(`favourited_game_id`)'), 'total_favouriteCount']],
                        where: { is_favourite: 1 },
                        group: ['game_id']
                    },
                    {
                        separate: true,
                        model: dbReader.playedGames,
                        attributes: ['played_game_id', [dbReader.Sequelize.literal('COUNT(`played_game_id`)'), 'total_playedCount']],
                        where: { is_played: 1 },
                        group: ['game_id']
                    },
                    {
                        separate: true,
                        model: dbReader.sharedGames,
                        attributes: [[dbReader.Sequelize.literal('COUNT(`share_id`)'), 'total_shares']],
                        group: ['game_id']
                    },
                ],
                attributes: ['game_id', 'game_title', [dbReader.Sequelize.literal('`display_name`'), 'author']],
                where: dbReader.sequelize.and((dbReader.sequelize.where(dbReader.sequelize.col('`ministry_level`'), SearchData)),
                    (dbReader.sequelize.where(dbReader.sequelize.col('`sycu_game_games`.`created_datetime`'), dateSearch)
                    )),
                order: [sortJoin],
                limit: row_limit,
                offset: row_offset,
            });
            gameReport = JSON.parse(JSON.stringify(gameReport));
            gameReport.rows.forEach((element: any) => {
                element.attachment_url = (element.sycu_game_attachments.length) ? element.sycu_game_attachments[0].attachment_url : "";
                delete element.sycu_game_attachments;
                element.total_views = (element.gg_most_viewed_games.length) ? element.gg_most_viewed_games[0].total_views : 0;
                delete element.gg_most_viewed_games;
                element.total_playedCount = (element.gg_played_games.length) ? element.gg_played_games[0].total_playedCount : 0;
                delete element.gg_played_games;
                element.total_favouriteCount = (element.gg_favourited_games.length) ? element.gg_favourited_games[0].total_favouriteCount : 0;
                delete element.gg_favourited_games;
                element.total_shares = (element.gg_shared_games.length) ? element.gg_shared_games[0].total_shares : 0;
                delete element.gg_shared_games;
                element.reviews = (element.gg_ratings.length) ? element.gg_ratings[0] : "";
                delete element.gg_most_viewed_games;

            });

            new SuccessResponse(EC.DataFetched, {
                token: token,
                count: gameReport.count,
                rows: gameReport.rows,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    //Game Report
    public async gameReport(req: Request, res: Response) {
        try {
            // Getting user detail from token
            const requestContent: any = req;
            const token = requestContent.token;
            var reqBody = req.body;
            var startDate: any = "";
            var endDate: any = "";
            // Searching  
            var SearchData = { [dbReader.Sequelize.Op.ne]: "" };
            var dateSearch: any = { [dbReader.Sequelize.Op.ne]: "" };
            if (reqBody.ministry_level) {
                SearchData = { [dbReader.Sequelize.Op.like]: reqBody.ministry_level };
            }
            if (reqBody.end_date && reqBody.start_date) {
                startDate = moment(reqBody.start_date).format("YYYY-MM-DD");
                endDate = moment(reqBody.end_date).format("YYYY-MM-DD");
                dateSearch = { [dbReader.Sequelize.Op.between]: [startDate, endDate] };
            }
            var sortField = 'game_title', sortOrder = 'ASC';
            var sortJoin = [[sortField, sortOrder]];
            sortOrder = req.body.sort_order;
            if (req.body.sort_field == "game_title") {
                sortJoin = [dbReader.Sequelize.literal('game_title'), sortOrder];
            }
            else if (req.body.sort_field == "author") {
                sortJoin = [dbReader.Sequelize.literal('(select `display_name` as author from `sycu_users` where `sycu_users`.`user_id` = `sycu_game_games`.`user_id`)'), sortOrder];
            }
            else if (req.body.sort_field == "total_playedCount") {
                sortJoin = [dbReader.Sequelize.literal('(select count(`played_game_id`) as count from `gg_played_games` where `gg_played_games`.`game_id` = `sycu_game_games`.`game_id`)'), sortOrder];
            }
            else if (req.body.sort_field == "total_favouriteCount") {
                sortJoin = [dbReader.Sequelize.literal('(select count(`favourited_game_id`) as count from `gg_favourited_games` where `gg_favourited_games`.`game_id` = `sycu_game_games`.`game_id`)'), sortOrder];
            }
            else if (req.body.sort_field == "total_views") {
                sortJoin = [dbReader.Sequelize.literal('(select count(`view_id`) as count from `gg_most_viewed_games` where `gg_most_viewed_games`.`game_id` = `sycu_game_games`.`game_id`)'), sortOrder];
            }
            else if (req.body.sort_field == "total_shares") {
                sortJoin = [dbReader.Sequelize.literal('(select count(`share_id`) as count from `gg_shared_games` where `gg_shared_games`.`game_id` = `sycu_game_games`.`game_id`)'), sortOrder];
            }
            var gameReport = await dbReader.games.findAll({
                include: [
                    {
                        separate: true,
                        model: dbReader.attachment,
                        attributes: ['attachment_url'],
                        where: { parent_type: 1, attachment_type: 1, is_deleted: 0 },
                        limit: 1
                    },
                    {
                        model: dbReader.users,
                        attributes: [],
                    },
                    {
                        separate: true,
                        model: dbReader.mostViewedGames,
                        attributes: [[dbReader.Sequelize.literal('COUNT(`view_id`)'), 'total_views']],
                        group: ['game_id']
                    },
                    {
                        separate: true,
                        model: dbReader.favouritedGames,
                        attributes: ['favourited_game_id', [dbReader.Sequelize.literal('COUNT(`favourited_game_id`)'), 'total_favouriteCount']],
                        where: { is_favourite: 1 },
                        group: ['game_id']
                    },
                    {
                        separate: true,
                        model: dbReader.playedGames,
                        attributes: ['played_game_id', [dbReader.Sequelize.literal('COUNT(`played_game_id`)'), 'total_playedCount']],
                        where: { is_played: 1 },
                        group: ['game_id']
                    },
                    {
                        separate: true,
                        model: dbReader.sharedGames,
                        attributes: [[dbReader.Sequelize.literal('COUNT(`share_id`)'), 'total_shares']],
                        group: ['game_id']
                    },
                ],
                attributes: ['game_id', 'game_title', [dbReader.Sequelize.literal('`display_name`'), 'author']],
                where: dbReader.sequelize.and((dbReader.sequelize.where(dbReader.sequelize.col('`ministry_level`'), SearchData)),
                    (dbReader.sequelize.where(dbReader.sequelize.col('`sycu_game_games`.`created_datetime`'), dateSearch)
                    )),
                order: [sortJoin],
            });
            gameReport = JSON.parse(JSON.stringify(gameReport));
            gameReport.forEach((element: any) => {
                element.attachment_url = (element.sycu_game_attachments.length) ? element.sycu_game_attachments[0].attachment_url : "";
                delete element.sycu_game_attachments;
                element.total_views = (element.gg_most_viewed_games.length) ? element.gg_most_viewed_games[0].total_views : 0;
                delete element.gg_most_viewed_games;
                element.total_playedCount = (element.gg_played_games.length) ? element.gg_played_games[0].total_playedCount : 0;
                delete element.gg_played_games;
                element.total_favouriteCount = (element.gg_favourited_games.length) ? element.gg_favourited_games[0].total_favouriteCount : 0;
                delete element.gg_favourited_games;
                element.total_shares = (element.gg_shared_games.length) ? element.gg_shared_games[0].total_shares : 0;
                delete element.gg_shared_games;
            });

            new SuccessResponse(EC.DataFetched, {
                token: token,
                count: gameReport.count,
                rows: gameReport.rows,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    //Notification
    public async addNotification(req: Request, res: Response) {
        try {
            // Getting user detail from token
            const requestContent: any = req;
            const token = requestContent.token;
            let notification_id = 0;
            let user_idArray = req.body.user_id;
            var notificationData = await dbWriter.notifications.create({
                notification_title: req.body.notification_title,
                notification_description: req.body.notification_description,
                notification_type: req.body.notification_type,
                notification_type_id: req.body.notification_type_id,
            });
            if (notificationData) {
                notification_id = notificationData.dataValues.notification_id;
            }
            if (req.body.user_id && user_idArray.length > 0) {
                let addSentNotificationArray: any = [];
                user_idArray.filter(async (obj: any) => {
                    addSentNotificationArray.push({
                        notification_id: notification_id,
                        user_id: obj,
                    });
                });
                //Add Attachment
                if (addSentNotificationArray.length) {
                    await dbWriter.sentNotifications.bulkCreate(addSentNotificationArray)
                }
            }
            new SuccessResponse(EC.DataFetched, {
                token: token,
                data: {},
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    //Sent Notification
    public async sentNotification(req: Request, res: Response) {
        try {
            // Getting user detail from token
            const requestContent: any = req;
            const token = requestContent.token;
            var notificationData = await dbReader.sentNotifications.findAll({
                include: [
                    {
                        model: dbReader.users,
                        attributes: [],
                        include: [
                            {
                                // separate:true,
                                model: dbReader.userLoginLogs,
                                attributes: ['device_token', 'created_datetime'],
                                order: ['created_datetime'],
                                // limit: 1
                            },
                        ]
                    },
                    {
                        required: true,
                        model: dbReader.notifications,
                        attributes: [],
                    }
                ],
                attributes: ['notification_sent_id', 'notification_id', 'user_id', 'is_processed',
                    [dbReader.Sequelize.literal('`via_platform`'), 'via_platform'],

                    [dbReader.Sequelize.literal('`notification_description`'), 'notification_description'],
                    [dbReader.Sequelize.literal('`notification_title`'), 'notification_title']],
                where: { is_processed: 0, is_sent: 0, },
                limit: 1
            });
            var updateData = await dbWriter.sentNotifications.update({ is_processed: 1 }, {
                where: { is_processed: 0, is_sent: 0 },
                limit: 1
            });
            notificationData = JSON.parse(JSON.stringify(notificationData))
            notificationData.forEach(async (element: any) => {
                var payload: any = {};
                payload.body = element.notification_description,
                    payload.sender_user_id = element.user_id,
                    payload.title = element.notification_title,
                    payload.tokens = element.device_token;
                if (element.via_platform == 1) {

                } else if (element.via_platform == 2) {
                    await sendNotificationToIos(payload);
                } else if (element.via_platform == 3) {
                    await sendNotificationToAndroid(payload);
                }
                await dbWriter.sentNotifications.update({ is_sent: 1 }, {
                    where: { notification_sent_id: element.notification_sent_id }
                });
            });
            new SuccessResponse(EC.DataFetched, {
                token: token,
                data: notificationData,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    //Read Sent Notification
    public async readSentNotification(req: Request, res: Response) {
        try {
            //@ts-ignore
            const token = req.token;
            const data = await dbWriter.sentNotifications.update({
                is_seen: 1,
                seen_datetime: new Date(),
            }, {
                where: { notification_sent_id: req.body.notification_sent_id }
            });
            new SuccessResponse(EC.updatedDataSuccess, {
                token: token,
                data: data,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async listGameReview(req: Request, res: Response) {
        try {
            // Getting user detail from token
            //@ts-ignore
            let { token } = req
            let {
                game_id,
                user_id,
                sort_order,
                sort_field, page_record, page_no } = req.body
            var row_offset = 0, row_limit = 10;

            //Pagination 
            if (page_record) {
                row_limit = parseInt(page_record);
            }

            if (page_no) {
                row_offset = (page_no * page_record) - page_record;
            }
            let sortJoin;
            let gameId = 0, userId = 0, idGameCond = dbReader.Sequelize.Op.ne, idUserCond = dbReader.Sequelize.Op.ne;
            if (game_id != 0) {
                gameId = game_id,
                    idGameCond = dbReader.Sequelize.Op.eq;
            }
            if (user_id != 0) {
                userId = user_id;
                idUserCond = dbReader.Sequelize.Op.eq;
            }
            if (sort_field == 'game_title') {
                sortJoin = [dbReader.Sequelize.literal('(select `game_title` as game_title from `gg_games` where `gg_ratings`.`game_id` = `gg_games`.`game_id`)'), sort_order];
            }
            else if (sort_field == 'author') {
                sortJoin = [dbReader.Sequelize.literal('(select `first_name` as author from `sycu_users` where `sycu_users`.`user_id` = `gg_ratings`.`user_id`)'), sort_order];
            }
            else if (sort_field == 'created_datetime') {
                sortJoin = [dbReader.Sequelize.literal('`gg_ratings`.`created_datetime`'), sort_order];

            }
            else if (sort_field == 'rating') {
                sortJoin = [dbReader.Sequelize.literal('rating'), sort_order];
            }

            var listGameRatings = await dbReader.ratings.findAndCountAll({
                include: [
                    {
                        separate: true,
                        model: dbReader.attachment,
                        attributes: ['game_attachment_id', 'attachment_url', 'attachment_type'],
                        where: { parent_type: 2, is_deleted: 0 },
                    },
                    {
                        required: true,
                        model: dbReader.users,
                        attributes: [],
                    },
                    {
                        required: true,
                        model: dbReader.games,
                        attributes: []
                    },
                ],
                attributes: ['rating_id', 'user_id', 'rating', 'game_id', [dbReader.Sequelize.literal("`game_title`"), "game_title"], 'review', 'updated_datetime', 'created_datetime',
                    [dbReader.Sequelize.literal("`first_name`"), "author"]],
                where: dbReader.Sequelize.and({ user_id: { [idUserCond]: userId } }, { game_id: { [idGameCond]: gameId } },
                    { is_deleted: 0 }),
                order: [[sortJoin]],
                limit: row_limit,
                offset: row_offset,
            });


            listGameRatings = JSON.parse(JSON.stringify(listGameRatings));
            listGameRatings.rows.forEach((element: any) => {


                element.attachments = (element.sycu_game_attachments != null) ? element.sycu_game_attachments : []
                delete element.sycu_game_attachments;

            });
            new SuccessResponse(EC.DataFetched, {
                token: token,
                count:listGameRatings.count,
                rows: listGameRatings.rows,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
    public async deleteGameReview(req: Request, res: Response) {
        try {
            //@ts-ignore
            let { token, user_id } = req
            // Getting user detail from token

            await dbWriter.ratings.update({ is_deleted: 1, updated_by: user_id },
                {
                    where:
                        { rating_id: { [dbReader.Sequelize.Op.in]: req.body.rating_ids } }
                });
            new SuccessResponse(EC.deleteDataSuccess, {
                token: token,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
}
