import { Router } from "express";
import { ServerMasterController } from "../../controllers/serverMasterController";
const BearerToken = require('../../middleware/bearerToken');
import validator, { ValidationSource } from '../../helpers/validator';
import schema from './schema';

export class ServerCredentialsRoute extends ServerMasterController {

    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {
        router.post("/admin/addServerControls", BearerToken, this.addServerControls);
        router.post("/addUpdateServiceCredentials", BearerToken, this.addUpdateServiceCredentials);
        router.put("/admin/updateServiceCredentials", BearerToken, this.updateServiceCredentials);
        router.post("/getServiceCredentials", BearerToken, this.getServiceCredentials);
        router.delete("/deleteEmailSiteServiceCredentials/:site_email_service_id", BearerToken, this.deleteEmailSiteServiceCredentials);
        router.get("/getServerCredentials", BearerToken, this.getServerCredentials);
        router.get("/listServiceCredentials/:id", validator(schema.idPayload, ValidationSource.PARAM), BearerToken, this.listServiceCredentials);
        router.get("/getSmsServicesMasterData", BearerToken, this.getSmsServicesMasterData);
        router.post("/saveSmsServicesCredentials", BearerToken, validator(schema.saveSMSSeriesPayload), this.saveSmsServicesCredentials);
        router.get("/getSmsServicesCredentials/:id", BearerToken, validator(schema.idPayload, ValidationSource.PARAM), this.getSmsServicesCredentials);
    }
}