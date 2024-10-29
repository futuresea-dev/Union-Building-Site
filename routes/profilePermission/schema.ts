/*
    * Code done by Darshit - 26-01-2022
    * create schema for profile_permission_detail validation 
*/
import Joi from 'joi';
import { ErrorController } from "../../core/ErrorController";
const EC = new ErrorController();

export default {
    addPermissionDetail: Joi.object().keys({
        title: Joi.string().required(),
        role_id: Joi.number().required(),
        permission_profile_id:Joi.string().required(),
        permission_data: Joi.array().required(),
    }),
    PermissionProfile:Joi.object().keys({
        permission_profile_id:Joi.string().required()
    }),
    deletePermissionProfile:Joi.object().keys({
        permission_profile_id:Joi.string().required()
    }),
    addupdateProfilePermission: Joi.object().keys({
        title: Joi.string().required(),
        role_id: Joi.number().required(),
        permission_profile_id: Joi.number().required(),
        permission_data: Joi.array().required(),
    }),
}