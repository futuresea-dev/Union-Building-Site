import { productReportController } from '../../controllers/analytics/productReportController';
import { Router } from "express";
const BearerToken = require("../../middleware/bearerToken");

export class productReportRoute extends productReportController {
    public self: any = "";
    constructor(router: Router) {
        super();
        this.route(router);
    }
    public route(router: Router) {
        // router.post("/getRevenueReportData",BearerToken,this.getRevenueReportData)
        router.post("/getProductSoldChartData", BearerToken, this.getProductSoldChartData)
        router.post("/getProductSoldCounts", BearerToken, this.getProductSoldCounts)
        router.post("/getProductSoldList", BearerToken, this.getProductSoldList)
        router.post("/getOrderByDate", BearerToken, this.getOrderByDate);
    }
}
