import { Router } from "express";
import { PaymentServicesController } from "../../controllers/paymentServicesController";
import validator from '../../helpers/validator';

const BearerToken = require("../../middleware/bearerToken");

import schema from './schema';
import { ValidationSource } from '../../helpers/validator';

/*
* Code done by Sh - 24-11-2021
* Create route for sites, payment and site_payment_gateway
*/

export class PaymentServicesRoute extends PaymentServicesController {

    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {
        router.get("/listSite", BearerToken, this.listSite);
        router.post("/listSiteBySiteId", BearerToken, this.listSiteBySiteId);
        router.post("/listSiteWithoutUserCount", BearerToken, this.listSiteWithoutUserCount);
        router.get("/listSiteForSeriesEditor", BearerToken, this.listSiteForSeriesEditor);
        router.post("/updateSite", BearerToken, validator(schema.updateSitePayload), this.updateSite);
        router.get("/getSiteDetail/:id", BearerToken, this.getSiteDetail);
        router.get("/listMasterPaymentService", this.listMasterPaymentService);
        router.get("/getMasterPaymentServiceDetail/:id", BearerToken, this.getMasterPaymentServiceDetail);
        router.post("/addPaymentService", BearerToken, validator(schema.addPaymentServicePayload), this.addPaymentService);
        router.post("/updatePaymentService", BearerToken, validator(schema.updatePaymentServicePayload), this.updatePaymentService);
        router.get("/listPaymentService/:site_id?", BearerToken, validator(schema.listPaymentServicePayload, ValidationSource.PARAM), this.listPaymentService);
        router.get("/getPaymentServiceDetail/:id?", BearerToken, this.getPaymentServiceDetail);
        router.delete("/deleteSitePaymentService/:site_payment_service_id?", BearerToken, validator(schema.paymentServicePayload, ValidationSource.PARAM), this.deleteSitePaymentService);
    }
}