import { Request, Response } from "express";
import { array } from "joi";
import { ErrorController, SuccessResponse, BadRequestError, ApiError } from '../core/index';
const { dbReader, dbWriter } = require('../models/dbConfig');
const EC = new ErrorController();
import { v4 as uuidv4 } from "uuid";
const { Op } = dbReader.Sequelize;

export class PermissionProfileController {

    public recursivePermission(data: [], level: number) {
        var permissionData: any = [];
        data.filter((s: any) => s.parent_permission_id == level).forEach((element: any) => {
            element.json_value = (element.json_value) ? JSON.parse(element.json_value) : null
            element.menu_name = element.menu_name.replace(/(\r\n|\n|\r)/gm, "")
            permissionData.push({
                ...element,
                child_data: this.recursivePermission(data, element.permission_id),
            });
        });
        return permissionData
    }

    public async recursiveProfilePermission(permission_profile_id: number, permission_data: []) {
        let final_data: any = []
        let i = 0;
        while (permission_data.length > i) {
            let element: any = permission_data[i];
            final_data.push({
                parent_permission_id: element.parent_permission_id,
                permission_profile_id: permission_profile_id,
                menu_name: element.menu_name,
                json_value: JSON.stringify(element.json_value),
                original_permission_id: element.permission_id,
                updated_datetime: new Date()
            });
            if (element.child_data.length) {
                let _data = await this.recursiveProfilePermission(permission_profile_id, element.child_data);
                if (_data.length) {
                    final_data = final_data.concat(_data);
                }
            }
            i++;
        }
        return final_data;
    }

    public async recursivePermissionBulkCreate(added_master_menu_permission: any, permissions: any) {
        let _temp_opi: any = added_master_menu_permission.map((e: any) => e.original_permission_id);
        if (_temp_opi.length) {
            let master_menu_permission: any = permissions.filter((s: any) => _temp_opi.includes(s.parent_permission_id));
            master_menu_permission.forEach((ele: any) => {
                if (added_master_menu_permission.some((s: any) => s.original_permission_id == ele.parent_permission_id)) {
                    ele.parent_permission_id = added_master_menu_permission.find((s: any) => s.original_permission_id == ele.parent_permission_id).permission_id;
                }
            });
            if (master_menu_permission.length) {
                let added_master_menu_permission = await dbWriter.permissions.bulkCreate(master_menu_permission);
                let curObj = new PermissionProfileController();
                await curObj.recursivePermissionBulkCreate(added_master_menu_permission, permissions);
            }
        }

    }

    public async getMasterPermissions(req: Request, res: Response) {
        try {
            let masterPermissionData = await dbReader.permissions.findAll({ where: { is_deleted: 0, permission_profile_id: 0 }, attributes: ['permission_id', 'uuid', 'parent_permission_id', 'permission_profile_id', 'menu_name', 'json_value', 'original_permission_id'] });
            masterPermissionData = JSON.parse(JSON.stringify(masterPermissionData))
            var curObj = new PermissionProfileController();
            masterPermissionData = curObj.recursivePermission(masterPermissionData, 0);
            new SuccessResponse(EC.listOfData, {
                //@ts-ignore
                token: req.token,
                data: masterPermissionData
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async addPermissionProfile(title: string, role_id: string, permission_data: []) {
        var profile = await dbWriter.permissionProfile.create({
            title: title,
            role_id: role_id,
            is_deleted: 0,
        });
        let curObj = new PermissionProfileController();

        let permissions: any = await curObj.recursiveProfilePermission(profile.permission_profile_id, permission_data);

        if (permissions.length) {
            let master_menu_permission = permissions.filter((s: any) => s.parent_permission_id == 0);
            let added_master_menu_permission = await dbWriter.permissions.bulkCreate(master_menu_permission);
            await curObj.recursivePermissionBulkCreate(added_master_menu_permission, permissions);
        }
    }

    public async PermissionProfile(req: Request, res: Response) {
        try {
            let { permission_profile_id } = req.params

            if (permission_profile_id) {
                let profileDetail = await dbReader.permissionProfile.findOne({
                    where: {
                        permission_profile_id: permission_profile_id,
                        is_deleted: 0
                    },
                    attributes: ['permission_profile_id', 'title', 'role_id']
                });
                let permissionDetail = await dbReader.permissions.findAll({
                    where: {
                        permission_profile_id: permission_profile_id,
                        is_deleted: 0
                    },
                    attributes: ['permission_id', 'uuid', 'parent_permission_id', 'permission_profile_id', 'original_permission_id', "menu_name", 'json_value']
                });

                permissionDetail = JSON.parse(JSON.stringify(permissionDetail));

                var curObj = new PermissionProfileController();

                permissionDetail = curObj.recursivePermission(permissionDetail, 0);
                if (profileDetail) {
                    new SuccessResponse(EC.success, {
                        //@ts-ignore
                        token: req.token,
                        profile_data: profileDetail,
                        permission_data: permissionDetail
                    }).send(res);
                } else {
                    throw new Error(EC.errorMessage(EC.ProfileDataNotFound));
                }
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async PermissionProfileList(req: Request, res: Response) {
        try {
            let PermissionProfileData = await dbReader.permissionProfile.findAll({
                where: {
                    is_deleted: 0,
                },
                attributes: ['permission_profile_id', 'title', 'role_id'],
                order: [['permission_profile_id', 'DESC']]
            });

            PermissionProfileData = JSON.parse(JSON.stringify(PermissionProfileData));

            new SuccessResponse(EC.listOfData, {
                //@ts-ignore
                token: req.token,
                data: PermissionProfileData
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async deletePermissionProfile(req: Request, res: Response) {
        try {
            let { permission_profile_id } = req.params;
            if (permission_profile_id) {
                let profileDetail = await dbReader.permissionProfile.findOne({
                    where: {
                        permission_profile_id: permission_profile_id,
                        is_deleted: 0
                    },
                    attributes: ['permission_profile_id']
                })
                if (profileDetail) {
                    await dbWriter.permissionProfile.update({ is_deleted: 1, updated_datetime: new Date() }, {
                        where: {
                            permission_profile_id: permission_profile_id
                        }
                    });
                    await dbWriter.permissions.update({ is_deleted: 1, updated_datetime: new Date() }, {
                        where: {
                            permission_profile_id: permission_profile_id
                        }
                    });
                    new SuccessResponse(EC.deleteDataSuccess, {
                        //@ts-ignore
                        token: req.token
                    }).send(res);
                } else {
                    throw new Error(EC.errorMessage(EC.ProfileDataNotFound));
                }
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async addupdateProfilePermission(req: Request, res: Response) {
        try {
            let curObj = new PermissionProfileController();
            let { title, role_id, permission_data, permission_profile_id } = req.body
            let permission_ids: any = []
            /* update profile flow */
            if (permission_profile_id) {
                let findProfile = await dbReader.permissionProfile.findOne({
                    where: { permission_profile_id: permission_profile_id, is_deleted: 0 },
                    attributes: ['permission_profile_id']
                })
                if (findProfile) {
                    await dbWriter.permissionProfile.update({
                        title: title,
                        role_id: role_id
                    }, {
                        where: {
                            permission_profile_id: permission_profile_id
                        }
                    })
                    if (permission_data.length) {
                        let json_value = "case permission_id",
                            is_deleted = "case permission_id",
                            edit_uuid_1 = "case permission_id",
                            edit_uuid_2 = "case permission_id",
                            master_permissions_data: any = [],
                            permissions_data: any = [],
                            permissions_data_2: any = [];
                        permission_data.forEach((element: any) => {
                            let uuid = uuidv4();
                            let permission_id = element.permission_id
                            if (element.permission_profile_id != 0) {
                                permission_ids.push(element.permission_id);
                                json_value += " when " + element.permission_id + " then '" + JSON.stringify(element.json_value) + "'";
                                is_deleted += " when " + element.permission_id + " then 0 ";
                                edit_uuid_1 += " when " + element.permission_id + " then '" + uuid + "'";
                                edit_uuid_2 += " when " + element.permission_id + " then '0'";
                            } else {
                                master_permissions_data.push({
                                    uuid: uuid,
                                    parent_permission_id: 0,
                                    original_permission_id: element.permission_id,
                                    permission_profile_id: permission_profile_id,
                                    menu_name: element.menu_name,
                                    json_value: (element.json_value) ? JSON.stringify(element.json_value) : ''
                                })
                            }
                            if (element.child_data) {
                                element.child_data.forEach((element1: any) => {
                                    let uuid_2 = uuidv4();
                                    if (element1.child_data) {
                                        element1.child_data.forEach((element2: any) => {
                                            if (element2.permission_profile_id != 0) {
                                                permission_ids.push(element2.permission_id);
                                                json_value += " when " + element2.permission_id + " then '" + JSON.stringify(element2.json_value) + "'";
                                                is_deleted += " when " + element2.permission_id + " then 0 ";
                                                edit_uuid_1 += " when " + element.permission_id + " then '" + uuid + "'";
                                                edit_uuid_2 += " when " + element.permission_id + " then '" + uuid_2 + "'";
                                            } else {
                                                permissions_data_2.push({
                                                    uuid: uuid_2,
                                                    parent_permission_id: permission_id,
                                                    original_permission_id: element2.permission_id,
                                                    permission_profile_id: permission_profile_id,
                                                    menu_name: element2.menu_name,
                                                    json_value: (element2.json_value) ? JSON.stringify(element2.json_value) : ''
                                                })
                                            }
                                        });
                                    }
                                    // else{
                                    if (element1.permission_profile_id != 0) {
                                        permission_ids.push(element1.permission_id);
                                        json_value += " when " + element1.permission_id + " then '" + JSON.stringify(element1.json_value) + "'";
                                        is_deleted += " when " + element1.permission_id + " then 0 ";
                                        edit_uuid_1 += " when " + element.permission_id + " then '" + uuid + "'";
                                        edit_uuid_2 += " when " + element.permission_id + " then '" + uuid_2 + "'";
                                    } else {
                                        permissions_data.push({
                                            uuid: uuid,
                                            uuid_2: uuid_2,
                                            parent_permission_id: permission_id,
                                            original_permission_id: element1.permission_id,
                                            permission_profile_id: permission_profile_id,
                                            menu_name: element1.menu_name,
                                            json_value: (element1.json_value) ? JSON.stringify(element1.json_value) : ''
                                        })
                                    }
                                    // }
                                });
                            }
                        });
                        if (permission_ids.length) {
                            json_value += " else json_value end";
                            is_deleted += " else 1 end";
                            edit_uuid_1 += " else uuid end";
                            edit_uuid_2 += " else uuid_2 end";
                            await dbWriter.permissions.update({
                                json_value: dbWriter.Sequelize.literal(json_value),
                                updated_datetime: new Date(),
                                is_deleted: dbWriter.Sequelize.literal(is_deleted),
                                uuid: dbWriter.Sequelize.literal(edit_uuid_1),
                                uuid_2: dbWriter.Sequelize.literal(edit_uuid_2),
                            }, {
                                where: { permission_id: { [dbReader.Sequelize.Op.in]: permission_ids } }
                            });
                        }
                        if (master_permissions_data.length) {
                            let MD = await dbWriter.permissions.bulkCreate(master_permissions_data)
                            permissions_data.forEach((element: any) => {
                                if (MD.some((s: any) => s.uuid == element.uuid)) {
                                    element.parent_permission_id = MD.find((s: any) => s.uuid == element.uuid).permission_id
                                }
                            });
                        }
                        if (permissions_data.length) {
                            let MD_2 = await dbWriter.permissions.bulkCreate(permissions_data)
                            permissions_data_2.forEach((element: any) => {
                                if (MD_2.some((s: any) => s.uuid_2 == element.uuid)) {
                                    element.parent_permission_id = MD_2.find((s: any) => s.uuid_2 == element.uuid).permission_id
                                }
                            });
                            if (permissions_data_2.length) {
                                await dbWriter.permissions.bulkCreate(permissions_data_2)
                            }
                        }
                    }
                } else {
                    throw new Error(EC.errorMessage(EC.ProfileDataNotFound));
                }
            } else {
                // Add New Profile Flow
                curObj.addPermissionProfile(title, role_id, permission_data)
            }
            new SuccessResponse(EC.updatedDataSuccess, {
                //@ts-ignore
                token: req.token
            }).send(res);
        } catch (e: any) {
            console.log(e);
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
}
