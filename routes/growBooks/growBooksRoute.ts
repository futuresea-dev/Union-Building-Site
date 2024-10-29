import { Router } from "express";
import { GrowBooksController } from "../../controllers/growBooksController";
const BearerToken = require('../../middleware/bearerToken');
import validator from '../../helpers/validator';
import schema from './schema';

export class GrowBooksRoute extends GrowBooksController {

    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {

        //Grow Books API
        router.post("/listAllGrowBooks", BearerToken, validator(schema.listAllGrowBooks), this.listAllGrowBooks);
        router.post("/saveGrowBook", BearerToken, validator(schema.saveGrowBook), this.saveGrowBook);
        router.post("/deleteGrowBook", BearerToken, validator(schema.deleteGrowBook), this.deleteGrowBook);
        router.post("/updateGrowBookStatus", BearerToken, validator(schema.updateGrowBookStatus), this.updateGrowBookStatus);
        router.get("/getGrowBookAuthors", BearerToken, this.getGrowBookAuthors);
        router.get("/getGrowBookCategory", BearerToken, this.getGrowBookCategory);

        //Grow Book Category API
        router.post("/saveGrowBooksCategory", BearerToken, validator(schema.saveGrowBooksCategory), this.saveGrowBooksCategory);
        router.post("/listAllGrowBooksCategories", BearerToken, validator(schema.listAllGrowBooksCategories), this.listAllGrowBooksCategories);
        router.post("/deleteGrowBookCategory", BearerToken, validator(schema.deleteGrowBookCategory), this.deleteGrowBookCategory);
        router.post("/updateGrowBookCategoryStatus", BearerToken, validator(schema.updateGrowBookCategoryStatus), this.updateGrowBookCategoryStatus);

        //Grow Book Author API
        router.post("/saveGrowBooksAuthor", BearerToken, validator(schema.saveGrowBooksAuthor), this.saveGrowBooksAuthor);
        router.post("/listAllGrowBooksAuthors", BearerToken, validator(schema.listAllGrowBooksAuthors), this.listAllGrowBooksAuthors);
        router.post("/deleteGrowBookAuthor", BearerToken, validator(schema.deleteGrowBookAuthor), this.deleteGrowBookAuthor);
        router.post("/updateGrowBookAuthorStatus", BearerToken, validator(schema.updateGrowBookAuthorStatus), this.updateGrowBookAuthorStatus);
    }
}
