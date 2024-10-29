import { NextFunction, Request, Response, Router } from "express";
import { RevenueController } from "../../controllers/analytics/revenueController";
import validator, { ValidationSource } from '../../helpers/validator';
const BearerToken = require('../../middleware/bearerToken');


export class revenueRoute extends RevenueController {
  constructor(router: Router) {
    super();
    this.route(router);
  }

  public route(router: Router) {
    router.post("/getRevenueCount", BearerToken, this.getRevenueCount);
    router.post("/getRevenueGrossSaleGraphData", BearerToken, this.getRevenueGrossSaleGraphData);
    router.post("/getRevenueListDateWise", BearerToken, this.getRevenueListDateWise);

  }
}