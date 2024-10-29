import { NextFunction, Request, Response, Router } from "express";
import { orderNotesController } from "../../controllers/orderNotesController";
import validator from '../../helpers/validator';
import schema from './schema';
const BearerToken = require('../../middleware/bearerToken');

export class orderNoteRoute extends orderNotesController {
    public self: any = "";

    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {
        router.post("/listNotes", BearerToken, this.listNotes);
        router.post("/saveNotes", validator(schema.orderNotesPayload), BearerToken, this.saveNotes);
        router.get("/deleteNote/:id", BearerToken, this.deleteNote);
        router.post("/pinNote", BearerToken, this.pinNote);
    }

}