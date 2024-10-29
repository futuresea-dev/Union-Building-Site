import { AffiliateController } from '../../controllers/affiliates/affiliateController';
import { Router } from "express";
import validator from "../../helpers/validator";
import schema from './schema';

const BearerToken = require("../../middleware/bearerToken");

export class AffiliateRoute extends AffiliateController {
    public self: any = "";
    constructor(router: Router) {
        super();
        this.route(router);
    }
    public route(router: Router) {
        router.get("/affiliateCode", BearerToken, this.affiliateCode);
        router.post("/addUpdateAffiliate", BearerToken, validator(schema.addUpdateAffiliate), this.addUpdateAffiliate)
        router.post("/listAffiliate", BearerToken, validator(schema.listAffiliate), this.listAffiliate)
        router.post("/deleteAffiliate", BearerToken, validator(schema.deleteAffiliate), this.deleteAffiliate)
        router.post("/shareLink", BearerToken, validator(schema.deleteAffiliate), this.shareLink)
        router.get("/verifyAffiliateUser", BearerToken, this.verifyAffiliateUser)
        router.post("/getAffiliateDetails", BearerToken, validator(schema.getAffiliateDetails), this.getAffiliateDetails)
        router.post("/updateAffiliateReferalRate", this.updateAffiliateReferalRate)
    }
} 