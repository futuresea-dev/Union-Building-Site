import { Request, Response } from "express";
import { ErrorController } from "../core/ErrorController";
import { SuccessResponse } from '../core/ApiResponse';
import { BadRequestError, ApiError } from '../core/ApiError';
const { dbReader, dbWriter } = require('../models/dbConfig');
const request = require('request');
const EC = new ErrorController();

export class gameNotificationController {

    public FcmNotificationForIos(device_token_Mob: any, title: any, body: any, nid: any, tid: any, n_type: any) {
        var serverKey;
        if (process.env.NODE_ENV == "production") {
            serverKey = 'AAAAJIXY-7k:APA91bFuarx2-nz5AK0Z8hZj0tyUW7SP-NIpnkk0KbSdNjtF1t48F2b8-uDg9LEZWyVIK1ZGIOmEY3NcDYd_GDiDbxtaCH7BOUKs0EeL7RHCR4AfhTWYu4deYZ255HHRoPkxl6EAea3S'
        } else {
            serverKey = 'AAAAGNEd8AI:APA91bFOMP_3gPsU7oqeyhbY0vS8Db3nwksk6dCnSedERnhRbXgNLf7KmuZ7FlMJVvhMcBK7P7WWJL7gZb5cGze8LE4jeNF7kx01Xr7jn3MXoBuTOoSZCOX16XgQCrN3mVlqGftScOzH'
        }
        var options = {
            method: 'POST',
            url: "https://fcm.googleapis.com/fcm/send",
            qs: { format: 'json' },
            headers: {
                'content-type': 'application/json',
                authorization: 'key=' + serverKey
            },
            body: {
                notification: {
                    "body": body,
                    "title": title,
                    "sound": "default",
                    "icon": "ic_stat_hit_trans",
                    "badge": 1,
                },
                "apns": {
                    "payload": {
                        "aps": {
                            "mutable-content": 1
                        }
                    }
                },
                data: {
                    "nid": parseInt(nid),
                    "tid": parseInt(tid),
                    "content-available": 1,
                    "type": parseInt(n_type),
                },
                registration_ids: device_token_Mob
            },
            json: true
        };
        request(options, function (error: any, body: any) {
            if (error) {
                console.log(error);
            } else {
                console.log(body)
            }
        });
    }

    public FcmNotificationForAndroid(device_token_Mob: any, title: any, body: any, nid: any, tid: any, n_type: any) {
        var serverKey;
        if (process.env.NODE_ENV == "production") {
            serverKey = 'AAAAJIXY-7k:APA91bFuarx2-nz5AK0Z8hZj0tyUW7SP-NIpnkk0KbSdNjtF1t48F2b8-uDg9LEZWyVIK1ZGIOmEY3NcDYd_GDiDbxtaCH7BOUKs0EeL7RHCR4AfhTWYu4deYZ255HHRoPkxl6EAea3S'
        } else {
            serverKey = 'AAAAGNEd8AI:APA91bFOMP_3gPsU7oqeyhbY0vS8Db3nwksk6dCnSedERnhRbXgNLf7KmuZ7FlMJVvhMcBK7P7WWJL7gZb5cGze8LE4jeNF7kx01Xr7jn3MXoBuTOoSZCOX16XgQCrN3mVlqGftScOzH'
        }
        var options = {
            method: 'POST',
            url: "https://fcm.googleapis.com/fcm/send",
            qs: { format: 'json' },
            headers: {
                'content-type': 'application/json',
                authorization: 'key=' + serverKey
            },
            body: {
                data: {
                    "body": body,
                    "title": title,
                    "nid": parseInt(nid),
                    "tid": parseInt(tid),
                    "type": parseInt(n_type),
                    "badge": 1,
                },
                registration_ids: device_token_Mob
            },
            json: true
        };
        request(options, function (error: any, body: any) {
            if (error) {
                console.log(error);
            } else {
                console.log(body)
            }
        });
    }

    public async sendPushNotification(req: Request, res: Response) {
        try {
            let { user_ids, game_id, notification_title, notification_description, user_type } = req.body, notifications: any;
            let iosDeviceTokens: any = [], androidDeviceTokens: any = [],webDeviceTokens: any = [], userIds: any = [], sentPayload: any = [], whereCondition: any;
            let curObj = new gameNotificationController();
            let notification_type = (game_id == 0) ? 0 : 1;
            if (user_ids.length <= 0 && user_type) {
                if (user_type == 2 || user_type == 3 || user_type == 1) {
                    whereCondition = { via_platform: user_type, is_deleted: 0, status: 1 }
                } else {
                    whereCondition = { is_deleted: 0, status: 1 }
                }
                let users = await dbReader.users.findAll({
                    attributes: ["user_id"],
                    where: whereCondition,
                });
                users = JSON.parse(JSON.stringify(users));
                users.forEach((element: any) => { user_ids.push(element.user_id) });
            }
            if (user_ids.length) {
                notifications = await dbWriter.notifications.create({
                    notification_title: notification_title,
                    notification_description: notification_description,
                    notification_type_id: game_id,
                    notification_type: notification_type,
                });
                let notification_id = notifications.notification_id;
              
                let webUserLoginLogs = await dbReader.userLoginLogs.findAll({
                    where: { user_id: user_ids, is_logout: 0, via_platform: 1, device_token: { [dbReader.Sequelize.Op.ne]: null } },
                    attributes: ['user_id', 'device_token']
                });
                let iosUserLoginLogs = await dbReader.userLoginLogs.findAll({
                    where: { user_id: user_ids, is_logout: 0, via_platform: 2, device_token: { [dbReader.Sequelize.Op.ne]: null } },
                    attributes: ['user_id', 'device_token']
                });
                let AndroidUserLoginLogs = await dbReader.userLoginLogs.findAll({
                    where: { user_id: user_ids, is_logout: 0, via_platform: 3, device_token: { [dbReader.Sequelize.Op.ne]: null } },
                    attributes: ['user_id', 'device_token']
                });
                //user login for web
                if (webUserLoginLogs.length) {
                    webUserLoginLogs = JSON.parse(JSON.stringify(webUserLoginLogs));
                    webUserLoginLogs.forEach((element: any) => {
                        if (element.device_token && !webDeviceTokens.includes(element.device_token)) {
                            webDeviceTokens.push(element.device_token);
                            userIds.push(element.user_id);
                        }
                    });
                }
                //user login for ios
                if (iosUserLoginLogs.length) {
                    iosUserLoginLogs = JSON.parse(JSON.stringify(iosUserLoginLogs));
                    iosUserLoginLogs.forEach((element: any) => {
                        if (element.device_token && !iosDeviceTokens.includes(element.device_token)) {
                            iosDeviceTokens.push(element.device_token);
                            userIds.push(element.user_id);
                        }
                    });
                }
                //user login for android
                if (AndroidUserLoginLogs.length) {
                    AndroidUserLoginLogs = JSON.parse(JSON.stringify(AndroidUserLoginLogs));
                    AndroidUserLoginLogs.forEach((element: any) => {
                        if (element.device_token && !androidDeviceTokens.includes(element.device_token)) {
                            androidDeviceTokens.push(element.device_token);
                            userIds.push(element.user_id);
                        }
                    });
                }
                if (userIds.length) {
                    userIds.forEach((user: any) => {
                        sentPayload.push({
                            notification_id: notification_id,
                            user_id: user,
                            is_seen: 0,
                        });
                    });
                    if (sentPayload.length) {
                        await dbWriter.sentNotifications.bulkCreate(sentPayload);
                    }
                }
                if (webDeviceTokens.length) {
                    curObj.FcmNotificationForAndroid(webDeviceTokens, notification_title, notification_description, notification_id, game_id, notification_type);
                }
                if (iosDeviceTokens.length) {
                    curObj.FcmNotificationForIos(iosDeviceTokens, notification_title, notification_description, notification_id, game_id, notification_type);
                }
                if (androidDeviceTokens.length) {
                    curObj.FcmNotificationForAndroid(androidDeviceTokens, notification_title, notification_description, notification_id, game_id, notification_type);
                }
            }

            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token,
                data: notifications
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getAllUsersTypeWise(req: Request, res: Response) {
        try {
            let reqBody = req.body, whereCondition: any;
            let rowLimit = reqBody.page_record ? parseInt(reqBody.page_record) : 20;
            let rowOffset = reqBody.page_no ? ((reqBody.page_no * reqBody.page_record) - reqBody.page_record) : 0;
            let SearchCondition = dbReader.Sequelize.Op.ne, SearchData = null;
            if (reqBody.search) {
                SearchCondition = dbReader.Sequelize.Op.like;
                SearchData = "%" + reqBody.search + "%";
            }
            if (reqBody.via_platform) {
                whereCondition = { via_platform: reqBody.via_platform, is_deleted: 0, status: 1 }
            } else {
                whereCondition = { is_deleted: 0, status: 1 }
            }

            let users = await dbReader.users.findAndCountAll({
                attributes: ["user_id", "profile_image", "display_name", "email"],
                where: dbReader.Sequelize.and(
                    whereCondition,
                    dbReader.Sequelize.or(
                        { first_name: { [SearchCondition]: SearchData } },
                        { last_name: { [SearchCondition]: SearchData } },
                        { username: { [SearchCondition]: SearchData } },
                        { display_name: { [SearchCondition]: SearchData } },
                        { email: { [SearchCondition]: SearchData } }),
                ),
                limit: rowLimit,
                offset: rowOffset,
            });
            users = JSON.parse(JSON.stringify(users));
            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token,
                users: users
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
}
