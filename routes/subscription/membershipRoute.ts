import { NextFunction, Request, Response, Router } from "express";
import { MembershipController } from "../../controllers/membershipController";

const BearerToken = require('../../middleware/bearerToken');
import validator from '../../helpers/validator';
import schema from './schema';

export class MembershipRoute extends MembershipController {

    public self: any = "";

    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {
        router.post("/listMembership/", BearerToken, this.listMembership);
        router.get("/getMembershipDetail/:id", BearerToken, this.getMembershipDetails);
        router.post("/saveMembership", BearerToken, validator(schema.membershipPayload), this.saveMembership);
        router.get("/deleteMembership/:id", BearerToken, this.deleteMembership);
        router.post("/getActiveMembershipUsers", BearerToken, this.getActiveMembershipUsersV1);
    }
}