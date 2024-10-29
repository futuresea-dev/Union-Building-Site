import { AffiliatePayoutController } from '../../controllers/affiliates/affiliatePayoutController';
import { Router } from "express";
const BearerToken = require("../../middleware/bearerToken");
import validator, { ValidationSource } from "../../helpers/validator";
import schema from "./schema";

export class AffiliatePayoutRoute extends AffiliatePayoutController {
    public self: any = "";
    constructor(router: Router) {
        super();
        this.route(router);
    }
    public route(router: Router) {
        router.post("/saveAffiliatePayout", BearerToken, this.addUpdateAffiliatePayout)
        router.post("/deleteAffiliatePayout", BearerToken, this.deleteAffiliatePayout)
        router.get("/payoutList", BearerToken, this.payoutList);
        router.post("/listAffiliatePayout", BearerToken, this.listAffiliatePayout);
        router.post("/listReferralByPayoutId", BearerToken, this.listReferralByPayoutId);
        router.post("/calculatePayout", BearerToken, this.calculatePayout);
        router.post("/payAffiliate", BearerToken, this.payAffiliate);
    }
} 
