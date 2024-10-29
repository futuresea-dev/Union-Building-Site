import { Request, Response } from "express";
import { ErrorController, SuccessResponse, BadRequestError, ApiError } from '../core/index';
const { dbReader, dbWriter } = require('../models/dbConfig');
const EC = new ErrorController();

export class SitePaymentGatewayController {
    /*
    * Code done by Sheetal 24-11-2021
    * For getting sites and payment services detail from database
    * perform crud operations for sycu_sites_payment_gateway
    */

    // List out sites detail
    public async getSites(req: Request, res: Response) {
        try {
            const sitesData = await dbReader.sites.findAll({});
            new SuccessResponse(EC.listOfData, {
                Sites: sitesData,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    // List out payment services detail
    public async getPaymentServices(req: Request, res: Response) {
        try {
            const paymentServicesData = await dbReader.sitePaymentServices.findAll({});
            new SuccessResponse(EC.listOfData, {
                Payment_services: paymentServicesData,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    // Add/update site payment gateway into database
    public async addSitePaymentGateway(req: Request, res: Response) {
        try {
            const addedGateway = await dbWriter.sitePaymentServices.create({
                site_id: req.body.site_id,
                payment_service_id: req.body.payment_service_id,
                auth_json: JSON.stringify(req.body.auth_json),
                is_deleted: 0,
                created_datetime: new Date(),
                updated_datetime: null
            })
            new SuccessResponse(EC.success, {
                site_payment_gateway: addedGateway
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    // Update site payment gateway into database
    public async updateSitePaymentGateway(req: Request, res: Response) {
        try {
            let sitePaymentGatewayId = req.body.site_payment_service_id;
            delete req.body.site_payment_service_id;
            if (req.body.auth_json != "" && req.body.auth_json != 'undefined' && req.body.auth_json != null) {
                req.body.auth_json = JSON.stringify(req.body.auth_json);
            }
            dbWriter.sitePaymentServices.update(
                req.body,
                { where: { site_payment_service_id: sitePaymentGatewayId } }
            );
            new SuccessResponse(EC.success, '').send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    //List site payment gateway from database
    public async getSitePaymentGateway(req: Request, res: Response) {
        try {
            const sitePaymentGatewayData = await dbReader.sitePaymentServices.findAll({
                attributes: {
                    include: [
                        [dbReader.Sequelize.literal('(select title from sycu_sites where  sycu_sites.site_id = sycu_site_payment_services.site_id)'), 'site_title'],
                        [dbReader.Sequelize.literal('(select service_name from sycu_payment_services where  sycu_payment_services.payment_service_id = sycu_site_payment_services.payment_service_id)'), 'Payment_service_name']
                    ]
                },
                where: { is_deleted: 0 }
            });
            new SuccessResponse(EC.listOfData, {
                site_payment_gateway: sitePaymentGatewayData,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    //Delete site payment gateway from database
    public async deleteSitePaymentGateway(req: Request, res: Response) {
        try {
            var reqBody = req.body;
            if (reqBody.site_payment_service_id) {
                dbWriter.sitePaymentServices.update({
                    is_deleted: 1,
                    updated_date: new Date(),
                }, {
                    where: { site_payment_service_id: reqBody.site_payment_service_id }
                });
                new SuccessResponse(EC.deleteDataSuccess, '').send(res);
            } else {
                throw new Error(EC.requiredFieldError);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
}
