/*
* Code done by Sh - 13-12-2021
* Create route for filters api's
*/
import { Router } from "express";
import { FiltersController } from "../../controllers/filtersController";
import validator, {ValidationSource} from '../../helpers/validator';

const BearerToken = require("../../middleware/bearerToken");

import schema from './schema';

export class FiltersRoute extends FiltersController {

    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {
        router.post("/addUpdateFilter", BearerToken, validator(schema.filterPayload), this.addUpdateFilter);
        router.post("/listFilter", BearerToken, validator(schema.listFilterPayload), this.listFilter);
        router.post("/listFilterData", BearerToken, validator(schema.listFilterDataPayload),this.listFilterData);
        router.get("/filterDetail/:filter_id", BearerToken, validator(schema.filterDetailPayload, ValidationSource.PARAM), this.filterDetail);
        router.delete("/deleteFilter/:filter_id", BearerToken, validator(schema.deleteFilterPayload, ValidationSource.PARAM), this.deleteFilter);
        router.post("/deleteBulkFilter", BearerToken, validator(schema.deleteBulkFilterPayload), this.deleteBulkFilter);
    }
}
