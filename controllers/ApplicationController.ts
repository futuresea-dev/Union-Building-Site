import { Request, Response } from "express";
import { ErrorController } from "../core/ErrorController";
import { enumerationController } from "../controllers/enumerationController";
import { SuccessResponse } from '../core/ApiResponse';
import { BadRequestError, ApiError } from '../core/ApiError';
import moment from "moment";
const { dbReader, dbWriter } = require('../models/dbConfig');
const EC = new ErrorController();
const enumObj = new enumerationController();

export class ApplicationController {

    // Tree structure
    public async treeMenu(data: any, level: number) {
        let returnData: any = [];
        data.filter((s: any) => s.parent_application_menu_id == level).forEach(async (element: any) => {
            returnData.push({
                ...element,
                child_data: await this.treeMenu(data, element.application_menu_id),
            });
        });
        return returnData;
    }

    // Application Menu Tree View
    public async listAllApplicationMenu(req: Request, res: Response) {
        try {
            //@ts-ignore
            let { user_id = 0 } = req;
            let curObj = new ApplicationController();
            let { site_id, menu_type } = req.body;
            // getting parent value
            let applicationMenuData = await dbReader.applicationMenu.findAll({
                include: [{
                    required: false,
                    where: { is_deleted: 0, site_id: site_id },
                    attributes: ["page_title"],
                    model: dbReader.systemPages,
                    include: [{
                        required: false,
                        where: { is_deleted: 0, link_type: 1, site_id: site_id },
                        model: dbReader.pageLink,
                        attributes: ["target_url"]
                    }]
                }],
                where: { is_deleted: 0, site_id: site_id, menu_type: menu_type },
                order: ['sort_order']
            });
            if (applicationMenuData.length > 0) {
                applicationMenuData = JSON.parse(JSON.stringify(applicationMenuData));

                let parentData = applicationMenuData.filter((element: any) => element.parent_application_menu_id === 0);
                let childData = applicationMenuData.filter((element: any) => element.parent_application_menu_id != 0);

                for (var j = 0; j < childData.length; j++) {
                    childData[j].child_data = [];
                    childData[j].child_data = childData.filter((element: any) => element.parent_application_menu_id === childData[j].application_menu_id);
                }
                for (var i = 0; i < parentData.length; i++) {
                    parentData[i].child_data = [];
                    parentData[i].child_data = childData.filter((element: any) => element.parent_application_menu_id === parentData[i].application_menu_id);
                }

                if (menu_type == 3 && site_id == 2 && user_id) {
                    let i = 0;
                    while (i < parentData.length) {
                        if (enumObj.siteUrlEnum.get(parentData[i].link)) {
                            let site_id = enumObj.siteUrlEnum.get(parentData[i].link).value;
                            let subscription = await dbReader.userSubscription.findOne({
                                attributes: ["user_subscription_id"],
                                where: { site_id: site_id, user_id: user_id, subscription_status: [2, 4] },
                            });
                            parentData[i].is_more_stuff = subscription ? false : true;
                        } else {
                            parentData[i].is_more_stuff = true;
                        }
                        i++;
                    }
                }

                new SuccessResponse(EC.success, {
                    //@ts-ignore
                    token: req.token,
                    application_menu: parentData
                }).send(res);
            } else {
                new SuccessResponse(EC.noDataFound, {
                    //@ts-ignore
                    token: req.token,
                    application_menu: []
                }).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    // Application Menu delete
    public async deleteApplicationMenu(req: Request, res: Response) {
        try {

            let { application_menu_id, parent_application_menu_id, site_id } = req.body;

            await dbWriter.applicationMenu.update({
                is_deleted: 1,
                updated_datetime: moment().format("YYYY-MM-DD HH:mm:ss")
            }, {
                where: { application_menu_id: application_menu_id }
            });

            // Sort Order Other Records.
            let sortData: any = await dbReader.applicationMenu.findAndCountAll({
                attributes: ['application_menu_id', 'sort_order'],
                where: { parent_application_menu_id: parent_application_menu_id, is_deleted: 0, site_id: site_id },
                order: ['sort_order']
            });

            let responsedata;
            if (sortData.count > 0) {
                sortData = JSON.parse(JSON.stringify(sortData));
                let tempObject = {};
                let tempArray = [];
                for (var i = 0; i < sortData.length; i++) {
                    tempObject = {
                        application_menu_id: sortData.rows[i].application_menu_id,
                        sort_order: i
                    }

                    tempArray.push(tempObject);
                }

                responsedata = await dbWriter.applicationMenu.bulkCreate(tempArray, { updateOnDuplicate: ["sort_order"] });
                responsedata = JSON.parse(JSON.stringify(responsedata));
            }


            new SuccessResponse("Application menu has been deleted successfully.", {
                //@ts-ignore
                token: req.token,
                application_menu: responsedata
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    // Application Menu Status Update
    public async StatusApplicationMenu(req: Request, res: Response) {
        try {

            let { application_menu_id, is_active = 0 } = req.body;
            await dbWriter.applicationMenu.update({
                is_active: is_active,
                updated_datetime: moment().format("YYYY-MM-DD HH:mm:ss")
            }, {
                where: { application_menu_id: application_menu_id }
            });
            let msg = "Application menu has been activated successfully."
            if (is_active == 0) {
                msg = "Application menu has been de activated successfully."
            }
            new SuccessResponse(msg, {
                //@ts-ignore
                token: req.token
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    // Add & Update Application Menu
    public async SaveApplicationMenu(req: Request, res: Response) {
        try {
            let { application_menu_id = 0, is_active = 0, is_tool = 0, application_menu_title, parent_application_menu_id, site_id, link, is_public, icon, menu_type, system_pages_id = 0 } = req.body;
            if (application_menu_id == 0) {
                let sort_count = await dbReader.applicationMenu.count({
                    where: { parent_application_menu_id: parent_application_menu_id, is_deleted: 0, site_id: site_id }
                });
                if (menu_type == 4) {
                    await dbWriter.applicationMenu.create({
                        application_menu_title: application_menu_title,
                        parent_application_menu_id: 0,
                        site_id: site_id,
                        icon: icon || '',
                        link: link,
                        system_pages_id: 0,
                        is_public: 0,
                        sort_order: sort_count + 1,
                        is_active: 0,
                        is_tool: is_tool,
                        menu_type: menu_type,
                        created_datetime: new Date()
                    })
                }
                else {
                    await dbWriter.applicationMenu.create({
                        application_menu_title: application_menu_title,
                        parent_application_menu_id: parent_application_menu_id,
                        site_id: site_id,
                        icon: icon || '',
                        link: link,
                        system_pages_id: system_pages_id,
                        is_public: is_public,
                        sort_order: sort_count + 1,
                        is_active: is_active,
                        is_tool: is_tool,
                        menu_type: menu_type,
                        created_datetime: new Date()
                    })
                }
            }
            else {
                if (menu_type == 4) {
                    await dbWriter.applicationMenu.update({
                        application_menu_title: application_menu_title,
                        parent_application_menu_id: 0,
                        site_id: site_id,
                        icon: icon || '',
                        link: link,
                        system_pages_id: 0,
                        is_public: 0,
                        is_active: 0,
                        is_tool: is_tool,
                        menu_type: menu_type,
                        updated_datetime: moment().format("YYYY-MM-DD HH:mm:ss")
                    },
                        {
                            where: { application_menu_id: application_menu_id }
                        })
                } else {
                    await dbWriter.applicationMenu.update({
                        application_menu_title: application_menu_title,
                        parent_application_menu_id: parent_application_menu_id,
                        site_id: site_id,
                        icon: icon || '',
                        link: link,
                        system_pages_id: system_pages_id,
                        is_public: is_public,
                        is_active: is_active,
                        is_tool: is_tool,
                        menu_type: menu_type,
                        updated_datetime: moment().format("YYYY-MM-DD HH:mm:ss")
                    }, {
                        where: { application_menu_id: application_menu_id }
                    });
                }

            }
            let msg = "Application menu has been updated successfully."
            if (application_menu_id == 0) {
                msg = "Application menu has been created successfully."
            }
            new SuccessResponse(msg, {
                //@ts-ignore
                token: req.token
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    // Order Application Menu
    public async orderApplicationMenu(req: Request, res: Response) {
        try {
            let { application_menu_id, NewLocation, site_id, parent_application_menu_id, menu_type } = req.body;


            // Getting Current Sort Order 
            let applicationMenuData = await dbReader.applicationMenu.findAndCountAll({
                where: { is_deleted: 0, site_id: site_id, parent_application_menu_id: parent_application_menu_id, menu_type: menu_type },
            });



            let tempObject = {};
            let tempArray = [];

            tempObject = {
                application_menu_id: application_menu_id,
                sort_order: NewLocation
            }
            tempArray.push(tempObject);

            applicationMenuData = JSON.parse(JSON.stringify(applicationMenuData));
            // Getting Current Sort Order Of a Count
            let source = applicationMenuData.rows.filter((element: any) => element.application_menu_id === application_menu_id);
            source = source[0].sort_order;

            for (var i = 0; i < applicationMenuData.count; i++) {
                // Now changing the sort order of elements based on source
                // All elements are in ascending order so we can easily change the sort order
                if (applicationMenuData.rows[i].sort_order < source) {
                    // Sort table order is less than source than +1
                    if (applicationMenuData.rows[i].sort_order >= NewLocation) {

                        if (applicationMenuData.rows[i].application_menu_id != application_menu_id) {
                            tempObject = {
                                application_menu_id: applicationMenuData.rows[i].application_menu_id,
                                sort_order: applicationMenuData.rows[i].sort_order + 1
                            };
                            tempArray.push(tempObject);
                        }
                    }
                }
                else {
                    if (applicationMenuData.rows[i].sort_order <= NewLocation) {
                        // Sort table order is greater than source than -1
                        if (applicationMenuData.rows[i].application_menu_id != application_menu_id) {
                            tempObject = {
                                application_menu_id: applicationMenuData.rows[i].application_menu_id,
                                sort_order: applicationMenuData.rows[i].sort_order - 1
                            };
                            tempArray.push(tempObject);
                        }
                    }


                }
            }


            await dbWriter.applicationMenu.bulkCreate(tempArray,
                { updateOnDuplicate: ["sort_order"] }
            );

            let newApplicationMenuData = await dbReader.applicationMenu.findAll({
                include: [{
                    required: false,
                    where: { is_deleted: 0, site_id: site_id },
                    attributes: ["page_title"],
                    model: dbReader.systemPages,
                    include: [{
                        required: false,
                        where: { is_deleted: 0, link_type: 1, site_id: site_id },
                        model: dbReader.pageLink,
                        attributes: ["target_url"]
                    }]
                }],
                where: { is_deleted: 0, site_id: site_id, menu_type: menu_type },
            });

            newApplicationMenuData = JSON.parse(JSON.stringify(newApplicationMenuData));

            let parentData = newApplicationMenuData.filter((element: any) => element.parent_application_menu_id === 0);
            let childData = newApplicationMenuData.filter((element: any) => element.parent_application_menu_id != 0);

            for (var j = 0; j < childData.length; j++) {
                childData[j].child_data = [];
                childData[j].child_data = childData.filter((element: any) => element.parent_application_menu_id === childData[j].application_menu_id);
            }
            for (var i = 0; i < parentData.length; i++) {
                parentData[i].child_data = [];
                parentData[i].child_data = childData.filter((element: any) => element.parent_application_menu_id === parentData[i].application_menu_id);
            }


            new SuccessResponse("Application menu sort order updated successfully.", {
                //@ts-ignore
                token: req.token,
                application_menu: parentData
            }).send(res);
        } catch (err: any) {
            ApiError.handle(new BadRequestError(err.message), res);
        }
    }
}
