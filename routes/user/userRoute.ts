import { Router } from "express";
import { UserController } from "../../controllers/userController";
const BearerToken = require('../../middleware/bearerToken');
import validator, { ValidationSource } from '../../helpers/validator';
import schema from './schema';

export class UserRoute extends UserController {

    public self: any = "";

    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {
        router.post("/listUser", BearerToken, this.listUser);
        router.post("/listLoginLogs", BearerToken, validator(schema.listLoginLogsPayload), this.listLoginUserDetails);
        router.post("/deleteUser", BearerToken, this.deleteUser);
        router.post("/customerList", BearerToken, this.customerList);
        router.get("/getTotalUsers", BearerToken, this.getTotalUsers);
        router.post("/getAllUserNames", BearerToken, this.getUserNames);
        router.post("/allowCircleAccess", validator(schema.allowCircleAccess), this.allowCircleAccess);
        router.post("/listUserPaymentMethod", BearerToken, validator(schema.listAllProductsPayload), this.listUserPaymentMethod);
        router.put("/userAction", BearerToken, validator(schema.userAction), this.userAction);
        router.get("/getSiteAccessDataByUserId/:user_id", BearerToken, validator(schema.getSiteAccessDataByUserIdPayload, ValidationSource.PARAM), this.getSiteAccessDataByUserId);
        router.post("/changeUserSharedDashboardLimit", BearerToken, validator(schema.sharedDashboardLimitPayload), this.changeUserSharedDashboardLimit);
        router.get("/getUserSharedMembership/:user_id", BearerToken, validator(schema.getSiteAccessDataByUserIdPayload, ValidationSource.PARAM), this.getUserSharedMembership);
        router.get("/getUserSharedMembershipOthers/:user_id", BearerToken, validator(schema.getSiteAccessDataByUserIdPayload, ValidationSource.PARAM), this.getUserSharedMembershipOthers);
        router.get("/getNotExecutedUsers",BearerToken,this.getNotExecutedUsers)
        router.post("/facebook-group-activity",BearerToken,validator(schema.facebookGroupActivity),this.addFacebookGroupActivity)
        router.post("/facebook-group",BearerToken,validator(schema.addEditFacebookGroup),this.addEditFacebookGroup)
        router.post("/facebook-groups",BearerToken,this.listFacebookGroups)
        router.post("/facebook-group-activities",BearerToken,this.listFacebookGroupActivity)
        router.get("/getNotExecutedUsers", BearerToken, this.getNotExecutedUsers)
    }
}
