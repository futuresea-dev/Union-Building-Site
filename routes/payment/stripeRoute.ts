import { Router } from "express";
import { StripeController } from "../../controllers/thirdParty/stripe/stripeController";
const BearerToken = require("../../middleware/bearerToken");

/*
* Code done by Sheetal 24-11-2021
* Create route for sites, payment and site_payment_gateway
*/

export class StripeRoute extends StripeController {

    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {
        router.post("/addOrUpdateCard", BearerToken/*, validator(schema.checkOutUserSubscriptionPayload) */, this.addOrUpdateCard);
        router.post("/deleteCard", BearerToken, this.deleteCard);
        router.post("/listUserPaymentMethod-old", BearerToken/*, validator(schema.checkOutUserSubscriptionPayload) */, this.listUserPaymentMethod);
        router.get("/StripeApplicationFeesList", this.StripeApplicationFeesList);
    }
}