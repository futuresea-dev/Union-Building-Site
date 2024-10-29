import { ShareResource } from '../../controllers/shareResouceController';
import { Router } from "express";
const BearerToken = require("../../middleware/bearerToken");

export class ShareResourceRoute extends ShareResource {
    public self: any = "";
    constructor(router: Router) {
        super();
        this.route(router);
    }
    public route(router: Router) {
        router.post("/createResourceLink", this.createResourceLink)
        router.post("/getResourceShareLink", this.getResourceShareLink)
        // router.delete("/deleteResource", BearerToken, this.deleteResource)

        router.post("/compressesFiles",this.compressesFiles)
    }
}