import { emailReportController } from '../../controllers/analytics/emailReportController';
import { Router } from "express";
const BearerToken = require("../../middleware/bearerToken");

export class emailReportRoute extends emailReportController{
    public self: any = "";
    constructor(router: Router) {
        super();
        this.route(router);
    } 
    public route(router: Router) {
        // router.post("/getRevenueReportData",BearerToken,this.getRevenueReportData)
        //  router.post("/getProductSoldChartData",BearerToken,this.getProductSoldChartData)
          router.post("/getEmailGraphData",BearerToken,this.getEmailGraphData)
          router.post("/getEmailListDataByDateAndSubject",BearerToken,this.getEmailListDataByDateAndSubject)
          router.post("/getEmailListData",BearerToken,this.getEmailListData);
        
    }
}