
"use strict";
import { AffiliatesConfigurations } from '../../controllers/affiliates/affiliateConfigurationsContoller';
import { Router } from "express";


const BearerToken = require("../../middleware/bearerToken");

export class AffiliatesConfigurationsRoutes extends AffiliatesConfigurations {
  public self: any = "";
  constructor(router: Router) {
    super();
    this.route(router);
  }

  public route(router: Router) {
    router.get("/listAffiliatesConfigurationsData", BearerToken, this.listAffiliatesConfigurationsData);
    router.put("/updateAffiliatesConfigurationsData", BearerToken, this.updateAffiliatesConfigurationsData);
  }
}
