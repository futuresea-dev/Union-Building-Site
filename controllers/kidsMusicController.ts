import { Request, Response } from "express";
import { ErrorController } from "../core/ErrorController";
import { SuccessResponse } from '../core/ApiResponse';
import { BadRequestError, ApiError } from '../core/ApiError';
import { enumerationController } from "./enumerationController";

const { dbReader, dbWriter } = require('../models/dbConfig');
const EC = new ErrorController();
var EnumObject = new enumerationController();

const stringToNumber = (val?: string | number): number | undefined => {
    if (val === undefined) {
        return undefined;
    }
    if (typeof val === "number") {
        return val;
    }
    if (val !== '' && val !== undefined) {
        return Number(val);
    }
}

export class kidsMusicController {

    public async addKidsMusicIntoUserLibrary(req: Request, res: Response) {
        try {
            //@ts-ignore
            let { user_id = 0 } = req;
            // type : 1 = shared dashboard, 2 = purchased songs, 3 = curriculum purchased, 4 = free songs, 5 = membership
            let activeCurriculumSubscription = await dbReader.userSubscription.findOne({
                where: { subscription_status: [2, 4, 10], user_id: user_id },
                attributes: ['user_subscription_id'],
                include: [{
                    required: true,
                    attributes: [],
                    as: "succes_subscription_items_check",
                    model: dbReader.userSubscriptionItems,
                    where: { is_deleted: 0, item_type: 1 },
                    include: [{
                        required: true,
                        attributes: [],
                        model: dbReader.products,
                        where: { is_deleted: 0, ministry_type: [1, 2, 3] }
                    }]
                }]
            });
            
            let isMembership = await dbReader.userMemberships.findOne({
                where: { user_id: user_id, status: [2, 4, 5, 10], is_deleted: 0 },
                attributes: ['user_membership_id'],
            });

            if (!activeCurriculumSubscription) {
                let existedSongs = await dbReader.userKidsMusicLibrary.findAll({
                    where: { user_id: user_id, is_deleted: 0, added_type: 3 },
                    attributes: ["music_id", "user_id"],
                });
                if (existedSongs.length) {
                    existedSongs = JSON.parse(JSON.stringify(existedSongs));
                    let existingMusicIds = existedSongs.map((e: any) => e.music_id);
                    await dbWriter.userKidsMusicLibrary.update({
                        is_deleted: 1
                    }, {
                        where: { music_id: existingMusicIds }
                    });
                }
            }

            if (!isMembership) {
                let existedSongs = await dbReader.userKidsMusicLibrary.findAll({
                    where: { user_id: user_id, is_deleted: 0, added_type: 5 },
                    attributes: ["music_id", "user_id"],
                });
                if (existedSongs.length) {
                    existedSongs = JSON.parse(JSON.stringify(existedSongs));
                    let existingMusicIds = existedSongs.map((e: any) => e.music_id);
                    await dbWriter.userKidsMusicLibrary.update({
                        is_deleted: 1
                    }, {
                        where: { music_id: existingMusicIds }
                    });
                }
            }

            let sharedPages = await dbReader.sharedPages.findAll({
                attributes: ["page_id"],
                where: dbReader.Sequelize.and(
                    { is_deleted: 0 },
                    { receiver_user_id: user_id },
                    { membership_id: { [dbReader.Sequelize.Op.ne]: 0 } },
                    { site_id: 2 }
                )
            });

            let shareAllPages = await dbReader.shareAllPages.findAll({
                attributes: ["share_all_page_id"],
                where: dbReader.Sequelize.and(
                    { is_deleted: 0 },
                    { receiver_user_id: user_id },
                    dbReader.Sequelize.or(
                        { is_share_all_kids: 1 },
                        { is_share_all_students: 1 },
                        { is_share_all_groups: 1 }
                    ),
                )
            });

            let activeKidsMusicSubscriptions = await dbReader.userSubscription.findAll({
                where: { subscription_status: [2, 4, 10], user_id: user_id },
                attributes: ['user_subscription_id'],
                include: [{
                    separate: true,
                    attributes: ['user_subscription_item_id'],
                    model: dbReader.userSubscriptionItems,
                    where: { is_deleted: 0, item_type: 1 },
                    include: [{
                        required: true,
                        attributes: ['product_id'],
                        model: dbReader.products,
                        where: { is_deleted: 0, site_id: EnumObject.siteEnum.get('kids music').value }
                    }]
                }]
            });

            if (activeCurriculumSubscription || sharedPages.length || shareAllPages.length || isMembership) {
                // let addedType = (activeCurriculumSubscription) ? 3 : 1;
                let addedType = 0;
                if (activeCurriculumSubscription) {
                    addedType = 3;
                } else if (shareAllPages.length || sharedPages.length) {
                    addedType = 1;
                } else if (isMembership) {
                    addedType = 5;
                }
                let allSongs = await dbReader.posts.findAll({
                    attributes: ["post_id", "post_title"],
                    where: { content_type_id: 12, category_id: EnumObject.categoryIDEnum.get('musicCategoryId').value, ministry_type: 1, is_deleted: 0 },
                    include: [{
                        required: true,
                        model: dbReader.postMeta,
                        attributes: ["post_meta_id", "meta_key", "meta_value"],
                    }]
                });
                allSongs = JSON.parse(JSON.stringify(allSongs));

                let existedSongs = await dbReader.userKidsMusicLibrary.findAll({
                    attributes: ["music_id", "user_id"],
                    where: { user_id: user_id, is_deleted: 0 }
                });
                existedSongs = JSON.parse(JSON.stringify(existedSongs));
                let existingMusicIds = existedSongs.length ? existedSongs.map((e: any) => e.music_id) : [];
                let arrBulkCreate: any = [];
                allSongs.forEach((song: any) => {
                    if (!existingMusicIds.includes(song.post_id) && !arrBulkCreate.some((b: any) => b.music_id == song.post_id)) {
                        arrBulkCreate.push({
                            user_id: user_id,
                            music_id: song.post_id,
                            added_type: addedType
                        })
                    }
                });
                if (arrBulkCreate.length) {
                    await dbWriter.userKidsMusicLibrary.bulkCreate(arrBulkCreate);
                }
            } else if (activeKidsMusicSubscriptions.length) {
                activeKidsMusicSubscriptions = JSON.parse(JSON.stringify(activeKidsMusicSubscriptions));
                let key = "product_id", prod: any = [];
                activeKidsMusicSubscriptions.forEach((element: any) => {
                    element.user_subscription_items.forEach((ele: any) => {
                        if (ele.sycu_product && !prod.includes(ele.sycu_product.product_id)) {
                            prod.push(ele.sycu_product.product_id);
                        }
                    });
                });

                let purchasedSong = await dbReader.posts.findAll({
                    attributes: ["post_id", "post_title"],
                    where: { content_type_id: 12, category_id: EnumObject.categoryIDEnum.get('musicCategoryId').value, ministry_type: 1, is_deleted: 0 },
                    include: [{
                        required: true,
                        model: dbReader.postMeta,
                        attributes: ["post_meta_id", "meta_key", "meta_value"],
                        where: { meta_key: key, meta_value: prod }
                    }]
                });
                purchasedSong = JSON.parse(JSON.stringify(purchasedSong));

                let existedSongs = await dbReader.userKidsMusicLibrary.findAll({
                    attributes: ["music_id", "user_id"],
                    where: { user_id: user_id, is_deleted: 0 }
                });
                existedSongs = JSON.parse(JSON.stringify(existedSongs));
                let existingMusicIds = existedSongs.length ? existedSongs.map((e: any) => e.music_id) : [];
                let arrBulkCreate: any = [];
                purchasedSong.forEach((song: any) => {
                    if (!existingMusicIds.includes(song.post_id) && !arrBulkCreate.some((b: any) => b.music_id == song.post_id)) {
                        arrBulkCreate.push({
                            user_id: user_id,
                            music_id: song.post_id,
                            added_type: 2
                        })
                    }
                });
                if (arrBulkCreate.length) {
                    await dbWriter.userKidsMusicLibrary.bulkCreate(arrBulkCreate);
                }
            }

            // Fetch free songs
            let freeSongs = await dbReader.posts.findAll({
                attributes: ["post_id", "post_title"],
                where: { content_type_id: 12, category_id: EnumObject.categoryIDEnum.get('musicCategoryId').value, ministry_type: 1, is_deleted: 0 },
                include: [{
                    required: true,
                    model: dbReader.postMeta,
                    attributes: ["post_meta_id", "meta_key", "meta_value"],
                    where: { meta_key: "is_free", meta_value: 1 }
                }]
            });
            freeSongs = JSON.parse(JSON.stringify(freeSongs));

            // Fetch user's existing music library
            let existedSongs = await dbReader.userKidsMusicLibrary.findAll({
                attributes: ["music_id", "user_id"],
                where: { user_id: user_id, is_deleted: 0 }
            });
            existedSongs = JSON.parse(JSON.stringify(existedSongs));
            let existingMusicIds = existedSongs.length ? existedSongs.map((e: any) => e.music_id) : [];
            let arrBulkCreate: any = [];
            freeSongs.forEach((song: any) => {
                if (!existingMusicIds.includes(song.post_id) && !arrBulkCreate.some((b: any) => b.music_id == song.post_id)) {
                    arrBulkCreate.push({
                        user_id: user_id,
                        music_id: song.post_id,
                        added_type: 4
                    })
                }
            });
            if (arrBulkCreate.length) {
                await dbWriter.userKidsMusicLibrary.bulkCreate(arrBulkCreate);
            }

            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getAllKidsMusic(user_id: any = 0, search: any = '') {
        try {

            let SearchCondition = dbReader.Sequelize.Op.ne, SearchData = null;
            if (search) {
                SearchCondition = dbReader.Sequelize.Op.like;
                SearchData = "%" + search + "%";
            }

            let activeSubscription: any = null, isMembership: any = null, activePaidSong: any = [], uniqueSongs: any = [], myLibraryProductIDs: any = [], freeProductIDs: any = [];
            if (user_id) {
                activeSubscription = await dbReader.userSubscription.findOne({
                    where: { subscription_status: [2, 4, 10], user_id: user_id },
                    attributes: ['user_subscription_id'],
                    include: [{
                        required: true,
                        attributes: [],
                        as: "succes_subscription_items_check",
                        model: dbReader.userSubscriptionItems,
                        where: { is_deleted: 0, item_type: 1 },
                        include: [{
                            required: true,
                            attributes: [],
                            model: dbReader.products,
                            where: { is_deleted: 0, ministry_type: [1, 2] }
                        }]
                    }]
                });

                isMembership = await dbReader.userMemberships.findOne({
                    where: { user_id: user_id, status: [2, 4, 5, 10], is_deleted: 0 },
                    attributes: ['user_membership_id'],
                });

                activePaidSong = await dbReader.userSubscription.findAll({
                    where: { subscription_status: [2, 4, 10], user_id: user_id },
                    attributes: ['user_subscription_id'],
                    include: [{
                        separate: true,
                        attributes: ['user_subscription_item_id'],
                        model: dbReader.userSubscriptionItems,
                        where: { is_deleted: 0, item_type: 1 },
                        include: [{
                            required: true,
                            attributes: ['product_id'],
                            model: dbReader.products,
                            where: { is_deleted: 0, site_id: EnumObject.siteEnum.get('kids music').value }
                        }]
                    }]
                });
                if (activePaidSong.length) {
                    activePaidSong = JSON.parse(JSON.stringify(activePaidSong));
                    activePaidSong.forEach((AS: any) => {
                        AS.user_subscription_items.forEach((ASI: any) => {
                            if (!uniqueSongs.includes(ASI.sycu_product.product_id))
                                uniqueSongs.push(ASI.sycu_product.product_id);
                        });
                    });
                }
            }

            let musicProducts = await dbReader.products.findAll({
                attributes: ['product_id', 'product_price'],
                where: { is_deleted: 0, site_id: EnumObject.siteEnum.get('kids music').value }
            });
            musicProducts = JSON.parse(JSON.stringify(musicProducts));
            let kidsMusic = await dbReader.posts.findAndCountAll({
                attributes: ["post_id", "post_title", "post_description", "post_image"],
                where: {
                    content_type_id: 12,
                    category_id: EnumObject.categoryIDEnum.get('musicCategoryId').value,
                    ministry_type: 1,
                    is_deleted: 0,
                    post_title: { [SearchCondition]: SearchData }
                },
                include: [{
                    required: false,
                    model: dbReader.userKidsMusic,
                    attributes: ["users_music_id", "music_id", "product_id"],
                    where: { user_id: user_id, is_deleted: 0 }
                }, {
                    required: false,
                    model: dbReader.userKidsMusicLibrary,
                    attributes: ["music_id", "user_id", "user_music_library_id"],
                    where: { user_id: user_id, is_deleted: 0 }
                }, {
                    separate: true,
                    model: dbReader.postMeta,
                    attributes: ["post_meta_id", "meta_key", "meta_value"],
                }, {
                    required: true,
                    as: 'signlePagePosts',
                    model: dbReader.pagePosts,
                    attributes: ["page_post_id", "page_id", "is_locked", "is_coming_soon", "sort_order"],
                    where: { is_deleted: 0 },
                }],
                order: [dbReader.Sequelize.literal('`signlePagePosts`.`sort_order`')]
            });
            kidsMusic = JSON.parse(JSON.stringify(kidsMusic));
            kidsMusic.rows.forEach((data: any) => {
                const prodId = data.post_meta.find((m: any) => m.meta_key == "product_id")?.meta_value;
                let product_id = stringToNumber(prodId) !== undefined ? prodId : 0;
                if (data.user_kids_music_library) {
                    product_id ? myLibraryProductIDs.push(+product_id) : null;
                }
                if ((data.post_meta.find((f: any) => f.meta_key == 'is_free')?.meta_value == 1) && product_id && !myLibraryProductIDs.includes(product_id)) {
                    myLibraryProductIDs.push(+product_id);
                }
                data.product_price = musicProducts.find((p: any) => stringToNumber(p.product_id) == product_id)?.product_price ?? 0;
                let is_purchased = ((data.user_kids_music && data.user_kids_music.music_id == data.post_id) || activeSubscription || isMembership) ? true : false;
                data.is_purchased = (data.post_meta.find((f: any) => f.meta_key == 'is_free')?.meta_value == 1) ? true : is_purchased;
                data.active_subscription = activeSubscription;
                data.user_membership = isMembership;
                data.is_purchased = (data.signlePagePosts.is_coming_soon == 1 || data.signlePagePosts.is_locked == 1) ? false : data.is_purchased;
                if (data.is_purchased == false && data.post_meta.find((f: any) => f.meta_key == 'is_free')?.meta_value == 0) {
                    data.post_meta.forEach((e: any) => {
                        e.meta_value = (['lyric_full_link', 'dance_full_link', 'tutorial_full_link'].includes(e.meta_key)) ? '' : e.meta_value;
                    });
                }
                if (data.post_meta.find((f: any) => f.meta_key == 'is_free')?.meta_value == 1) {
                    data.post_meta.forEach((e: any) => {
                        if (e.meta_key == 'product_id') {
                            freeProductIDs.push(+e.meta_value);
                        }
                    });
                }
                if (data.is_purchased == false && uniqueSongs.includes(product_id)) {
                    data.is_purchased = true;
                }
                if (data.is_purchased == false && data.user_kids_music_library && data.user_kids_music_library.music_id == data.post_id) {
                    data.is_purchased = true;
                }
            });
            kidsMusic.rows.sort((a: any, b: any) => {
                if (a.post_meta.find((f: any) => f.meta_key == 'is_free')?.meta_value == 1) {
                    return -1;
                } else if (b.post_meta.find((f: any) => f.meta_key == 'is_free')?.meta_value == 1) {
                    return 1;
                } else if (a.is_purchased == true && b.is_purchased == false) {
                    return -1;
                } else if (a.is_purchased == false && b.is_purchased == true) {
                    return 1;
                } else {
                    return 0;
                }
            });

            return {
                count: kidsMusic.count,
                music: kidsMusic.rows,
                products: musicProducts,
                myLibraryProductIDs: myLibraryProductIDs,
                freeProductIDs: freeProductIDs
            }
        } catch (e: any) {
            throw new Error(e.message);
        }
    }

    public async listAllKidsMusic(req: Request, res: Response) {
        try {
            //@ts-ignore
            let { user_id = 0 } = req;
            let { search = '' } = req.body;

            const self = new kidsMusicController();
            let kidMusicData = await self.getAllKidsMusic(user_id, search);

            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token,
                count: kidMusicData.count,
                music: kidMusicData.music,
                products: kidMusicData.products
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async addToLibrary(req: Request, res: Response) {
        try {
            // @ts-ignore
            let { user_id } = req;
            let { music_id } = req.body;
            let findMusicInLibrary = await dbReader.userKidsMusicLibrary.findOne({
                where: { user_id: user_id, music_id: music_id }
            })
            if (!findMusicInLibrary) {
                await dbWriter.userKidsMusicLibrary.create({
                    user_id: user_id,
                    music_id: music_id
                });
                new SuccessResponse("Added To Library", {}).send(res);
            } else {
                new SuccessResponse("Already In Library", {}).send(res);
            }
        } catch (error: any) {
            ApiError.handle(new BadRequestError(error.message), res);
        }
    }

    public async removeFromLibrary(req: Request, res: Response) {
        try {
            // @ts-ignore
            let { user_id } = req;
            let { music_id } = req.body;
            let findMusicInLibrary = await dbReader.userKidsMusicLibrary.findOne({
                where: { user_id: user_id, music_id: music_id }
            })
            if (findMusicInLibrary) {
                await dbWriter.userKidsMusicLibrary.update({
                    is_deleted: 1,
                    where: {
                        user_id: user_id,
                        music_id: music_id
                    }
                });
                new SuccessResponse("Removed From Library", {}).send(res);
            } else {
                new SuccessResponse("Already Removed From Library", {}).send(res);
            }
        } catch (error: any) {
            ApiError.handle(new BadRequestError(error.message), res);
        }
    }
}
