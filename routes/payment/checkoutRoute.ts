import { Router } from "express";
import { checkoutController } from "../../controllers/checkoutController";
import validator, { ValidationSource } from '../../helpers/validator';
import schema from './schema';

const bodyParser = require('body-parser');
const BearerToken = require("../../middleware/bearerToken");
const Hash = require("../../middleware/hashMiddleware");

/*
* Code done by Sheetal 24-11-2021
* Create route for sites, payment and site_payment_gateway
*/

export class checkOutRoute extends checkoutController {

    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {
        router.post("/checkOutAdminSubscription", BearerToken, this.checkOutAdminSubscription);
        router.post("/cancelSubscription", BearerToken, validator(schema.cancelSubscription), this.cancelSubscription);
        router.post("/reactiveSubscription", BearerToken, validator(schema.reactiveSubscription), this.reactiveSubscription);
        router.post("/refundTransaction", BearerToken, validator(schema.refundTransaction), this.refundTransaction);
        router.get("/refundTransactionReceipt/:transaction_id?", BearerToken, validator(schema.refundTransactionReceipt, ValidationSource.PARAM), this.refundTransactionReceipt);
        router.get("/chargeTransactionReceipt/:transaction_id?", BearerToken, validator(schema.chargeTransactionReceipt, ValidationSource.PARAM), this.chargeTransactionReceipt);

        router.post("/refundTransactionReceipt", BearerToken, validator(schema.refundTransactionReceiptPost), this.refundTransactionReceipt);
        router.post("/chargeTransactionReceipt", BearerToken, validator(schema.chargeTransactionReceiptPost), this.chargeTransactionReceipt);

        router.post("/getOrderDetails", BearerToken, this.getOrderDetails);
        router.get("/getSubscriptionDetails/:id", BearerToken, this.getSubscriptionDetails);
        router.get("/getTotalSubscriptions/:site_id?", BearerToken, this.getTotalSubscriptions);

        // subscription data for refresh page 
        router.get("/getSubscriptionData/:user_subscription_id?", BearerToken, this.getSubscriptionData);
        router.post("/rejectCancelSubscriptionRequest", BearerToken, this.rejectCancelSubscriptionRequest);

        // DS 13-06-2022
        router.get("/getPaymentToken/:user_id?", BearerToken, validator(schema.getPaymentTokenPayload, ValidationSource.PARAM), this.generatePaymentToken)

        // Stripe Webhook
        // https://api.admin.stuffyoucanuse.org/api/v1/stripeWebhookAction
        router.post("/stripeWebhookAction", bodyParser.raw({ type: 'application/json' }), this.stripeWebhookAction);

        router.post("/subscriptionRenewalStatus", BearerToken, this.subscriptionRenewalStatus);
        router.put("/updateCheckStatus/:user_subscription_id", BearerToken, this.updateCheckStatus);
        //Dispute APIs
        router.post('/getDisputedTransaction', BearerToken, this.getDisputedTransaction);
        router.post('/submitDisputeEvidence', BearerToken, this.submitDisputeEvidence);
        router.post('/subscriptionInstantPayment', BearerToken, this.subscriptionInstantPayment);

        router.put('/updateSubscriptionStatus/:user_subscription_id', BearerToken, this.updateSubscriptionStatus);
    }
}
