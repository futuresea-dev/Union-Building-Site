import { Router } from "express";
import { OrderController } from "../../controllers/orderController";
import validator, { ValidationSource } from '../../helpers/validator';
import schema from './schema';
const BearerToken = require('../../middleware/bearerToken');

export class UserOrderRoute extends OrderController {
    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {
        //Sourabh 24-11-2021    
        router.post("/listOrder", BearerToken, this.listOrder);
        router.get("/getTotalOrders", BearerToken, this.getTotalOrders);
        router.post("/updateOrderDetails", BearerToken, this.updateOrderDetails);
        router.get("/getOrderDetails/:id", BearerToken, validator(schema.orderDetailsPayload, ValidationSource.PARAM), this.getOrderDetails);
    }
}
