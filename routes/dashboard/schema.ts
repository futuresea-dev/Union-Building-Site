import Joi from 'joi';
import { ErrorController } from '../../core/index';
const EC = new ErrorController();

export default {
  listsignupMetricReport: Joi.object().keys({
    page_no: Joi.number().allow("", null),
    page_record: Joi.number().allow("", null),
    siteConfigId: Joi.number().allow("", null),
    range: Joi.object().keys({
      start_date: Joi.string(),
      end_date: Joi.string()
    }),
    converted: Joi.number().allow("", null),
    purchased_converted: Joi.number().allow("", null),
  }),

  listsignupGraphMetricReport: Joi.object().keys({
    by: Joi.string().allow("", null),
    siteConfigId: Joi.number().allow("", null),
    range: Joi.object().keys({
      start_date: Joi.string(),
      end_date: Joi.string()
    }),
  }),

  signupCampaignReport: Joi.object().keys({
    search: Joi.string().allow("", null),
    range: Joi.object().keys({
      start_date: Joi.string(),
      end_date: Joi.string()
    }),
    page_no: Joi.number().allow("", null),
    page_record: Joi.number().allow("", null),
  }),

  dashbordwidget: Joi.object().keys({
    dashbord_widget_id: Joi.number().allow("", null),
    image_url: Joi.string().allow("", null),
    image_type: Joi.number().allow("", null),
    title: Joi.string().allow("", null),
    btn_title: Joi.string().allow("", null),
    btn_link: Joi.string().allow("", null),
    btn_color: Joi.string().allow("", null),
    btn_icon_link: Joi.string().allow("", null),
    btn_text_color: Joi.string().allow("", null),
    background_texture_image: Joi.string().allow("", null),
    background_color: Joi.string().allow("", null),
    btn_image: Joi.string().allow("", null),
    background_top_texture_image: Joi.string().allow("", null),
    background_bottom_texture_image: Joi.string().allow("", null),
  }),
};
