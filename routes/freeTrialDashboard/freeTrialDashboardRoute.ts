import { Router } from "express";
import { FreeTrialDashboardController } from "../../controllers/freeTrialDashboardController";
const BearerToken = require('../../middleware/bearerToken');
import validator, { ValidationSource } from '../../helpers/validator';
import schema from '../freeTrialDashboard/schema';

export class FreeTrialDashboardRoute extends FreeTrialDashboardController {

    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {
        //Grow Stories API
        router.post("/getAllGrowStories", BearerToken, validator(schema.getAllGrowStories), this.getAllGrowStories);
        router.post("/getAllApplicationAds", BearerToken, validator(schema.getAllApplicationAds), this.getAllApplicationAds);
        router.post("/getAllToDoList", BearerToken, validator(schema.getAllToDoList), this.getAllToDoList);
        router.post("/isToDoCompleted", BearerToken, validator(schema.isToDoCompleted), this.isToDoCompleted);
        router.post("/saveFeedback", BearerToken, validator(schema.saveFeedback), this.saveFeedback);
        router.post("/updateFreeTrialUserCouponVariant", BearerToken, this.updateFreeTrialUserCouponVariant);
        router.get("/getProductsForFreeTrial",  this.getProductsForFreeTrial);
    }
}
