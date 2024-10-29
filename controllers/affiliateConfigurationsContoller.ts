import { Request, Response } from 'express'
import { ErrorController, SuccessResponse, BadRequestError, ApiError } from '../core/index';
const { dbReader, dbWriter } = require('../models/dbConfig');
const EC = new ErrorController();

export class AffiliatesConfigurations {

  public listAffiliatesConfigurationsData = async (req: Request, res: Response) => {
    try {
      let data = await dbReader.affiliateConfigurations.findOne({
        attributes: ['affiliate_configuration_id', 'rate_type', 'rate', 'first_renewal_rate', 'second_renewal_rate', 'consecutive_renewal_rate', 'renewal_level', 'created_datetime', 'updated_datetime'],
        where: { is_deleted: 0 }
      });
      if (data) {
        new SuccessResponse(EC.errorMessage(EC.getMessage, ["AffiliatesConfigurations"]), { // @ts-ignore
          token: req.token,
          data: data
        }).send(res);
      } else new SuccessResponse(EC.noDataFound, {
        // @ts-ignore
        token: req.token,
        count: 0,
        rows: []
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
  public updateAffiliatesConfigurationsData = async (req: Request, res: Response) => {
    try {
      let { affiliate_configuration_id, rate_type, rate, first_renewal_rate, second_renewal_rate, consecutive_renewal_rate, renewal_level } = req.body
      let data
      if (affiliate_configuration_id != 0) {
        data = await dbWriter.affiliateConfigurations.update({
          rate_type: rate_type,
          rate: rate,
          first_renewal_rate: first_renewal_rate,
          second_renewal_rate: second_renewal_rate,
          consecutive_renewal_rate: consecutive_renewal_rate,
          renewal_level: renewal_level
        }, { where: { affiliate_configuration_id: affiliate_configuration_id } }
        );
        new SuccessResponse(EC.errorMessage(EC.updatedDataSuccess, ["Affiliates Configurations"]), { // @ts-ignore
          token: req.token,
        }).send(res);
      }
      else {
        data = await dbWriter.affiliateConfigurations.create({
          rate_type: rate_type,
          rate: rate,
          first_renewal_rate: first_renewal_rate,
          second_renewal_rate: second_renewal_rate,
          consecutive_renewal_rate: consecutive_renewal_rate,
          renewal_level: renewal_level
        });
      }
      new SuccessResponse(EC.errorMessage(EC.createdMessage, ["Affiliates Configurations"]), { // @ts-ignore
        token: req.token,
        data: data
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

}
