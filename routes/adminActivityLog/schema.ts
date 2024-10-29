import Joi from 'joi';
import { ErrorController } from "../../core/ErrorController";
const EC = new ErrorController();

export default {
  addAdminActivityLog: Joi.object().keys({
      activity_type: Joi.string().required(),
      module: Joi.string().required(),
      submodule : Joi.string().allow(null, ""),
      description: Joi.string().allow(null, "")
  })
}
