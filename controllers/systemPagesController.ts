import { NextFunction, Request, Response, Router } from "express";
import { ErrorController } from "../core/ErrorController";
import { Crypto } from '../core/index';
import moment from 'moment'
import { SuccessResponse } from '../core/ApiResponse';
import { BadRequestError, ApiError } from '../core/ApiError';
import { enumerationController } from '../controllers/enumerationController';
import { CategoryController } from '../controllers/categoryController';
const { dbReader, dbWriter } = require('../models/dbConfig');
const mysql = require('promise-mysql');
const { Op } = dbReader.Sequelize;
const crypto = new Crypto();
const EnumObject = new enumerationController();
const CategoryObject = new CategoryController();
const axios = require('axios');

const EC = new ErrorController();

export class SystemaPagesController {

    public async SystemPagesList(req: Request, res: Response) {
        try {
            let { site_id, page_type } = req.body;
            let site_id_cond = dbReader.Sequelize.Op.eq, site_id_data: any = 1;
            if (site_id) {
                site_id_data = site_id
            }
            let page_type_cond = dbReader.Sequelize.Op.eq, page_type_data: any = null;
            if (page_type) {
                page_type_data = page_type
            }
            let SystemPagesData = await dbReader.systemPages.findAll({
                attributes: ["system_pages_id", "site_id", "json_value", "page_title", "page_type", "page_sub_type", "update_by", "updated_datetime"],
                where: {
                    site_id: { [site_id_cond]: site_id_data },
                    page_type: { [page_type_cond]: page_type_data },
                    is_deleted: 0
                }
            });

            if (SystemPagesData.length !== 0) {
                SystemPagesData.forEach((element: any) => {
                    element.json_value = (element.json_value) ? JSON.parse(element.json_value) : null
                });
            }

            new SuccessResponse(EC.listOfData, {
                //@ts-ignore
                token: req.token,
                data: SystemPagesData
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async updateSystemPages(req: Request, res: Response) {
        try {
            let { system_pages_id, json_value, site_id = 1, page_type, page_sub_type, page_title } = req.body
            let { user_id }: any = req
            let find_systemPage: any;
            let slug = "";
            let keyword = "";

            if (page_type == 2) {
                // find link page with same slug (name)

                let name = page_title.trim().toLowerCase().replace(/[^a-zA-Z0-9 ]+/ig, "");
                slug = name.replace(/ /g, '_');
                keyword = slug;
            }
            find_systemPage = await dbReader.systemPages.findOne({
                where: { system_pages_id: system_pages_id },
                attributes: ["system_pages_id"]
            });
            find_systemPage = JSON.parse(JSON.stringify(find_systemPage));
            if (find_systemPage) {
                if (page_type == 2) {
                    // update  link page 
                    var pageLink = await dbReader.pageLink.findOne({
                        where: {
                            target_url: slug,
                            site_id: site_id,
                            is_deleted: 0,
                            link_type: 13,
                            data_id: { [Op.ne]: find_systemPage.system_pages_id }
                        },
                    });
                    pageLink = JSON.parse(JSON.stringify(pageLink));
                    if (pageLink) {
                        // throw new Error(EC.errorMessage("Page with the page title already exists."));
                        slug = slug + "_" + moment().unix();
                        keyword = keyword + "_" + moment().unix();
                    }
                }

                let data: any = {};
                if (page_type) { data.page_type = page_type; }
                if (page_sub_type) { data.page_sub_type = page_sub_type }
                if (page_title) { data.page_title = page_title }

                await dbWriter.systemPages.update({
                    // site_id: site_id,
                    json_value: JSON.stringify(json_value),
                    update_by: user_id,
                    updated_datetime: new Date(),
                    ...data
                }, {
                    where: { system_pages_id: system_pages_id }
                })
                await dbWriter.pageLink.update(
                    {
                        target_url: slug,
                        keyword: keyword,
                        ui_component: 1
                    }, {
                    where: {
                        site_id: site_id,
                        data_id: find_systemPage,
                        link_type: 13
                    }
                });
                new SuccessResponse(EC.updatedDataSuccess, {
                    //@ts-ignore
                    token: req.token
                }).send(res);
            }
            else if (!find_systemPage && page_type == 2) {

                var pageLink = await dbReader.pageLink.findOne({
                    where: {
                        target_url: slug,
                        site_id: site_id,
                        is_deleted: 0,
                    },
                });
                pageLink = JSON.parse(JSON.stringify(pageLink));
                if (pageLink) {
                    //throw new Error(EC.errorMessage("Page with the page title already exists."));
                    slug = slug + "_" + moment().unix();
                    keyword = keyword + "_" + moment().unix();
                }

                let systemPages = await dbWriter.systemPages.create({
                    site_id: site_id,
                    page_title: page_title.trim(),
                    json_value: JSON.stringify(json_value),
                    update_by: user_id,
                    page_type,
                    page_sub_type,
                    updated_datetime: new Date()
                });
                // create link page 

                await dbWriter.pageLink.create(
                    {
                        target_url: slug,
                        keyword: keyword,
                        ui_component: 1,
                        link_type: 13,
                        data_id: systemPages.system_pages_id,
                        site_id: site_id,
                    }
                );

                new SuccessResponse(EC.updatedDataSuccess, {
                    //@ts-ignore
                    token: req.token
                }).send(res);
            }
            else {
                throw new Error(EC.errorMessage(EC.SystemPageDataNotFound));
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
    public async deleteSystemPages(req: Request, res: Response) {
        try {
            let { system_pages_id } = req.params
            let { user_id }: any = req
            await dbWriter.systemPages.update({
                is_deleted: 1
            }, {
                where: { system_pages_id: system_pages_id }
            });
            await dbWriter.pageLink.update(
                {
                    is_deleted: 1
                }, {
                where: {
                    data_id: system_pages_id,
                    link_type: 13
                }
            });

            new SuccessResponse(EC.deleteDataSuccess, {
                //@ts-ignore
                token: req.token
            }).send(res);

        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async detailSystemPages(req: Request, res: Response) {
        try {
            let { system_pages_id } = req.params

            let systemPageDetail = await dbReader.systemPages.findOne({
                where: {
                    system_pages_id: system_pages_id,
                    is_deleted: 0
                },
                attributes: ["system_pages_id", "site_id", "json_value", "page_title", "page_type", "page_sub_type", "update_by", "updated_datetime", "page_sub_type"]
            });

            if (systemPageDetail) {

                systemPageDetail.json_value = (systemPageDetail.json_value) ? JSON.parse(systemPageDetail.json_value) : null

                new SuccessResponse(EC.success, {

                    //@ts-ignore
                    token: req.token,
                    system_page_data: systemPageDetail
                }).send(res);
            } else {
                new SuccessResponse(EC.noDataFound, {

                    //@ts-ignore
                    token: req.token,
                    system_page_data: []
                }).send(res);
            }

        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
    public async ListOfSystemPageAndPageLink(req: Request, res: Response) {
        try {
            let { site_id, page_type } = req.body;
            let site_id_cond = dbReader.Sequelize.Op.eq, site_id_data: any = 1;
            if (site_id) {
                site_id_data = site_id
            }
            let page_type_cond = dbReader.Sequelize.Op.eq, page_type_data: any = 2;
            if (page_type) {
                page_type_data = page_type
            }
            let SystemPagesData = await dbReader.systemPages.findAll({
                attributes: ["system_pages_id", "site_id", "json_value", "page_title", "page_type", "page_sub_type", "update_by", "updated_datetime"],
                include: [{
                    // separate: true,
                    required: false,
                    model: dbReader.pageLink,
                    where: { is_deleted: 0, link_type: 13 }
                }],
                where: {
                    site_id: { [site_id_cond]: site_id_data },
                    page_type: { [page_type_cond]: page_type_data },
                    is_deleted: 0
                }

            });

            if (SystemPagesData.length !== 0) {
                SystemPagesData.forEach((element: any) => {
                    element.json_value = (element.json_value) ? JSON.parse(element.json_value) : null
                });
            }
            new SuccessResponse(EC.listOfData, {
                //@ts-ignore
                token: req.token,
                data: SystemPagesData
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public amazonExternalPageList = async (req: Request, res: Response) => {
        try {
            let { page_no, page_record, search, type = 0, type_id = 0 } = req.body;
            let rowLimit = page_record ? parseInt(page_record) : 50;
            let rowOffset = page_no ? ((page_no * page_record) - page_record) : 0;
            let searchCond = dbReader.Sequelize.Op.ne, searchData = null;
            if (search) {
                searchCond = dbReader.Sequelize.Op.like;
                searchData = `%${search}%`;
            }

            let amazonEventsData = await dbReader.amazonEvents.findAndCountAll({
                where: { type: type, type_id: type_id, is_deleted: 0, title: { [searchCond]: searchData } },
                attributes: ["amazon_events_id", "title", "sub_title", "description", "image_url", "color_code", "html_code", "type", "type_id", [dbReader.Sequelize.literal('`page_link`.`page_link_id`'), 'page_link_id'], [dbReader.Sequelize.literal('`page_link`.`keyword`'), 'keyword']],
                include: [{
                    model: dbReader.pageLink,
                    where: { link_type: 7, is_deleted: 0 },
                    attributes: []
                }],
                limit: rowLimit,
                offset: rowOffset,
            });
            amazonEventsData = JSON.parse(JSON.stringify(amazonEventsData));
            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token,
                count: amazonEventsData.count,
                rows: amazonEventsData.rows
            }).send(res)
        } catch (err: any) {
            ApiError.handle(new BadRequestError(err.message), res)
        }
    }

    public addUpdateAmazonExternalPage = async (req: Request, res: Response) => {
        try {
            //@ts-ignore
            let { user_id } = req;
            let { amazon_events_id, title, sub_title, description, html_code, image_url, color_code, page_link_id, type = 0, type_id = 0 } = req.body;

            if (amazon_events_id) {
                // let keyword = title.toLowerCase().replace(/[^a-zA-Z0-9]+/ig, "-") + '-amazon-' + moment().unix();
                // let pageLink = await dbReader.pageLink.count({
                //     where: { is_deleted: 0, keyword: keyword, site_id: 0, page_link_id: { [dbReader.Sequelize.Op.ne]: page_link_id } }
                // })
                // if (pageLink > 0)
                //     keyword += '-' + moment().unix();

                // if (page_link_id) {
                //     await dbWriter.pageLink.update({
                //         keyword: keyword,
                //         updated_datetime: new Date()
                //     }, {
                //         where: { page_link_id: page_link_id }
                //     });
                // } else {
                //     await dbWriter.pageLink.create({
                //         data_id: amazon_events_id,
                //         site_id: 2,
                //         keyword: keyword,
                //         target_url: '',
                //         ui_component: 'amazon-external',
                //         link_type: 7,
                //         total_hits: 0
                //     })
                // }

                await dbWriter.amazonEvents.update({
                    title: title,
                    sub_title: sub_title,
                    description: description,
                    html_code: html_code,
                    image_url: image_url,
                    color_code: color_code
                }, {
                    where: { amazon_events_id: amazon_events_id }
                });
            } else {
                let keyword = title.toLowerCase().replace(/[^a-zA-Z0-9]+/ig, "-") + '-amazon-' + moment().unix();
                let pageLink = await dbReader.pageLink.count({
                    where: { is_deleted: 0, keyword: keyword, site_id: 0 }
                });
                if (pageLink > 0)
                    keyword += '-' + moment().unix();

                let amazonEventsData = await dbWriter.amazonEvents.create({
                    title: title,
                    sub_title: sub_title,
                    description: description,
                    html_code: html_code,
                    image_url: image_url,
                    color_code: color_code,
                    create_by: user_id,
                    type: type,
                    type_id: type_id
                });
                await dbWriter.pageLink.create({
                    data_id: amazonEventsData.amazon_events_id,
                    site_id: 2,
                    keyword: keyword,
                    target_url: '',
                    ui_component: 'amazon-external',
                    link_type: 7,
                    total_hits: 0
                });
            }

            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token
            }).send(res)
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res)
        }
    }

    public deleteAmazonExternalPage = async (req: Request, res: Response) => {
        try {
            //@ts-ignore
            let { user_id } = req
            let { amazon_events_id } = req.params;
            await dbWriter.amazonEvents.update({
                is_deleted: 1,
                update_by: user_id,
                updated_datetime: new Date()
            }, {
                where: { amazon_events_id: amazon_events_id }
            });
            await dbWriter.pageLink.update({ is_deleted: 1 }, {
                where: { data_id: amazon_events_id, link_type: 7, site_id: 2 }
            });

            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token
            }).send(res)
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res)
        }
    }

    public getDashboardBlogsAndNews = async (req: Request, res: Response) => {
        try {
            let data: any = {};
            let systemPageDetail = await dbReader.systemPages.findOne({
                attributes: ["system_pages_id", "json_value"],
                where: { site_id: "2", page_sub_type: "5", page_type: "1" },
            });
            if (systemPageDetail) {
                systemPageDetail.json_value = JSON.parse(systemPageDetail.json_value);
                let blogs_limit = systemPageDetail.json_value.blogs_count;
                let news_limit = systemPageDetail.json_value.news_count;
                const getDbConnection = async () => {
                    return await mysql.createConnection({
                        host: 'sycu-aurora-wordpress-production-instance-1.caofnrfpd5g2.us-east-2.rds.amazonaws.com',
                        user: 'admin',
                        password: 'kWnOxXqpYzyG4LI1huJR',
                        database: 'grow_sycu_marketing'
                    });
                }
                const getBlogsNews = async () => {
                    let blogData: any = [], newsData: any = [];
                    const db = await getDbConnection();
                    const blogrows = await db.query('SELECT * FROM wpoh_postmeta WHERE meta_key = "_yoast_wpseo_primary_category" AND meta_value = 1 ORDER BY post_id DESC LIMIT ' + blogs_limit);
                    const newsrows = await db.query('SELECT * FROM wpoh_postmeta WHERE meta_key = "_yoast_wpseo_primary_wf_post_folders" AND meta_value = 313 ORDER BY post_id DESC LIMIT ' + news_limit);
                    if (blogrows.length) {
                        let ids = blogrows.map((e: any) => e.post_id);
                        if (ids.length) {
                            blogData = await db.query('SELECT post.ID,post.post_title,post.guid,post_content,meta.meta_value as post_description FROM wpoh_posts AS post LEFT OUTER JOIN wpoh_postmeta AS meta ON meta.post_id = post.ID AND meta.meta_key = "_yoast_wpseo_metadesc" WHERE post.ID IN (' + ids + ')');
                            let postImages = await db.query('SELECT meta.post_id,post.guid FROM wpoh_postmeta AS meta INNER JOIN wpoh_posts AS post ON post.ID = meta.meta_value WHERE meta_key = "_thumbnail_id" AND post_id IN (' + ids + ')');
                            blogData.forEach((e: any) => {
                                e.post_image = postImages.some((p: any) => p.post_id == e.ID) ? postImages.find((p: any) => p.post_id == e.ID).guid : "";
                            });
                        }
                    }
                    if (newsrows.length) {
                        let ids = newsrows.map((e: any) => e.post_id);
                        if (ids.length) {
                            newsData = await db.query('SELECT post.ID,post.post_title,post.guid,post_content,meta.meta_value as post_description FROM wpoh_posts AS post LEFT OUTER JOIN wpoh_postmeta AS meta ON meta.post_id = post.ID AND meta.meta_key = "_yoast_wpseo_metadesc" WHERE post.ID IN (' + ids + ')');
                            let postImages = await db.query('SELECT meta.post_id,post.guid FROM wpoh_postmeta AS meta INNER JOIN wpoh_posts AS post ON post.ID = meta.meta_value WHERE meta_key = "_thumbnail_id" AND post_id IN (' + ids + ')');
                            newsData.forEach((e: any) => {
                                e.post_image = postImages.some((p: any) => p.post_id == e.ID) ? postImages.find((p: any) => p.post_id == e.ID).guid : "";
                            });
                        }
                    }
                    await db.end();
                    return {
                        blogData: blogData,
                        newsData: newsData
                    }
                }
                data = await getBlogsNews();
            }
            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token,
                blogs: data.blogData,
                news: data.newsData,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res)
        }
    }

    public blogSiteMapReport = async (req: Request, res: Response) => {
        try {
            let { page_no = 1, page_record = 10, search = "", sort_field = "post_title", sort_order = "asc", filter = 0 } = req.body;
            // const searchData = `%${search}%`; // searchTerm is the term you are searching for in post_title
            let pageOffset = (page_no - 1) * page_record

            const getDbConnection = async () => {
                return await mysql.createConnection({
                    host: 'sycu-aurora-wordpress-production-instance-1.caofnrfpd5g2.us-east-2.rds.amazonaws.com',
                    user: 'admin',
                    password: 'kWnOxXqpYzyG4LI1huJR',
                    database: 'grow_sycu_marketing'
                });
            }
            const db = await getDbConnection();
            // Retrieve all posts from the database
            // const allPostsQuery = `SELECT * FROM wpoh_posts WHERE post_status IN ("draft", "publish") AND post_type = "post"`;
            const alPagesQuery = 'SELECT * FROM wpoh_posts WHERE post_status = "publish" AND post_type = "page"';
            const allPagesResult = await db.query(alPagesQuery);
            const allPostsQuery = `SELECT * FROM wpoh_posts AS post INNER JOIN wpoh_postmeta AS post_meta ON post_meta.post_id = post.ID WHERE post.post_status = "publish" AND post.post_type = "post" AND post_meta.meta_key = "_yoast_wpseo_primary_wf_post_folders" AND post_meta.meta_value = 294`;
            const allPostsResult = await db.query(allPostsQuery);

            // Create a map for post_name to post details
            const postMap = new Map();
            allPostsResult.forEach((post: any) => {
                postMap.set(post.post_name, {
                    post_id: post.ID,
                    post_title: post.post_title,
                    post_link: post.guid,
                    postLinks: [], // Array to hold connections to this post
                    pagesLinks: [],
                    potentialLinks: [],
                    internalLinks: [],
                    edit_link: `https://growcurriculum.org/wp-admin/post.php?post=${post.ID}&action=edit`
                });
            });

            // Function to extract post names from post content
            const extractPostNames = (content: any) => {
                const regex = /https:\/\/growcurriculum\.org\/([^\/]+)\//g; // Regex to match the URL pattern
                let matches;
                const postNames: any = [];
                while ((matches = regex.exec(content)) !== null) {
                    if (postNames.includes(matches[1])) {
                        continue;
                    } else {
                        postNames.push(matches[1]); // Add the post_name (from the URL) to the array
                    }
                }
                return postNames;
            };
            let linkedPosts = 0;
            let linkedData: any = [];
            let missingPotentialLinksCount = 0;
            let missingPotentialLinks: any = [];
            // Create connections between posts
            allPostsResult.forEach((post: any) => {
                let mainPost = postMap.get(post.post_name);
                const linkedPostNames = extractPostNames(post.post_content);
                const postTitle = post.post_title.toLowerCase();
                linkedPostNames.forEach((postName: any) => {
                    if (postName.includes(`"`)) {
                        postName = postName.split(`"`)[0];
                    }
                    if (postMap.has(postName) && postName !== post.post_name) { // Avoid self-referencing
                        const linkedPost = postMap.get(postName);
                        linkedPost.postLinks.push({
                            post_id: post.ID,
                            post_title: post.post_title,
                            post_link: postMap.get(post.post_name).post_link // Use the existing post_link from the map
                        });
                        mainPost.internalLinks.push({
                            post_id: linkedPost.ID,
                            post_title: linkedPost.post_title,
                            post_link: linkedPost.post_link
                        });
                        // linkedPosts++;
                        // linkedData.push(linkedPost);
                    }
                });

                // allPostsResult.forEach((otherPost: any) => {
                //     if (otherPost.ID !== post.ID && otherPost.post_content.toLowerCase().includes(postTitle)) {
                //         // Found a potential link based on title
                //         const potentialLink = {
                //             post_title: otherPost.post_title,
                //             post_link: otherPost.guid,
                //             post_id: otherPost.ID,
                //         }
                //         if (postMap.has(post.post_name)) {
                //             const otherPostEntry = postMap.get(post.post_name);
                //             otherPostEntry.potentialLinks.push(potentialLink);
                //         }
                //     }
                // });
            });

            allPagesResult.forEach((post: any) => {
                const linkedPostNames = extractPostNames(post.post_content);
                const postTitle = post.post_title.toLowerCase();
                linkedPostNames.forEach((postName: any) => {
                    if (postName.includes(`"`)) {
                        postName = postName.split(`"`)[0];
                    }
                    if (postMap.has(postName) && postName !== post.post_name) { // Avoid self-referencing
                        const linkedPost = postMap.get(postName);
                        linkedPost.pagesLinks.push({
                            post_id: post.ID,
                            post_title: post.post_title,
                            post_link: postMap.get(post.post_name).post_link // Use the existing post_link from the map
                        });
                        // linkedPosts++;
                        // linkedData.push(linkedPost);
                    }
                });
            });
            // Convert map to array for final result
            let finalResult = Array.from(postMap.values());
            linkedData = finalResult.filter(data => data.postLinks.length > 0 || data.pagesLinks.length > 0);
            let linkedPageData = finalResult.filter(data => data.pagesLinks.length > 0);
            let internalLinksData = finalResult.filter(data => data.internalLinks.length > 0);
            // let linkedPages = linkedPageData.length;
            linkedPosts = linkedData.length;
            missingPotentialLinks = finalResult.filter(data => data.potentialLinks.length > 0);
            missingPotentialLinksCount = missingPotentialLinks.length;
            let mainData: any = [];
            if (filter == 0) {
                mainData = finalResult
            } else if (filter == 1) {
                mainData = linkedData;
            } else if (filter == 2) {
                mainData = finalResult.filter(data => !linkedData.includes(data));
                // mainData = mainData.filter((data:any) => data.potentialLinks.length = 0)
            }
            else if (filter == 3) {
                mainData = linkedPageData
            }
            else if (filter == 4) {
                mainData = finalResult.filter(data => !linkedPageData.includes(data))
            }
            else if (filter == 5) {
                mainData = internalLinksData;
            }
            else if (filter == 6) {
                mainData = finalResult.filter(data => !internalLinksData.includes(data));
            }
            // Convert the search term to lowercase for case-insensitive comparison
            const searchData = search.toLowerCase();

            if (sort_field == "post_title") {
                if (sort_order.toLowerCase() == "asc") {
                    mainData.sort((a: any, b: any) => a.post_title.localeCompare(b.post_title));
                }
                else {
                    mainData.sort((a: any, b: any) => b.post_title.localeCompare(a.post_title));
                }
            }
            if (sort_field == "postLinks") {
                if (sort_order.toLowerCase() == "asc") {
                    mainData.sort((a: any, b: any) => a.postLinks.length - b.postLinks.length)
                }
                else {
                    mainData.sort((a: any, b: any) => b.postLinks.length - a.postLinks.length)
                }
            }
            if (sort_field == "pagesLinks") {
                if (sort_order.toLowerCase() == "asc") {
                    mainData.sort((a: any, b: any) => a.pagesLinks.length - b.pagesLinks.length)
                }
                else {
                    mainData.sort((a: any, b: any) => b.pagesLinks.length - a.pagesLinks.length)
                }
            }
            if (sort_field == "internalLinks") {
                if (sort_order.toLowerCase() == "asc") {
                    mainData.sort((a: any, b: any) => a.internalLinks.length - b.internalLinks.length)
                }
                else {
                    mainData.sort((a: any, b: any) => b.internalLinks.length - a.internalLinks.length)
                }
            }


            // Filter by search term in post_title if search is provided
            const filteredResults = search
                ? mainData.filter((post: any) => post.post_title.toLowerCase().includes(searchData))
                : mainData;

            // Calculate pagination details
            const paginatedResults = filteredResults.slice(pageOffset, pageOffset + page_record);
            let linkedDataPercentage = (linkedPosts / finalResult.length) * 100;
            let nonLinkedDataPercentage = ((finalResult.length - linkedPosts - missingPotentialLinksCount) / finalResult.length) * 100;
            let potentialLinkPercentage = ((missingPotentialLinksCount / finalResult.length) * 100);
            let resToSend = {
                count: filteredResults.length,
                data: paginatedResults,
                linkedPost: Math.round(linkedDataPercentage),
                nonLinkedPost: Math.round(nonLinkedDataPercentage),
                potentialLinkedPost: Math.round(potentialLinkPercentage),
                linkedPostNum: linkedPosts,
                nonLinkedPostNum: finalResult.length - linkedPosts - missingPotentialLinksCount,
                potentialLinkedPostNum: missingPotentialLinksCount,
                totalPostNum: finalResult.length
            }
            new SuccessResponse(EC.success, resToSend).send(res);
        } catch (error: any) {
            ApiError.handle(new BadRequestError(error.message), res)
        }
    }

    public getDashboardPageSideMenu = async (req: Request, res: Response) => {
        try {
            //@ts-ignore
            let { user_id = 0 } = req, productsArray: any = [];
            let yourStuffMenu: any = [], moreStuffMenu: any = [];

            let curriculumMenu = [{
                id: 1,
                // link: "https://curriculum.stuffyoucanuse.org/",
                link: "https://freetrial.stuffyoucanuse.org/kids",
                site_id: 2,
                link_type: "internal",
                menu_type: "Grow Kids"
            }, {
                id: 2,
                // link: "https://curriculum.stuffyoucanuse.org/",
                link: "https://freetrial.stuffyoucanuse.org/students",
                site_id: 2,
                link_type: "internal",
                menu_type: "Grow Students"
            },
            // {
            //     id: 3,
            //     link: "https://curriculum.stuffyoucanuse.org/",
            //     site_id: 2,
            //     link_type: "internal",
            //     menu_type: "Grow Groups"
            // }, 
            {
                id: 4,
                // link: "https://freetrial.stuffyoucanuse.org/vbs",
                link: "https://vbs.stuffyoucanuse.org",
                site_id: 2,
                link_type: "internal",
                menu_type: "Free VBS"
            },
                // {
                //     id: 5,
                //     link: "/coming-soon",
                //     site_id: 2,
                //     link_type: "internal",
                //     menu_type: "Curriculum Archive"
                // }
            ];
            let stuffMenu: any = [
                //     {
                //     id: 6,
                //     link: "/coming-soon",
                //     site_id: 0,
                //     link_type: "internal",
                //     menu_type: "Kids Music"
                // }, 
                {
                    id: 7,
                    link: "https://games.stuffyoucanuse.org/",
                    site_id: 4,
                    link_type: "external",
                    menu_type: "Grow Games"
                }, {
                    id: 8,
                    link: "https://builder.stuffyoucanuse.org/builder",
                    site_id: 3,
                    link_type: "external",
                    menu_type: "Grow Lesson Builder"
                }, {
                    id: 9,
                    link: "https://builder.stuffyoucanuse.org/app-builder",
                    site_id: 3,
                    link_type: "external",
                    menu_type: "Grow App Builder"
                }, {
                    id: 10,
                    link: "https://hubs.stuffyoucanuse.org/",
                    site_id: 5,
                    link_type: "external",
                    menu_type: "Grow Hubs"
                }, {
                    id: 11,
                    link: "https://slides.stuffyoucanuse.org/",
                    site_id: 6,
                    link_type: "external",
                    menu_type: "Grow Slides"
                },
                // {
                //     id: 12,
                //     link: "/coming-soon",
                //     site_id: 0,
                //     link_type: "external",
                //     menu_type: "Grow Creative Board"
                // }, {
                //     id: 13,
                //     link: "/coming-soon",
                //     site_id: 0,
                //     link_type: "external",
                //     menu_type: "Grow TV"
                // }, {
                //     id: 14,
                //     link: "http://growcurriculum.org/",
                //     site_id: 11,
                //     link_type: "external",
                //     menu_type: "Grow Habits"
                // }, {
                //     id: 15,
                //     link: "https://growcurriculum.org/blog/",
                //     site_id: 0,
                //     link_type: "internal",
                //     menu_type: "Grow Blog"
                // }, {
                //     id: 16,
                //     link: "https://stuffyoucanuse.org/grow-together/",
                //     site_id: 12,
                //     link_type: "external",
                //     menu_type: "Grow Together"
                // }, {
                //     id: 17,
                //     link: "https://people.stuffyoucanuse.org/",
                //     site_id: 7,
                //     link_type: "external",
                //     menu_type: "Grow People"
                // }, {
                //     id: 18,
                //     link: "/coming-soon",
                //     site_id: 0,
                //     link_type: "internal",
                //     menu_type: "Devotionals & Books"
                // }, {
                //     id: 19,
                //     link: "/coming-soon",
                //     site_id: 0,
                //     link_type: "internal",
                //     menu_type: "Prints & Swag"
                // }
            ];

            let userMembershipsData = await dbReader.userMemberships.findAll({
                where: { is_deleted: 0, status: 2, user_id: user_id },
                attributes: ["membership_id"],
                include: [{
                    model: dbReader.membership,
                    where: { is_deleted: 0, status: 1 },
                    attributes: ["membership_id"],
                    include: [{
                        separate: true,
                        model: dbReader.membershipProduct,
                        attributes: ['membership_product_id'],
                        where: { is_deleted: 0 },
                        include: [{
                            model: dbReader.products,
                            attributes: ['product_id', 'ministry_type', 'product_type'],
                            where: { is_deleted: 0 },
                        }]
                    }]
                }]
            });
            userMembershipsData = JSON.parse(JSON.stringify(userMembershipsData));
            userMembershipsData.forEach((e: any) => {
                e.sycu_membership.sycu_membership_products.forEach((i: any) => {
                    if (i.sycu_product) productsArray.push(i.sycu_product)
                });
            });

            let appVisitHistoryData = await dbReader.sites.findAll({
                attributes: ['site_id'],
                include: [{
                    separate: true,
                    model: dbReader.appVisitHistory,
                    where: { user_id: user_id },
                    order: [["app_visit_history_id", "DESC"]],
                    limit: 1
                }]
            });
            appVisitHistoryData = JSON.parse(JSON.stringify(appVisitHistoryData));

            if (!productsArray.some((p: any) => p.ministry_type == 3)) {
                curriculumMenu = curriculumMenu.filter((p: any) => p.id != 3);
            }
            /* stuffMenu.forEach((menu: any) => {
                if (menu.id == 6) {
                    if (productsArray.some((p: any) => p.product_type == 3)) {
                        yourStuffMenu.push(menu);
                    } else {
                        moreStuffMenu.push(menu);
                    }
                } else if (menu.site_id) {
                    if (appVisitHistoryData.find((a: any) => a.site_id == menu.site_id).sycu_app_visit_histories.length) {
                        yourStuffMenu.push(menu);
                    } else {
                        moreStuffMenu.push(menu);
                    }
                } else {
                    moreStuffMenu.push(menu);
                }
            }); */

            stuffMenu.forEach((menu: any) => {
                moreStuffMenu.push(menu);
            });

            let data = [{
                type: "curriculum",
                menu: curriculumMenu
            }, {
                type: "your stuff",
                menu: yourStuffMenu,
            }, {
                type: "more stuff",
                menu: moreStuffMenu,
            }]

            data = data.filter((d: any) => d.menu.length > 0)

            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token,
                menu: data,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res)
        }
    }

    public getDashboardHeaderNineDots = async (req: Request, res: Response) => {
        try {
            //@ts-ignore
            let { user_id = 0, user_role = 3 } = req;
            let nineDotsData;
            const domainUrl = process.env.NODE_ENV === 'development' ? '.dev' : '.org';
            let kidsLink = `https://freetrial.stuffyoucanuse${domainUrl}/kids`;
            let studentsLink = `https://freetrial.stuffyoucanuse${domainUrl}/students`;
            if (user_id) {
                let userVolumesData = await CategoryObject.getUserCurriculumVolumes(user_id, user_role, 0); 
                if (userVolumesData.purchased_volumes.kids.length) {
                    let kidsKeyword = userVolumesData.purchased_volumes.kids[0].keyword;
                    kidsLink = (kidsKeyword && kidsKeyword != "grow-kids-3-month-pack" && kidsKeyword != "kids-free-trial") ? `https://curriculum.stuffyoucanuse${domainUrl}/` + kidsKeyword : kidsLink;
                }
                if (userVolumesData.purchased_volumes.students.length) {
                    let studentsKeyword = userVolumesData.purchased_volumes.students[0].keyword;
                    studentsLink = (studentsKeyword && studentsKeyword != "grow-students-3-month-pack" && studentsKeyword != "students-free-trial") ? `https://curriculum.stuffyoucanuse${domainUrl}/` + studentsKeyword : studentsLink;
                }
            }

            // let nineDotsData = [{
            //     id: 1,
            //     title: "Grow Kids",
            //     link: kidsLink,
            //     // link: "https://growcurriculum.org/kids-ministry-curriculum",
            //     icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/GrowKids.png"
            // }, {
            //     id: 2,
            //     title: "Grow Students",
            //     link: studentsLink,
            //     // link: "https://growcurriculum.org/youth-ministry-curriculum/",
            //     icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/GrowStudents.png"
            // }, {
            //     id: 3,
            //     title: "Free VBS",
            //     link: "https://vbs.stuffyoucanuse.org",
            //     icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/vbs-svg.svg"
            // }, {
            //     id: 4,
            //     title: "Lesson Builder",
            //     link: "https://builder.stuffyoucanuse.org/",
            //     icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/lesson-builder-svg.svg"
            // }, {
            //     id: 5,
            //     title: "Grow Hubs",
            //     link: "https://hubs.stuffyoucanuse.org",
            //     icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/hubs-svg.svg"
            // }, {
            //     id: 6,
            //     title: "Grow Slides",
            //     link: "https://slides.stuffyoucanuse.org",
            //     icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/slides-svg.svg"
            // },
            // // {
            // //     id: 6,
            // //     title: "Creative Board",
            // //     link: "https://new.curriculum.stuffyoucanuse.org/coming-soon",
            // //     icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/grow_creative_board.png"
            // // }, 
            // // {
            // //     id: 7,
            // //     title: "Music",
            // //     link: "https://kidsmusic.stuffyoucanuse.org",
            // //     icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/kids-music-svg.svg"
            // // }, 
            // {
            //     id: 7,
            //     title: "Grow Games",
            //     link: "https://games.stuffyoucanuse.org",
            //     icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/games-svg.svg"
            // },
            // // {
            // //     id: 10,
            // //     title: "Books",
            // //     link: "https://curriculum.stuffyoucanuse.org/coming-soon",
            // //     icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/grow_books.png"
            // // },
            // // {
            // //     id: 11,
            // //     title: "Habits",
            // //     link: "https://growcurriculum.org",
            // //     icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/habits-svg.svg"
            // // },
            // // {
            // //     id: 12,
            // //     title: "Grow TV",
            // //     link: "https://new.curriculum.stuffyoucanuse.org/coming-soon",
            // //     icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/grow_tv.png"
            // // }, 
            // {
            //     id: 8,
            //     title: "Grow Print Shop",
            //     link: "https://shop.growcurriculum.org/",
            //     icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/grow_prints%26swag_s.svg"
            // }];

            // if (req.headers.origin == "https://curriculum.stuffyoucanuse.dev") {
            //     nineDotsData = [{
            //         id: 1,
            //         title: "Grow Kids",
            //         link: kidsLink,
            //         icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/GrowKids.png"
            //     }, {
            //         id: 2,
            //         title: "Grow Students",
            //         link: studentsLink,
            //         icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/GrowStudents.png"
            //     },
            //     {
            //         id: 3,
            //         title: "Free VBS",
            //         link: "https://curriculum.stuffyoucanuse.org/free-vbs",
            //         icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/vbs-svg.svg"
            //     },
            //     {
            //         id: 4,
            //         title: "Lesson Builder",
            //         link: "https://builder.stuffyoucanuse.org/",
            //         icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/lesson-builder-svg.svg"
            //     },
            //     {
            //         id: 5,
            //         title: "Grow Hubs",
            //         link: "https://hubs.stuffyoucanuse.org",
            //         icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/hubs-svg.svg"
            //     },
            //     {
            //         id: 6,
            //         title: "Grow Slides",
            //         link: "https://slidr.stuffyoucanuse.org",
            //         icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/slides-svg.svg"
            //     },
            //     {
            //         id: 7,
            //         title: "Grow Games",
            //         link: "https://games.stuffyoucanuse.org",
            //         icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/games-svg.svg"
            //     },
            //     {
            //         id: 8,
            //         title: "Grow Numbers",
            //         link: "https://numbers.stuffyoucanuse.org/",
            //         icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/lesson-builder-svg-1.svg"
            //     }];
            // } else {
            //     nineDotsData = [{
            //         id: 1,
            //         title: "Grow Kids",
            //         link: kidsLink,
            //         // link: "https://growcurriculum.org/kids-ministry-curriculum",
            //         icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/GrowKids.png"
            //     }, {
            //         id: 2,
            //         title: "Grow Students",
            //         link: studentsLink,
            //         // link: "https://growcurriculum.org/youth-ministry-curriculum",
            //         icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/GrowStudents.png"
            //     },
            //     {
            //         id: 3,
            //         title: "Free VBS",
            //         link: "https://curriculum.stuffyoucanuse.org/free-vbs",
            //         icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/vbs-svg.svg"
            //     },
            //     // {
            //     //     id: 3,
            //     //     title: "Free VBS",
            //     //     link: "https://curriculum.stuffyoucanuse.dev/free-vbs",
            //     //     icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/vbs-svg.svg"
            //     // }, 
            //     {
            //         id: 4,
            //         title: "Lesson Builder",
            //         link: "https://builder.stuffyoucanuse.org/",
            //         icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/lesson-builder-svg.svg"
            //     },
            //     // {
            //     //     id: 4,
            //     //     title: "Lesson Builder",
            //     //     link: "https://builder.stuffyoucanuse.dev",
            //     //     icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/lesson-builder-svg.svg"
            //     // }, 
            //     {
            //         id: 5,
            //         title: "Grow Hubs",
            //         link: "https://hubs.stuffyoucanuse.org",
            //         icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/hubs-svg.svg"
            //     },
            //     // {
            //     //     id: 5,
            //     //     title: "Grow Hubs",
            //     //     link: "https://hubs.stuffyoucanuse.dev",
            //     //     icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/hubs-svg.svg"
            //     // }, 
            //     {
            //         id: 6,
            //         title: "Grow Slides",
            //         link: "https://slidr.stuffyoucanuse.org",
            //         icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/slides-svg.svg"
            //     },
            //     // {
            //     //     id: 6,
            //     //     title: "Grow Slides",
            //     //     link: "https://slides.stuffyoucanuse.dev",
            //     //     icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/slides-svg.svg"
            //     // },
            //     // {
            //     //     id: 6,
            //     //     title: "Creative Board",
            //     //     link: "https://curriculum.stuffyoucanuse.org/coming-soon",
            //     //     icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/grow_creative_board.png"
            //     // },
            //     // {
            //     //     id: 7,
            //     //     title: "Grow Music",
            //     //     link: "https://kidsmusic.stuffyoucanuse.dev",
            //     //     icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/kids-music-svg.svg"
            //     // }, 
            //     {
            //         id: 7,
            //         title: "Grow Games",
            //         link: "https://games.stuffyoucanuse.org",
            //         icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/games-svg.svg"
            //     },
            //     // {
            //     //     id: 7,
            //     //     title: "Grow Games",
            //     //     link: "https://games.stuffyoucanuse.dev",
            //     //     icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/games-svg.svg"
            //     // },
            //     // {
            //     //     id: 10,
            //     //     title: "Books",
            //     //     link: "https://curriculum.stuffyoucanuse.org/coming-soon",
            //     //     icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/grow_books.png"
            //     // },
            //     // {
            //     //     id: 11,
            //     //     title: "Habits",
            //     //     link: "https://growcurriculum.org",
            //     //     icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/habits-svg.svg"
            //     // },
            //     // {
            //     //     id: 12,
            //     //     title: "Grow TV",
            //     //     link: "https://curriculum.stuffyoucanuse.org/coming-soon",
            //     //     icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/grow_tv.png"
            //     // }, 
            //     {
            //         id: 8,
            //         title: "Grow Print Shop",
            //         link: "https://shop.growcurriculum.org/",
            //         icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/grow_prints%26swag_s.svg"
            //     }];
            // }
            nineDotsData = [{
                id: 1,
                title: "Grow Kids",
                link: kidsLink,
                icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/GrowKids.png"
            }, {
                id: 2,
                title: "Grow Students",
                link: studentsLink,
                icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/GrowStudents.png"
            }, {
                id: 3,
                title: "Kids Music",
                link: `https://kidsmusic.stuffyoucanuse${domainUrl}/`,
                icon: "https://general-all-data.s3.us-east-2.amazonaws.com/Grow+Logos+and+Icons/grow+nine+dots/KidsMusic_Icon.png",

            },
            {
                id: 4,
                title: "Lesson Builder",
                link: `https://builder.stuffyoucanuse${domainUrl}/`,
                icon: "https://general-all-data.s3.us-east-2.amazonaws.com/Grow+Logos+and+Icons/grow+nine+dots/LessonBuilder_Icon.png"
            },
            {
                id: 5,
                title: "Grow Hubs",
                link: `https://hubs.stuffyoucanuse${domainUrl}/`,
                icon: "https://general-all-data.s3.us-east-2.amazonaws.com/Grow+Logos+and+Icons/grow+nine+dots/Hubs_Icon.png"
            },
            {
                id: 6,
                title: "Grow Slides",
                link: `https://slides.stuffyoucanuse${domainUrl}/`,
                icon: "https://general-all-data.s3.us-east-2.amazonaws.com/Grow+Logos+and+Icons/grow+nine+dots/Slides_Icon.png"
            },
            {
                id: 7,
                title: "Grow Games",
                link: `https://games.stuffyoucanuse${domainUrl}/`,
                icon: "https://general-all-data.s3.us-east-2.amazonaws.com/Grow+Logos+and+Icons/grow+nine+dots/Games_Icon.png"
            },
            {
                id: 8,
                title: "Grow Books",
                link: `https://books.stuffyoucanuse${domainUrl}/`,
                icon: "https://general-all-data.s3.us-east-2.amazonaws.com/Grow+Logos+and+Icons/grow+nine+dots/Books_Icon.png",
            },
            {
                id: 9,
                title: "Print Shop",
                link: `https://shop.growcurriculum${domainUrl}/`,
                icon: "https://general-all-data.s3.us-east-2.amazonaws.com/Grow+Logos+and+Icons/grow+nine+dots/PrintShop_Icon.png",
            },
            {
                id: 10,
                title: "Grow Blog",
                link: `https://growcurriculum${domainUrl}/blog/`,
                icon: "https://general-all-data.s3.us-east-2.amazonaws.com/Grow+Logos+and+Icons/grow+nine+dots/Blog_Icon.png",
            },
            {
                id: 11,
                title: "Free VBS",
                link: `https://curriculum.stuffyoucanuse${domainUrl}/free-vbs`,
                icon: "https://general-all-data.s3.us-east-2.amazonaws.com/Grow+Logos+and+Icons/grow+nine+dots/VBS_Icon.png"
            },
            // {
            //     id: 12,
            //     title: "Grow Numbers",
            //     link: `https://numbers.stuffyoucanuse${domainUrl}/`,
            //     icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/lesson-builder-svg-1.svg"
            /* } */];
            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token,
                data: nineDotsData,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res)
        }
    }

   public getDashboardHeaderNineDotsV2 = async (req: Request, res: Response) => {
        try {
              //@ts-ignore
              let { user_id = 0, user_role = 3 } = req;
              const domainUrl = process.env.NODE_ENV === 'development' ? '.dev' : '.org';
        
            let nineDotsData = await dbReader.nineDotMenu.findAll({
                attributes: ["nine_dot_menu_id","title", "category", "icon", "menu_order", "link"],
                where: {
                    is_deleted: 0
                },
                order: [['menu_order', 'ASC']]
            })
            nineDotsData = JSON.parse(JSON.stringify(nineDotsData))
            let curriculum: any = [], tools: any = [], support: any = [];
            nineDotsData.forEach((e: any) => {
                if (e.category == 0) {
                    curriculum.push(e)
                }
                else if (e.category == 1) {
                    tools.push(e)
                }
                else if (e.category == 2) {
                    support.push(e)
                }
            })
            
            if (user_id) {
                let kidsIndex = curriculum.findIndex((el:any)=>el.title==="Grow Kids" || el.nine_dot_menu_id===1);
                let studentsIndex = curriculum.findIndex((el:any)=>el.title==="Grow Students" || el.nine_dot_menu_id===2);
                let kidsLink;
                let studentsLink;
                if(kidsIndex > -1){
                    kidsLink = curriculum[kidsIndex].link;
                }
                if(studentsIndex > -1){
                    studentsLink = curriculum[studentsIndex].link;
                 }
                let userVolumesData = await CategoryObject.getUserCurriculumVolumes(user_id, user_role, 0); 
                if (userVolumesData.purchased_volumes.kids.length) {
                    let kidsKeyword = userVolumesData.purchased_volumes.kids[0].keyword;
                    kidsLink = (kidsKeyword && kidsKeyword != "grow-kids-3-month-pack" && kidsKeyword != "kids-free-trial") ? `https://curriculum.stuffyoucanuse${domainUrl}/` + kidsKeyword : kidsLink;
                    if(kidsIndex > -1){
                        curriculum[kidsIndex].link = kidsLink
                    }
                }
                if (userVolumesData.purchased_volumes.students.length) {
                    let studentsKeyword = userVolumesData.purchased_volumes.students[0].keyword;
                    studentsLink = (studentsKeyword && studentsKeyword != "grow-students-3-month-pack" && studentsKeyword != "students-free-trial") ? `https://curriculum.stuffyoucanuse${domainUrl}/` + studentsKeyword : studentsLink;
                   if(studentsIndex > -1){
                       curriculum[studentsIndex].link = studentsLink
                   }                    
                }
            }

            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token,
                data: {
                    curriculum:{
                        curriculum_title:"CURRICULUM",
                        data:curriculum
                        },
                    tools:{
                        tools_title:"TOOLS",
                        data:tools
                        },
                    support:{
                        support_title:"SUPPORT",
                        data:support
                        }
                },
            }).send(res);
        }
        catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res)
        }

    }

    public createUpdateDashboardHeaderNineDots = async (req: Request, res: Response) => {
        try {
            let { nine_dot_menu_id, title, link, icon, category, menu_order, is_deleted=false } = req.body
            let message: any = '';
            if (nine_dot_menu_id) {
                await dbWriter.nineDotMenu.update({
                    title: title,
                    link: link,
                    icon: icon,
                    category: category,
                    menu_order: menu_order,
                    is_deleted: is_deleted
                }, {
                    where: { nine_dot_menu_id: nine_dot_menu_id }
                });
                    message = 'NineDot Menu Updated successfully';
                
            } else{
                await dbWriter.nineDotMenu.create({
                    title: title,
                    link: link,
                    icon: icon,
                    category: category,
                    menu_order: menu_order
                });
                message = 'Created successfully';
            }
            new SuccessResponse(message, {
                //@ts-ignore
                token: req.token
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res)
        }
    }

    public updateMenuOrder = async (req: Request, res: Response) => {
        try {
            const { updates, category } = req.body; // Array of { nine_dot_menu_id, menu_order }
    
            // Input validation
            if (!Array.isArray(updates) || updates.length === 0 || typeof category !== 'number') {
                return res.status(400).json({ message: "Invalid request data. Ensure 'updates' is a non-empty array and 'category' is a number." });
            }
    
            // Validate each item in the updates array
            updates.forEach(item => {
                if (typeof item.nine_dot_menu_id !== 'number' || typeof item.menu_order !== 'number') {
                    throw new Error("Each update item must have 'nine_dot_menu_id' and 'menu_order' as numbers.");
                }
            });
    
            // Process updates
            for (const item of updates) {
                await dbWriter.nineDotMenu.update(
                    { menu_order: item.menu_order },
                    { where: { nine_dot_menu_id: item.nine_dot_menu_id, category } }
                );
            }
    
            // Send success response
            new SuccessResponse("Menu order updated successfully.", {
                //@ts-ignore
                token: req.token
            }).send(res);
    
        } catch (e: any) {
            // Log and handle errors
            console.error("Error updating menu order:", e.message);
            ApiError.handle(new BadRequestError(e.message), res);
        }
    };

    public getDashboardHeaderCreativeBoard = async (req: Request, res: Response) => {
        try {
            let Data = [

                {
                    id: 1,
                    title: "Lesson Builder",
                    link: "https://builder.stuffyoucanuse.org/",
                    icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/lesson-builder-svg.svg"
                },
                {
                    id: 2,
                    title: "Grow Hubs",
                    link: "https://hubs.stuffyoucanuse.org",
                    icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/hubs-svg.svg"
                },
                {
                    id: 3,
                    title: "Grow Slides",
                    link: "https://slides.stuffyoucanuse.org",
                    icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/slides-svg.svg"
                },
                // {
                //     id: 4,
                //     title: "Creative Board",
                //     link: "https://new.board.stuffyoucanuse.dev",
                //     icon: "https://sycu-accounts.s3.us-east-2.amazonaws.com/application/board_1715153638442.svg"
                // },
                {
                    id: 4,
                    title: "Grow Games",
                    link: "https://games.stuffyoucanuse.org",
                    icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/games-svg.svg"
                },
                {
                    id: 5,
                    title: "Grow Numbers",
                    link: "https://numbers.stuffyoucanuse.org/grow-numbers-login",
                    icon: "https://general-all-data.s3.us-east-2.amazonaws.com/other_tools_icons/lesson-builder-svg-1.svg"
                },
            ];
            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token,
                data: Data,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res)
        }
    }

    public getQuickLinks = async (req: Request, res: Response) => {
        try {
            let { type = 1 } = req.params;
            let categoriesArray = [6, 5, 4, 3, 2, 7, EnumObject.categoryIDEnum.get('musicCategoryId').value, 183, 256, 341];
            let contentTypeArray = [1, 2, 3, 4, 5, 6];
            if (type == 1) {
                categoriesArray.push(8);
                contentTypeArray.push(9);
            } else if (type == 3) {
                categoriesArray = [2, EnumObject.categoryIDEnum.get('musicCategoryId').value];
                contentTypeArray = [2, 3, 5, 11];
            }

            let return_data = await dbReader.contentTypes.findAll({
                where: { content_type_id: contentTypeArray },
                attributes: ['content_type_id', 'content_type_title'],
                include: [{
                    separate: true,
                    model: dbReader.contentMeta,
                    attributes: ['content_meta_id', 'meta_key', 'meta_type', 'meta_value'],
                    where: { meta_type: ['color_picker', 'display_title'], is_deleted: 0 }
                }]
            });
            return_data = JSON.parse(JSON.stringify(return_data));
            let data = await dbReader.categories.findAll({
                where: { parent_category_id: 0, is_deleted: 0, category_id: categoriesArray },
                attributes: ['category_id', 'category_title'],
                order: [['volume_count', 'DESC']],
                include: [{
                    separate: true,
                    model: dbReader.pages,
                    attributes: ['page_id', 'category_id', 'page_title', 'is_published', 'is_hidden'],
                    where: { is_deleted: 0, ministry_type: [type, 4] },
                    include: [{
                        required: false,
                        model: dbReader.pageMeta,
                        where: { meta_key: 'dropbox_link', is_deleted: 0 },
                        attributes: ["page_meta_id", "meta_key", "meta_value"],
                    }, {
                        separate: true,
                        model: dbReader.pagePosts,
                        attributes: ["page_post_id", "page_id"],
                        where: { is_deleted: 0, is_selected: 1 },
                        include: [{
                            model: dbReader.posts,
                            attributes: ["post_id", "content_type_id", "post_title", 'category_id'],
                            where: { ministry_type: [type, 4], is_deleted: 0, content_type_id: { [dbReader.Sequelize.Op.ne]: 13 } },
                            include: [{
                                separate: true,
                                model: dbReader.postMeta,
                                where: { meta_key: 'download_link' }
                            }]
                        }]
                    }, {
                        separate: true,
                        model: dbReader.pageSeries,
                        attributes: ["category_id", "content_type_id"],
                        where: { is_deleted: 0, is_locked: 0, is_coming_soon: 0, is_selected: 1 },
                        include: [{
                            model: dbReader.categories,
                            attributes: ["category_id", "parent_category_id", "category_title", "ministry_type"],
                            where: { is_deleted: 0 },
                            include: [{
                                separate: true,
                                model: dbReader.categoriesDetail,
                                where: { is_deleted: 0, detail_key: 'download_link' },
                                attributes: ["categories_detail_id", "detail_key", "detail_value"],
                            }]
                        }]
                    }]
                }]
            });

            let allVolumePages: any = [];
            data = JSON.parse(JSON.stringify(data));
            data.filter((d: any) => {
                d.pages = (d.category_id == 7 || d.category_id == 8 || d.category_id == 256 || d.category_id == 341) ?
                    d.pages.filter((p: any) => p.is_hidden == 0) :
                    d.pages.filter((p: any) => p.is_hidden == 1);
            });
            return_data.forEach((rd: any) => {
                rd.content_type_title = rd.content_type_title.charAt(0).toUpperCase() + rd.content_type_title.slice(1);
                let volumes: any = []
                rd.color_code = rd.content_meta.length ? rd.content_meta[0].meta_value : '';
                delete rd.content_meta;
                if (rd.content_type_id != 9) {
                    let name = type == 1 ? 'KV' : (type == 2 ? 'SV' : 'GV');
                    data.forEach((f: any) => {
                        if (f.category_title != "Free VBS" && f.category_title != "Free Trial") {
                            let vcount = f.category_title.charAt(f.category_title.length - 1);
                            volumes.push({
                                id: f.category_id,
                                title: name + vcount
                            });
                            if (!allVolumePages.find((vp: any) => vp.id == f.category_id)) {
                                let pages = f.pages.map((p: any) => {
                                    return {
                                        page_id: p.page_id,
                                        page_title: p.page_title,
                                        page_link: p.page_meta.length ? p.page_meta[0].meta_value : ''
                                    }
                                });
                                allVolumePages.push({
                                    id: f.category_id,
                                    title: name + vcount,
                                    data: pages
                                });
                            }
                        }
                    });
                    if (volumes.length) {
                        volumes.forEach((v: any) => {
                            let tempData = data
                            let tempDataArray: any = [];
                            tempData.forEach((vd: any) => {
                                vd.pages.forEach((p: any) => {
                                    if (rd.content_type_id == 2) {
                                        p.page_series.forEach((ps: any) => {
                                            if (ps.content_type_id == rd.content_type_id) {
                                                if (!tempDataArray.some((s: any) => s.category_id == ps.sycu_category.category_id)) {
                                                    tempDataArray.push(ps.sycu_category);
                                                }
                                            }
                                        });
                                    } else {
                                        p.page_posts.forEach((pp: any) => {
                                            if (pp.post.content_type_id == rd.content_type_id) {
                                                if (!tempDataArray.some((s: any) => s.post_id == pp.post.post_id)) {
                                                    tempDataArray.push(pp.post);
                                                }
                                            }
                                        });
                                    }
                                })
                            })
                            v.data = (rd.content_type_id != 2) ?
                                tempDataArray.filter((tv: any) => v.id == tv.category_id) :
                                tempDataArray.filter((tv: any) => v.id == tv.parent_category_id);
                        })
                    }
                } else if (type == 1) {
                    let tempDataArray: any = [];
                    let tempData = data.find((f: any) => f.category_id == 8).pages;
                    tempData[0].page_posts.forEach((pp: any) => { tempDataArray.push(pp.post) });
                    volumes = [{
                        id: 8,
                        title: 'VBS',
                        data: tempDataArray
                    }];
                }
                rd.volumes = volumes
            });
            if (type != 3) {
                let free_trial_page = data.find((d: any) => d.category_id == 7).pages[0];
                allVolumePages.unshift({
                    id: 7,
                    title: 'FREE TRIAL',
                    data: [{
                        page_id: free_trial_page.page_id,
                        page_title: free_trial_page.page_title,
                        page_link: free_trial_page.page_meta.length ? free_trial_page.page_meta[0].meta_value : ''
                    }]
                });
                return_data.unshift({
                    content_type_title: "Full Volumes",
                    color_code: "#71757a",
                    volumes: allVolumePages
                });
            }

            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token,
                data: return_data,
            }).send(res);
        } catch (err: any) {
            ApiError.handle(new BadRequestError(err.message), res)
        }
    }

    public testS3HtmlDownload = async (req: Request, res: Response) => {
        try {
            const { url } = req.body;
            // const s3Url = "https://sycu-curriculum.s3.us-east-2.amazonaws.com/series/mail-chimp/What_Can_I_Do_Volunteer_Email_Week_1_1699033791527.html"
            // const response = await axios.get(s3Url, {
            //     responseType: 'stream', // Stream the response
            //   });
            const response = await axios.get(url);
            // Set appropriate headers
            res.set({
                'Content-Type': 'text/html',
                'Content-Disposition': 'attachment; filename="downloaded-file.html"',
            });
            // Pipe the S3 response stream to the client response
            //   response.data.pipe(res);
            new SuccessResponse(EC.success, {
                data: response.data
            }).send(res)
        } catch (error: any) {
            ApiError.handle(new BadRequestError(error.message), res)
        }
    }

    public builderDataMigrationScript = async (req: Request, res: Response) => {
        req.setTimeout(90000000, () => { res.json({ 'res': '1', 'msg': 'Request timeout' }); });
        try {
            const getDbConnection7Feb = async () => {
                return await mysql.createConnection({
                    host: 'sycu7febv2-cluster.cluster-caofnrfpd5g2.us-east-2.rds.amazonaws.com',
                    user: 'sycu',
                    password: 'Z1P4xRhv8CSgXn0K50Ad',
                    database: 'grow'
                });
            }
            const db_7_feb = await getDbConnection7Feb();
            for (let i = 1; i <= 270; i++) {
                const datarows = await db_7_feb.query('SELECT * FROM gb_build_elements_details WHERE is_taken = 0 AND is_series = 1 AND build_elements_details_id NOT IN (SELECT build_elements_details_id FROM gb_build_elements_details_new) LIMIT 5000');
                let i = 0, db_7_feb_ids: any = [], insertArray: any = [];
                while (i < datarows.length) {
                    db_7_feb_ids.push(datarows[i].build_elements_details_id);
                    insertArray.push({
                        build_elements_details_id: datarows[i].build_elements_details_id,
                        build_list_id: datarows[i].build_list_id,
                        build_elements_id: datarows[i].build_elements_id,
                        title: datarows[i].title,
                        extra_title: datarows[i].extra_title,
                        extra_title_1: datarows[i].extra_title_1,
                        content: datarows[i].content,
                        extra_content: datarows[i].extra_content,
                        extra_content_1: datarows[i].extra_content_1,
                        media_url: datarows[i].media_url,
                        sortable_order: datarows[i].sortable_order,
                        build_type: datarows[i].build_type,
                        is_series: datarows[i].is_series,
                        is_collapsed: datarows[i].is_collapsed,
                        is_visible: datarows[i].is_visible,
                        is_delete: datarows[i].is_delete,
                        created_datetime: datarows[i].created_datetime,
                        updated_datetime: datarows[i].updated_datetime
                    })
                    i++;
                }
                await dbWriter.buildElementsDetails.bulkCreate(insertArray, {
                    updateOnDuplicate: Object.keys(insertArray[0]), // Update on all columns
                    upsert: true // Enable upsert functionality
                });
                await db_7_feb.query('UPDATE gb_build_elements_details SET is_taken = 1 WHERE build_elements_details_id IN (' + db_7_feb_ids + ')');
            }
            await db_7_feb.end();
            new SuccessResponse(EC.success, true).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res)
        }
    }
}
