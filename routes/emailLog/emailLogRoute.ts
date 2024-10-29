import { EmailLogController } from './../../controllers/emailLogController';
import { Router } from "express";
import validator, { ValidationSource } from "../../helpers/validator";
import schema from "../emailDesign/schema";
const BearerToken = require("../../middleware/bearerToken");
export class emailLogRoute extends EmailLogController {
  constructor(router: Router) {
    super();
    this.route(router);
  }

  public route(router: Router) {
    router.post("/getEmailLogData", BearerToken, this.getEmailLogData)
  }
}
