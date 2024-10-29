
"use strict";
import { AffiliateReferralController } from '../../controllers/affiliates/affiliateReferralController';
import { Router } from "express";
import validator, { ValidationSource } from "../../helpers/validator";
import schema from "./schema";

const BearerToken = require("../../middleware/bearerToken");

export class AffiliateReferralRoute extends AffiliateReferralController {
  public self: any = "";
  constructor(router: Router) {
    super();
    this.route(router);
  }

  public route(router: Router) {
    router.post("/saveAffiliateReferral", BearerToken, validator(schema.saveAffiliateReferralPayload), this.saveAffiliateReferral);
    router.post("/userListAffiliateReferral", BearerToken, validator(schema.userListAffiliateReferralPayload), this.userListAffiliateReferral);
    router.post("/listAffiliateReferral", BearerToken, validator(schema.listAffiliateReferralPayload), this.listAffiliateReferral);
    router.get("/deleteAffiliateReferral/:affiliate_referral_id", BearerToken, validator(schema.deleteAffiliateReferralPayload, ValidationSource.PARAM), this.deleteAffiliateReferral);
    router.post("/referralPayout", BearerToken, validator(schema.referralPayoutPayload), this.referralPayout);
    router.get("/getAffiliateReferralsForPayout/:affiliate_referral_id", BearerToken, this.getAffiliateReferralsForPayout);
  }
}
