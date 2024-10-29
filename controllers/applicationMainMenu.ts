import { Request, Response } from "express";
import { ErrorController } from "../core/ErrorController";
import { SuccessResponse } from "../core/ApiResponse";
import { BadRequestError, ApiError } from "../core/ApiError";
import moment from "moment";
const { dbReader, dbWriter } = require("../models/dbConfig");
const EC = new ErrorController();

export class ApplicationMainMenuController {
  private readonly EC = new ErrorController();

  // Application Menu Tree View
  public async listAllApplicationMainMenu(req: Request, res: Response) {
    try {
      //@ts-ignore
      let { site_id } = req.body;
      // getting parent value
      let applicationMenuData = await dbReader.applicationMainMenu.findAll({
        where: { is_deleted: 0, site_id: site_id },
        order: ["sort_order"],
      });
      if (applicationMenuData.length > 0) {
        applicationMenuData = JSON.parse(JSON.stringify(applicationMenuData));

        new SuccessResponse(EC.success, {
          //@ts-ignore
          token: req.token,
          application_main_menu: applicationMenuData,
        }).send(res);
      } else {
        new SuccessResponse(EC.noDataFound, {
          //@ts-ignore
          token: req.token,
          application_main_menu: [],
        }).send(res);
      }
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  // Add & Update Application Menu
  public async SaveApplicationMainMenu(req: Request, res: Response) {
    try {
      let {
        application_menu_id = 0,
        is_active = 0,
        application_menu_title,
        site_id,
      } = req.body;
      if (application_menu_id == 0) {
        let sort_count = await dbReader.applicationMainMenu.count({
          where: {
            is_deleted: 0,
            site_id: site_id,
          },
        });

        await dbWriter.applicationMainMenu.create({
          application_menu_title,
          site_id,
          sort_order: sort_count + 1,
          is_active: 1,
          is_deleted: 0,
        });
      } else {
        await dbWriter.applicationMainMenu.update(
          {
            application_menu_title,
            site_id,
            updated_datetime: moment().format("YYYY-MM-DD HH:mm:ss"),
          },
          {
            where: { application_menu_id: application_menu_id },
          }
        );
      }

      let msg = "Application Menu has been updated successfully.";
      if (application_menu_id == 0) {
        msg = "Application Menu has been created successfully.";
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
  public async deleteApplicationMainMenu(req: Request, res: Response) {
    try {
      let { application_menu_id } = req.body;

      await dbWriter.applicationMainMenu.update(
        {
          is_deleted: 1,
          updated_datetime: moment().format("YYYY-MM-DD HH:mm:ss"),
        },
        {
          where: { application_menu_id: application_menu_id },
        }
      );
      await dbWriter.applicationPage.update(
        {
          is_deleted: 1,
          updated_datetime: moment().format("YYYY-MM-DD HH:mm:ss"),
        },
        {
          where: { menu_type: application_menu_id },
        }
      );

      new SuccessResponse(
        "Application Main Menu has been deleted successfully.",
        {
          //@ts-ignore
          // token: req.token,
          // application_menu: responsedata,
        }
      ).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
  // // Application Menu delete
  // public async deleteApplicationMainMenu(req: Request, res: Response) {
  //   try {
  //     let { application_menu_id, site_id } = req.body;

  //     await dbWriter.applicationMainMenu.update(
  //       {
  //         is_deleted: 1,
  //         updated_datetime: moment().format("YYYY-MM-DD HH:mm:ss"),
  //       },
  //       {
  //         where: { application_menu_id: application_menu_id },
  //       }
  //     );

  //     // Sort Order Other Records.
  //     let sortData: any = await dbReader.applicationMainMenu.findAndCountAll({
  //       attributes: ["application_menu_id", "sort_order"],
  //       where: {
  //         is_deleted: 0,
  //         site_id: site_id,
  //       },
  //       order: ["sort_order"],
  //     });

  //     let responsedata;
  //     if (sortData.count > 0) {
  //       sortData = JSON.parse(JSON.stringify(sortData));
  //       let tempObject = {};
  //       let tempArray = [];
  //       for (var i = 0; i < sortData.length; i++) {
  //         tempObject = {
  //           application_menu_id: sortData.rows[i].application_menu_id,
  //           sort_order: i,
  //         };

  //         tempArray.push(tempObject);
  //       }

  //       responsedata = await dbWriter.applicationMenu.bulkCreate(tempArray, {
  //         updateOnDuplicate: ["sort_order"],
  //       });
  //       responsedata = JSON.parse(JSON.stringify(responsedata));
  //     }

  //     new SuccessResponse("Application menu has been deleted successfully.", {
  //       //@ts-ignore
  //       token: req.token,
  //       application_menu: responsedata,
  //     }).send(res);
  //   } catch (e: any) {
  //     ApiError.handle(new BadRequestError(e.message), res);
  //   }
  // }
}
