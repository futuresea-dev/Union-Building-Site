import { Request, Response } from "express";
import { ErrorController } from "../core/ErrorController";
import { SuccessResponse } from '../core/ApiResponse';
import { BadRequestError, ApiError } from '../core/ApiError';
const { dbReader, dbWriter } = require('../models/dbConfig');
const EC = new ErrorController();
const { Op } = dbReader.Sequelize;

export class orderNotesController {

    /**
    * list all notes
    * @param req 
    * @param res 
    */
    public async listNotesOld(req: Request, res: Response) {
        try {
            let typeId = (req.body.event_type_id) ? req.body.event_type_id : 0;
            let userId = (req.body.user_id) ? req.body.user_id : 0;
            let type = (req.body.type) ? req.body.type : 0;
            let noteType = (req.body.noteType) ? req.body.noteType : 0;
            let {start_date,end_date} = req.body;
            let data: any;
            if (type == 4) {
                data = await dbReader.orderNotes.findAndCountAll({
                    attributes: ['message', 'note_id', 'created_datetime'],
                    where: {
                        type: type,
                        is_deleted: 0,
                        event_type_id: userId
                    },
                    order: [['note_id', 'DESC']]
                });
                if (data.rows.length) {
                    data = JSON.parse(JSON.stringify(data));
                    data.rows.forEach((e: any) => {
                        e.user_subscription_id = 0;
                        e.subscription_number = 0;
                    });
                }
            } else {
                if (typeId) {
                    data = await dbReader.orderNotes.findAndCountAll({
                        where: {
                            event_type_id: typeId,
                            type: type,
                            is_deleted: 0
                        },
                        attributes: ['message', 'note_id', 'created_datetime'],
                        order: [['note_id', 'DESC']]
                    });
                    data = JSON.parse(JSON.stringify(data));
                } else if (userId) {
                    let arrUserSubscriptionId: any = [];
                    let subscription_data = await dbReader.userSubscription.findAll({
                        attributes: ['user_subscription_id'],
                        where: { user_id: userId },
                    });
                    subscription_data.forEach((e: any) => {
                        arrUserSubscriptionId.push(e.user_subscription_id);
                    });
                    data = await dbReader.orderNotes.findAndCountAll({
                        attributes: ['message', 'note_id', 'created_datetime'],
                        where: {
                            [Op.and]: [{
                                [Op.or]: [{
                                    event_type_id: arrUserSubscriptionId,
                                    type: 2
                                }, {
                                    event_type_id: userId,
                                    type: 3
                                }, {
                                    event_type_id: userId,
                                    type: 4
                                },{
                                    event_type_id: userId,
                                    type: 5
                                }]
                            }, //Subscription type
                            { is_deleted: 0 }]
                        },
                        include: [{
                            model: dbReader.userSubscription,
                            attributes: ["user_subscription_id", "subscription_number"],
                        }],
                        order: [['note_id', 'DESC']]
                    });
                    if (data.rows.length) {
                        data = JSON.parse(JSON.stringify(data));
                        data.rows.forEach((e: any) => {
                            e.user_subscription_id = e.user_subscriptions.length ? e.user_subscriptions[0].user_subscription_id : 0;
                            e.subscription_number = e.user_subscriptions.length ? e.user_subscriptions[0].subscription_number : 0;
                            delete e.user_subscriptions;
                        });
                    }
                } else {
                    data.rows = [];
                    data.count = 0;
                }
            }
            let message = data.rows.length > 0 ? EC.success : EC.noDataFound;
            new SuccessResponse(message, {
                user: null,
                //@ts-ignore
                token: req.token,
                count: data.count,
                rows: data.rows
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async listNotes(req: Request, res: Response) {
        try {
            let typeId = (req.body.event_type_id) ? req.body.event_type_id : 0;
            let userId = (req.body.user_id) ? req.body.user_id : 0;
            let type = (req.body.type) ? req.body.type : 0;
            let noteType = (req.body.noteType) ? req.body.noteType : 0;
            let {start_date,end_date} = req.body;
            let data: any;
            if (type == 4) {
                data = await dbReader.orderNotes.findAndCountAll({
                    attributes: ['message', 'note_id', 'created_datetime'],
                    where: {
                        type: type,
                        is_deleted: 0,
                        event_type_id: userId
                    },
                    order: [['note_id', 'DESC']]
                });
                if (data.rows.length) {
                    data = JSON.parse(JSON.stringify(data));
                    data.rows.forEach((e: any) => {
                        e.user_subscription_id = 0;
                        e.subscription_number = 0;
                    });
                }
            } else {
                if (typeId) {
                    if(noteType==2){
                        data = await dbReader.orderNotes.findAndCountAll({
                            where: {
                                event_type_id: typeId,
                                type: type,
                                is_deleted: 0,
                                ...(start_date && end_date ? {
                                    created_datetime: {
                                        [Op.gte]: start_date,
                                        [Op.lte]: end_date
                                    }
                                } : {})
                            },
                            attributes: ['message', 'note_id', 'created_datetime','is_pinned','is_system'],
                            order: [['note_id', 'DESC']]
                        });
                    }
                    else{
                        data = await dbReader.orderNotes.findAndCountAll({
                            where: {
                                event_type_id: typeId,
                                type: type,
                                is_deleted: 0,
                                is_system:noteType,
                                ...(start_date && end_date ? {
                                    created_datetime: {
                                        [Op.gte]: start_date,
                                        [Op.lte]: end_date
                                    }
                                } : {})
                            },
                            attributes: ['message', 'note_id', 'created_datetime','is_pinned','is_system'],
                            order: [['note_id', 'DESC']]
                        });
                    }
                    data = JSON.parse(JSON.stringify(data));
                } else if (userId) {
                    let arrUserSubscriptionId: any = [];
                    let subscription_data = await dbReader.userSubscription.findAll({
                        attributes: ['user_subscription_id'],
                        where: { user_id: userId },
                    });
                    subscription_data.forEach((e: any) => {
                        arrUserSubscriptionId.push(e.user_subscription_id);
                    });
                    if(noteType==2){
                        data = await dbReader.orderNotes.findAndCountAll({
                            attributes: ['message', 'note_id', 'created_datetime','is_pinned','is_system'],
                            where: {
                                [Op.and]: [{
                                    [Op.or]: [{
                                        event_type_id: arrUserSubscriptionId,
                                        type: 2
                                    }, {
                                        event_type_id: userId,
                                        type: 3
                                    },{
                                        event_type_id: userId,
                                        type: 4
                                    },{
                                        event_type_id: userId,
                                        type: 5
                                    }]
                                }, //Subscription type
                                { is_deleted: 0,...(start_date && end_date ? {
                                    created_datetime: {
                                        [Op.gte]: start_date,
                                        [Op.lte]: end_date
                                    }
                                } : {}) }]
                            },
                            include: [{
                                model: dbReader.userSubscription,
                                attributes: ["user_subscription_id", "subscription_number"],
                            }],
                            order: [['note_id', 'DESC']]
                        });
                    }
                    else{
                        data = await dbReader.orderNotes.findAndCountAll({
                            attributes: ['message', 'note_id', 'created_datetime','is_pinned','is_system'],
                            where: {
                                [Op.and]: [{
                                    [Op.or]: [{
                                        event_type_id: arrUserSubscriptionId,
                                        type: 2
                                    }, {
                                        event_type_id: userId,
                                        type: 3
                                    },{
                                        event_type_id: userId,
                                        type: 4
                                    },
                                {
                                    event_type_id: userId,
                                    type: 5
                                }]
                                }, //Subscription type
                                { is_deleted: 0,is_system:noteType,...(start_date && end_date ? {
                                    created_datetime: {
                                        [Op.gte]: start_date,
                                        [Op.lte]: end_date
                                    }
                                } : {}) }]
                            },
                            include: [{
                                model: dbReader.userSubscription,
                                attributes: ["user_subscription_id", "subscription_number"],
                            }],
                            order: [['note_id', 'DESC']]
                        });
                    }
                    if (data.rows.length) {
                        data = JSON.parse(JSON.stringify(data));
                        data.rows.forEach((e: any) => {
                            e.user_subscription_id = e.user_subscriptions.length ? e.user_subscriptions[0].user_subscription_id : 0;
                            e.subscription_number = e.user_subscriptions.length ? e.user_subscriptions[0].subscription_number : 0;
                            delete e.user_subscriptions;
                        });
                    }
                } else {
                    data.rows = [];
                    data.count = 0;
                }
            }
            let message = data.rows.length > 0 ? EC.success : EC.noDataFound;
            // let findIndex = data.rows.findIndex((e: any) => e.is_pinned == 1);
            // let pinned = data.rows[findIndex] ? data.rows[findIndex] : null;
            let pinned = data.rows.filter((e:any)=>{
                return e.is_pinned==1
            })
            new SuccessResponse(message, {
                user: null,
                //@ts-ignore
                token: req.token,
                count: data.count,
                rows: data.rows,
                pinned: pinned
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    /**
    * save notes
    * @param req 
    * @param res 
    */
    public async saveNotes(req: Request, res: Response) {
        try {
            //@ts-ignore
            let { display_name = '' } = req;
            var typeId = (req.body.event_type_id) ? req.body.event_type_id : '';
            var type = (req.body.type) ? req.body.type : '';
            var message = (req.body.message) ? req.body.message : '';
            var noteId = (req.body.note_id) ? req.body.note_id : '';
            var isCustomer = (req.body.is_customer) ? req.body.is_customer : 0;
            message = display_name ? (message + ' (added by ' + display_name + ')') : message;
            var data = await dbWriter.orderNotes.create(
                {
                    event_type_id: typeId,
                    type: type,
                    message: message,
                    is_deleted: 0,
                    is_customer: isCustomer,
                    is_system:0,
                    // @ts-ignore
                    user_id:req.user_id
                }
            );

            new SuccessResponse(EC.saveDataSuccess, {
                user: null,
                //@ts-ignore
                token: req.token
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    /**
     * delete notes
     * @param req 
     * @param res 
     */
    public async deleteNote(req: Request, res: Response) {
        try {
            var noteId = (req.params.id) ? req.params.id : '';
            if (noteId) {
                var data = await dbWriter.orderNotes.update({
                    is_deleted: 1
                }, {
                    where: { note_id: noteId }
                });

            } else {
                throw new Error(EC.requiredFieldError);
            }

            new SuccessResponse(EC.deleteDataSuccess, {
                user: null,
                //@ts-ignore
                token: req.token,
                count: data.count,
                rows: data
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async pinNote(req: Request, res: Response) {
        try {
            let {note_id,is_pinned} = req.body;
                await dbWriter.orderNotes.update({
                    is_pinned:is_pinned,
                    
                },{
                    where:{
                        
                        note_id:note_id
                    }
                })
            new SuccessResponse(EC.pinnedNote, {}).send(res);
        } catch (error:any) {
            ApiError.handle(new BadRequestError(error.message), res);
        }
    }
    
}