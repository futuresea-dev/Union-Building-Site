import { Request, Response } from 'express';
import { ErrorController, SuccessResponse, BadRequestError, ApiError } from '../../core/index';
import { getDateRange } from '../../helpers/helpers';
import moment from "moment";
import { enumerationController } from '../enumerationController';
const { dbReader } = require('../../models/dbConfig');
const { Op } = dbReader.Sequelize;
const EC = new ErrorController();
var EnumObject = new enumerationController();

export class SubscriptionAnalyticsController {
    // SH 25-05-22
    // public getSubscriptionCount = async (req: Request, res: Response) => {
    //     try {
    //         let { site_id } = req.body
    //         let subscription_status: any = {
    //             2: "active",
    //             3: "on_hold",
    //             4: "pending_cancellation",
    //             5: "cancelled",
    //             10: "pending_cancellation_paymentcyclenotcompleted"
    //         }
    //         let siteCondition = {}, membershipCondition = {};
    //         if (site_id != 0) {
    //             siteCondition = { subscription_status: { [Op.in]: [2, 3, 4, 5,10] }, site_id: site_id };
    //             membershipCondition = { is_deleted: 0, status: 2, site_id: site_id };
    //         } else {
    //             siteCondition = { subscription_status: { [Op.in]: [2, 3, 4, 5,10] } };
    //             membershipCondition = { is_deleted: 0, status: 2 };
    //         }
    //         let subscriptionCountData = await dbReader.userSubscription.findAll({
    //             attributes: ['subscription_status',
    //                 [dbReader.Sequelize.fn('COUNT', dbReader.Sequelize.literal('user_subscription_id')), 'status_count']
    //             ],
    //             group: ['subscription_status'],
    //             where: siteCondition
    //         });
    //         let membershipData = await dbReader.userMemberships.count({
    //             where: membershipCondition,
    //             include: [{
    //                 required: true,
    //                 attributes: [],
    //                 model: dbReader.users,
    //                 where: { is_deleted: 0, user_role: 3 }
    //             }],
    //             group: ['user_id'],
    //         })
    //         if (subscriptionCountData.length > 0) {
    //             subscriptionCountData = JSON.parse(JSON.stringify(subscriptionCountData));
    //             let data: any = {};
    //             for (let i = 0; i < subscriptionCountData.length; i++) {
    //                 data[subscription_status[subscriptionCountData[i].subscription_status]] = subscriptionCountData[i].status_count
    //             }
    //             data["pending_cancellation"] = data["pending_cancellation"] + data["pending_cancellation_paymentcyclenotcompleted"]
    //             data["active"] = data["active"] + data["pending_cancellation"] ;
    //             new SuccessResponse(EC.errorMessage(EC.getMessage, ["Subscription Count"]), { // @ts-ignore
    //                 token: req.token,
    //                 ...data,
    //                 membership_count: data["active"] - data["pending_cancellation"],
    //             }).send(res);
    //         } else new SuccessResponse(EC.noDataFound, { // @ts-ignore
    //             token: req.token,
    //             data: {}
    //         }).send(res);
    //     } catch (e: any) {
    //         ApiError.handle(new BadRequestError(e.message), res);
    //     }
    // }
    //     public getSubscriptionCount = async (req: Request, res: Response) => {
    //         try {
    //             let { site_id } = req.body
    //             let subscription_status: any = {
    //                 2: "active",
    //                 3: "on_hold",
    //                 4: "pending_cancellation",
    //                 5: "cancelled",

    //             }


    //       let ActivesubscriptionCountData = await dbReader.userMemberships.findAll({
    //         attributes: ['user_id', 'membership_id'],
    //         where: {
    //             site_id: site_id,
    //             is_deleted: 0,
    //             status: [2, 4, 5, 10]
    //         },
    //         include: [{
    //             model: dbReader.users,
    //             attributes: ['user_id'],
    //             where: { is_deleted: 0 ,status: 1}
    //         }, {
    //             model: dbReader.membershipProduct,
    //             attributes: ['membership_product_id'],
    //             where: { is_deleted: 0 },
    //             include: [{
    //                 model: dbReader.products,
    //                 attributes: ['product_id', 'product_duration', 'ministry_type', 
    //                 //'product_duration_type'
    //               ],
    //                 where: { is_deleted: 0, product_duration: [30, 90, 365],ministry_type: [1,2,3],
    //                     category_id: [341,256,EnumObject.categoryIDEnum.get('musicCategoryId').value,2,3,4,5,6] ,
    //                   }
    //             }]
    //         }],
    //         group: ['user_id', 'membership_id']
    //     });

    //     ActivesubscriptionCountData = JSON.parse(JSON.stringify(ActivesubscriptionCountData));
    //     let Notfullrefundcount = await dbReader.userOrder.findAll({
    //       attributes: ['user_orders_id','user_id'],
    //       where: {
    //         order_status: [2,4,5,10],
    //         site_id: site_id
    //       },
    //       include:[{
    //         model:dbReader.refunds,
    //         attributes:['refund_id','user_id'],
    //         where:{refund_type:[2,3]}
    //       }]

    //     })
    //     Notfullrefundcount = JSON.parse(JSON.stringify(Notfullrefundcount));

    //     // Extract user IDs from Notfullrefundcount
    // const refundUserIds = new Set(Notfullrefundcount.map((item:any) => item.user_id));

    // // Filter out subscriptionCountData based on refundUserIds
    // ActivesubscriptionCountData = ActivesubscriptionCountData.filter((item:any) => !refundUserIds.has(item.user_id));

    //             //   let OnholdsubscriptionCountData = await dbReader.userMemberships.findAll({


    //             //     attributes: ['user_id', 'membership_id'],
    //             //     where: {
    //             //       site_id: site_id,
    //             //       is_deleted: 0,
    //             //       status: 3
    //             //     },
    //             //     include: [{
    //             //       model: dbReader.users,
    //             //       attributes: ['user_id'],
    //             //       where: { is_deleted: 0 }
    //             //     }, {
    //             //       model: dbReader.membershipProduct,
    //             //       attributes: [],
    //             //       raw: true,
    //             //       where: { is_deleted: 0 },
    //             //       include: [{
    //             //         model: dbReader.products,
    //             //         attributes: [],
    //             //         raw: true,
    //             //         where: {
    //             //           is_deleted: 0, product_duration: [30, 90, 365]
    //             //           , ministry_type: [1, 2, 3],
    //             //           product_duration_type:[1,2,3,],
    //             //         }
    //             //       }]
    //             //     }],
    //             //     group: ['user_id', 'membership_id']
    //             //   });
    //             //   OnholdsubscriptionCountData = JSON.parse(JSON.stringify(OnholdsubscriptionCountData));


    //             let OnholdsubscriptionCountData = await dbReader.userMemberships.findAll({
    //                 attributes: ['user_id', 'membership_id'],
    //                 where: {
    //                     site_id: site_id,
    //                     is_deleted: 0,
    //                     status: 3
    //                 },
    //                 include: [{
    //                     model: dbReader.users,
    //                     attributes: ['user_id'],
    //                     where: { is_deleted: 0 ,status: 1}
    //                 }, {
    //                     model: dbReader.membershipProduct,
    //                     attributes: ['membership_product_id'],
    //                     where: { is_deleted: 0 },
    //                     include: [{
    //                         model: dbReader.products,
    //                         attributes: ['product_id', 'product_duration', 'ministry_type', 
    //                         //'product_duration_type'
    //                       ],
    //                         where: { is_deleted: 0, product_duration: [30, 90, 365],ministry_type: [1,2,3],
    //                           // product_duration_type: [1, 2, 3] 
    //                           }
    //                     }]
    //                 }],
    //                 group: ['user_id', 'membership_id']
    //             });

    //             OnholdsubscriptionCountData = JSON.parse(JSON.stringify(OnholdsubscriptionCountData));

    //             //   let PendingCancellationsubscriptionCountData = await dbReader.userMemberships.findAll({


    //             //     attributes: ['user_id', 'membership_id'],
    //             //     where: {
    //             //       site_id: site_id,
    //             //       is_deleted: 0,
    //             //       status: [4,10]
    //             //     },
    //             //     include: [{
    //             //       model: dbReader.users,
    //             //       attributes: ['user_id'],
    //             //       where: { is_deleted: 0 }
    //             //     }, {
    //             //       model: dbReader.membershipProduct,
    //             //       attributes: [],
    //             //       raw: true,
    //             //       where: { is_deleted: 0 },
    //             //       include: [{
    //             //         model: dbReader.products,
    //             //         attributes: [],
    //             //         raw: true,
    //             //         where: {
    //             //           is_deleted: 0, product_duration: [30, 90, 365]
    //             //           , ministry_type: [1, 2, 3],
    //             //           product_duration_type:[1,2,3,],
    //             //         }
    //             //       }]
    //             //     }],
    //             //     group: ['user_id', 'membership_id']
    //             //   });
    //             //   PendingCancellationsubscriptionCountData = JSON.parse(JSON.stringify(PendingCancellationsubscriptionCountData));

    //             let PendingCancellationsubscriptionCountData = await dbReader.userMemberships.findAll({
    //                 attributes: ['user_id', 'membership_id'],
    //                 where: {
    //                     site_id: site_id,
    //                 //    is_deleted: 0,
    //                     status: [4, 10]
    //                 },
    //                 include: [{
    //                     model: dbReader.users,
    //                     attributes: ['user_id'],
    //                     where: { is_deleted: 0 }
    //                 }, {
    //                     model: dbReader.membershipProduct,
    //                     attributes: ['membership_product_id'],
    //                     where: { is_deleted: 0 },
    //                     include: [{
    //                         model: dbReader.products,
    //                         attributes: ['product_id', 'product_duration', 'ministry_type', 
    //                         //'product_duration_type'
    //                       ],
    //                         where: { is_deleted: 0, product_duration: [30, 90, 365],ministry_type: [1,2,3],
    //                           // product_duration_type: [1, 2, 3] 
    //                           }
    //                     }]
    //                 }],
    //                 group: ['user_id', 'membership_id']
    //             });

    //             PendingCancellationsubscriptionCountData = JSON.parse(JSON.stringify(PendingCancellationsubscriptionCountData));

    //             // let CancelledsubscriptionCountData = await dbReader.userMemberships.findAll({


    //             //     attributes: ['user_id', 'membership_id'],
    //             //     where: {
    //             //       site_id: site_id,
    //             //       is_deleted: 0,
    //             //       status: 5
    //             //     },
    //             //     include: [{
    //             //       model: dbReader.users,
    //             //       attributes: ['user_id'],
    //             //       where: { is_deleted: 0 }
    //             //     }, {
    //             //       model: dbReader.membershipProduct,
    //             //       attributes: [],
    //             //       raw: true,
    //             //       where: { is_deleted: 0 },
    //             //       include: [{
    //             //         model: dbReader.products,
    //             //         attributes: [],
    //             //         raw: true,
    //             //         where: {
    //             //           is_deleted: 0, product_duration: [30, 90, 365]
    //             //           , ministry_type: [1, 2, 3],
    //             //           product_duration_type:[1,2,3,],
    //             //         }
    //             //       }]
    //             //     }],
    //             //     group: ['user_id', 'membership_id']
    //             //   });
    //             //   CancelledsubscriptionCountData = JSON.parse(JSON.stringify(CancelledsubscriptionCountData));

    //             let CancelledsubscriptionCountData = await dbReader.userMemberships.findAll({
    //                 attributes: ['user_id', 'membership_id'],
    //                 where: {
    //                     site_id: site_id,
    //                     is_deleted: 0,
    //                     status: 5
    //                 },
    //                 include: [{
    //                     model: dbReader.users,
    //                     attributes: ['user_id'],
    //                     where: { is_deleted: 0 ,status: 1}
    //                 }, {
    //                     model: dbReader.membershipProduct,
    //                     attributes: ['membership_product_id'],
    //                     where: { is_deleted: 0 },
    //                     include: [{
    //                         model: dbReader.products,
    //                         attributes: ['product_id', 'product_duration', 'ministry_type', 
    //                         //'product_duration_type'
    //                       ],
    //                         where: { is_deleted: 0, product_duration: [30, 90, 365],ministry_type: [1,2,3],
    //                           // product_duration_type: [1, 2, 3] 
    //                           }
    //                     }]
    //                 }],
    //                 group: ['user_id', 'membership_id']
    //             });

    //             CancelledsubscriptionCountData = JSON.parse(JSON.stringify(CancelledsubscriptionCountData));

    //             let fullrefundcount = await dbReader.userOrder.findAll({
    //                 attributes: ['user_orders_id','user_id'],
    //                 where: {
    //                   order_status: [2,4,5,10],
    //                   site_id: site_id
    //                 },
    //                 include:[{
    //                   model:dbReader.refunds,
    //                   attributes:['refund_id','user_id'],
    //                   where:{refund_type:1}
    //                 }]

    //               })
    //               fullrefundcount = JSON.parse(JSON.stringify(fullrefundcount));

    //              // Extract user IDs from fullrefundcount
    // const refundUserId = new Set(fullrefundcount.map((item:any) => item.user_id));

    // // Filter CancelledsubscriptionCountData to only include user IDs present in refundUserIds
    // CancelledsubscriptionCountData = CancelledsubscriptionCountData.filter((item:any) => refundUserId.has(item.user_id));





    //             if (ActivesubscriptionCountData.length > 0) {
    //                // subscriptionCountData = JSON.parse(JSON.stringify(subscriptionCountData));
    //                 let data: any = {};
    //                 for (let i = 0; i < ActivesubscriptionCountData.length; i++) {
    //                     data[subscription_status[ActivesubscriptionCountData[i].subscription_status]] = ActivesubscriptionCountData[i].status_count
    //                 }
    //                 data["on_hold"]= OnholdsubscriptionCountData.length
    //                 data["pending_cancellation"] = PendingCancellationsubscriptionCountData.length
    //                 data["active"] = ActivesubscriptionCountData.length ;
    //                 data["cancelled"]= CancelledsubscriptionCountData.length
    //                 new SuccessResponse(EC.errorMessage(EC.getMessage, ["Subscription Count"]), { // @ts-ignore
    //                     token: req.token,
    //                     ...data,
    //                     membership_count: data["active"] - data["pending_cancellation"] ,

    //                 }).send(res);
    //             } else new SuccessResponse(EC.noDataFound, { // @ts-ignore
    //                 token: req.token,
    //                 data: {}
    //             }).send(res);
    //         } catch (e: any) {
    //             ApiError.handle(new BadRequestError(e.message), res);
    //         }
    //     }

    public getSubscriptionCount = async (req: Request, res: Response) => {
        try {
            let { site_id } = req.body
            let subscription_status: any = {
                2: "active",
                3: "on_hold",
                4: "pending_cancellation",
                5: "cancelled",
                6: "expired",
                7: "completed"

            }


            let ActivesubscriptionCountData = await dbReader.userMemberships.findAll({
                attributes: ['user_id', 'membership_id'],
                where: {
                    site_id: site_id,
                    is_deleted: 0,
                    status: [2, 4, 10]
                },
                include: [{
                    model: dbReader.users,
                    attributes: ['user_id'],
                    where: { is_deleted: 0, status: 1 }
                }, {
                    model: dbReader.membershipProduct,
                    attributes: ['membership_product_id'],
                    where: { is_deleted: 0 },
                    include: [{
                        model: dbReader.products,
                        attributes: ['product_id', 'product_duration', 'ministry_type',
                            //'product_duration_type'
                        ],
                        where: {
                            is_deleted: 0, product_duration: [30, 90, 365], ministry_type: [1, 2, 3],
                            category_id: [341, 256, EnumObject.categoryIDEnum.get('musicCategoryId').value, 2, 3, 4, 5, 6],
                        }
                    }]
                }],
                group: ['user_id', 'membership_id']
            });

            ActivesubscriptionCountData = JSON.parse(JSON.stringify(ActivesubscriptionCountData));

            let ExpiredsubscriptionCountData = await dbReader.userMemberships.findAll({
                attributes: ['user_id', 'membership_id'],
                where: {
                    site_id: site_id,
                    is_deleted: 0,
                    status: 6
                },
                include: [{
                    model: dbReader.users,
                    attributes: ['user_id'],
                    where: { is_deleted: 0, status: 1 }
                }, {
                    model: dbReader.membershipProduct,
                    attributes: ['membership_product_id'],
                    where: { is_deleted: 0 },
                    include: [{
                        model: dbReader.products,
                        attributes: ['product_id', 'product_duration', 'ministry_type',
                            //'product_duration_type'
                        ],
                        where: {
                            is_deleted: 0, product_duration: [30, 90, 365], ministry_type: [1, 2, 3],
                            category_id: [341, 256, EnumObject.categoryIDEnum.get('musicCategoryId').value, 2, 3, 4, 5, 6],
                        }
                    }]
                }],
                group: ['user_id', 'membership_id']
            });

            ExpiredsubscriptionCountData = JSON.parse(JSON.stringify(ExpiredsubscriptionCountData));

            let CompletedsubscriptionCountData = await dbReader.userMemberships.findAll({
                attributes: ['user_id', 'membership_id'],
                where: {
                    site_id: site_id,
                    is_deleted: 0,
                    status: 8
                },
                include: [{
                    model: dbReader.users,
                    attributes: ['user_id'],
                    where: { is_deleted: 0, status: 1 }
                }, {
                    model: dbReader.membershipProduct,
                    attributes: ['membership_product_id'],
                    where: { is_deleted: 0 },
                    include: [{
                        model: dbReader.products,
                        attributes: ['product_id', 'product_duration', 'ministry_type',
                            //'product_duration_type'
                        ],
                        where: {
                            is_deleted: 0, product_duration: [30, 90, 365], ministry_type: [1, 2, 3],
                            category_id: [341, 256, EnumObject.categoryIDEnum.get('musicCategoryId').value, 2, 3, 4, 5, 6],
                        }
                    }]
                }],
                group: ['user_id', 'membership_id']
            });

            CompletedsubscriptionCountData = JSON.parse(JSON.stringify(CompletedsubscriptionCountData));




            let OnholdsubscriptionCountData = await dbReader.userMemberships.findAll({
                attributes: ['user_id', 'membership_id'],
                where: {
                    site_id: site_id,
                    is_deleted: 0,
                    status: 3
                },
                include: [{
                    model: dbReader.users,
                    attributes: ['user_id'],
                    where: { is_deleted: 0, status: 1 }
                }, {
                    model: dbReader.membershipProduct,
                    attributes: ['membership_product_id'],
                    where: { is_deleted: 0 },
                    include: [{
                        model: dbReader.products,
                        attributes: ['product_id', 'product_duration', 'ministry_type',
                            //'product_duration_type'
                        ],
                        where: {
                            is_deleted: 0, product_duration: [30, 90, 365], ministry_type: [1, 2, 3],
                            // product_duration_type: [1, 2, 3] 
                        }
                    }]
                }],
                group: ['user_id', 'membership_id']
            });

            OnholdsubscriptionCountData = JSON.parse(JSON.stringify(OnholdsubscriptionCountData));



            let PendingCancellationsubscriptionCountData = await dbReader.userMemberships.findAll({
                attributes: ['user_id', 'membership_id'],
                where: {
                    site_id: site_id,
                    //    is_deleted: 0,
                    status: [4, 10]
                },
                include: [{
                    model: dbReader.users,
                    attributes: ['user_id'],
                    where: { is_deleted: 0 }
                }, {
                    model: dbReader.membershipProduct,
                    attributes: ['membership_product_id'],
                    where: { is_deleted: 0 },
                    include: [{
                        model: dbReader.products,
                        attributes: ['product_id', 'product_duration', 'ministry_type',
                            //'product_duration_type'
                        ],
                        where: {
                            is_deleted: 0, product_duration: [30, 90, 365], ministry_type: [1, 2, 3],
                            // product_duration_type: [1, 2, 3] 
                        }
                    }]
                }],
                group: ['user_id', 'membership_id']
            });

            PendingCancellationsubscriptionCountData = JSON.parse(JSON.stringify(PendingCancellationsubscriptionCountData));


            let CancelledsubscriptionCountData = await dbReader.userMemberships.findAll({
                attributes: ['user_id', 'membership_id'],
                where: {
                    site_id: site_id,
                    is_deleted: 0,
                    status: 5
                },
                include: [{
                    model: dbReader.users,
                    attributes: ['user_id'],
                    where: { is_deleted: 0, status: 1, user_role: 3 }
                }, {
                    model: dbReader.membershipProduct,
                    attributes: ['membership_product_id'],
                    where: { is_deleted: 0 },
                    include: [{
                        model: dbReader.products,
                        attributes: ['product_id', 'product_duration', 'ministry_type',
                            //'product_duration_type'
                        ],
                        where: {
                            is_deleted: 0, product_duration: [30, 90, 365], ministry_type: [1, 2, 3],
                            // product_duration_type: [1, 2, 3] 
                        }
                    }]
                }],
                group: ['user_id', 'membership_id']
            });

            CancelledsubscriptionCountData = JSON.parse(JSON.stringify(CancelledsubscriptionCountData));




            if (ActivesubscriptionCountData.length > 0) {
                // subscriptionCountData = JSON.parse(JSON.stringify(subscriptionCountData));
                let data: any = {};
                for (let i = 0; i < ActivesubscriptionCountData.length; i++) {
                    data[subscription_status[ActivesubscriptionCountData[i].subscription_status]] = ActivesubscriptionCountData[i].status_count
                }
                data["on_hold"] = OnholdsubscriptionCountData.length
                data["pending_cancellation"] = PendingCancellationsubscriptionCountData.length
                data["active"] = ActivesubscriptionCountData.length - data["pending_cancellation"];
                data["cancelled"] = CancelledsubscriptionCountData.length
                data["expired"] = ExpiredsubscriptionCountData.length
                data["completed"] = CompletedsubscriptionCountData.length
                new SuccessResponse(EC.errorMessage(EC.getMessage, ["Subscription Count"]), { // @ts-ignore
                    token: req.token,
                    ...data,
                    membership_count: data["active"] + data["pending_cancellation"],

                }).send(res);
            } else new SuccessResponse(EC.noDataFound, { // @ts-ignore
                token: req.token,
                data: {}
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public getNewSubscriptionChartData = async (req: Request, res: Response) => {
        try {
            let { current_range, previous_range, filter_new, site_id } = req.body;
            let siteCondition = {};
            if (site_id) {
                siteCondition = { site_id: site_id }
            }
            if ((current_range.end_date).slice(-2) == '59') {
                current_range.end_date = moment(current_range.end_date).add(1, 'minutes').format('YYYY-MM-DD HH:mm')
            }
            if ((previous_range.end_date).slice(-2) == '59') {
                previous_range.end_date = moment(previous_range.end_date).add(1, 'minutes').format('YYYY-MM-DD HH:mm')
            }
            let subscriptionData = await dbReader.userOrder.findAll({
                attributes: [[dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m-%d %H:%i'), 'created_datetime']],
                where: dbReader.Sequelize.and(
                    dbReader.Sequelize.or(
                        dbReader.Sequelize.and(
                            dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('user_orders.created_datetime'), '%Y-%m-%d %H:%i'), { [Op.gte]: current_range.start_date }),
                            dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('user_orders.created_datetime'), '%Y-%m-%d %H:%i'), { [Op.lte]: current_range.end_date })
                        ),
                        dbReader.Sequelize.and(
                            dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('user_orders.created_datetime'), '%Y-%m-%d %H:%i'), { [Op.gte]: previous_range.start_date }),
                            dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('user_orders.created_datetime'), '%Y-%m-%d %H:%i'), { [Op.lte]: previous_range.end_date })
                        ),
                    ),
                    { parent_user_order_id: { [Op.eq]: 0 } },
                    { order_status: { [Op.in]: [2, 3, 4, 5, 6, 8] } }
                ),
                include: [{
                    required: true,
                    model: dbReader.userSubscription,
                    attributes: [],
                    where: siteCondition
                }],
                order: [['created_datetime', 'ASC']]
            });
            if (subscriptionData.length > 0) {
                subscriptionData = JSON.parse(JSON.stringify(subscriptionData));
                var current_count = 0, previous_count = 0;
                let getCounts = (arrCurrent: any, arrPrevious: any) => {
                    var final: any = [];
                    // , current_count = 0, previous_count = 0;
                    for (let ele of arrCurrent) {
                        for (let value of subscriptionData) {
                            if (value.created_datetime >= ele.start_date && value.created_datetime <= ele.end_date) {
                                ele.current++;
                                current_count++;
                            }
                        }
                    }
                    for (let ele of arrPrevious) {
                        for (let value of subscriptionData) {
                            if (value.created_datetime >= ele.start_date && value.created_datetime <= ele.end_date) {
                                ele.previous++;
                                previous_count++;
                            }
                        }
                    }
                    for (let i = 0; i < Math.min(arrCurrent.length, arrPrevious.length); i++) {
                        let current: any = { "current_count": 0 }, previous: any = { "previous_count": 0 };
                        if (filter_new == 'hour') {
                            current.start_date = arrCurrent[i].start_date;
                            current.end_date = arrCurrent[i].end_date;
                            previous.start_date = arrPrevious[i].start_date;
                            previous.end_date = arrPrevious[i].end_date;
                        }
                        else {
                            current.start_date = moment(arrCurrent[i].start_date).format('YYYY-MM-DD');
                            current.end_date = moment(arrCurrent[i].end_date).format('YYYY-MM-DD');
                            previous.start_date = moment(arrPrevious[i].start_date).format('YYYY-MM-DD');
                            previous.end_date = moment(arrPrevious[i].end_date).format('YYYY-MM-DD');
                        }
                        current.current_count = arrCurrent[i].current;
                        previous.previous_count = arrPrevious[i].previous;
                        final.push({ "current": current, "previous": previous });
                    }
                    final.reverse();
                    return { final };
                }
                switch (filter_new) {
                    case 'day': //by day
                        var daysOfYear1: any = [], daysOfYear2: any = [], tempDate1: any, tempDate2: any;
                        let currentStart = moment(current_range.start_date).format('YYYY-MM-DD');
                        let currentEnd = moment(current_range.end_date).format('YYYY-MM-DD');
                        let previousStart = moment(previous_range.start_date).format('YYYY-MM-DD');
                        let previousEnd = moment(previous_range.end_date).format('YYYY-MM-DD');
                        let _diff = moment(currentEnd).diff(moment(currentStart), 'days');
                        let _diff1 = moment(previousEnd).diff(moment(previousStart), 'days');
                        if ((current_range.start_date).split(' ')[1] == '04:00') {
                            _diff = moment(currentEnd).diff(moment(currentStart), 'days') + 1;
                            _diff1 = moment(previousEnd).diff(moment(previousStart), 'days') + 1;
                        }
                        for (var a = 1; a <= _diff; a++) {
                            if (!daysOfYear1.length) {
                                tempDate1 = moment(moment(currentStart).add(1, 'days')).set({ hour: 0, minute: 0, second: 0 });
                                daysOfYear1.push({
                                    "start_date": current_range.start_date,
                                    "end_date": moment(tempDate1).format('YYYY-MM-DD HH:mm'),
                                    "current": 0
                                });
                            } else if (a == _diff) {
                                daysOfYear1.push({
                                    "start_date": moment(tempDate1).format('YYYY-MM-DD HH:mm'),
                                    "end_date": current_range.end_date,
                                    "current": 0
                                });
                            } else {
                                var flag: any = moment(tempDate1);
                                flag = moment(flag.add(1, 'days')).set({ hour: 0, minute: 0, second: 0 });
                                daysOfYear1.push({
                                    "start_date": moment(tempDate1).format('YYYY-MM-DD HH:mm'),
                                    "end_date": moment(flag).format('YYYY-MM-DD HH:mm'),
                                    "current": 0
                                });
                                tempDate1 = moment(tempDate1.add(1, 'days')).set({ hour: 0, minute: 0, second: 0 });
                            }
                        }
                        for (var b = 1; b <= _diff1; b++) {
                            if (!daysOfYear2.length) {
                                tempDate2 = moment(moment(previousStart).add(1, 'days')).set({ hour: 0, minute: 0, second: 0 });
                                daysOfYear2.push({
                                    "start_date": previous_range.start_date,
                                    "end_date": moment(tempDate2).format('YYYY-MM-DD HH:mm'),
                                    "previous": 0
                                });
                            } else if (b == _diff1) {
                                daysOfYear2.push({
                                    "start_date": moment(tempDate2).format('YYYY-MM-DD HH:mm'),
                                    "end_date": previous_range.end_date,
                                    "previous": 0
                                });
                            } else {
                                var flag: any = moment(tempDate2);
                                flag = moment(flag.add(1, 'days')).set({ hour: 0, minute: 0, second: 0 });
                                daysOfYear2.push({
                                    "start_date": moment(tempDate2).format('YYYY-MM-DD HH:mm'),
                                    "end_date": moment(flag).format('YYYY-MM-DD HH:mm'),
                                    "previous": 0
                                });
                                tempDate2 = moment(tempDate2.add(1, 'days')).set({ hour: 0, minute: 0, second: 0 });
                            }
                        }
                        daysOfYear1.reverse(); daysOfYear2.reverse();
                        var result = getCounts(daysOfYear1, daysOfYear2);
                        new SuccessResponse(EC.errorMessage(EC.getMessage, ["New Subscription Chart Data"]), { // @ts-ignore
                            token: req.token,
                            current: current_count,
                            previous: previous_count,
                            rows: result.final
                        }).send(res);
                        break;
                    case "week": //by week
                        moment.updateLocale('in', {
                            week: {
                                dow: 1 // Monday is the first day of the week
                            }
                        });
                        var daysOfYear1: any = [], daysOfYear2: any = [];
                        var now1 = new Date(moment(current_range.end_date).add(1, 'days').set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm'));
                        for (var d = new Date(current_range.start_date); d <= now1; d.setDate(d.getDate() + 1)) {
                            if (moment(d).format('YYYY-MM-DD') <= moment(now1).subtract(1, 'days').format('YYYY-MM-DD')) {
                                let week = moment(d).week();
                                if (daysOfYear1.some((s: any) => s.week == week)) {
                                    let fi = daysOfYear1.findIndex((s: any) => s.week == week);
                                    daysOfYear1[fi].end_date = moment(d).format('YYYY-MM-DD HH:mm');
                                    let flag = moment(daysOfYear1[fi].end_date);
                                    daysOfYear1[fi].end_date = moment(flag).add(1, 'days').set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm');
                                    if (moment(d).format('YYYY-MM-DD') == moment(now1).subtract(1, 'days').format('YYYY-MM-DD')) {
                                        daysOfYear1[fi].end_date = current_range.end_date
                                    }
                                }
                                else {
                                    if (!daysOfYear1.length) {
                                        let tempDate = moment(d).add(1, 'days');
                                        daysOfYear1.push({
                                            week: week,
                                            current: 0,
                                            start_date: moment(d).format('YYYY-MM-DD HH:mm'),
                                            end_date: moment(tempDate).set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm')
                                        });
                                    } else {
                                        daysOfYear1.push({
                                            week: week,
                                            current: 0,
                                            start_date: moment(d).set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm'),
                                            end_date: moment(d).format('YYYY-MM-DD HH:mm')
                                        });
                                    }
                                }
                            }
                        }
                        var now2 = new Date(moment(previous_range.end_date).add(1, 'days').set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm'));
                        for (var d = new Date(previous_range.start_date); d <= now2; d.setDate(d.getDate() + 1)) {
                            if (moment(d).format('YYYY-MM-DD') <= moment(now2).subtract(1, 'days').format('YYYY-MM-DD')) {
                                let week = moment(d).week();
                                if (daysOfYear2.some((s: any) => s.week == week)) {
                                    let fi = daysOfYear2.findIndex((s: any) => s.week == week);
                                    daysOfYear2[fi].end_date = moment(d).format('YYYY-MM-DD HH:mm');
                                    let flag = moment(daysOfYear2[fi].end_date);
                                    daysOfYear2[fi].end_date = moment(flag).add(1, 'days').set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm');
                                    if (moment(d).format('YYYY-MM-DD') == moment(now2).subtract(1, 'days').format('YYYY-MM-DD')) {
                                        daysOfYear2[fi].end_date = previous_range.end_date
                                    }
                                }
                                else {
                                    if (!daysOfYear2.length) {
                                        let tempDate = moment(d).add(1, 'days');
                                        daysOfYear2.push({
                                            week: week,
                                            previous: 0,
                                            start_date: moment(d).format('YYYY-MM-DD HH:mm'),
                                            end_date: moment(tempDate).set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm')
                                        });
                                    } else {
                                        daysOfYear2.push({
                                            week: week,
                                            previous: 0,
                                            start_date: moment(d).set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm'),
                                            end_date: moment(d).format('YYYY-MM-DD HH:mm')
                                        });
                                    }
                                }
                            }
                        }
                        daysOfYear1.reverse(); daysOfYear2.reverse();
                        var result = getCounts(daysOfYear1, daysOfYear2);
                        new SuccessResponse(EC.errorMessage(EC.getMessage, ["New Subscription Chart Data"]), { // @ts-ignore
                            token: req.token,
                            current: current_count,
                            previous: previous_count,
                            rows: result.final
                        }).send(res);
                        break;
                    case 'month': //by week
                        var daysOfYear1: any = [], daysOfYear2: any = [];
                        var now1 = new Date(moment(current_range.end_date).add(1, 'days').set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm'));
                        for (var d = new Date(current_range.start_date); d <= now1; d.setDate(d.getDate() + 1)) {
                            if (moment(d).format('YYYY-MM-DD') <= moment(now1).subtract(1, 'days').format('YYYY-MM-DD')) {
                                let month = moment(d).format('MM');
                                if (daysOfYear1.some((s: any) => s.month == month)) {
                                    let fi = daysOfYear1.findIndex((s: any) => s.month == month);
                                    daysOfYear1[fi].end_date = moment(d).format('YYYY-MM-DD HH:mm');
                                    let flag = moment(daysOfYear1[fi].end_date);
                                    daysOfYear1[fi].end_date = moment(flag).add(1, 'days').set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm');
                                    if (moment(d).format('YYYY-MM-DD') == moment(now1).subtract(1, 'days').format('YYYY-MM-DD')) {
                                        daysOfYear1[fi].end_date = current_range.end_date
                                    }
                                }
                                else {
                                    if (!daysOfYear1.length) {
                                        let tempDate = moment(d).add(1, 'days');
                                        daysOfYear1.push({
                                            month: month,
                                            current: 0,
                                            start_date: moment(d).format('YYYY-MM-DD HH:mm'),
                                            end_date: moment(tempDate).set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm')
                                        });
                                    } else {
                                        daysOfYear1.push({
                                            month: month,
                                            current: 0,
                                            start_date: moment(d).set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm'),
                                            end_date: moment(d).format('YYYY-MM-DD HH:mm')
                                        });
                                    }
                                }
                            }
                        }
                        var now2 = new Date(moment(previous_range.end_date).add(1, 'days').set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm'));
                        for (var d = new Date(previous_range.start_date); d <= now2; d.setDate(d.getDate() + 1)) {
                            if (moment(d).format('YYYY-MM-DD') <= moment(now2).subtract(1, 'days').format('YYYY-MM-DD')) {
                                let month = moment(d).format('MM');
                                if (daysOfYear2.some((s: any) => s.month == month)) {
                                    let fi = daysOfYear2.findIndex((s: any) => s.month == month);
                                    daysOfYear2[fi].end_date = moment(d).format('YYYY-MM-DD HH:mm');
                                    let flag = moment(daysOfYear2[fi].end_date);
                                    daysOfYear2[fi].end_date = moment(flag).add(1, 'days').set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm');
                                    if (moment(d).format('YYYY-MM-DD') == moment(now2).subtract(1, 'days').format('YYYY-MM-DD')) {
                                        daysOfYear2[fi].end_date = previous_range.end_date
                                    }
                                }
                                else {
                                    if (!daysOfYear2.length) {
                                        let tempDate = moment(d).add(1, 'days');
                                        daysOfYear2.push({
                                            month: month,
                                            previous: 0,
                                            start_date: moment(d).format('YYYY-MM-DD HH:mm'),
                                            end_date: moment(tempDate).set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm')
                                        });
                                    } else {
                                        daysOfYear2.push({
                                            month: month,
                                            previous: 0,
                                            start_date: moment(d).set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm'),
                                            end_date: moment(d).format('YYYY-MM-DD HH:mm')
                                        });
                                    }
                                }
                            }
                        }
                        daysOfYear1.reverse(); daysOfYear2.reverse();
                        var result = getCounts(daysOfYear1, daysOfYear2);
                        new SuccessResponse(EC.errorMessage(EC.getMessage, ["New Subscription Chart Data"]), { // @ts-ignore
                            token: req.token,
                            current: current_count,
                            previous: previous_count,
                            rows: result.final
                        }).send(res);
                        break;
                    case 'quarter': //by quarter
                        var daysOfYear1: any = [], daysOfYear2: any = [];
                        for (let m = moment(current_range.start_date); m <= moment(current_range.end_date); m.add(3, 'M')) {
                            let _currentStartDate = m.format("YYYY-MM-DD"), _actualStartDate = moment(current_range.start_date).format("YYYY-MM-DD"), _lastDate = moment(moment(m).add(3, 'M')).format("YYYY-MM-DD"), _actualEndDate = moment(current_range.end_date).format("YYYY-MM-DD");
                            if (_lastDate > _actualEndDate) {
                                _lastDate = _actualEndDate;
                            }
                            if (_lastDate <= _actualEndDate && _actualStartDate <= _currentStartDate) {
                                if (!daysOfYear1.length) {
                                    daysOfYear1.push({
                                        'start_date': current_range.start_date,
                                        'end_date': moment(_lastDate).set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm'),
                                        'current': 0
                                    });
                                }
                                else if (_lastDate == moment(current_range.end_date).format('YYYY-MM-DD')) {
                                    daysOfYear1.push({
                                        'start_date': moment(m).set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm'),
                                        'end_date': current_range.end_date,
                                        'current': 0
                                    });
                                }
                                else {
                                    daysOfYear1.push({
                                        'start_date': moment(m).set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm'),
                                        'end_date': moment(_lastDate).set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm'),
                                        'current': 0
                                    });
                                }
                            }
                        }
                        for (let m = moment(previous_range.start_date); m <= moment(previous_range.end_date); m.add(3, 'M')) {
                            let _currentStartDate = m.format("YYYY-MM-DD"), _actualStartDate = moment(previous_range.start_date).format("YYYY-MM-DD"), _lastDate = moment(moment(m).add(3, 'M')).format("YYYY-MM-DD"), _actualEndDate = moment(previous_range.end_date).format("YYYY-MM-DD");
                            if (_lastDate > _actualEndDate) {
                                _lastDate = _actualEndDate;
                            }
                            if (_lastDate <= _actualEndDate && _actualStartDate <= _currentStartDate) {
                                if (!daysOfYear2.length) {
                                    daysOfYear2.push({
                                        'start_date': previous_range.start_date,
                                        'end_date': moment(_lastDate).set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm'),
                                        'previous': 0
                                    });
                                }
                                else if (_lastDate == moment(previous_range.end_date).format('YYYY-MM-DD')) {
                                    daysOfYear2.push({
                                        'start_date': moment(m).set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm'),
                                        'end_date': previous_range.end_date,
                                        'previous': 0
                                    });
                                }
                                else {
                                    daysOfYear2.push({
                                        'start_date': moment(m).set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm'),
                                        'end_date': moment(_lastDate).set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm'),
                                        'previous': 0
                                    });
                                }
                            }
                        }
                        daysOfYear1.reverse(); daysOfYear2.reverse();
                        var result = getCounts(daysOfYear1, daysOfYear2);
                        new SuccessResponse(EC.errorMessage(EC.getMessage, ["New Subscription Chart Data"]), { // @ts-ignore
                            token: req.token,
                            current: current_count,
                            previous: previous_count,
                            rows: result.final
                        }).send(res);
                        break;
                    case 'hour': //by hour
                        var daysOfYear1: any = [], daysOfYear2: any = [];
                        for (let m = moment(current_range.start_date); m <= moment(current_range.end_date); m.add(1, 'hours')) {
                            let _currentStartDate = m.format("YYYY-MM-DD HH:mm"),
                                _actualStartDate = moment(current_range.start_date).format("YYYY-MM-DD HH:mm"),
                                _lastDate = moment(moment(m).add(1, 'hours')).format("YYYY-MM-DD HH:mm"),
                                _actualEndDate = moment(current_range.end_date).format("YYYY-MM-DD HH:mm");
                            if (_lastDate <= _actualEndDate && _actualStartDate <= _currentStartDate) {
                                let start = moment(m).format("YYYY-MM-DD HH:mm");
                                if (daysOfYear1.length) {
                                    start = moment(m).add(1, 'minutes').format("YYYY-MM-DD HH:mm");
                                }
                                daysOfYear1.push({
                                    'start_date': start,
                                    'end_date': _lastDate,
                                    'current': 0
                                });
                            }
                        }
                        for (let m = moment(previous_range.start_date); m <= moment(previous_range.end_date); m.add(1, 'hours')) {
                            let _currentStartDate = m.format("YYYY-MM-DD HH:mm"),
                                _actualStartDate = moment(previous_range.start_date).format("YYYY-MM-DD HH:mm"),
                                _lastDate = moment(moment(m).add(1, 'hours')).format("YYYY-MM-DD HH:mm"),
                                _actualEndDate = moment(previous_range.end_date).format("YYYY-MM-DD HH:mm");
                            if (_lastDate <= _actualEndDate && _actualStartDate <= _currentStartDate) {
                                let start = moment(m).format("YYYY-MM-DD HH:mm");
                                if (daysOfYear2.length) {
                                    start = moment(m).add(1, 'minutes').format("YYYY-MM-DD HH:mm");
                                }
                                daysOfYear2.push({
                                    'start_date': start,
                                    'end_date': _lastDate,
                                    'previous': 0
                                });
                            }
                        }
                        daysOfYear1.reverse(), daysOfYear2.reverse();
                        var result = getCounts(daysOfYear1, daysOfYear2);
                        new SuccessResponse(EC.errorMessage(EC.getMessage, ["New Subscription Chart Data"]), { // @ts-ignore
                            token: req.token,
                            current: current_count,
                            previous: previous_count,
                            rows: result.final
                        }).send(res);
                        break;
                }
            } else new SuccessResponse(EC.noDataFound, {
                current: 0,
                previous: 0,
                rows: []
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public getRenewedSubscriptionChartData = async (req: Request, res: Response) => {
        try {
            let { current_range, previous_range, filter_renew, site_id } = req.body;
            let siteCondition = {};
            if (site_id) {
                siteCondition = { site_id: site_id }
            }
            if ((current_range.end_date).slice(-2) == '59') {
                current_range.end_date = moment(current_range.end_date).add(1, 'minutes').format('YYYY-MM-DD HH:mm')
            }
            if ((previous_range.end_date).slice(-2) == '59') {
                previous_range.end_date = moment(previous_range.end_date).add(1, 'minutes').format('YYYY-MM-DD HH:mm')
            }
            let subscriptionData = await dbReader.userOrder.findAll({
                attributes: [[dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m-%d %H:%i'), 'created_datetime']],
                where: dbReader.Sequelize.and(
                    dbReader.Sequelize.or(
                        dbReader.Sequelize.and(
                            dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('user_orders.created_datetime'), '%Y-%m-%d %H:%i'), { [Op.gte]: current_range.start_date }),
                            dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('user_orders.created_datetime'), '%Y-%m-%d %H:%i'), { [Op.lte]: current_range.end_date })
                        ),
                        dbReader.Sequelize.and(
                            dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('user_orders.created_datetime'), '%Y-%m-%d %H:%i'), { [Op.gte]: previous_range.start_date }),
                            dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('user_orders.created_datetime'), '%Y-%m-%d %H:%i'), { [Op.lte]: previous_range.end_date })
                        ),
                    ),
                    { parent_user_order_id: { [Op.ne]: 0 } },
                    { order_status: { [Op.in]: [2, 3, 4, 5, 6, 8] } }
                ),
                include: [{
                    required: true,
                    model: dbReader.userSubscription,
                    attributes: [],
                    where: siteCondition
                }],
                order: [['created_datetime', 'ASC']]
            });
            if (subscriptionData.length > 0) {
                subscriptionData = JSON.parse(JSON.stringify(subscriptionData));
                var current_count = 0, previous_count = 0;
                let getCounts = (arrCurrent: any, arrPrevious: any) => {
                    var final: any = [];
                    for (let ele of arrCurrent) {
                        for (let value of subscriptionData) {
                            if (value.created_datetime >= ele.start_date && value.created_datetime <= ele.end_date) {
                                ele.current++;
                                current_count++;
                            }
                        }
                    }
                    for (let ele of arrPrevious) {
                        for (let value of subscriptionData) {
                            if (value.created_datetime >= ele.start_date && value.created_datetime <= ele.end_date) {
                                ele.previous++;
                                previous_count++;
                            }
                        }
                    }
                    for (let i = 0; i < Math.min(arrCurrent.length, arrPrevious.length); i++) {
                        let current: any = { "current_count": 0 }, previous: any = { "previous_count": 0 };
                        if (filter_renew == 'hour') {
                            current.start_date = arrCurrent[i].start_date;
                            current.end_date = arrCurrent[i].end_date;
                            previous.start_date = arrPrevious[i].start_date;
                            previous.end_date = arrPrevious[i].end_date;
                        }
                        else {
                            current.start_date = moment(arrCurrent[i].start_date).format('YYYY-MM-DD');
                            current.end_date = moment(arrCurrent[i].end_date).format('YYYY-MM-DD');
                            previous.start_date = moment(arrPrevious[i].start_date).format('YYYY-MM-DD');
                            previous.end_date = moment(arrPrevious[i].end_date).format('YYYY-MM-DD');
                        }
                        current.current_count = arrCurrent[i].current;
                        previous.previous_count = arrPrevious[i].previous;
                        final.push({ "current": current, "previous": previous });
                    }
                    final.reverse();
                    return { final };
                }
                switch (filter_renew) {
                    case 'day': //by day
                        var daysOfYear1: any = [], daysOfYear2: any = [], tempDate1: any, tempDate2: any;
                        let currentStart = moment(current_range.start_date).format('YYYY-MM-DD');
                        let currentEnd = moment(current_range.end_date).format('YYYY-MM-DD');
                        let previousStart = moment(previous_range.start_date).format('YYYY-MM-DD');
                        let previousEnd = moment(previous_range.end_date).format('YYYY-MM-DD');
                        let _diff = moment(currentEnd).diff(moment(currentStart), 'days');
                        let _diff1 = moment(previousEnd).diff(moment(previousStart), 'days');
                        if ((current_range.start_date).split(' ')[1] == '04:00') {
                            _diff = moment(currentEnd).diff(moment(currentStart), 'days') + 1;
                            _diff1 = moment(previousEnd).diff(moment(previousStart), 'days') + 1;
                        }
                        for (var a = 1; a <= _diff; a++) {
                            if (!daysOfYear1.length) {
                                tempDate1 = moment(moment(currentStart).add(1, 'days')).set({ hour: 0, minute: 0, second: 0 });
                                daysOfYear1.push({
                                    "start_date": current_range.start_date,
                                    "end_date": moment(tempDate1).format('YYYY-MM-DD HH:mm'),
                                    "current": 0
                                });
                            } else if (a == _diff) {
                                daysOfYear1.push({
                                    "start_date": moment(tempDate1).format('YYYY-MM-DD HH:mm'),
                                    "end_date": current_range.end_date,
                                    "current": 0
                                });
                            } else {
                                var flag: any = moment(tempDate1);
                                flag = moment(flag.add(1, 'days')).set({ hour: 0, minute: 0, second: 0 });
                                daysOfYear1.push({
                                    "start_date": moment(tempDate1).format('YYYY-MM-DD HH:mm'),
                                    "end_date": moment(flag).format('YYYY-MM-DD HH:mm'),
                                    "current": 0
                                });
                                tempDate1 = moment(tempDate1.add(1, 'days')).set({ hour: 0, minute: 0, second: 0 });
                            }
                        }
                        for (var b = 1; b <= _diff1; b++) {
                            if (!daysOfYear2.length) {
                                tempDate2 = moment(moment(previousStart).add(1, 'days')).set({ hour: 0, minute: 0, second: 0 });
                                daysOfYear2.push({
                                    "start_date": previous_range.start_date,
                                    "end_date": moment(tempDate2).format('YYYY-MM-DD HH:mm'),
                                    "previous": 0
                                });
                            } else if (b == _diff1) {
                                daysOfYear2.push({
                                    "start_date": moment(tempDate2).format('YYYY-MM-DD HH:mm'),
                                    "end_date": previous_range.end_date,
                                    "previous": 0
                                });
                            } else {
                                var flag: any = moment(tempDate2);
                                flag = moment(flag.add(1, 'days')).set({ hour: 0, minute: 0, second: 0 });
                                daysOfYear2.push({
                                    "start_date": moment(tempDate2).format('YYYY-MM-DD HH:mm'),
                                    "end_date": moment(flag).format('YYYY-MM-DD HH:mm'),
                                    "previous": 0
                                });
                                tempDate2 = moment(tempDate2.add(1, 'days')).set({ hour: 0, minute: 0, second: 0 });
                            }
                        }
                        daysOfYear1.reverse(); daysOfYear2.reverse();
                        var result = getCounts(daysOfYear1, daysOfYear2);
                        new SuccessResponse(EC.errorMessage(EC.getMessage, ["New Subscription Chart Data"]), { // @ts-ignore
                            token: req.token,
                            current: current_count,
                            previous: previous_count,
                            rows: result.final
                        }).send(res);
                        break;
                    case "week": //by week
                        moment.updateLocale('in', {
                            week: {
                                dow: 1 // Monday is the first day of the week
                            }
                        });
                        var daysOfYear1: any = [], daysOfYear2: any = [];
                        var now1 = new Date(moment(current_range.end_date).add(1, 'days').set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm'));
                        for (var d = new Date(current_range.start_date); d <= now1; d.setDate(d.getDate() + 1)) {
                            if (moment(d).format('YYYY-MM-DD') <= moment(now1).subtract(1, 'days').format('YYYY-MM-DD')) {
                                let week = moment(d).week();
                                if (daysOfYear1.some((s: any) => s.week == week)) {
                                    let fi = daysOfYear1.findIndex((s: any) => s.week == week);
                                    daysOfYear1[fi].end_date = moment(d).format('YYYY-MM-DD HH:mm');
                                    let flag = moment(daysOfYear1[fi].end_date);
                                    daysOfYear1[fi].end_date = moment(flag).add(1, 'days').set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm');
                                    if (moment(d).format('YYYY-MM-DD') == moment(now1).subtract(1, 'days').format('YYYY-MM-DD')) {
                                        daysOfYear1[fi].end_date = current_range.end_date
                                    }
                                }
                                else {
                                    if (!daysOfYear1.length) {
                                        let tempDate = moment(d).add(1, 'days');
                                        daysOfYear1.push({
                                            week: week,
                                            current: 0,
                                            start_date: moment(d).format('YYYY-MM-DD HH:mm'),
                                            end_date: moment(tempDate).set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm')
                                        });
                                    } else {
                                        daysOfYear1.push({
                                            week: week,
                                            current: 0,
                                            start_date: moment(d).set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm'),
                                            end_date: moment(d).format('YYYY-MM-DD HH:mm')
                                        });
                                    }
                                }
                            }
                        }
                        var now2 = new Date(moment(previous_range.end_date).add(1, 'days').set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm'));
                        for (var d = new Date(previous_range.start_date); d <= now2; d.setDate(d.getDate() + 1)) {
                            if (moment(d).format('YYYY-MM-DD') <= moment(now2).subtract(1, 'days').format('YYYY-MM-DD')) {
                                let week = moment(d).week();
                                if (daysOfYear2.some((s: any) => s.week == week)) {
                                    let fi = daysOfYear2.findIndex((s: any) => s.week == week);
                                    daysOfYear2[fi].end_date = moment(d).format('YYYY-MM-DD HH:mm');
                                    let flag = moment(daysOfYear2[fi].end_date);
                                    daysOfYear2[fi].end_date = moment(flag).add(1, 'days').set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm');
                                    if (moment(d).format('YYYY-MM-DD') == moment(now2).subtract(1, 'days').format('YYYY-MM-DD')) {
                                        daysOfYear2[fi].end_date = previous_range.end_date
                                    }
                                }
                                else {
                                    if (!daysOfYear2.length) {
                                        let tempDate = moment(d).add(1, 'days');
                                        daysOfYear2.push({
                                            week: week,
                                            previous: 0,
                                            start_date: moment(d).format('YYYY-MM-DD HH:mm'),
                                            end_date: moment(tempDate).set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm')
                                        });
                                    } else {
                                        daysOfYear2.push({
                                            week: week,
                                            previous: 0,
                                            start_date: moment(d).set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm'),
                                            end_date: moment(d).format('YYYY-MM-DD HH:mm')
                                        });
                                    }
                                }
                            }
                        }
                        daysOfYear1.reverse(); daysOfYear2.reverse();
                        var result = getCounts(daysOfYear1, daysOfYear2);
                        new SuccessResponse(EC.errorMessage(EC.getMessage, ["New Subscription Chart Data"]), { // @ts-ignore
                            token: req.token,
                            current: current_count,
                            previous: previous_count,
                            rows: result.final
                        }).send(res);
                        break;
                    case 'month': //by week
                        var daysOfYear1: any = [], daysOfYear2: any = [];
                        var now1 = new Date(moment(current_range.end_date).add(1, 'days').set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm'));
                        for (var d = new Date(current_range.start_date); d <= now1; d.setDate(d.getDate() + 1)) {
                            if (moment(d).format('YYYY-MM-DD') <= moment(now1).subtract(1, 'days').format('YYYY-MM-DD')) {
                                let month = moment(d).format('MM');
                                if (daysOfYear1.some((s: any) => s.month == month)) {
                                    let fi = daysOfYear1.findIndex((s: any) => s.month == month);
                                    daysOfYear1[fi].end_date = moment(d).format('YYYY-MM-DD HH:mm');
                                    let flag = moment(daysOfYear1[fi].end_date);
                                    daysOfYear1[fi].end_date = moment(flag).add(1, 'days').set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm');
                                    if (moment(d).format('YYYY-MM-DD') == moment(now1).subtract(1, 'days').format('YYYY-MM-DD')) {
                                        daysOfYear1[fi].end_date = current_range.end_date
                                    }
                                }
                                else {
                                    if (!daysOfYear1.length) {
                                        let tempDate = moment(d).add(1, 'days');
                                        daysOfYear1.push({
                                            month: month,
                                            current: 0,
                                            start_date: moment(d).format('YYYY-MM-DD HH:mm'),
                                            end_date: moment(tempDate).set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm')
                                        });
                                    } else {
                                        daysOfYear1.push({
                                            month: month,
                                            current: 0,
                                            start_date: moment(d).set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm'),
                                            end_date: moment(d).format('YYYY-MM-DD HH:mm')
                                        });
                                    }
                                }
                            }
                        }
                        var now2 = new Date(moment(previous_range.end_date).add(1, 'days').set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm'));
                        for (var d = new Date(previous_range.start_date); d <= now2; d.setDate(d.getDate() + 1)) {
                            if (moment(d).format('YYYY-MM-DD') <= moment(now2).subtract(1, 'days').format('YYYY-MM-DD')) {
                                let month = moment(d).format('MM');
                                if (daysOfYear2.some((s: any) => s.month == month)) {
                                    let fi = daysOfYear2.findIndex((s: any) => s.month == month);
                                    daysOfYear2[fi].end_date = moment(d).format('YYYY-MM-DD HH:mm');
                                    let flag = moment(daysOfYear2[fi].end_date);
                                    daysOfYear2[fi].end_date = moment(flag).add(1, 'days').set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm');
                                    if (moment(d).format('YYYY-MM-DD') == moment(now2).subtract(1, 'days').format('YYYY-MM-DD')) {
                                        daysOfYear2[fi].end_date = previous_range.end_date
                                    }
                                }
                                else {
                                    if (!daysOfYear2.length) {
                                        let tempDate = moment(d).add(1, 'days');
                                        daysOfYear2.push({
                                            month: month,
                                            previous: 0,
                                            start_date: moment(d).format('YYYY-MM-DD HH:mm'),
                                            end_date: moment(tempDate).set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm')
                                        });
                                    } else {
                                        daysOfYear2.push({
                                            month: month,
                                            previous: 0,
                                            start_date: moment(d).set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm'),
                                            end_date: moment(d).format('YYYY-MM-DD HH:mm')
                                        });
                                    }
                                }
                            }
                        }
                        daysOfYear1.reverse(); daysOfYear2.reverse();
                        var result = getCounts(daysOfYear1, daysOfYear2);
                        new SuccessResponse(EC.errorMessage(EC.getMessage, ["New Subscription Chart Data"]), { // @ts-ignore
                            token: req.token,
                            current: current_count,
                            previous: previous_count,
                            rows: result.final
                        }).send(res);
                        break;
                    case 'quarter': //by quarter
                        var daysOfYear1: any = [], daysOfYear2: any = [];
                        for (let m = moment(current_range.start_date); m <= moment(current_range.end_date); m.add(3, 'M')) {
                            let _currentStartDate = m.format("YYYY-MM-DD"), _actualStartDate = moment(current_range.start_date).format("YYYY-MM-DD"), _lastDate = moment(moment(m).add(3, 'M')).format("YYYY-MM-DD"), _actualEndDate = moment(current_range.end_date).format("YYYY-MM-DD");
                            if (_lastDate > _actualEndDate) {
                                _lastDate = _actualEndDate;
                            }
                            if (_lastDate <= _actualEndDate && _actualStartDate <= _currentStartDate) {
                                if (!daysOfYear1.length) {
                                    daysOfYear1.push({
                                        'start_date': current_range.start_date,
                                        'end_date': moment(_lastDate).set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm'),
                                        'current': 0
                                    });
                                }
                                else if (_lastDate == moment(current_range.end_date).format('YYYY-MM-DD')) {
                                    daysOfYear1.push({
                                        'start_date': moment(m).set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm'),
                                        'end_date': current_range.end_date,
                                        'current': 0
                                    });
                                }
                                else {
                                    daysOfYear1.push({
                                        'start_date': moment(m).set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm'),
                                        'end_date': moment(_lastDate).set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm'),
                                        'current': 0
                                    });
                                }
                            }
                        }
                        for (let m = moment(previous_range.start_date); m <= moment(previous_range.end_date); m.add(3, 'M')) {
                            let _currentStartDate = m.format("YYYY-MM-DD"), _actualStartDate = moment(previous_range.start_date).format("YYYY-MM-DD"), _lastDate = moment(moment(m).add(3, 'M')).format("YYYY-MM-DD"), _actualEndDate = moment(previous_range.end_date).format("YYYY-MM-DD");
                            if (_lastDate > _actualEndDate) {
                                _lastDate = _actualEndDate;
                            }
                            if (_lastDate <= _actualEndDate && _actualStartDate <= _currentStartDate) {
                                if (!daysOfYear2.length) {
                                    daysOfYear2.push({
                                        'start_date': previous_range.start_date,
                                        'end_date': moment(_lastDate).set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm'),
                                        'previous': 0
                                    });
                                }
                                else if (_lastDate == moment(previous_range.end_date).format('YYYY-MM-DD')) {
                                    daysOfYear2.push({
                                        'start_date': moment(m).set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm'),
                                        'end_date': previous_range.end_date,
                                        'previous': 0
                                    });
                                }
                                else {
                                    daysOfYear2.push({
                                        'start_date': moment(m).set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm'),
                                        'end_date': moment(_lastDate).set({ hour: 0, minute: 0, second: 0 }).format('YYYY-MM-DD HH:mm'),
                                        'previous': 0
                                    });
                                }
                            }
                        }
                        daysOfYear1.reverse(); daysOfYear2.reverse();
                        var result = getCounts(daysOfYear1, daysOfYear2);
                        new SuccessResponse(EC.errorMessage(EC.getMessage, ["New Subscription Chart Data"]), { // @ts-ignore
                            token: req.token,
                            current: current_count,
                            previous: previous_count,
                            rows: result.final
                        }).send(res);
                        break;
                    case 'hour': //by hour
                        var daysOfYear1: any = [], daysOfYear2: any = [];
                        for (let m = moment(current_range.start_date); m <= moment(current_range.end_date); m.add(1, 'hours')) {
                            let _currentStartDate = m.format("YYYY-MM-DD HH:mm"),
                                _actualStartDate = moment(current_range.start_date).format("YYYY-MM-DD HH:mm"),
                                _lastDate = moment(moment(m).add(1, 'hours')).format("YYYY-MM-DD HH:mm"),
                                _actualEndDate = moment(current_range.end_date).format("YYYY-MM-DD HH:mm");
                            if (_lastDate <= _actualEndDate && _actualStartDate <= _currentStartDate) {
                                let start = moment(m).format("YYYY-MM-DD HH:mm");
                                if (daysOfYear1.length) {
                                    start = moment(m).add(1, 'minutes').format("YYYY-MM-DD HH:mm");
                                }
                                daysOfYear1.push({
                                    'start_date': start,
                                    'end_date': _lastDate,
                                    'current': 0
                                });
                            }
                        }
                        for (let m = moment(previous_range.start_date); m <= moment(previous_range.end_date); m.add(1, 'hours')) {
                            let _currentStartDate = m.format("YYYY-MM-DD HH:mm"),
                                _actualStartDate = moment(previous_range.start_date).format("YYYY-MM-DD HH:mm"),
                                _lastDate = moment(moment(m).add(1, 'hours')).format("YYYY-MM-DD HH:mm"),
                                _actualEndDate = moment(previous_range.end_date).format("YYYY-MM-DD HH:mm");
                            if (_lastDate <= _actualEndDate && _actualStartDate <= _currentStartDate) {
                                let start = moment(m).format("YYYY-MM-DD HH:mm");
                                if (daysOfYear2.length) {
                                    start = moment(m).add(1, 'minutes').format("YYYY-MM-DD HH:mm");
                                }
                                daysOfYear2.push({
                                    'start_date': start,
                                    'end_date': _lastDate,
                                    'previous': 0
                                });
                            }
                        }
                        var result = getCounts(daysOfYear1, daysOfYear2);
                        new SuccessResponse(EC.errorMessage(EC.getMessage, ["New Subscription Chart Data"]), { // @ts-ignore
                            token: req.token,
                            current: current_count,
                            previous: previous_count,
                            rows: result.final
                        }).send(res);
                        break;
                }
            } else new SuccessResponse(EC.noDataFound, {
                current: 0,
                previous: 0,
                rows: []
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public getSubscriptionDataDateWise = async (req: Request, res: Response) => {
        try {
            let { start_date, end_date, page_no, page_record, sort_field, sort_order, site_id } = req.body;
            let siteCondition = {};
            if (site_id) {
                siteCondition = { site_id: site_id }
            }
            if ((end_date).slice(-2) == '59') {
                end_date = moment(end_date).add(1, 'minutes').format('YYYY-MM-DD HH:mm')
            }
            // Automatic Offset and limit will set on the base of page number
            let row_limit = page_record == undefined ? 10 : parseInt(page_record);
            let offset = page_no == undefined ? 1 : parseInt(page_no);
            var row_offset = (offset * row_limit) - row_limit;
            let subscriptionData = await dbReader.userOrder.findAll({
                attributes: ['parent_user_order_id', [dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.literal('`user_orders`.`created_datetime`'), '%Y-%m-%d %H:%i'), 'created_datetime'], 'total_amount'],
                where: dbReader.Sequelize.and(
                    dbReader.Sequelize.and(
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('user_orders.created_datetime'), '%Y-%m-%d %H:%i'), { [Op.gte]: start_date }),
                        dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('user_orders.created_datetime'), '%Y-%m-%d %H:%i'), { [Op.lte]: end_date })
                    ),
                    { order_status: { [Op.in]: [2, 3, 4, 5, 6, 8] } }
                ),
                include: [{
                    required: true,
                    model: dbReader.userSubscription,
                    attributes: ['user_subscription_id', 'subscription_status', 'subscription_number', 'user_id', 'total_amount', 'next_payment_date', 'start_date'],
                    where: siteCondition,
                    include: [{
                        model: dbReader.users,
                        attributes: [],
                    }, {
                        separate: true,
                        model: dbReader.userSubscriptionItems,
                        attributes: ["user_subscription_item_id", "product_name", "product_id", "product_amount", "item_type"],
                        where: { is_deleted: 0, product_id: { [dbReader.Sequelize.Op.ne]: 0 } },
                    }]
                }],
                order: [['created_datetime', 'ASC']]
            });
            if (subscriptionData.length > 0) {
                subscriptionData = JSON.parse(JSON.stringify(subscriptionData));
                var dateRangeOfCurrent: any = [], tempDate1: any;
                let currentStart = moment(start_date).format('YYYY-MM-DD');
                let currentEnd = moment(end_date).format('YYYY-MM-DD');
                let _diff = moment(currentEnd).diff(moment(currentStart), 'days') + 1;
                for (var a = 1; a <= _diff; a++) {
                    if (!dateRangeOfCurrent.length) {
                        tempDate1 = moment(moment(currentStart).add(1, 'days')).set({ hour: 0, minute: 0, second: 0 });
                        dateRangeOfCurrent.push({
                            "start_date": start_date,
                            "end_date": moment(tempDate1).format('YYYY-MM-DD HH:mm'),
                            'new_count': 0, 'renew_count': 0, 'new_earning': 0, 'renew_earning': 0, 'total_amount': 0, 'new_subscription_list': [], 'renew_subscription_list': []
                        });
                    } else if (a == _diff) {
                        dateRangeOfCurrent.push({
                            "start_date": moment(tempDate1).format('YYYY-MM-DD HH:mm'),
                            "end_date": end_date,
                            'new_count': 0, 'renew_count': 0, 'new_earning': 0, 'renew_earning': 0, 'total_amount': 0, 'new_subscription_list': [], 'renew_subscription_list': []
                        });
                    } else {
                        var flag: any = moment(tempDate1);
                        flag = moment(flag.add(1, 'days')).set({ hour: 0, minute: 0, second: 0 });
                        dateRangeOfCurrent.push({
                            "start_date": moment(tempDate1).format('YYYY-MM-DD HH:mm'),
                            "end_date": moment(flag).format('YYYY-MM-DD HH:mm'),
                            'new_count': 0, 'renew_count': 0, 'new_earning': 0, 'renew_earning': 0, 'total_amount': 0, 'new_subscription_list': [], 'renew_subscription_list': []
                        });
                        tempDate1 = moment(tempDate1.add(1, 'days')).set({ hour: 0, minute: 0, second: 0 });
                    }
                }
                for (let ele of dateRangeOfCurrent) {
                    for (let value of subscriptionData) {
                        if (value.created_datetime >= ele.start_date && value.created_datetime <= ele.end_date) {
                            if (value.parent_user_order_id == 0 || value.parent_user_order_id == null) {
                                ele.new_count++;
                                ele.new_earning += value.total_amount;
                                ele.new_subscription_list.push(value.user_subscription);
                            } else {
                                ele.renew_count++;
                                ele.renew_earning += value.total_amount;
                                ele.renew_subscription_list.push(value.user_subscription);
                            }
                            ele.total_amount = ele.new_earning + ele.renew_earning;
                        }
                    }
                }
                dateRangeOfCurrent.forEach((e: any) => {
                    e.new_earning = parseFloat((e.new_earning).toFixed(2));
                    e.renew_earning = parseFloat((e.renew_earning).toFixed(2));
                    e.total_amount = parseFloat((e.total_amount).toFixed(2));
                    e["created_date"] = moment(e.start_date).format('YYYY-MM-DD');
                    delete e.start_date, delete e.end_date;
                })
                dateRangeOfCurrent.sort(function (a: any, b: any) {
                    if (sort_order == 'ASC') {
                        if (sort_field == 'created_date') {
                            return new Date(a.created_date).getTime() - new Date(b.created_date).getTime();
                        } else return a[sort_field] - b[sort_field];
                    } else if (sort_order == 'DESC') {
                        if (sort_field == 'created_date') {
                            return new Date(b.created_date).getTime() - new Date(a.created_date).getTime();
                        } else return b[sort_field] - a[sort_field];
                    } else {
                        return new Date(b.created_date).getTime() - new Date(a.created_date).getTime();
                    }
                });
                let count = dateRangeOfCurrent.length;
                let cnt_new = 0, amt_new = 0, cnt_renew = 0, amt_renew = 0, total = 0;
                dateRangeOfCurrent.filter((e: any) => {
                    cnt_new += e.new_count;
                    amt_new += e.new_earning;
                    cnt_renew += e.renew_count;
                    amt_renew += e.renew_earning;
                    total += e.total_amount;
                });
                dateRangeOfCurrent = dateRangeOfCurrent.splice(row_offset, row_limit);
                new SuccessResponse(EC.errorMessage(EC.getMessage, ["Subscription Data date wise"]), { // @ts-ignore
                    token: req.token,
                    total_new: cnt_new,
                    total_renew: cnt_renew,
                    total_new_amount: parseFloat((amt_new).toFixed(2)),
                    total_renew_amount: parseFloat((amt_renew).toFixed(2)),
                    total: parseFloat((total).toFixed(2)),
                    count: count,
                    rows: dateRangeOfCurrent
                }).send(res);
            } else new SuccessResponse(EC.noDataFound, {
                total_new: 0,
                total_renew: 0,
                total_new_amount: 0,
                total_renew_amount: 0,
                total: 0,
                count: 0,
                rows: []
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async failedSubscription(req: Request, res: Response) {
        try {
            //@ts-ignore
            let { token } = req
            let { start_date, end_date, sort_field, sort_order, page_record, page_no } = req.body;
            let todays_date = moment().format('YYYY-MM-DD');

            //Searching
            var searchCondition = dbReader.Sequelize.Op.ne, searchData = null;
            if (req.body.search) {
                searchCondition = Op.like;
                searchData = '%' + req.body.search + '%';
            }

            var row_offset = 0, row_limit = 10;

            //Pagination 
            if (page_record) {
                row_limit = parseInt(page_record);
            }

            if (page_no) {
                row_offset = (page_no * page_record) - page_record;
            }

            //sorting
            sort_order = sort_order ? sort_order : 'DESC';
            sort_field = sort_field ? sort_field : 'next_payment_date';
            switch (sort_field) {
                case "created_date":
                    sort_field = "next_payment_date"
                    break;
                case "product_name":
                case "attempt_count":
                    sort_field = "next_payment_date"
                    break;
                case "user_name":
                    sort_field = dbReader.sequelize.fn("concat", dbReader.sequelize.literal('`sycu_user`.`first_name`'), ' ', dbReader.sequelize.literal('`sycu_user`.`last_name`'))
                    break;
            }

            let failedData = await dbReader.userSubscription.findAndCountAll({
                attributes: ["user_subscription_id", "subscription_number", "subscription_status", "next_payment_date",
                    [dbReader.sequelize.fn("concat", dbReader.sequelize.literal('`sycu_user`.`first_name`'), ' ',
                        dbReader.sequelize.literal('`sycu_user`.`last_name`')), "user_name"],
                    [dbReader.sequelize.literal('`sycu_user`.`email`'), "email"],
                    [dbReader.sequelize.literal('`sycu_user`.`user_id`'), "user_id"]
                ],
                where: dbReader.Sequelize.and(
                    dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('next_payment_date'), '%Y-%m-%d'), { [Op.gte]: start_date }),
                    dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('next_payment_date'), '%Y-%m-%d'), { [Op.lte]: end_date }),
                    dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('next_payment_date'), '%Y-%m-%d'), { [Op.lt]: todays_date }),
                    { subscription_status: [3, 7] },
                    dbReader.Sequelize.or(
                        [dbReader.Sequelize.where(dbReader.sequelize.fn("concat", dbReader.sequelize.col("first_name"), ' ', dbReader.sequelize.col("last_name")), { [searchCondition]: searchData })],
                        [dbReader.Sequelize.where(dbReader.sequelize.col('`sycu_user`.`email`'), { [searchCondition]: searchData })],
                        { subscription_number: { [searchCondition]: searchData } },
                        { subscription_status: { [searchCondition]: searchData } },
                        { next_payment_date: { [searchCondition]: searchData } }
                    )
                ),
                include: [
                    {
                        attributes: [],
                        model: dbReader.users,
                        where: { is_deleted: 0 }
                    },
                    {
                        separate: true,
                        as: 'sycu_subscription_renewals',
                        attributes: ['user_subscription_id', 'attempt_count'],
                        model: dbReader.subscriptionRenewal,
                        order: [['subscription_renewal_id', 'DESC']],
                        limit: 1
                    },
                    {
                        separate: true,
                        model: dbReader.userSubscriptionItems,
                        where: { item_type: 1, is_deleted: 0 }
                    }
                ],
                order: [[sort_field, sort_order]],
                limit: row_limit,
                offset: row_offset,
            })
            failedData = JSON.parse(JSON.stringify(failedData))
            failedData.rows.forEach((ele: any) => {
                ele.attempt_count = 1
                // ele.subscription_status = (ele.subscription_status == 6) ? 7 : ele.subscription_status
                if (ele.sycu_subscription_renewals.length) {
                    ele.attempt_count = ele.sycu_subscription_renewals[0].attempt_count + 1
                }
                ele.user_subscription_items.forEach((element: any) => {
                    if (element.updated_product_name) {
                        element.product_name = element.updated_product_name
                    }
                });
            })
            // failedData.sort(function (a: any, b: any) {
            //     if (sort_order == 'ASC') {
            //         if (sort_field == 'next_payment_date') {
            //             return new Date(a.next_payment_date).getTime() - new Date(b.next_payment_date).getTime();
            //         } else return a[sort_field] - b[sort_field];
            //     } else if (sort_order == 'DESC') {
            //         if (sort_field == 'next_payment_date') {
            //             return new Date(b.next_payment_date).getTime() - new Date(a.next_payment_date).getTime();
            //         } else return b[sort_field] - a[sort_field];
            //     } else {
            //         return new Date(b.next_payment_date).getTime() - new Date(a.next_payment_date).getTime();
            //     }
            // });
            new SuccessResponse("Success", {
                count: failedData.count,
                rows: failedData.rows
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    //Sm 05-12-2022
    public async successSubscription(req: Request, res: Response) {
        try {
            //@ts-ignore
            let { start_date, end_date, sort_field, sort_order, page_record, page_no, filter_1, filter_2, filter_3 } = req.body;
            // if (end_date) { end_date = moment(end_date).subtract(1, 'days').format('YYYY-MM-DD') }
            let productCondition: any = {}, productCondition2: any = {}, productCondition3: any = {};
            let requireFlag: any = false, ministry_type = 0;

            //Searching
            let searchCondition = dbReader.Sequelize.Op.ne, searchData = null;
            if (req.body.search) {
                searchCondition = Op.like;
                searchData = '%' + req.body.search + '%';
            }

            let row_limit = page_record ? parseInt(page_record) : 10;
            let offset = page_no ? parseInt(page_no) : 1;
            let row_offset = (offset * row_limit) - row_limit;
            sort_field = sort_field ? sort_field : 'created_datetime', sort_order = sort_order ? sort_order : "DESC";

            switch (sort_field) {
                case "product_name":
                    sort_field = dbReader.Sequelize.literal('`succes_subscription->succes_subscription_check->succes_subscription_items_check->sycu_product`.`product_name`')
                    break;
                case "user_name":
                    sort_field = dbReader.sequelize.fn("concat", dbReader.sequelize.literal('`sycu_user`.`first_name`'), ' ', dbReader.sequelize.literal('`sycu_user`.`last_name`'))
                    break;
                case "email":
                    sort_field = dbReader.sequelize.literal('`sycu_user`.`email`')
                    break;
                case "subscription_number":
                    sort_field = dbReader.sequelize.literal('`succes_subscription->user_subscription`.`subscription_number`')
                    break;
            }

            //Filter for kids,student,group
            if (filter_1) {
                requireFlag = true;
                if (filter_1 == 'Kids') {
                    ministry_type = 1;
                } else if (filter_1 == 'Student') {
                    ministry_type = 2;
                } else if (filter_1 == 'Group') {
                    ministry_type = 3;
                } else {
                    productCondition = dbReader.Sequelize.and({ is_deleted: 0 },
                        dbReader.Sequelize.where(dbReader.Sequelize.literal('`succes_subscription->report_order->sycu_product`.`product_name`'), { [Op.like]: `%${filter_1}%` })
                    )
                }
                if (ministry_type) {
                    productCondition = { is_deleted: 0, ministry_type: ministry_type };
                }
            } else {
                productCondition = { is_deleted: 0 };
            }

            //Filter for Ministry,Non Ministry
            if (filter_2 == "Non Ministry") {
                requireFlag = true;
                productCondition2 = dbReader.Sequelize.and({ is_deleted: 0 },
                    dbReader.Sequelize.where(dbReader.Sequelize.literal('`succes_subscription->report_order->sycu_product`.`product_name`'), { [Op.notLike]: `%Ministry%` })
                )
            } else if (filter_2 == "Ministry") {
                requireFlag = true;
                productCondition2 = dbReader.Sequelize.and({ is_deleted: 0 },
                    dbReader.Sequelize.where(dbReader.Sequelize.literal('`succes_subscription->report_order->sycu_product`.`product_name`'), { [Op.like]: `%${filter_2}%` })
                )
            }

            //Filter for V1,V2,V3
            if (filter_3 && filter_3 != "") {
                requireFlag = true;
                productCondition3 = dbReader.Sequelize.and({ is_deleted: 0 },
                    dbReader.Sequelize.where(dbReader.Sequelize.literal('`succes_subscription->report_order->sycu_product`.`product_name`'), { [Op.like]: `%${filter_3}%` })
                )
            }

            let successData = await dbReader.transactionMaster.findAndCountAll({
                attributes: ["created_datetime", "transaction_id", [dbReader.sequelize.literal('`sycu_user`.`user_id`'), "user_id"],
                    [dbReader.sequelize.fn("concat", dbReader.sequelize.literal('`sycu_user`.`first_name`'), ' ', dbReader.sequelize.literal('`sycu_user`.`last_name`')), "user_name"],
                    [dbReader.sequelize.literal('`sycu_user`.`email`'), "email"], [dbReader.sequelize.literal('`sycu_user`.`user_role`'), "user_role"],
                    [dbReader.sequelize.literal('`succes_subscription->user_subscription`.`subscription_number`'), "subscription_number"],
                    [dbReader.sequelize.literal('`succes_subscription->user_subscription`.`user_subscription_id`'), "user_subscription_id"]
                ],
                where: dbReader.Sequelize.and({ status: "Success" }, { amount: { [Op.gt]: 0 } },
                    dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`sycu_transaction_master.created_datetime`'), '%Y-%m-%d'), { [Op.gte]: start_date }),
                    dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`sycu_transaction_master.created_datetime`'), '%Y-%m-%d'), { [Op.lte]: end_date }),
                    dbReader.Sequelize.or(
                        [dbReader.Sequelize.where(dbReader.sequelize.col('`sycu_user`.`email`'), { [searchCondition]: searchData })],
                        [dbReader.Sequelize.where(dbReader.sequelize.fn("concat", dbReader.sequelize.col("first_name"), ' ', dbReader.sequelize.col("last_name")), { [searchCondition]: searchData })],
                        [dbReader.Sequelize.where(dbReader.sequelize.col('`succes_subscription->user_subscription`.`subscription_number`'), { [searchCondition]: searchData })],
                        [dbReader.Sequelize.where(dbReader.sequelize.col('`succes_subscription->report_order->sycu_product`.`product_name`'), { [searchCondition]: searchData })]
                    )
                ),
                include: [{
                    attributes: [],
                    model: dbReader.users,
                }, {
                    required: true,
                    as: "succes_subscription",
                    model: dbReader.userOrder,
                    where: { order_status: [2, 3, 4, 5, 8] },
                    include: [{
                        attributes: [],
                        required: true,
                        as: 'report_order',
                        model: dbReader.userOrderItems,
                        where: { item_type: 1, is_deleted: 0, renewal_count: 1 },
                        include: [{
                            attributes: [],
                            model: dbReader.products,
                            where: dbReader.Sequelize.and(productCondition, productCondition2, productCondition3)
                        }]
                    }, {
                        required: true,
                        attributes: [],
                        as: "succes_subscription_check",
                        model: dbReader.userSubscription,
                        where: dbReader.Sequelize.where(
                            dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`succes_subscription->succes_subscription_check`.`created_datetime`'), '%Y-%m-%d'),
                            { [Op.ne]: dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('sycu_transaction_master.created_datetime'), '%Y-%m-%d') }
                        )
                    }]
                }, {
                    required: true,
                    attributes: ['user_orders_id'],
                    as: "succes_subscription",
                    model: dbReader.userOrder,
                    where: { order_status: [2, 3, 4, 5, 8] },
                    include: [{
                        attributes: ['user_order_item_id', 'renewal_count',
                            [dbReader.sequelize.literal('`sycu_product`.`ministry_type`'), "ministry_type"],
                            [dbReader.sequelize.literal('`sycu_product`.`is_ministry_page`'), "is_ministry_page"],
                            [dbReader.sequelize.literal('`sycu_product`.`product_name`'), "product_name"],
                            [dbReader.sequelize.literal('`sycu_product`.`product_id`'), "product_id"],
                            [dbReader.sequelize.literal('`updated_product`.`product_name`'), "updated_product_name"],
                            [dbReader.sequelize.literal('`updated_product`.`product_id`'), "updated_product_id"],
                        ],
                        separate: true,
                        model: dbReader.userOrderItems,
                        where: { item_type: 1, is_deleted: 0, renewal_count: 1 },
                        include: [{
                            attributes: [],
                            model: dbReader.products,
                            where: dbReader.Sequelize.and(productCondition, productCondition2, productCondition3)
                        }, {
                            required: false,
                            attributes: [],
                            as: 'updated_product',
                            model: dbReader.products,
                            where: dbReader.Sequelize.and(productCondition, productCondition2, productCondition3)
                        }]
                    }, {
                        attributes: [],
                        model: dbReader.userSubscription
                    }]
                }],
                group: ['`succes_subscription->user_subscription`.`subscription_number`', '`succes_subscription->report_order->sycu_product`.`product_id`'],
                order: [[sort_field, sort_order]],
                limit: row_limit,
                offset: row_offset,
            });
            if (successData.count.length) {
                successData = JSON.parse(JSON.stringify(successData))
                new SuccessResponse("Success", {
                    count: successData.count.length,
                    rows: successData.rows
                }).send(res);
            } else {
                new SuccessResponse("No data found.", {
                    count: 0,
                    rows: []
                }).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    //Sm 08-12-2022
    public async activeSubscription(req: Request, res: Response) {
        try {
            //@ts-ignore
            let { sort_field, sort_order, page_record, page_no, filter_1, filter_2, filter_3, filter_4, start_date, end_date } = req.body;
            let productCondition: any = {}, productCondition2: any = {}, productCondition3: any = {};
            let requireFlag: any = false, ministry_type = 0, userCondition: any = {}, whereCondition: any = {};
            //Searching
            var searchCondition = dbReader.Sequelize.Op.ne, searchData = null;
            if (req.body.search) {
                searchCondition = Op.like;
                searchData = '%' + req.body.search + '%';
            }
            //Pagination
            var limit = page_record == undefined ? 10 : parseInt(page_record);
            var offset = page_no == undefined ? 1 : parseInt(page_no);
            // Automatic Offset and limit will set on the base of page number
            var row_limit = limit;
            var row_offset = (offset * limit) - limit;
            //sorting
            sort_order = sort_order ? sort_order : 'DESC';
            sort_field = sort_field ? sort_field : 'next_payment_date';
            switch (sort_field) {
                case "product_name":
                    sort_field = dbReader.Sequelize.literal('`succes_subscription_items_check->sycu_product`.`product_name`')
                    break;
                case "user_name":
                    sort_field = dbReader.sequelize.fn("concat", dbReader.sequelize.literal('`sycu_user`.`first_name`'), ' ', dbReader.sequelize.literal('`sycu_user`.`last_name`'))
                    break;
                case "email":
                    sort_field = dbReader.sequelize.literal('`sycu_user`.`email`')
                    break;
            }
            //Filter for kids,student,group
            if (filter_1) {
                requireFlag = true;
                if (filter_1 == 'Kids') {
                    ministry_type = 1;
                } else if (filter_1 == 'Student') {
                    ministry_type = 2;
                } else if (filter_1 == 'Group') {
                    ministry_type = 3;
                } else {
                    let site_id = filter_1 == "Hub" ? 5 : (filter_1 == "Slidr" ? 6 : (filter_1 == "Builder" ? 3 : (filter_1 == "People" ? 7 : 2)))
                    // productCondition = dbReader.Sequelize.and({ is_deleted: 0 }, dbReader.Sequelize.where(dbReader.Sequelize.literal('`succes_subscription_items_check->sycu_product`.`product_name`'), { [Op.like]: `%${filter_1}%` }))
                    productCondition = dbReader.Sequelize.and({ is_deleted: 0 }, dbReader.Sequelize.where(dbReader.Sequelize.literal('`succes_subscription_items_check->sycu_product`.`site_id`'), site_id))
                }
                if (ministry_type) {
                    productCondition = { is_deleted: 0, ministry_type: ministry_type };
                }
            } else {
                productCondition = { is_deleted: 0 };
            }
            //Filter for Ministry,Non Ministry
            if (filter_2 == "Non Ministry") {
                requireFlag = true;
                // productCondition2 = dbReader.Sequelize.and({ is_deleted: 0 }, dbReader.Sequelize.where(dbReader.Sequelize.literal('`succes_subscription_items_check->sycu_product`.`product_name`'), { [Op.notLike]: `%Ministry%` }))
                productCondition2 = dbReader.Sequelize.and({ is_deleted: 0 }, dbReader.Sequelize.where(dbReader.Sequelize.literal('`succes_subscription_items_check->sycu_product`.`is_ministry_page`'), 0))
            } else if (filter_2 == "Ministry") {
                requireFlag = true;
                // productCondition2 = dbReader.Sequelize.and({ is_deleted: 0 }, dbReader.Sequelize.where(dbReader.Sequelize.literal('`succes_subscription_items_check->sycu_product`.`product_name`'), { [Op.like]: `%${filter_2}%` }))
                productCondition2 = dbReader.Sequelize.and({ is_deleted: 0 }, dbReader.Sequelize.where(dbReader.Sequelize.literal('`succes_subscription_items_check->sycu_product`.`is_ministry_page`'), 1))
            } else {
                productCondition2 = ""
            }
            //Filter for V1,V2,V3
            if (filter_3 && filter_3 != "") {
                requireFlag = true;
                productCondition3 = dbReader.Sequelize.and({ is_deleted: 0 },
                    dbReader.Sequelize.where(dbReader.Sequelize.literal('`succes_subscription_items_check->sycu_product`.`product_name`'), { [Op.like]: `%${filter_3}%` })
                )
            } else {
                productCondition3 = ""
            }
            //Filet fir user role
            if (filter_4) {
                if (filter_4 == 2) {
                    userCondition = { is_deleted: 0, user_role: [1, 2] }
                } else if (filter_4 == 3) {
                    userCondition = { is_deleted: 0, user_role: 3 }
                } else {
                    userCondition = { is_deleted: 0 }
                }
            } else {
                userCondition = { is_deleted: 0 }
            }

            let orCondition = dbReader.Sequelize.or(
                [dbReader.Sequelize.where(dbReader.sequelize.fn("concat", dbReader.sequelize.col("first_name"), ' ', dbReader.sequelize.col("last_name")), { [searchCondition]: searchData })],
                [dbReader.Sequelize.where(dbReader.sequelize.col('`succes_subscription_items_check->sycu_product`.`product_name`'), { [searchCondition]: searchData })]
                [dbReader.Sequelize.where(dbReader.sequelize.col('`sycu_user`.`email`'), { [searchCondition]: searchData })],
                { subscription_number: { [searchCondition]: searchData } }, { subscription_status: { [searchCondition]: searchData } },
                { next_payment_date: { [searchCondition]: searchData } }, { start_date: { [searchCondition]: searchData } },
            )
            if (start_date && end_date) {
                end_date = moment(end_date).subtract(1, 'days').format('YYYY-MM-DD');
                whereCondition = dbReader.Sequelize.and(
                    dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_subscription.created_datetime`'), '%Y-%m-%d'), { [Op.gte]: start_date }),
                    dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_subscription.created_datetime`'), '%Y-%m-%d'), { [Op.lte]: end_date }),
                    { subscription_status: [2, 4, 10] }, orCondition
                )
            } else {
                whereCondition = dbReader.Sequelize.and(
                    // dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('next_payment_date'), '%Y-%m-%d'), { [Op.gte]: start_date }),
                    // dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('next_payment_date'), '%Y-%m-%d'), { [Op.lte]: end_date }),
                    // dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('next_payment_date'), '%Y-%m-%d'), { [Op.lt]: todays_date }),
                    { subscription_status: [2, 4, 10] }, orCondition
                )
            }

            let activeData = await dbReader.userSubscription.findAndCountAll({
                attributes: ["user_subscription_id", "subscription_number", "subscription_status", "total_amount", "next_payment_date", "start_date",
                    [dbReader.sequelize.fn("concat", dbReader.sequelize.literal('`sycu_user`.`first_name`'), ' ',
                        dbReader.sequelize.literal('`sycu_user`.`last_name`')), "user_name"],
                    [dbReader.sequelize.literal('`sycu_user`.`email`'), "email"],
                    [dbReader.sequelize.literal('`sycu_user`.`user_id`'), "user_id"],
                    [dbReader.sequelize.literal('`sycu_user`.`user_role`'), "user_role"]
                ],
                where: whereCondition,
                include: [{
                    attributes: [],
                    model: dbReader.users,
                    where: userCondition
                }, {
                    as: "succes_subscription_items_check",
                    attributes: [],
                    required: true,
                    model: dbReader.userSubscriptionItems,
                    where: { item_type: 1, is_deleted: 0 },
                    include: [{
                        attributes: [],
                        required: true,
                        model: dbReader.products,
                        where: [productCondition, productCondition2, productCondition3]
                    }]
                }, {
                    separate: true,
                    attributes: ["user_subscription_item_id",
                        [dbReader.sequelize.literal('`sycu_product`.`ministry_type`'), "ministry_type"],
                        [dbReader.sequelize.literal('`sycu_product`.`is_ministry_page`'), "is_ministry_page"],
                        [dbReader.sequelize.literal('`sycu_product`.`product_name`'), "product_name"]
                    ],
                    model: dbReader.userSubscriptionItems,
                    where: { item_type: 1, is_deleted: 0 },
                    include: [{
                        attributes: [],
                        model: dbReader.products,
                        where: { is_deleted: 0 }
                    }]
                }],
                order: [[sort_field, sort_order]],
                group: ['user_subscription_id'],
                limit: row_limit,
                offset: row_offset,
            })
            activeData = JSON.parse(JSON.stringify(activeData))
            if (activeData) {
                new SuccessResponse("Success", {
                    count: activeData.count.length,
                    rows: activeData.rows
                }).send(res);
            }
            else {
                new SuccessResponse("No data found.", {
                    count: 0,
                    rows: []
                }).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async newSubscription(req: Request, res: Response) {
        try {
            //@ts-ignore
            let { sort_field, sort_order, page_record, page_no, filter_1, start_date, end_date } = req.body;
            let requireFlag: any = false, ministry_type = 0, whereCondition: any = {}, productCondition: any = {};
            let searchCondition = dbReader.Sequelize.Op.ne, searchData = null;
            if (req.body.search) {
                searchCondition = Op.like;
                searchData = '%' + req.body.search + '%';
            }
            let row_limit = page_record ? parseInt(page_record) : 10;
            let offset = page_no ? parseInt(page_no) : 1;
            let row_offset = (offset * row_limit) - row_limit;
            sort_order = sort_order ? sort_order : 'DESC';
            sort_field = sort_field ? sort_field : 'created_datetime';

            //Filter for kids,student,group
            if (filter_1) {
                requireFlag = true;
                if (filter_1 == 'Kids') {
                    // ministry_type = 1;
                    productCondition = dbReader.Sequelize.where(dbReader.Sequelize.literal('`succes_subscription_items_check->sycu_product`.`product_name`'), { [Op.like]: '%kids%' })
                } else if (filter_1 == 'Student') {
                    // ministry_type = 2;
                    productCondition = dbReader.Sequelize.where(dbReader.Sequelize.literal('`succes_subscription_items_check->sycu_product`.`product_name`'), { [Op.like]: '%student%' })
                } else if (filter_1 == 'Group') {
                    // ministry_type = 3;
                    productCondition = dbReader.Sequelize.where(dbReader.Sequelize.literal('`succes_subscription_items_check->sycu_product`.`product_name`'), { [Op.like]: '%group%' })
                } else {
                    let site_id = filter_1 == "Hub" ? 5 : (filter_1 == "Slidr" ? 6 : (filter_1 == "Builder" ? 3 : (filter_1 == "People" ? 7 : 2)))
                    productCondition = dbReader.Sequelize.where(dbReader.Sequelize.literal('`succes_subscription_items_check->sycu_product`.`site_id`'), site_id)
                }
                // if (ministry_type) {
                //     productCondition = { ministry_type: ministry_type };
                // }
            }

            let orCondition = dbReader.Sequelize.or(
                [dbReader.Sequelize.where(dbReader.sequelize.fn("concat", dbReader.sequelize.col("first_name"), ' ', dbReader.sequelize.col("last_name")), { [searchCondition]: searchData })],
                [dbReader.Sequelize.where(dbReader.sequelize.col('`succes_subscription_items_check->sycu_product`.`product_name`'), { [searchCondition]: searchData })]
                [dbReader.Sequelize.where(dbReader.sequelize.col('`sycu_user`.`email`'), { [searchCondition]: searchData })],
                { subscription_number: { [searchCondition]: searchData } }, { subscription_status: { [searchCondition]: searchData } },
            )
            if (start_date && end_date) {
                whereCondition = dbReader.Sequelize.and(orCondition, { subscription_status: [2, 3, 4, 5, 10] },
                    dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_subscription.created_datetime`'), '%Y-%m-%d'), { [Op.gte]: start_date }),
                    dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_subscription.created_datetime`'), '%Y-%m-%d'), { [Op.lte]: end_date }),
                )
            } else {
                whereCondition = dbReader.Sequelize.and(orCondition, { subscription_status: [2, 3, 4, 5, 10] })
            }

            let subscriptionData = await dbReader.userSubscription.findAndCountAll({
                attributes: ["user_subscription_id", "subscription_number", "subscription_status", "total_amount", "next_payment_date", "start_date", "created_datetime",
                    [dbReader.sequelize.fn("concat", dbReader.sequelize.literal('`sycu_user`.`first_name`'), ' ', dbReader.sequelize.literal('`sycu_user`.`last_name`')), "user_name"],
                    [dbReader.sequelize.literal('`sycu_user`.`email`'), "email"], [dbReader.sequelize.literal('`sycu_user`.`user_id`'), "user_id"]
                ],
                where: whereCondition,
                include: [{
                    attributes: [],
                    model: dbReader.users,
                    where: { is_deleted: 0, user_role: 3 }
                }, {
                    required: true,
                    attributes: [],
                    as: "succes_subscription_items_check",
                    model: dbReader.userSubscriptionItems,
                    where: { item_type: 1, is_deleted: 0 },
                    include: [{
                        required: true,
                        attributes: [],
                        model: dbReader.products,
                        where: productCondition
                    }]
                }, {
                    separate: true,
                    attributes: ["user_subscription_item_id",
                        [dbReader.sequelize.literal('`sycu_product`.`ministry_type`'), "ministry_type"],
                        [dbReader.sequelize.literal('`sycu_product`.`is_ministry_page`'), "is_ministry_page"],
                        [dbReader.sequelize.literal('`sycu_product`.`product_name`'), "product_name"]
                    ],
                    model: dbReader.userSubscriptionItems,
                    where: { item_type: 1, is_deleted: 0 },
                    include: [{
                        attributes: [],
                        model: dbReader.products,
                    }]
                }],
                order: [[sort_field, sort_order]],
                group: ['user_subscription_id'],
                limit: row_limit,
                offset: row_offset,
            });
            subscriptionData = JSON.parse(JSON.stringify(subscriptionData))
            new SuccessResponse("Success", {
                count: subscriptionData.count.length,
                rows: subscriptionData.rows
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    //Sm 08-12-2022
    public async expireSubscription(req: Request, res: Response) {
        try {
            //@ts-ignore
            let { sort_field, sort_order, page_record, page_no, filter_1, filter_2, filter_3 } = req.body;
            let productCondition: any = {}, productCondition2: any = {}, productCondition3: any = {};
            let requireFlag: any = false, ministry_type = 0;
            //Searching
            var searchCondition = dbReader.Sequelize.Op.ne, searchData = null;
            if (req.body.search) {
                searchCondition = Op.like;
                searchData = '%' + req.body.search + '%';
            }
            //Pagination
            var limit = page_record == undefined ? 10 : parseInt(page_record);
            var offset = page_no == undefined ? 1 : parseInt(page_no);
            // Automatic Offset and limit will set on the base of page number
            var row_limit = limit;
            var row_offset = (offset * limit) - limit;
            //sorting
            sort_order = sort_order ? sort_order : 'DESC';
            sort_field = sort_field ? sort_field : 'next_payment_date';
            switch (sort_field) {
                case "product_name":
                    sort_field = dbReader.Sequelize.literal('`succes_subscription_items_check->sycu_product`.`product_name`')
                    break;
                case "user_name":
                    sort_field = dbReader.sequelize.fn("concat", dbReader.sequelize.literal('`sycu_user`.`first_name`'), ' ', dbReader.sequelize.literal('`sycu_user`.`last_name`'))
                    break;
                case "email":
                    sort_field = dbReader.sequelize.literal('`sycu_user`.`email`')
                    break;
            }
            //Filter for kids,student,group
            if (filter_1) {
                requireFlag = true;
                if (filter_1 == 'kids') {
                    ministry_type = 1;
                } else if (filter_1 == 'student') {
                    ministry_type = 2;
                } else if (filter_1 == 'group') {
                    ministry_type = 3;
                } else {
                    productCondition = dbReader.Sequelize.and({ is_deleted: 0 },
                        dbReader.Sequelize.where(dbReader.Sequelize.literal('`succes_subscription_items_check->sycu_product`.`product_name`'), { [Op.like]: `%${filter_1}%` })
                    )
                }
                if (ministry_type) {
                    productCondition = { is_deleted: 0, ministry_type: ministry_type };
                }
            } else {
                productCondition = { is_deleted: 0 };
            }
            //Filter for Ministry,Non Ministry
            if (filter_2 == "Non Ministry") {
                requireFlag = true;
                // productCondition2 = { is_ministry_page: 0 }
                productCondition2 = dbReader.Sequelize.and({ is_deleted: 0 },
                    dbReader.Sequelize.where(dbReader.Sequelize.literal('`succes_subscription_items_check->sycu_product`.`product_name`'), { [Op.notLike]: `%Ministry%` })
                )
            } else if (filter_2 == "Ministry") {
                requireFlag = true;
                // productCondition2 = { is_ministry_page: 1 }
                productCondition2 = dbReader.Sequelize.and({ is_deleted: 0 },
                    dbReader.Sequelize.where(dbReader.Sequelize.literal('`succes_subscription_items_check->sycu_product`.`product_name`'), { [Op.like]: `%${filter_2}%` })
                )
            }
            else {
                productCondition2 = ""
            }
            //Filter for V1,V2,V3
            if (filter_3 && filter_3 != "") {
                requireFlag = true;
                productCondition3 = dbReader.Sequelize.and({ is_deleted: 0 },
                    dbReader.Sequelize.where(dbReader.Sequelize.literal('`succes_subscription_items_check->sycu_product`.`product_name`'), { [Op.like]: `%${filter_3}%` })
                )
            }
            else {
                productCondition3 = ""
            }
            let expireData = await dbReader.userSubscription.findAndCountAll({
                attributes: ["user_subscription_id", "subscription_number", "subscription_status", "next_payment_date", "start_date",
                    [dbReader.sequelize.fn("concat", dbReader.sequelize.literal('`sycu_user`.`first_name`'), ' ',
                        dbReader.sequelize.literal('`sycu_user`.`last_name`')), "user_name"],
                    [dbReader.sequelize.literal('`sycu_user`.`email`'), "email"],
                    [dbReader.sequelize.literal('`sycu_user`.`user_id`'), "user_id"]
                ],
                where: dbReader.Sequelize.and(
                    // dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('next_payment_date'), '%Y-%m-%d'), { [Op.gte]: start_date }),
                    // dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('next_payment_date'), '%Y-%m-%d'), { [Op.lte]: end_date }),
                    // dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('next_payment_date'), '%Y-%m-%d'), { [Op.lt]: todays_date }),
                    { subscription_status: [6] },
                    dbReader.Sequelize.or(
                        [dbReader.Sequelize.where(dbReader.sequelize.fn("concat", dbReader.sequelize.col("first_name"), ' ', dbReader.sequelize.col("last_name")), { [searchCondition]: searchData })],
                        [dbReader.Sequelize.where(dbReader.sequelize.col('`sycu_user`.`email`'), { [searchCondition]: searchData })],
                        { subscription_number: { [searchCondition]: searchData } },
                        { subscription_status: { [searchCondition]: searchData } },
                        { next_payment_date: { [searchCondition]: searchData } },
                        { start_date: { [searchCondition]: searchData } },
                        [dbReader.Sequelize.where(dbReader.sequelize.col('`succes_subscription_items_check->sycu_product`.`product_name`'), { [searchCondition]: searchData })]
                    )
                ),
                include: [
                    {
                        attributes: [],
                        model: dbReader.users,
                        where: { is_deleted: 0 }
                    },
                    {
                        as: "succes_subscription_items_check",
                        attributes: [],
                        required: true,
                        model: dbReader.userSubscriptionItems,
                        where: { item_type: 1, is_deleted: 0 },
                        include: [{
                            attributes: [],
                            required: true,
                            model: dbReader.products,
                            where: [productCondition, productCondition2, productCondition3]
                        }]
                    },
                    {
                        separate: true,
                        attributes: ["user_subscription_item_id",
                            [dbReader.sequelize.literal('`sycu_product`.`ministry_type`'), "ministry_type"],
                            [dbReader.sequelize.literal('`sycu_product`.`is_ministry_page`'), "is_ministry_page"],
                            [dbReader.sequelize.literal('`sycu_product`.`product_name`'), "product_name"]
                        ],
                        model: dbReader.userSubscriptionItems,
                        where: { item_type: 1, is_deleted: 0 },
                        include: [{
                            attributes: [],
                            model: dbReader.products,
                            where: { is_deleted: 0 }
                        }]
                    }
                ],
                order: [[sort_field, sort_order]],
                limit: row_limit,
                offset: row_offset,
            })
            expireData = JSON.parse(JSON.stringify(expireData))
            if (expireData) {
                new SuccessResponse("Success", {
                    count: expireData.count,
                    rows: expireData.rows
                }).send(res);
            }
            else {
                new SuccessResponse("No data found", {
                    count: 0,
                    rows: []
                }).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    //KM 07-07-2023
    public async cancelSubscriptionReport(req: Request, res: Response) {
        try {
            //@ts-ignore
            let { sort_field, sort_order, page_record, page_no, filter_1, filter_2, filter_3, filter_4, start_date, end_date } = req.body;
            let productCondition: any = {}, productCondition2: any = {}, productCondition3: any = {};
            let requireFlag: any = false, ministry_type = 0, statusCondition: any = {}, whereCondition: any = {};
            //Searching
            var searchCondition = dbReader.Sequelize.Op.ne, searchData = null;
            if (req.body.search) {
                searchCondition = Op.like;
                searchData = '%' + req.body.search + '%';
            }
            //Pagination
            var limit = page_record == undefined ? 10 : parseInt(page_record);
            var offset = page_no == undefined ? 1 : parseInt(page_no);
            // Automatic Offset and limit will set on the base of page number
            var row_limit = limit;
            var row_offset = (offset * limit) - limit;
            //sorting
            sort_order = sort_order ? sort_order : 'DESC';
            sort_field = sort_field ? sort_field : 'status_updated_date';
            switch (sort_field) {
                case "product_name":
                    sort_field = dbReader.Sequelize.literal('`succes_subscription_items_check->sycu_product`.`product_name`')
                    break;
                case "user_name":
                    sort_field = dbReader.sequelize.fn("concat", dbReader.sequelize.literal('`sycu_user`.`first_name`'), ' ', dbReader.sequelize.literal('`sycu_user`.`last_name`'))
                    break;
                case "email":
                    sort_field = dbReader.sequelize.literal('`sycu_user`.`email`')
                    break;
            }
            //Filter for kids,student,group
            if (filter_1) {
                requireFlag = true;
                if (filter_1 == 'Kids') {
                    ministry_type = 1;
                } else if (filter_1 == 'Student') {
                    ministry_type = 2;
                } else if (filter_1 == 'Group') {
                    ministry_type = 3;
                } else {
                    let site_id = filter_1 == "Hub" ? 5 : (filter_1 == "Slidr" ? 6 : (filter_1 == "Builder" ? 3 : (filter_1 == "People" ? 7 : 2)))
                    // productCondition = dbReader.Sequelize.and({ is_deleted: 0 }, dbReader.Sequelize.where(dbReader.Sequelize.literal('`succes_subscription_items_check->sycu_product`.`product_name`'), { [Op.like]: `%${filter_1}%` }))
                    productCondition = dbReader.Sequelize.and({ is_deleted: 0 }, dbReader.Sequelize.where(dbReader.Sequelize.literal('`succes_subscription_items_check->sycu_product`.`site_id`'), site_id))
                }
                if (ministry_type) {
                    productCondition = { is_deleted: 0, ministry_type: ministry_type };
                }
            } else {
                productCondition = { is_deleted: 0 };
            }
            //Filter for Ministry,Non Ministry
            if (filter_2 == "Non Ministry") {
                requireFlag = true;
                // productCondition2 = dbReader.Sequelize.and({ is_deleted: 0 }, dbReader.Sequelize.where(dbReader.Sequelize.literal('`succes_subscription_items_check->sycu_product`.`product_name`'), { [Op.notLike]: `%Ministry%` }))
                productCondition2 = dbReader.Sequelize.and({ is_deleted: 0 }, dbReader.Sequelize.where(dbReader.Sequelize.literal('`succes_subscription_items_check->sycu_product`.`is_ministry_page`'), 0))
            } else if (filter_2 == "Ministry") {
                requireFlag = true;
                // productCondition2 = dbReader.Sequelize.and({ is_deleted: 0 }, dbReader.Sequelize.where(dbReader.Sequelize.literal('`succes_subscription_items_check->sycu_product`.`product_name`'), { [Op.like]: `%${filter_2}%` }))
                productCondition2 = dbReader.Sequelize.and({ is_deleted: 0 }, dbReader.Sequelize.where(dbReader.Sequelize.literal('`succes_subscription_items_check->sycu_product`.`is_ministry_page`'), 1))
            } else {
                productCondition2 = ""
            }
            //Filter for V1,V2,V3
            if (filter_3 && filter_3 != "") {
                requireFlag = true;
                productCondition3 = dbReader.Sequelize.and({ is_deleted: 0 },
                    dbReader.Sequelize.where(dbReader.Sequelize.literal('`succes_subscription_items_check->sycu_product`.`product_name`'), { [Op.like]: `%${filter_3}%` })
                )
            } else {
                productCondition3 = ""
            }
            //Filter for subscription status
            if (filter_4) {
                statusCondition = { subscription_status: parseInt(filter_4) }
            } else {
                statusCondition = { subscription_status: [4, 5] }
            }

            let orCondition = dbReader.Sequelize.or(
                [dbReader.Sequelize.where(dbReader.sequelize.fn("concat", dbReader.sequelize.col("first_name"), ' ', dbReader.sequelize.col("last_name")), { [searchCondition]: searchData })],
                [dbReader.Sequelize.where(dbReader.sequelize.col('`succes_subscription_items_check->sycu_product`.`product_name`'), { [searchCondition]: searchData })]
                [dbReader.Sequelize.where(dbReader.sequelize.col('`sycu_user`.`email`'), { [searchCondition]: searchData })],
                { subscription_number: { [searchCondition]: searchData } }, { subscription_status: { [searchCondition]: searchData } },
                { next_payment_date: { [searchCondition]: searchData } }, { start_date: { [searchCondition]: searchData } },
            )
            if (start_date && end_date) {
                // end_date = moment(end_date).subtract(1, 'days').format('YYYY-MM-DD');
                whereCondition = dbReader.Sequelize.and(
                    dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_subscription.status_updated_date`'), '%Y-%m-%d'), { [Op.gte]: start_date }),
                    dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_subscription.status_updated_date`'), '%Y-%m-%d'), { [Op.lte]: end_date }), statusCondition, orCondition
                )
            } else {
                whereCondition = dbReader.Sequelize.and(statusCondition, orCondition)
            }

            let activeData = await dbReader.userSubscription.findAndCountAll({
                attributes: ["user_subscription_id", "subscription_number", "subscription_status", "total_amount", "status_updated_date", "subscription_note",
                    [dbReader.sequelize.fn("concat", dbReader.sequelize.literal('`sycu_user`.`first_name`'), ' ', dbReader.sequelize.literal('`sycu_user`.`last_name`')), "user_name"],
                    [dbReader.sequelize.literal('`sycu_user`.`email`'), "email"],
                    [dbReader.sequelize.literal('`sycu_user`.`user_id`'), "user_id"],
                    [dbReader.sequelize.literal('`sycu_user`.`user_role`'), "user_role"]
                ],
                where: whereCondition,
                include: [{
                    attributes: [],
                    model: dbReader.users,
                    where: { user_role: 3, is_deleted: 0 },
                }, {
                    as: "succes_subscription_items_check",
                    attributes: [],
                    required: true,
                    model: dbReader.userSubscriptionItems,
                    where: { item_type: 1, is_deleted: 0 },
                    include: [{
                        attributes: [],
                        required: true,
                        model: dbReader.products,
                        where: [productCondition, productCondition2, productCondition3]
                    }]
                }, {
                    separate: true,
                    attributes: ["user_subscription_item_id",
                        [dbReader.sequelize.literal('`sycu_product`.`ministry_type`'), "ministry_type"],
                        [dbReader.sequelize.literal('`sycu_product`.`is_ministry_page`'), "is_ministry_page"],
                        [dbReader.sequelize.literal('`sycu_product`.`product_name`'), "product_name"]
                    ],
                    model: dbReader.userSubscriptionItems,
                    where: { item_type: 1, is_deleted: 0 },
                    include: [{
                        attributes: [],
                        model: dbReader.products,
                        where: { is_deleted: 0 }
                    }]
                }],
                order: [[sort_field, sort_order]],
                group: ['user_subscription_id'],
                limit: row_limit,
                offset: row_offset,
            })
            if (activeData.count.length) {
                activeData = JSON.parse(JSON.stringify(activeData))
                new SuccessResponse("Success", {
                    count: activeData.count.length,
                    rows: activeData.rows
                }).send(res);
            }
            else {
                new SuccessResponse("No data found.", {
                    count: 0,
                    rows: []
                }).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    //KM 07-07-2023
    public async subscriptionFeedbackReport(req: Request, res: Response) {
        try {
            //@ts-ignore
            let { sort_field, sort_order, page_record, page_no, filter_1, filter_2, filter_3, filter_4, filter_5, start_date, end_date } = req.body;
            let productCondition: any = {}, productCondition2: any = {}, productCondition3: any = {};
            let requireFlag: any = false, ministry_type = 0, statusCondition: any = {}, whereCondition: any = {}, notesCondition: any = {};
            //Searching
            var searchCondition = dbReader.Sequelize.Op.ne, searchData = null;
            if (req.body.search) {
                searchCondition = Op.like;
                searchData = '%' + req.body.search + '%';
            }
            //Pagination
            var limit = page_record == undefined ? 10 : parseInt(page_record);
            var offset = page_no == undefined ? 1 : parseInt(page_no);
            // Automatic Offset and limit will set on the base of page number
            var row_limit = limit;
            var row_offset = (offset * limit) - limit;
            //sorting
            sort_order = sort_order ? sort_order : 'DESC';
            sort_field = sort_field ? sort_field : 'created_note_date';

            switch (sort_field) {
                case "product_name":
                    sort_field = dbReader.Sequelize.literal('`succes_subscription_items_check->sycu_product`.`product_name`')
                    break;
                case "user_name":
                    sort_field = dbReader.sequelize.fn("concat", dbReader.sequelize.literal('`sycu_user`.`first_name`'), ' ', dbReader.sequelize.literal('`sycu_user`.`last_name`'))
                    break;
                case "email":
                    sort_field = dbReader.sequelize.literal('`sycu_user`.`email`')
                    break;
            }

            //Filter for kids,student,group
            if (filter_1) {
                requireFlag = true;
                if (filter_1 == 'Kids') {
                    ministry_type = 1;
                } else if (filter_1 == 'Student') {
                    ministry_type = 2;
                } else if (filter_1 == 'Group') {
                    ministry_type = 3;
                } else {
                    let site_id = filter_1 == "Hub" ? 5 : (filter_1 == "Slidr" ? 6 : (filter_1 == "Builder" ? 3 : (filter_1 == "People" ? 7 : 2)))
                    // productCondition = dbReader.Sequelize.and({ is_deleted: 0 }, dbReader.Sequelize.where(dbReader.Sequelize.literal('`succes_subscription_items_check->sycu_product`.`product_name`'), { [Op.like]: `%${filter_1}%` }))
                    productCondition = dbReader.Sequelize.and({ is_deleted: 0 }, dbReader.Sequelize.where(dbReader.Sequelize.literal('`succes_subscription_items_check->sycu_product`.`site_id`'), site_id))
                }
                if (ministry_type) {
                    productCondition = { is_deleted: 0, ministry_type: ministry_type };
                }
            } else {
                productCondition = { is_deleted: 0 };
            }

            //Filter for Ministry,Non Ministry
            if (filter_2 == "Non Ministry") {
                requireFlag = true;
                // productCondition2 = dbReader.Sequelize.and({ is_deleted: 0 }, dbReader.Sequelize.where(dbReader.Sequelize.literal('`succes_subscription_items_check->sycu_product`.`product_name`'), { [Op.notLike]: `%Ministry%` }))
                productCondition2 = dbReader.Sequelize.and({ is_deleted: 0 }, dbReader.Sequelize.where(dbReader.Sequelize.literal('`succes_subscription_items_check->sycu_product`.`is_ministry_page`'), 0))
            } else if (filter_2 == "Ministry") {
                requireFlag = true;
                // productCondition2 = dbReader.Sequelize.and({ is_deleted: 0 }, dbReader.Sequelize.where(dbReader.Sequelize.literal('`succes_subscription_items_check->sycu_product`.`product_name`'), { [Op.like]: `%${filter_2}%` }))
                productCondition2 = dbReader.Sequelize.and({ is_deleted: 0 }, dbReader.Sequelize.where(dbReader.Sequelize.literal('`succes_subscription_items_check->sycu_product`.`is_ministry_page`'), 1))
            } else {
                productCondition2 = ""
            }

            //Filter for V1,V2,V3
            if (filter_3 && filter_3 != "") {
                requireFlag = true;
                productCondition3 = dbReader.Sequelize.and({ is_deleted: 0 },
                    dbReader.Sequelize.where(dbReader.Sequelize.literal('`succes_subscription_items_check->sycu_product`.`product_name`'), { [Op.like]: `%${filter_3}%` })
                )
            } else {
                productCondition3 = ""
            }

            //Filter for subscription status
            if (filter_4) {
                statusCondition = { subscription_status: parseInt(filter_4) }
            } else {
                statusCondition = { subscription_status: { [Op.ne]: 1 } }
            }

            //Filter for feedback notes
            if (filter_5) {
                let filter5 = { [Op.or]: [{ [Op.eq]: filter_5 }, { [Op.like]: `${filter_5},%` }, { [Op.like]: `%,${filter_5},%` }, { [Op.like]: `%,${filter_5}` }] }
                notesCondition = dbReader.Sequelize.where(dbReader.Sequelize.col('`feedback_option_data_id`'), filter5);
            } else if (filter_5 === 0) {
                notesCondition = { feedback_option_data_id: 0 }
            } else {
                notesCondition = {}
            }

            let orCondition = dbReader.Sequelize.or(
                [dbReader.Sequelize.where(dbReader.sequelize.fn("concat", dbReader.sequelize.col("first_name"), ' ', dbReader.sequelize.col("last_name")), { [searchCondition]: searchData })],
                [dbReader.Sequelize.where(dbReader.sequelize.col('`succes_subscription_items_check->sycu_product`.`product_name`'), { [searchCondition]: searchData })]
                [dbReader.Sequelize.where(dbReader.sequelize.col('`sycu_user`.`email`'), { [searchCondition]: searchData })],
                { subscription_number: { [searchCondition]: searchData } }, { subscription_status: { [searchCondition]: searchData } },
                { start_date: { [searchCondition]: searchData } },
            )

            if (start_date && end_date) {
                end_date = moment(end_date).subtract(1, 'days').format('YYYY-MM-DD');
                whereCondition = dbReader.Sequelize.and(
                    dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_subscription.created_datetime`'), '%Y-%m-%d'), { [Op.gte]: '2023-07-20' }),
                    dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_subscription.created_note_date`'), '%Y-%m-%d'), { [Op.gte]: start_date }),
                    dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_subscription.created_note_date`'), '%Y-%m-%d'), { [Op.lte]: end_date }),
                    statusCondition, orCondition, notesCondition
                )
            } else {
                whereCondition = dbReader.Sequelize.and(
                    dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('`user_subscription.created_datetime`'), '%Y-%m-%d'), { [Op.gte]: '2023-07-20' }),
                    statusCondition, orCondition, notesCondition
                )
            }

            let activeData = await dbReader.userSubscription.findAndCountAll({
                attributes: ["user_subscription_id", "subscription_number", "subscription_status", "created_note_date", "feedback_note", "feedback_option_data_id",
                    [dbReader.sequelize.fn("concat", dbReader.sequelize.literal('`sycu_user`.`first_name`'), ' ',
                        dbReader.sequelize.literal('`sycu_user`.`last_name`')), "user_name"],
                    [dbReader.sequelize.literal('`sycu_user`.`email`'), "email"],
                    [dbReader.sequelize.literal('`sycu_user`.`user_id`'), "user_id"],
                    [dbReader.sequelize.literal('`sycu_user`.`user_role`'), "user_role"]
                ],
                where: whereCondition,
                include: [{
                    attributes: [],
                    model: dbReader.users
                }, {
                    as: "succes_subscription_items_check",
                    attributes: [],
                    required: true,
                    model: dbReader.userSubscriptionItems,
                    where: { item_type: 1, is_deleted: 0 },
                    include: [{
                        attributes: [],
                        required: true,
                        model: dbReader.products,
                        where: [productCondition, productCondition2, productCondition3]
                    }]
                }, {
                    separate: true,
                    attributes: ["user_subscription_item_id",
                        [dbReader.sequelize.literal('`sycu_product`.`ministry_type`'), "ministry_type"],
                        [dbReader.sequelize.literal('`sycu_product`.`is_ministry_page`'), "is_ministry_page"],
                        [dbReader.sequelize.literal('`sycu_product`.`product_name`'), "product_name"]
                    ],
                    model: dbReader.userSubscriptionItems,
                    where: { item_type: 1, is_deleted: 0 },
                    include: [{
                        attributes: [],
                        model: dbReader.products,
                        where: { is_deleted: 0 }
                    }]
                }],
                order: [[sort_field, sort_order]],
                limit: row_limit,
                offset: row_offset,
            });
            if (activeData.rows.length) {
                activeData = JSON.parse(JSON.stringify(activeData))
                new SuccessResponse("Success", {
                    count: activeData.count,
                    rows: activeData.rows
                }).send(res);
            } else {
                new SuccessResponse("No data found.", {
                    count: 0,
                    rows: []
                }).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async allActiveSubscriptions(req: Request, res: Response) {
        try {
            var { ministry_type = 0, month = 0, year = 0 } = req.body, ministryCond: any = {};
            if (!ministry_type) {
                ministryCond = { is_deleted: 0, ministry_type: [1, 2, 3] }
            } else {
                ministryCond = { is_deleted: 0, ministry_type: ministry_type }
            }
            month = month ? month : moment().format('MM'); // Adding 1 because months are zero-based
            year = year ? year : moment().format('YYYY');

            let userSubscriptionData = await dbReader.userSubscription.findAll({
                attributes: ['user_subscription_id', "subscription_number", "subscription_status", "start_date", "end_date",
                    [dbReader.sequelize.fn("concat", dbReader.sequelize.literal('`sycu_user`.`first_name`'), ' ',
                        dbReader.sequelize.literal('`sycu_user`.`last_name`')), "user_name"],
                    [dbReader.sequelize.literal('`sycu_user`.`email`'), "email"],
                    [dbReader.sequelize.literal('`sycu_user`.`user_id`'), "user_id"]],
                where: {
                    site_id: 2,
                    [Op.or]: [{
                        [Op.and]: [
                            dbReader.sequelize.where(dbReader.sequelize.fn('MONTH', dbReader.sequelize.col('start_date')), '=', month),
                            dbReader.sequelize.where(dbReader.sequelize.fn('YEAR', dbReader.sequelize.col('start_date')), '=', year)
                        ]
                    }, {
                        [Op.and]: [
                            dbReader.sequelize.where(dbReader.sequelize.fn('MONTH', dbReader.sequelize.col('end_date')), '=', month),
                            dbReader.sequelize.where(dbReader.sequelize.fn('YEAR', dbReader.sequelize.col('end_date')), '=', year)
                        ]
                    }]
                },
                include: [{
                    attributes: [],
                    model: dbReader.users,
                    where: { user_role: 3, is_deleted: 0 }
                }, {
                    separate: true,
                    model: dbReader.userOrder,
                    attributes: ["user_orders_id", "user_subscription_id", "created_datetime"],
                    where: { order_status: [2, 3, 4, 8, 9, 10] },
                    include: [{
                        separate: true,
                        model: dbReader.userOrderItems,
                        attributes: ["user_order_item_id"],
                        where: { item_type: 1, is_deleted: 0 },
                        include: [{
                            required: false,
                            attributes: ['product_id', 'product_name', 'ministry_type', 'is_ministry_page', 'product_duration'],
                            model: dbReader.products,
                            where: ministryCond
                        }, {
                            required: false,
                            attributes: ['product_id', 'product_name', 'ministry_type', 'is_ministry_page', 'product_duration'],
                            as: 'updated_product',
                            model: dbReader.products,
                            where: ministryCond
                        }]
                    }]
                }]
            });
            userSubscriptionData = JSON.parse(JSON.stringify(userSubscriptionData));
            userSubscriptionData.forEach((sub: any) => {
                if (sub.user_orders.length > 0) {
                    sub.user_orders.forEach((suo: any) => {
                        if (suo.user_order_items.length > 0) {
                            suo.user_order_items.forEach((oi: any) => {
                                let order_product = oi.updated_product ? oi.updated_product : oi.sycu_product;
                                if (order_product) {
                                    let order_start_date = moment(suo.created_datetime);
                                    let order_end_date = moment(suo.created_datetime).add(order_product.product_duration, 'days');
                                    oi.order_start_date = moment(order_start_date).format('MM-DD-YYYY');
                                    oi.order_end_date = moment(order_end_date).format('MM-DD-YYYY');
                                    const yearInt = parseInt(year, 10);
                                    const monthInt = parseInt(month, 10);

                                    // Check if order_start_date and order_end_date fall within the specified month and year
                                    const isMonthAndYearInRange =
                                        (order_start_date.isSameOrAfter(`${yearInt}-${monthInt}-01`, 'day') &&      // Start date is on or after the first day of the month
                                            order_start_date.isSameOrBefore(`${yearInt}-${monthInt}-31`, 'day')) || // Start date is on or before the last day of the month
                                        (order_end_date.isSameOrAfter(`${yearInt}-${monthInt}-01`, 'day') &&        // End date is on or after the first day of the month
                                            order_end_date.isSameOrBefore(`${yearInt}-${monthInt}-31`, 'day'));     // End date is on or before the last day of the month

                                    if (isMonthAndYearInRange) {
                                        oi.order_product = order_product;
                                    }
                                }
                            })
                        }
                    })
                    sub.user_orders = sub.user_orders.filter((f: any) => f.user_order_items.find((s: any) => s.order_product))
                }
            })
            userSubscriptionData = userSubscriptionData.filter((us: any) => us.user_orders.length > 0)
            new SuccessResponse("Success", {
                count: userSubscriptionData.length,
                data: userSubscriptionData
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async allActiveSubscriptionsFunction(ministry_type: any = 0, site_id = 2, monthYear: any = 0, product_duration: any = 0, is_from: any = 0, bundleSubscriptionFlag: any = 0) {
        var ministryCond: any = {}, bundleSubscriptionCond: any = {};
        if (!ministry_type) {
            ministryCond = { is_deleted: 0, ministry_type: [1, 2] };
        } else {
            ministryCond = { is_deleted: 0, ministry_type: ministry_type };
        }

        monthYear = monthYear ? monthYear : moment().format('MM-YYYY');
        const [monthStr, year] = monthYear.split(' ');
        const month = new Date(Date.parse(monthStr + " 1, " + year)).getMonth() + 1;
        let monthInt = month < 10 ? '0' + month : month.toString();

        if (site_id != 2) {
            ministryCond = { is_deleted: 0, ministry_type: 0 };
        }
        if (bundleSubscriptionFlag == 1) {
            bundleSubscriptionCond = { is_bundle_subscription: 1 }
        }

        let userSubscriptionData = await dbReader.userSubscription.findAll({
            attributes: ['user_subscription_id', "subscription_number", "subscription_status", "start_date", "end_date",
                [dbReader.sequelize.literal('`sycu_user`.`first_name`'), "first_name"],
                [dbReader.sequelize.literal('`sycu_user`.`last_name`'), "last_name"],
                [dbReader.sequelize.literal('`sycu_user`.`email`'), "email"],
                [dbReader.sequelize.literal('`sycu_user`.`user_id`'), "user_id"]],
            where: {
                [Op.and]: [{ site_id: site_id }, bundleSubscriptionCond, {
                    [Op.or]: [{
                        [Op.and]: [
                            dbReader.sequelize.where(dbReader.sequelize.fn('MONTH', dbReader.sequelize.col('start_date')), { [Op.lte]: monthInt }),
                            dbReader.sequelize.where(dbReader.sequelize.fn('YEAR', dbReader.sequelize.col('start_date')), '=', year)
                        ]
                    }, {
                        [Op.and]: [
                            dbReader.sequelize.where(dbReader.sequelize.fn('MONTH', dbReader.sequelize.col('end_date')), { [Op.gte]: monthInt }),
                            dbReader.sequelize.where(dbReader.sequelize.fn('YEAR', dbReader.sequelize.col('end_date')), '=', year)
                        ]
                    }]
                }]
            },
            include: [{
                attributes: [],
                model: dbReader.users,
            }, {
                separate: true,
                model: dbReader.userSubscriptionItems,
                attributes: ['user_subscription_item_id', 'product_name', 'product_id', 'created_datetime'],
                where: { is_deleted: 0, item_type: 1 },
                include: [{
                    model: dbReader.products,
                    attributes: ['ministry_type', 'product_duration'],
                    where: { ministry_type: { [Op.in]: [1, 2] } }
                }]
            }, {
                separate: true,
                model: dbReader.userOrder,
                attributes: ["user_orders_id", "user_subscription_id", "created_datetime", "total_amount"],
                where: { order_status: { [Op.notIn]: [1, 7, 12] } }, // [2, 4, 10] },
                include: [{
                    separate: true,
                    model: dbReader.userOrderItems,
                    attributes: ["user_order_item_id"],
                    where: { item_type: 1, is_deleted: 0 },
                    include: [{
                        required: true,
                        attributes: ['product_id', 'product_name', 'ministry_type', 'is_ministry_page', 'product_duration'],
                        model: dbReader.products,
                        where: ministryCond
                    }]
                }]
            }]
        });
        userSubscriptionData = JSON.parse(JSON.stringify(userSubscriptionData));
        userSubscriptionData.forEach((e: any) => {
            e.user_orders = e.user_orders.filter((f: any) => f.user_order_items.length > 0);
        });
        userSubscriptionData = userSubscriptionData.filter((us: any) => us.user_orders.length > 0)

        let userIDs: any = [];
        if (is_from) {
            userSubscriptionData.forEach((e: any) => {
                if (e.user_subscription_items.some((item: any) => item['sycu_product']?.ministry_type == 1) &&
                    e.user_subscription_items.some((item: any) => item['sycu_product']?.ministry_type == 2) &&
                    !userIDs.includes(e.user_id)) userIDs.push(e.user_id);
            });
        } else {
            if (product_duration) {
                userSubscriptionData.forEach((sub: any) => {
                    sub.user_orders.forEach((suo: any) => {
                        if (suo.user_order_items.some((item: any) => item['sycu_product']?.product_duration === product_duration)) {
                            if (!userIDs.includes(sub.user_id)) userIDs.push(sub.user_id);
                        }
                    });
                })
            } else {
                userSubscriptionData.forEach((e: any) => {
                    if (!userIDs.includes(e.user_id)) userIDs.push(e.user_id);
                });
            }
        }
        return userIDs;
    }
}
