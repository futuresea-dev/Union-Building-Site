import { Request, Response } from "express";
import { ErrorController } from "../core/ErrorController";
import { SuccessResponse } from "../core/ApiResponse";
import { BadRequestError, ApiError } from "../core/ApiError";
import moment from "moment";
const { dbReader, dbWriter } = require("../models/dbConfig");
const EC = new ErrorController();

export class ApplicationPageController {
  private readonly EC = new ErrorController();

  // Application Pages Tree View
  public async listAllApplicationPage(req: Request, res: Response) {
    try {
      //@ts-ignore
      let { site_id, menu_type } = req.body;
      // getting parent value
      let applicationPageData = await dbReader.applicationPage.findAll({
        where: { is_deleted: 0, site_id: site_id, menu_type: menu_type },
        order: ["sort_order"],
      });
      if (applicationPageData.length > 0) {
        let newApplicationMenuData = JSON.parse(
          JSON.stringify(applicationPageData)
        );

        console.log("newApplicationMenuData", newApplicationMenuData);
        let parentData = newApplicationMenuData.filter(
          (element: any) => element.parent_application_page_id === 0
        );
        let childData = newApplicationMenuData.filter(
          (element: any) => element.parent_application_page_id != 0
        );

        for (var j = 0; j < childData.length; j++) {
          childData[j].child_data = [];
          childData[j].child_data = childData.filter(
            (element: any) =>
              element.parent_application_page_id ===
              childData[j].application_page_id
          );
        }
        for (var i = 0; i < parentData.length; i++) {
          parentData[i].child_data = [];
          parentData[i].child_data = childData.filter(
            (element: any) =>
              element.parent_application_page_id ===
              parentData[i].application_page_id
          );
        }
        // console.log("applicationPageData", applicationPageData);
        new SuccessResponse(EC.success, {
          //@ts-ignore
          token: req.token,
          application_pages: parentData,
        }).send(res);
      } else {
        new SuccessResponse(EC.noDataFound, {
          //@ts-ignore
          token: req.token,
          application_pages: [],
        }).send(res);
      }
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  // Add & Update Application Page
  public async SaveApplicationPage(req: Request, res: Response) {
    try {
      let {
        application_page_id = 0,
        is_active = 0,
        application_page_title,
        link,
        icon,
        site_id,
        menu_type,
      } = req.body;
      if (application_page_id == 0) {
        let sort_count = await dbReader.applicationPage.count({
          where: {
            is_deleted: 0,
            site_id: site_id,
          },
        });

        await dbWriter.applicationPage.create({
          application_page_title,
          menu_type,
          link,
          icon,
          site_id,
          sort_order: sort_count + 1,
          is_active: 1,
          is_deleted: 0,
          parent_application_page_id: 0,
        });
      } else {
        await dbWriter.applicationPage.update(
          {
            application_page_title,
            link,
            icon,
            site_id,
            updated_datetime: moment().format("YYYY-MM-DD HH:mm:ss"),
          },
          {
            where: { application_page_id: application_page_id },
          }
        );
      }

      let msg = "Application Page has been updated successfully.";
      if (application_page_id == 0) {
        msg = "Application Page has been created successfully.";
      }
      new SuccessResponse(msg, {
        //@ts-ignore
        token: req.token,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
  // Application Menu delete
  public async deleteApplicationPages(req: Request, res: Response) {
    try {
      let { application_page_id, site_id } = req.body;

      await dbWriter.applicationPage.update(
        {
          is_deleted: 1,
          updated_datetime: moment().format("YYYY-MM-DD HH:mm:ss"),
        },
        {
          where: { application_page_id: application_page_id },
        }
      );

      // // Sort Order Other Records.
      // let sortData: any = await dbReader.applicationPage.findAndCountAll({
      //   attributes: ["application_page_id", "sort_order"],
      //   where: {
      //     is_deleted: 0,
      //     site_id: site_id,
      //   },
      //   order: ["sort_order"],
      // });

      // let responsedata;
      // if (sortData.count > 0) {
      //   sortData = JSON.parse(JSON.stringify(sortData));
      //   let tempObject = {};
      //   let tempArray = [];
      //   for (var i = 0; i < sortData.length; i++) {
      //     tempObject = {
      //       application_page_id: sortData.rows[i].application_page_id,
      //       sort_order: i,
      //     };

      //     tempArray.push(tempObject);
      //   }

      //   responsedata = await dbWriter.applicationMenu.bulkCreate(tempArray, {
      //     updateOnDuplicate: ["sort_order"],
      //   });
      //   responsedata = JSON.parse(JSON.stringify(responsedata));
      // }

      new SuccessResponse("Application menu has been deleted successfully.", {
        //@ts-ignore
        // token: req.token,
        // application_menu: responsedata,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
  // Order Application Pages
  public async orderApplicationPages(req: Request, res: Response) {
    try {
      let {
        application_page_id,
        NewLocation,
        site_id,
        parent_application_page_id,
        menu_type,
      } = req.body;
      // console.log(
      //   "data",
      //   application_page_id,
      //   NewLocation,
      //   site_id,
      //   parent_application_page_id,
      //   menu_type
      // );
      // Getting Current Sort Order
      let applicationMenuDataBasedOnMenuType =
        await dbReader.applicationPage.findAndCountAll({
          where: {
            is_deleted: 0,
            site_id: site_id,
            menu_type: menu_type,
          },
        });

      let tempObject = {};
      let tempArray = [];

      tempObject = {
        application_page_id: application_page_id,
        sort_order: NewLocation,
      };
      tempArray.push(tempObject);

      applicationMenuDataBasedOnMenuType = JSON.parse(
        JSON.stringify(applicationMenuDataBasedOnMenuType)
      );
      // console.log(
      //   "applicationMenuDataBasedOnMenuType",
      //   applicationMenuDataBasedOnMenuType
      // );

      let applicationMenuData = applicationMenuDataBasedOnMenuType.rows.filter(
        (element: any) =>
          element?.parent_application_page_id === parent_application_page_id
      );
      // console.log("applicationMenuData", applicationMenuData);
      // Getting Current Sort Order Of a Count

      let source = applicationMenuDataBasedOnMenuType.rows.filter(
        (element: any) => element.application_page_id === application_page_id
      );
      // console.log(
      //   "source",
      //   source,
      //   source[0]?.parent_application_page_id != parent_application_page_id
      // );

      //  if parent id
      if (source[0]?.parent_application_page_id != parent_application_page_id) {
        // console.log("One");
        await dbWriter.applicationPage.update(
          {
            parent_application_page_id: parent_application_page_id,
            sort_order: NewLocation,
            updated_datetime: moment().format("YYYY-MM-DD HH:mm:ss"),
          },
          {
            where: { application_page_id: application_page_id },
          }
        );
      } else {
        // console.log("two");
        // console.log("source--->", source, applicationMenuData);
        source = source[0].sort_order;

        for (var i = 0; i < applicationMenuData.count; i++) {
          // Now changing the sort order of elements based on source
          // All elements are in ascending order so we can easily change the sort order
          if (applicationMenuData[i].sort_order < source) {
            // Sort table order is less than source than +1
            if (applicationMenuData[i].sort_order >= NewLocation) {
              if (
                applicationMenuData[i].application_page_id !=
                application_page_id
              ) {
                tempObject = {
                  application_page_id:
                    applicationMenuData[i].application_page_id,
                  sort_order: applicationMenuData[i].sort_order + 1,
                };
                tempArray.push(tempObject);
              }
            }
          } else {
            if (applicationMenuData[i].sort_order <= NewLocation) {
              // Sort table order is greater than source than -1
              if (
                applicationMenuData[i].application_page_id !=
                application_page_id
              ) {
                tempObject = {
                  application_page_id:
                    applicationMenuData[i].application_page_id,
                  sort_order: applicationMenuData[i].sort_order - 1,
                };
                tempArray.push(tempObject);
              }
            }
          }
        }

        await dbWriter.applicationPage.bulkCreate(tempArray, {
          updateOnDuplicate: ["sort_order"],
        });
      }

      let newApplicationMenuData = await dbReader.applicationPage.findAll({
        // include: [
        //   {
        //     required: false,
        //     where: { is_deleted: 0, site_id: site_id },
        //     attributes: ["page_title"],
        //     model: dbReader.applicationPage,
        //     include: [
        //       {
        //         required: false,
        //         where: { is_deleted: 0, link_type: 1, site_id: site_id },
        //         model: dbReader.pageLink,
        //         attributes: ["target_url"],
        //       },
        //     ],
        //   },
        // ],
        where: { is_deleted: 0, site_id: site_id, menu_type: menu_type },
      });

      newApplicationMenuData = JSON.parse(
        JSON.stringify(newApplicationMenuData)
      );
      // console.log("newApplicationMenuData", newApplicationMenuData);
      let parentData = newApplicationMenuData.filter(
        (element: any) => element?.parent_application_page_id === 0
      );
      let childData = newApplicationMenuData.filter(
        (element: any) => element?.parent_application_page_id != 0
      );

      for (var j = 0; j < childData.length; j++) {
        childData[j].child_data = [];
        childData[j].child_data = childData.filter(
          (element: any) =>
            element?.parent_application_page_id ===
            childData[j].application_page_id
        );
      }
      for (var i = 0; i < parentData.length; i++) {
        parentData[i].child_data = [];
        parentData[i].child_data = childData.filter(
          (element: any) =>
            element?.parent_application_page_id ===
            parentData[i].application_page_id
        );
      }

      new SuccessResponse("Application Page sort order updated successfully.", {
        //@ts-ignore
        token: req.token,
        application_menu: parentData,
      }).send(res);
    } catch (err: any) {
      ApiError.handle(new BadRequestError(err.message), res);
    }
  }
}
