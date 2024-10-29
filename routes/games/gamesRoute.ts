/*
* Code done by Sh - 13-12-2021
* Create route for Games api's
*/
import { Router } from "express";
import { GamesController } from "../../controllers/gamesController";
import validator, { ValidationSource } from '../../helpers/validator';

const BearerToken = require("../../middleware/bearerToken");

import schema from './schema';

export class GamesRoute extends GamesController {

    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {
        router.post("/addUpdateGame", BearerToken, validator(schema.addGamePayload), this.addUpdateGame)
        router.post("/listGame", BearerToken, validator(schema.listGamePayload), this.listGame);
        router.get("/gameDetail/:game_id", BearerToken, validator(schema.gameDetailPayload, ValidationSource.PARAM), this.gameDetail);
        router.delete("/deleteGame/:game_id", BearerToken, validator(schema.deleteGamePayload, ValidationSource.PARAM), this.deleteGame);
        router.post("/deleteBulkGame", BearerToken, validator(schema.deleteBulkGamePayload), this.deleteBulkGame);
        router.post("/listGameRating", BearerToken, validator(schema.listGameRatingPayload), this.listGameRating);
        router.post("/gameReportData", BearerToken, validator(schema.gameReportDataPayload), this.gameReportData);
        router.post("/gameReport", BearerToken, validator(schema.gameReportPayload), this.gameReport);
        router.post("/addNotification", BearerToken, validator(schema.addNotificationPayload), this.addNotification);
        router.post("/sentNotification", BearerToken, validator(schema.sentNotificationPayload), this.sentNotification);
        router.post("/readSentNotification", BearerToken, validator(schema.readSentNotificationPayload), this.readSentNotification);
        router.post("/listGameReview", BearerToken, validator(schema.listGameReviewPayload), this.listGameReview);
        router.post("/deleteGameReview", BearerToken, validator(schema.deleteGameReview), this.deleteGameReview)
    }
}
