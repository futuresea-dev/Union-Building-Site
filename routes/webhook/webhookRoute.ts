import { Router } from "express";
import { SubscriptionReportController } from "../../controllers/subscriptionReportController";
const BearerToken = require('../../middleware/bearerToken');
import validator, { ValidationSource } from '../../helpers/validator';
import schema from './schema';
import { WebhookController } from "../../controllers/webhookController";

export class webhookRoute extends WebhookController {

    public self: any = "";

    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {
        router.get("/webhooks/circle", this.getCircle);
        router.post("/webhooks/circle", this.postCircle);
    }
}
