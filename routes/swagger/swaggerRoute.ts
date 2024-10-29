import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "../../core/Swagger.json";
import swaggerDocumentSupportTicket from "../../core/SwaggerSupportTicket.json";

export class SwaggerRoute {
    constructor(router: Router) {
        this.route(router);
    }

    public route(router: Router) {
        // Serve the first Swagger document
        router.use('/swagger', swaggerUi.serveFiles(swaggerDocument), swaggerUi.setup(swaggerDocument));
        
        // Serve the second Swagger document
        router.use('/swagger-support-ticket', swaggerUi.serveFiles(swaggerDocumentSupportTicket), swaggerUi.setup(swaggerDocumentSupportTicket));
    }
}
