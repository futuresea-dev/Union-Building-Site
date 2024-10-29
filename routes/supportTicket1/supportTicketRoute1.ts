import { Router } from "express";
import { SubscriptionReportController } from "../../controllers/subscriptionReportController";
const BearerToken = require('../../middleware/bearerToken');
import validator, { ValidationSource } from '../../helpers/validator';
import schema from './schema';
import { SupportTicketController1 } from "../../controllers/supportTicketController1";

export class supportTicketRoute1 extends SupportTicketController1 {

    public self: any = "";

    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {
        router.get("/test1", this.test);
    }
}
