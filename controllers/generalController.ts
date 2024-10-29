import { Request, Response } from "express";
import { ErrorController } from "../core/ErrorController";
import { SuccessResponse } from '../core/ApiResponse';
import { BadRequestError, ApiError } from '../core/ApiError';
const { dbReader, dbWriter } = require('../models/dbConfig');
const EC = new ErrorController();
export class GeneralController {

    public async getStateList(req: Request, res: Response) {
        try {

            let stateList = await dbReader.state.findAll({
                where: {
                    country_id: req.params.countryId
                }
            });
            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token,
                stateList
            }).send(res);
        }
        catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
    public async getCountryList(req: Request, res: Response) {
        try {
            let countryList = await dbReader.country.findAll({});
            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token,
                countryList
            }).send(res);
        }
        catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
    public async saveLog(req: Request, res: Response) {
        try {
            //@ts-ignore           
            let { type, event_type_id, message, is_internal = false } = req.body;
            let logResponse = await dbWriter.sycu_logs.create(
                {
                    type: type,
                    event_type_id: event_type_id,
                    message: message,
                }
            );
            if (is_internal) {
                return true
            }
            else {
                new SuccessResponse(EC.success, {
                    //@ts-ignore
                    token: req.token,
                    logResponse
                }).send(res);
            }
        }
        catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
    public async saveNotes(req: Request, res: Response) {
        try {
            //@ts-ignore           
            let { type, event_type_id, message, is_internal = false } = req.body;
            let logResponse = await dbWriter.notes.create(
                {
                    type: type,
                    event_type_id: event_type_id,
                    message: message,
                    is_system:0,
                    // @ts-ignore
                    user_id:req.user_id
                }
            );
            if (is_internal) {
                return true
            }
            else {
                new SuccessResponse(EC.success, {
                    //@ts-ignore
                    token: req.token,
                    logResponse
                }).send(res);
            }
        }
        catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public getCurrentUserDetail(req: Request, res: Response) {
        //@ts-ignore
        let { hash_key = null, token = null, user_role = null, user_id = 0, admin_user_id = null } = req;
        let isAdmin = user_role == 2 || user_role == 1;
        if (isAdmin && typeof req.body.user_id != undefined && req.body.user_id != null && req.body.user_id != "") {
            admin_user_id = user_id;
            user_id = req.body.user_id;
        }
        return { hash_key, token, user_role, user_id, admin_user_id };
    }

    public getACTagType(ministry_type: any, is_ministry_page: any, product_name: any) {
        try {
            let tagtype = '';
            if (ministry_type == 1) {
                if (is_ministry_page == 1) {
                    tagtype = 'gykm';
                } else {
                    tagtype = 'gyk';
                }
            } else if (ministry_type == 2) {
                if (is_ministry_page == 1) {
                    tagtype = 'gysm';
                } else {
                    tagtype = 'gys';
                }
            } else if (ministry_type == 3) {
                tagtype = 'gyg';
            } /* else {
                if (product_name.includes("Hub")) {
                    tagtype = 'hubs';
                } else if (product_name.includes("Slidr")) {
                    tagtype = 'slides';
                } else if (product_name.includes("Builder")) {
                    tagtype = 'lesson';
                } else {
                    tagtype = 'board';
                }
            } */
            return tagtype;
        } catch (e: any) {
            console.log(e.message)
        }
    }

    public async checkGroupProductRenewalCycle(user_subscription_id: any) {
        try {
            let data = await dbReader.userSubscription.findOne({
                attributes: ['user_subscription_id'],
                where: { user_subscription_id: user_subscription_id },
                include: [{
                    separate: true,
                    attributes: ['user_subscription_item_id', 'product_id', 'product_name', 'updated_product_id', 'updated_product_name',
                        [dbReader.Sequelize.literal('`sycu_product`.`ministry_type`'), 'ministry_type']],
                    model: dbReader.userSubscriptionItems,
                    where: { item_type: 1, is_deleted: 0 },
                    include: [{
                        attributes: [],
                        model: dbReader.products,
                    }]
                }, {
                    attributes: ['user_orders_id'],
                    model: dbReader.userOrder,
                    include: [{
                        separate: true,
                        model: dbReader.userOrderItems,
                        attributes: ['product_id', 'product_name', 'renewal_count',
                            [dbReader.Sequelize.literal('`sycu_product`.`product_duration`'), 'product_duration'],
                            [dbReader.Sequelize.literal('`sycu_product`.`ministry_type`'), 'ministry_type']],
                        where: { item_type: 1, is_deleted: 0 },
                        include: [{
                            attributes: [],
                            model: dbReader.products,
                        }]
                    }],
                    order: [["user_orders_id", "DESC"]],
                    limit: 1
                }]
            });
            data = JSON.parse(JSON.stringify(data));
            let renewalOffFlag: any = false;
            let havingOtherMinistryProducts = data.user_subscription_items.find((s: any) => s.ministry_type != 3) ? true : false;
            data.user_subscription_items.forEach((usi: any) => {
                if (usi.ministry_type == 3) {
                    let product = data.user_orders[0].user_order_items.find((o: any) => o.product_id == usi.product_id && o.ministry_type == usi.ministry_type);
                    if (product.product_duration == 90 && product.renewal_count == 4) {
                        renewalOffFlag = true;
                    } else if (product.product_duration == 30 && product.renewal_count == 12) {
                        renewalOffFlag = true;
                    } else if (product.product_duration == 365) {
                        renewalOffFlag = true;
                    }
                }
            });
            if (renewalOffFlag && !havingOtherMinistryProducts) {
                //update is_recurring_subscription 
                await dbWriter.userSubscription.update({
                    is_recurring_subscription: 0
                }, {
                    where: { user_subscription_id: user_subscription_id }
                });
            }
            return true;
        } catch (e: any) {
            console.log(e.message)
        }
    }
}
