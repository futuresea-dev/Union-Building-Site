import { Router } from "express";
import { geoController } from "../../controllers/geoController";
import validator, { ValidationSource } from "../../helpers/validator";
import schema from "./schema";

const BearerToken = require("../../middleware/bearerToken");

export class geoRoutes extends geoController {
    constructor(router: Router) {
        super();
        this.route(router);
    }
    public route(router: Router) {
        router.get('/getCountryList', BearerToken, this.getCountryList);
        router.get('/getStateList/:countryId', BearerToken, this.getStateList);
        
        router.get('/listGeoColor', BearerToken, this.listGeoColor);
        router.post('/saveGeoConfig', BearerToken, validator(schema.saveGeoConfig), this.saveGeoConfig);

        router.get('/listingSiteSub',

            // BearerToken,
            // validator(schema.listgeo),
            this.listingSiteSub);
        router.post('/listGeoData',

            // BearerToken,
            // validator(schema.listgeo),
            this.listGeoData);
    }
}
