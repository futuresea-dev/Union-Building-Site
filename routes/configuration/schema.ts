import Joi from 'joi';
import { ErrorController } from '../../core/index';
const EC = new ErrorController();

export default {
    listThirdPartyServiceDataPayload: Joi.object().keys({
        site_id: Joi.number().required()    }),
    updateSystemConfiguration: Joi.object().keys({
        // android_app_version: Joi.number().required().messages({
        //     "any.required": EC.androidAppVersion
        // }),
        // android_force_update: Joi.number().required().messages({
        //     "any.required": EC.androidForceUpdate
        // }),
        // ios_app_version: Joi.number().required().messages({
        //     "any.required": EC.iosAppVersion
        // }),
        // ios_force_update: Joi.string().required().messages({
        //     "any.required": EC.iosForceUpdate
        // }),
        android_app_version: Joi.number().allow(0,null).messages({
            "any.required": EC.androidAppVersion
        }),
        android_force_update: Joi.number().allow(0,null).messages({
            "any.required": EC.androidForceUpdate
        }),
        roku_app_version: Joi.number().allow(0,null).messages({
            "any.required": EC.rokuappversion
        }),
        roku_force_update: Joi.number().allow(0,null).messages({
            "any.required": EC.rokuforceupdate
        }),
        ios_app_version: Joi.number().allow(0,null).messages({
            "any.required": EC.iosAppVersion
        }),
        ios_force_update: Joi.number().allow(0,null).messages({
            "any.required": EC.iosForceUpdate
        }),
        privacy_policy: Joi.string().allow("",null).messages({
            "any.required": EC.iosForceUpdate
        }),
        terms_and_conditions: Joi.string().allow("",null).messages({
            "any.required": EC.iosForceUpdate
        }),
        return_policy: Joi.string().allow("",null).messages({
            "any.required": EC.iosForceUpdate
        }),
        payment_policy: Joi.string().allow("",null).messages({
            "any.required": EC.iosForceUpdate
        }),
        system_configuration_id: Joi.number().required().messages({
            "any.required": EC.systemConfigurationId
        }),
        about_us: Joi.string().allow("",null),
        
        site_id: Joi.number().required().messages({
            "any.required": EC.siteIdRequired
        }),
         apple_tv_app_version: Joi.string().allow("", null).messages({
            "any.required": EC.errorMessage(EC.required, [" Apple tv version "]),
        }),
        apple_tv_force_update: Joi.number().allow(0, null).messages({
            "any.required": EC.errorMessage(EC.required, [" Apple tv force update "]),
        }),
        amazon_fire_stick_app_version: Joi.string().allow("", null).messages({
            "any.required": EC.errorMessage(EC.required, [" Amazon fire stick version "]),
        }),
        amazon_fire_stick_force_update: Joi.number().allow(0, null).messages({
            "any.required": EC.errorMessage(EC.required, [" Amazon fire stick force update "]),
        }),
    }),
    getSystemConfigurationPayload:Joi.object().keys({
     
        site_id: Joi.number().required(),
        data_for :Joi.string().allow("",null)
    })
};
