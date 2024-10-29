import { ReportController } from '../../controllers/reportsController';
import { Router } from "express";
const BearerToken = require("../../middleware/bearerToken");

export class ReportsRoute extends ReportController {
    public self: any = "";
    constructor(router: Router) {
        super();
        this.route(router);
    } 
    public route(router: Router) {
        router.post("/getRevenueReportData",BearerToken,this.getRevenueReportData)
        router.post("/getRevenueByProductReportData",BearerToken,this.getRevenueByProductReportData)
        router.post("/getRenewalsReportData",BearerToken,this.getRenewalsReportData)
        router.post("/getRegisterdUserReportData",BearerToken,this.getRegisterdUserReportData)
        
    }
}