import { Router } from "express";
import { ThirdPartyController } from "../../controllers/thirdParty/thirdPartyController";
import validator from '../../helpers/validator';

const BearerToken = require("../../middleware/bearerToken");
import { ValidationSource } from '../../helpers/validator';

/*
* Code done by Sh - 24-11-2021
* Create route for sites, payment and site_payment_gateway
*/

export class ThirdPartyRoute extends ThirdPartyController {

    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {
        router.get("/getThirdPartyList", BearerToken, this.GetThirdPartyList);
        router.get("/getThirdPartyConfigurationDetails/:id", BearerToken, this.GetThirdPartyConfigurationDetails);
        router.post("/listThirdPartyLogs", BearerToken, this.ListThirdPartyLogs);
        router.post("/saveThirdPartyConfigurationDetails", BearerToken, this.SaveThirdPartyConfigurationDetails);
        router.post("/activeInactiveThirdPartyAPI", BearerToken, this.ActiveInactiveThirdPartyAPI);
        router.post("/saveCloudStorageLogs",BearerToken,this.saveCloudStorageLogs);

    }
}