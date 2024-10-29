import { Router } from "express";
import { AdminActivityLog } from "../../controllers/adminActivityLog"
const BearerToken = require("../../middleware/bearerToken");
import validator from "../../helpers/validator";
import schema from "./schema";

export class AdminActivityRoute extends AdminActivityLog {
    constructor(router: Router) {
        super();
        this.route(router);
    }
    public route(router: Router) {
        router.post("/getAdminActivityLog", BearerToken, this.getAdminActivityLog);
        router.post("/userWiseAdminActivityLog", BearerToken, this.userWiseAdminActivityLog);
        router.post("/addAdminActivityLog", BearerToken, validator(schema.addAdminActivityLog), this.addAdminActivityLog);
    }
}