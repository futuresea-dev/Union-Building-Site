import { Router } from "express";
import { emailDesignController } from "../../controllers/emailDesignController";
import validator, { ValidationSource } from "../../helpers/validator";
import schema from "../emailDesign/schema";
const BearerToken = require("../../middleware/bearerToken");
export class emailDesignRoute extends emailDesignController {
  constructor(router: Router) {
    super();
    this.route(router);
  }

  public route(router: Router) {
    //Sm 26-2-11-21
    router.put("/updateEmailDesignTemplate", BearerToken, validator(schema.emailDesignPayload), this.updateEmailDesignTemplate);
    router.post("/listEmailDesignTemplate", BearerToken, this.listEmailDesignTemplate);
    //Sm 01-12-21
    router.get("/getEmailDesignTemplateDetail/:email_design_template_id?", BearerToken, this.getEmailDesignTemplateDetail)
  }
}
