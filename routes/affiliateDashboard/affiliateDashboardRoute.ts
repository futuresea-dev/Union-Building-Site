import { AffiliateDashboardController } from '../../controllers/affiliates/affiliateDashboardController';
import { Router } from "express";
const BearerToken = require("../../middleware/bearerToken");
import validator, { ValidationSource } from "../../helpers/validator";
import schema from "./schema";


export class AffiliateDashboardRoute extends AffiliateDashboardController {
    public self: any = "";
    constructor(router: Router) {
        super();
        this.route(router);
    }
    public route(router: Router) {
        router.post("/getlatestAffiliateRegistrations", BearerToken, this.getLatestAffiliateRegistrations)
        router.post("/getMostValuableAffiliates", BearerToken, this.getMostValuableAffiliates)
        router.post("/getRecentAffiliateReferrals", BearerToken, this.getRecentAffiliateReferrals)
        router.post("/getHighestConvertingURLs", BearerToken, this.getHighestConvertingURLs)
        router.post("/getVisitAndReferralDataForGraph", BearerToken, this.getVisitAndReferralDataForGraph)
        router.get("/getAllAffiliateTotals", BearerToken, this.getAllAffiliateTotals)
        router.post("/getAffiliateCounts", BearerToken, this.getAffiliateCounts)
        router.post("/getConversationRateGraph", BearerToken, this.getConversationRateGraph)
        router.post("/getVisitLineGraph", BearerToken, this.getVisitLineGraph)
        router.post("/getPaidGraph", BearerToken, this.getPaidGraph)
    }
} 
