import { Request, Response } from "express";
import moment from "moment";
import { ErrorController } from "../core/ErrorController";
import { enumerationController } from "../controllers/enumerationController";
import { SuccessResponse } from '../core/ApiResponse';
import { BadRequestError, ApiError } from '../core/ApiError';
const { dbReader, dbWriter } = require('../models/dbConfig');
const EnumObject = new enumerationController();
const EC = new ErrorController();
const newsFeedContentTypeId = 10;
const gamesContentTypeId = 7;
const curriculumSiteId = 2;
const freeVbsCategoryId = 8;

export class pageController {

    public recursivePageMeta(data: [], level: number) {
        let returnData: any = [];
        data.filter((s: any) => s.parent_meta_id == level).forEach((element: any) => {
            returnData.push({
                ...element,
                child_data: this.recursivePageMeta(data, element.page_meta_id),
            });
        });
        return returnData;
    }

    public async listAllPages(req: Request, res: Response) {
        try {
            let { category_id, ministry_type } = req.body, whereCondition;
            if (ministry_type) {
                whereCondition = { is_deleted: 0, category_id: category_id, ministry_type: ministry_type };
            } else {
                whereCondition = { is_deleted: 0, category_id: category_id };
            }

            let data = await dbReader.pages.findAll({
                attributes: ["page_id", "page_title", "page_description", "page_image", "page_icon", "page_link", "is_hidden", "is_published", "is_ministry_page", "ministry_type", "accessible_type", "created_by", "updated_by", "created_datetime", "updated_datetime", "sort_order"],
                where: whereCondition,
                include: [{
                    attributes: ["page_meta_id", "original_id", "parent_meta_id", "meta_key", "meta_value"],
                    separate: true,
                    model: dbReader.pageMeta,
                    where: { is_deleted: 0 },
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
            if (data.length) {
                let curObj = new pageController();
                data = JSON.parse(JSON.stringify(data));
                data.forEach((element: any) => {
                    element.accessible_type = element.accessible_type == 1 ? "Free" : "Paid";
                    element.page_meta = curObj.recursivePageMeta(element.page_meta, 0);
                    element.created_by = element.created_user.length ? element.created_user[0].display_name : "";
                    element.updated_by = element.updated_user.length ? element.updated_user[0].display_name : "";
                    delete element.created_user;
                    delete element.updated_user;
                });
            }

            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token,
                page_list: data
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getPageDetails(req: Request, res: Response) {
        try {
            //@ts-ignore
            let { user_id = 0 } = req, page_id = req.params.id;
            let sharedPages: any, is_page_shared = false, is_ministry_page = 0, share_page_content_type_data: any = [], is_having_kids = false, sharedMembershipDetail: any = [], sharedMembershipsData: any = [], ministryTypeCondition: any = [];
            let user = await dbReader.users.findOne({
                where: { user_id: user_id },
                attributes: ["user_role"]
            });
            let userMemberships = await dbReader.userMemberships.findAll({
                where: dbReader.Sequelize.and(
                    { is_deleted: 0, user_id: user_id, membership_id: { [dbReader.Sequelize.Op.ne]: 0 } },
                    dbReader.Sequelize.or(
                        dbReader.Sequelize.and({ status: [2, 4, 10, 5] }, { site_id: 2 }),
                        dbReader.Sequelize.and({ status: [2, 4, 10] }, { site_id: { [dbReader.Sequelize.Op.ne]: 2 } })
                    )
                ),
                attributes: ['membership_id', 'status',
                    [dbReader.Sequelize.literal('`sycu_membership`.`page_id`'), 'page_id'],
                    [dbReader.Sequelize.literal('`sycu_membership`.`ministry_type`'), 'ministry_type'],
                    [dbReader.Sequelize.literal('`sycu_membership`.`is_ministry_page`'), 'is_ministry_page']],
                include: [{
                    where: { is_deleted: 0, status: 1 },
                    model: dbReader.membership,
                    attributes: [],
                }]
            });
            userMemberships = JSON.parse(JSON.stringify(userMemberships));
            userMemberships.forEach((e: any) => {
                if (e.ministry_type == 1) is_having_kids = true;
            });
            if (user.user_role == 3) {
                let isFreePage = await dbReader.pages.count({
                    where: { page_id: page_id, accessible_type: 1 }
                });
                // if (!isFreePage && !userMemberships.some((m: any) => m.page_id == page_id)) {
                if (!isFreePage) {
                    sharedPages = await dbReader.sharedPages.findAll({
                        where: { is_deleted: 0, page_id: page_id, receiver_user_id: user_id },
                        attributes: ['page_id'],
                        include: [{
                            where: { is_deleted: 0 },
                            model: dbReader.sharedPagesContentTypes,
                            attributes: ['shared_page_id', 'content_type_id'],
                            separate: true
                        }, {
                            as: 'single_sender',
                            model: dbReader.users,
                            include: [{
                                separate: true,
                                model: dbReader.userMemberships,
                                where: { status: [2, 4, 5, 10], is_deleted: 0 },
                                include: [{
                                    model: dbReader.membership,
                                    where: { page_id: parseInt(page_id) }
                                }]
                            }]
                        }]
                    });
                    sharedPages = JSON.parse(JSON.stringify(sharedPages));

                    let shareAllPages = await dbReader.shareAllPages.findAll({
                        where: {
                            is_deleted: 0,
                            receiver_user_id: user_id,
                        }
                    });
                    if (shareAllPages?.length) {
                        shareAllPages = JSON.parse(JSON.stringify(shareAllPages));
                        for (let i = 0; i < shareAllPages.length; i++) {
                            if (shareAllPages[i].is_share_all_kids || shareAllPages[i].is_share_all_students || shareAllPages[i].is_share_all_groups) {
                                shareAllPages[i].is_share_all_kids ? ministryTypeCondition.push(1) : null;
                                shareAllPages[i].is_share_all_students ? ministryTypeCondition.push(2) : null;
                                shareAllPages[i].is_share_all_groups ? ministryTypeCondition.push(3) : null;
                                sharedMembershipDetail = await dbReader.userMemberships.findAll({
                                    where: dbReader.Sequelize.and({ is_deleted: 0, user_id: shareAllPages[i].sender_user_id, membership_id: { [dbReader.Sequelize.Op.ne]: 0 } }, dbReader.Sequelize.or(dbReader.Sequelize.and({ status: [2, 4, 10, 5] }, { site_id: 2 }), dbReader.Sequelize.and({ status: [2, 4, 10] }, { site_id: { [dbReader.Sequelize.Op.ne]: 2 } }))),
                                    attributes: ['membership_id', 'status',
                                        [dbReader.Sequelize.literal('`sycu_membership`.`page_id`'), 'page_id'],
                                        [dbReader.Sequelize.literal('`sycu_membership`.`ministry_type`'), 'ministry_type'],
                                        [dbReader.Sequelize.literal('`sycu_membership`.`is_ministry_page`'), 'is_ministry_page']],
                                    include: [{
                                        where: { is_deleted: 0, status: 1, ministry_type: { [dbReader.Sequelize.Op.in]: ministryTypeCondition } },
                                        model: dbReader.membership,
                                        attributes: [],
                                    }]
                                });
                                sharedMembershipDetail = JSON.parse(JSON.stringify(sharedMembershipDetail));
                                sharedMembershipDetail.forEach((e: any) => {
                                    if (e.ministry_type == 1)
                                        is_having_kids = true;
                                    sharedMembershipsData.push(e);
                                });
                            }
                        };
                    }
                    if (!userMemberships.some((m: any) => m.page_id == page_id) && sharedPages.length == 0 && !sharedMembershipsData.some((sm: any) => sm.page_id == page_id)) {
                        throw new Error(EC.errorMessage("User not authenticated."));
                    } else {
                        if (!userMemberships.some((m: any) => m.page_id == page_id) && sharedPages.length != 0) {
                            is_page_shared = true;
                            let temp_source_data_available = false
                            sharedPages.forEach((ele_s1: any) => {
                                ele_s1.sharedPageContentTypes.forEach((ele_s1: any) => {
                                    share_page_content_type_data.push(ele_s1.content_type_id)
                                });
                                if (is_ministry_page == 0 && ele_s1.single_sender && ele_s1.single_sender.sycu_user_memberships.length) {
                                    temp_source_data_available = true
                                    is_ministry_page = ele_s1.single_sender.sycu_user_memberships.find((s: any) => s.sycu_membership.page_id == page_id).sycu_membership.is_ministry_page
                                }
                            });
                            if (!temp_source_data_available) {
                                throw new Error(EC.errorMessage("User not authenticated."));
                            }
                        }
                    }
                }
            }

            let data = await dbReader.pages.findOne({
                where: { is_deleted: 0, is_published: 1, page_id: page_id },
                attributes: ["category_id", "page_title", "page_description", "page_image", "page_icon", "page_link", "is_ministry_page", "ministry_type", "accessible_type"],
                include: [{
                    separate: true,
                    model: dbReader.pageMeta,
                    where: { is_deleted: 0 },
                    attributes: ["page_meta_id", "original_id", "parent_meta_id", "meta_key", "meta_value", "sort_order", "page_id"],
                }, {
                    separate: true,
                    model: dbReader.pageSeries,
                    where: { is_deleted: 0, is_selected: 1 },
                    attributes: ["category_id", "content_type_id", "is_locked", "is_coming_soon", "sort_order"],
                    include: [{
                        model: dbReader.categories,
                        where: { is_deleted: 0, is_hidden: 0 },
                        attributes: ["category_title", "category_image", "ministry_type", "total_week"],
                        include: [{
                            separate: true,
                            model: dbReader.categoriesDetail,
                            where: { is_deleted: 0 },
                            attributes: ["categories_detail_id", "detail_key", "detail_value"],
                        }, {
                            include: [{
                                attributes: ["keyword"],
                                model: dbReader.pageLink,
                                where: { is_deleted: 0, link_type: 2, site_id: curriculumSiteId },
                            }],
                            separate: true,
                            model: dbReader.seriesEmail,
                            where: { is_deleted: 0 },
                            attributes: ["series_email_id", "series_type", "week_number"],
                        }, {
                            separate: true,
                            model: dbReader.messageBuildList,
                            where: { is_deleted: 0, is_restore: 0 },
                            attributes: ["message_build_list_id", "build_type", "series_id", "week_no"],
                        }]
                    }]
                }, {
                    separate: true,
                    model: dbReader.pagePosts,
                    attributes: ["post_id", "is_locked", "is_coming_soon", "sort_order"],
                    where: { is_deleted: 0, is_selected: 1, content_type_id: { [dbWriter.Sequelize.Op.ne]: gamesContentTypeId } },
                    include: [{
                        model: dbReader.posts,
                        where: { is_deleted: 0, is_hidden_card: 0 },
                        attributes: ["post_id", "content_type_id", "post_title", "post_description", "post_image", "post_video"],
                        include: [{
                            separate: true,
                            model: dbReader.postMeta,
                            attributes: ["post_meta_id", "post_id", "meta_key", "meta_value"],
                        }, {
                            separate: true,
                            model: dbReader.postsFolders,
                            where: { is_deleted: 0 },
                            order: [['sort_order', 'ASC']]
                        }]
                    }],
                    order: [['sort_order', 'ASC']]
                }]
            });
            if (data) {
                let curObj = new pageController();
                data = JSON.parse(JSON.stringify(data));
                data.is_having_kids = is_having_kids;
                if (user.user_role != 3) {
                    data.is_having_ministry = 1;
                } else {
                    if (userMemberships.some((e: any) => e.page_id == page_id) || sharedMembershipsData.some((sm: any) => sm.page_id == page_id) || is_page_shared) {
                        if (userMemberships.some((e: any) => e.page_id == page_id && e.status == 2) || sharedMembershipsData.some((e: any) => e.page_id == page_id && e.status == 2) || is_page_shared) {
                            data.is_having_ministry = userMemberships.find((e: any) => e.page_id == page_id && e.status == 2)?.is_ministry_page || sharedMembershipsData.find((e: any) => e.page_id == page_id && e.status == 2)?.is_ministry_page || is_ministry_page;
                        } else {
                            data.is_having_ministry = userMemberships.find((e: any) => e.page_id == page_id)?.is_ministry_page;
                        }
                    }
                }

                data.is_page_shared = is_page_shared ? 1 : 0;
                data.page_meta = curObj.recursivePageMeta(data.page_meta, 0);
                if (data.page_posts.length) {
                    data.page_posts.map(function (element: any) {
                        if (element.post != null) {
                            element.post.is_locked = element.is_locked;
                            element.post.is_coming_soon = element.is_coming_soon;
                            element.post.post_video = element.post.post_video ? element.post.post_video : "";
                            delete element.post_id;
                            delete element.is_locked;
                            delete element.is_coming_soon;
                        }
                    });
                }
                if (data.page_series.length) {
                    data.page_series.forEach((element: any) => {
                        if (element.sycu_category) {
                            element.sycu_category.categories_details.map(function (e: any) {
                                e.detail_value = ((e.detail_key == "lesson_builder" || e.detail_key == "notes") && e.detail_value != "") ? JSON.parse(e.detail_value) : e.detail_value;
                            });
                            element.sycu_category.series_emails.map(function (e: any) {
                                e.keyword = e.page_link.keyword;
                                delete e.page_link;
                            });
                        }
                    });
                }
                if (!is_page_shared) {
                    let pct = data.page_meta.filter((e: any) => e.meta_key == "content_type")
                    // if (data.category_id == 256) {
                    pct.forEach((pct_ele: any) => {
                        pct_ele.is_ministry_enable = 0
                        if (pct_ele.child_data.some((e: any) => e.meta_key == "is_ministry_enable" && e.parent_meta_id == pct_ele.page_meta_id)) {
                            pct_ele.is_ministry_enable = pct_ele.child_data.find((e: any) => e.meta_key == "is_ministry_enable" && e.parent_meta_id == pct_ele.page_meta_id).meta_value
                        }
                    });
                    // }
                    data.content_type_page_meta = pct
                } else {
                    let pct = data.page_meta.filter((e: any) => e.meta_key == "content_type" && share_page_content_type_data.some((s: any) => s == e.original_id))
                    // if (data.category_id == 256) {
                    pct.forEach((pct_ele: any) => {
                        pct_ele.is_ministry_enable = 0
                        if (pct_ele.child_data.some((e: any) => e.meta_key == "is_ministry_enable" && e.parent_meta_id == pct_ele.page_meta_id)) {
                            pct_ele.is_ministry_enable = pct_ele.child_data.find((e: any) => e.meta_key == "is_ministry_enable" && e.parent_meta_id == pct_ele.page_meta_id).meta_value
                        }
                    });
                    // }
                    data.content_type_page_meta = pct
                }

                let contentTypeId = data.content_type_page_meta.map((s: any) => s.original_id);
                let contentTypesData = await dbReader.contentTypes.findAll({
                    where: { content_type_id: contentTypeId },
                    attributes: ["content_type_id", "content_type_title"],
                });
                contentTypesData = JSON.parse(JSON.stringify(contentTypesData));

                let games = await dbReader.pagePosts.findAll({
                    where: { page_id: page_id, content_type_id: gamesContentTypeId, is_selected: 1, is_deleted: 0 },
                    attributes: ["post_id", "is_locked", "is_coming_soon", "sort_order"],
                    include: [{
                        model: dbReader.games,
                        attributes: ["game_id", "game_title", "game_description"],
                        where: { is_deleted: 0 },
                        include: [{
                            model: dbReader.attachment,
                            attributes: ['game_attachment_id', 'attachment_url'],
                            where: { parent_type: 1, attachment_type: 1, is_deleted: 0 }
                        }, {
                            required: false,
                            where: { is_deleted: 0, link_type: 3, site_id: 4 },
                            attributes: ["keyword"],
                            model: dbReader.pageLink,
                        }]
                    }]
                });
                if (games.length) {
                    games = JSON.parse(JSON.stringify(games));
                    games.map(function (element: any) {
                        element.post_id = element.sycu_game_game.game_id;
                        element.content_type_id = gamesContentTypeId;
                        element.post_title = element.sycu_game_game.game_title;
                        element.post_description = element.sycu_game_game.game_description;
                        element.post_image = element.sycu_game_game.sycu_game_attachments[0].attachment_url;
                        element.keyword = element.sycu_game_game.page_link != null ? element.sycu_game_game.page_link.keyword : "";
                        element.post_meta = [];
                        delete element.sycu_game_game;
                    });
                }

                //change content type page meta values and attributes
                data.content_type_page_meta.map(function (element: any) {
                    let _t = (contentTypesData.some((s: any) => s.content_type_id == element.original_id)) ? contentTypesData.find((s: any) => s.content_type_id == element.original_id) : null;
                    element.content_type_title = _t.content_type_title;
                    element.content_type_id = _t.content_type_id;
                    let _p = (data.page_posts.some((s: any) => s.post.content_type_id == element.original_id)) ? data.page_posts.filter((s: any) => s.post.content_type_id == element.original_id) : [];
                    element.page_posts = (element.content_type_id == newsFeedContentTypeId || element.content_type_id == gamesContentTypeId) ? [] : _p;
                    if (element.content_type_id == gamesContentTypeId) {
                        element.page_games = games
                    }
                    let _s = (data.page_series.some((s: any) => s.content_type_id == element.original_id)) ? data.page_series.filter((s: any) => s.content_type_id == element.original_id) : [];
                    element.page_series = _s;
                    element.child_data.map(function (e: any) {
                        e.child_data.length ? [] : delete e.child_data;
                        delete e.original_id;
                        delete e.page_meta_id;
                        delete e.parent_meta_id;
                    });
                    // Daksh Update Code 2023-05-18
                    // Ticket : https://portal.brogrammersagency.com/tasks/details/b05bedd0-79a3-44a7-b059-90fc46809fdc#slack-thread-section
                    if (data.category_id == 256 || data.category_id == 341) {
                        element.page_posts.forEach((gu: any) => {
                            if (data.is_having_ministry == 0) {
                                if (element.is_ministry_enable == 0) {
                                    let dl_index = (gu.post) ? gu.post.post_meta.findIndex((m: any) => m.meta_key == "download_link") : -1
                                    let pl_index = (gu.post) ? gu.post.post_meta.findIndex((m: any) => m.meta_key == "preview_link") : -1
                                    if (dl_index >= 0) {
                                        gu.post.post_meta[dl_index].meta_value = ''
                                    }
                                    if (pl_index >= 0) {
                                        gu.post.post_meta[pl_index].meta_value = ''
                                    }
                                } else {
                                    let dl_index = (gu.post) ? gu.post.post_meta.findIndex((m: any) => m.meta_key == "release_time") : -1
                                    if (dl_index >= 0 && gu.post.post_meta[dl_index].meta_value != '') {
                                        let dl_index = (gu.post) ? gu.post.post_meta.findIndex((m: any) => m.meta_key == "download_link") : -1
                                        let pl_index = (gu.post) ? gu.post.post_meta.findIndex((m: any) => m.meta_key == "preview_link") : -1
                                        if (dl_index >= 0) {
                                            gu.post.post_meta[dl_index].meta_value = ''
                                        }
                                        if (pl_index >= 0) {
                                            gu.post.post_meta[pl_index].meta_value = ''
                                        }
                                    }
                                }
                            } else {
                                let dl_index = (gu.post) ? gu.post.post_meta.findIndex((m: any) => m.meta_key == "release_time") : -1
                                if (dl_index >= 0 && gu.post.post_meta[dl_index].meta_value != '') {
                                    let dl_index = gu.post.post_meta.findIndex((m: any) => m.meta_key == "download_link")
                                    let pl_index = gu.post.post_meta.findIndex((m: any) => m.meta_key == "preview_link")
                                    if (dl_index >= 0) {
                                        gu.post.post_meta[dl_index].meta_value = ''
                                    }
                                    if (pl_index >= 0) {
                                        gu.post.post_meta[pl_index].meta_value = ''
                                    }
                                }
                            }
                        });
                        element.page_series.forEach((gu: any) => {
                            if (data.is_having_ministry == 0) {
                                if (element.is_ministry_enable == 0) {
                                    let dl_index = (gu.post) ? gu.sycu_category.categories_details.findIndex((m: any) => m.detail_key == "download_link") : -1
                                    let pl_index = (gu.post) ? gu.sycu_category.categories_details.findIndex((m: any) => m.detail_key == "preview_link") : -1
                                    if (dl_index >= 0) {
                                        gu.sycu_category.categories_details[dl_index].detail_value = ''
                                    }
                                    if (pl_index >= 0) {
                                        gu.sycu_category.categories_details[pl_index].detail_value = ''
                                    }
                                } else {
                                    let dl_index = (gu.post) ? gu.sycu_category.categories_details.findIndex((m: any) => m.detail_key == "release_time") : -1
                                    if (dl_index >= 0 && gu.sycu_category.categories_details[dl_index].detail_value != '') {
                                        let dl_index = (gu.post) ? gu.sycu_category.categories_details.findIndex((m: any) => m.detail_key == "download_link") : -1
                                        let pl_index = (gu.post) ? gu.sycu_category.categories_details.findIndex((m: any) => m.detail_key == "preview_link") : -1
                                        if (dl_index >= 0) {
                                            gu.sycu_category.categories_details[dl_index].detail_value = ''
                                        }
                                        if (pl_index >= 0) {
                                            gu.sycu_category.categories_details[pl_index].detail_value = ''
                                        }
                                    }
                                }
                            } else {
                                let dl_index = (gu.post) ? gu.sycu_category.categories_details.findIndex((m: any) => m.detail_key == "release_time") : -1
                                if (dl_index >= 0 && gu.sycu_category.categories_details[dl_index].detail_value != '') {
                                    let dl_index = gu.sycu_category.categories_details.findIndex((m: any) => m.detail_key == "download_link")
                                    let pl_index = gu.sycu_category.categories_details.findIndex((m: any) => m.detail_key == "preview_link")
                                    if (dl_index >= 0) {
                                        gu.sycu_category.categories_details[dl_index].detail_value = ''
                                    }
                                    if (pl_index >= 0) {
                                        gu.sycu_category.categories_details[pl_index].detail_value = ''
                                    }
                                }
                            }
                        });
                    } else if (data.category_id == 7) {
                        element.page_series.forEach((gu: any) => {
                            let dl_rt_index = (gu.sycu_category) ? gu.sycu_category.categories_details.findIndex((m: any) => m.detail_key == "release_time") : -1
                            if ((dl_rt_index >= 0 && gu.sycu_category.categories_details[dl_rt_index].detail_value != '') || gu.is_locked == 1) {
                                let dl_index = (gu.sycu_category) ? gu.sycu_category.categories_details.findIndex((m: any) => m.detail_key == "download_link") : -1
                                let pl_index = (gu.sycu_category) ? gu.sycu_category.categories_details.findIndex((m: any) => m.detail_key == "preview_link") : -1
                                if (dl_index >= 0) {
                                    gu.sycu_category.categories_details[dl_index].detail_value = ''
                                }
                                if (pl_index >= 0) {
                                    gu.sycu_category.categories_details[pl_index].detail_value = ''
                                }
                            }
                        })
                    }
                    delete element.original_id
                    delete element.page_meta_id;
                    delete element.parent_meta_id;
                    delete element.meta_key;
                    delete element.meta_value;
                });
                if (user.user_role == 3 && (data.category_id == 256 || data.category_id == 341) && data.is_ministry_page == 1 && !data.is_having_ministry) {
                    data.content_type_page_meta = data.content_type_page_meta.filter((f: any) => f.is_ministry_enable == 1)
                }

                //remove page_meta attribute from data
                delete data.page_meta;
                delete data.page_id;
                delete data.page_posts;
                delete data.page_series;

                new SuccessResponse(EC.errorMessage(EC.success), {
                    //@ts-ignore
                    token: req.token,
                    page: data
                }).send(res);
            } else {
                throw new Error(EC.errorMessage("Page not found."));
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getPageDetailsForAdmin(req: Request, res: Response) {
        try {
            let pageId = req.params.id;
            let data = await dbReader.pages.findOne({
                where: { page_id: pageId },
                attributes: ["page_id", "page_title", "page_slug", "page_description", "page_image", "page_icon",
                    "page_link", "is_published", "is_ministry_page", "ministry_type", "accessible_type",
                    "publish_datetime", "created_datetime", "updated_datetime", "created_by", "updated_by", "is_hidden"],
                include: [{
                    separate: true,
                    model: dbReader.pageMeta,
                    where: { is_deleted: 0, meta_key: { [dbReader.Sequelize.Op.notIn]: ["dropbox_link"] } },
                    attributes: ["page_meta_id", "original_id", "parent_meta_id", "meta_key", "meta_value", "sort_order"],
                }, {
                    as: 'created_user',
                    model: dbReader.users,
                    attributes: ["display_name"],
                }]
            });
            if (data) {
                let curObj = new pageController();
                data = JSON.parse(JSON.stringify(data));
                data.sycu_user = data.created_user.length ? data.created_user[0].display_name : "";
                data.page_meta = curObj.recursivePageMeta(data.page_meta, 0);
                data.page_meta.map(function (e: any) {
                    e.child_data.map(function (s: any) {
                        s.child_data.length ? [] : delete s.child_data;
                    });
                });
                delete data.created_user;
            }
            new SuccessResponse(EC.errorMessage(EC.success), {
                //@ts-ignore
                token: req.token,
                page: data
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async savePage(req: Request, res: Response) {
        try {
            //@ts-ignore
            let { user_id = 0 } = req;
            let page: { page_id: any; }, reqBody = req.body, vbs_sort_order = 0;
            let pageSlug = reqBody.page_title.toLowerCase().replace(/[^A-Z0-9]+/ig, "-");

            if (reqBody.page_id) {
                let pageLink = await dbReader.pageLink.findAll({
                    where: dbReader.Sequelize.and(
                        { is_deleted: 0 },
                        { keyword: pageSlug },
                        { site_id: curriculumSiteId },
                        { data_id: { [dbWriter.Sequelize.Op.ne]: reqBody.page_id } })
                });
                let is_validate = pageLink.length ? false : true;
                if (is_validate) {
                    page = await dbWriter.pages.update({
                        category_id: reqBody.category_id,
                        ministry_type: reqBody.ministry_type,
                        page_title: reqBody.page_title,
                        page_description: reqBody.page_description || "",
                        page_image: reqBody.page_image || "",
                        page_icon: reqBody.page_icon || "",
                        page_link: reqBody.page_link || "",
                        accessible_type: reqBody.accessible_type,
                        is_ministry_page: reqBody.is_ministry_page,
                        page_slug: pageSlug,
                        updated_by: user_id,
                    }, {
                        where: { page_id: reqBody.page_id }
                    });

                    let pageLink = await dbReader.pageLink.findAll({
                        where: { is_deleted: 0, data_id: reqBody.page_id, link_type: 1, site_id: curriculumSiteId }
                    });
                    let is_validate = pageLink.length ? true : false;
                    if (is_validate) {
                        await dbWriter.pageLink.update({ keyword: pageSlug }, {
                            where: { is_deleted: 0, data_id: reqBody.page_id, link_type: 1, site_id: curriculumSiteId }
                        });
                    } else {
                        await dbWriter.pageLink.create({
                            site_id: curriculumSiteId,
                            data_id: reqBody.page_id,
                            ui_component: "page",
                            keyword: pageSlug,
                            link_type: 1,
                        });
                    }
                } else {
                    throw new Error(EC.errorMessage("Page is already exists with given page title. Please provide another page title."));
                }
            } else {
                let pageLink = await dbReader.pageLink.findAll({
                    where: { is_deleted: 0, keyword: pageSlug, site_id: curriculumSiteId }
                });
                let is_validate = pageLink.length ? false : true;
                if (is_validate) {
                    if (reqBody.ministry_type == 4) {
                        let sortOrderData = await dbReader.pages.findAll({
                            attributes: [[dbReader.Sequelize.fn("MAX", dbReader.Sequelize.col("sort_order")), "sort_order"]],
                            where: { ministry_type: 4 }
                        });
                        sortOrderData = JSON.parse(JSON.stringify(sortOrderData));
                        vbs_sort_order = sortOrderData[0].sort_order;
                        vbs_sort_order = vbs_sort_order + 1;
                    }

                    page = await dbWriter.pages.create({
                        category_id: reqBody.category_id,
                        ministry_type: reqBody.ministry_type,
                        page_title: reqBody.page_title,
                        page_description: reqBody.page_description || "",
                        page_image: reqBody.page_image || "",
                        page_icon: reqBody.page_icon || "",
                        page_link: reqBody.page_link || "",
                        accessible_type: reqBody.accessible_type,
                        is_ministry_page: reqBody.is_ministry_page,
                        page_slug: pageSlug,
                        created_by: user_id,
                        is_published: 0,
                        sort_order: vbs_sort_order,
                        is_hidden: reqBody.ministry_type == 4 ? 1 : 0,
                    });
                    await dbWriter.pageLink.create({
                        site_id: curriculumSiteId,
                        data_id: page.page_id,
                        ui_component: "page",
                        keyword: pageSlug,
                        link_type: 1,
                    });
                } else {
                    throw new Error(EC.errorMessage("Page is already exists with given page title. Please provide another page title."));
                }
            }

            let pageId = reqBody.page_id ? reqBody.page_id : page.page_id;
            if (reqBody.page_meta && reqBody.page_meta.length > 0) {
                let pageMeta: any = [], originalId: any = [], sort_order = 0;
                let isExistPageMetaId: any = [], contentTypeId: any = [];
                let meta_value = "case page_meta_id";

                reqBody.page_meta.forEach((element: any) => { originalId.push(element.original_id) });
                reqBody.page_meta.forEach((element: any) => {
                    if (element.page_meta_id == 0 && element.meta_key == "content_type") {
                        contentTypeId.push(element.original_id);
                        sort_order = sort_order + 1
                        pageMeta.push({
                            page_id: pageId,
                            original_id: element.original_id,
                            parent_meta_id: 0,
                            meta_key: "content_type",
                            meta_value: "",
                            sort_order: sort_order,
                            created_by: user_id,
                        });
                    } else {
                        isExistPageMetaId.push(element.page_meta_id);
                        meta_value += " when " + element.page_meta_id + " then " + JSON.stringify(element.meta_value);
                    }
                    if (element.child_data && element.child_data.length) {
                        element.child_data.forEach((e: any) => {
                            if (e.page_meta_id != 0) {
                                isExistPageMetaId.push(e.page_meta_id);
                                meta_value += " when " + e.page_meta_id + " then " + JSON.stringify(e.meta_value);
                            }
                        });
                    }
                });

                if (isExistPageMetaId && isExistPageMetaId.length) {
                    meta_value += " else meta_value end";
                    await dbWriter.pageMeta.update({
                        meta_value: dbWriter.Sequelize.literal(meta_value),
                        updated_by: user_id,
                    }, {
                        where: { page_meta_id: { [dbReader.Sequelize.Op.in]: isExistPageMetaId } }
                    });
                }

                if (pageMeta && pageMeta.length) {
                    let pageMetaNew = await dbWriter.pageMeta.bulkCreate(pageMeta);
                    pageMeta = [];
                    let contentMeta = await dbReader.contentMeta.findAll({
                        where: { content_type_id: contentTypeId }
                    });
                    contentMeta = JSON.parse(JSON.stringify(contentMeta));
                    contentMeta.forEach((element: any) => {
                        if (pageMetaNew.some((e: any) => e.original_id == element.content_type_id)) {
                            pageMeta.push({
                                page_id: pageId,
                                original_id: element.content_meta_id,
                                parent_meta_id: pageMetaNew.find((e: any) => e.original_id == element.content_type_id).page_meta_id,
                                meta_key: element.meta_key,
                                meta_value: element.meta_value,
                                created_by: user_id,
                            });
                        }
                    });
                    if (pageMeta && pageMeta.length) {
                        await dbWriter.pageMeta.bulkCreate(pageMeta);
                    }
                }

                let pageMetaData = await dbReader.pageMeta.findAll({
                    where: { is_deleted: 0, page_id: pageId }
                });
                pageMetaData = JSON.parse(JSON.stringify(pageMetaData));
                let parentPageMetaData = pageMetaData.filter((e: any) => e.parent_meta_id == 0);

                //delete unselected page meta
                let deletePageMeta: any = [];
                parentPageMetaData.forEach((element: any) => {
                    if (!(originalId.some((e: any) => e == element.original_id))) {
                        deletePageMeta.push(element.page_meta_id);
                    }
                });
                if (deletePageMeta.length) {
                    await dbWriter.pageMeta.update({
                        is_deleted: 1,
                        updated_by: user_id,
                    }, {
                        where: dbReader.Sequelize.or(
                            { page_meta_id: { [dbReader.Sequelize.Op.in]: deletePageMeta } },
                            { parent_meta_id: { [dbReader.Sequelize.Op.in]: deletePageMeta } },
                        ),
                    })
                }

                //add new content meta in page meta
                pageMeta = [];
                pageMetaData = await dbReader.pageMeta.findAll({
                    where: { is_deleted: 0, page_id: pageId }
                });
                pageMetaData = JSON.parse(JSON.stringify(pageMetaData));
                parentPageMetaData = pageMetaData.filter((e: any) => e.parent_meta_id == 0);
                pageMetaData = pageMetaData.filter((e: any) => e.parent_meta_id != 0);

                //check new content meta exists in page meta or not
                let contentMetaData = await dbReader.contentMeta.findAll({
                    where: { content_type_id: originalId }
                });
                contentMetaData = JSON.parse(JSON.stringify(contentMetaData));
                contentMetaData.forEach((element: any) => {
                    if (!(pageMetaData.some((e: any) => e.original_id == element.content_meta_id))) {
                        let parent_meta_id = parentPageMetaData.find((e: any) => e.original_id == element.content_type_id).page_meta_id;
                        pageMeta.push({
                            page_id: pageId,
                            original_id: element.content_meta_id,
                            parent_meta_id: parent_meta_id,
                            meta_key: element.meta_key,
                            meta_value: element.meta_value,
                            created_by: user_id,
                        });
                    }
                });
                if (pageMeta && pageMeta.length) {
                    await dbWriter.pageMeta.bulkCreate(pageMeta);
                }
            } else {
                //delete unselected page meta
                let deletePageMeta: any = [];
                let pageMeta = await dbReader.pageMeta.findAll({
                    where: { is_deleted: 0, page_id: pageId }
                });
                pageMeta.forEach((element: any) => { deletePageMeta.push(element.page_meta_id) });
                if (deletePageMeta.length) {
                    await dbWriter.pageMeta.update({
                        is_deleted: 1,
                        update_by: user_id
                    }, {
                        where: dbReader.Sequelize.or(
                            { page_meta_id: { [dbReader.Sequelize.Op.in]: deletePageMeta } },
                            { parent_meta_id: { [dbReader.Sequelize.Op.in]: deletePageMeta } },
                        ),
                    });
                }
            }

            new SuccessResponse(EC.errorMessage(EC.success), {
                //@ts-ignore
                token: req.token,
                page: true
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async deletePage(req: Request, res: Response) {
        try {
            //@ts-ignore
            let { user_id = 0 } = req, pageId = req.params.id;
            await dbWriter.pages.update({ is_deleted: 1, updated_by: user_id }, { where: { page_id: pageId } });
            await dbWriter.pageMeta.update({ is_deleted: 1, updated_by: user_id }, { where: { page_id: pageId } });
            await dbWriter.pagePosts.update({ is_deleted: 1, updated_by: user_id }, { where: { page_id: pageId } });
            await dbWriter.pageSeries.update({ is_deleted: 1, updated_by: user_id }, { where: { page_id: pageId } });
            await dbWriter.pageLink.update({ is_deleted: 1 }, { where: { data_id: pageId, link_type: 1, site_id: curriculumSiteId } });
            new SuccessResponse(EC.errorMessage(EC.deleteDataSuccess), '').send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getAllPages(req: Request, res: Response) {
        try {
            let data = await dbReader.pages.findAll({
                where: { is_deleted: 0, is_published: 1, accessible_type: 2 },
                attributes: ["page_id", "page_title"],
            }); data = JSON.parse(JSON.stringify(data));
            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token,
                pages: data
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async publishPage(req: Request, res: Response) {
        try {
            //@ts-ignore
            let { user_id = 0 } = req;
            let { page_id, is_publish } = req.body, page;
            let is_published = is_publish == true || is_publish == 1 ? 1 : 0;

            page = await dbWriter.pages.update({
                updated_by: user_id,
                is_published: is_published,
                publish_datetime: moment().unix(),
            }, {
                where: { page_id: page_id }
            });

            new SuccessResponse(EC.errorMessage(((is_published) ? (EC.publishPageSuccess) : (EC.unpublishPageSuccess))), {
                //@ts-ignore
                token: req.token,
                page: page
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async duplicatePage(req: Request, res: Response) {
        try {
            //@ts-ignore
            let { user_id = 0 } = req;
            let pageId = req.params.id;
            let page = await dbReader.pages.findOne({
                where: { is_deleted: 0, is_published: 1, page_id: pageId },
                include: [{
                    where: { is_deleted: 0 },
                    attributes: ["page_meta_id", "page_id", "original_id", "parent_meta_id", "meta_key", "meta_value", "sort_order"],
                    model: dbReader.pageMeta,
                    separate: true,
                }, {
                    where: { is_deleted: 0 },
                    attributes: ["page_series_id", "category_id", "content_type_id", "is_locked", "is_coming_soon", "is_selected", "sort_order"],
                    model: dbReader.pageSeries,
                    separate: true
                }, {
                    where: { is_deleted: 0 },
                    attributes: ["page_post_id", "post_id", "content_type_id", "is_locked", "is_coming_soon", "is_selected", "sort_order"],
                    model: dbReader.pagePosts,
                    separate: true
                }]
            });

            if (page) {
                page = JSON.parse(JSON.stringify(page));
                let newPage = await dbWriter.pages.create({
                    category_id: page.category_id,
                    ministry_type: page.ministry_type,
                    page_title: page.page_title + "(copy)",
                    page_description: page.page_description,
                    page_image: page.page_image,
                    page_icon: page.page_icon,
                    page_link: page.page_link,
                    page_slug: page.page_slug + "(copy)",
                    is_published: page.is_published,
                    is_ministry_page: page.is_ministry_page,
                    accessible_type: page.accessible_type,
                    publish_datetime: page.publish_datetime,
                    parent_page_id: page.page_id,
                    created_by: user_id,
                    is_deleted: 0,
                });

                let newPageId = newPage.page_id;
                if (page.page_meta.length > 0) {
                    let pageMeta: any = [], parentPageMeta: any = [];
                    page.page_meta.forEach((element: any) => {
                        if (element.parent_meta_id == 0) {
                            parentPageMeta.push({
                                page_id: newPageId,
                                original_id: element.original_id,
                                parent_meta_id: element.parent_meta_id,
                                meta_key: element.meta_key,
                                meta_value: element.meta_value,
                                sort_order: element.sort_order,
                                parent_page_meta_id: element.page_meta_id,
                                created_by: user_id,
                            });
                        } else {
                            pageMeta.push({
                                page_id: newPageId,
                                original_id: element.original_id,
                                parent_meta_id: element.parent_meta_id,
                                meta_key: element.meta_key,
                                meta_value: element.meta_value,
                                sort_order: element.sort_order,
                                parent_page_meta_id: element.page_meta_id,
                                created_by: user_id,
                            });
                        }
                    });
                    if (parentPageMeta.length) {
                        let newParentPageMeta = await dbWriter.pageMeta.bulkCreate(parentPageMeta);
                        pageMeta.forEach((element: any) => {
                            if (newParentPageMeta.some((s: any) => s.parent_page_meta_id == element.parent_meta_id)) {
                                element.parent_meta_id = newParentPageMeta.find((e: any) => e.parent_page_meta_id == element.parent_meta_id).page_meta_id;
                            }
                        });
                        if (pageMeta.length) {
                            await dbWriter.pageMeta.bulkCreate(pageMeta);
                        }
                    }
                }

                if (page.page_posts.length > 0) {
                    let arrPagePosts: any = [];
                    page.page_posts.forEach((element: any) => {
                        arrPagePosts.push({
                            page_id: newPageId,
                            post_id: element.post_id,
                            content_type_id: element.content_type_id,
                            is_locked: element.is_locked,
                            is_coming_soon: element.is_coming_soon,
                            is_selected: element.is_selected,
                            sort_order: element.sort_order,
                            created_by: user_id,
                        });
                    });
                    if (arrPagePosts.length) {
                        await dbWriter.pagePosts.bulkCreate(arrPagePosts);
                    }
                }

                if (page.page_series.length > 0) {
                    let arrPageSeries: any = [];
                    page.page_series.forEach((element: any) => {
                        arrPageSeries.push({
                            page_id: newPageId,
                            category_id: element.category_id,
                            content_type_id: element.content_type_id,
                            is_locked: element.is_locked,
                            is_coming_soon: element.is_coming_soon,
                            is_selected: element.is_selected,
                            sort_order: element.sort_order,
                            created_by: user_id,
                        });
                    });
                    if (arrPageSeries.length) {
                        await dbWriter.pageSeries.bulkCreate(arrPageSeries);
                    }
                }

                new SuccessResponse(EC.errorMessage(EC.success), {
                    //@ts-ignore
                    token: req.token,
                    page: newPage
                }).send(res);
            } else {
                throw new Error("Page not found.");
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async savePageEditor(req: Request, res: Response) {
        try {
            //@ts-ignore
            let { user_id = 0 } = req;
            let { page_id, child_data = [] } = req.body;
            if (child_data.length > 0) {
                let meta_value = "case page_meta_id";
                let isExistPageMetaId: any = [];
                let addPageMetas: any = [];

                child_data.forEach((element: any) => {
                    if (element.page_meta_id != 0) {
                        isExistPageMetaId.push(element.page_meta_id);
                        meta_value += " when " + element.page_meta_id + " then " + JSON.stringify(element.meta_value);
                    } else {
                        addPageMetas.push({
                            "page_id": page_id,
                            "original_id": element.original_id,
                            "parent_meta_id": element.parent_meta_id,
                            "meta_key": element.meta_key,
                            "meta_value": element.meta_value,
                            "sort_order": element.sort_order
                        });
                    }
                });
                if (isExistPageMetaId && isExistPageMetaId.length) {
                    meta_value += " else meta_value end";
                    await dbWriter.pageMeta.update({
                        meta_value: dbWriter.Sequelize.literal(meta_value),
                        updated_by: user_id,
                    }, {
                        where: { page_meta_id: { [dbReader.Sequelize.Op.in]: isExistPageMetaId } }
                    });
                }
                if (addPageMetas.length) {
                    await dbWriter.pageMeta.bulkCreate(addPageMetas);
                }
            }
            new SuccessResponse(EC.errorMessage(EC.success), {
                //@ts-ignore
                token: req.token,
                page: true
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getAllFreeVbsPages(req: Request, res: Response) {
        try {
            let data = await dbReader.pages.findAll({
                where: { is_hidden: 1, is_deleted: 0, is_published: 1, ministry_type: 4 },
                attributes: ["page_id", "ministry_type", "page_title", "page_description", "page_image", "page_icon", "page_link", "created_datetime", "updated_datetime", "created_by", "updated_by", "sort_order"],
                include: [{
                    where: { is_deleted: 0 },
                    attributes: ["page_meta_id", "original_id", "parent_meta_id", "meta_key", "meta_value", "sort_order"],
                    separate: true,
                    model: dbReader.pageMeta,
                }, {
                    where: { is_deleted: 0, is_selected: 1 },
                    attributes: ["post_id", "is_locked", "is_coming_soon", "sort_order"],
                    separate: true,
                    model: dbReader.pagePosts,
                    order: [['sort_order', 'ASC']],
                    include: [{
                        include: [{
                            attributes: ["post_meta_id", "post_id", "meta_key", "meta_value"],
                            separate: true,
                            model: dbReader.postMeta
                        }],
                        attributes: ["post_id", "content_type_id", "post_title", "post_description", "post_image", "post_video"],
                        model: dbReader.posts
                    }]
                }, {
                    required: true,
                    model: dbReader.pageSeries,
                    attributes: ["page_series_id", "category_id"],
                    where: { is_selected: 1, is_deleted: 0 },
                }],
                order: [['sort_order', 'ASC']]
            });
            data = JSON.parse(JSON.stringify(data));
            let categories = await dbReader.categories.findAll({
                where: { is_deleted: 0, parent_category_id: freeVbsCategoryId, category_level: 1 },
                include: [{
                    separate: true,
                    model: dbReader.categoriesDetail,
                    where: { is_deleted: 0 },
                }, {
                    attributes: ["message_build_list_id", "build_type", "series_id", "week_no"],
                    separate: true,
                    model: dbReader.messageBuildList,
                    where: { is_deleted: 0, is_restore: 0 },
                }]
            });
            categories = JSON.parse(JSON.stringify(categories));
            data.forEach((element: any) => {
                if (element.page_id) {
                    element.series = categories.find((c: any) => c.category_id == element.page_series[0].category_id);
                    element.message_buildlists = element.series ? element.series.message_buildlists : [];
                    element.category_id = element.series ? element.series.category_id : null;
                    delete element.series;
                }
            });
            // data.forEach((element: any) => {
            //     //On The Case free vbs page id is 22
            //     if (element.page_id == 22) {
            //         //On The Case series id is 236
            //         element.series = categories.find((c: any) => c.category_id == 236);
            //         element.message_buildlists = element.series ? element.series.message_buildlists : [];
            //         element.category_id = element.series ? element.series.category_id : null;
            //         delete element.series;
            //     }
            //     //"I Wonder free vbs page id is 23
            //     if (element.page_id == 23) {
            //         //"I Wonder series id is 237
            //         element.series = categories.find((c: any) => c.category_id == 237);
            //         element.message_buildlists = element.series ? element.series.message_buildlists : [];
            //         element.category_id = element.series ? element.series.category_id : null;
            //         delete element.series;
            //     }
            //     //Mission Deep Sea free vbs page id is 24
            //     if (element.page_id == 24) {
            //         //Mission Deep Sea series id is 238
            //         element.series = categories.find((c: any) => c.category_id == 238);
            //         element.message_buildlists = element.series ? element.series.message_buildlists : [];
            //         element.category_id = element.series ? element.series.category_id : null;
            //         delete element.series;
            //     }
            //     //Wild Life free vbs page id is 44
            //     if (element.page_id == 44) {
            //         //Wild Life series id is 257
            //         element.series = categories.find((c: any) => c.category_id == 257);
            //         element.message_buildlists = element.series ? element.series.message_buildlists : [];
            //         element.category_id = element.series ? element.series.category_id : null;
            //         delete element.series;
            //     }
            // });
            new SuccessResponse(EC.errorMessage(EC.success), {
                //@ts-ignore
                token: req.token,
                pages: data
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getPageConnectedSeries(req: Request, res: Response) {
        try {
            let { page_id, content_type_id } = req.body;
            let pageSeries = await dbReader.pageSeries.findAll({
                where: { is_deleted: 0, page_id: page_id, content_type_id: content_type_id },
                attributes: ["page_series_id", "category_id", "is_locked", "is_coming_soon", "is_selected", "sort_order", "created_datetime", "updated_datetime", "created_by", "updated_by"]
            });
            pageSeries = JSON.parse(JSON.stringify(pageSeries));
            new SuccessResponse(EC.errorMessage(EC.success), {
                //@ts-ignore
                token: req.token,
                page_series: pageSeries
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async savePageConnectedSeries(req: Request, res: Response) {
        try {
            //@ts-ignore
            let { user_id = 0 } = req;
            let { selected_series, page_id, content_type_id } = req.body;
            let arrInsertData: any = [], isExistPageSeriesId: any = [];
            let update_is_locked = "case page_series_id", update_is_coming_soon = "case page_series_id";
            let update_is_selected = "case page_series_id", update_sort_order = "case page_series_id";

            //add or update page series data
            if (selected_series && selected_series.length) {
                selected_series.forEach((e: any) => {
                    if (e.page_series_id == 0) {
                        arrInsertData.push({
                            page_id: page_id,
                            category_id: e.category_id,
                            is_locked: e.is_locked,
                            is_coming_soon: e.is_coming_soon,
                            content_type_id: content_type_id,
                            is_selected: e.is_selected,
                            sort_order: e.sort_order,
                            created_by: user_id,
                        });
                    } else {
                        isExistPageSeriesId.push(e.page_series_id);
                        update_is_locked += " when " + e.page_series_id + " then " + e.is_locked;
                        update_is_coming_soon += " when " + e.page_series_id + " then " + e.is_coming_soon;
                        update_is_selected += " when " + e.page_series_id + " then " + e.is_selected;
                        update_sort_order += " when " + e.page_series_id + " then " + e.sort_order;
                    }
                });
            }
            if (arrInsertData && arrInsertData.length) {
                await dbWriter.pageSeries.bulkCreate(arrInsertData);
            }
            if (isExistPageSeriesId && isExistPageSeriesId.length) {
                update_is_locked += " else is_locked end";
                update_is_coming_soon += " else is_coming_soon end";
                update_is_selected += " else is_selected end";
                update_sort_order += " else sort_order end";

                await dbWriter.pageSeries.update({
                    is_locked: dbWriter.Sequelize.literal(update_is_locked),
                    is_coming_soon: dbWriter.Sequelize.literal(update_is_coming_soon),
                    is_selected: dbWriter.Sequelize.literal(update_is_selected),
                    sort_order: dbWriter.Sequelize.literal(update_sort_order),
                    updated_by: user_id,
                }, {
                    where: { page_series_id: { [dbReader.Sequelize.Op.in]: isExistPageSeriesId } }
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

    public async listAllContentTypes(req: Request, res: Response) {
        try {
            let reqBody = req.body;
            let sortField = "content_type_id";
            let sortOrder = reqBody.sort_order ? reqBody.sort_order : "ASC";
            let rowLimit = reqBody.page_record ? parseInt(reqBody.page_record) : 50;
            let rowOffset = reqBody.page_no ? ((reqBody.page_no * reqBody.page_record) - reqBody.page_record) : 0;

            // Searching                           
            let SearchCondition = dbReader.Sequelize.Op.ne, SearchData = null;
            if (reqBody.search) {
                SearchCondition = dbReader.Sequelize.Op.like;
                SearchData = "%" + reqBody.search + "%";
            }

            let data = await dbReader.contentTypes.findAndCountAll({
                where: { content_type_title: { [SearchCondition]: SearchData } },
                include: [{
                    where: { is_deleted: 0 },
                    attributes: ["content_meta_id", "meta_key", "meta_type", "meta_value"],
                    separate: true,
                    model: dbReader.contentMeta,
                }],
                limit: rowLimit,
                offset: rowOffset,
                order: [[sortField, sortOrder]]
            });
            data = JSON.parse(JSON.stringify(data));
            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token,
                content_type_list: data
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async sortPageContentType(req: Request, res: Response) {
        try {
            let { sort_content_types } = req.body;
            let isExistPageMetaId: any = [];

            if (sort_content_types && sort_content_types.length) {
                let update_sort_order = "case page_meta_id";
                sort_content_types.forEach((e: any) => {
                    isExistPageMetaId.push(e.page_meta_id);
                    update_sort_order += " when " + e.page_meta_id + " then " + e.sort_order;
                });

                if (isExistPageMetaId.length) {
                    update_sort_order += " else sort_order end";
                    await dbWriter.pageMeta.update({ sort_order: dbWriter.Sequelize.literal(update_sort_order) }, {
                        where: { page_meta_id: { [dbReader.Sequelize.Op.in]: isExistPageMetaId } }
                    });
                }

                new SuccessResponse(EC.errorMessage(EC.success), {
                    //@ts-ignore
                    token: req.token,
                    data: true
                }).send(res);
            } else {
                throw new Error(EC.errorMessage(EC.required, ["Sort content types"]));
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async validateLinkKeyword(req: Request, res: Response) {
        try {
            let { title, data_id, site_id, link_type } = req.body, whereCondition;
            let keyword = title.toLowerCase().replace(/[^A-Z0-9]+/ig, "-");

            if (data_id) {
                whereCondition = dbReader.Sequelize.and(
                    { is_deleted: 0 },
                    { keyword: keyword },
                    { site_id: site_id },
                    { link_type: link_type },
                    { data_id: { [dbWriter.Sequelize.Op.ne]: data_id } }
                );
            } else {
                whereCondition = { is_deleted: 0, keyword: keyword, site_id: site_id };
            }

            let pageLink = await dbReader.pageLink.findAll({ where: whereCondition });
            let is_validate = pageLink.length ? false : true;

            new SuccessResponse(EC.errorMessage(EC.success), {
                //@ts-ignore
                token: req.token,
                is_validate: is_validate
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getPageLinkDetails(req: Request, res: Response) {
        try {
            //@ts-ignore
            let { user_id = 0, user_role = 3 } = req;
            let { keyword, site_id = 0 } = req.body;
            let pageLink = await dbReader.pageLink.findOne({
                where: { is_deleted: 0, keyword: keyword, site_id: site_id },
                attributes: ["page_link_id", "data_id", "detail_id", "site_id", "keyword", "ui_component", "link_type", "target_url", "total_hits"]
            });
            if (pageLink) {
                pageLink = JSON.parse(JSON.stringify(pageLink));
                let total_hits = pageLink.total_hits + 1;
                await dbWriter.pageLink.update({
                    total_hits: total_hits
                }, {
                    where: { page_link_id: pageLink.page_link_id },
                });

                if (pageLink.link_type == 1 && pageLink.ui_component == "page") {
                    let membershipPageIds: any = [];
                    //replace old page id with new page id
                    // let originFlag = (req.headers.origin?.includes("new.curriculum.stuffyoucanuse") || req.headers.origin?.includes("localhost")) ? true : false;
                    let originFlag = (req.headers.origin?.includes("new.curriculum.stuffyoucanuse")) ? true : false;
                    let freePageFlag = [1, 2].includes(pageLink.data_id) ? true : false;
                    if ((user_role != 3 && EnumObject.volumePageIdEnum.get((pageLink.data_id).toString())) && (originFlag || freePageFlag)) {
                        // if ((EnumObject.volumePageIdEnum.get((pageLink.data_id).toString())) && (originFlag || freePageFlag)) {
                        pageLink.data_id = EnumObject.volumePageIdEnum.get((pageLink.data_id).toString()).value;
                    }

                    let page_id = pageLink.data_id;
                    let page = await dbReader.pages.findOne({
                        attributes: ["page_id", "category_id"],
                        where: { is_deleted: 0, page_id: page_id },
                        include: [{
                            attributes: ["category_id", "category_slug", "is_current_volume"],
                            model: dbReader.categories,
                            where: { is_deleted: 0 },
                        }]
                    });
                    page = JSON.parse(JSON.stringify(page));
                    let category_slug = page.sycu_category.category_slug;
                    let is_current_volume = page.sycu_category.is_current_volume;
                    pageLink.is_past_volume = is_current_volume == 1 || category_slug == "music" || category_slug == "free-trial" || category_slug == "3-month-pack" ? 0 : 1;

                    if ([1, 2].includes(user_role)) {
                        pageLink.is_purchased_page = 1
                    } else {
                        if (user_id && category_slug != "music") {
                            let userMemberships = await dbReader.userMemberships.findAll({
                                where: dbReader.Sequelize.and(
                                    { is_deleted: 0 },
                                    dbReader.Sequelize.or(
                                        dbReader.Sequelize.and({ status: [2, 4, 10, 5] }, { site_id: 2 }),
                                        dbReader.Sequelize.and({ status: [2, 4, 10] }, { site_id: { [dbReader.Sequelize.Op.ne]: 2 } })
                                    ),
                                    { user_id: user_id },
                                    { membership_id: { [dbReader.Sequelize.Op.ne]: 0 } }
                                ),
                                attributes: ['membership_id', [dbReader.Sequelize.literal('`sycu_membership`.`page_id`'), 'page_id']],
                                include: [{
                                    where: { is_deleted: 0, status: 1 },
                                    model: dbReader.membership,
                                    attributes: [],
                                }]
                            });
                            if (userMemberships.length) {
                                userMemberships = JSON.parse(JSON.stringify(userMemberships));
                                userMemberships.forEach((um: any) => {
                                    if (!membershipPageIds.includes(um.page_id))
                                        membershipPageIds.push(um.page_id);
                                });
                            }
                            pageLink.is_purchased_page = membershipPageIds.includes(page_id) ? 1 : 0;
                        } else {
                            pageLink.is_purchased_page = category_slug == "music" ? 1 : 0;
                        }
                    }

                    if (pageLink.is_purchased_page == 0) {
                        let sharedPages = await dbReader.sharedPages.count({
                            where: dbReader.Sequelize.and(
                                { is_deleted: 0 },
                                { receiver_user_id: user_id },
                                { page_id: page_id }
                            )
                        });

                        let shareAllPages: any = {};
                        shareAllPages = await dbReader.shareAllPages.findAll({
                            where: dbReader.Sequelize.and(
                                { is_deleted: 0 },
                                { receiver_user_id: user_id },
                            )
                        });
                        shareAllPages = JSON.parse(JSON.stringify(shareAllPages));
                        if (sharedPages || shareAllPages.some((s: any) => s.is_share_all_kids === 1) ||
                                shareAllPages.some((s: any) => s.is_share_all_students === 1) ||
                                shareAllPages.some((s: any) => s.is_share_all_groups === 1)) {
                            pageLink.is_purchased_page = 1;
                        }
                    }
                }
            }
            new SuccessResponse(EC.errorMessage(EC.success), {
                //@ts-ignore
                token: req.token,
                pageLinkData: pageLink,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getPageLinkData(req: Request, res: Response) {
        try {
            let { data_id, detail_id, site_id, link_type } = req.body, data: any = null;
            switch (link_type) {
                case 4:
                    data = await dbReader.tipVideos.findOne({
                        where: { is_deleted: 0, tip_video_id: data_id },
                        attributes: ["tip_video_id", "category_id", "ministry_type", "video_title", "video_url", "video_cc"]
                    }); data = JSON.parse(JSON.stringify(data));
                    break;
                case 5:
                    data = await dbReader.categories.findOne({
                        where: { is_deleted: 0, category_id: data_id },
                        attributes: ['category_id', 'parent_category_id', 'category_title', 'category_image', 'ministry_type', 'total_week'],
                        include: [{
                            where: { is_deleted: 0 },
                            attributes: ["categories_detail_id", "detail_key", "detail_value"],
                            separate: true,
                            model: dbReader.categoriesDetail,
                        }]
                    });
                    if (data) {
                        data = JSON.parse(JSON.stringify(data));
                        data.categories_details.map(function (s: any) {
                            s.detail_value = ((s.detail_key == "lesson_builder" || s.detail_key == "notes" || s.detail_key == "big_idea_info") && s.detail_value != "") ? JSON.parse(s.detail_value) : s.detail_value;
                        });
                    }
                    break;
                case 6:
                    data = await dbReader.categories.findOne({
                        where: { category_id: data_id },
                        attributes: ['category_title', 'category_image'],
                        include: [{
                            where: { is_deleted: 0 },
                            attributes: ["categories_detail_id", "detail_key", "detail_value"],
                            separate: true,
                            model: dbReader.categoriesDetail,
                        }]
                    });
                    data = JSON.parse(JSON.stringify(data));
                    data.categories_details.forEach((e: any) => {
                        e.detail_value = e.detail_key == "amazon_internal" ? JSON.parse(e.detail_value) : e.detail_value;
                    });
                    data.categories_details.forEach(function (item: any, index: any, object: any) {
                        if (item.detail_key == "amazon_internal" && item.categories_detail_id != detail_id) {
                            object.splice(index, 1);
                        }
                    });
                    break;
                case 7:
                    data = await dbReader.amazonEvents.findOne({
                        where: { amazon_events_id: data_id }
                    }); data = JSON.parse(JSON.stringify(data));
                    break;
                case 8:
                    data = await dbReader.categoriesDetail.findOne({
                        where: { categories_detail_id: data_id, detail_key: 'series_memory_verse' },
                        attributes: ['categories_detail_id', 'category_id', 'detail_key', 'detail_value',
                            [dbReader.Sequelize.literal('`sycu_category`.`category_title`'), 'category_title'],
                            [dbReader.Sequelize.literal('`sycu_category`.`category_image`'), 'category_image']
                        ],
                        include: [{
                            model: dbReader.categories,
                            attributes: [],
                            include: [{
                                where: { is_deleted: 0 },
                                attributes: ["categories_detail_id", "detail_key", "detail_value"],
                                separate: true,
                                model: dbReader.categoriesDetail,
                            }]
                        }]
                    });
                    if (data) {
                        data = JSON.parse(JSON.stringify(data));
                        data.detail_value = (data.detail_value) ? JSON.parse(data.detail_value) : null;
                    }
                    break;
                case 10:
                    data = await dbReader.categories.findOne({
                        where: { category_id: data_id },
                        attributes: ['category_id', 'category_title', 'category_image'],
                        include: [{
                            attributes: ["categories_detail_id", "detail_key", "detail_value"],
                            model: dbReader.categoriesDetail,
                            separate: true,
                            where: { is_deleted: 0 },
                        }]
                    });
                    if (data) {
                        data = JSON.parse(JSON.stringify(data));
                        let detail_value = data.categories_details.find((e: any) => e.detail_key == "kids_series_preschool_tutorials").detail_value;
                        data.detail_value = detail_value ? JSON.parse(detail_value) : null;
                    }
                    break;
                case 11:
                    data = await dbReader.categories.findOne({
                        where: { category_id: data_id },
                        attributes: ['category_id', 'category_title', 'category_image'],
                        include: [{
                            attributes: ["categories_detail_id", "detail_key", "detail_value"],
                            model: dbReader.categoriesDetail,
                            separate: true,
                            where: { is_deleted: 0 },
                        }]
                    });
                    if (data) {
                        data = JSON.parse(JSON.stringify(data));
                        let detail_value = data.categories_details.find((e: any) => e.detail_key == "kids_series_elementary_tutorials").detail_value;
                        data.detail_value = detail_value ? JSON.parse(detail_value) : null;
                    }
                    break;
                case 12:
                    data = await dbReader.categories.findOne({
                        where: { category_id: data_id },
                        attributes: ['category_id', 'category_title', 'category_image'],
                        include: [{
                            attributes: ["categories_detail_id", "detail_key", "detail_value"],
                            model: dbReader.categoriesDetail,
                            separate: true,
                            where: { is_deleted: 0 },
                        }]
                    });
                    if (data) {
                        data = JSON.parse(JSON.stringify(data));
                        let detail_value = data.categories_details.find((e: any) => e.detail_key == "students_series_tutorials").detail_value;
                        data.detail_value = detail_value ? JSON.parse(detail_value) : null;
                    }
                    break;
                case 14:
                    data = await dbReader.pages.findOne({
                        where: { is_deleted: 0, is_published: 1, page_id: data_id },
                        attributes: ["category_id", "page_title", "page_description", "page_image", "page_icon", "page_link", "is_ministry_page", "ministry_type", "accessible_type"],
                        include: [{
                            where: { is_deleted: 0 },
                            attributes: ["page_meta_id", "original_id", "parent_meta_id", "meta_key", "meta_value", "sort_order"],
                            separate: true,
                            model: dbReader.pageMeta,
                        }, {
                            where: { is_deleted: 0, is_selected: 1 },
                            attributes: ["category_id", "content_type_id", "is_locked", "is_coming_soon", "sort_order"],
                            separate: true,
                            model: dbReader.pageSeries,
                            include: [{
                                attributes: ["category_title", "category_image", "ministry_type", "total_week"],
                                model: dbReader.categories,
                                include: [{
                                    attributes: ["categories_detail_id", "detail_key", "detail_value"],
                                    separate: true,
                                    model: dbReader.categoriesDetail,
                                    where: { is_deleted: 0 },
                                }, {
                                    include: [{
                                        attributes: ["keyword"],
                                        model: dbReader.pageLink,
                                        where: { is_deleted: 0, link_type: 2, site_id: curriculumSiteId },
                                    }],
                                    attributes: ["series_email_id", "series_type", "week_number"],
                                    separate: true,
                                    model: dbReader.seriesEmail,
                                    where: { is_deleted: 0 },
                                }, {
                                    attributes: ["message_build_list_id", "build_type", "series_id", "week_no"],
                                    separate: true,
                                    model: dbReader.messageBuildList,
                                    where: { is_deleted: 0, is_restore: 0 },
                                }]
                            }]
                        }, {
                            attributes: ["post_id", "is_locked", "is_coming_soon", "sort_order"],
                            separate: true,
                            model: dbReader.pagePosts,
                            where: { is_deleted: 0, is_selected: 1, content_type_id: { [dbWriter.Sequelize.Op.ne]: gamesContentTypeId } },
                            include: [{
                                attributes: ["post_id", "content_type_id", "post_title", "post_description", "post_image", "post_video"],
                                model: dbReader.posts,
                                include: [{
                                    attributes: ["post_meta_id", "post_id", "meta_key", "meta_value"],
                                    separate: true,
                                    model: dbReader.postMeta
                                }]
                            }]
                        }]
                    });
                    if (data) {
                        let curObj = new pageController();
                        data = JSON.parse(JSON.stringify(data));
                        data.page_meta = curObj.recursivePageMeta(data.page_meta, 0);
                        if (data.page_posts.length) {
                            data.page_posts.map(function (element: any) {
                                if (element.post != null) {
                                    element.post.is_locked = element.is_locked;
                                    element.post.is_coming_soon = element.is_coming_soon;
                                    element.post.post_video = element.post.post_video ? element.post.post_video : "";
                                    delete element.post_id;
                                    delete element.is_locked;
                                    delete element.is_coming_soon;
                                }
                            });
                        }
                        if (data.page_series.length) {
                            data.page_series.forEach((element: any) => {
                                if (element.sycu_category) {
                                    element.sycu_category.categories_details.map(function (e: any) {
                                        e.detail_value = ((e.detail_key == "lesson_builder" || e.detail_key == "notes") && e.detail_value != "") ? JSON.parse(e.detail_value) : e.detail_value;
                                    });
                                    element.sycu_category.series_emails.map(function (e: any) {
                                        e.keyword = e.page_link.keyword;
                                        delete e.page_link;
                                    });
                                }
                            });
                        }
                        data.content_type_page_meta = data.page_meta.filter((e: any) => e.meta_key == "content_type");
                        let contentTypeId = data.content_type_page_meta.map((s: any) => s.original_id);
                        let contentTypesData = await dbReader.contentTypes.findAll({
                            where: { content_type_id: contentTypeId },
                            attributes: ["content_type_id", "content_type_title"],
                        });
                        contentTypesData = JSON.parse(JSON.stringify(contentTypesData));
                        //change content type page meta values and attributes
                        data.content_type_page_meta.map(function (element: any) {
                            let _t = (contentTypesData.some((s: any) => s.content_type_id == element.original_id)) ? contentTypesData.find((s: any) => s.content_type_id == element.original_id) : null;
                            element.content_type_title = _t.content_type_title;
                            element.content_type_id = _t.content_type_id;
                            let _p = (data.page_posts.some((s: any) => s.post.content_type_id == element.original_id)) ? data.page_posts.filter((s: any) => s.post.content_type_id == element.original_id) : [];
                            element.page_posts = (element.content_type_id == newsFeedContentTypeId || element.content_type_id == gamesContentTypeId) ? [] : _p;
                            let _s = (data.page_series.some((s: any) => s.content_type_id == element.original_id)) ? data.page_series.filter((s: any) => s.content_type_id == element.original_id) : [];
                            element.page_series = _s;
                            element.child_data.map(function (e: any) {
                                e.child_data.length ? [] : delete e.child_data;
                                delete e.original_id;
                                delete e.page_meta_id;
                                delete e.parent_meta_id;
                            });
                            delete element.original_id
                            delete element.page_meta_id;
                            delete element.parent_meta_id;
                            delete element.meta_key;
                            delete element.meta_value;
                        });
                        //remove page_meta attribute from data
                        delete data.page_meta;
                        delete data.page_id;
                        delete data.page_posts;
                        delete data.page_series;
                    }
                    break;
                default:
                    break;
            }

            new SuccessResponse(EC.errorMessage(EC.success), {
                //@ts-ignore
                token: req.token,
                link_type,
                site_id,
                ...data
            }).send(res)
        } catch (err: any) {
            ApiError.handle(new BadRequestError(err.message), res)
        }
    }

    public async getAllPurchasedMusicProducts(req: Request, res: Response) {
        try {
            //@ts-ignore
            let { user_id = 0 } = req, musicCategoryId: any, arrProductIds: any = [];
            if (process.env.NODE_ENV == "production") {
                musicCategoryId = 188;
            } else if (process.env.NODE_ENV == "development") {
                musicCategoryId = 183;
            } else {
                musicCategoryId = 117;
            }

            let data = await dbReader.userSubscription.findAll({
                attributes: ["user_subscription_id", "user_id"],
                where: { subscription_status: 2, user_id: user_id },
                include: [{
                    attributes: ["user_subscription_id", "product_id"],
                    model: dbReader.userSubscriptionItems,
                    where: { is_deleted: 0 },
                    include: [{
                        attributes: ["product_id"],
                        model: dbReader.products,
                        where: { is_deleted: 0, category_id: musicCategoryId },
                    }]
                }]
            });
            if (data) {
                data = JSON.parse(JSON.stringify(data));
                data.forEach((element: any) => {
                    let user_subscription_items = element.user_subscription_items.length ? element.user_subscription_items[0] : "";
                    let sycu_product = user_subscription_items ? user_subscription_items.sycu_product : "";
                    if (sycu_product)
                        arrProductIds.push(sycu_product.product_id);
                });
            }

            new SuccessResponse(EC.errorMessage(EC.success), {
                //@ts-ignore
                token: req.token,
                product_ids: arrProductIds,
            }).send(res)
        } catch (err: any) {
            ApiError.handle(new BadRequestError(err.message), res)
        }
    }

    public async getNonPurchasedPageDetails(req: Request, res: Response) {
        try {
            let page_id = req.params.id;
            let sharedPages: any, is_page_shared = false;
            let data = await dbReader.pages.findOne({
                where: { is_deleted: 0, is_published: 1, page_id: page_id },
                attributes: ["page_title", "page_description", "page_image", "page_icon", "page_link", "is_ministry_page", "ministry_type", "accessible_type"],
                include: [{
                    where: { is_deleted: 0 },
                    attributes: ["page_meta_id", "original_id", "parent_meta_id", "meta_key", "meta_value", "sort_order"],
                    separate: true,
                    model: dbReader.pageMeta,
                }, {
                    where: { is_deleted: 0, is_selected: 1 },
                    attributes: ["category_id", "content_type_id", "is_locked", "is_coming_soon", "sort_order"],
                    separate: true,
                    model: dbReader.pageSeries,
                    include: [{
                        attributes: ["category_title", "category_image", "ministry_type", "total_week"],
                        model: dbReader.categories,
                        include: [{
                            attributes: ["categories_detail_id", "detail_key", "detail_value"],
                            separate: true,
                            model: dbReader.categoriesDetail,
                            where: { is_deleted: 0 },
                        }, {
                            include: [{
                                attributes: ["keyword"],
                                model: dbReader.pageLink,
                                where: { is_deleted: 0, link_type: 2, site_id: curriculumSiteId },
                            }],
                            attributes: ["series_email_id", "series_type", "week_number"],
                            separate: true,
                            model: dbReader.seriesEmail,
                            where: { is_deleted: 0 },
                        }, {
                            attributes: ["message_build_list_id", "build_type", "series_id", "week_no"],
                            separate: true,
                            model: dbReader.messageBuildList,
                            where: { is_deleted: 0, is_restore: 0 },
                        }]
                    }]
                }, {
                    attributes: ["post_id", "is_locked", "is_coming_soon", "sort_order"],
                    separate: true,
                    model: dbReader.pagePosts,
                    where: { is_deleted: 0, is_selected: 1, content_type_id: { [dbWriter.Sequelize.Op.ne]: gamesContentTypeId } },
                    include: [{
                        attributes: ["post_id", "content_type_id", "post_title", "post_description", "post_image", "post_video"],
                        model: dbReader.posts,
                        include: [{
                            attributes: ["post_meta_id", "post_id", "meta_key", "meta_value"],
                            separate: true,
                            model: dbReader.postMeta
                        }]
                    }]
                }]
            });
            if (data) {
                let curObj = new pageController();
                data = JSON.parse(JSON.stringify(data));
                let membership = await dbReader.membership.findOne({
                    attributes: ["membership_id"],
                    where: { is_deleted: 0, status: 1, page_id: page_id },
                    include: [{
                        attributes: ["membership_id", "product_id"],
                        model: dbReader.membershipProduct,
                        separate: true,
                        where: { is_deleted: 0 },
                        include: [{
                            attributes: ["product_id", "product_name", "product_price"],
                            model: dbReader.products,
                            where: { is_deleted: 0, product_duration: 365 },
                        }]
                    }]
                });
                if (membership) {
                    membership = JSON.parse(JSON.stringify(membership));
                    if (membership.sycu_membership_products.length) {
                        let product = membership.sycu_membership_products[0].sycu_product;
                        data.product_id = product ? product.product_id : 0;
                        data.product_name = product ? product.product_name : "";
                        data.product_price = product ? product.product_price : 0;
                    }
                }

                data.page_meta = curObj.recursivePageMeta(data.page_meta, 0);
                if (data.page_posts.length) {
                    data.page_posts.map(function (element: any) {
                        if (element.post != null) {
                            element.post.is_locked = element.is_locked;
                            element.post.is_coming_soon = element.is_coming_soon;
                            delete element.post_id;
                            delete element.is_locked;
                            delete element.is_coming_soon;
                        }
                    });
                }

                if (data.page_series.length) {
                    data.page_series.forEach((element: any) => {
                        if (element.sycu_category) {
                            element.sycu_category.categories_details.map(function (e: any) {
                                e.detail_value = ((e.detail_key == "lesson_builder" || e.detail_key == "notes") && e.detail_value != "") ? JSON.parse(e.detail_value) : e.detail_value;
                            });
                            element.sycu_category.series_emails.map(function (e: any) {
                                e.keyword = e.page_link.keyword;
                                delete e.page_link;
                            });
                        }
                    });
                }

                if (!is_page_shared) {
                    data.content_type_page_meta = data.page_meta.filter((e: any) => e.meta_key == "content_type");
                } else {
                    data.content_type_page_meta = data.page_meta.filter((e: any) => e.meta_key == "content_type" && sharedPages.sharedPageContentTypes.some((sp: any) => sp.content_type_id == e.original_id));
                }

                let contentTypeId = data.content_type_page_meta.map((s: any) => s.original_id);
                let contentTypesData = await dbReader.contentTypes.findAll({
                    where: { content_type_id: contentTypeId },
                    attributes: ["content_type_id", "content_type_title"],
                }); contentTypesData = JSON.parse(JSON.stringify(contentTypesData));

                let games = await dbReader.pagePosts.findAll({
                    where: { page_id: page_id, content_type_id: gamesContentTypeId, is_selected: 1, is_deleted: 0 },
                    attributes: ["post_id", "is_locked", "is_coming_soon", "sort_order"],
                    include: [{
                        model: dbReader.games,
                        attributes: ["game_id", "game_title", "game_description"],
                        where: { is_deleted: 0 },
                        include: [{
                            model: dbReader.attachment,
                            attributes: ['game_attachment_id', 'attachment_url'],
                            where: { parent_type: 1, attachment_type: 1, is_deleted: 0 }
                        }, {
                            required: false,
                            where: { is_deleted: 0, link_type: 3, site_id: 4 },
                            attributes: ["keyword"],
                            model: dbReader.pageLink,
                        }]
                    }]
                });
                if (games) {
                    games = JSON.parse(JSON.stringify(games));
                    games.map(function (element: any) {
                        element.post_id = element.sycu_game_game.game_id;
                        element.content_type_id = gamesContentTypeId;
                        element.post_title = element.sycu_game_game.game_title;
                        element.post_description = element.sycu_game_game.game_description;
                        element.post_image = element.sycu_game_game.sycu_game_attachments[0].attachment_url;
                        element.keyword = element.sycu_game_game.page_link != null ? element.sycu_game_game.page_link.keyword : "";
                        element.post_meta = [];
                        delete element.sycu_game_game;
                    });
                }

                //change content type page meta values and attributes
                data.content_type_page_meta.map(function (element: any) {
                    let _t = (contentTypesData.some((s: any) => s.content_type_id == element.original_id)) ? contentTypesData.find((s: any) => s.content_type_id == element.original_id) : null;
                    element.content_type_title = _t.content_type_title;
                    element.content_type_id = _t.content_type_id;

                    element.child_data.forEach((cdata: any) => {
                        cdata.meta_value = (cdata.meta_key == "description" || cdata.meta_key == "download_link" || cdata.meta_key == "preview_link") ? "" : cdata.meta_value;
                    });

                    let _p = (data.page_posts.some((s: any) => s.post.content_type_id == element.original_id)) ? data.page_posts.filter((s: any) => s.post.content_type_id == element.original_id) : [];
                    element.page_posts = (element.content_type_id == newsFeedContentTypeId || element.content_type_id == gamesContentTypeId) ? [] : _p;

                    if (element.content_type_id == gamesContentTypeId) {
                        element.page_games = games
                    }

                    let _s = (data.page_series.some((s: any) => s.content_type_id == element.original_id)) ? data.page_series.filter((s: any) => s.content_type_id == element.original_id) : [];
                    element.page_series = _s;

                    element.child_data.map(function (e: any) {
                        e.child_data.length ? [] : delete e.child_data;
                        delete e.original_id;
                        delete e.page_meta_id;
                        delete e.parent_meta_id;
                    });
                    delete element.original_id;
                    delete element.page_meta_id;
                    delete element.parent_meta_id;
                    delete element.meta_key;
                    delete element.meta_value;
                });
                delete data.page_meta;
                delete data.page_id;
                delete data.page_posts;
                delete data.page_series;

                new SuccessResponse(EC.errorMessage(EC.success), {
                    //@ts-ignore
                    token: req.token,
                    page: data
                }).send(res);
            } else {
                throw new Error(EC.errorMessage("Page not found."));
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async sortFreeVbsPages(req: Request, res: Response) {
        try {
            let { sort_vbs_pages } = req.body;
            if (sort_vbs_pages && sort_vbs_pages.length) {
                let update_sort_order = "case page_id";
                let vbsPageIds: any = [];
                sort_vbs_pages.forEach((e: any) => {
                    vbsPageIds.push(e.page_id);
                    update_sort_order += " when " + e.page_id + " then " + e.sort_order;
                });
                if (vbsPageIds.length) {
                    update_sort_order += " else sort_order end";
                    await dbWriter.pages.update({
                        sort_order: dbWriter.Sequelize.literal(update_sort_order)
                    }, {
                        where: { page_id: vbsPageIds }
                    });
                }
                new SuccessResponse(EC.errorMessage(EC.success), {
                    //@ts-ignore
                    token: req.token,
                    data: true
                }).send(res);
            } else {
                throw new Error(EC.errorMessage(EC.required, ["Sort pages"]));
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async updatePageTitle(req: Request, res: Response) {
        try {
            let { page_id, page_title } = req.body;
            await dbWriter.pages.update({
                page_title: page_title,
            }, {
                where: { page_id: page_id }
            });
            new SuccessResponse(EC.errorMessage(EC.success), {
                //@ts-ignore
                token: req.token,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
}
