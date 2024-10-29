import Joi from 'joi';
import { ErrorController } from "../../core/ErrorController";
const EC = new ErrorController();

export default {
  getGraphPayload: Joi.object().keys({
    year: Joi
      .number()
      .required()
      .messages({ "any.required": EC.errorMessage(EC.required, ["Year"]) }),
  }),
}
