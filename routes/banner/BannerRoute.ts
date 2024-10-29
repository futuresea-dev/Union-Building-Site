
"use strict";
import { HubBanner } from '../../controllers/bannerController';
import { Router } from "express";
import validator, { ValidationSource } from "../../helpers/validator";
import schema from './schema';

const BearerToken = require("../../middleware/bearerToken");

export class HubBannersRoutes extends HubBanner {
  public self: any = "";
  constructor(router: Router) {
    super();
    this.route(router);
  }

  public route(router: Router) {
    router.post("/saveHubBanner", BearerToken, validator(schema.saveHubBannerPayload), this.saveHubBanner);
    router.post("/listingHubBanners", BearerToken, validator(schema.listingHubBannersPayload), this.listingHubBanners);
    router.delete("/deleteHubBanner/:banner_id", BearerToken, validator(schema.deleteHubBannerPayload, ValidationSource.PARAM), this.deleteHubBanners);

  }
}
