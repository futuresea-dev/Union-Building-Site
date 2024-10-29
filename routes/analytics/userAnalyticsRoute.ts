import { UserAnalyticsController } from "../../controllers/analytics/userAnalyticsController";
import validator from '../../helpers/validator';
import { Router } from "express";
import schema from './schema';

const BearerToken = require('../../middleware/bearerToken');

export class UserAnalyticsRoute extends UserAnalyticsController {

    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {
        router.post("/getUserCounts", BearerToken, validator(schema.userGraphPayload), this.getUserCounts);
        router.post("/getUserListDateWise", BearerToken, validator(schema.userListPayload), this.getUserListDateWise);
        router.post("/getFreeUserGraphData", BearerToken, validator(schema.userGraphPayload), this.getFreeUserGraphData);
        router.post("/getSubscribeUserGraphData", BearerToken, validator(schema.userGraphPayload), this.getSubscribeUserGraphData);
        router.post("/getRegisteredUserGraphData", BearerToken, validator(schema.userGraphPayload), this.getRegisteredUserGraphData);
        router.post("/getUserMembershipDetails", BearerToken, this.getUserMembershipDetails);

    }
}
