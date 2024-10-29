import { Request, Response } from "express";
import { ErrorController } from "../core/ErrorController";
import { SuccessResponse } from '../core/ApiResponse';
import { BadRequestError, ApiError } from '../core/ApiError';
import { ActiveCampaignController } from "./thirdParty/activeCampaignController";
import { enumerationController } from '../controllers/enumerationController';
const { dbReader, dbWriter } = require('../models/dbConfig');
const EC = new ErrorController();
const { Op } = dbReader.Sequelize;
var EnumObject = new enumerationController();
var activeCampaign = new ActiveCampaignController();

export class UserMembershipController {
    public async createNewUserMembership(req: Request, res: Response) {
        var userMembershipDetail: any;
        try {
            let { /*membership_id,*/ user_id } = req.body;
            var userMembershipDetail: any;
            // create user_membership
            var membership = await dbWriter.userMemberships.create({
                // membership_id: membership_id,
                user_id: user_id,
                status: 1
            });
            let obj = new UserMembershipController();
            userMembershipDetail = await obj.getUserMembershipById(membership.user_membership_id)
            new SuccessResponse(EC.saveDataSuccess, {
                //@ts-ignore
                token: req.token,
                userMembershipDetail: userMembershipDetail ?? membership
            }).send(res);
        }
        catch (error: any) {
            ApiError.handle(new BadRequestError(error.message), res);
        }
    }

    public async getUserMembershipById(user_membership_id: any) {
        let userMembershipDetail: any;
        userMembershipDetail = await dbReader.userMemberships.findOne({
            attributes: ["user_membership_id", "user_id", "membership_id", "user_subscription_id", "status",
                "user_orders_id", "expires", "start_date", "created_datetime", "updated_datetime",
                [dbReader.Sequelize.literal('`sycu_user`.`display_name`'), 'display_name'],
                [dbReader.Sequelize.literal(`membership_name`), 'membership_name']],
            where: { user_membership_id: user_membership_id },
            include: [{
                attributes: ["note_id", "event_type_id", "message", "type", "created_datetime"],
                separate: true,
                where: { is_deleted: 0, type: 4 },
                model: dbReader.orderNotes,
            }, {
                attributes: ["membership_id", "membership_name", "site_id"],
                model: dbReader.membership
            }, {
                model: dbReader.users,
                attributes: []
            }, {
                required: false,
                model: dbReader.userSubscription,
                attributes: ["user_subscription_id", "subscription_number", "subscription_status"],
                where: { subscription_status: { [dbReader.Sequelize.Op.in]: [1, 2, 3, 4, 5, 6, 7, 8, 10] } }
            }]
        });
        userMembershipDetail = JSON.parse(JSON.stringify(userMembershipDetail));
        if (userMembershipDetail) {
            userMembershipDetail.user_subscription = await dbReader.userSubscription.findAll({
                attributes: ["user_subscription_id", "subscription_number", "subscription_status"],
                where: { user_id: userMembershipDetail.user_id, subscription_status: { [dbReader.Sequelize.Op.in]: [1, 2, 3, 4, 5, 6, 7, 8, 10] } }
            }) ?? []
        }
        return userMembershipDetail;
    }

    public async getUserMembership(req: Request, res: Response) {
        try {
            let { user_membership_id } = req.body;
            let userMembershipDetail: any;
            let obj = new UserMembershipController();
            userMembershipDetail = await obj.getUserMembershipById(user_membership_id)
            new SuccessResponse(userMembershipDetail ? EC.success : EC.noDataFound, {
                user: null,
                //@ts-ignore
                token: req.token,
                userMembershipDetail
            }).send(res);
        }
        catch (error: any) {
            ApiError.handle(new BadRequestError(error.message), res);
        }
    }

    public async saveUserMembership(req: Request, res: Response) {
        try {
            //@ts-ignore
            let { display_name } = req;
            let { user_membership_id, membership_id = [], status = 2, user_orders_id, expires, user_subscription_id, start_date, page_id, site_id, user_id } = req.body;

            let existMembership: any = []
            if (user_id > 0) {
                existMembership = await dbReader.userMemberships.findAll({
                    where: { membership_id: membership_id, user_id: user_id, is_deleted: 0, status: [2, 3], user_membership_id: { [Op.ne]: user_membership_id }, }
                })
                existMembership = JSON.parse(JSON.stringify(existMembership))
            }
            if (existMembership.length) {
                throw new Error("Selected membership already exist in user profile");
            } else {
                let s = 0, userMembershipsData: any = [],  newStatusChangeFlow: any = [];
                while (s < membership_id.length) {
                    if (!site_id) {
                        let membershipData = await dbReader.membership.findOne({
                            where: { membership_id: membership_id[s] },
                            attributes: ['site_id'],
                        });
                        membershipData = JSON.parse(JSON.stringify(membershipData));
                        site_id = (membershipData && membershipData.site_id) ? membershipData.site_id : site_id;
                    }
                    if (s == 0) {
                        let existedUserMembership = await dbReader.userMemberships.findAll({
                            attributes: ["user_membership_id", "membership_id", "status"],
                            where: { membership_id: membership_id[s], is_deleted: 0, user_id: user_id }
                        });
                        existedUserMembership = JSON.parse(JSON.stringify(existedUserMembership));
                        existedUserMembership.forEach((element: any) => {
                            if(element.status != status){
                                newStatusChangeFlow.push({ membership_id: element.membership_id, isStatus: true, status: status });
                            }
                        });
                        await dbWriter.userMemberships.update({
                            membership_id: membership_id.join(','),
                            status: status,
                            user_orders_id: user_orders_id,
                            expires: expires,
                            user_subscription_id: user_subscription_id,
                            start_date: start_date,
                            page_id: page_id,
                            site_id: site_id || 0
                        }, {
                            where: { user_membership_id: user_membership_id }
                        });
                    } else {
                        userMembershipsData.push({
                            membership_id: membership_id[s],
                            status: status,
                            user_id: user_id,
                            user_orders_id: user_orders_id,
                            expires: expires,
                            user_subscription_id: user_subscription_id,
                            start_date: start_date,
                            page_id: page_id,
                            site_id: site_id || 0
                        })
                    }
                    s++
                }
                if (userMembershipsData.length) {
                    await dbWriter.userMemberships.bulkCreate(userMembershipsData)
                }
                if (user_subscription_id > 0 && user_membership_id != 0) {
                    let subscriptionData = await dbReader.userMemberships.findOne({
                        where: { user_membership_id: user_membership_id },
                        attributes: [ "user_membership_id", "status", [dbReader.Sequelize.literal('`user_subscription`.`subscription_number`'), 'subscription_number'],
                        [dbReader.Sequelize.literal('`sycu_membership`.`membership_name`'), 'membership_name']],
                        include: [{
                            required: true,
                            model: dbReader.userSubscription,
                            attributes: []
                        }, {
                            required: true,
                            model: dbReader.membership,
                            attributes: []
                        }]
                    });
                    if (subscriptionData) {
                        subscriptionData = JSON.parse(JSON.stringify(subscriptionData));
                        if(newStatusChangeFlow.length){
                            let status = EnumObject.membershipStatus.get((subscriptionData.status).toString()).value;
                            let membershipName = subscriptionData.membership_name;
                            await dbWriter.notes.create({
                                type: 2,//Subscription
                                event_type_id: user_subscription_id,
                                message: "Subscription #" + subscriptionData.subscription_number + ": membership status changed to " + `"${status}"` + " for membership " + `"${membershipName}"` + " changed by admin (" + display_name + ")",
                                is_system:1,
                                // @ts-ignore
                                user_id:req.user_id
                            });
                        } else {
                            let membershipName = subscriptionData.membership_name;
                            await dbWriter.notes.create({
                                type: 2,//Subscription
                                event_type_id: user_subscription_id,
                                message: "Subscription #" + subscriptionData.subscription_number + ": new membership " + `"${membershipName}"` + " added by admin (" + display_name + ")",
                                is_system:1,
                                // @ts-ignore
                                user_id:req.user_id
                            });
                        }
                    }
                } else {
                    let membershipData = await dbReader.membership.findAll({
                        where: { membership_id: membership_id, is_deleted: 0 }
                    });
                    if (membershipData.length) {
                        membershipData = JSON.parse(JSON.stringify(membershipData));
                        let membershipAddData = [];
                        for (let i = 0; i < membershipData.length; i++) {
                            if(newStatusChangeFlow.length){
                                let status = (newStatusChangeFlow[i].membership_id == membershipData[i].membership_id) ? EnumObject.membershipStatus.get((newStatusChangeFlow[i].status).toString()).value : " ";
                                let membershipName = membershipData[i].membership_name;
                                membershipAddData.push({
                                    type: 4,//Subscription
                                    event_type_id: user_id,
                                    message: "Membership " + `"${membershipName}"` + " status changed to " + `"${status}"` + " by admin (" + display_name + ")",
                                });
                            } else {
                                let membershipName = membershipData[i].membership_name;
                                membershipAddData.push({
                                    type: 4,//Subscription
                                    event_type_id: user_id,
                                    message: "New membership " + `"${membershipName}"` + " added by admin (" + display_name + ")",
                                });
                            }
                        }
                        if (membershipAddData.length) {
                            await dbWriter.notes.bulkCreate(membershipAddData)
                        }
                    }
                }

                //====================== ActiveCampagin CODE==================//
                if (membership_id.length && status == 2) {
                    let productData = await dbReader.membershipProduct.findAll({
                        attributes: ['product_id'],
                        where: { membership_id: membership_id, is_deleted: 0 }
                    });
                    productData = JSON.parse(JSON.stringify(productData));
                    let productList = productData.map((s: any) => s.product_id);
                    let getUser = await dbReader.users.findOne({
                        attributes: ['activecampaign_contact_id'],
                        where: { user_id: user_id }
                    });
                    getUser = JSON.parse(JSON.stringify(getUser));
                    let contact_id = getUser ? getUser.activecampaign_contact_id : 0;
                    if (productList.length && contact_id) {
                        let addOrRemoveFlag = "add";
                        let activeCampaignData = {
                            "products": productList,
                            "contact_id": contact_id,
                            "user_id": user_id
                        }
                        await activeCampaign.activeCampaignMapProductsData(activeCampaignData, addOrRemoveFlag);
                    }
                }

                //let userMembershipDetail: any;
                // let obj = new UserMembershipController();
                // userMembershipDetail = await obj.getUserMembershipById(user_membership_id)
                new SuccessResponse("Membership has been saved successfully.", {
                    //@ts-ignore
                    token: req.token
                }).send(res);
            }
        } catch (error: any) {
            ApiError.handle(new BadRequestError(error.message), res);
        }
    }

    public async deleteUserMemberships(req: any, res: any) {
        try {
            //@ts-ignore
            let { display_name } = req;
            let { id } = req.params;
            dbWriter.userMemberships.update(
                { is_deleted: 1 },
                { where: { user_membership_id: id } }
            )

            let subscriptionData = await dbReader.userMemberships.findOne({
                where: { user_membership_id: id },
                attributes: ['user_subscription_id', [dbReader.Sequelize.literal('`user_subscription`.`subscription_number`'), 'subscription_number'], [dbReader.Sequelize.literal('`sycu_membership`.`membership_name`'), 'membership_name']],
                include: [{
                    required: true,
                    model: dbReader.userSubscription,
                    attributes: []
                }, {
                    required: true,
                    model: dbReader.membership,
                    attributes: []
                }]
            });
            if (subscriptionData) {
                subscriptionData = JSON.parse(JSON.stringify(subscriptionData));
                await dbWriter.notes.create({
                    type: 2,//Subscription
                    event_type_id: subscriptionData.user_subscription_id,
                    message: "Subscription #" + subscriptionData.subscription_number + ": membership " + subscriptionData.membership_name + " has been deleted by admin (" + display_name + ")",
                    is_system:1,
                    // @ts-ignore
                    user_id:req.user_id
                });
            }

            //Remove added kids music if user membership
            let getUser = await dbReader.users.findOne({
                where: { display_name: display_name }, attributes: ["user_id"]
            });
            if (getUser) {
                getUser = JSON.parse(JSON.stringify(getUser));
                //get those kids music which was added because of membership
                let sharedMusics = await dbReader.userKidsMusicLibrary.findAll({
                    where: { user_id: getUser.user_id, is_deleted: 0, added_type: 5 },
                    attributes: ["music_id", "user_id"],
                });
                if (sharedMusics.length) {
                    sharedMusics = JSON.parse(JSON.stringify(sharedMusics));
                    let existingMusicIds = sharedMusics.map((e: any) => e.music_id);
                    await dbWriter.userKidsMusicLibrary.update({
                        is_deleted: 1
                    }, {
                        where: { music_id: existingMusicIds }
                    });
                }
            }

            new SuccessResponse(EC.deleteDataSuccess, {
                //@ts-ignore
                token: req.token
            }).send(res);
        }
        catch (error: any) {
            ApiError.handle(new BadRequestError(error.message), res);
        }
    }

    public async getUserActiveMemberships(req: any, res: any) {
        try {
            var reqBody = req.body, userMemberships: any = [];
            var rowLimit = reqBody.page_record ? parseInt(reqBody.page_record) : 10;
            var rowOffset = reqBody.page_no ? ((reqBody.page_no * reqBody.page_record) - reqBody.page_record) : 0;
            var sortField = reqBody.sort_field ? reqBody.sort_field : "user_membership_id";
            var sortOrder = reqBody.sort_order ? reqBody.sort_order : "DESC";
            var userId = reqBody.user_id ? reqBody.user_id : 0;

            let findSubscription = await dbReader.userSubscription.findAll({
                where: { user_id: userId },
                include: [{
                    separate: true,
                    model: dbReader.userOrder,
                    attributes: ['user_orders_id', 'user_subscription_id', 'total_amount'],
                    where: { order_status: { [dbReader.Sequelize.Op.ne]: 7 } },
                    include: [{
                        separate: true,
                        model: dbReader.userOrderItems,
                        attributes: ['user_order_item_id', 'product_id', 'updated_product_id'],
                        where: { item_type: 1, is_deleted: 0 },
                        include: [{
                            model: dbReader.products,
                            attributes: ['product_id', 'product_name', 'product_duration', 'category_id', 'ministry_type'],
                            where: { is_deleted: 0 },
                        }, {
                            required: false,
                            as: 'updated_product',
                            model: dbReader.products,
                            attributes: ['product_id', 'product_name', 'product_duration', 'category_id', 'ministry_type'],
                        }]
                    }, {
                        separate: true,
                        model: dbReader.refunds
                    }],
                    order: [['user_orders_id', 'DESC']]
                }]
            });
            let refundProductIds: any = [], tempProductIds: any = [];
            findSubscription = JSON.parse(JSON.stringify(findSubscription));
            findSubscription.forEach((s: any) => {
                s.user_orders.forEach((o: any, index: any) => {
                    if (o.refunds.length) {
                        let total_refund = 0;
                        o.refunds.forEach((r: any) => { total_refund += r.refund_amount; });
                        if (o.total_amount == total_refund) {
                            o.user_order_items.forEach((oi: any) => {
                                if (oi.updated_product_id) {
                                    refundProductIds.push({
                                        product_id: oi.updated_product_id,
                                        product_duration: oi.updated_product.product_duration,
                                        ministry_type: oi.updated_product.ministry_type,
                                        category_id: oi.updated_product.category_id,
                                    });
                                }
                                else {
                                    refundProductIds.push({
                                        product_id: oi.product_id,
                                        product_duration: oi.sycu_product.product_duration,
                                        ministry_type: oi.sycu_product.ministry_type,
                                        category_id: oi.sycu_product.category_id,
                                    });
                                }
                            });
                        } else {
                            o.user_order_items.forEach((oi: any) => {
                                if (oi.updated_product_id) {
                                    tempProductIds.push({
                                        product_id: oi.updated_product_id,
                                        product_duration: oi.updated_product.product_duration,
                                        ministry_type: oi.updated_product.ministry_type,
                                        category_id: oi.updated_product.category_id,
                                        status: s.subscription_status
                                    });
                                }
                                else {
                                    tempProductIds.push({
                                        product_id: oi.product_id,
                                        product_duration: oi.sycu_product.product_duration,
                                        ministry_type: oi.sycu_product.ministry_type,
                                        category_id: oi.sycu_product.category_id,
                                        status: s.subscription_status
                                    });
                                }
                            });
                        }
                    } else {
                        o.user_order_items.forEach((oi: any) => {
                            if (oi.updated_product_id) {
                                tempProductIds.push({
                                    product_id: oi.updated_product_id,
                                    product_duration: oi.updated_product.product_duration,
                                    ministry_type: oi.updated_product.ministry_type,
                                    category_id: oi.updated_product.category_id,
                                    status: s.subscription_status
                                });
                            }
                            else {
                                tempProductIds.push({
                                    product_id: oi.product_id,
                                    product_duration: oi.sycu_product.product_duration,
                                    ministry_type: oi.sycu_product.ministry_type,
                                    category_id: oi.sycu_product.category_id,
                                    status: s.subscription_status
                                });
                            }
                        });
                    }
                });
            });

            tempProductIds = JSON.parse(JSON.stringify(tempProductIds))
            tempProductIds.filter((g: any) => {
                if (g.status == 2 || g.product_duration == 365) {
                    refundProductIds = refundProductIds.filter((e: any, i: any) => {
                        if (!(g.category_id == e.category_id && g.ministry_type == e.ministry_type)) {
                            return true
                        }
                    })
                } else if (g.status == 5 && g.product_duration == 90) {
                    let pc = tempProductIds.filter((u: any) => u.category_id == g.category_id && u.ministry_type == g.ministry_type).length
                    if (pc >= 4) {
                        refundProductIds = refundProductIds.filter((e: any, i: any) => {
                            if (!(g.category_id == e.category_id && g.ministry_type == e.ministry_type)) {
                                return true
                            }
                        })
                    }
                } else if (g.status == 5 && g.product_duration == 30) {
                    let pc = tempProductIds.filter((u: any) => u.category_id == g.category_id && u.ministry_type == g.ministry_type).length
                    if (pc >= 12) {
                        refundProductIds = refundProductIds.filter((e: any, i: any) => {
                            if (!(g.category_id == e.category_id && g.ministry_type == e.ministry_type)) {
                                return true
                            }
                        })
                    }
                }
            });

            let data = await dbReader.userMemberships.findAndCountAll({
                where: dbReader.Sequelize.and(
                    { is_deleted: 0 },
                    { user_id: userId },
                    { status: { [dbReader.Sequelize.Op.ne]: 1 } },
                ),
                attributes: ['user_membership_id', 'status'],
                include: [{
                    attributes: ["membership_id", "membership_name"],
                    model: dbReader.membership,
                    where: { is_deleted: 0 },
                    include: [{
                        model: dbReader.sites,
                        attributes: ["logo"],
                    }, {
                        separate: true,
                        model: dbReader.membershipProduct,
                        attributes: ['membership_product_id'],
                        where: { is_deleted: 0 },
                        include: [{
                            model: dbReader.products,
                            attributes: ['product_id', 'product_name', 'product_duration', 'category_id', 'ministry_type'],
                            where: { is_deleted: 0 },
                        }]
                    }]
                }],
                limit: rowLimit,
                offset: rowOffset,
                order: [[sortField, sortOrder]]
            });
            data = JSON.parse(JSON.stringify(data));
            data.rows.forEach((element: any) => {
                if (!element.sycu_membership.sycu_membership_products.some((p: any) =>
                    refundProductIds.some((s: any) => s.product_id == p.sycu_product.product_id))) {
                    // element.membership_name = element.sycu_membership.membership_name;
                    // element.site_logo = (element.sycu_membership.sycu_site) ? element.sycu_membership.sycu_site.logo : '';
                    // delete element.sycu_membership;
                    userMemberships.push(element);
                }
                element.membership_name = element.sycu_membership.membership_name;
                element.site_logo = (element.sycu_membership.sycu_site) ? element.sycu_membership.sycu_site.logo : '';
                delete element.sycu_membership;
            });

            let message = data.count > 0 ? EC.success : EC.noDataFound;
            new SuccessResponse(message, {
                //@ts-ignore
                token: req.token,
                count: data.count,
                rows: data.rows
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getUserAccountMemberships(req: any, res: any) {
        try {
            let { user_id } = req;
            let data = await dbReader.userMemberships.findAndCountAll({
                where: dbReader.Sequelize.and(
                    { is_deleted: 0 },
                    { user_id: user_id },
                    { status: 2 },
                ),
                attributes: ['user_membership_id'],
                include: [{
                    attributes: ["membership_name", [dbReader.Sequelize.literal('`sycu_membership->sycu_site`.`logo`'), 'site_logo']],
                    model: dbReader.membership,
                    where: { is_deleted: 0 },
                    include: [{
                        model: dbReader.sites,
                        attributes: [],
                    }]
                }],
            });

            data = JSON.parse(JSON.stringify(data));
            data.rows.forEach((element: any) => {
                element.membership_name = element.sycu_membership.membership_name;
                element.site_logo = element.sycu_membership.site_logo;
                delete element.sycu_membership;
            });

            let message = data.count > 0 ? EC.success : EC.noDataFound;
            new SuccessResponse(message, {
                //@ts-ignore
                token: req.token,
                count: data.count,
                rows: data.rows
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async bulkUpdateMembershipStatus(req: any, res: any) {
        try {
            let { user_membership_ids = [], status = 0 } = req.body;
            //@ts-ignore
            let { user_id, display_name } = req;
            let notes: any = [], array: any = [];
            if (user_membership_ids.length > 0 && status > 0) {
                await dbWriter.userMemberships.update({
                    status: status,
                }, {
                    where: { user_membership_id: user_membership_ids }
                });
                let data = await dbReader.userMemberships.findAll({
                    where: { user_membership_id: user_membership_ids },
                    include: [{
                        model: dbReader.membership,
                        where: { is_deleted: 0 }
                    }]
                })
                if (data) {
                    data = JSON.parse(JSON.stringify(data))
                    data.forEach((e: any) => {
                        if (e.user_subscription_id != 0) {
                            notes.push({
                                type: 2,//Subscription
                                event_type_id: e.user_subscription_id,
                                message: "" + e.sycu_membership.membership_name + " Membership Status updated by admin (" + display_name + ") .",
                            })
                        } else {
                            notes.push({
                                type: 3,
                                event_type_id: user_id,
                                message: "" + e.sycu_membership.membership_name + " Membership Status updated by admin (" + display_name + ") ."
                            })
                        }
                    });
                    await dbWriter.notes.bulkCreate(notes)
                }
                new SuccessResponse("Status changed successfully.", {
                    //@ts-ignore
                    token: req.token
                }).send(res);
            } else {
                throw new Error(EC.errorMessage("Please provide appropriate data."));
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
}