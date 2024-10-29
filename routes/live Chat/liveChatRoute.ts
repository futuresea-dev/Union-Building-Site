
"use strict";
import { Router } from "express";
import validator, { ValidationSource } from "../../helpers/validator";
import { LiveChat } from '../../controllers/liveChatController';
const BearerToken = require("../../middleware/bearerToken");

export class LiveChatRoutes extends LiveChat {
  public self: any = "";
  constructor(router: Router) {
    super();
    this.route(router);
  }

  public route(router: Router) {
    router.get("/getLiveChatData", this.getLiveChatData)
    router.post("/listLiveChatData", BearerToken,this.listLiveChatData)

  }
}
