import { tutorial } from './../../controllers/tutorialController';
import { Router } from "express";
import validator, { ValidationSource } from '../../helpers/validator';
import schema from './schema';

const BearerToken = require("../../middleware/bearerToken");

export class TutorialRoutes extends tutorial {
  public self: any = "";
  constructor(router: Router) {
    super();
    this.route(router);
  }

  public route(router: Router) {
    router.post("/saveTutorial", BearerToken, validator(schema.tutorialPayload), this.saveTutorial);
    router.post("/activeInactiveTutorial", BearerToken, validator(schema.activeTutorialPayload), this.activeInactiveTutorial);
    router.get("/listAllTutorials/:site_id", /**  BearerToken, */ validator(schema.siteIdParams, ValidationSource.PARAM), this.listAllTutorials);
    router.get("/getTutorialById/:tutorial_id", BearerToken, validator(schema.tutorialIdParams, ValidationSource.PARAM), this.getTutorialById);
    router.delete("/deleteTutorial/:tutorial_id", BearerToken, validator(schema.tutorialIdParams, ValidationSource.PARAM), this.deleteTutorial);
    router.post("/listAllTutorialsv1", /**  BearerToken, */ validator(schema.siteIdParamsV1), this.listAllTutorialsv1);
  }
}
