import { Router } from "express";
import { FrontEndExceptionLogsController } from "../../controllers/frontendExceptionLogsController";
const BearerToken = require('../../middleware/bearerToken');
const Hash = require("../../middleware/hashMiddleware");
import validator from '../../helpers/validator';
import schema from './schema';

export class FrontendExceptionLogRoute extends FrontEndExceptionLogsController {

    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {

        router.post("/saveAllErrorFromFrontend", Hash, BearerToken, validator(schema.saveAllErrorFromFrontend), this.saveAllErrorFromFrontend);

    }
}
