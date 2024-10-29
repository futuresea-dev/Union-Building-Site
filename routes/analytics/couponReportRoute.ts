import { CouponReportController } from '../../controllers/analytics/couponReportController';
import { Router } from "express";
const BearerToken = require("../../middleware/bearerToken");

export class couponReportRoute extends CouponReportController{
    public self: any = "";
    constructor(router: Router) {
        super();
        this.route(router);
    } 
    public route(router: Router) {
            router.post("/getCouponUserListData",BearerToken,this.getCouponUserListData)
            router.post("/getCouponUsedChartData",BearerToken,this.getCouponUsedChartData)
            router.post("/getCouponUsedCount",BearerToken,this.getCouponUsedCount)
       
    }
}