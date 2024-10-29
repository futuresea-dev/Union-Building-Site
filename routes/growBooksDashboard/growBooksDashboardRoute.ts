import { Router } from "express";
import { GrowBooksDashboardController } from "../../controllers/growBooksDashboardController";
const BearerToken = require('../../middleware/bearerToken');
import validator from '../../helpers/validator';
import schema from './schema';

export class GrowBooksDashboardRoute extends GrowBooksDashboardController {

    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {

        //Grow Books Dashboard API
        router.post("/getAllGrowBooks", validator(schema.getAllGrowBooks), this.getAllGrowBooks);
        router.get("/getGrowBookCategories", this.getGrowBookCategories);
        router.get("/getTopFourGrowBooks", this.getTopFourGrowBooks);
        // router.post("/getAllGrowBooksByCategory", validator(schema.getAllGrowBooksByCategory), this.getAllGrowBooksByCategory);
    }
}
