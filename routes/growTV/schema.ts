import Joi from "joi";
export default {
  saveTvCategory: Joi.object().keys({
    // Temporarily passing 0 in parent category id
    parent_category_id: Joi.number().default(0),
    category_id: Joi.number().default(0),
    category_title: Joi.string().required(),
    category_image: Joi.string().allow(null, ""),
  }),

  deleteTvCategory: Joi.object().keys({
    category_id: Joi.number().required(),
  }),

  listTvCategory: Joi.object().keys({
    sort_order: Joi.string().allow(null, "", 0),
    sort_field: Joi.string().allow(null, "", 0),
    page_no: Joi.number().allow(null, "", 0),
    page_record: Joi.number().allow(null, "", 0),
    search: Joi.string().allow(null, "", 0),
  }),

  saveVideo: Joi.object().keys({
    grow_tv_id: Joi.number().default(0),
    volume_id: Joi.number().required(),
    ministry_type_id: Joi.number().required(),
    series_id: Joi.number().required(),
    tv_category_id: Joi.number().required(),
    parent_category_id:  Joi.number().required(),
    video_title: Joi.string().required(),
    thumbnail_image: Joi.string().allow(null, ""),
    video_url: Joi.string().required(),
    is_deleted: Joi.number().default(0),
    duration: Joi.string().required(),
 }),

  deleteVideo: Joi.object().keys({
    grow_tv_id: Joi.number().allow(null, "", 0),
    series_id: Joi.number().allow(null, "", 0),
    ministry_type_id: Joi.number().allow(null, "", 0),
    volume_id: Joi.number().allow(null, "", 0),
  }),

  listTvVideo: Joi.object().keys({
    sort_order: Joi.string().allow(null, "", 0),
    sort_field: Joi.string().allow(null, "", 0),
    page_no: Joi.number().allow(null, "", 0),
    page_record: Joi.number().allow(null, "", 0),
    search: Joi.string().allow(null, "", 0),
    series_id: Joi.number().allow("", null),
    ministry_type_id: Joi.number().allow("", null),
    volume_id: Joi.number().allow("", null),
  }),
  listTvCategoryVideoPayload: Joi.object().keys({
    category_id: Joi.number().allow("", null),
    sort_order: Joi.string().allow("", null),
    sort_field: Joi.string().allow("", null),
    page_no: Joi.number().allow("", null),
    page_record: Joi.number().allow("", null),
    search: Joi.string().allow("", null),
    filterdata: Joi.string().allow("", null),
    filtervolume: Joi.string().allow("", null),
  }),
  categorySortOrder: Joi.object().keys({
    category_id: Joi.number().required(),
    new_sort_order: Joi.number().required(),
  }),
  listCategoryMeta: Joi.object().keys({
    category_id: Joi.number().required(),
  }),
  listAllVideo: Joi.object().keys({
    category_id: Joi.number().allow("", null),
    tv_category_id: Joi.number().allow("", null),
    video_series_category_id: Joi.number().allow("", null),
    video_volume_category_id: Joi.number().allow("", null),
    sort_order: Joi.string().allow("", null),
    sort_field: Joi.string().allow("", null),
    page_no: Joi.number().allow("", null),
    page_record: Joi.number().allow("", null),
    search: Joi.string().allow("", null),
    filterdata: Joi.string().allow("", null),
    filtervolume: Joi.string().allow("", null),
  }),
};
