import { Router } from "express";
import { ShipbobController } from "../../controllers/shipbobController";

const BearerToken = require('../../middleware/bearerToken');
export class shipbobRoute extends ShipbobController {

    public self: any = "";

    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {
        router.get("/mapShipbobMethodToSycu", BearerToken, this.mapShipbobMethodToSycu);
        router.get("/listShipmentMethod", BearerToken, this.listShipmentMethod);
        router.post("/listSycuShippableProducts", BearerToken, this.listSycuShippableProducts);
        router.post("/updateShipmentMethod", BearerToken, this.updateShipmentMethod);
        router.post("/mapShipbobProductsToSycu", BearerToken, this.mapShipbobProductsToSycu);
        router.post("/listShipbobProducts", BearerToken, this.listShipbobProducts);
        router.post("/saveSycuMapProducts", BearerToken, this.saveSycuMapProducts);
        router.post("/listSycuMapProducts", BearerToken, this.listSycuMapProducts);
        router.post("/mapShipbobChannelToSycu", BearerToken, this.mapShipbobChannelToSycu);
        router.post("/listShipbobChannels", BearerToken, this.listShipbobChannels);
        router.post("/updateShipmentChannel", BearerToken, this.updateShipmentChannel);
        router.post("/createManualShipBobOrder", BearerToken, this.createManualShipBobOrder);
        router.post("/getShipbobOrders", BearerToken, this.getShipbobOrders);
        router.post("/updateShipbobOrderStatus", BearerToken, this.updateShipbobOrderStatus);
        router.post("/checkShipbobToken", BearerToken, this.checkShipbobToken);
        router.post("/updateShipbobUserAddress", BearerToken, this.updateShipbobUserAddress);
        router.post("/sendShipbobMailToUser", BearerToken, this.sendShipbobMailToUser);
        router.post("/cancelShipbobOrder", BearerToken, this.cancelShipbobOrder);
        router.post("/getShipmentTimeline", BearerToken, this.getShipmentTimeline);
        router.post("/resendMailAdmin", BearerToken, this.resendMailAdmin);
        router.post("/cancelComfirmShipbobOrder",BearerToken,  this.cancelComfirmShipbobOrder);
    }
}