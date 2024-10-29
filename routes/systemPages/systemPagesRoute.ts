import { NextFunction, Request, Response, Router } from "express";
import { SystemaPagesController } from "../../controllers/systemPagesController";
import validator, { ValidationSource } from '../../helpers/validator';
const BearerToken = require('../../middleware/bearerToken');
const Hash = require("../../middleware/hashMiddleware");
import schema from "./schema";

export class systemPages extends SystemaPagesController {
    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {
        router.post("/listSystemPages/", BearerToken, this.SystemPagesList);
        router.get("/getDashboardBlogsAndNews", this.getDashboardBlogsAndNews);
        router.get("/getDashboardHeaderNineDots", Hash, BearerToken, this.getDashboardHeaderNineDots);
        router.get("/getDashboardHeaderNineDotsV2", Hash,BearerToken, this.getDashboardHeaderNineDotsV2);
        router.post("/addEditDashboardHeaderNineDots", Hash, BearerToken, this.createUpdateDashboardHeaderNineDots);
        router.post("/updateNineDotMenuOrder", Hash, BearerToken, this.updateMenuOrder);
        router.get("/getDashboardHeaderCreativeBoard", this.getDashboardHeaderCreativeBoard)
        router.get("/getDashboardPageSideMenu", BearerToken, this.getDashboardPageSideMenu);
        router.get("/detailSystemPages/:system_pages_id?", validator(schema.detailSystemPages, ValidationSource.PARAM), BearerToken, this.detailSystemPages);
        router.put("/updateSystemPages", validator(schema.updateSystemPages), BearerToken, this.updateSystemPages);
        router.delete("/deleteSystemPages/:system_pages_id?", BearerToken, this.deleteSystemPages);
        router.post("/listOfSystemPageAndPageLink", BearerToken, this.ListOfSystemPageAndPageLink);

        router.post("/amazonExternalPageList", validator(schema.amazonExternalPageListPayload), BearerToken, this.amazonExternalPageList)
        router.put("/addUpdateAmazonExternalPage", validator(schema.addUpdateAmazonExternalPagePayload), BearerToken, this.addUpdateAmazonExternalPage)
        router.delete("/deleteAmazonExternalPage/:amazon_events_id?", validator(schema.deleteAmazonExternalPagePayload), BearerToken, this.deleteAmazonExternalPage)

        router.get("/getQuickLinks/:type", validator(schema.getQuickLinksPayload, ValidationSource.PARAM), BearerToken, this.getQuickLinks)
        router.post("/blogSiteMapReport", BearerToken, validator(schema.blogSiteMapReport), this.blogSiteMapReport)
        router.post("/test-download", this.testS3HtmlDownload)

        //Migration API
        router.post("/builderDataMigrationScript", this.builderDataMigrationScript)
    }
}
