import { Router } from "express";
import { SitePaymentGatewayController } from "../../controllers/sitePaymentGatewayController";
import validator from '../../helpers/validator';

const BearerToken = require("../../middleware/bearerToken");

import schema from './schema';

/*
* Code done by Sheetal 24-11-2021
* Create route for sites, payment and site_payment_gateway
*/

export class SitePaymentGatewayRoute extends SitePaymentGatewayController {

    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {
        router.get("/sites", BearerToken, this.getSites);
        router.get("/paymentServices", BearerToken, this.getPaymentServices);
        router.post("/addSitePaymentGateway", BearerToken, validator(schema.addSitePaymentGatewayPayload), this.addSitePaymentGateway);
        router.put("/updateSitePaymentGateway", BearerToken, validator(schema.sitePaymentGatewayPayload), this.updateSitePaymentGateway);
        router.get("/listSitePaymentGateway", BearerToken, this.getSitePaymentGateway);
        router.post("/deleteSitePaymentGateway", BearerToken, validator(schema.sitePaymentGatewayPayload), this.deleteSitePaymentGateway);
    }
}