import { Router } from "express";
import { SubscriptionReportController } from "../../controllers/subscriptionReportController";
const BearerToken = require('../../middleware/bearerToken');
import validator, { ValidationSource } from '../../helpers/validator';
import schema from './schema';

export class SubscriptionReportRoute extends SubscriptionReportController {

    public self: any = "";

    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {
        router.post("/listSubscriptionReport", BearerToken, this.listSubscriptionReport);
        router.post("/listNotActiveSubscriptionReport", BearerToken, this.listNotActiveSubscriptionReport);
        router.post("/userACStatusUpdate", BearerToken, validator(schema.userACStatusUpdatePayload), this.userACStatusUpdate);
        router.post("/freeTrialUserReport", BearerToken, validator(schema.freeTrialUserReport), this.freeTrialUserReport);
        router.post("/getSubscribersReport",  this.getSubscribersReport);
        router.post("/getFreeTrialUserReport", BearerToken, this.getFreeTrialUserReport);
        router.post("/getSubscriberSummary", BearerToken, this.getSubscriberSummary);
        router.post("/exportCurriculumData", BearerToken, this.exportCurriculumData);
    }
}
