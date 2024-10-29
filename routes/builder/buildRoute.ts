//Sm & So

import { Router } from "express";
import { adminBuildController } from "../../controllers/buildController"
const BearerToken = require("../../middleware/bearerToken");

export class BuildRoute extends adminBuildController {
    constructor(router: Router) {
        super();
        this.route(router);
    }
    public route(router: Router) {
        router.post("/createMessageBuild", BearerToken, this.createMessageBuild);
        router.post("/listMessageBuild", BearerToken, this.listMessageBuild);
        router.post("/createVolume", BearerToken, this.createVolume);
        router.post("/listSeriesBuild", BearerToken, this.listSeriesBuild);
        router.post("/getShareLink", BearerToken, this.getShareLink);
        router.post("/deleteMessageBuild", BearerToken, this.deleteMessageBuild);
        router.post("/deleteVolume", BearerToken, this.deleteVolume);
        router.post("/updateSeriesBuild", BearerToken, this.updateSeriesBuild);

        // Builder Route 
        router.post("/createDuplicateBuildElement", BearerToken, this.createDuplicateBuildElement)
        router.post("/updateBuildElementsDetails", BearerToken, this.updateBuildElementsDetails)
        router.post("/updateMessageAndElements", BearerToken, this.updateMessageAndElements)
        router.post("/listBuildElementsDetails", BearerToken, this.listBuildElementsDetails)
        router.post("/listBuildElements", BearerToken, this.listBuildElements);
        router.post("/addMessageElementForWeb", BearerToken, this.addMessageElementForWeb);
        router.post("/saveElementsSortOrder", BearerToken, this.saveElementsSortOrder);
        router.post("/validateVideoURL", BearerToken, this.validateVideoURL)
        router.post("/getSeriesElementDetailsBySeriesId", BearerToken, this.getSeriesElementDetailsBySeriesId)
        router.post("/addUpdateSeriesElement", BearerToken, this.addUpdateSeriesElement)
        router.post("/updateSeriesBuildList", BearerToken, this.updateSeriesBuildList);
        router.post("/addUpdateSeriesBuildList", BearerToken, this.addUpdateSeriesBuildList)
        router.post("/createDuplicateSeries", BearerToken, this.createDuplicateSeries)
        router.post("/addSeriesBuildList", BearerToken, this.addSeriesBuildList)
        router.post("/createUpdateVolumeForMobile", BearerToken, this.createUpdateVolumeForMobile)
        router.post("/saveSeriesSortOrder", BearerToken, this.saveSeriesSortOrder)
        router.post("/addUpdateSeriesForMobile", BearerToken, this.addUpdateSeriesForMobile)

    }
}