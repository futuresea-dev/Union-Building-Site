import { Router } from "express";
import { sendEmailLogsController } from "../../controllers/sendEmailogsController";
const BearerToken = require("../../middleware/bearerToken");

export class sendEmailLogRoute extends sendEmailLogsController {

    public self: any = "";

    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {
        // So 02-12-2021
        router.post("/listEmailLogs", BearerToken, this.listEmailLogs);
        router.post("/uploadDataToAWSBucket", this.uploadDataToAWSBucket);
    }
}