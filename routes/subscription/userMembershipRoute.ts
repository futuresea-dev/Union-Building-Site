import { Router } from "express";
import schema from './schema';
import validator, { ValidationSource } from '../../helpers/validator';
import { UserMembershipController } from "../../controllers/userMembershipController";

const BearerToken = require('../../middleware/bearerToken');

export class UserMembershipRoute extends UserMembershipController {

    public self: any = "";

    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {
        router.post("/createNewUserMembership", BearerToken, this.createNewUserMembership);
        router.post("/getUserMembership", BearerToken, this.getUserMembership);
        router.post("/saveUserMembership", BearerToken, validator(schema.saveUserMembershipPayload), this.saveUserMembership);
        router.post("/deleteUserMemberships/:id", BearerToken, validator(schema.idParams, ValidationSource.PARAM), this.deleteUserMemberships);
        router.post("/getUserActiveMemberships", BearerToken, validator(schema.getUserActiveMembershipPayload), this.getUserActiveMemberships);
        router.get("/getUserAccountMemberships", BearerToken, this.getUserAccountMemberships);
        router.post("/bulkUpdateMembershipStatus", BearerToken, validator(schema.updateMembershipStatusPayload), this.bulkUpdateMembershipStatus);
    }
}