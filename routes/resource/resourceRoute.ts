import { Resource } from '../../controllers/resourceController';
import { Router } from "express";
const BearerToken = require("../../middleware/bearerToken");

export class ResourceRoute extends Resource {
    public self: any = "";
    constructor(router: Router) {
        super();
        this.route(router);
    }
    public route(router: Router) {
        router.post("/saveResource", this.saveResource)
        router.post("/listAllResource", this.listAllResource)
        router.post("/deleteResource", this.deleteResource)
    }
}