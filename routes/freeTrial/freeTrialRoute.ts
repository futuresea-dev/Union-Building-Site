import { Router } from "express";
import { FreeTrialController } from "../../controllers/freeTrialController";
const BearerToken = require('../../middleware/bearerToken');
import validator, { ValidationSource } from '../../helpers/validator';
import schema from './schema';

export class FreeTrialRoute extends FreeTrialController {

    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {
        //Grow Stories API
        router.post("/saveGrowStory", BearerToken, validator(schema.saveGrowStoryPayload), this.saveGrowStory);
        router.post("/listAllGrowStories", BearerToken, validator(schema.listingPayload), this.listAllGrowStories);
        router.post("/deleteGrowStory", BearerToken, validator(schema.deleteGrowStoryPayload), this.deleteGrowStory);
        router.post("/sortGrowStories", BearerToken, validator(schema.sortGrowStoriesPayload), this.sortGrowStories);
        router.post("/updateGrowStoryStatus", BearerToken, validator(schema.updateGrowStoryStatus), this.updateGrowStoryStatus);
        router.post("/countGrowStoryViews", BearerToken, validator(schema.countGrowStoryViews), this.countGrowStoryViews);

        //Application Ads API
        router.post("/listAllApplicationAds", BearerToken, validator(schema.listingPayload), this.listAllApplicationAds);
        router.post("/sortApplicationAds", BearerToken, validator(schema.sortApplicationsPayload), this.sortApplicationAds);
        router.post("/saveApplicationAds", BearerToken, validator(schema.saveApplicationAdsPayload), this.saveApplicationAds);
        router.post("/deleteApplicationAds", BearerToken, validator(schema.deleteApplicationPayload), this.deleteApplicationAds);
        router.post("/updateApplicationAdsStatus", BearerToken, validator(schema.updateApplicationAdsStatus), this.updateApplicationAdsStatus);
        router.post("/saveApplicationColor", BearerToken, validator(schema.saveApplicationColor), this.saveApplicationColor);
        router.post("/listAllApplicationColor", BearerToken, validator(schema.listAllApplicationColor), this.listAllApplicationColor);

        //Helpful Resources API
        router.post("/saveHelpfulResource", BearerToken, validator(schema.saveResourcePayload), this.saveHelpfulResource);
        router.post("/listAllHelpfulResources", BearerToken, validator(schema.listingPayload), this.listAllHelpfulResources);
        router.post("/sortHelpfulResources", BearerToken, validator(schema.sortResourcesPayload), this.sortHelpfulResources);
        router.post("/deleteHelpfulResource", BearerToken, validator(schema.deleteResourcePayload), this.deleteHelpfulResource);

        // ToDo List
        router.post("/saveToDoList", BearerToken, validator(schema.saveToDoList), this.saveToDoList);
        router.post("/sortToDoList", BearerToken, validator(schema.sortToDoList), this.sortToDoList);
        router.post("/deleteToDoList", BearerToken, validator(schema.deleteToDoList), this.deleteToDoList);
        router.post("/listAllTodoList", BearerToken, validator(schema.listAllTodoList), this.listAllTodoList);

        // Church List
        router.post("/saveChurch", BearerToken, validator(schema.saveChurch), this.saveChurch);
        router.get("/listAllChurch", BearerToken, this.listAllChurch);
        router.post("/deleteChurch", BearerToken, validator(schema.deleteChurch), this.deleteChurch);
    }
}
