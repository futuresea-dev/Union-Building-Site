import { Router } from "express";
import { ApplicationMainMenuController } from "../../controllers/applicationMainMenu";
const BearerToken = require("../../middleware/bearerToken");
import validator, { ValidationSource } from "../../helpers/validator";
import schema from "./schema";
const Hash = require("../../middleware/hashMiddleware");

export class ApplicationMainMenuRoutes extends ApplicationMainMenuController {
  constructor(router: Router) {
    super();
    this.route(router);
  }

  public route(router: Router) {
    router.post("/listAllApplicationMainMenu", this.listAllApplicationMainMenu);
    router.put("/saveApplicationMainMenu", this.SaveApplicationMainMenu);
    router.delete("/deleteApplicationMainMenu", this.deleteApplicationMainMenu);
  }
}
