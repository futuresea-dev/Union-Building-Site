import Joi from "joi";
export default {
    saveGeoConfig: Joi.object().keys({
        // geo_config_id: Joi.number().required(),
        // // geo_pin_id: Joi.number().required(),
        // geo_pin_title: Joi.string().required(),
        // geo_pin_color: Joi.string().required(),
        geo_color_data: Joi.array().items({
            geo_config_id: Joi.number().required(),
            geo_pin_color: Joi.string().required(),
            is_active: Joi.number().allow(),
        }).required(),
    }),
};
