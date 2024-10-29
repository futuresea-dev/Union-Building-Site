import { Router } from "express";
import { DashboardController } from "../../controllers/dashboardController";

const BearerToken = require("../../middleware/bearerToken");

import validator, { ValidationSource } from "../../helpers/validator";
import schema from "./schema";
const Hash = require("../../middleware/hashMiddleware");

/*
* Code done by Sh - 02-12-2021
* Create route for dashboard api's
*/

export class DashboardRoute extends DashboardController {

    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {
        router.get("/dashBoardData", BearerToken, this.dashBoardData);
        router.post("/getNewRegisterUsersChartData", BearerToken, this.getNewRegisterUsersChartData);
        router.post("/getCancelSubscriptionChartData", BearerToken, this.getCancelSubscriptionChartData);
        router.get("/getTopVisitorsChartData", BearerToken, this.getTopVisitorsChartData);
        router.post("/getNewSubscriptionChartData", BearerToken, this.getNewSubscriptionChartData);
        router.post("/getRenewedSubscriptionsChartData", BearerToken, this.getRenewedSubscriptionsChartData);
        router.get("/getEarningsChartData", BearerToken, this.getEarningsChartData);
        router.get("/getOrderByProductData", BearerToken, this.getOrderByProductData);
        router.get("/getSalesAnalyticsData", BearerToken, this.getSalesAnalyticsData);
        router.post("/getSalesAnalyticsDataV2", BearerToken, this.getSalesAnalyticsDataV2);
        router.post("/getTopSellingProductData", BearerToken, this.getTopSellingProductData);

        router.post("/listsignupMetricReport", validator(schema.listsignupMetricReport), this.listsignupMetricReport);
        router.post("/listsignupGraphMetricReport", validator(schema.listsignupGraphMetricReport), this.listsignupGraphMetricReport);

        router.post("/signupCampaignReport", BearerToken, validator(schema.signupCampaignReport), this.signupCampaignReport);
        router.post("/checkoutCampaignReport", BearerToken, validator(schema.signupCampaignReport), this.checkoutCampaignReport);

        router.post("/dashbordwidgetCreate", BearerToken, validator(schema.dashbordwidget), this.dashbordwidgetCreate);
        router.post("/dashbordwidgetDelete/:dashbord_widget_id", BearerToken, this.dashbordwidgetDelete);
        router.get("/dashbordwidgetList", Hash, BearerToken, this.dashbordwidgetList);
        router.post("/listConUserReport", BearerToken, this.listConUserReport);
        router.post("/getUserOnboardingReport", BearerToken, this.getUserOnboardingReport);

        router.post("/getCalenderCardReport", BearerToken, this.getCalenderCardReport);
        router.post("/getFeedbackReport", BearerToken, this.getFeedbackReport);
    }
}
