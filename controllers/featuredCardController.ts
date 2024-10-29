//SA 22-12-2021

import { Request, Response } from "express";
import {
  ErrorController,
  SuccessResponse,
  BadRequestError,
  ApiError,
} from "../core/index";
const { dbReader, dbWriter } = require("../models/dbConfig");

const EC = new ErrorController();

export class FeaturedCardController {
  public saveFeaturedCard = async (req: Request, res: Response) => {
    try {

      //Receiving token and user_id from frontend
      //@ts-ignore
      let { user_id, token } = req

      let { featured_card_id } = req.body;

      if (featured_card_id) {
        await dbWriter.featuredCards.update({
          fc_description: req.body.fc_description,
          fc_title: req.body.fc_title,
          fc_name: req.body.fc_name,
          fc_type: req.body.fc_type,
          fc_type_value: req.body.fc_type_value,
          is_popular: req.body.is_popular,
          is_user_filter: req.body.is_user_filter,
          fc_title_color: req.body.fc_title_color,
          fc_description_color: req.body.fc_description_color,
          fc_color1: req.body.fc_color1,
          fc_color2: req.body.fc_color2,
          fc_image: req.body.fc_image,
          is_deleted: 0,
          updated_datetime: new Date(),
        },
          {
            where: {
              featured_card_id: req.body.featured_card_id,
              user_id: user_id,
            },
          }
        );
        new SuccessResponse(
          EC.errorMessage(EC.updatedDataSuccess, ["Icebreakers"]),
          {
            token: token,
          }
        ).send(res);
      }
      else {
        var data = await dbWriter.featuredCards.create({
          user_id: user_id,
          fc_description: req.body.fc_description,
          fc_title: req.body.fc_title,
          fc_name: req.body.fc_name,
          fc_type: req.body.fc_type,
          fc_type_value: req.body.fc_type_value,
          is_popular: req.body.is_popular,
          is_user_filter: req.body.is_user_filter,
          fc_title_color: req.body.fc_title_color,
          fc_description_color: req.body.fc_description_color,
          fc_color1: req.body.fc_color1,
          fc_color2: req.body.fc_color2,
          fc_image: req.body.fc_image,
          is_deleted: 0,
        });
        new SuccessResponse(
          EC.errorMessage(EC.saveDataSuccess, ["Featured_Card"]),
          {
            token: token,
          }
        ).send(res);
      }
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };
  public listFeaturedCard = async (req: Request, res: Response) => {
    try {

      //Receiving token and user_id from frontend
      //@ts-ignore
      let { user_id, token } = req


      var data = await dbReader.featuredCards.findAndCountAll({
        attributes: [
          ["fc_title", "Featured"],
          [dbReader.Sequelize.literal("`display_name`"), "authors"],
          ["created_datetime", "Date"],
          ["updated_datetime", "Modified By"],
        ],
        include: [
          {
            attributes: [],
            model: dbReader.users,
          },
        ],
        where: dbReader.Sequelize.and(
          {
            is_deleted: 0,
          },
          dbReader.Sequelize.or({
            user_id: user_id
          })
        ),
      });
      data = JSON.parse(JSON.stringify(data))
      new SuccessResponse(EC.errorMessage(EC.DataFetched, ["Featured_Card"]), {
        token: token,
        count: data.rows.length,
        rows: data.rows
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };
  public deleteFeaturedCard = async (req: Request, res: Response) => {
    try {
      //Receiving token and user_id from frontend
      //@ts-ignore
      let { user_id, token } = req

      let { featured_card_id } = req.params
      await dbWriter.featuredCards.update(
        {
          is_deleted: 1,

        },
        {
          where: {
            user_id: user_id,
            featured_card_id: featured_card_id,
          },
        }
      );
      new SuccessResponse(
        EC.errorMessage(EC.deleteDataSuccess, ["Featured_Card"]),
        {
          token: token,
        }
      ).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };
}
