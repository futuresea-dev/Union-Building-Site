import { Router } from "express";
import { ProductController } from "../../controllers/productController";
import validator, { ValidationSource } from '../../helpers/validator';
import schema from './schema';
const BearerToken = require('../../middleware/bearerToken');
export class ProductRoute extends ProductController {

    public self: any = "";

    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {
        router.get("/listAllProductVolumes", BearerToken, this.listAllProductVolumes);
        router.post("/listAllProductFolders", BearerToken, this.listAllProductFolders);
        router.get("/getProductFolder/:id", validator(schema.productParams, ValidationSource.PARAM), BearerToken, this.getProductFolder);
        router.post("/saveProductFolder", validator(schema.productFolderPayload), BearerToken, this.saveProductFolder);
        router.get("/deleteProductFolder/:id", validator(schema.productFolderIdParams, ValidationSource.PARAM), BearerToken, this.deleteProductFolder);

        router.post("/listAllProducts", BearerToken, validator(schema.listAllProductsPayload), this.listAllProducts);
        router.post("/getAllProducts", BearerToken, this.getAllProducts);
        router.get("/getProductDetails/:id", validator(schema.productParams, ValidationSource.PARAM), BearerToken, this.getProductDetails);
        router.post("/saveProducts", validator(schema.productPayload), BearerToken, this.saveProducts);
        router.post("/deleteProduct", BearerToken, this.deleteProduct);
    }
}