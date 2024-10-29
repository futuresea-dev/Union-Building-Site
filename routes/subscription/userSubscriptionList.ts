import { Router } from "express";
import { UserSubscriptionController } from "../../controllers/subscriptionController";
import validator, { ValidationSource } from '../../helpers/validator';
import schema from './schema';
const BearerToken = require('../../middleware/bearerToken');

export class UserSubscriptionRoute extends UserSubscriptionController {
    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {
        //So 24-11-2021    
        router.post("/listSubscription", BearerToken, this.listSubscription);
        router.post("/getUserSubscriptionDetail/:id", BearerToken, this.getUserSubscriptionDetail);
        router.post("/createNewSubscription", BearerToken, this.createNewSubscription);
        router.post("/updateUserSubscriptionStatus", BearerToken, this.updateUserSubscriptionStatus);

        //Mr 05-01-2022
        router.post("/userActiveProducts", BearerToken, this.userActiveProducts);

        //SH 07-01-22
        router.post("/updateBillingShippingAddressDetail", BearerToken, validator(schema.saveShippingAddressPayload), this.updateBillingShippingAddressDetail);
        router.post("/listSubscriptionTransaction", BearerToken, validator(schema.listSubscriptionTransactionPayload), this.listSubscriptionTransaction);

        router.post("/changeSubscriptionStatus", BearerToken, validator(schema.changeSubscriptionStatus), this.changeSubscriptionStatus);

    }
}
