import { Router } from "express";
import { ApplicationController } from "../../controllers/ApplicationController";
const BearerToken = require('../../middleware/bearerToken');
import validator, { ValidationSource } from '../../helpers/validator';
import schema from './schema';
const Hash = require("../../middleware/hashMiddleware");

export class ApplicationRoutes extends ApplicationController {

    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {
        router.post("/listAllApplicationMenu", Hash, BearerToken, validator(schema.listAllApplicationMenuPayload), this.listAllApplicationMenu);
        router.put("/deleteApplicationMenu", BearerToken, validator(schema.deleteApplicationMenuPayload), this.deleteApplicationMenu);
        router.put("/StatusApplicationMenu", BearerToken, validator(schema.StatusApplicationMenuPayload), this.StatusApplicationMenu);
        router.put("/SaveApplicationMenu", BearerToken, validator(schema.SaveApplicationMenuPayload), this.SaveApplicationMenu);
        router.put("/orderApplicationMenu", BearerToken, validator(schema.orderApplicationMenuPayload), this.orderApplicationMenu);
    }
}
