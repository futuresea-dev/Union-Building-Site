import { Router } from "express";
import { globalVariableController } from "../../controllers/globalVariableController";
const BearerToken = require("../../middleware/bearerToken");

export class globalVariableRoute extends globalVariableController {
  constructor(router: Router) {
    super();
    this.route(router);
  }

  public route(router: Router) {
    //Sm 26-11-21
    router.get("/listGlobalVariable", BearerToken, this.listGlobalVariable);
  }
}
