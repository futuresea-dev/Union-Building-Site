import { CircleController } from './../../controllers/circleController';
import { Router } from "express";
import validator, { ValidationSource } from "../../helpers/validator";
import schema from './schema';

const BearerToken = require("../../middleware/bearerToken");

export class CircleRoutes extends CircleController {

  constructor(router: Router) {
    super();
    this.route(router);
  }

  public route(router: Router) {

    router.post("/listCircleSupportTickets", BearerToken, validator(schema.listCircleSupportTickets), this.listCircleSupportTickets)
    router.post("/getCircleSupportTicketDetails", BearerToken, validator(schema.getCircleSupportRicketDetails), this.getCircleSupportTicketDetails)
    router.post("/saveCircleSupportTicketComment", BearerToken, validator(schema.saveCircleSupportTicketComment), this.saveCircleSupportTicketComment)
    router.post("/deleteCircleSupportTicketComment", BearerToken, validator(schema.deleteCircleSupportTicketComment), this.deleteCircleSupportTicketComment)
    router.post("/listCircleSpaces", BearerToken, this.listCircleSpaces)
    router.get("/addUpdateUsers", this.syncUsers)
    router.get("/addUpdateCommunities", this.syncCommunities)
    router.get("/addUpdateSpaces", this.syncSpaces)
    router.get("/addUpdatePosts", this.syncPosts)
    router.get("/addUpdateComments", this.syncComments)
  }
}
