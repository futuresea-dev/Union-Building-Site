import { Request, Response } from "express";
import { ErrorController, SuccessResponse, BadRequestError, ApiError } from '../core/index';
import { enumerationController } from '../controllers/enumerationController';
const { dbReader, dbWriter } = require('../models/dbConfig');
const EC = new ErrorController();
const EnumObject = new enumerationController();
const { Op } = dbReader.Sequelize;

export class PaymentServicesController {
    /*
    * Code done by Sh - 24-11-2021
    * For getting sites and payment services detail from database
    * perform crud operations for sycu_sites_payment_gateway
    */

    // List out sites detail
    public async listSite(req: Request, res: Response) {
        try {
            // Fetch sites, affiliate count, and subscribed user count concurrently
            const [sitesData, affiliateCount, countSubscribed, appVisitHistoryData] = await Promise.all([
                dbReader.sites.findAndCountAll({
                    where: { is_display: 1 },
                    raw: true
                }),
                dbReader.affiliates.count({
                    attributes: ['affiliate_id'],
                    where: { is_deleted: 0 },
                    include: [{
                        required: true,
                        attributes: [],
                        model: dbReader.users,
                        where: { user_role: 3, is_deleted: 0 }
                    }]
                }),
                dbReader.userSubscription.findAll({
                    where: { subscription_status: { [dbReader.Sequelize.Op.in]: [2, 4] } },
                    attributes: ['site_id', [dbReader.Sequelize.fn('count', dbReader.Sequelize.col('user_id')), 'user_count']],
                    group: ['site_id'],
                    raw: true
                }),
                dbReader.appVisitHistory.findAll({
                    attributes: ['site_id', 'user_id'],
                    include: [{
                        model: dbReader.users,
                        where: { user_role: 3, is_deleted: 0 },
                        attributes: []
                    }],
                    group: ['site_id', '`sycu_app_visit_history`.`user_id`'],
                    raw: true
                })
            ]);

            // Convert countSubscribed to a map for quick lookups
            const countSubscribedMap = countSubscribed.reduce((acc: { [siteId: number]: number }, sub: any) => {
                acc[sub.site_id] = sub.user_count;
                return acc;
            }, {});

            // Aggregate app visit history counts
            const appVisitHistoryCounts = appVisitHistoryData.reduce((acc: { [siteId: number]: number }, data: any) => {
                acc[data.site_id] = (acc[data.site_id] || 0) + 1;
                return acc;
            }, {});

            // Prepare final response data
            const finalSitesData = sitesData.rows.map((site: any) => {
                const siteId = site.site_id;
                return {
                    ...site,
                    site_user: [
                        {
                            type: "Users",
                            count: siteId === 8 ? affiliateCount : (appVisitHistoryCounts[siteId] || 0),
                        },
                        {
                            type: "Subscribed",
                            count: countSubscribedMap[siteId] || 0,
                        },
                        {
                            type: "Online",
                            count: 0, // Modify if online counts are to be included
                        }
                    ]
                };
            });

            // Send the final response
            new SuccessResponse(EC.listOfData, {
                //@ts-ignore
                token: req.token,
                data: { ...sitesData, rows: finalSitesData },
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    // public async listSiteBySiteId(req: Request, res: Response) {
    //     try {
    //         const { site_id } = req.body;

    //         if (!site_id) {
    //             // return new BadRequestError('site_id is required');
    //             throw new BadRequestError('site_id is required');
    //         }

    //         let sitesData = await dbReader.sites.findAndCountAll({
    //             where: { is_display: 1, site_id: site_id }
    //         });
    //         if (!sitesData) {
    //             // return new BadRequestError('site_id is required');
    //             throw new BadRequestError('site_id not found');
    //         }
    //         sitesData = JSON.parse(JSON.stringify(sitesData));

    //         let appVisitHistoryData = await dbReader.appVisitHistory.findAll({
    //             where: { site_id: site_id },
    //             attributes: [
    //                 [dbReader.Sequelize.fn('count', dbReader.Sequelize.fn('DISTINCT', dbReader.Sequelize.col('`sycu_app_visit_history`.`user_id`'))), 'user_count'],
    //                 'site_id'
    //             ],
    //             include: [{
    //                 model: dbReader.users,
    //                 where: { user_role: 3, is_deleted:0 },
    //                 attributes: []
    //             }],
    //             group: [dbReader.Sequelize.col('site_id')]
    //         });
    //         let appLoginHistoryData = await dbReader.appVisitHistory.findAll({
    //             where: { is_online: 1, site_id: site_id },
    //             attributes: [
    //                 [dbReader.Sequelize.fn('count', dbReader.Sequelize.fn('DISTINCT', dbReader.Sequelize.col('`sycu_app_visit_history`.`user_id`'))), 'user_count'],
    //                 'site_id'
    //             ],
    //             include: [{
    //                 model: dbReader.users,
    //                 where: { user_role: 3 , is_deleted:0},
    //                 attributes: []
    //             }],
    //             group: [dbReader.Sequelize.col('site_id')]
    //         });
    //         let affiliateCount = await dbReader.affiliates.count({

    //             where: {
    //                 is_deleted: 0
    //             },
    //             include: [{
    //                 required: true,
    //                 model: dbReader.users,
    //                 where: { user_role: 3, is_deleted: 0 }
    //             }]
    //         });
    //         appVisitHistoryData = JSON.parse(JSON.stringify(appVisitHistoryData));
    //         appLoginHistoryData = JSON.parse(JSON.stringify(appLoginHistoryData));
    //         let countSubscribed = await dbReader.userSubscription.findAll({
    //             where: { subscription_status: { [Op.in]: [2, 4] } , site_id: site_id},
    //             attributes: ['site_id', [dbReader.Sequelize.fn('count', dbReader.Sequelize.literal('user_id')), 'user_count']],
    //             group: ['site_id']
    //         });
    //         countSubscribed = JSON.parse(JSON.stringify(countSubscribed));
    //         sitesData.rows.forEach((element: any) => {
    //             element.site_user = [{
    //                 type: "Users",
    //                 count: (element.site_id == 8) ? affiliateCount : (appVisitHistoryData.some((s: any) => s.site_id == element.site_id)) ? appVisitHistoryData.find((s: any) => s.site_id == element.site_id).user_count : 0,
    //             }, {
    //                 type: "Subscribed",
    //                 count: (countSubscribed.some((s: any) => s.site_id == element.site_id)) ? countSubscribed.find((s: any) => s.site_id == element.site_id).user_count : 0,
    //             }, {
    //                 type: "Online",
    //                 count: (appLoginHistoryData.some((s: any) => s.site_id == element.site_id)) ? appLoginHistoryData.find((s: any) => s.site_id == element.site_id).user_count : 0,
    //             }]
    //         });
    //         new SuccessResponse(EC.listOfData, {
    //             //@ts-ignore
    //             token: req.token,
    //             data: sitesData,
    //         }).send(res);
    //     } catch (e: any) {
    //         ApiError.handle(new BadRequestError(e.message), res);
    //     }
    // }

    public async listSiteBySiteId(req: Request, res: Response) {
        try {
            const { site_id } = req.body;

            if (!site_id) {
                throw new BadRequestError('site_id is required');
            }

            const siteDataPromise = dbReader.sites.findAndCountAll({
                where: { is_display: 1, site_id: site_id }
            });

            const appVisitHistoryPromise = dbReader.appVisitHistory.findAll({
                where: { site_id: site_id },
                attributes: [
                    [dbReader.Sequelize.fn('count', dbReader.Sequelize.fn('DISTINCT', dbReader.Sequelize.col('`sycu_app_visit_history`.`user_id`'))), 'user_count'],
                    'site_id'
                ],
                include: [{
                    model: dbReader.users,
                    where: { user_role: 3, is_deleted: 0 },
                    attributes: []
                }],
                group: [dbReader.Sequelize.col('site_id')]
            });

            const appLoginHistoryPromise = dbReader.appVisitHistory.findAll({
                where: { is_online: 1, site_id: site_id },
                attributes: [
                    [dbReader.Sequelize.fn('count', dbReader.Sequelize.fn('DISTINCT', dbReader.Sequelize.col('`sycu_app_visit_history`.`user_id`'))), 'user_count'],
                    'site_id'
                ],
                include: [{
                    model: dbReader.users,
                    where: { user_role: 3, is_deleted: 0 },
                    attributes: []
                }],
                group: [dbReader.Sequelize.col('site_id')]
            });

            const affiliateCountPromise = dbReader.affiliates.count({
                where: { is_deleted: 0 },
                include: [{
                    required: true,
                    model: dbReader.users,
                    where: { user_role: 3, is_deleted: 0 }
                }]
            });

            const countSubscribedPromise = dbReader.userSubscription.findAll({
                where: { subscription_status: { [Op.in]: [2, 4] }, site_id: site_id },
                attributes: ['site_id', [dbReader.Sequelize.fn('count', dbReader.Sequelize.literal('user_id')), 'user_count']],
                group: ['site_id']
            });

            const [siteData, appVisitHistoryData, appLoginHistoryData, affiliateCount, countSubscribed] = await Promise.all([
                siteDataPromise, appVisitHistoryPromise, appLoginHistoryPromise, affiliateCountPromise, countSubscribedPromise
            ]);

            if (!siteData) {
                throw new BadRequestError('site_id not found');
            }

            const sitesData = JSON.parse(JSON.stringify(siteData));
            const visitData = JSON.parse(JSON.stringify(appVisitHistoryData));
            const loginData = JSON.parse(JSON.stringify(appLoginHistoryData));
            const subscribedData = JSON.parse(JSON.stringify(countSubscribed));

            sitesData.rows.forEach((element: any) => {
                element.site_user = [{
                    type: "Users",
                    count: (element.site_id == 8) ? affiliateCount : (visitData.some((s: any) => s.site_id == element.site_id)) ? visitData.find((s: any) => s.site_id == element.site_id).user_count : 0,
                }, {
                    type: "Subscribed",
                    count: (subscribedData.some((s: any) => s.site_id == element.site_id)) ? subscribedData.find((s: any) => s.site_id == element.site_id).user_count : 0,
                }, {
                    type: "Online",
                    count: (loginData.some((s: any) => s.site_id == element.site_id)) ? loginData.find((s: any) => s.site_id == element.site_id).user_count : 0,
                }];
            });

            new SuccessResponse(EC.listOfData, {
                //@ts-ignore
                token: req.token,
                data: sitesData,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }


    public async listSiteWithoutUserCount(req: Request, res: Response) {
        try {

            const { site_id } = req.body;

            if (!site_id) {
                // return new BadRequestError('site_id is required');
                throw new BadRequestError('site_id is required');
            }

            let sitesData = await dbReader.sites.findAndCountAll({
                where: { is_display: 1, site_id: site_id }
            });
            if (!sitesData) {
                // return new BadRequestError('site_id is required');
                throw new BadRequestError('site_id not found');
            }
            sitesData = JSON.parse(JSON.stringify(sitesData));

            new SuccessResponse(EC.listOfData, {
                //@ts-ignore
                token: req.token,
                data: sitesData,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async listSiteForSeriesEditor(req: Request, res: Response) {
        try {
            let sitesData = await dbReader.sites.findAndCountAll({
                where: { is_display: 1 }
            });
            sitesData = JSON.parse(JSON.stringify(sitesData));

            // let appVisitHistoryData = await dbReader.appVisitHistory.findAll({
            //     attributes: [
            //         [dbReader.Sequelize.fn('count', dbReader.Sequelize.fn('DISTINCT', dbReader.Sequelize.col('`sycu_app_visit_history`.`user_id`'))), 'user_count'],
            //         'site_id'
            //     ],
            //     include: [{
            //         model: dbReader.users,
            //         where: { user_role: 3, is_deleted:0 },
            //         attributes: []
            //     }],
            //     group: [dbReader.Sequelize.col('site_id')]
            // });
            // let appLoginHistoryData = await dbReader.appVisitHistory.findAll({
            //     where: { is_online: 1 },
            //     attributes: [
            //         [dbReader.Sequelize.fn('count', dbReader.Sequelize.fn('DISTINCT', dbReader.Sequelize.col('`sycu_app_visit_history`.`user_id`'))), 'user_count'],
            //         'site_id'
            //     ],
            //     include: [{
            //         model: dbReader.users,
            //         where: { user_role: 3 , is_deleted:0},
            //         attributes: []
            //     }],
            //     group: [dbReader.Sequelize.col('site_id')]
            // });

            // appVisitHistoryData = JSON.parse(JSON.stringify(appVisitHistoryData));
            // appLoginHistoryData = JSON.parse(JSON.stringify(appLoginHistoryData));
            // let countSubscribed = await dbReader.userSubscription.findAll({
            //     where: { subscription_status: { [Op.in]: [2, 4] } },
            //     attributes: ['site_id', [dbReader.Sequelize.fn('count', dbReader.Sequelize.literal('user_id')), 'user_count']],
            //     group: ['site_id']
            // });
            // countSubscribed = JSON.parse(JSON.stringify(countSubscribed));

            new SuccessResponse(EC.listOfData, {
                //@ts-ignore
                token: req.token,
                data: sitesData,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    // List out sites detail
    public async updateSite(req: Request, res: Response) {
        try {
            let reqBody = req.body;
            await dbWriter.sites.update({
                title: reqBody.title,
                url: reqBody.url,
                description: reqBody.description || "",
                logo: reqBody.logo || "",
                small_logo: reqBody.small_logo || "",
                color_code: reqBody.color_code || "",
            }, {
                where: { site_id: reqBody.site_id }
            });

            new SuccessResponse(EC.errorMessage(EC.saveDataSuccess, ["site"]), {
                //@ts-ignore
                token: req.token,
                site: true
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    // List out particular site detail
    public async getSiteDetail(req: Request, res: Response) {
        try {
            const siteData = await dbReader.sites.findOne({ where: { site_id: req.params.id } });
            new SuccessResponse(EC.listOfData, {
                //@ts-ignore
                token: req.token,
                data: {
                    rows: siteData
                },
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    // List out master payment services detail
    public async listMasterPaymentService(req: Request, res: Response) {
        try {
            const paymentServicesData = await dbReader.masterPaymentServices.findAndCountAll({});
            new SuccessResponse(EC.listOfData, {
                //@ts-ignore
                token: req.token,
                data: paymentServicesData,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    // List out particular master payment services detail by id
    public async getMasterPaymentServiceDetail(req: Request, res: Response) {
        try {
            const paymentServicesDetail = await dbReader.masterPaymentServices.findOne({
                where: { payment_service_id: req.params.id }
            });
            new SuccessResponse(EC.listOfData, {
                //@ts-ignore
                token: req.token,
                data: {
                    rows: paymentServicesDetail
                },
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    // Add payment service into database
    public async addPaymentService(req: Request, res: Response) {
        try {
            let { site_id, payment_service_id, auth_json, site_payment_service_id } = req.body;
            let addedGateway = {
                site_payment_service_id: site_payment_service_id || 0,
                site_id: site_id,
                payment_service_id: payment_service_id,
                auth_json: JSON.stringify(auth_json),
                is_deleted: 0
            };
            if (site_payment_service_id) {
                let existData = await dbReader.sitePaymentServices.findOne({
                    where: { site_payment_service_id: site_payment_service_id },
                    attributes: ['auth_json']
                });
                existData = JSON.parse(JSON.stringify(existData));
                if (existData) {
                    let exist_auth_json = JSON.parse(existData.auth_json);
                    switch (payment_service_id) {
                        case 1:
                            if (exist_auth_json.stripe_secret_key != auth_json.stripe_secret_key) {
                                await dbWriter.userCard.update({
                                    delete_reason: 'Due to payment method change',
                                    updated_datetime: new Date(),
                                    is_deleted: 1
                                }, {
                                    where: { site_id: site_id }
                                })
                            }
                            break;
                        default:
                            break;
                    }
                }
                await dbWriter.sitePaymentServices.update({
                    site_id: site_id,
                    payment_service_id: payment_service_id,
                    auth_json: JSON.stringify(auth_json),
                    updated_datetime: new Date()
                }, {
                    where: { site_payment_service_id: site_payment_service_id }
                });
            } else {
                addedGateway = await dbWriter.sitePaymentServices.create({
                    site_id: site_id,
                    payment_service_id: payment_service_id,
                    auth_json: JSON.stringify(auth_json),
                    is_deleted: 0,
                    created_datetime: new Date(),
                    updated_datetime: null
                });
            }
            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token,
                data: addedGateway
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    // Update payment services into database
    public async updatePaymentService(req: Request, res: Response) {
        try {
            let sitePaymentGatewayId = req.body.site_payment_service_id;
            delete req.body.site_payment_service_id;
            if (req.body.auth_json != "" && req.body.auth_json != 'undefined' && req.body.auth_json != null) {
                req.body.auth_json = JSON.stringify(req.body.auth_json);
            }
            dbWriter.sitePaymentServices.update(
                req.body,
                { where: { site_payment_service_id: sitePaymentGatewayId } }
            );
            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token,
                data: ''
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    //List payment services from database
    public async listPaymentService(req: Request, res: Response) {
        try {
            let { site_id } = req.params;
            const sitePaymentGatewayData = await dbReader.sitePaymentServices.findOne({
                attributes: ['site_payment_service_id', 'site_id', [dbReader.Sequelize.literal('title'), 'site_title'],
                    'payment_service_id', [dbReader.Sequelize.literal('service_name'), 'Payment_service_name'], 'auth_json',
                    'is_deleted', 'created_datetime', 'updated_datetime'],
                where: { is_deleted: 0, site_id: site_id },
                include: [{
                    model: dbReader.sites,
                }, {
                    model: dbReader.masterPaymentServices,
                }]
            });
            new SuccessResponse(EC.listOfData, {
                //@ts-ignore
                token: req.token,
                data: sitePaymentGatewayData
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    //List particular payment service by id from database
    public async getPaymentServiceDetail(req: Request, res: Response) {
        try {
            const sitePaymentGatewayById = await dbReader.sitePaymentServices.findOne({
                attributes: ['site_payment_service_id', 'site_id', [dbReader.Sequelize.literal('title'), 'site_title'],
                    'payment_service_id', [dbReader.Sequelize.literal('service_name'), 'Payment_service_name'], 'auth_json',
                    'is_deleted', 'created_datetime', 'updated_datetime'],
                include: [
                    {
                        model: dbReader.sites,
                    },
                    {
                        model: dbReader.masterPaymentServices,
                    }
                ],
                where: { is_deleted: 0, site_payment_service_id: req.params.id }
            });
            new SuccessResponse(EC.listOfData, {
                //@ts-ignore
                token: req.token,
                data: {
                    rows: sitePaymentGatewayById
                },
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    //Delete site payment gateway from database
    public async deleteSitePaymentService(req: Request, res: Response) {
        try {
            let { site_payment_service_id } = req.params
            await dbWriter.sitePaymentServices.update({
                is_deleted: 1,
                updated_date: new Date(),
            }, {
                where: { site_payment_service_id: site_payment_service_id }
            });
            new SuccessResponse(EC.deleteDataSuccess, {
                //@ts-ignore
                token: req.token
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
}
