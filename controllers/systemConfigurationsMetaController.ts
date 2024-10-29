import { Request, Response } from "express";
import { ErrorController, SuccessResponse, BadRequestError, ApiError } from "../core/index";
const { dbReader, dbWriter } = require("../models/dbConfig");
const EC = new ErrorController();

export class systemConfigurationsMetaController {

  /**
   * save system configurations meta
   * @param req
   * @param res
   */
  public async saveSystemConfigurationsMeta(req: Request, res: Response) {
    try {
      let { system_configuration, sc_type } = req.body;
      let systemConfiguration: any = [], isExistScMetaId: any = [];
      let meta_value = "case sc_meta_id";

      system_configuration.forEach((element: any) => {
        if (element.sc_meta_id) {
          isExistScMetaId.push(element.sc_meta_id);
          meta_value += " when " + element.sc_meta_id + " then " + element.sc_meta_value;
        }
      });

      if (isExistScMetaId.length) {
        meta_value += " else sc_meta_value end";
        await dbWriter.systemConfigurationMeta.update({
          sc_meta_value: dbWriter.Sequelize.literal(meta_value)
        }, {
          where: { sc_meta_id: { [dbReader.Sequelize.Op.in]: isExistScMetaId } }
        });
      }

      new SuccessResponse(EC.DataFetched, {
        //@ts-ignore
        token: req.token,
        system_configuration: systemConfiguration,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  /**
   * list all system configurations
   * @param req
   * @param res
   */
  public async listAllSystemConfigurations(req: Request, res: Response) {
    try {
      let sc_type = req.params.id;
      if (sc_type) {
        let systemConfiguration = await dbReader.systemConfigurationMeta.findAll({
          where: { sc_type: sc_type, sc_status: 1 },
          attributes: ["sc_meta_id", "sc_type", "sc_meta_key", "sc_meta_value"]
        });
        new SuccessResponse(EC.DataFetched, {
          //@ts-ignore
          token: req.token,
          system_configuration: systemConfiguration,
        }).send(res);
      }
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async listThirdPartyServiceData(req: Request, res: Response) {
    try {
      let { site_id } = req.params;
      let systemThirdPartyService =
        await dbReader.systemThirdPartyService.findAll({
          where: { site_id: site_id },
        });
      if (systemThirdPartyService.length) {
        systemThirdPartyService.forEach((element: any) => {
          element.json_value = element.json_value
            ? JSON.parse(element.json_value)
            : null;
        });
      }
      new SuccessResponse(EC.success, {
        //@ts-ignore
        token: req.token,
        systemThirdPartyService,
      }).send(res);
    } catch (err: any) {
      ApiError.handle(new BadRequestError(err.message), res);
    }
  }

  public async updateThirdPartyServiceData(req: Request, res: Response) {
    try {
      let { system_third_party_service_id, json_value, site_id, third_party_service_type } = req.body;
      if (system_third_party_service_id) {
        await dbWriter.systemThirdPartyService.update({
          json_value: json_value,
        }, {
          where: { system_third_party_service_id: system_third_party_service_id }
        });
      } else {
        await dbWriter.systemThirdPartyService.create({
          json_value: json_value,
          site_id: site_id,
          third_party_service_type: third_party_service_type,
        });
      }
      new SuccessResponse(EC.success, {
        //@ts-ignore
        token: req.token,
      }).send(res);
    } catch (err: any) {
      ApiError.handle(new BadRequestError(err.message), res);
    }
  }

  //this API is for get System Configuration Data
  public async getSystemConfiguration(req: Request, res: Response) {
    try {
      let { site_id, data_for } = req.body;
      let attributes: any = [];

      switch (data_for) {
        case "mobile_application":
          if (site_id == 3 || site_id == 4 || site_id == 5 || site_id == 7) {
            attributes = ["system_configuration_id", "android_app_version", "android_force_update", "ios_app_version", "ios_force_update", "site_id"];
          } else if (site_id == 6) {
            attributes = ["system_configuration_id", "android_app_version", "android_force_update", "roku_app_version", "roku_force_update" , "ios_app_version", "ios_force_update",
              "site_id", "apple_tv_app_version", "apple_tv_force_update", "amazon_fire_stick_app_version", "amazon_fire_stick_force_update"];
          }
          break;
        case "privacy_policy":
          attributes = ["system_configuration_id", "site_id", "privacy_policy"];
          break;
        case "terms_and_conditions":
          attributes = ["system_configuration_id", "site_id", "terms_and_conditions"];
          break;
        case "return_policy":
          attributes = ["system_configuration_id", "site_id", "return_policy"];
          break;
        case "payment_policy":
          attributes = ["system_configuration_id", "site_id", "payment_policy"];
          break;
        case "about_us":
          attributes = ["system_configuration_id", "site_id", "about_us"];
          break;
        default:
          attributes = ["system_configuration_id", "android_app_version", "android_force_update", "ios_app_version",
            "ios_force_update", "payment_policy", "return_policy", "terms_and_conditions", "privacy_policy", "site_id"];
          break;
      }

      if (site_id) {
        let siteData: any;
        if (attributes.length) {
          siteData = await dbReader.systemConfiguration.findOne({
            where: { site_id: site_id },
            attributes: attributes,
          });
        } else {
          siteData = await dbReader.systemConfiguration.findOne({
            where: { site_id: site_id }
          });
        }
        siteData = JSON.parse(JSON.stringify(siteData));
        new SuccessResponse(siteData ? EC.DataFetched : EC.noDataFound, {
          //@ts-ignore
          token: req.token,
          ...siteData,
        }).send(res);
      }
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  // this API is for update system configuration(Android,IOS) and system policies data
  public async updateSystemConfiguration(req: Request, res: Response) {
    try {
      let _data: any = {};
      let { system_configuration_id, site_id, privacy_policy, terms_and_conditions, return_policy, payment_policy,
        android_app_version, android_force_update, roku_app_version,roku_force_update,ios_app_version, ios_force_update, about_us, apple_tv_app_version,
        apple_tv_force_update, amazon_fire_stick_app_version, amazon_fire_stick_force_update } = req.body;
      _data.site_id = site_id;

      if (android_app_version) {
        _data.android_app_version = android_app_version;
      }
      if (android_force_update) {
        _data.android_force_update = android_force_update;
      }
      if(roku_app_version){
        _data.roku_app_version = roku_app_version;
      }
      // if(roku_force_update){
        _data.roku_force_update = roku_force_update;
      // }
      if (ios_app_version) {
        _data.ios_app_version = ios_app_version;
      }
      if (ios_force_update) {
        _data.ios_force_update = ios_force_update;
      }
      if (privacy_policy) {
        _data.privacy_policy = privacy_policy;
      }
      if (terms_and_conditions) {
        _data.terms_and_conditions = terms_and_conditions;
      }
      if (return_policy) {
        _data.return_policy = return_policy;
      }
      if (payment_policy) {
        _data.payment_policy = payment_policy;
      }
      if (about_us) {
        _data.about_us = about_us;
      }
      if (apple_tv_app_version) {
        _data.ios_app_version = apple_tv_app_version;
        _data.apple_tv_app_version = apple_tv_app_version;
      }
      if (apple_tv_force_update) {
        _data.ios_force_update = apple_tv_force_update;
        _data.apple_tv_force_update = apple_tv_force_update;
      }
      if (amazon_fire_stick_app_version) {
        _data.amazon_fire_stick_app_version = amazon_fire_stick_app_version;
      }
      if (amazon_fire_stick_force_update) {
        _data.amazon_fire_stick_force_update = amazon_fire_stick_force_update;
      }

      let updateData = await dbWriter.systemConfiguration.update(_data, {
        where: { system_configuration_id: system_configuration_id }
      });

      new SuccessResponse(EC.SystemConfigurationDataUpdated, {
        //@ts-ignore
        token: req.token,
        system_configuration: updateData,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
}
