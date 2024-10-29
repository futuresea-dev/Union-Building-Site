import Joi from "joi";

export default {
  listAllApplicationMenuPayload: Joi.object().keys({
    site_id: Joi.number().required(),
    menu_type: Joi.number().required(),
  }),
  deleteApplicationMenuPayload: Joi.object().keys({
    application_menu_id: Joi.number().required(),
    parent_application_menu_id: Joi.number().required(),
    site_id: Joi.number().required(),
  }),
  StatusApplicationMenuPayload: Joi.object().keys({
    application_menu_id: Joi.number().required(),
    is_active: Joi.number().required(),
  }),
  SaveApplicationMenuPayload: Joi.object().keys({
    application_menu_title: Joi.string().required(),
    parent_application_menu_id: Joi.number().required(),
    application_menu_id: Joi.number().required(),
    site_id: Joi.number().required(),
    is_active: Joi.number().required(),
    is_tool: Joi.number().required(),
    link: Joi.string().required(),
    icon: Joi.string().allow(null, ""),
    system_pages_id: Joi.number().allow(null, 0),
    is_public: Joi.number().required(),
    menu_type: Joi.number().required(),
  }),
  orderApplicationMenuPayload: Joi.object().keys({
    application_menu_id: Joi.number().required(),
    parent_application_menu_id: Joi.number().required(),
    site_id: Joi.number().required(),
    NewLocation: Joi.number().required(),
    menu_type: Joi.number().required(),
  }),
};
