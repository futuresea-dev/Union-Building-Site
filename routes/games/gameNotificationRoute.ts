import { Router } from "express";
import { gameNotificationController } from "../../controllers/gameNotificationController";
import validator from '../../helpers/validator';
import schema from './schema';
const BearerToken = require("../../middleware/bearerToken");

export class GameNotificationRoute extends gameNotificationController {

    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {
        router.post("/getAllUsersTypeWise", BearerToken, validator(schema.getUsersPayload), this.getAllUsersTypeWise)
        router.post("/sendPushNotification", BearerToken, validator(schema.notificationPayload), this.sendPushNotification)
    }
}
