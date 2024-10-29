import { Router } from "express";
import { FAQ } from './../../controllers/faqController';
import validator, { ValidationSource } from '../../helpers/validator';
import schema from './schema';

const BearerToken = require("../../middleware/bearerToken");

export class FaqRoutes extends FAQ {

  constructor(router: Router) {
    super();
    this.route(router);
  }

  public route(router: Router) {
    router.post("/sortFaq", BearerToken, this.sortFaq);
    router.post("/saveFaq", BearerToken, validator(schema.faqPayload), this.saveFaq);
    router.post("/listAllFaq", BearerToken, validator(schema.listFaqPayload), this.listAllFaq);
    router.delete("/deleteFaq/:faq_id", BearerToken, validator(schema.faqIdParams, ValidationSource.PARAM), this.deleteFaq);
    router.get("/getFaqDetails/:faq_id", BearerToken, validator(schema.faqIdParams, ValidationSource.PARAM), this.getFaqDetails);
  }
}
