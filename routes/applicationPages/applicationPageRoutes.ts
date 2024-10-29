import { Router } from "express";
import { ApplicationPageController } from "../../controllers/applicationPagesController";
const BearerToken = require("../../middleware/bearerToken");
import validator, { ValidationSource } from "../../helpers/validator";
import schema from "./schema";
const Hash = require("../../middleware/hashMiddleware");

export class ApplicationPageRoutes extends ApplicationPageController {
  constructor(router: Router) {
    super();
    this.route(router);
  }

  public route(router: Router) {
    router.post("/listAllApplicationPage", this.listAllApplicationPage);
    router.put("/SaveApplicationPage", this.SaveApplicationPage);
    router.delete("/deleteApplicationPage", this.deleteApplicationPages);
    router.post("/orderApplicationPages", this.orderApplicationPages);
  }
}
