import { Router } from "express";
import { GTController } from "../../controllers/gtController";
import validator, { ValidationSource } from '../../helpers/validator';
import schema from './schema';
const BearerToken = require('../../middleware/bearerToken');
const Hash = require("../../middleware/hashMiddleware");

export class GTRoute extends GTController {
    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {
        router.post("/listAllMeetups", BearerToken, validator(schema.listMeetupPayload), this.listAllMeetups)
        router.post("/addUpdateMeetup", BearerToken, validator(schema.saveMeetupPayload), this.addUpdateMeetup)
        router.delete("/deleteProposeMeetup/:meetup_id/:zoom_meeting_id", BearerToken, validator(schema.deleteProposeMeetupPayload, ValidationSource.PARAM), this.deleteProposeMeetup)
        router.post("/acceptOrRejectMeetup",BearerToken,validator(schema.acceptOrRejectMeetupPayload),this.acceptOrRejectMeetup)
    }
}