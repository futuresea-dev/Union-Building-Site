"use strict";
import { Router } from "express";
import { FeaturedCardController } from "../../controllers/featuredCardController";
import validator, { ValidationSource } from "../../helpers/validator";
import schema from "./schema";
const BearerToken = require("../../middleware/bearerToken");

export class FeaturedCardRoutes extends FeaturedCardController {
  public self: any = "";
  constructor(router: Router) {
    super();
    this.route(router);
  }
  public route(router: Router) {
    router.post(
      "/saveFeaturedCard",
      BearerToken,
      validator(schema.saveFeaturedCard),
      this.saveFeaturedCard
    );
    router.get(
      "/listFeaturedCard",
      BearerToken,
      this.listFeaturedCard
    );
    router.delete(
      "/deleteFeaturedCard/:featured_card_id",
      BearerToken,
      validator(schema.deleteFeaturedCard, ValidationSource.PARAM),
      this.deleteFeaturedCard
    );
  }
}
