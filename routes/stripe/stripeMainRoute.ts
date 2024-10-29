import { NextFunction, Request, Response, Router } from "express";
import { stripeMain } from "../../controllers/thirdParty/stripe/stripeMain";

export class StripeMainRoute extends stripeMain {

    public self: any = "";

    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {
        //router.post("/newStripeCustomer", this.addUpdateNewCustomer);
        //router.post("/addNewCard", this.stripeCustomerInfo);
        // router.post("/createPayment", this.CreatePayment);
    }
}