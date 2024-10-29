import { Request, Response } from "express";
import { ErrorController } from "../core/ErrorController";
import { SuccessResponse } from "../core/ApiResponse";
import { BadRequestError, ApiError } from "../core/ApiError";
const { dbReader, dbWriter } = require("../models/dbConfig");
import { enumerationController } from '../controllers/enumerationController';
const zlib = require('zlib');
const EC = new ErrorController();
var EnumObject = new enumerationController();

export class geoController {

  public async getStateList(req: Request, res: Response) {
    try {

      let stateList = await dbReader.state.findAll({
        where: {
          country_id: req.params.countryId
        }
      });
      new SuccessResponse(EC.success, {
        //@ts-ignore
        token: req.token,
        stateList
      }).send(res);
    }
    catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
  public async getCountryList(req: Request, res: Response) {
    try {
      let countryList = await dbReader.country.findAll({});
      new SuccessResponse(EC.success, {
        //@ts-ignore
        token: req.token,
        countryList
      }).send(res);
    }
    catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async listGeoColor(req: Request, res: Response) {
    try {
      let geoColorData = await dbReader.geoConfig.findAll({
        // where: { is_active: 1 },
      });

      geoColorData = JSON.parse(JSON.stringify(geoColorData));
      new SuccessResponse(EC.success, {
        //@ts-ignore
        token: req.token,
        data: geoColorData,
      }).send(res);

    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async saveGeoConfig(req: Request, res: Response) {
    try {
      //@ts-ignore
      // let { user_id = 0 } = req, geoConfigData: any = [];
      let update_config_id: any = [], geo_pin_color = "case geo_config_id ", is_active = "case geo_config_id ";
      // let { geo_config_id, geo_pin_title, geo_pin_color } = req.body;
      let { geo_color_data } = req.body;

      // geoConfigData = await dbWriter.geoConfig.create({
      //   geo_pin_title: geo_pin_title,
      //   geo_pin_color: geo_pin_color,
      //   updated_by : user_id,
      //   is_active : 1
      // });

      geo_color_data.forEach((element: any) => {
        update_config_id.push(element.geo_config_id);
        geo_pin_color += " when " + element.geo_config_id + " then '" + element.geo_pin_color + "'";
        is_active += " when " + element.geo_config_id + " then " + element.is_active;
      });

      if (update_config_id.length) {
        geo_pin_color += " else geo_pin_color end";
        is_active += " else is_active end";
        await dbWriter.geoConfig.update(
          {
            geo_pin_color: dbWriter.Sequelize.literal(geo_pin_color),
            is_active: dbWriter.Sequelize.literal(is_active),
          },
          { where: { geo_config_id: update_config_id } }
        );
      }

      new SuccessResponse(EC.errorMessage("User GeoLocation updated successfully."), {
        //@ts-ignore
        token: req.token,
        // data: geoConfigData
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async listGeoData(req: Request, res: Response) {
    try {
      let { country, state, product } = req.body
      let geo_config_id_con = dbReader.Sequelize.Op.ne, geo_config_id_data = null
      if (product && product.length) {
        geo_config_id_con = dbReader.Sequelize.Op.in
        geo_config_id_data = product
      }
      let addressRequired = false
      let state_id_con = dbReader.Sequelize.Op.ne, state_id_data = null, stateRequired = false
      if (state && state.length) {
        state_id_con = dbReader.Sequelize.Op.in
        state_id_data = state
        stateRequired = true
        addressRequired = true
      }
      let country_id_con = dbReader.Sequelize.Op.ne, country_id_data = null, countryRequired = false
      if (country && country.length) {
        country_id_con = dbReader.Sequelize.Op.in
        country_id_data = country
        countryRequired = true
        addressRequired = true
      }
      // let client = req.app.get('redisClientNew')
      // let data: any = []
      // const listGeoData = await client.get("listGeoData");
      // if (listGeoData) {
      //   data = JSON.parse(listGeoData)
      // } else {
      let data = await dbReader.geoData.findAll({
        where: { is_deleted: 0, geo_config_id: { [geo_config_id_con]: geo_config_id_data } },
        attributes: ['geo_id', 'first_name', 'last_name', 'latitude', 'user_id', 'user_subscription_id', 'longitude', 'email_address', 'address', 'geo_config_id', [dbReader.sequelize.literal('is_active'), "is_active"], [dbReader.sequelize.literal('geo_pin_title'), "geo_pin_title"],
          [dbReader.sequelize.literal('geo_pin_color'), "pin_color"]],
        include: [{
          model: dbReader.userSubscription,
          attributes: [],
          where: { subscription_status: [2, 4, 10] }
        }, {
          required: addressRequired,
          model: dbReader.userAddress,
          attributes: [],
          include: [{
            model: dbReader.stateModel,
            attributes: [],
            required: stateRequired,
            where: { state_id: { [state_id_con]: state_id_data } }
          }, {
            model: dbReader.countryModel,
            attributes: [],
            required: countryRequired,
            where: { country_id: { [country_id_con]: country_id_data } }
          }]
        }, {
          model: dbReader.geoConfig,
          attributes: [],
          where: { is_active: 1 }
        }],
        limit: 10000
      });
      data = JSON.parse(JSON.stringify(data));
      let sitedata = await dbReader.geoConfig.findAll({
        where: { is_active: 1 },
        attributes: [
          ['geo_pin_title', "site_title"],
          ['geo_pin_color', "pin_color"]
        ],
        include: [{
          separate: true,
          model: dbReader.geoData,
          attributes: ['geo_id'],
          where: { is_deleted: 0 },
          include: [{
            model: dbReader.userSubscription,
            attributes: [],
            where: { subscription_status: [2, 4, 10] }
          }]
        }]
      })
      sitedata = JSON.parse(JSON.stringify(sitedata));
      sitedata.forEach((element:any) => {
        element.total_count = element.geo_data.length
        delete element.geo_data
      });
      // let sitedata = await dbReader.geoData.findAll({
      //   where: { is_deleted: 0 },
      //   attributes: [[dbReader.Sequelize.fn('COUNT', dbReader.Sequelize.literal('`geo_data`.`geo_config_id`')), 'total_count'], [
      //     dbReader.Sequelize.literal("geo_config.geo_pin_title"),
      //     "site_title",
      //   ], [dbReader.sequelize.literal('geo_pin_color'), "pin_color"]],
      //   include: [{
      //     model: dbReader.userSubscription,
      //     attributes: [],
      //     where: { subscription_status: [2, 4, 10] }
      //   }, {
      //     model: dbReader.geoConfig,
      //     attributes: [],
      //     where: { is_active: 1 }
      //   }],
      //   group: ['geo_data.geo_config_id']
      // });
      // sitedata = JSON.parse(JSON.stringify(sitedata));
      let arr = {
        data, sitedata
      }
      new SuccessResponse(EC.success, {
        //@ts-ignore
        token: req.token,
        data: arr,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async listingSiteSub(req: Request, res: Response) {
    try {
      let data = await dbReader.userSubscription.findAll({
        // attributes: ["user_subscription_id", "subscription_number", "user_id", "site_id"],
        where: { subscription_status: [2, 4] },
        include: [{
          separate: true,
          model: dbReader.userOrder,
          // attributes: ["user_subscription_id", "user_orders_id"],
          order: [['user_orders_id', 'DESC']],
          group: ['user_subscription_id'],
          // limit: 1,
          include: [{
            separate: true,
            model: dbReader.userOrderItems,
            where: { item_type: 1 }
          }, {
            required: true,
            as: 'billingAddress',
            model: dbReader.userAddress,
            include: [{
              model: dbReader.stateModel
            }, {
              model: dbReader.countryModel
            }]
            // attributes: ['first_name', 'last_name', 'email_address', 'phone_number', 'latitude', 'longitude']
          }]
        }],
        // limit:500
      });

      data = JSON.parse(JSON.stringify(data));
      console.log(data.length, "length of data");

      let geoData = await dbReader.geoConfig.findAll({
        where: { is_active: 1 },
      });
      geoData = JSON.parse(JSON.stringify(geoData))
      var arr: any = []

      data.forEach((e: any) => {
        // if(e.user_orders.length){
        e.user_orders.forEach((ele: any) => {
          if (ele.user_order_items.length) {
            ele.user_order_items.forEach((e1: any) => {
              let config_id = 0
              if (e1.product_name.includes("Kids")) {
                e1.product_name = "Grow Kids",
                  config_id = 1
              }
              if (e1.product_name.includes("Student") || e1.product_name.includes("Grow Your Ministry")) {
                e1.product_name = "Grow Students",
                  config_id = 2
              }
              if (e1.product_name.includes("Groups")) {
                e1.product_name = "Grow Groups",
                  config_id = 3
              }
              if (e1.product_name.includes("Slidr")) {
                e1.product_name = "Grow Slidr",
                  config_id = 5
              }
              if (e1.product_name.includes("Builder")) {
                e1.product_name = "Grow Builder",
                  config_id = 7
              }
              if (e1.product_name.includes("Hub")) {
                e1.product_name = "Grow Hubs",
                  config_id = 4
              }
              // console.log(ele.billingAddress);

              arr.push({
                email_address: ele.billingAddress ? ele.billingAddress.email_address : "",
                user_id: e.user_id,
                user_orders_id: e1.user_orders_id,
                user_order_item_id: e1.user_order_item_id,
                user_subscription_id: e.user_subscription_id,
                first_name: ele.billingAddress ? ele.billingAddress.first_name : "",
                last_name: ele.billingAddress ? ele.billingAddress.last_name : "",
                address: ele.billingAddress ? ele.billingAddress.address_line1 + " " + ele.billingAddress.address_line2 + "," + ele.billingAddress.city + "," + (ele.billingAddress.stateModel ? ele.billingAddress.stateModel.name || '' : '') + "," + (ele.billingAddress.countryModel ? ele.billingAddress.countryModel.name || '' : "") : "",
                user_address_id: ele.billingAddress ? ele.billingAddress.user_address_id || 0 : 0,
                product_id: e1.product_id,
                zipcode: ele.billingAddress ? ele.billingAddress.zipcode : "",
                latitude: ele.billingAddress.latitude || 0,
                longitude: ele.billingAddress.longitude || 0,
                geo_config_id: config_id,
              })
              // arr.push({
              //   "user_subscription_id": e.user_subscription_id,
              //   "user_id": e.user_id,
              //   "site_id": e.site_id,
              //   "user_orders_id": e1.user_orders_id,
              //   "product_name": e1.product_name,
              //   // "color_code": "",
              //   "color_code":geoData.some((e: any) => e.geo_pin_title == e1.product_name) ? geoData.find((e: any) => e.geo_pin_title == e1.product_name).geo_pin_color : "",
              //   "first_name": ele.billingAddress ? ele.billingAddress.first_name : "",
              //   "last_name": ele.billingAddress ? ele.billingAddress.last_name : "",
              //   "email_address": ele.billingAddress ? ele.billingAddress.email_address : "",
              //   "phone_number": ele.billingAddress ? ele.billingAddress.phone_number : "",
              //   "latitude": ele.billingAddress ? ele.billingAddress.latitude : 0,
              //   "longitude": ele.billingAddress ? ele.billingAddress.longitude : 0
              // });
            });
          }
        });
      });
      await dbWriter.geoData.bulkCreate(arr)
      new SuccessResponse(EC.success, {
        //@ts-ignore
        token: req.token,
        data: arr,
      }).send(res);

    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }




}
