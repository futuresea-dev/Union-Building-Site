import { Router } from "express";
import { CategoryController } from "../../controllers/categoryController";
import validator, { ValidationSource } from '../../helpers/validator';
import schema from './schema';

const BearerToken = require('../../middleware/bearerToken');

export class CategoryRoute extends CategoryController {

    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {
        //volumes APIs
        router.get("/listAllVolumes", BearerToken, this.listAllVolumes);
        router.get("/getUserVolumeCounts", BearerToken, this.getUserVolumeCounts);
        router.post("/saveVolume", BearerToken, validator(schema.volumePayload), this.saveVolume);
        router.get("/getUserMembershipVolumes/:ministry_type?", BearerToken, this.getUserMembershipVolumes);
        // router.delete("/deleteVolume/:id", BearerToken, validator(schema.idParams, ValidationSource.PARAM), this.deleteVolume);
        router.get("/getVolumeDetails/:id", BearerToken, validator(schema.idParams, ValidationSource.PARAM), this.getVolumeDetails);

        //series APIs
        router.post("/addSeries", BearerToken, validator(schema.addSeriesPayload), this.addSeries);
        router.post("/listAllSeries", BearerToken, validator(schema.seriesListPayload), this.listAllSeries);
        router.post("/saveSeriesEmail", BearerToken, validator(schema.seriesEmailSavePayload), this.saveSeriesEmail);
        router.post("/updateSeriesDetails", BearerToken, validator(schema.updateSeriesDetailsPayload), this.updateSeriesDetails);
        router.post("/saveSeriesTutorials", BearerToken, validator(schema.saveSeriesTutorialsPayload), this.saveSeriesTutorials);
        router.post("/saveAmazonInternals", BearerToken, this.saveAmazonInternals);
        router.delete("/deleteSeries/:id", BearerToken, validator(schema.idParams, ValidationSource.PARAM), this.deleteSeries);
        router.get("/getSeriesEmailDetails/:id", validator(schema.idParams, ValidationSource.PARAM), this.getSeriesEmailDetails);
        router.get("/getMailChimpData/:id", BearerToken, validator(schema.idParams, ValidationSource.PARAM), this.getMailChimpData);
        router.get("/getSeriesDetails/:id", BearerToken, validator(schema.idParams, ValidationSource.PARAM), this.getSeriesDetails);
        router.get("/getSeriesEditorDetails/:id", BearerToken, validator(schema.idParams, ValidationSource.PARAM), this.getSeriesEditorDetails);
        router.get("/getAllSeriesEmailPages/:id", BearerToken, validator(schema.idParams, ValidationSource.PARAM), this.getAllSeriesEmailPages);
        router.get("/getSeriesTutorials/:category_id?", BearerToken, validator(schema.categoryIdPayload, ValidationSource.PARAM), this.getSeriesTutorials);
        router.get("/getAmazonInternals/:category_id?", BearerToken, validator(schema.categoryIdPayload, ValidationSource.PARAM), this.getAmazonInternals);
        router.post("/updateSeriesResourcesDetails", BearerToken, validator(schema.updateSeriesResourcesPayload), this.updateSeriesResourcesDetails);
        router.get("/getSeriesResourcesDetails/:category_id?", BearerToken, validator(schema.categoryIdPayload, ValidationSource.PARAM), this.getSeriesResourcesDetails);
        router.post("/updateSeriesHiddenDetails", BearerToken, this.updateSeriesHiddenDetails);

        //memory verse APIs
        router.put("/updateSeriesMemoryVerseDetails", BearerToken, validator(schema.updateSeriesMemoryVerseDetailsPayload), this.updateSeriesMemoryVerseDetails);
        router.get("/getSeriesMemoryVerseDetails/:category_id?", BearerToken, validator(schema.categoryIdPayload, ValidationSource.PARAM), this.getSeriesMemoryVerseDetails);

        //Category APIs
        router.get("/getAllCategories", BearerToken, this.getAllCategories);
        router.post("/getVolumeSeries", BearerToken, validator(schema.getVolumeSeriesPayload), this.getVolumeSeries);
        router.post("/listSeriesSortOrders", BearerToken, this.listSeriesSortOrders);
        router.post("/updateSeriesSortOrders", BearerToken, this.updateSeriesSortOrders);
    }
}
