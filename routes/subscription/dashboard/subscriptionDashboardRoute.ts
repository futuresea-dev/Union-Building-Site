import { Router } from "express";
import { SubscriptionDashboardController } from "../../../controllers/subscriptionDashboardController";

const BearerToken = require("../../../middleware/bearerToken");

/*
* Code done by Sh - 25-11-2021
* Create route for cart detail api , Charts api and Performance api's
*/

export class SubscriptionDashboardRoute extends SubscriptionDashboardController {

    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {
        router.get("/getSubscriptionPerformanceData", BearerToken, this.getSubscriptionPerformanceData);
        router.get("/getCartDetail", BearerToken, this.getCartDetail);
        router.get("/getNetSalesChartData", BearerToken, this.getNetSalesChartData);
        router.get("/getOrdersChartData", BearerToken, this.getOrdersChartData);
        router.get("/getAverageOrderValueChartData", BearerToken, this.getAverageOrderValueChartData);
        router.get("/getDiscountedOrdersChartData", BearerToken, this.getDiscountedOrdersChartData);
        router.get("/getItemSoldChartData", BearerToken, this.getItemSoldChartData);
        router.get("/getShippingChartData", BearerToken, this.getShippingChartData);
        router.get("/getGrossDiscountedChartData", BearerToken, this.getGrossDiscountedChartData);
        router.get("/getReturnsChartData", BearerToken, this.getReturnsChartData);
        router.get("/getTotalTaxChartData", BearerToken, this.getTotalTaxChartData);
        router.get("/getOrderTaxChartData", BearerToken, this.getOrderTaxChartData);
        router.get("/getShippingTaxChartData", BearerToken, this.getShippingTaxChartData);
        router.get("/getDownloadsChartData", BearerToken, this.getDownloadsChartData);
        router.get("/getTopProductData", BearerToken, this.getTopProductData);
        router.get("/getTopMembershipData", BearerToken, this.getTopMembershipData);
    }
}