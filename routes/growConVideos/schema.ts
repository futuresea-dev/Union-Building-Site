import Joi from 'joi';

export default {
    addEditGrowConVideoesPayload: Joi.object().keys({
        id: Joi.number().allow(null, 0),
        title: Joi.string().required(),
        video_url: Joi.string().required(),
        thumbnail_url: Joi.string().required(),
        grow_con_folder_id: Joi.number().optional().allow(null, 0),
        product_id: Joi.number().optional().allow(null, 0),
    }),
    removeGrowConVideoes: Joi.object().keys({
        id: Joi.number().required()
    }),
    getAllGrowConVideoes: Joi.object().keys({
        search: Joi.string().allow(null, "").allow(""),
        page_record: Joi.number().allow(),
        page_no: Joi.number().allow(),
        grow_con_folder_id: Joi.number().optional().allow(null, 0),
        is_from_admin: Joi.boolean().optional().allow(null, 0)
    }),

};
