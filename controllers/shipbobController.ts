import { Request, Response } from "express";
import { required } from "joi";
import { ErrorController, SuccessResponse, BadRequestError, ApiError } from '../core/index';
const axios = require('axios');

import { NodeMailerController } from "./thirdParty/nodeMailerController";
const jwt = require('jsonwebtoken');
import { enumerationController } from '../controllers/enumerationController';
const { v4: uuidv4 } = require("uuid");
const { dbReader, dbWriter } = require('../models/dbConfig');
import AWS from 'aws-sdk';
const { Op } = dbReader.Sequelize;
const EC = new ErrorController();

var EnumObject = new enumerationController();
var ObjectMail = new NodeMailerController();
import fs from 'fs';
const s3 = new AWS.S3({
    accessKeyId: process.env.AWSACCESSKEYID,
    secretAccessKey: process.env.AWSSECRETACCESSKEY,
});

export class ShipbobController {

    private getChannel = async (req: Request, res: Response) => {

        try {
            let getData = await axios(`${process.env.shipboburl}channel`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${process.env.shipbob}`
                }

            }).then(async (result: any) => {
                if (result.status == 200) {
                    return result.data;
                }
            });
            return getData;
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public mapShipbobChannelToSycu = async (req: Request, res: Response) => {

        try {
            let sb = new ShipbobController;
            let shipbobMethods = await sb.getChannel(req, res);

            console.log(shipbobMethods);
            let insertArray = [];
            for (var i = 0; i < shipbobMethods.length; i++) {
                var temp = shipbobMethods[i];
                insertArray.push({
                    shipbob_channel_id: temp.id,
                    shipbob_channel_name: temp.name,
                    application_name: temp.application_name,
                })
            }

            await dbWriter.shipbobChannelModel.bulkCreate(insertArray);

            return new SuccessResponse(EC.errorMessage(EC.saveDataSuccess, ["server controls"]), {
                //@ts-ignore
                token: req.token
            }).send(res);

        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    private getMultipleProducts = async (req: Request, res: Response) => {

        try {
            let getData = await axios(`${process.env.shipboburl}product`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${process.env.shipbob}`
                }

            }).then(async (result: any) => {
                if (result.status == 200) {
                    return result.data;
                }
            });

            return getData;
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    private getShipmentMethod = async (req: Request, res: Response) => {

        try {
            let getData = await axios(`${process.env.shipboburl}shippingmethod`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${process.env.shipbob}`
                }

            }).then(async (result: any) => {
                if (result.status == 200) {
                    return result.data;
                }
            });
            return getData;
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public createOrder = async (createShipbobOrder: any) => {
        let request = createShipbobOrder;
        let shipbobObject = new ShipbobController();
        try {
            await axios(`${process.env.shipboburl}order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${process.env.shipbob}`,
                    "shipbob_channel_id": createShipbobOrder.shipbob_channel_id
                },
                data: createShipbobOrder
            }).then(async (result: any) => {
                if (result.status == 201) {
                    let insertInToShipbob = await dbWriter.thirdPartyLog.create({
                        thirdparty_id: 7,
                        request: request,
                        response: result.data,
                        activity_type: 1,
                        status: 200,
                        user_id: createShipbobOrder.user_id,
                        email: createShipbobOrder.recipient.email
                    });
                    insertInToShipbob = JSON.parse(JSON.stringify(insertInToShipbob));
                    let shipbobOrderObject: any;
                    shipbobOrderObject = result.data;
                    shipbobOrderObject.thirdparty_log_id = insertInToShipbob.thirdparty_log_id
                    shipbobOrderObject.id = createShipbobOrder.shipbob_table_id
                    createShipbobOrder.is_extra_pay = false
                    shipbobObject.addUpdateShipbobOrder(shipbobOrderObject, 1, 1);
                    return result.data;
                } else {
                    let insertInToShipbob = await dbWriter.thirdPartyLog.create({
                        thirdparty_id: 7,
                        request: request,
                        response: result,
                        activity_type: 1,
                        status: result.status,
                        user_id: createShipbobOrder.user_id,
                        email: createShipbobOrder.recipient.email
                    });
                    insertInToShipbob = JSON.parse(JSON.stringify(insertInToShipbob));
                    let shipbobOrderObject: any = {};
                    shipbobOrderObject.thirdparty_log_id = insertInToShipbob.thirdparty_log_id
                    createShipbobOrder.is_extra_pay = false
                    shipbobObject.addUpdateShipbobOrder(shipbobOrderObject, 2, 1);
                    return result
                }
            })
        } catch (e: any) {
            let response = JSON.stringify(e);
            let error = e.response.data;
            let insertInToShipbob = await dbWriter.thirdPartyLog.create({
                thirdparty_id: 7,
                request: request,
                response: error,
                activity_type: 1,
                status: 403,
                user_id: createShipbobOrder.user_id,
                email: createShipbobOrder.recipient.email
            });
            insertInToShipbob = JSON.parse(JSON.stringify(insertInToShipbob));
            let shipbobOrderObject: any = {};
            shipbobOrderObject.thirdparty_log_id = insertInToShipbob.thirdparty_log_id
            createShipbobOrder.is_extra_pay = false
            shipbobObject.addUpdateShipbobOrder(shipbobOrderObject, 2, 1);
            //  ApiError.handle(new BadRequestError(e.message), res);
            return e;
        }
    }

    public mapShipbobMethodToSycu = async (req: Request, res: Response) => {

        try {
            let sb = new ShipbobController;
            let shipbobMethods = await sb.getShipmentMethod(req, res);

            console.log(shipbobMethods);
            let insertArray = [];
            for (var i = 0; i < shipbobMethods.length; i++) {
                var temp = shipbobMethods[i];
                insertArray.push({
                    title: temp.name,
                    is_active: temp.active,
                    is_default: temp.default,
                    service_level: temp.service_level.toString()
                })
            }

            await dbWriter.shipbobMethodsModel.bulkCreate(insertArray);

            return new SuccessResponse(EC.errorMessage(EC.saveDataSuccess, ["server controls"]), {
                //@ts-ignore
                token: req.token
            }).send(res);

        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public updateShipmentMethod = async (req: Request, res: Response) => {

        try {

            let updateShippableProducts = await dbWriter.shipbobMethodsModel.update({
                is_default: 0
            }, {
                where: {
                    id: {
                        [Op.ne]: null,
                    }
                }
            });

            let getShippableProducts = await dbWriter.shipbobMethodsModel.update({
                is_default: req.body.is_default
            },
                {
                    where: {
                        id: req.body.id
                    }
                });
            return new SuccessResponse(EC.success, {
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public listShipmentMethod = async (req: Request, res: Response) => {

        try {
            let getAllShipmentMethod = await dbReader.shipbobMethodsModel.findAndCountAll({
                where: {
                    is_deleted: 0
                }
            });
            if (getAllShipmentMethod.count > 0) {
                return new SuccessResponse(EC.success, {

                    count: getAllShipmentMethod.count,
                    rows: getAllShipmentMethod.rows
                }).send(res);
            }
            else {
                return new SuccessResponse(EC.noDataFound, {

                }).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public mapShipbobProductsToSycu = async (req: Request, res: Response) => {

        try {
            let sb = new ShipbobController;
            let shipbobMethods = await sb.getMultipleProducts(req, res);

            console.log(shipbobMethods);
            let insertArray = [];
            for (var i = 0; i < shipbobMethods.length; i++) {
                var temp = shipbobMethods[i];
                var channel = temp.channel
                insertArray.push({
                    shipbob_product_id: temp.id,
                    reference_id: temp.reference_id,
                    title: temp.name,
                    shipbob_channel_id: channel.id,
                    created_date: temp.created_date
                })
            }

            await dbWriter.shipbobProductModel.bulkCreate(insertArray);

            return new SuccessResponse(EC.errorMessage(EC.saveDataSuccess, ["server controls"]), {
                //@ts-ignore
                token: req.token
            }).send(res);

        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public listShipbobProducts = async (req: Request, res: Response) => {
        try {
            let getAllShipbobproducts = await dbReader.shipbobProductModel.findAndCountAll({
                where: {
                    is_deleted: 0,
                    is_active: 1
                },
                order: [['sortable_order', 'ASC']]
            });
            if (getAllShipbobproducts.count > 0) {
                return new SuccessResponse(EC.success, {
                    count: getAllShipbobproducts.count,
                    rows: getAllShipbobproducts.rows
                }).send(res);
            }
            else {
                return new SuccessResponse(EC.noDataFound, {
                }).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public listSycuShippableProducts = async (req: Request, res: Response) => {

        try {
            let getAllShippableProducts = await dbReader.products.findAndCountAll({
                attributes: ['product_id', 'product_name'],
                where: {
                    is_shippable: 1,
                    is_deleted: 0
                }
            });
            if (getAllShippableProducts.count > 0) {
                return new SuccessResponse(EC.success, {
                    count: getAllShippableProducts.count,
                    rows: getAllShippableProducts.rows
                }).send(res);
            }
            else {
                return new SuccessResponse(EC.noDataFound, {

                }).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public saveSycuMapProducts = async (req: Request, res: Response) => {

        try {
            let { product_list } = req.body;

            for (var i = 0; i < product_list.length; i++) {

                let getShippableProducts = await dbReader.shipbobSycuProductModel.findOne({
                    where: {
                        sycu_product_id: product_list[i].sycu_product_id
                    }
                });
                if (getShippableProducts) {
                    getShippableProducts = JSON.parse(JSON.stringify(getShippableProducts));

                    let updateShippableProducts = await dbWriter.shipbobSycuProductModel.update({
                        shipbob_product_id: product_list[i].shipbob_product_id,
                        shipbob_product_name: product_list[i].shipbob_product_name
                    }, {
                        where: {
                            id: getShippableProducts.id
                        }
                    }
                    );
                }
                else {
                    let createShippableProducts = await dbWriter.shipbobSycuProductModel.bulkCreate(product_list);
                }
            }

            let getShippableProducts = await dbReader.shipbobSycuProductModel.findAndCountAll({
                where: {
                    is_deleted: 0
                }
            });

            if (getShippableProducts.count > 0) {
                return new SuccessResponse(EC.success, {
                    count: getShippableProducts.count,
                    rows: getShippableProducts.rows
                }).send(res);
            }
            else {
                return new SuccessResponse(EC.noDataFound, {

                }).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public listSycuMapProducts = async (req: Request, res: Response) => {

        try {

            let getShippableProducts = await dbReader.shipbobSycuProductModel.findAndCountAll({
                where: {
                    is_deleted: 0
                }
            });

            if (getShippableProducts.count > 0) {
                return new SuccessResponse(EC.success, {
                    count: getShippableProducts.count,
                    rows: getShippableProducts.rows
                }).send(res);
            }
            else {
                return new SuccessResponse(EC.noDataFound, {

                }).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public listShipbobChannels = async (req: Request, res: Response) => {

        try {

            let getShipbobChannels = await dbReader.shipbobChannelModel.findAndCountAll({});

            if (getShipbobChannels.count > 0) {
                return new SuccessResponse(EC.success, {
                    count: getShipbobChannels.count,
                    rows: getShipbobChannels.rows
                }).send(res);
            }
            else {
                return new SuccessResponse(EC.noDataFound, {

                }).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public updateShipmentChannel = async (req: Request, res: Response) => {

        try {

            let updateShippableProducts = await dbWriter.shipbobChannelModel.update({
                is_selected: 0
            }, {
                where: {
                    id: {
                        [Op.ne]: null,
                    }
                }
            });

            let getShippableProducts = await dbWriter.shipbobChannelModel.update({
                is_selected: req.body.is_selected
            },
                {
                    where: {
                        id: req.body.id
                    }
                });
            return new SuccessResponse(EC.success, {
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public getShipmentTimeline = async (req: Request, res: Response) => {
        try {
            let { order_id, shipment_id } = req.body;

            let shipbobOrder = await dbReader.shipbobOrders.findOne({
                where: {
                    shipbob_shipment_id: shipment_id
                }
            });
            shipbobOrder = JSON.parse(JSON.stringify(shipbobOrder));

            let subscriptionNumberArray: any = [];
            subscriptionNumberArray.push(shipbobOrder.subscription_number);
            let getUserSubscriptionId: any;
            if (subscriptionNumberArray[0] != 0) {
                let shipbobController = new ShipbobController();
                getUserSubscriptionId = await shipbobController.getUserAddressByShipmentId(subscriptionNumberArray);
            }
            else {
                getUserSubscriptionId = [];
            }

            await axios(`${process.env.shipboburl}/shipment/` + shipment_id + `/logs`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${process.env.shipbob}`
                }
            }).then(async (result: any) => {
                if (result.status == 200) {
                    //sorting array of object
                    let checkCancel = result.data.filter((e: any) => e.log_type_id == 15);
                    let checkHold = result.data.filter((e: any) => e.log_type_id == 67);
                    await axios(`${process.env.shipboburl}order/` + order_id + `/shipment/` + shipment_id + `/timeline`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            "Authorization": `Bearer ${process.env.shipbob}`
                        }
                    }).then(async (result: any) => {
                        if (result.status == 200) {
                            //sorting array of object
                            let sortedArray: any = {}
                            sortedArray.order_id = order_id;
                            sortedArray.shipment_id = shipment_id;
                            sortedArray.delivery_address = (getUserSubscriptionId.length > 0) ? getUserSubscriptionId[0].delivery_address[0] : {};
                            sortedArray.time_line = result.data.sort((a: any, b: any) => (a.log_type_id > b.log_type_id) ? 1 : -1);
                            sortedArray.is_cancel = false;
                            sortedArray.is_hold = false;
                            let shipment_details = {};
                            if (checkCancel.length > 0) {
                                sortedArray.is_cancel = true
                            }
                            else if (checkHold.length) {
                                sortedArray.is_hold = true
                            }
                            else {
                                let getFullShipmentDetails = await axios(`${process.env.shipboburl}order/` + order_id + `/shipment/`, {
                                    method: 'GET',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        "Authorization": `Bearer ${process.env.shipbob}`
                                    }
                                }).then(async (result: any) => {
                                    if (result.status == 200) {
                                        //sorting array of object
                                        shipment_details = result.data[0];
                                        return true;
                                    }
                                    else {
                                        return false;
                                    }
                                });
                            }
                            sortedArray.shipment_details = shipment_details;
                            new SuccessResponse(EC.success, {
                                //@ts-ignore
                                token: req.token,
                                ...sortedArray
                            }).send(res);
                        }
                        else {
                            new SuccessResponse(EC.noDataFound, {
                                //@ts-ignore
                                token: req.token,
                                count: 0,
                                rows: []
                            }).send(res);
                        }
                    });
                }
                else {
                    new SuccessResponse(EC.noDataFound, {
                        //@ts-ignore
                        token: req.token,
                        count: 0,
                        rows: []
                    }).send(res);
                }
            });
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public createManualShipBobOrder = async (req: Request, res: Response) => {
        try {
            let { subscription_id, shipbob_product_id, is_shipping_confirmation_required, user_id } = req.body;
            let is_from = (is_shipping_confirmation_required == 0) ? 3 : 5;
            let getUsertAddressDetails: any;
            if (subscription_id) {
                getUsertAddressDetails = await dbReader.userSubscription.findAll({
                    include: [{
                        model: dbReader.userAddress,
                        as: 'shippingAddress',
                        attributes: ['user_address_id', 'email_address', 'phone_number', 'user_id', 'user_orders_id', 'user_subscription_id', 'address_type', 'is_shipping_same', 'first_name', 'last_name', 'address_line2', 'address_line1', 'city', 'state_id', 'country_id', [dbReader.Sequelize.literal('`shippingAddress->stateModel`.`name`'), 'state_name'],
                            [dbReader.Sequelize.literal('`shippingAddress->countryModel`.`name`'), 'country_name'], 'zipcode',
                        ],
                        where: { email_address: { [dbReader.Sequelize.Op.ne]: '' } },
                        include: [{
                            model: dbReader.stateModel,
                            attributes: []
                        }, {
                            model: dbReader.countryModel,
                            attributes: []
                        }]
                    }],
                    where: { user_subscription_id: subscription_id }
                });
            } else {
                getUsertAddressDetails = await dbReader.users.findAll({
                    include: [{
                        model: dbReader.userAddress,
                        as: 'shippingAddressOne',
                        attributes: ['user_address_id', 'email_address', 'phone_number', 'user_id', 'user_orders_id', 'user_subscription_id', 'address_type', 'is_shipping_same', 'first_name', 'last_name', 'address_line2', 'address_line1', 'city', 'state_id', 'country_id', [dbReader.Sequelize.literal('`shippingAddressOne->stateModel`.`name`'), 'state_name'],
                            [dbReader.Sequelize.literal('`shippingAddressOne->countryModel`.`name`'), 'country_name'], 'zipcode',
                        ],
                        where: { email_address: { [dbReader.Sequelize.Op.ne]: '' } },
                        include: [{
                            model: dbReader.stateModel,
                            attributes: []
                        }, {
                            model: dbReader.countryModel,
                            attributes: []
                        }]
                    }],
                    where: { user_id: user_id }
                });
            }

            if (getUsertAddressDetails.length > 0) {
                getUsertAddressDetails = JSON.parse(JSON.stringify(getUsertAddressDetails));
                let createShipbobOrder: any;
                let response = await dbReader.thirdParty.findOne({
                    attributes: ['is_active'],
                    where: { thirdparty_id: 7 }
                });

                if (response.is_active == 1) {
                    let recipient: any = {};
                    let addressindex = subscription_id ?
                        getUsertAddressDetails.findIndex((s: any) => s.shippingAddress.address_type == 2) :
                        getUsertAddressDetails.findIndex((s: any) => s.shippingAddressOne.address_type == 2);
                    if (addressindex >= 0) {
                        let getAddressType = subscription_id ?
                            getUsertAddressDetails[addressindex].shippingAddress :
                            getUsertAddressDetails[addressindex].shippingAddressOne;
                        recipient = {
                            name: (getAddressType.first_name) ? getAddressType.first_name : getAddressType.email_address,
                            email: (getAddressType.email_address) ? getAddressType.email_address : "",
                            phone_number: (getAddressType.phone_number) ? getAddressType.phone_number : "",
                            address: {
                                address1: (getAddressType.address_line1) ? getAddressType.address_line1 : "",
                                address2: (getAddressType.address_line2) ? getAddressType.address_line2 : "",
                                company_name: "",
                                city: (getAddressType.city) ? getAddressType.city : "",
                                state: getAddressType.state_name || '',
                                country: getAddressType.country_name || '',
                                zip_code: (getAddressType.zipcode) ? getAddressType.zipcode : ""
                            }
                        }
                    } else {
                        let getAddressType = subscription_id ?
                            getUsertAddressDetails.filter((s: any) => s.shippingAddress.address_type == 1).map((h: any) => h.shippingAddress) :
                            getUsertAddressDetails.filter((s: any) => s.shippingAddressOne.address_type == 1).map((h: any) => h.shippingAddressOne);
                        if (getAddressType) {
                            recipient = {
                                name: (getAddressType[0].first_name) ? getAddressType[0].first_name : getAddressType[0].email_address,
                                email: (getAddressType[0].email_address) ? getAddressType[0].email_address : "",
                                phone_number: (getAddressType[0].phone_number) ? getAddressType[0].phone_number : "",
                                address: {
                                    address1: (getAddressType[0].address_line1) ? getAddressType[0].address_line1 : "",
                                    address2: (getAddressType[0].address_line2) ? getAddressType[0].address_line2 : "",
                                    company_name: "",
                                    city: (getAddressType[0].city) ? getAddressType[0].city : "",
                                    state: getAddressType[0].state_name || '',
                                    country: getAddressType[0].country_name || '',
                                    zip_code: (getAddressType[0].zipcode) ? getAddressType[0].zipcode : ""
                                }
                            };
                        } else {
                            recipient = {
                                name: "",
                                email: "",
                                phone_number: "",
                                address: {
                                    address1: "",
                                    address2: "",
                                    company_name: "",
                                    city: "",
                                    state: "",
                                    country: "",
                                    zip_code: "",
                                }
                            };
                        }
                    }

                    if (recipient) {
                        // getting shipbob_reference_id and 
                        let shipbobProductData = await dbReader.shipbobProductModel.findAll({
                            attributes: ['shipbob_product_id', 'reference_id', 'title'],
                            where: { shipbob_product_id: shipbob_product_id }
                        });

                        if (shipbobProductData) {
                            shipbobProductData = JSON.parse(JSON.stringify(shipbobProductData));
                            // getting order number to send in shipbob
                            let getSubscriptionOrder = await dbReader.userOrder.findOne({
                                attributes: ['user_order_number'],
                                where: { user_subscription_id: subscription_id }
                            });

                            let getShipbobChannels = await dbReader.shipbobChannelModel.findOne({
                                attributes: ['shipbob_channel_id'],
                                where: { is_selected: 1 }
                            });
                            let shipbob_channel_id = 0;
                            if (getShipbobChannels) {
                                getShipbobChannels = JSON.parse(JSON.stringify(getShipbobChannels));
                                shipbob_channel_id = getShipbobChannels.shipbob_channel_id
                            }
                            let getShipbobMethods = await dbReader.shipbobMethodsModel.findOne({
                                attributes: ['title'],
                                where: { is_default: 1 }
                            });

                            let shipping_method = "Shippment";
                            if (getShipbobMethods) {
                                getShipbobMethods = JSON.parse(JSON.stringify(getShipbobMethods));
                                shipping_method = getShipbobMethods.title;
                            }

                            let products: any = [];
                            shipbobProductData.map((ele: any) => {
                                products.push({
                                    reference_id: ele.reference_id.toString(),
                                    quantity: 1,
                                    quantity_unit_of_measure_code: "",
                                    external_line_id: 0,
                                    name: ele.title.toString(),
                                });
                            });

                            let order_number = "";
                            if (getSubscriptionOrder) {
                                getSubscriptionOrder = JSON.parse(JSON.stringify(getSubscriptionOrder));
                                order_number = getSubscriptionOrder.user_order_number;
                            }
                            createShipbobOrder = {
                                shipbob_channel_id: shipbob_channel_id,
                                user_id: getUsertAddressDetails[0].user_id,
                                user_subscription_id: subscription_id ? getUsertAddressDetails[0].user_subscription_id : 0,
                                user_order_id:  subscription_id ? getUsertAddressDetails[0].shippingAddress.user_orders_id : getUsertAddressDetails[0].shippingAddressOne.user_orders_id,
                                subscription_number: getUsertAddressDetails[0].subscription_number,
                                shipping_method: shipping_method,
                                recipient: recipient,
                                products: products,
                                order_number: order_number,
                                reference_id: uuidv4(),
                                is_extra_pay: true
                            }

                            let callMethod = new ShipbobController();
                            await callMethod.addUpdateShipbobOrder(createShipbobOrder, 0, 0, is_from);

                            if (is_shipping_confirmation_required == 1) {
                                return new SuccessResponse(EC.confirmationEmailHasSendSuccess, {}).send(res);
                            } else {
                                return new SuccessResponse(EC.shipbobDataTransferSuccess, {}).send(res);
                            }
                        } else {
                            return new SuccessResponse(EC.noDataFound, {}).send(res);
                        }
                    }
                    return new SuccessResponse(EC.noDataFound, {}).send(res);
                }
            } else {
                return new SuccessResponse("User Address Not Available", {}).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public getShipbobOrders = async (req: Request, res: Response) => {
        try {
            let { subscription_number, user_id } = req.body;
            let whereStatement: any = {};
            //Pagination
            var limit = req.body.page_record == undefined ? 10 : parseInt(req.body.page_record);
            var offset = req.body.page_no == undefined ? 1 : parseInt(req.body.page_no);

            // Automatic Offset and limit will set on the base of page number
            var row_limit = limit;
            var row_offset = offset * limit - limit;

            var sortField = "id",
                sortOrder = "DESC";
            if (req.body.sortField) {
                sortField = req.body.sortField;
            }
            if (req.body.sortOrder) {
                sortOrder = req.body.sortOrder;
            }

            let searchCondition = Op.ne, searchData = null
            if (req.body.search) {
                searchCondition = Op.like;
                searchData = req.body.search
                whereStatement.shipbob_products_name = {
                    [Op.like]: "%" + req.body.search + "%"
                }
            }
            if (subscription_number) {
                whereStatement.subscription_number = subscription_number
            }
            if (user_id) {
                whereStatement.user_id = user_id
            }
            /* whereStatement.order_number = {
                [Op.ne]: 0
            } */
            // Filtering
            var filter = dbReader.Sequelize.and();

            if (req.body.filter) {
                var data = req.body.filter[0];
                filter = dbReader.Sequelize.and(data);
            }

            let shipbobOrder = await dbReader.shipbobOrders.findAndCountAll({
                attributes: ['id', 'shipbob_order_id', 'shipbob_shipment_id', 'user_subscription_id', 'user_order_id', 'subscription_number', 'order_number', 'reference_id', 'user_id', 'shipbob_products_name',
                    'thirdparty_log_id', 'status', 'created_datetime', 'delivery_status', 'tracking_number', 'address_line1', 'address_line2', 'city', 'state_name', 'country_name', 'zipcode', 'shipbob_status',
                    'confirm_datetime', 'organization_name', 'token', 'is_from', [dbReader.Sequelize.literal(`email`), "email"], [dbReader.Sequelize.literal(`first_name`), "first_name"],
                    [dbReader.Sequelize.literal(`last_name`), "last_name"], [dbReader.Sequelize.literal(`username`), "username"]
                ],
                include: [{
                    model: dbReader.users,
                    attributes: []
                }],
                where: dbReader.Sequelize.and(
                    whereStatement,
                    dbReader.Sequelize.or(
                        { shipbob_products_name: { [searchCondition]: searchData } }
                    ),
                    filter
                ),
                offset: row_offset,
                order: [[sortField, sortOrder]],
                limit: row_limit,
            });

            if (shipbobOrder.count > 0) {
                new SuccessResponse(EC.success, {
                    //@ts-ignore
                    token: req.token,
                    count: shipbobOrder.count,
                    rows: shipbobOrder.rows
                }).send(res);
            }
            else {
                new SuccessResponse(EC.noDataFound, {
                    //@ts-ignore
                    token: req.token,
                    rows: []
                }).send(res);
            }
            new SuccessResponse(EC.success, {
                //@ts-ignore
            }).send(res);
        } catch (e: any) {
            return false
        }
    }

    public addUpdateShipbobOrder = async (responseObject: any, status: any = 0, task: any = 0, is_from: any = 0) => {

        try {
            // Task : 0- insert and 1- update
            let insertShipbobOrder: any = {};
            if (task == 0) {
                let demoData = responseObject;
                let getAllProducts: any = [];
                //getAllProducts =  demoData.products.map((e:any) => e.name)
                let getAllrefernce = demoData.products.map((e: any) => e.reference_id)

                // getting the list of delivered product to the user
                let checkProducts = await dbReader.shipbobOrders.findAll({
                    where: {
                        user_id: demoData.user_id,
                    }
                });


                if (checkProducts.length > 0 && demoData.is_extra_pay == false) {
                    checkProducts = JSON.parse(JSON.stringify(checkProducts));
                    checkProducts = checkProducts.map((s: any) => s.reference_id);
                    for (var i = 0; i < checkProducts.length; i++) {
                        let temp = checkProducts[i].toString();
                        let tempData = temp.split(',')
                        Array.prototype.push.apply(getAllProducts, tempData);
                    }
                    getAllProducts = getAllrefernce.filter((h: any) => !getAllProducts.includes(h));
                    if (getAllProducts.length > 0) {
                        getAllProducts = demoData.products.filter((s: any) => getAllProducts.includes(s.reference_id));
                        getAllProducts = getAllProducts.map((s: any) => s.name);
                    }
                }
                else {
                    getAllProducts = demoData.products.map((e: any) => e.name)
                }


                if (getAllProducts.length) {
                    var products_name = getAllProducts.toString();


                    insertShipbobOrder = {
                        shipbob_order_id: 0,
                        shipbob_shipment_id: 0,
                        user_subscription_id: demoData.user_subscription_id,
                        user_order_id: demoData.user_order_id,
                        subscription_number: demoData.subscription_number,
                        order_number: demoData.order_number,
                        reference_id: getAllrefernce.toString(),
                        user_id: demoData.user_id,
                        shipbob_products_name: products_name,
                        thirdparty_log_id: 0,
                        status: status,
                        created_datetime: new Date(),
                        tracking_number: 0,
                        address_line1: demoData.recipient.address.address1,
                        address_line2: demoData.recipient.address.address2,
                        city: demoData.recipient.address.city,
                        state_name: demoData.recipient.address.state,
                        country_name: demoData.recipient.address.country,
                        zipcode: demoData.recipient.address.zip_code,
                        shipbob_status: 0,
                        confirm_datetime: new Date(),
                        organization_name: "Grow",
                        token: "",
                        is_from: is_from
                    };

                    let shipbobOrder = await dbWriter.shipbobOrders.create(insertShipbobOrder);

                    if (shipbobOrder) {
                        shipbobOrder = JSON.parse(JSON.stringify(shipbobOrder));

                        // creating jwt token 
                        let token = jwt.sign(
                            { id: shipbobOrder.id },
                            process.env.TOKEN_KEY
                        );

                        // updating token in database
                        await dbWriter.shipbobOrders.update({
                            token: token
                        },
                            {
                                where: {
                                    id: shipbobOrder.id
                                }
                            });

                        let logList: any = [], noteList: any = [];
                        let orderMessage: any, subscriptionMessage: any;

                        if (is_from == 1 || is_from == 3) {
                            let callMethod = new ShipbobController();
                            responseObject.shipbob_table_id = shipbobOrder.id
                            let shipbob_response = await callMethod.createOrder(responseObject);

                            orderMessage = "Shipbob calendar card shipped successfully for Order #" + demoData.order_number;
                            subscriptionMessage = "Shipbob calendar card shipped successfully for subscription #" + demoData.subscription_number;

                        }
                        else {
                            //Getting usser data 
                            let userData = await dbReader.users.findOne({
                                attributes: ['email'],
                                where: {
                                    user_id: demoData.user_id,
                                }
                            });
                            userData = JSON.parse(JSON.stringify(userData));
                            var address_line_2_check = (demoData.recipient.address.address2) ? demoData.recipient.address.address2 + ", " : ""
                            let payload = {
                                user_email: userData.email,
                                site: 1,
                                user_id: demoData.user_id,
                                shipbob_product: products_name,
                                shipping_address: demoData.recipient.address.address1 + ", " + address_line_2_check + demoData.recipient.address.city + ", " + demoData.recipient.address.state + ", " + demoData.recipient.address.country + ", " + demoData.recipient.address.zip_code,
                                confirmation_link1: process.env.shipbob_confirmation_link + '?token=' + token + '&type=1',
                                confirmation_link2: process.env.shipbob_confirmation_link + '?token=' + token + '&type=2',
                                templateIdentifier: EnumObject.templateIdentifier.get('shippingAddressConfirmation').value
                            }

                            await ObjectMail.ConvertData(payload, function (data: any) { });
                            orderMessage = "Shipbob confirmation email has been send to " + userData.email + " for Order #" + demoData.subscription_number;
                            subscriptionMessage = "Shipbob confirmation email has been send to " + userData.email + " for Subscription #" + demoData.subscription_number;
                        }

                        logList.push({
                            type: 1, //order 
                            event_type_id: demoData.user_order_id,
                            message: orderMessage,
                        });
                        logList.push({
                            type: 2, //subscription
                            event_type_id: demoData.user_subscription_id,
                            message: subscriptionMessage,
                        });
                        // add notes for user order, subscription and activity for shipbob
                        noteList.push({
                            type: 1, //order 
                            event_type_id: demoData.user_order_id,
                            message: orderMessage,
                        });
                        noteList.push({
                            type: 2, //subscription
                            event_type_id: demoData.user_subscription_id,
                            message: subscriptionMessage,
                        });

                        await dbWriter.logs.bulkCreate(logList);
                        // save shipbob notes
                        await dbWriter.notes.bulkCreate(noteList);


                        return true;

                    }
                }

                return true;
            }
            else {

                let updateShipbobOrder: any = {};
                let demoData = responseObject;
                let getAllProducts = demoData.shipments[0].products.map((e: any) => e.name)
                var products_name = getAllProducts.toString();

                if (status == 1) {
                    updateShipbobOrder = {
                        shipbob_order_id: demoData.shipments[0].order_id,
                        shipbob_shipment_id: demoData.shipments[0].id,
                        thirdparty_log_id: demoData.thirdparty_log_id,
                        shipbob_status: 1,
                        status: 1,
                    };
                }
                else {

                    updateShipbobOrder = {
                        shipbob_order_id: 0,
                        shipbob_shipment_id: 0,
                        thirdparty_log_id: demoData.thirdparty_log_id,
                        status: 2
                    };
                }

                await dbWriter.shipbobOrders.update(updateShipbobOrder,
                    {
                        where: {
                            id: demoData.id
                        }
                    });

                return true;
            }

        } catch (e: any) {
            return false
        }
    }

    public updateShipbobOrderStatus = async (req: Request, res: Response) => {

        try {
            var EnumObject = new enumerationController();
            let insertArray: any = [];
            let log = await dbReader.shipbobOrders.findAll({
                attributes: ['shipbob_order_id'],
                where: {
                    shipbob_order_id: {
                        [Op.ne]: [0]
                    },
                    delivery_status: {
                        [Op.ne]: [5]
                    }
                }
            });

            for (var i = 0; i < log.length; i++) {

                let tempData = JSON.parse(JSON.stringify(log[i]));
                let getData = await axios(`${process.env.shipboburl}order/` + tempData.shipbob_order_id + `/shipment`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        "Authorization": `Bearer ${process.env.shipbob}`
                    }

                }).then(async (result: any) => {
                    if (result.status == 200) {
                        let getdevliveryStatusArray = result.data[0].status_details;
                        console.log(getdevliveryStatusArray)
                        if (getdevliveryStatusArray.length > 0) {
                            let devliveryStatus = EnumObject.shipbobDeliveryStatus.get(getdevliveryStatusArray[0].name);

                            if (devliveryStatus) {
                                let updateShipbobOrder = await dbWriter.shipbobOrders.update({ delivery_status: devliveryStatus.value },
                                    {
                                        where: { shipbob_order_id: tempData.shipbob_order_id },
                                    });
                            }
                        }
                    }
                });
            }
            new SuccessResponse(EC.success, {
                //@ts-ignore
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public checkShipbobToken = async (req: Request, res: Response, changeAddress: any = 0) => {
        let logList: any = [], noteList: any = [];
        let customMessage: any;

        try {
            let { token, type } = req.body;

            let decoded = jwt.verify(token, process.env.TOKEN_KEY);

            if (decoded.id) {
                let getShipbobOrder = await dbReader.shipbobOrders.findOne({
                    where: {
                        id: decoded.id
                    }
                });

                if (getShipbobOrder) {
                    getShipbobOrder = JSON.parse(JSON.stringify(getShipbobOrder));
                    if (getShipbobOrder.shipbob_status == 1) {
                        return new SuccessResponse("Card Already Delivered", {
                        }).send(res);
                    }
                    else {
                        if (type == 1) {

                            let response = await dbReader.thirdParty.findOne({
                                attributes: ['is_active'],
                                where: {
                                    thirdparty_id: 7
                                }

                            });
                            response = JSON.parse(JSON.stringify(response));
                            if (response.is_active == 1) {

                                try {
                                    let getShipbobChannels = await dbReader.shipbobChannelModel.findOne({
                                        attributes: ['shipbob_channel_id'],
                                        where: {
                                            is_selected: 1
                                        }
                                    });
                                    let channel_id = 0;
                                    if (getShipbobChannels) {
                                        getShipbobChannels = JSON.parse(JSON.stringify(getShipbobChannels));
                                        channel_id = getShipbobChannels.shipbob_channel_id
                                    }
                                    let getShipbobMethods = await dbReader.shipbobMethodsModel.findOne({
                                        attributes: ['title'],
                                        where: {
                                            is_default: 1
                                        }
                                    });

                                    let shipbob_method = "Shippment";
                                    if (getShipbobMethods) {
                                        getShipbobMethods = JSON.parse(JSON.stringify(getShipbobMethods));
                                        shipbob_method = getShipbobMethods.title
                                    }
                                    let recipient: any = {};
                                    recipient.address = {
                                        address1: getShipbobOrder.address_line1,
                                        address2: getShipbobOrder.address_line2,
                                        company_name: "",
                                        city: getShipbobOrder.city,
                                        state: getShipbobOrder.state_name,
                                        country: getShipbobOrder.country_name,
                                        zip_code: (getShipbobOrder.zipcode) ? getShipbobOrder.zipcode : ""
                                    }

                                    // getting user details from user_id 
                                    let getUser = await dbReader.users.findOne({
                                        attributes: ['first_name', 'email', 'mobile'],
                                        where: {
                                            user_id: getShipbobOrder.user_id
                                        }
                                    });
                                    getUser = JSON.parse(JSON.stringify(getUser));
                                    recipient.name = (getUser.first_name) ? getUser.first_name : getUser.email;
                                    recipient.email = getUser.email;
                                    recipient.phone_number = getUser.mobile


                                    let shipbobProducts: any = [];
                                    let allReferenceId = getShipbobOrder.reference_id.split(',');
                                    let allProductName = getShipbobOrder.shipbob_products_name.split(',');

                                    for (var i = 0; i < allReferenceId.length; i++) {
                                        shipbobProducts.push({
                                            reference_id: allReferenceId[i].toString(),
                                            quantity: 1,
                                            quantity_unit_of_measure_code: "",
                                            external_line_id: 0,
                                            name: allProductName[i].product_name
                                        });
                                    }

                                    let createShipbobOrder: any = {};
                                    createShipbobOrder.shipbob_table_id = decoded.id
                                    createShipbobOrder.shipbob_channel_id = channel_id;
                                    createShipbobOrder.shipping_method = shipbob_method;
                                    createShipbobOrder.recipient = recipient;
                                    createShipbobOrder.products = shipbobProducts;
                                    createShipbobOrder.order_number = getShipbobOrder.order_number;
                                    createShipbobOrder.reference_id = uuidv4();
                                    let callMethod = new ShipbobController();
                                    let shipbob_response = await callMethod.createOrder(createShipbobOrder);

                                    if (changeAddress == 0) {
                                        customMessage = "Shipbob calendar card confirmation email accept by " + recipient.name + " for subscription #" + getShipbobOrder.subscription_number;
                                        logList.push({
                                            type: 2,
                                            event_type_id: getShipbobOrder.user_subscription_id,
                                            message: customMessage,
                                        });

                                        noteList.push({
                                            type: 2,
                                            event_type_id: getShipbobOrder.user_subscription_id,
                                            message: customMessage,
                                        });
                                        await dbWriter.logs.bulkCreate(logList);
                                        // save shipbob notes
                                        await dbWriter.notes.bulkCreate(noteList);
                                    }
                                    return new SuccessResponse(EC.shipbobDataTransferSuccess, {
                                        ...shipbob_response
                                    }).send(res);
                                }
                                catch (e: any) {
                                    console.log(e);
                                }

                            }

                        }
                        else if (type == 2) {
                            // getting user_data
                            let getUser = await dbReader.users.findOne({
                                attributes: ['first_name', 'last_name', 'email'],
                                where: {
                                    user_id: getShipbobOrder.user_id
                                }
                            });
                            getUser = JSON.parse(JSON.stringify(getUser));

                            let addressObject = {
                                "status": 2,
                                "id": getShipbobOrder.id,
                                "email": getUser.email,
                                "first_name": getUser.first_name,
                                "last_name": getUser.last_name,
                                "organization_name": getShipbobOrder.organization_name,
                                "address_line1": getShipbobOrder.address_line1,
                                "address_line2": getShipbobOrder.address_line2,
                                "city": getShipbobOrder.city,
                                "state_name": getShipbobOrder.state_name,
                                "country_name": getShipbobOrder.country_name,
                                "zipcode": getShipbobOrder.zipcode,
                            }
                            return new SuccessResponse("Address Data", {
                                ...addressObject
                            }).send(res);
                        }
                    }
                }
                else {
                    ApiError.handle(new BadRequestError("No Data Found"), res);
                }

            }
            else {
                ApiError.handle(new BadRequestError("something went wrong"), res);
            }


        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public updateShipbobUserAddress = async (req: Request, res: Response) => {
        let logList: any = [], noteList: any = [];
        let customMessage: any;

        try {
            let updateData = await dbWriter.shipbobOrders.update(req.body, {
                where: {
                    id: req.body.id
                }
            });
            let object = new ShipbobController();
            let findUpdatedRecord = await dbWriter.shipbobOrders.findOne({
                where: {
                    id: req.body.id
                }
            });
            findUpdatedRecord = JSON.parse(JSON.stringify(findUpdatedRecord));
            req.body.token = findUpdatedRecord.token;
            req.body.type = 1;

            if (req.body.first_name) {
                customMessage = "Shipbob calendar card shipping address change and confirm by " + req.body.first_name + " for subscription #" + findUpdatedRecord.subscription_number
            }
            else {
                customMessage = "Shipbob calendar card shipping address change and confirm by customer  for subscription #" + findUpdatedRecord.subscription_number
            }

            logList.push({
                type: 2,
                event_type_id: findUpdatedRecord.user_subscription_id,
                message: customMessage,
            });

            noteList.push({
                type: 2,
                event_type_id: findUpdatedRecord.user_subscription_id,
                message: customMessage,
            });
            await dbWriter.logs.bulkCreate(logList);
            // save shipbob notes
            await dbWriter.notes.bulkCreate(noteList);

            object.checkShipbobToken(req, res, 1);

        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public cancelShipbobOrder = async (req: Request, res: Response) => {
        let { shipment_id } = req.body
        let logList: any = [], noteList: any = [];
        let shipmentCancel: any;
        // finding subscription_id for log table
        let getShipbobOrder = await dbReader.shipbobOrders.findOne({
            where: {
                shipbob_shipment_id: shipment_id
            }
        });
        getShipbobOrder = JSON.parse(JSON.stringify(getShipbobOrder));
        try {


            await axios(`${process.env.shipboburl}shipment/` + shipment_id + `/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${process.env.shipbob}`
                }
            }).then(async (result: any) => {
                if (result.status == 200) {
                    shipmentCancel = "Shipbob calendar card has been cancelled successfully for subscription #" + getShipbobOrder.subscription_number;
                    let getdevliveryStatusArray = result.data;
                    await dbWriter.shipbobOrders.update({
                        delivery_status: 15
                    }, {
                        where: { shipbob_shipment_id: shipment_id }
                    });
                    logList.push({
                        type: 2,
                        event_type_id: getShipbobOrder.user_subscription_id,
                        message: shipmentCancel,
                    });

                    noteList.push({
                        type: 2,
                        event_type_id: getShipbobOrder.user_subscription_id,
                        message: shipmentCancel,
                    });
                    await dbWriter.logs.bulkCreate(logList);
                    // save shipbob notes
                    await dbWriter.notes.bulkCreate(noteList);
                    new SuccessResponse(EC.success, {
                        //@ts-ignore
                        token: req.token,
                        rows: null
                    }).send(res);
                } else {
                    shipmentCancel = "There is some  error while cancelling Shipbob calendar card for Subscription #" + getShipbobOrder.subscription_number;
                    logList.push({
                        type: 2,
                        event_type_id: getShipbobOrder.user_subscription_id,
                        message: shipmentCancel,
                    });

                    noteList.push({
                        type: 2,
                        event_type_id: getShipbobOrder.user_subscription_id,
                        message: shipmentCancel,
                    });
                    await dbWriter.logs.bulkCreate(logList);
                    // save shipbob notes
                    await dbWriter.notes.bulkCreate(noteList);
                    throw new Error("Something went wrong please try again.")
                }
            });
        } catch (e: any) {
            let customMessage: any;
            let getResponse = e.response.data;
            Object.keys(getResponse).forEach((key) => {
                let extractData = getResponse[key]
                customMessage = extractData[0];
            });
            if (customMessage == "Shipment is already Cancelled.") {
                await dbWriter.shipbobOrders.update({
                    delivery_status: 15
                }, {
                    where: { shipbob_shipment_id: shipment_id }
                });
                shipmentCancel = "Shipbob calendar card has been cancelled successfully for subscription #" + getShipbobOrder.subscription_number;
                logList.push({
                    type: 2,
                    event_type_id: getShipbobOrder.user_subscription_id,
                    message: shipmentCancel,
                });
                noteList.push({
                    type: 2,
                    event_type_id: getShipbobOrder.user_subscription_id,
                    message: shipmentCancel,
                });
                await dbWriter.logs.bulkCreate(logList);
                // save shipbob notes
                await dbWriter.notes.bulkCreate(noteList);
                new SuccessResponse(EC.success, {
                    //@ts-ignore
                    token: req.token,
                    rows: null
                }).send(res);
            } else {
                shipmentCancel = "There is some  error while cancelling Shipbob calendar card for Subscription #" + getShipbobOrder.subscription_number;
                logList.push({
                    type: 2,
                    event_type_id: getShipbobOrder.user_subscription_id,
                    message: shipmentCancel,
                });
                noteList.push({
                    type: 2,
                    event_type_id: getShipbobOrder.user_subscription_id,
                    message: shipmentCancel,
                });
                await dbWriter.logs.bulkCreate(logList);
                // save shipbob notes
                await dbWriter.notes.bulkCreate(noteList);
                
                ApiError.handle(new BadRequestError(customMessage), res);
            }
        }
    }

    public cancelComfirmShipbobOrder = async (req: Request, res: Response) => {
        try {
            let { s_id } = req.body, updateShipbobOrder,logs,notes
            let logList: any = [], noteList: any = [];
            let shipmentCancel: any;
            // finding subscription_id for log table
            let getShipbobOrder = await dbReader.shipbobOrders.findOne({
                where: {
                    id: s_id
                }
            });
            getShipbobOrder = JSON.parse(JSON.stringify(getShipbobOrder));
            if (getShipbobOrder) {
                shipmentCancel = "Shipbob calendar card has been cancelled successfully for subscription #" + getShipbobOrder.subscription_number;
                updateShipbobOrder =  await dbWriter.shipbobOrders.update({
                    delivery_status: 15,
                    shipbob_status:1
                }, {
                    where: { id: s_id }
                });
                if(updateShipbobOrder == 1){
                    logList.push({
                        type: 2,
                        event_type_id: getShipbobOrder.user_subscription_id,
                        message: shipmentCancel,
                    });
    
                    noteList.push({
                        type: 2,
                        event_type_id: getShipbobOrder.user_subscription_id,
                        message: shipmentCancel,
                    });
                    logs = await dbWriter.logs.bulkCreate(logList);
                    // save shipbob notes
                    notes = await dbWriter.notes.bulkCreate(noteList);
                }
               
                new SuccessResponse(EC.success, {
                    //@ts-ignore
                    token: req.token,
                    updateShipbobOrder,logs,notes
                }).send(res);
            } else {
                throw new Error("Can't find order.")
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }


    public sendShipbobMailToUser = async (req: Request, res: Response) => {

        try {
            let { id } = req.body

            let shipbobdata = await dbReader.shipbobOrders.findOne({
                where: {
                    id: id
                }
            })
            shipbobdata = JSON.parse(JSON.stringify(shipbobdata));
            //Getting usser data 
            let userData = await dbReader.users.findOne({
                attributes: ['email'],
                where: {
                    user_id: shipbobdata.user_id,
                }
            });
            userData = JSON.parse(JSON.stringify(userData));
            let email = userData.email;

            if (req.body.email) {
                email = req.body.email
            }

            let payload = {
                user_email: userData.email,
                site: 1,
                user_id: shipbobdata.user_id,
                shipbob_product: shipbobdata.shipbob_products_name,
                shipping_address: shipbobdata.address_line1 + "," + shipbobdata.address_line2 + "," + shipbobdata.city + "," + shipbobdata.state_name + "," + shipbobdata.country_name + "," + shipbobdata.zipcode,
                confirmation_link1: process.env.shipbob_confirmation_link + '?token=' + shipbobdata.token + '&type=1',
                confirmation_link2: process.env.shipbob_confirmation_link + '?token=' + shipbobdata.token + '&type=2',
                templateIdentifier: EnumObject.templateIdentifier.get('shippingAddressConfirmation').value
            }

            await ObjectMail.ConvertData(payload, function (data: any) { });
            return new SuccessResponse("Email Send Successfully", {
            }).send(res);

        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public getUserAddressByShipmentId = async (shipment_id: any) => {
        try {
            // Getting user delivery Address based on supscription number
            let getUserSubscriptionId = await dbReader.userSubscription.findAll({
                attributes: ['user_subscription_id', 'subscription_number'],
                where: {
                    subscription_number: {
                        [Op.in]: shipment_id
                    }
                }
            });
            let subscriptionIDs: any;
            if (getUserSubscriptionId.length > 0) {
                getUserSubscriptionId = JSON.parse(JSON.stringify(getUserSubscriptionId));
                subscriptionIDs = getUserSubscriptionId.map((e: any) => e.user_subscription_id);
                let getUserAddress = await dbReader.userAddress.findAll({
                    attributes: ['user_address_id', 'email_address', 'phone_number', 'user_id', 'user_orders_id', 'user_subscription_id', 'address_type', 'is_shipping_same', 'first_name', 'last_name', 'address_line2', 'address_line1', 'city', [dbReader.Sequelize.literal('`stateModel`.`name`'), 'state_name'], [dbReader.Sequelize.literal('`countryModel`.`name`'), 'country_name'], 'zipcode'],
                    include: [{
                        model: dbReader.stateModel,
                        attributes: []
                    }, {
                        model: dbReader.countryModel,
                        attributes: []
                    }],
                    where: {
                        user_subscription_id: {
                            [Op.in]: subscriptionIDs
                        },
                        address_type: 2
                    }
                });
                if (getUserAddress.length > 0) {
                    getUserAddress = JSON.parse(JSON.stringify(getUserAddress));
                    getUserSubscriptionId.forEach((e: any) => {
                        e.delivery_address = getUserAddress.filter((s: any) => s.user_subscription_id == e.user_subscription_id);
                    });
                    return getUserSubscriptionId;
                }
                else {
                    return false;
                }
            }
            else {
                return false;
            }
        }
        catch (e: any) {
            return false;
        }
    }

    public resendMailAdmin = async (req: Request, res: Response) => {
        try {
            let { send_email_id } = req.body
            let emailData = await dbReader.sendEmailLog.findOne({
                where: {
                    send_email_log_id: send_email_id
                }
            });
            emailData = JSON.parse(JSON.stringify(emailData));
            let user_email = (req.body.user_email) ? req.body.user_email : emailData.receiver
            //Getting usser data 
            let keyFileName = emailData.html_link.split('/');
            var options = {
                Bucket: 'sycu-accounts/email-logs',
                Key: keyFileName[keyFileName.length - 1]
            };
            s3.getObject(options, async (err: any, data1: any) => {
                if (err) {
                    throw new Error(err.message);
                } else {
                    let filePath = process.env.System_Path + '/emailHtml/emailRead.html';
                    fs.writeFileSync(filePath, data1.Body.toString())
                    await fs.readFile(filePath, async (err: any, pdfBuffer: any) => {
                        let fileBuffer = Buffer.from(pdfBuffer);
                        const htmlString = fileBuffer.toString();
                        var payload = {
                            status: 1,
                            user_id: emailData.user_id,
                            templateIdentifier: emailData.email_design_template_id,
                            subjectMail: emailData.subject_mail,
                            site: emailData.site_id,
                            user_email: user_email,
                            htmlContent: htmlString,
                            global_id: emailData.global_id,
                            parent_id: emailData.send_email_log_id
                        };
                        await ObjectMail.sendDirectMail(payload);
                        await fs.unlink(filePath, (err: any) => {
                            if (err) throw new Error(err.message);
                        });
                        new SuccessResponse(EC.success, {
                            //@ts-ignore
                            token: req.token,
                        }).send(res);
                    });
                }
            });
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

}
