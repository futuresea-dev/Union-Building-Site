import { Router } from "express";
import { FreeTrialProductController } from "../../controllers/freeTrialProductController";
const BearerToken = require("../../middleware/bearerToken");
import validator, { ValidationSource } from "../../helpers/validator";
import schema from "./schema";
const Hash = require("../../middleware/hashMiddleware");

export class FreeTrialProductRoutes extends FreeTrialProductController {
  constructor(router: Router) {
    super();
    this.route(router);
  }

  public route(router: Router) {
    router.put("/saveFreeTrialProduct", this.saveFreeTrialProduct);
    router.put("/deleteFreeTrialProduct", this.deleteFreeTrialProduct);
    router.post("/listAllFreeTrialProducts", this.listAllFreeTrialProducts);
    router.post("/freeTrialBuyUsersReportData", this.freeTrialBuyUsersReportData);
  }
}
