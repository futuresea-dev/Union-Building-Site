import { Router } from "express";
import { SubscriptionReportController } from "../../controllers/subscriptionReportController";
const BearerToken = require('../../middleware/bearerToken');
import validator, { ValidationSource } from '../../helpers/validator';
import schema from './schema';
import { SupportTicketController } from "../../controllers/supportTicketController";

export class supportTicketRoute extends SupportTicketController {

    public self: any = "";

    constructor(router: Router) {
        super();
        this.route(router);
    }

    public route(router: Router) {
        router.get("/test", this.test);
        router.post("/listSupportTickets", this.listSupportTickets);
        router.post("/listAssignedOpenSupportTickets", BearerToken, this.listAssignedOpenSupportTickets);
        router.post("/listAssignedClosedSupportTickets", BearerToken, this.listAssignedClosedSupportTickets);
        router.post("/listUnassignedSupportTickets", this.listUnassignedSupportTickets);
        router.post("/getSupportTicket", this.getSupportTicket);
        router.get("/listSupportTicketServices", this.getSupportTicketServicesList);
        router.get("/listSupportTicketTypes", this.getSupportTicketTypesList);
        router.get("/listSupportTicketStatus", this.getSupportTicketStatusList);
        router.get("/listSupportTicketApplications", this.getSupportTicketApplicationsList);
        router.post("/listSupportTicketActivities", this.getSupportTicketActivitiesList);
        router.post("/listSupportTicketNotes", this.getSupportTicketNotesList);
        router.post("/createSupportTicketNote", this.createSupportTicketNote);
        router.get("/listSupportTicketLinks", this.getSupportTicketLinksList);
        router.get("/listSupportTicketAssignees", this.getSupportTicketAssigneesList);
    }
}
