import { Router } from "express";
import { kidsMusicController } from "../../controllers/kidsMusicController";
import validator from '../../helpers/validator';
import schema from './schema';
const BearerToken = require('../../middleware/bearerToken');
const Hash = require("../../middleware/hashMiddleware");

export class KidsMusicRoute extends kidsMusicController {

  constructor(router: Router) {
    super();
    this.route(router);
  }

  public route(router: Router) {
    router.post("/addKidsMusicIntoUserLibrary",Hash, BearerToken, this.addKidsMusicIntoUserLibrary);
    router.post("/listAllKidsMusic", Hash, BearerToken, validator(schema.listKidsMusicPayload), this.listAllKidsMusic);
    router.post("/library", Hash, BearerToken, validator(schema.addToLibrary), this.addToLibrary);
    router.delete("/library", Hash, BearerToken, validator(schema.removeFromLibrary), this.removeFromLibrary);
  }
}
