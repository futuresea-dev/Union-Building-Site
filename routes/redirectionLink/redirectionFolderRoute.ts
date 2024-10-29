import { Router } from "express";
import { RedirectionFolderController } from "../../controllers/redirectionFolderController";
import validator, { ValidationSource } from '../../helpers/validator';
const BearerToken = require('../../middleware/bearerToken');
import schema from "./schema";

export class redirectionFolder extends RedirectionFolderController {
    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {
        router.post("/listRedirectionFolder", BearerToken, this.listRedirectionFolder);
        router.post("/createUpdateRedirectionFolder", BearerToken, this.createUpdateRedirectionFolder);
        router.delete("/deleteRedirectionFolder/:redirection_folder_id?", BearerToken, this.deleteRedirectionFolder);

        // router.put("/addUpdateRedirectionLink", validator(schema.addUpdateRedirectionLinkPayload), BearerToken, this.addUpdateRedirectionLink);
        // router.delete("/deleteRedirectionLink/:page_link_id?", validator(schema.deleteRedirectionLinkPayload, ValidationSource.PARAM), BearerToken, this.deleteRedirectionLink);
        // router.put("/statusRedirectionLink", validator(schema.statusRedirectionLinkPayload), BearerToken, this.statusRedirectionLink);
    }
}