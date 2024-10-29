import { Router } from "express";
import { tvVideosController } from "../../controllers/tvVideosController";
import validator, { ValidationSource } from "../../helpers/validator";
import schema from "./schema";

const BearerToken = require("../../middleware/bearerToken");

export class videoTvRoutes extends tvVideosController {
  constructor(router: Router) {
    super();
    this.route(router);
  }
  public route(router: Router) {
    router.post(
      "/saveVideo",
      BearerToken,
      validator(schema.saveVideo),
      this.saveVideo
    );
    router.post(
      "/deleteVideo",
      BearerToken,
      validator(schema.deleteVideo, ValidationSource.PARAM),
      this.deleteVideo
    );
    router.post(
      "/listTvVideo",
      BearerToken,
      validator(schema.listTvVideo),
      this.listTvVideo
    );

    router.post(
      '/listTvCategoryVideo',
      BearerToken,
      validator(schema.listTvCategoryVideoPayload, ValidationSource.PARAM),
      this.listTvCategoryVideo);

    router.post(
      '/listAllVideo',
      BearerToken,
      validator(schema.listAllVideo),
      this.listAllVideo);
  }
}
