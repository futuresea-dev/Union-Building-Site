import { Router } from "express";
import { pageController } from "../../controllers/pageController";
import validator, { ValidationSource } from '../../helpers/validator';
import schema from './schema';
const Hash = require("../../middleware/hashMiddleware");

const BearerToken = require('../../middleware/bearerToken');

export class PageRoute extends pageController {

    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {
        router.get("/getAllPages", BearerToken, this.getAllPages);
        router.post("/savePageEditor", BearerToken, this.savePageEditor);
        router.post("/sortFreeVbsPages", BearerToken, this.sortFreeVbsPages);
        router.get("/getAllFreeVbsPages", this.getAllFreeVbsPages);
        router.post("/listAllContentTypes", BearerToken, this.listAllContentTypes);
        router.post("/sortPageContentType", BearerToken, this.sortPageContentType);
        router.post("/savePage", BearerToken, validator(schema.pagePayload), this.savePage);
        router.get("/getAllPurchasedMusicProducts", BearerToken, this.getAllPurchasedMusicProducts);
        router.post("/getPageLinkData", validator(schema.getPageLinkDataPayload), this.getPageLinkData);
        router.post("/listAllPages", BearerToken, validator(schema.pageListPayload), this.listAllPages);
        router.post("/publishPage", BearerToken, validator(schema.publishPagePayload), this.publishPage);
        router.post("/getPageLinkDetails", BearerToken, validator(schema.pageLinkPayload), this.getPageLinkDetails);
        router.post("/validateLinkKeyword", BearerToken, validator(schema.validateLinkPayload), this.validateLinkKeyword);
        //     router.delete("/deletePage/:id", BearerToken, validator(schema.idParams, ValidationSource.PARAM), this.deletePage);
        router.post("/duplicatePage/:id", BearerToken, validator(schema.idParams, ValidationSource.PARAM), this.duplicatePage);
        router.get("/getPageDetails/:id", BearerToken, validator(schema.idParams, ValidationSource.PARAM), this.getPageDetails);
        router.post("/getPageConnectedSeries", BearerToken, validator(schema.getPageSeriesPayload), this.getPageConnectedSeries);
        router.post("/savePageConnectedSeries", BearerToken, validator(schema.savePageSeriesPayload), this.savePageConnectedSeries);
        router.get("/getPageDetailsForAdmin/:id", BearerToken, validator(schema.idParams, ValidationSource.PARAM), this.getPageDetailsForAdmin);
        router.get("/getNonPurchasedPageDetails/:id", BearerToken, validator(schema.idParams, ValidationSource.PARAM), this.getNonPurchasedPageDetails);
        router.post("/updatePageTitle", BearerToken, validator(schema.updatePageTitlePayload), this.updatePageTitle);
    }
}
