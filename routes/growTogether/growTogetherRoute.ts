import { Router } from "express";
import { growTogetherController } from "../../controllers/growTogetherController";
import validator, { ValidationSource } from "../../helpers/validator";
import schema from "./schema";

const BearerToken = require("../../middleware/bearerToken");

export class growTogetherRoutes extends growTogetherController {
  constructor(router: Router) {
    super();
    this.route(router);
  }
  public route(router: Router) {
    router.post("/getIntakeFormList", BearerToken, validator(schema.getIntakeFormList), this.getIntakeFormList);
    router.put("/saveIntakeFormStatus", BearerToken, validator(schema.saveIntakeFormStatus), this.saveIntakeFormStatus);
    router.put("/saveIntakeApplication", BearerToken, validator(schema.saveIntakeApplication), this.saveIntakeApplication);
  }
}
