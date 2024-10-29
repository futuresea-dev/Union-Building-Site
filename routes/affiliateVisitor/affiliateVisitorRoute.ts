
"use strict";
import { Affiliates } from '../../controllers/affiliates/affiliateVisitController'
import { Router } from "express";
import validator, { ValidationSource } from "../../helpers/validator";
import schema from "./schema";

const BearerToken = require("../../middleware/bearerToken");

export class AffiliateRoutes extends Affiliates {
  public self: any = "";
  constructor(router: Router) {
    super();
    this.route(router);
  }

  public route(router: Router) {
    router.post("/listAffiliatesVisitData", BearerToken, validator(schema.listAffiliatesVisitDataPayload), this.listAffiliatesVisitData);

  }
}
