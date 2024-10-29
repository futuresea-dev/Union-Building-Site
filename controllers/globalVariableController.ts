import { Request, Response } from "express";
const { dbReader } = require('../models/dbConfig');
// Smit 25-11-21 
import { ErrorController } from "../core/ErrorController";
import { SuccessResponse } from "../core/ApiResponse";

/*
  * Getting list of global variable  - 
  * Code done by Smit 24-11-2021
  */

// Sm 25-11-21 
const EC = new ErrorController();

export class globalVariableController {
  //Sm 26-11-21
  public async listGlobalVariable(req: Request, res: Response) {
    var data = await dbReader.globalVariable.findAll();
    // Sm 25-11-21
    new SuccessResponse(EC.success, {
      user: null,
      //@ts-ignore
      token: req.token,
      data: data,
    }).send(res);
    //
  }
}