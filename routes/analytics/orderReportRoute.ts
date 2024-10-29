import { OrderReportController } from './../../controllers/analytics/orderReportController';
import { NextFunction, Request, Response, Router } from "express";
import validator, { ValidationSource } from '../../helpers/validator';
const BearerToken = require('../../middleware/bearerToken');


export class orderReportRoute extends OrderReportController {
  constructor(router: Router) {
    super();
    this.route(router);
  }
  public route(router: Router) {
    router.post("/getOrderCount", BearerToken, this.getOrderCount);
    router.post("/getOrderGraphData", BearerToken, this.getOrderGraphData);
    router.post("/getOrderListDateWise", BearerToken, this.getOrderListDateWise);

  }
}