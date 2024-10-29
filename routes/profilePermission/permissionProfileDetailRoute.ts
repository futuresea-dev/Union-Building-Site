import { Router } from "express";
import { PermissionProfileController } from "../../controllers/permissionProfileController";
import validator, { ValidationSource } from '../../helpers/validator';

const BearerToken = require("../../middleware/bearerToken");

import schema from './schema';

/*
* Code done by Darshit - 26-01-2022
* Create route for Profile_permission_detail
*/

export class permissionProfileRoute extends PermissionProfileController {
    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {
        router.get("/getPermissions", BearerToken, this.getMasterPermissions);
        router.get("/listPermissionProfile", BearerToken, this.PermissionProfileList);
        router.get("/PermissionProfileDetail/:permission_profile_id?", validator(schema.PermissionProfile, ValidationSource.PARAM), BearerToken, this.PermissionProfile);
        router.post("/savePermissionProfile", validator(schema.addupdateProfilePermission), BearerToken, this.addupdateProfilePermission);
        router.delete("/deletePermissionProfile/:permission_profile_id?", validator(schema.deletePermissionProfile, ValidationSource.PARAM), BearerToken, this.deletePermissionProfile);
    }
}