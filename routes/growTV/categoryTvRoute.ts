import { Router } from "express";
import { tvCategoryController } from "../../controllers/tvCategoryController";
import validator, { ValidationSource } from "../../helpers/validator";
import schema from "./schema";

const BearerToken = require("../../middleware/bearerToken");

export class categoryTvRoutes extends tvCategoryController {
  constructor(router: Router) {
    super();
    this.route(router);
  }
  public route(router: Router) {
    router.get("/listonlyTvCategory", BearerToken, this.listonlyTvCategory);
    router.post("/saveTvCategory", BearerToken, validator(schema.saveTvCategory), this.saveTvCategory);
    router.post("/listTvCategory", BearerToken, validator(schema.listTvCategory), this.listTvCategory);
    router.post("/categorySortOrder", BearerToken, validator(schema.categorySortOrder), this.categorySortOrder);
    router.get("/listCategoryMeta/:category_id?", BearerToken, validator(schema.listCategoryMeta, ValidationSource.PARAM), this.listCategoryMeta);
    router.delete("/deleteTvCategory/:category_id", BearerToken, validator(schema.deleteTvCategory, ValidationSource.PARAM), this.deleteTvCategory);
  }
}
