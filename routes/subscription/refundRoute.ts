import { Router } from "express";
import { RefundController } from "../../controllers/refundController";
import validator from '../../helpers/validator';
import schema from './schema';
const BearerToken = require('../../middleware/bearerToken');
export class RefundRoute extends RefundController {

    public self: any = "";

    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {
        router.post("/addOrderRefund", BearerToken, this.addOrderRefund);
        router.post("/applyScholarshipRefundCheck", BearerToken, this.applyScholarshipRefundCheck);
    }
}