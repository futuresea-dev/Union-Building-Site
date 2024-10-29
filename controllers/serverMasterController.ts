import { Request, Response } from "express";
import moment from "moment";
import { ErrorController, SuccessResponse, BadRequestError, ApiError } from '../core/index';
const { dbReader, dbWriter } = require('../models/dbConfig');
const EC = new ErrorController();

export class ServerMasterController {

    public addServerControls = async (req: Request, res: Response) => {
        //Check if username and password are set
        let { server_type, credential_setup, format } = req.body
        try {
            credential_setup = JSON.stringify([credential_setup]);
            format = JSON.stringify(format);
            let result = await dbWriter.emailServices.create({ server_type, credential_setup, format });
            return new SuccessResponse(EC.errorMessage(EC.saveDataSuccess, ["server controls"]), {
                //@ts-ignore
                token: req.token,
                ...result
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }


    public addUpdateServiceCredentials = async (req: Request, res: Response) => {
        //Check if username and password are set
        let { site_email_service_id, email_service_id, service_type, service_type_credentials, is_default, site_id, updated_datetime } = req.body
        try {
            if (site_email_service_id == 0) {
                service_type_credentials = JSON.stringify(service_type_credentials);
                let result = await dbWriter.siteEmailServices.create({ email_service_id, service_type, service_type_credentials, is_default, site_id, updated_datetime });
                return new SuccessResponse(EC.errorMessage(EC.saveDataSuccess, ["service credentials"]), result).send(res);
            }
            else {
                service_type_credentials = JSON.stringify(service_type_credentials);
                await dbWriter.siteEmailServices.update({
                    email_service_id: req.body.email_service_id,
                    service_type: req.body.service_type,
                    service_type_credentials: service_type_credentials,
                    is_default: req.body.is_default,
                    site_id: req.body.site_id,
                    updated_datetime: moment().unix(),
                }, {
                    where: { site_email_service_id: req.body.site_email_service_id }
                });
                req.body.service_type_credentials = service_type_credentials;
                return new SuccessResponse(EC.Updated, req.body).send(res);
            }

        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public updateServiceCredentials = async (req: Request, res: Response) => {
        //Check if username and password are set
        var result;
        let json_service_type_credentials = JSON.stringify([req.body.service_type_credentials]);
        try {
            if (req.body.site_email_service_id) {
                result = await dbWriter.siteEmailServices.update({
                    email_service_id: req.body.email_service_id,
                    service_type: req.body.service_type,
                    service_type_credentials: json_service_type_credentials,
                    is_default: req.body.is_default,
                    site_id: req.body.site_id,
                    updated_datetime: moment().unix(),
                }, {
                    where: { site_email_service_id: req.body.site_email_service_id }
                });
                return new SuccessResponse(EC.Updated, req.body).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public getServiceCredentials = async (req: Request, res: Response) => {
        //Check if username and password are set
        let { site_email_service_id } = req.body
        try {
            let result = await dbReader.siteEmailServices.findOne({
                where: {
                    site_email_service_id: site_email_service_id,
                    is_deleted: 0
                }
            });

            if (result.length <= 0) {
                return new SuccessResponse(EC.noDataFound, result).send(res);
            }
            // let credentials = JSON.parse(result.service_type_credentials);
            // result.credential_setup = credentials;
            return new SuccessResponse(EC.DataFetched, {
                //@ts-ignore
                token: req.token,
                ...result
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public listServiceCredentials = async (req: Request, res: Response) => {
        try {
            let site_id = req.params.id;
            let result = await dbReader.siteEmailServices.findOne({
                attributes: ['site_email_service_id', 'email_service_id', 'service_type', 'service_type_credentials', 'is_default', 'site_id', 'updated_datetime', [dbReader.Sequelize.literal('`sycu_site`.`title`'), 'site_title']],
                where: dbReader.Sequelize.and(
                    { is_deleted: 0 },
                    { site_id: site_id }
                ),
                include: [{
                    model: dbReader.sites,
                    attributes: []
                }]
            });
            return new SuccessResponse(EC.DataFetched, {
                //@ts-ignore
                token: req.token,
                rows: result
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }


    public getServerCredentials = async (req: Request, res: Response) => {
        //Check if username and password are set        
        try {
            let result = await dbReader.emailServices.findAll();
            result = JSON.parse(JSON.stringify(result));
            result.forEach((element: any) => {
                let credentials = (element.credential_setup) ? JSON.parse(element.credential_setup) : [];
                let format = (element.format) ? JSON.parse(element.format) : null;
                element.credential_setup = credentials;
                element.format = format;
            });
            return new SuccessResponse("Data fetched successfully.", {
                //@ts-ignore
                token: req.token,
                result
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public deleteEmailSiteServiceCredentials = async (req: Request, res: Response) => {
        //Check if username and password are set
        let site_email_service_id = req.params.site_email_service_id
        try {
            await dbWriter.siteEmailServices.update({ is_deleted: 1 }, {
                where: {
                    site_email_service_id: site_email_service_id
                }
            });
            return new SuccessResponse(EC.errorMessage(EC.deleteDataSuccess, ["Service credentials"]), {
                //@ts-ignore
                token: req.token
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public saveSmsServicesCredentials = async (req: Request, res: Response) => {
        try {
            let reqBody = req.body, siteSmsServices: any;
            let service_type_credentials = JSON.stringify(reqBody.service_type_credentials);

            if (!reqBody.site_sms_service_id) {
                siteSmsServices = await dbWriter.siteSmsServices.create({
                    sms_service_id: reqBody.sms_service_id,
                    service_type: reqBody.service_type,
                    service_type_credentials: service_type_credentials,
                    is_default: reqBody.is_default,
                    site_id: reqBody.site_id,
                });
            } else {
                siteSmsServices = await dbWriter.siteSmsServices.update({
                    sms_service_id: reqBody.sms_service_id,
                    service_type: reqBody.service_type,
                    service_type_credentials: service_type_credentials,
                    is_default: reqBody.is_default,
                    site_id: reqBody.site_id,
                }, {
                    where: { site_sms_service_id: reqBody.site_sms_service_id }
                });
            }

            return new SuccessResponse(EC.errorMessage(EC.saveDataSuccess), {
                //@ts-ignore
                token: req.token,
                data: siteSmsServices
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public getSmsServicesCredentials = async (req: Request, res: Response) => {
        try {
            let site_id = req.params.id;
            let siteSmsServices = await dbReader.siteSmsServices.findOne({
                attributes: ['site_sms_service_id', 'sms_service_id', 'service_type', 'service_type_credentials', 'is_default', [dbReader.Sequelize.literal('`sycu_site`.`title`'), 'site_title']],
                where: { is_deleted: 0, site_id: site_id },
                include: [{
                    model: dbReader.sites,
                    attributes: []
                }]
            });
            if (siteSmsServices) {
                siteSmsServices = JSON.parse(JSON.stringify(siteSmsServices));
                siteSmsServices.service_type_credentials = JSON.parse(siteSmsServices.service_type_credentials);
            }
            return new SuccessResponse(EC.DataFetched, {
                //@ts-ignore
                token: req.token,
                data: siteSmsServices
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public getSmsServicesMasterData = async (req: Request, res: Response) => {
        try {
            let smsServices = await dbReader.smsServices.findAll();
            smsServices = JSON.parse(JSON.stringify(smsServices));
            smsServices.forEach((element: any) => {
                element.credential_setup = JSON.parse(element.credential_setup);
                element.format = JSON.parse(element.format);
            });
            return new SuccessResponse(EC.DataFetched, {
                //@ts-ignore
                token: req.token,
                data: smsServices
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
}
