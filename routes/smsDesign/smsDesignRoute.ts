import { Router } from "express";
import { SMSDesignController } from "../../controllers/smsDesignController";
import validator, { ValidationSource } from "../../helpers/validator";
import schema from "./schema";
const BearerToken = require("../../middleware/bearerToken");
export class smsDesignRoute extends SMSDesignController {
  constructor(router: Router) {
    super();
    this.route(router);
  }

  public route(router: Router) {
    router.post("/updateSMSDesign", BearerToken, validator(schema.updateSMSDesignPayload), this.updateSMSDesign);
    router.post("/listSMSDesign", BearerToken, validator(schema.listSMSDesignDetail), this.listSMSDesign);
    router.get("/getSMSDesignDetail/:sms_design_template_id?", BearerToken, validator(schema.getSMSDesignDetail, ValidationSource.PARAM), this.getSMSDesignDetail)
  }
}
