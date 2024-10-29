
"use strict";
import { Calender } from './../../controllers/calenderController';
import { Router } from "express";
import validator, { ValidationSource } from "../../helpers/validator";
import schema from './schema';
const BearerToken = require("../../middleware/bearerToken");

export class CalenderRoutes extends Calender {
  public self: any = "";
  constructor(router: Router) {
    super();
    this.route(router);
  }

  public route(router: Router) {
    router.post("/saveCalendar", BearerToken, validator(schema.saveCalenderPayload), this.saveCalendar);
    router.get("/listingCalendar/:category_id", BearerToken, validator(schema.listingCalenderPayload, ValidationSource.PARAM), this.listingCalendar);
    router.delete("/deleteCalendar/:calendar_id", BearerToken, validator(schema.deleteCalenderPayload, ValidationSource.PARAM), this.deleteCalendar);
    router.get("/getCalendarById/:calendar_id", BearerToken, this.getCalendarById);
    router.post("/saveSortOrderOfCalendars", BearerToken, validator(schema.saveSortOrderOfCalendars), this.saveSortOrderOfCalendars);
  }
}
