import { NextFunction, Request, Response, Router } from "express";
import { slideshowController } from "../../controllers/slideshowController";
import validator, { ValidationSource } from '../../helpers/validator';
const BearerToken = require('../../middleware/bearerToken');
import schema from "./schema";

export class slideshowRoute extends slideshowController {
    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {
        router.post("/createSlideshowBySeries",  BearerToken, validator(schema.createSlideshowBySeries), this.createSlideshowBySeries);
        router.post("/createSlideshowByGame",  BearerToken, validator(schema.createSlideshowByGame), this.createSlideshowByGame);
        router.get("/getSlideshowsBySeries/:series_id?", BearerToken,validator(schema.getSlideshowsBySeries,ValidationSource.PARAM), this.getSlideshowsBySeries);
        router.post("/getSlideshowsByGame", BearerToken, validator(schema.getSlideshowsByGame), this.getSlideshowsByGame);
        router.post("/importSlideshow",  BearerToken, validator(schema.importSlideshow), this.importSlideshow);
        router.post("/recommendedFonts",BearerToken,this.addOrEditRecommendedFonts)
    }
}