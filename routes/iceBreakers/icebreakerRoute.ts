import { Router } from "express";
import { IceBreakerController } from "../../controllers/iceBreakersController"
import validator, { ValidationSource } from "../../helpers/validator";
import schema from "./schema";
const BearerToken = require("../../middleware/bearerToken");

export class IcebreakersRoute extends IceBreakerController {
  public self: any = "";
  constructor(router: Router) {
    super();
    this.route(router);
  }

  public route(router: Router) {
    router.post(
      "/saveIceBreaker",
      BearerToken,
      validator(schema.addIceBreakerPayload),
      this.saveIceBreaker
    );
    router.post(
      "/listIceBreaker",
      BearerToken,
      validator(schema.listIceBreakerPayload),
      this.listIceBreaker
    );
    router.get(
      "/listIceBreakerById/:icebreaker_id/:is_system",
      BearerToken,
      validator(schema.listIceBreakerByIdPayload, ValidationSource.PARAM),
      this.listIceBreakerById
    );
    router.post(
      "/exportIceBreakerData",
      BearerToken,
      validator(schema.exportIceBreakerData),
      this.exportIceBreakerData
    );
    router.post(
      "/listIceBreakerReportData",
      BearerToken,
      validator(schema.listIceBreakerReportData),
      this.listIceBreakerReportData
    );
    router.post(
      "/bulkDeleteIceBreaker",
      BearerToken, validator(schema.bulkDeleteIceBreaker),
      this.bulkDeleteIceBreaker
    );
  }
}
