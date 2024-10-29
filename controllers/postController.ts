import { Request, Response } from "express";
import { ErrorController } from "../core/ErrorController";
import { SuccessResponse } from '../core/ApiResponse';
import { BadRequestError, ApiError } from '../core/ApiError';
import { enumerationController } from "./enumerationController";
const { dbReader, dbWriter } = require('../models/dbConfig');
const EC = new ErrorController();
const newsFeedContentTypeId = 10;
const curriculumSiteId = 2;
var EnumObject = new enumerationController();

export class postController {

    public async listAllPosts(req: Request, res: Response) {
        try {
            let reqBody = req.body, whereCondition, data: any, fetchAllCards = false;
            let sortOrder = reqBody.sort_order ? reqBody.sort_order : "DESC";
            let sortField = reqBody.sort_field ? reqBody.sort_field : "post_id";
            let rowLimit = reqBody.page_record ? parseInt(reqBody.page_record) : 10;
            let rowOffset = reqBody.page_no ? ((reqBody.page_no * rowLimit) - rowLimit) : 0;
            let contentTypeId = reqBody.content_type_id ? reqBody.content_type_id : 0;
            let categoryId = reqBody.category_id ? reqBody.category_id : 0;
            let pageId = reqBody.page_id ? reqBody.page_id : 0;

            let pagePostObject = {};
            if (categoryId == EnumObject.categoryIDEnum.get('musicCategoryId').value) {
                pagePostObject = {
                    required: true,
                    model: dbReader.pagePosts,
                    attributes: ["page_post_id", "page_id", "is_locked", "is_coming_soon", "sort_order"],
                    where: { is_deleted: 0 },
                    order: [['sort_order', "ASC"]]
                }
            } else {
                pagePostObject = {
                    separate: true,
                    model: dbReader.pagePosts,
                    attributes: ["page_post_id", "page_id", "is_locked", "is_coming_soon", "sort_order"],
                    where: { is_deleted: 0, is_selected: 1, page_id: pageId },
                    order: [['sort_order', "ASC"]]
                }
            }

            // Searching                           
            let SearchCondition = dbReader.Sequelize.Op.ne, SearchData = null;
            if (reqBody.search) {
                SearchCondition = dbReader.Sequelize.Op.like;
                SearchData = "%" + reqBody.search + "%";
            }
            if (reqBody.post_ids && reqBody.post_ids.length) {
                whereCondition = { post_id: reqBody.post_ids, is_hidden: 0 }
            } else if (contentTypeId && categoryId) {
                if (contentTypeId == 9 && categoryId == 8 && reqBody.ministry_type == 4) {
                    whereCondition = dbReader.Sequelize.and(
                        { is_deleted: 0 },
                        { category_id: categoryId },
                        { content_type_id: contentTypeId },
                        { ministry_type: reqBody.ministry_type },
                        { post_title: { [SearchCondition]: SearchData } }
                    );
                } else {
                    whereCondition = dbReader.Sequelize.and(
                        { is_hidden: 0 },
                        { is_deleted: 0 },
                        { category_id: categoryId },
                        { content_type_id: contentTypeId },
                        { ministry_type: reqBody.ministry_type },
                        { post_title: { [SearchCondition]: SearchData } }
                    );
                }
            } else if (contentTypeId && !categoryId) {
                fetchAllCards = true;
                whereCondition = dbReader.Sequelize.and(
                    { is_hidden: 0 },
                    { is_deleted: 0 },
                    { content_type_id: contentTypeId },
                    { ministry_type: reqBody.ministry_type },
                    { post_title: { [SearchCondition]: SearchData } }
                );
            } else if (!contentTypeId && categoryId) {
                if (categoryId == 8 && reqBody.ministry_type == 4) {
                    whereCondition = dbReader.Sequelize.and(
                        { is_deleted: 0 },
                        { category_id: categoryId },
                        { ministry_type: reqBody.ministry_type },
                        { post_title: { [SearchCondition]: SearchData } }
                    );
                } else {
                    whereCondition = dbReader.Sequelize.and(
                        { is_hidden: 0 },
                        { is_deleted: 0 },
                        { category_id: categoryId },
                        { ministry_type: reqBody.ministry_type },
                        { post_title: { [SearchCondition]: SearchData } }
                    );
                }
            } else {
                whereCondition = dbReader.Sequelize.and(
                    { is_hidden: 0 },
                    { is_deleted: 0 },
                    { ministry_type: reqBody.ministry_type },
                    { post_title: { [SearchCondition]: SearchData } }
                );
            }

            fetchAllCards = reqBody.is_from_old == 1 ? true : fetchAllCards;
            let includeArray = [{
                model: dbReader.categories,
                attributes: ["category_title"],
            }, {
                separate: true,
                model: dbReader.postMeta,
                attributes: ["post_meta_id", "meta_key", "meta_value"],
            }, {
                as: 'created_user',
                model: dbReader.users,
                attributes: ['user_id', 'display_name'],
            }, {
                as: 'updated_user',
                model: dbReader.users,
                attributes: ['user_id', 'display_name'],
            }, {
                separate: true,
                model: dbReader.postsFolders,
                where: { is_deleted: 0 },
                order: [['sort_order', 'ASC']]
            }, pagePostObject]

            if (categoryId) {
                if (categoryId == EnumObject.categoryIDEnum.get('musicCategoryId').value) {
                    data = await dbReader.posts.findAndCountAll({
                        attributes: ["post_id", "content_type_id", "category_id", "ministry_type", "post_title", "is_hidden_card",
                        "post_description", "post_image", "created_by", "updated_by", "created_datetime", "updated_datetime", "is_hidden"],
                        where: whereCondition,
                        include: includeArray,
                        offset: rowOffset,
                        order: [[sortField, sortOrder]]
                    });
                } else {
                    data = await dbReader.posts.findAndCountAll({
                        attributes: ["post_id", "content_type_id", "category_id", "ministry_type", "post_title", "is_hidden_card",
                        "post_description", "post_image", "created_by", "updated_by", "created_datetime", "updated_datetime", "is_hidden"],
                        where: whereCondition,
                        include: includeArray,
                        limit: rowLimit,
                        offset: rowOffset,
                        order: [[sortField, sortOrder]]
                    });
                }
            } else {
                data = await dbReader.posts.findAndCountAll({
                    attributes: ["post_id", "content_type_id", "category_id", "ministry_type", "post_title", "is_hidden_card",
                        "post_description", "post_image", "created_by", "updated_by", "created_datetime", "updated_datetime", "is_hidden"],
                    where: whereCondition,
                    include: includeArray,
                    order: [[sortField, sortOrder]]
                });
            }
            if (data.rows.length) {
                data = JSON.parse(JSON.stringify(data));
                data.rows.forEach((e: any) => {
                    e.category_title = e.sycu_category ? e.sycu_category.category_title : "";
                    e.created_by = e.created_user.length ? e.created_user[0].display_name : "";
                    e.updated_by = e.updated_user.length ? e.updated_user[0].display_name : "";
                    if (e.page_posts.length && e.page_posts.some((p: any) => p.page_id == pageId)) {
                        let pagePost = e.page_posts.find((p: any) => p.page_id == pageId);
                        e.sort_order = pagePost.sort_order;
                        e.is_locked = pagePost.is_locked;
                        e.is_coming_soon = pagePost.is_coming_soon;
                    } else if (!fetchAllCards && contentTypeId != 12) {
                        e.page_posts = [];
                        data.count--;
                    }
                    delete e.created_user;
                    delete e.updated_user;
                    delete e.sycu_category;
                });
                data.rows = (!fetchAllCards && contentTypeId != 12) ? data.rows.filter((e: any) => e.page_posts.length > 0) : data.rows;
                data.rows.sort((a: any, b: any) => a.sort_order - b.sort_order);
            }

            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token,
                posts_list: data
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async listAllOldPosts(req: Request, res: Response) {
        try {
            let reqBody = req.body, whereCondition, data: any, fetchAllCards = false;
            let sortOrder = reqBody.sort_order ? reqBody.sort_order : "DESC";
            let sortField = reqBody.sort_field ? reqBody.sort_field : "post_id";
            let rowLimit = reqBody.page_record ? parseInt(reqBody.page_record) : 10;
            let rowOffset = reqBody.page_no ? ((reqBody.page_no * rowLimit) - rowLimit) : 0;
            let contentTypeId = reqBody.content_type_id ? reqBody.content_type_id : 0;
            let categoryId = reqBody.category_id ? reqBody.category_id : 0;
            let pageId = reqBody.page_id ? reqBody.page_id : 0;

            // Searching                           
            let SearchCondition = dbReader.Sequelize.Op.ne, SearchData = null;
            if (reqBody.search) {
                SearchCondition = dbReader.Sequelize.Op.like;
                SearchData = "%" + reqBody.search + "%";
            }
            if (reqBody.post_ids && reqBody.post_ids.length) {
                whereCondition = { post_id: reqBody.post_ids, is_hidden: 0 }
            } else if (contentTypeId && categoryId) {
                if (contentTypeId == 9 && categoryId == 8 && reqBody.ministry_type == 4) {
                    whereCondition = dbReader.Sequelize.and(
                        { is_deleted: 0 },
                        { category_id: categoryId },
                        { content_type_id: contentTypeId },
                        { ministry_type: reqBody.ministry_type },
                        { post_title: { [SearchCondition]: SearchData } }
                    );
                } else {
                    whereCondition = dbReader.Sequelize.and(
                        { is_hidden: 1 },
                        { is_deleted: 0 },
                        { category_id: categoryId },
                        { content_type_id: contentTypeId },
                        { ministry_type: reqBody.ministry_type },
                        { post_title: { [SearchCondition]: SearchData } }
                    );
                }
            } else if (contentTypeId && !categoryId) {
                fetchAllCards = true;
                whereCondition = dbReader.Sequelize.and(
                    { is_hidden: 1 },
                    { is_deleted: 0 },
                    { content_type_id: contentTypeId },
                    { ministry_type: reqBody.ministry_type },
                    { post_title: { [SearchCondition]: SearchData } }
                );
            } else if (!contentTypeId && categoryId) {
                if (categoryId == 8 && reqBody.ministry_type == 4) {
                    whereCondition = dbReader.Sequelize.and(
                        { is_deleted: 0 },
                        { category_id: categoryId },
                        { ministry_type: reqBody.ministry_type },
                        { post_title: { [SearchCondition]: SearchData } }
                    );
                } else {
                    whereCondition = dbReader.Sequelize.and(
                        { is_hidden: 1 }, { is_deleted: 0 },
                        { category_id: categoryId },
                        { ministry_type: reqBody.ministry_type },
                        { post_title: { [SearchCondition]: SearchData } }
                    );
                }
            } else {
                whereCondition = dbReader.Sequelize.and(
                    { is_hidden: 1 }, { is_deleted: 0 },
                    { ministry_type: reqBody.ministry_type },
                    { post_title: { [SearchCondition]: SearchData } }
                );
            }

            fetchAllCards = reqBody.is_from_old == 1 ? true : fetchAllCards;
            let includeArray = [{
                model: dbReader.categories,
                attributes: ["category_title"],
            }, {
                separate: true,
                model: dbReader.postMeta,
                attributes: ["post_meta_id", "meta_key", "meta_value"],
            }, {
                as: 'created_user',
                model: dbReader.users,
                attributes: ['user_id', 'display_name'],
            }, {
                as: 'updated_user',
                model: dbReader.users,
                attributes: ['user_id', 'display_name'],
            }, {
                separate: true,
                model: dbReader.postsFolders,
                where: { is_deleted: 0 },
                order: [['sort_order', 'ASC']]
            }, {
                separate: true,
                model: dbReader.pagePosts,
                attributes: ["page_post_id", "page_id", "is_locked", "is_coming_soon", "sort_order"],
                where: { is_deleted: 0, is_selected: 1, page_id: pageId },
                order: [['sort_order', "ASC"]]
            }]

            if (categoryId) {
                data = await dbReader.posts.findAndCountAll({
                    attributes: ["post_id", "content_type_id", "category_id", "ministry_type", "post_title", "post_description",
                        "post_image", "created_by", "updated_by", "created_datetime", "updated_datetime", "is_hidden", "is_hidden_card"],
                    where: whereCondition,
                    include: includeArray,
                    limit: rowLimit,
                    offset: rowOffset,
                    order: [[sortField, sortOrder]]
                });
            } else {
                data = await dbReader.posts.findAndCountAll({
                    attributes: ["post_id", "content_type_id", "category_id", "ministry_type", "post_title", "post_description",
                        "post_image", "created_by", "updated_by", "created_datetime", "updated_datetime", "is_hidden", "is_hidden_card"],
                    where: whereCondition,
                    include: includeArray,
                    order: [[sortField, sortOrder]]
                });
            }
            if (data.rows.length) {
                data = JSON.parse(JSON.stringify(data));
                data.rows.forEach((e: any) => {
                    e.category_title = e.sycu_category ? e.sycu_category.category_title : "";
                    e.created_by = e.created_user.length ? e.created_user[0].display_name : "";
                    e.updated_by = e.updated_user.length ? e.updated_user[0].display_name : "";
                    if (e.page_posts.length && e.page_posts.some((p: any) => p.page_id == pageId)) {
                        let pagePost = e.page_posts.find((p: any) => p.page_id == pageId);
                        e.sort_order = pagePost.sort_order;
                        e.is_locked = pagePost.is_locked;
                        e.is_coming_soon = pagePost.is_coming_soon;
                    } else if (!fetchAllCards && contentTypeId != 12) {
                        e.page_posts = [];
                        data.count--;
                    }
                    delete e.created_user;
                    delete e.updated_user;
                    delete e.sycu_category;
                });
                data.rows = (!fetchAllCards && contentTypeId != 12) ? data.rows.filter((e: any) => e.page_posts.length > 0) : data.rows;
                data.rows.sort((a: any, b: any) => a.sort_order - b.sort_order);
            }

            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token,
                posts_list: data
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getPostDetails(req: Request, res: Response) {
        try {
            let { post_id, page_id = 0 } = req.body;
            if (!page_id) {
                page_id = 0
            }
            let post = await dbReader.posts.findOne({
                where: { post_id: post_id },
                attributes: ["content_type_id", "category_id", "ministry_type", "post_title", "post_description", "post_image", "post_video", "is_hidden_card"],
                include: [{
                    model: dbReader.postMeta,
                    attributes: ["post_meta_id", "meta_key", "meta_value"],
                    separate: true,
                }, {
                    model: dbReader.contentTypes,
                    attributes: ["content_type_id", "content_type_title"],
                    include: [{
                        model: dbReader.contentMeta,
                        attributes: ["content_meta_id", "meta_key", "meta_type", "meta_value"],
                        where: { is_deleted: 0 },
                        separate: true,
                    }]
                }, {
                    separate: true,
                    model: dbReader.pagePosts,
                    attributes: ["page_post_id", "page_id", "is_locked", "is_coming_soon"],
                    where: { is_deleted: 0, is_selected: 1, page_id: page_id }
                }]
            });
            if (post) {
                post = JSON.parse(JSON.stringify(post));
                if (post.page_posts.some((p: any) => p.page_id == page_id)) {
                    let pagePost = post.page_posts.find((p: any) => p.page_id == page_id);
                    post.is_locked = pagePost.is_locked;
                    post.is_coming_soon = pagePost.is_coming_soon;
                } else {
                    post.is_locked = 0;
                    post.is_coming_soon = 0;
                }
                post.content_meta = post.content_type.content_meta;
                delete post.content_type;
                delete post.page_posts;
                if (post.content_type_id == newsFeedContentTypeId) {
                    let selectedPageIds: any = [], selectedVolumeIds: any = [];
                    let newsFeeds = await dbReader.pagePosts.findAll({
                        where: { content_type_id: newsFeedContentTypeId, post_id: post_id, is_deleted: 0 },
                        attributes: ['page_id']
                    });
                    if (newsFeeds.length) {
                        newsFeeds = JSON.parse(JSON.stringify(newsFeeds));
                        newsFeeds.forEach((e: any) => {
                            if (!selectedVolumeIds.includes(e.page_id)) selectedPageIds.push(e.page_id)
                        });
                    }

                    let pages = await dbReader.pages.findAll({
                        where: { page_id: selectedPageIds, is_deleted: 0 },
                        attributes: ['category_id']
                    });
                    pages = JSON.parse(JSON.stringify(pages));
                    pages.forEach((e: any) => {
                        if (!selectedVolumeIds.includes(e.category_id)) selectedVolumeIds.push(e.category_id);
                    });
                    post.selected_volumes = selectedVolumeIds;
                    post.selected_pages = selectedPageIds;
                }
            }

            new SuccessResponse(EC.errorMessage(EC.success), {
                //@ts-ignore
                token: req.token,
                post: post
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async savePost(req: Request, res: Response) {
        try {
            //@ts-ignore
            let { user_id = 0 } = req, reqBody = req.body, post: any;
            let postId = reqBody.post_id ? reqBody.post_id : 0;

            if (postId) {
                post = await dbWriter.posts.update({
                    content_type_id: reqBody.content_type_id,
                    post_title: reqBody.post_title || "",
                    post_description: reqBody.post_description || "",
                    post_image: reqBody.post_image || "",
                    post_video: reqBody.post_video || "",
                    updated_by: user_id,
                }, {
                    where: { post_id: reqBody.post_id }
                });

                if (reqBody.page_id && reqBody.content_type_id) {
                    await dbWriter.pagePosts.update({
                        is_locked: reqBody.is_locked,
                        is_coming_soon: reqBody.is_coming_soon,
                    }, {
                        where: {
                            is_selected: 1,
                            post_id: postId,
                            page_id: reqBody.page_id,
                            content_type_id: reqBody.content_type_id,
                        }
                    });
                } else if (reqBody.category_id == EnumObject.categoryIDEnum.get('musicCategoryId').value) {
                    if (reqBody.content_type_id) {
                        await dbWriter.pagePosts.update({
                            is_locked: reqBody.is_locked,
                            is_coming_soon: reqBody.is_coming_soon,
                        }, {
                            where: {
                                is_selected: 1,
                                post_id: postId,
                                content_type_id: reqBody.content_type_id,
                            }
                        });
                    }
                }
            } else {
                post = await dbWriter.posts.create({
                    content_type_id: reqBody.content_type_id,
                    category_id: reqBody.category_id || 0,
                    ministry_type: reqBody.ministry_type || 0,
                    post_title: reqBody.post_title || "",
                    post_description: reqBody.post_description || "",
                    post_image: reqBody.post_image || "",
                    post_video: reqBody.post_video || "",
                    is_hidden: reqBody.is_hidden ? 1 : 0,
                    created_by: user_id,
                });
                postId = post.post_id;

                if (reqBody.category_id == EnumObject.categoryIDEnum.get('musicCategoryId').value) {
                    await dbWriter.pagePosts.create({
                        is_selected: 1,
                        post_id: postId,
                        created_by: user_id,
                        sort_order: 1,
                        is_coming_soon: reqBody.is_coming_soon || 0,
                        content_type_id: reqBody.content_type_id,
                    });
                }

                if (reqBody.page_id && reqBody.content_type_id) {
                    await dbWriter.pagePosts.create({
                        is_selected: 1,
                        post_id: postId,
                        created_by: user_id,
                        page_id: reqBody.page_id,
                        is_locked: reqBody.is_locked || 0,
                        sort_order: reqBody.sort_order || 0,
                        is_coming_soon: reqBody.is_coming_soon || 0,
                        content_type_id: reqBody.content_type_id,
                    });
                }
            }

            // Add/Update post meta in bulk create/update
            if (reqBody.post_meta.length > 0) {
                let isExistPostMetaId: any = [], postMeta: any = [];
                let meta_value = "case post_meta_id";

                // if (reqBody.category_id == (EnumObject.categoryIDEnum.get('musicCategoryId').value)) {
                //     await dbWriter.postMeta.update({
                //         meta_key: '_Change'
                //     }, {
                //         where: { post_id: postId, meta_key: 'default_tab' }
                //     })
                // }

                reqBody.post_meta.forEach((element: any) => {
                    if (!element.post_meta_id) {
                        postMeta.push({
                            post_id: postId,
                            meta_key: element.meta_key,
                            meta_value: element.meta_value,
                        });
                    } else {
                        isExistPostMetaId.push(element.post_meta_id);
                        meta_value += " when " + element.post_meta_id + " then " + JSON.stringify(element.meta_value);
                    }
                });
                if (isExistPostMetaId.length) {
                    meta_value += " else meta_value end";
                    await dbWriter.postMeta.update({ meta_value: dbWriter.Sequelize.literal(meta_value) }, {
                        where: { post_meta_id: { [dbReader.Sequelize.Op.in]: isExistPostMetaId } }
                    });
                }
                if (postMeta.length) {
                    await dbWriter.postMeta.bulkCreate(postMeta);
                }
            }

            //add/delete news feeds content_type_id 10
            if (reqBody.content_type_id == newsFeedContentTypeId) {
                let deleteNewsFeed: any = [];
                let newsFeeds = await dbReader.pagePosts.findAll({
                    where: { content_type_id: reqBody.content_type_id, post_id: postId, is_deleted: 0 },
                    attributes: ['page_post_id', 'page_id', 'post_id']
                });
                newsFeeds = JSON.parse(JSON.stringify(newsFeeds));
                //delete unselected news feeds data
                newsFeeds.forEach((e: any) => {
                    if (!reqBody.selected_pages.some((page: any) => page == e.page_id) && e.post_id == postId) {
                        deleteNewsFeed.push(e.page_post_id);
                    }
                });
                if (deleteNewsFeed.length) {
                    await dbWriter.pagePosts.update({
                        is_deleted: 1,
                        updated_by: user_id
                    }, {
                        where: { page_post_id: deleteNewsFeed }
                    });
                }
                //add news feeds pages
                if (reqBody.selected_pages.length) {
                    let addNewsFeeds: any = [], sortOrder = 0;
                    reqBody.selected_pages.forEach((page: any) => {
                        if (!newsFeeds.some((e: any) => page == e.page_id)) {
                            sortOrder = sortOrder + 1;
                            addNewsFeeds.push({
                                content_type_id: reqBody.content_type_id,
                                page_id: page,
                                post_id: postId,
                                is_locked: 0,
                                is_coming_soon: 0,
                                is_selected: 1,
                                sort_order: sortOrder
                            });
                        }
                    });
                    if (addNewsFeeds.length) {
                        await dbWriter.pagePosts.bulkCreate(addNewsFeeds);
                    }
                }
            }

            let msg = "Success.";
            if (reqBody.ministry_type == 4) {
                if (reqBody.post_id) {
                    msg = "Free VBS resource has been updated succesfully.";
                } else {
                    msg = "Free VBS resource has been added succesfully.";
                }
            }
            new SuccessResponse(EC.errorMessage(msg), {
                //@ts-ignore
                token: req.token,
                post: post
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async deletePost(req: Request, res: Response) {
        try {
            //@ts-ignore
            let { user_id = 0 } = req, postId = req.params.id;
            await dbWriter.posts.update({ is_deleted: 1, updated_by: user_id }, { where: { post_id: postId } });
            await dbWriter.pagePosts.update({ is_deleted: 1, updated_by: user_id }, { where: { post_id: postId } });
            await dbWriter.postsFolders.update({ is_deleted: 1 }, { where: { post_id: postId } });
            new SuccessResponse(EC.errorMessage(EC.deleteDataSuccess), '').send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getPageConnectedPosts(req: Request, res: Response) {
        try {
            let { page_id, content_type_id } = req.body;
            let pagePosts = await dbReader.pagePosts.findAll({
                where: { is_deleted: 0, page_id: page_id, content_type_id: content_type_id },
                attributes: ["page_post_id", "post_id", "is_locked", "is_coming_soon", "is_selected", "sort_order"],
            });
            pagePosts = JSON.parse(JSON.stringify(pagePosts));
            new SuccessResponse(EC.errorMessage(EC.success), {
                //@ts-ignore
                token: req.token,
                page_posts: pagePosts
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async savePageConnectedPosts(req: Request, res: Response) {
        try {
            //@ts-ignore
            let { user_id = 0 } = req;
            let { selected_posts, page_id, content_type_id } = req.body;
            let arrInsertData: any = [], isExistPagePostId: any = [];
            let update_is_locked = "case page_post_id", update_is_coming_soon = "case page_post_id";
            let update_is_selected = "case page_post_id", update_sort_order = "case page_post_id";

            //add or update page series data
            if (selected_posts && selected_posts.length) {
                selected_posts.forEach((e: any) => {
                    if (e.page_post_id == 0) {
                        arrInsertData.push({
                            page_id: page_id,
                            post_id: e.post_id,
                            is_locked: e.is_locked,
                            is_coming_soon: e.is_coming_soon,
                            content_type_id: content_type_id,
                            is_selected: e.is_selected,
                            sort_order: e.sort_order,
                            created_by: user_id,
                        });
                    } else {
                        isExistPagePostId.push(e.page_post_id);
                        update_is_locked += " when " + e.page_post_id + " then " + e.is_locked;
                        update_is_coming_soon += " when " + e.page_post_id + " then " + e.is_coming_soon;
                        update_is_selected += " when " + e.page_post_id + " then " + e.is_selected;
                        update_sort_order += " when " + e.page_post_id + " then " + e.sort_order;
                    }
                });
            }
            if (arrInsertData && arrInsertData.length) {
                await dbWriter.pagePosts.bulkCreate(arrInsertData);
            }
            if (isExistPagePostId && isExistPagePostId.length) {
                update_is_locked += " else is_locked end";
                update_is_coming_soon += " else is_coming_soon end";
                update_is_selected += " else is_selected end";
                update_sort_order += " else sort_order end";

                await dbWriter.pagePosts.update({
                    is_locked: dbWriter.Sequelize.literal(update_is_locked),
                    is_coming_soon: dbWriter.Sequelize.literal(update_is_coming_soon),
                    is_selected: dbWriter.Sequelize.literal(update_is_selected),
                    sort_order: dbWriter.Sequelize.literal(update_sort_order),
                    updated_by: user_id,
                }, {
                    where: { page_post_id: { [dbReader.Sequelize.Op.in]: isExistPagePostId } }
                });
            }

            new SuccessResponse(EC.errorMessage(EC.success), {
                //@ts-ignore
                token: req.token,
                data: true
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getAllPostsCategories(req: Request, res: Response) {
        try {
            let categories: any = "", arrCategory: any = [];
            let data = await dbReader.postMeta.findAll({
                where: dbReader.Sequelize.and(
                    { meta_key: "category" },
                    { meta_value: { [dbWriter.Sequelize.Op.ne]: "" } }),
                attributes: ["post_id", "meta_value"]
            });
            if (data.length) {
                data = JSON.parse(JSON.stringify(data));
                data.forEach(function (element: any, index: any) {
                    //add comma separated categories in string
                    let string = (index < data.length - 1) ? ',' : "";
                    categories += element.meta_value + string;
                });
                //remove duplicate categories from string
                arrCategory = Array.from(new Set(categories.split(',')));
            }

            new SuccessResponse(EC.errorMessage(EC.success), {
                //@ts-ignore
                token: req.token,
                categories: arrCategory
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getAllNewsFeeds(req: Request, res: Response) {
        try {
            let { page_id, category_id } = req.body, postIds: any = [];
            if (!page_id) {
                let arrPageId: any = []
                let pages = await dbReader.pages.findAll({
                    where: { is_deleted: 0, category_id: category_id },
                    attributes: ["page_id"],
                });
                pages = JSON.parse(JSON.stringify(pages));
                pages.forEach((page: any) => { arrPageId.push(page.page_id) });
                page_id = arrPageId;
            }

            let pagePosts = await dbReader.pagePosts.findAll({
                where: { is_deleted: 0, content_type_id: newsFeedContentTypeId, page_id: page_id },
                attributes: ["post_id"],
            });
            pagePosts = JSON.parse(JSON.stringify(pagePosts));
            pagePosts.forEach((post: any) => { postIds.push(post.post_id) });

            let posts = await dbReader.posts.findAll({
                where: { is_deleted: 0, post_id: postIds },
                attributes: ["post_id", "post_title", "post_image", "post_video", "post_description"],
                include: [{
                    model: dbReader.postMeta,
                    attributes: ["post_meta_id", "meta_key", "meta_value"],
                    separate: true
                }, {
                    model: dbReader.pagePosts,
                    attributes: ["page_post_id", "page_id"],
                    separate: true,
                    where: { is_deleted: 0 },
                    include: [{
                        model: dbReader.pages,
                        attributes: ["page_id", "page_title"],
                        where: { is_deleted: 0 },
                    }]
                }]
            });

            posts = JSON.parse(JSON.stringify(posts));
            posts.forEach((post: any) => {
                let pages: any = [];
                post.page_posts.forEach((page_post: any) => {
                    pages.push(page_post.page.page_title);
                });
                post.selected_pages = pages;
                delete post.page_posts;
            });

            new SuccessResponse(EC.errorMessage(EC.success), {
                //@ts-ignore
                token: req.token,
                news_feeds: posts
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async listAllNewsFeeds(req: Request, res: Response) {
        try {
            let { page_no, category, page_id } = req.body;
            let postIds: any = [], newsFeeds: any = [];
            let rowOffset = page_no ? ((page_no * 20) - 20) : 0;

            let pagePosts = await dbReader.pagePosts.findAll({
                where: { is_deleted: 0, content_type_id: newsFeedContentTypeId, page_id: page_id },
                attributes: ["post_id"],
            });
            pagePosts = JSON.parse(JSON.stringify(pagePosts));
            pagePosts.forEach((post: any) => { postIds.push(post.post_id) });

            let posts = await dbReader.posts.findAndCountAll({
                where: { is_deleted: 0, post_id: postIds, },
                attributes: ["post_id", "post_title", "post_image", "post_video", "post_description"],
                include: [{
                    model: dbReader.postMeta,
                    attributes: ["post_meta_id", "meta_key", "meta_value"],
                    separate: true
                }],
                offset: rowOffset
            });
            posts = JSON.parse(JSON.stringify(posts));
            if (category.length) {
                posts.rows.forEach((post: any) => {
                    let categories = post.post_meta.find((p: any) => p.meta_key == "category").meta_value;
                    categories = Array.from(new Set(categories.split(',')));
                    if (categories.some((c: any) => category.includes(c))) newsFeeds.push(post);
                });
            } else {
                newsFeeds = posts.rows;
            }

            new SuccessResponse(EC.errorMessage(EC.success), {
                //@ts-ignore
                token: req.token,
                count: newsFeeds.length,
                news_feeds: newsFeeds
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getAllAdminGames(req: Request, res: Response) {
        try {
            let games = await dbReader.games.findAll({
                where: { is_deleted: 0, is_system: 1, category_id: { [dbWriter.Sequelize.Op.ne]: 0 } },
                attributes: ['game_id', 'category_id', 'game_title'],
                include: [{
                    model: dbReader.attachment,
                    attributes: ['game_attachment_id', 'attachment_url'],
                    where: { parent_type: 1, attachment_type: 1, is_deleted: 0 }
                }]
            });
            if (games.length) {
                games = JSON.parse(JSON.stringify(games));
                games.forEach((element: any) => {
                    element.game_image = element.sycu_game_attachments[0].attachment_url;
                    delete element.sycu_game_attachments;
                });
            }

            new SuccessResponse(EC.errorMessage(EC.success), {
                //@ts-ignore
                token: req.token,
                games: games
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async updatePostHiddenDetails(req: Request, res: Response) {
        try {
            //@ts-ignore
            let { user_id = 0 } = req;
            let { post_id = 0, is_hidden_card = 0 } = req.body;
            if (post_id) {
                await dbWriter.posts.update({
                    is_hidden_card: is_hidden_card,
                    updated_by: user_id
                }, {
                    where: { post_id: post_id }
                });
                new SuccessResponse(EC.errorMessage(EC.successMessage), '').send(res);
            } else {
                throw new Error("Please provide card id.");
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    //Tip Videos API

    public async saveTipVideos(req: Request, res: Response) {
        try {
            //@ts-ignore
            let { user_id = 0 } = req, tipVideo: any;
            let { tip_video_id, video_title, video_url, video_cc, ministry_type, category_id } = req.body;
            let videoSlug = video_title.toLowerCase().replace(/[^A-Z0-9]+/ig, "-");

            if (tip_video_id) {
                let pageLink = await dbReader.pageLink.findAll({
                    where: dbReader.Sequelize.and(
                        { is_deleted: 0 },
                        { keyword: videoSlug },
                        { site_id: curriculumSiteId },
                        { data_id: { [dbWriter.Sequelize.Op.ne]: tip_video_id } })
                });
                let is_validate = pageLink.length ? false : true;
                if (is_validate) {
                    tipVideo = await dbWriter.tipVideos.update({
                        video_title: video_title,
                        video_url: video_url,
                        video_cc: video_cc || "",
                        updated_by: user_id,
                    }, {
                        where: { tip_video_id: tip_video_id }
                    });
                    await dbWriter.pageLink.update({ keyword: videoSlug }, {
                        where: { is_deleted: 0, data_id: tip_video_id, link_type: 4, site_id: curriculumSiteId }
                    });
                }
            } else {
                let pageLink = await dbReader.pageLink.findAll({
                    where: { is_deleted: 0, keyword: videoSlug, site_id: curriculumSiteId }
                });
                let is_validate = pageLink.length ? false : true;
                if (is_validate) {
                    tipVideo = await dbWriter.tipVideos.create({
                        category_id: category_id,
                        ministry_type: ministry_type,
                        video_title: video_title,
                        video_url: video_url,
                        video_cc: video_cc || "",
                        created_by: user_id,
                    });
                    await dbWriter.pageLink.create({
                        site_id: curriculumSiteId,
                        data_id: tipVideo.tip_video_id,
                        ui_component: "tip-videos",
                        keyword: videoSlug,
                        link_type: 4,
                    });
                }
            }

            new SuccessResponse(EC.errorMessage(EC.success), {
                //@ts-ignore
                token: req.token,
                tip_video: tipVideo
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async listAllTipVideos(req: Request, res: Response) {
        try {
            let { search, ministry_type, category_id } = req.body;
            let SearchCondition = dbReader.Sequelize.Op.ne, SearchData = null;
            if (search) {
                SearchCondition = dbReader.Sequelize.Op.like;
                SearchData = "%" + search + "%";
            }

            let tipVideos = await dbReader.tipVideos.findAll({
                where: { is_deleted: 0, category_id: category_id, ministry_type: ministry_type, video_title: { [SearchCondition]: SearchData } },
                attributes: ["tip_video_id", "video_title", "video_url", "video_cc", "created_by", "updated_by", "created_datetime", "updated_datetime"],
                include: [{
                    where: { is_deleted: 0, link_type: 4, site_id: curriculumSiteId },
                    attributes: ["keyword"],
                    model: dbReader.pageLink,
                }, {
                    attributes: ['user_id', 'display_name'],
                    model: dbReader.users,
                    as: 'created_user',
                }, {
                    attributes: ['user_id', 'display_name'],
                    model: dbReader.users,
                    as: 'updated_user',
                }]
            });
            if (tipVideos.length) {
                tipVideos = JSON.parse(JSON.stringify(tipVideos));
                tipVideos.forEach((element: any) => {
                    element.keyword = element.page_link ? element.page_link.keyword : "";
                    element.created_by = element.created_user.length ? element.created_user[0].display_name : "";
                    element.updated_by = element.updated_user.length ? element.updated_user[0].display_name : "";
                    delete element.created_user;
                    delete element.updated_user;
                    delete element.page_link;
                });
            }

            new SuccessResponse(EC.errorMessage(EC.success), {
                //@ts-ignore
                token: req.token,
                tip_videos: tipVideos
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async deleteTipVideos(req: Request, res: Response) {
        try {
            //@ts-ignore
            let { user_id = 0 } = req, tip_video_id = req.params.id;
            await dbWriter.tipVideos.update({
                is_deleted: 1,
                updated_by: user_id
            }, {
                where: { tip_video_id: tip_video_id }
            });
            new SuccessResponse(EC.errorMessage(EC.deleteDataSuccess), '').send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getTipVideosDetails(req: Request, res: Response) {
        try {
            let tip_video_id = req.params.id;
            let tipVideos = await dbReader.tipVideos.findOne({
                where: { is_deleted: 0, tip_video_id: tip_video_id },
                attributes: ["tip_video_id", "category_id", "ministry_type", "video_title", "video_url",
                    "video_cc", "created_by", "updated_by", "created_datetime", "updated_datetime"],
            });
            tipVideos = JSON.parse(JSON.stringify(tipVideos));
            new SuccessResponse(EC.errorMessage(EC.success), {
                //@ts-ignore
                token: req.token,
                tip_videos: tipVideos
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async listPostSortOrders(req: Request, res: Response) {
        try {
            let { page_id, content_type_id } = req.body;
            let pagePosts: any;
            if (content_type_id == 7) {
                pagePosts = await dbReader.pagePosts.findAll({
                    attributes: ["page_post_id", "sort_order", "post_id", [dbReader.Sequelize.literal('game_title'), 'post_title']],
                    where: { is_deleted: 0, is_selected: 1, page_id: page_id, content_type_id: content_type_id },
                    include: [{
                        attributes: [],
                        model: dbReader.games,
                        where: { is_deleted: 0 },
                    }],
                    order: [['sort_order', 'ASC']]
                });
            } else {
                pagePosts = await dbReader.pagePosts.findAll({
                    attributes: ["page_post_id", "sort_order", "post_id", [dbReader.Sequelize.literal('post_title'), 'post_title']],
                    where: { is_deleted: 0, is_selected: 1, page_id: page_id, content_type_id: content_type_id },
                    include: [{
                        attributes: [],
                        model: dbReader.posts,
                    }],
                    order: [['sort_order', 'ASC']]
                });
            }
            pagePosts = JSON.parse(JSON.stringify(pagePosts));
            new SuccessResponse(EC.errorMessage(EC.success), {
                //@ts-ignore
                token: req.token,
                posts: pagePosts
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async updatePostSortOrders(req: Request, res: Response) {
        try {
            let { sort_array = [] } = req.body;
            let arrPagePostId: any = [];
            let update_sort_order = "case page_post_id";
            if (sort_array.length) {
                sort_array.forEach((e: any) => {
                    arrPagePostId.push(e.page_post_id);
                    update_sort_order += " when " + e.page_post_id + " then " + e.sort_order;
                });
            }
            if (arrPagePostId.length) {
                update_sort_order += " else sort_order end";
                await dbWriter.pagePosts.update({
                    sort_order: dbWriter.Sequelize.literal(update_sort_order),
                }, {
                    where: { page_post_id: arrPagePostId }
                });
            }
            new SuccessResponse(EC.errorMessage(EC.success), {
                //@ts-ignore
                token: req.token,
                data: true
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    //Post folders API

    public async savePostFolders(req: Request, res: Response) {
        try {
            let post, reqBody = req.body;
            if (reqBody.post_folder_id && reqBody.post_folder_id != 0) {
                post = await dbWriter.postsFolders.update({
                    post_id: reqBody.post_id,
                    title: reqBody.title,
                    description: reqBody.description,
                    media_link: reqBody.media_link,
                    color_code: reqBody.color_code,
                    multi_media_link: JSON.stringify(reqBody.multi_media_link),
                    is_multi_media_enable: reqBody.is_multi_media_enable,
                    lesson_builder_link1: reqBody.lesson_builder_link1,
                    lesson_builder_link2: reqBody.lesson_builder_link2
                }, {
                    where: { post_folder_id: reqBody.post_folder_id }
                });
            } else {
                post = await dbWriter.postsFolders.create({
                    post_id: reqBody.post_id || 0,
                    title: reqBody.title || "",
                    description: reqBody.description || "",
                    media_link: reqBody.media_link || "",
                    color_code: reqBody.color_code || "#F2F3F5",
                    multi_media_link: JSON.stringify(reqBody.multi_media_link) || "",
                    is_multi_media_enable: reqBody.is_multi_media_enable || 0,
                    lesson_builder_link1: reqBody.lesson_builder_link1 || "",
                    lesson_builder_link2: reqBody.lesson_builder_link2 || "",
                });
            }
            new SuccessResponse(EC.errorMessage(EC.saveFolderDataSuccess), {
                //@ts-ignore
                token: req.token,
                post: post
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async deletePostFolder(req: Request, res: Response) {
        try {
            let post_folder_id = req.params.id;
            await dbWriter.postsFolders.update({
                is_deleted: 1,
            }, {
                where: { post_folder_id: post_folder_id }
            });
            new SuccessResponse(EC.errorMessage(EC.deleteDataSuccess), '').send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getPostFolders(req: Request, res: Response) {
        try {
            let post_folder_id = req.params.id;
            let data = await dbReader.postsFolders.findOne({
                where: { is_deleted: 0, post_folder_id: post_folder_id },
            });
            data = JSON.parse(JSON.stringify(data));
            if (data.multi_media_link) {
                data.multi_media_link = JSON.parse(data.multi_media_link);
            }
            new SuccessResponse(EC.errorMessage(EC.success), {
                //@ts-ignore
                token: req.token,
                tip_videos: data
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async sortPostFolders(req: Request, res: Response) {
        try {
            let { sort_array = [] } = req.body;
            let arrPostFolderId: any = [];
            let update_sort_order = "case post_folder_id";
            if (sort_array.length) {
                sort_array.forEach((e: any) => {
                    arrPostFolderId.push(e.post_folder_id);
                    update_sort_order += " when " + e.post_folder_id + " then " + e.sort_order;
                });
            }
            if (arrPostFolderId.length) {
                update_sort_order += " else sort_order end";
                await dbWriter.postsFolders.update({
                    sort_order: dbWriter.Sequelize.literal(update_sort_order),
                }, {
                    where: { post_folder_id: arrPostFolderId }
                });
            }
            new SuccessResponse(EC.errorMessage(EC.success), {
                //@ts-ignore
                token: req.token,
                data: true
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async savePostSortOrder(req: Request, res: Response) {
        try {
            let { sort_array = [] } = req.body;
            let arrPostId: any = [];
            let update_sort_order = "case page_post_id";
            if (sort_array.length) {
                let free_post_id = 0;
                sort_array.forEach((e: any) => {
                    arrPostId.push(e.page_post_id);
                    free_post_id = e.sort_order == 1 ? e.post_id : free_post_id;
                    update_sort_order += " when " + e.page_post_id + " then " + e.sort_order;
                });
                await dbWriter.postMeta.update({
                    meta_value: 0
                }, {
                    where: { meta_key: 'is_free' }
                });
                await dbWriter.postMeta.update({
                    meta_value: 1
                }, {
                    where: { meta_key: 'is_free', post_id: free_post_id }
                });
            }
            if (arrPostId.length) {
                update_sort_order += " else sort_order end";
                await dbWriter.pagePosts.update({
                    sort_order: dbWriter.Sequelize.literal(update_sort_order),
                }, {
                    where: { page_post_id: arrPostId }
                });
            }
            new SuccessResponse(EC.errorMessage(EC.success), {
                //@ts-ignore
                token: req.token,
                data: true
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
}
