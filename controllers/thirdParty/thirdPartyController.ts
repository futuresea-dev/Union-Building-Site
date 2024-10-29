import { Request, Response } from "express";
const { dbReader, dbWriter } = require('../../models/dbConfig');
import { SuccessResponse } from '../../core/ApiResponse';
import { BadRequestError, ApiError } from '../../core/ApiError';
import { ErrorController } from "../../core/ErrorController";
const EC = new ErrorController();
const { Op } = dbReader.Sequelize;
export class ThirdPartyController {

  /**
     * Save third party activity log to Database
     * @param 
     */
  public async GetThirdPartyList(req: Request, res: Response) {
    try {
      let response = await dbReader.thirdParty.findAll();
      new SuccessResponse(EC.success, {
        response
      }).send(res);
    }
    catch (error: any) {
      ApiError.handle(new BadRequestError(error.message), res);
    }
  }
  /**
   * active/inactive integrated third party apis
   * @param req 
   * @param res 
   */
  public async ActiveInactiveThirdPartyAPI(req: Request, res: Response) {
    try {
      let { thirdparty_id, is_active } = req.body;
      let response = await dbWriter.thirdParty.update({
        is_active: is_active
      }, {
        where: {
          thirdparty_id: thirdparty_id
        }
      });
      if (response) {
        if (is_active) {
          new SuccessResponse(EC.success, {
            response: [1]
          }).send(res);
        } else {
          new SuccessResponse(EC.success, {
            response: [0]
          }).send(res);
        }
      }
    }
    catch (error: any) {
      ApiError.handle(new BadRequestError(error.message), res);
    }
  }

  /**
    * Save third party activity log to Database
    * @param 
    */
  public async GetThirdPartyConfigurationDetails(req: Request, res: Response) {
    try {
      let { id } = req.params;
      let obj = new ThirdPartyController();
      let response = await obj.GetThirdPartyConfigurationDetailsById(id);

      new SuccessResponse(EC.success, {
        response
      }).send(res);
    }
    catch (error: any) {
      ApiError.handle(new BadRequestError(error.message), res);
    }
  }

  /**
  * save third party apis configurations
  * @param req 
  * @param res 
  */
  public async SaveThirdPartyConfigurationDetails(req: Request, res: Response) {
    try {
      let { thirdparty_id, configuration_json } = req.body;

      if (thirdparty_id) {
        var data = await dbWriter.thirdPartyConfiguration.update(
          { configuration_json: configuration_json },
          { where: { thirdparty_id: thirdparty_id } }
        );
        new SuccessResponse(EC.saveDataSuccess, {
          user: null,
          //@ts-ignore
          token: req.token,
        }).send(res);
      }
    }
    catch (error: any) {
      ApiError.handle(new BadRequestError(error.message), res);
    }
  }
  /**
    * List third party api logs
    * @param req 
    * @param res 
    */
  public async ListThirdPartyLogs(req: Request, res: Response) {
    try {

      let { thirdparty_id, page_record, page_no, activity_type, status, search } = req.body;
      let rowLimit = page_record ? parseInt(page_record) : 50
      let rowOffset = page_no ? ((page_no * page_record) - page_record) : 0
      let whereStatement: any = {};

      if (activity_type) {
        whereStatement.activity_type = activity_type;
      }

      if (status.toLowerCase() != "") {
        if (status.toLowerCase() == "success") {
          whereStatement.status = 200;
        } else {
          whereStatement.status = { [dbReader.Sequelize.Op.not]: 200 };
        }
      }

      if (thirdparty_id) {
        whereStatement.thirdparty_id = thirdparty_id;
      }
      if (search) {
        whereStatement.email = {
          [Op.like]: "%" + req.body.search + "%"
        }
      }

      let response = await dbReader.thirdPartyLog.findAndCountAll({
        where: whereStatement,
        limit: rowLimit,
        offset: rowOffset,
        order: [['created_datetime', 'DESC']]
      });
      let thirdpartyLog = JSON.parse(JSON.stringify(response.rows));
      thirdpartyLog = thirdpartyLog.map((value: any) => {
        if (value.status) {
          if (value.status == 200) {
            value.status = "success";
          }
          else {
            value.status = "failed";
          }
        } else {
          value.status = "failed";
        }
        return value;
      });
      new SuccessResponse(EC.success, {
        //@ts-ignore
        token: req.token,
        count: response.count,
        rows: thirdpartyLog
      }).send(res);
    }
    catch (error: any) {
      ApiError.handle(new BadRequestError(error.message), res);
    }
  }
  /**
      * Save third party activity log to Database
      * @param 
      */
  public async GetThirdPartyConfigurationDetailsById(id: any) {
    try {
      var response = await dbReader.thirdPartyConfiguration.findOne({
        where: { thirdparty_id: id }
      });
      response = JSON.parse(JSON.stringify(response));
      if (response) {
        response.configuration_json = (response.configuration_json) ? JSON.parse(response.configuration_json) : null
      }
      return response;
    }
    catch (error: any) {
      throw new Error(error.message)
    }
  }

  /**
     * Save third party activity log to Database
     * @param 
     */
  public async SaveThirdPartyLog(_data: any = {}) {
    try {
      let response = await dbWriter.thirdPartyLog.create({
        thirdparty_id: _data.thirdparty_id,
        request: _data.request,
        response: _data.response,
        activity_type: _data.activity_type,
        status: _data.status,
      });
    }
    catch (error: any) {
      throw new Error(error);
    }
  }

  /**
     * Save third party activity log to Database
     * @param 
     */
  public async isThirdPartyActive(id: any) {
    try {
      let response = await dbReader.thirdParty.findOne({
        where: { thirdparty_id: id }
      });
      return response.is_active;
    }
    catch (error: any) {
      throw new Error(error.message)
    }
  }

  public async saveCloudStorageLogs(req: Request, res: Response) {
    try {
      let reqBody = req.body;
      let request = reqBody.request, response = reqBody.response, status = reqBody.status, activity_type = reqBody.activity_type;
      await dbWriter.thirdPartyLog.create({
        thirdparty_id: 3,
        request: request,
        response: response,
        activity_type: activity_type,
        status: status,
        created_datetime: new Date()
      });
      new SuccessResponse(EC.success, {}).send(res);
    }
    catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
}
