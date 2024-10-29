import { NextFunction, Request, Response, Router } from "express";
import { CategotyController } from "../controllers/categoryHabitController";
const BearerToken = require("../middleware/bearerToken");
import validator, { ValidationSource } from '../helpers/validator';
// import schema from "./schema";

export class categoryHabitRoute extends CategotyController {
    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {
        router.post("/createCategory", BearerToken, this.createCategory);
        router.post("/listHabitCategory", BearerToken, this.listHabitCategory)
        router.put("/deleteHabitCategory", BearerToken, this.deleteHabitCategory)
        router.put("/editHabitCategory", BearerToken, this.editHabitCategory)
    }
}