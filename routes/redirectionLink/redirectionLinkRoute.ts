import { Router } from "express";
import { RedirectionController } from "../../controllers/redirectionController";
import validator, { ValidationSource } from '../../helpers/validator';
const BearerToken = require('../../middleware/bearerToken');
import schema from "./schema";

export class redirectionLink extends RedirectionController {
    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {
        router.post("/redirectionLinkList", BearerToken, validator(schema.redirectionLinkListPayload), this.redirectionLinkList);
        router.put("/addUpdateRedirectionLink", validator(schema.addUpdateRedirectionLinkPayload), BearerToken, this.addUpdateRedirectionLink);
        router.delete("/deleteRedirectionLink/:page_link_id?", validator(schema.deleteRedirectionLinkPayload, ValidationSource.PARAM), BearerToken, this.deleteRedirectionLink);
        router.put("/statusRedirectionLink", validator(schema.statusRedirectionLinkPayload), BearerToken, this.statusRedirectionLink);
        router.post("/updateRedirectionFolderId", BearerToken, validator(schema.redirectionFolderIdPayload), this.updateRedirectionFolderId);
    }
}