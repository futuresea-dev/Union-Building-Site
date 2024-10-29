//santosh 24-12-2021

"use strict";
import { Router } from "express";
import { CountdownController } from "../../controllers/countdownController";
import validator, { ValidationSource } from "../../helpers/validator";
import schema from "./schema";
const BearerToken = require("../../middleware/bearerToken");

export class CountdownRoutes extends CountdownController {
  public self: any = "";
  constructor(router: Router) {
    super();
    this.route(router);
  }
  public route(router: Router) {
    router.post(
      "/saveCountdownConfiguration",
      BearerToken,
      validator(schema.saveCountdownConfiguration),
      this.saveCountdownConfiguration
    );
    router.post(
      "/saveDefaultCountdown",
      BearerToken,
      validator(schema.saveDefaultCountdown),
      this.saveDefaultCountdown
    );
    // saveDefaultCountdown
    router.get(
      "/listCountdownConfiguration/:type",
      BearerToken,
      validator(schema.listCountdownConfiguration, ValidationSource.PARAM),
      this.listCountdownConfiguration)
    router.delete
      (
        "/deleteCountdownConfiguration/:cc_id?",
        BearerToken,
        validator(schema.deleteCountdownConfiguration, ValidationSource.PARAM),
        this.deleteCountdownConfiguration
      );
    router.post("/sortCountdownConfiguration", BearerToken, validator(schema.sortCountdownConfiguration), this.sortCountdownConfiguration);
    router.get("/getDefaultCountdown", BearerToken, this.getDefaultCountdown)
    router.post("/exportCountdownVideoLogs", validator(schema.exportCountdownVideo), this.exportCountdownVideoLogs)
  }
}
