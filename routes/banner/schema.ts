import Joi from 'joi';
import { join } from 'lodash';
import { ErrorController } from "../../core/ErrorController";
const EC = new ErrorController();

export default {
  saveHubBannerPayload: Joi.object().keys({
    banner_id: Joi.number().required(),
    banner_name: Joi.string().allow(null, ""),
    banner_image_url: Joi.string().required(),
    is_default: Joi.number().allow(null, 0),
    user_id: Joi.number().allow(null, 0).label('User id')
  }),

  listingHubBannersPayload: Joi.object().keys({
    search: Joi.string().allow(null, ""),
    page_no: Joi.number().allow(),
  }),

  deleteHubBannerPayload: Joi.object().keys({
    banner_id: Joi.number().required()
  }),

};
