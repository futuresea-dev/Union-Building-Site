"use strict";
import { Router } from "express";
import { ErrorLogController } from "../../controllers/errorLogController";
import schema from './schema';
import validator from "../../helpers/validator";

export class ErrorLogsRoute extends ErrorLogController {
    public self: any = "";
    constructor(router: Router) {
        super();
        this.route(router);
    }
    public route(router: Router) {
        router.get("/errorFileList", this.errorFileList);
        router.post("/readErrorLogFiles", validator(schema.readErrorLogFilesPayload), this.readErrorLogFiles);
        router.post("/deleteErrorLogFiles",validator(schema.deleteErrorLogFiles), this.deleteErrorLogFiles);
    }
}