import Joi from 'joi';
import { join } from 'lodash';
import { ErrorController } from "../../core/ErrorController";
const EC = new ErrorController();

export default {
  saveAnnouncementPayload: Joi.object().keys({
    announcement_id: Joi.number().optional(),
    announcement_title: Joi.string().required(),
    announcement_content: Joi.string().required(),
    category_id: Joi.number().required(),
    user_id: Joi.number().allow(null, 0).label('User id'),
    attachment: Joi.array().allow()
  }),

  listingAnnouncementsPayload: Joi.object().keys({
    // search: Joi.string().allow(null, ""),
    // page_no: Joi.number().allow(),
    category_id: Joi.number().required(),
  }),

  deleteAnnouncementPayload: Joi.object().keys({
    announcement_id: Joi.number().required()
  }),

  saveSortOrderOfAnnouncements: Joi.object().keys({
    announcements: Joi.array().required()
  })
};
