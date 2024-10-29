import { NextFunction, Request, Response, Router } from "express";
import { systemConfigurationsMetaController } from "../../controllers/systemConfigurationsMetaController";
import { CategoryController } from "../../controllers/categoryController";
import validator, { ValidationSource } from '../../helpers/validator';
import schema from './schema';

const BearerToken = require('../../middleware/bearerToken');

export class systemConfigurationMetaRoute extends systemConfigurationsMetaController {

    public self: any = "";

    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {
        router.get("/listAllSystemConfigurations/:id", BearerToken, this.listAllSystemConfigurations);
        router.post("/saveSystemConfigurationsMeta", BearerToken, this.saveSystemConfigurationsMeta);
        // Third Party Services
        router.get("/listThirdPartyServiceData/:site_id?", BearerToken, validator(schema.listThirdPartyServiceDataPayload, ValidationSource.PARAM), this.listThirdPartyServiceData);
        router.put("/updateThirdPartyServiceData", BearerToken, this.updateThirdPartyServiceData);
        router.post("/updateSystemConfiguration", BearerToken, validator(schema.updateSystemConfiguration), this.updateSystemConfiguration)
        router.post("/getSystemConfiguration", validator(schema.getSystemConfigurationPayload) ,this.getSystemConfiguration)
    }
}
