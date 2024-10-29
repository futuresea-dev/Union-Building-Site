import { Router } from "express";
import { LogController } from "../../controllers/logController";
import validator from "../../helpers/validator";
import schema from "./schema"

export class ApiLogRoute extends LogController {
    public self: any = "";
    constructor(router: Router) {
        super();
        this.route(router);
    }
    public route(router: Router) {
        router.post("/listApiLogs", validator(schema.listApiLogs), this.listApiLogs);
        router.get("/sitesList", this.sitesList);
        router.post("/debuggerIsActiveOrNot", validator(schema.debuggerIsActiveOrNot), this.debuggerIsActiveOrNot);
        router.post("/clearApiLogData", validator(schema.clearApiLogData), this.clearApiLogData);
    }
}
