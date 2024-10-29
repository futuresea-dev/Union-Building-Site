import { NextFunction, Request, Response } from "express";
import { ErrorController } from "../core/ErrorController";
import { SuccessResponse } from "../core/ApiResponse";
import { BadRequestError, ApiError } from "../core/ApiError";
const { dbReader, dbWriter } = require("../models/dbConfig");
const { GeneralController } = require('./generalController');
const { Op } = dbReader.Sequelize;

const EC = new ErrorController();

export class SupportTicketController1 {
  public async test(req: Request, res: Response) {
    try {
        var data = await dbReader.users.findAndCountAll();
      if (data) {
        new SuccessResponse(EC.errorMessage(EC.getMessage, [""]), {
          //@ts-ignore
          token: req.token,
          data: data,
        }).send(res);
      } else new SuccessResponse(EC.noDataFound, {}).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
}
