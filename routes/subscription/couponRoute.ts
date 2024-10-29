import { NextFunction, Request, Response, Router } from "express";
import { CouponController } from "../../controllers/couponController";
import validator, { ValidationSource } from '../../helpers/validator';
import schema from './schema';
const BearerToken = require('../../middleware/bearerToken');

export class CouponRoute extends CouponController {

    public self: any = "";

    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {
        router.post("/listAllCoupons", BearerToken, validator(schema.listCouponPayload), this.listAllCoupons);
        router.get("/getCouponDetails/:id", BearerToken, this.getCouponDetails);
        router.post("/saveCoupon", BearerToken, validator(schema.saveCouponPayload), this.saveCoupon);
        router.post("/deleteCoupon", BearerToken, this.deleteCoupon);
    }
}