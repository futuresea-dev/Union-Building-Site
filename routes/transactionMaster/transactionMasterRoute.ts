//Sm 8-12-21

import { Router } from "express";
import { transactionController } from "../../controllers/transactionMasterController";
const BearerToken = require('../../middleware/bearerToken');
import validator from '../../helpers/validator';
import schema from './schema'

export class transactionRoute extends transactionController {
    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {
        router.post("/listTransaction", BearerToken, validator(schema.transactionPayload), this.listTransaction);
        router.post("/getTransactionDetails", BearerToken, this.getTransactionDetails);
    }
}
