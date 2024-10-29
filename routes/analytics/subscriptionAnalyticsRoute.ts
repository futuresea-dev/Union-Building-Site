
"use strict";
import { SubscriptionAnalyticsController } from '../../controllers/analytics/subscriptionAnalyticsController';
import { Router } from "express";
import validator, { ValidationSource } from "../../helpers/validator";
import schema from "./schema";

const BearerToken = require("../../middleware/bearerToken");

export class SubscriptionAnalyticsRoute extends SubscriptionAnalyticsController {
  public self: any = "";
  constructor(router: Router) {
    super();
    this.route(router);
  }

  public route(router: Router) {
    router.post("/getSubscriptionCount", BearerToken, this.getSubscriptionCount);
    router.post("/getNewSubscriptionChartDatas", BearerToken, validator(schema.chartNewPayload), this.getNewSubscriptionChartData);
    router.post("/getRenewedSubscriptionChartDatas", BearerToken, validator(schema.chartRenewPayload), this.getRenewedSubscriptionChartData);
    router.post("/getSubscriptionDataDateWise", BearerToken, validator(schema.dateWisePayload), this.getSubscriptionDataDateWise);
    router.post("/failedSubscription", BearerToken, this.failedSubscription)
    router.post("/successSubscription", BearerToken, this.successSubscription)
    router.post("/activeSubscription", BearerToken, this.activeSubscription)
    router.post("/newSubscription", BearerToken, this.newSubscription)
    router.post("/expireSubscription", BearerToken, this.expireSubscription)
    router.post("/cancelSubscriptionReport", BearerToken, this.cancelSubscriptionReport)
    router.post("/subscriptionFeedbackReport", BearerToken, this.subscriptionFeedbackReport)
    router.post("/allActiveSubscriptions", BearerToken, this.allActiveSubscriptions)
  }
}
