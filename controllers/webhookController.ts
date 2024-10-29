import { NextFunction, Request, Response } from "express";
import { ErrorController } from "../core/ErrorController";
import { SuccessResponse } from "../core/ApiResponse";
import { BadRequestError, ApiError } from "../core/ApiError";
const { dbReader, dbWriter } = require("../models/dbConfig");
const { GeneralController } = require('./generalController');
import fs from 'fs';
import path from 'path';

const EC = new ErrorController();

export class WebhookController {

  public async getCircle(req: Request, res: Response) {
    try {
      const filePath = path.join(__dirname, 'request_dump.json');
      const fileData = await fs.promises.readFile(filePath, 'utf-8');
      new SuccessResponse(EC.errorMessage(EC.getMessage, [""]), {
        //@ts-ignore
        token: req.token,
        data: fileData,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async postCircle(req: Request, res: Response) {
    try {
        const requestData = {
          headers: req.headers,
          body: req.body
        };
        const dataToWrite = JSON.stringify(requestData, null, 2);
        const filePath = path.join(__dirname, 'request_dump.json');
        await fs.promises.writeFile(filePath, dataToWrite, 'utf-8');
        new SuccessResponse(EC.errorMessage(EC.getMessage, [""]), {
          //@ts-ignore
          token: req.token,
          data: requestData,
        }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
}
