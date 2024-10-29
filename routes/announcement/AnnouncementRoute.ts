
"use strict";
import { Announcement } from '../../controllers/announcementController';
import { Router } from "express";
import validator, { ValidationSource } from "../../helpers/validator";
import schema from "./schema";

const BearerToken = require("../../middleware/bearerToken");

export class AnnouncementRoutes extends Announcement {
  public self: any = "";
  constructor(router: Router) {
    super();
    this.route(router);
  }

  public route(router: Router) {
    router.post("/saveAnnouncement", BearerToken, validator(schema.saveAnnouncementPayload), this.saveAnnouncement);
    router.get("/listingAnnouncements/:category_id", BearerToken, validator(schema.listingAnnouncementsPayload, ValidationSource.PARAM), this.listingAnnouncements);
    router.delete("/deleteAnnouncement/:announcement_id", BearerToken, validator(schema.deleteAnnouncementPayload, ValidationSource.PARAM), this.deleteAnnouncement);
    router.get("/getAnnouncementById/:announcement_id", BearerToken, this.getAnnouncementById)
    router.post("/saveSortOrderOfAnnouncements", BearerToken, validator(schema.saveSortOrderOfAnnouncements), this.saveSortOrderOfAnnouncements);
  }
}
