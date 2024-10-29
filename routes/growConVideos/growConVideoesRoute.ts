import { Router } from "express";
import { GrowConVideoes } from "../../controllers/growConVideoController";
const BearerToken = require('../../middleware/bearerToken');
import validator, { ValidationSource } from '../../helpers/validator';
import schema from './schema';

export class GrowConVideoesRoute extends GrowConVideoes {

    public self: any = "";

    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {
        router.post("/addEditGrowConVideoes", BearerToken, validator(schema.addEditGrowConVideoesPayload), this.addEditGrowConVideoes);
        router.post("/removeGrowConVideoes", BearerToken, validator(schema.removeGrowConVideoes), this.removeGrowConVideoes);
        router.post("/getAllGrowConVideoes", BearerToken, validator(schema.getAllGrowConVideoes), this.getAllGrowConVideoes);
        router.get("/getAllGrowConFolders", BearerToken, this.getAllGrowConFolders);
        router.post("/addEditGrowConFolder", BearerToken, this.addEditGrowConFolder);
        router.post("/deleteGrowConFolder", BearerToken, this.deleteGrowConFolder);
    }
}
