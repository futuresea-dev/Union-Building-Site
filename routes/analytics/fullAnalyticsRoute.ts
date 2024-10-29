import { NextFunction, Request, Response, Router } from "express";
import { FullAnalyticsController } from "./../../controllers/fullAnalyticsController";
import validator, { ValidationSource } from "../../helpers/validator";
const BearerToken = require("../../middleware/bearerToken");
import schema from './schema';

export class fullAnalyticsRoute extends FullAnalyticsController {
  constructor(router: Router) {
    super();
    this.route(router);
  }

  public route(router: Router) {
    router.post("/overallPerformance", BearerToken, this.overallPerformance);
    //router.post("/overallSubscription", BearerToken, this.overallSubscription);
    router.post("/overallSubscription",BearerToken, this.overallSubscription);
    router.post("/discountedOrderGraph", BearerToken, this.discountedOrderGraph);
    router.post("/canceledSubscriptionGraph", BearerToken, this.canceledSubscriptionGraph);
    router.post("/renewGraph", BearerToken, this.renewGraph);
    router.post("/netSalesGraph", BearerToken, this.netSalesGraph);
    router.post("/grossSalesGraph", BearerToken, this.grossSalesGraph);
    router.post("/registeredUserGraph", BearerToken, this.registeredUserGraph);
    router.post("/ordersAndProductSoldGraph", BearerToken, this.ordersAndProductSoldGraph);
    router.get("/salesAnalyticsGraph", BearerToken, this.salesAnalyticsGraph);
    router.post("/netDiscountedAmountGraph", BearerToken, this.netDiscountedAmountGraph);
    router.post("/topCustomerByTotalSpend", validator(schema.dateAndPagination), this.topCustomerByTotalSpend);
    router.post("/topProductsByItemSold", validator(schema.dateAndPagination), this.topProductsByItemSold)
    router.post("/topCouponsByNumberOfOrders", validator(schema.dateAndPagination), this.topCouponsByNumberOfOrders);
    router.post("/saveUserAnalyticsConfigurationData", BearerToken, this.saveUserAnalyticsConfigurationData);
    router.get("/getUserAnalyticsConfigurationData", BearerToken, this.getUserAnalyticsConfigurationData);
    router.post("/getMonthWiseSubscriptionCount", BearerToken, this.getMonthWiseSubscriptionCount);
    router.post("/getMonthWiseSubscriptionTableData", BearerToken, this.getMonthWiseSubscriptionTableData);
    router.post("/getRenewSubscriptionDataDateWise", BearerToken, this.getRenewSubscriptionDataDateWise);
    router.get("/realtimeReport",BearerToken, this.getRealtimeReport);
    router.post("/batchReport", this.batchReport);
  }
}
