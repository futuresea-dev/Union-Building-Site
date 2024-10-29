import { Request, Response } from "express";
import moment from "moment";
import {
  ErrorController,
  SuccessResponse,
  BadRequestError,
  ApiError,
} from "../core/index";
const { v4: uuidv4 } = require("uuid");
const { dbReader, dbWriter } = require("../models/dbConfig");
const { Op } = dbReader.Sequelize;

const EC = new ErrorController();

export class IceBreakerController {
  public saveIceBreaker = async (req: Request, res: Response) => {
    try {

      //@ts-ignore
      let { user_id, token } = req

      let iceBreakerArray = req.body.IceBreaker;
      let addIceBreakerArray: any = [];
      let icebreakerData: any = [];
      let filterData: any = [];
      let addFiltersArray: any = [];

      //Add And Update IceBreaker..
      if (iceBreakerArray.length > 0) {
        let existFilter: any = [], existIceBreaker: any = [];
        for (var i = 0; i < iceBreakerArray.length; i++) {
          let uuid = uuidv4();

          //push new icebreakers
          if (iceBreakerArray[i].icebreaker_id == 0) {
            addIceBreakerArray.push({
              icebreaker_id: iceBreakerArray[i].icebreaker_id,
              icebreaker_title: iceBreakerArray[i].icebreaker_title,
              user_id: user_id,
              uuid: uuid,
              is_system: 1,
              is_deleted: 0,
            });
          } else {
            existIceBreaker.push(iceBreakerArray[i].icebreaker_id);  //if icebreaker_id found in req.body going for update
            addIceBreakerArray.push({
              icebreaker_id: iceBreakerArray[i].icebreaker_id,
              icebreaker_title: iceBreakerArray[i].icebreaker_title,
              user_id: user_id,
              uuid: uuid,
              is_system: 1,
              is_deleted: 0,
            });
          }


          //Add and Update filters..
          if (iceBreakerArray[i].filters.length > 0) {
            for (var j = 0; j < iceBreakerArray[i].filters.length; j++) {

              //push new filters in gi_filter model
              if (iceBreakerArray[i].filters[j].gi_filter_id == 0) {
                addFiltersArray.push({
                  gi_filter_id: iceBreakerArray[i].filters[j].gi_filter_id,
                  filter_id: iceBreakerArray[i].filters[j].filter_id,
                  user_id: user_id,
                  type_id: uuid,
                  filter_type: 2,
                  is_deleted: 0
                });
              } else {
                existFilter.push(iceBreakerArray[i].filters[j].gi_filter_id); //if gi_filter_id found in req.body going for update
              }
            }
          }
        }

        //delete all the gi_filters which is not in existFilter array of existIceBreaker
        if (existFilter.length) {
          await dbWriter.giFilters.update({
            is_deleted: 1,
            updated_datetime: moment(new Date()).format('YYYY-mm-dd HH:mm:ss')
          }, {
            where: {
              type_id: existIceBreaker,
              gi_filter_id: { [dbWriter.Sequelize.Op.notIn]: existFilter },
              filter_type: 2
            }
          });
        } else {
          await dbWriter.giFilters.update({
            is_deleted: 1,
            updated_datetime: moment(new Date()).format('YYYY-mm-dd HH:mm:ss')
          }, {
            where: { type_id: existIceBreaker, filter_type: 2 }
          });
        }

        if (addIceBreakerArray.length) {
          icebreakerData = await dbWriter.icebreakers.bulkCreate(
            addIceBreakerArray, { updateOnDuplicate: ["icebreaker_title"] }
          );
          icebreakerData = JSON.parse(JSON.stringify(icebreakerData));
        }

        //Filters mapping
        filterData = addFiltersArray.map((element: any) => {
          if (icebreakerData.some((id: any) => id.uuid == element.type_id)) {
            return {
              ...element,
              type_id: icebreakerData.find((e: any) => e.uuid == element.type_id)
                .icebreaker_id,
            };
          } else {
            //add new filter while update icebreaker's filter
            return {
              ...element,
              type_id: existIceBreaker[0],
            };
          }
        });
        if (filterData) {
          await dbWriter.giFilters.bulkCreate(filterData);
        }
        new SuccessResponse(
          EC.errorMessage(EC.saveDataSuccess, ["Icebreakers"]),
          {
            token: token,
          }
        ).send(res);
      }
      else {
        ApiError.handle(new BadRequestError(), res);
      }
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };
  public listIceBreaker = async (req: Request, res: Response) => {
    try {

      //@ts-ignore
      let { token } = req

      let { page_record, page_no, search, sort_field, sort_order } = req.body;
      let totalRecords = page_record * page_no
      let pageOffset = totalRecords - page_record;
      let searchCondition = dbReader.Sequelize.Op.ne, searchData = null

      if (search) {
        searchCondition = dbReader.Sequelize.Op.like;
        searchData = "%" + search + "%";
      }
      var data = await dbReader.icebreakers.findAndCountAll({
        attributes: ["icebreaker_id", "icebreaker_title"],
        include: [
          {
            separate: true,
            model: dbReader.favoritedIceBreakers,
            where: {
              is_favourite: 1,
            },
            attributes: ["icebreaker_id",
              [dbReader.Sequelize.literal('(select count(favorited_icebreaker_id) from gg_favorited_icebreakers where is_favourite = 1)'), 'Favourites']],
            limit: 1
          },
          {
            separate: true,
            model: dbReader.giFilters,
            where: {
              filter_type: 2,
              added_by_system: 1,
              is_deleted: 0,
            },
            attributes: [
              "gi_filter_id",
              "filter_type",
              [dbReader.Sequelize.literal("`name`"), "filters_name"],
              [
                dbReader.Sequelize.literal("`Icebreaker_Filters`.`filter_id`"),
                "filter_id",
              ],
            ],
            include: [
              {
                model: dbReader.filters,
                as: "Icebreaker_Filters",
                attributes: [],
              },
            ],
          },
        ],
        where: dbReader.Sequelize.and(
          {
            is_deleted: 0,
            is_system: 1,
          },
          dbReader.Sequelize.or({
            icebreaker_title: { [searchCondition]: searchData }
          })
        ),
        order: [[sort_field, sort_order]],
        limit: page_record,
        offset: pageOffset,
      });
      data = JSON.parse(JSON.stringify(data));
      data.rows.forEach((element: any) => {
        element.Favourites = element.gg_favorited_icebreakers.length ? element.gg_favorited_icebreakers.length : 0;
        delete element.gg_favorited_icebreakers;
        element.filters = element.gg_games_icebreakers_filters;
        delete element.gg_games_icebreakers_filters;
      });
      new SuccessResponse(EC.errorMessage(EC.DataFetched, ["Icebreakers"]), {
        token: token,
        count: data.count,
        rows: data.rows,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };
  public listIceBreakerReportData = async (req: Request, res: Response) => {
    try {
      let { page_record, page_no, search, start_date, end_date, sort_field, sort_order, is_system } = req.body;

      //@ts-ignore
      let { user_id, token } = req

      let totalRecords = page_record * page_no;
      let pageOffset = totalRecords - page_record;

      let startDate: any = "";
      let endDate: any = "";
      // Searching
      let searchCondition = { [dbReader.Sequelize.Op.ne]: "" };
      let dateCondition: any = { [dbReader.Sequelize.Op.ne]: "" };
      if (search) {
        searchCondition = { [dbReader.Sequelize.Op.like]: search };
      }
      if (start_date && end_date) {
        startDate = moment(start_date).format("YYYY-MM-DD");
        endDate = moment(end_date).format("YYYY-MM-DD");
        dateCondition = {
          [dbReader.Sequelize.Op.between]: [startDate, endDate],
        };
      }

      let sortField = '', sortOrder = '';
      let sortJoin = [[sortField, sortOrder]];
      sortOrder = sort_order;
      if (sort_field == "icebreaker_title") {
        sortJoin = [dbReader.Sequelize.literal('icebreaker_title'), sortOrder];
      }
      else if (sort_field == 'authors') {
        sortJoin = [dbReader.Sequelize.literal('(select `display_name` as author from `sycu_users` where `sycu_users`.`user_id` = `gg_icebreakers`.`user_id`)'), sortOrder]
      }
      else if (sort_field == "total_favorites") {
        sortJoin = [dbReader.Sequelize.literal('(select count(`favorited_icebreaker_id`) as count from `gg_favorited_icebreakers` where `gg_favorited_icebreakers`.`icebreaker_id` = `gg_icebreakers`.`icebreaker_id`)'), sortOrder];
      }
      else if (sort_field == "total_views") {
        sortJoin = [dbReader.Sequelize.literal('(select count(`icebreaker_viewed_id`) as count from `gg_viewed_icebreakers` where `gg_viewed_icebreakers`.`icebreaker_id` = `gg_icebreakers`.`icebreaker_id` and is_deleted = 0)'), sortOrder];
      }


      let iceBreakerReportData = await dbReader.icebreakers.findAndCountAll({
        attributes: [
          "icebreaker_id",
          "icebreaker_title",
          "created_datetime",
          [dbReader.Sequelize.literal("`display_name`"), "authors"],
          [dbReader.Sequelize.literal("`ministry_level`"), "user_category"],
        ],
        where: dbReader.sequelize.and(
          dbReader.sequelize.where(
            dbReader.sequelize.col("`ministry_level`"),
            searchCondition,
          ),
          dbReader.sequelize.where(
            dbReader.sequelize.col("`gg_icebreakers`.`created_datetime`"),
            dateCondition
          ),
          dbReader.Sequelize.or({
            user_id: user_id,
            is_deleted: 0,
            is_system: 1
          })
        ),
        include: [
          {
            model: dbReader.users,
            attributes: [],
          },
          {
            separate: true,
            model: dbReader.viewedIceBreakers,
            attributes: [
              [
                dbReader.Sequelize.literal("COUNT(`icebreaker_viewed_id`)"),
                "total_views",
              ],
            ],
            group: ["icebreaker_id"],
          },
          {
            separate: true,
            model: dbReader.favoritedIceBreakers,
            attributes: [
              "favorited_icebreaker_id",
              [
                dbReader.Sequelize.literal("COUNT(`favorited_icebreaker_id`)"),
                "total_favorites",

              ],
            ],
            where: {
              is_favourite: 1,
            },
            group: ["icebreaker_id"]
          },
        ],
        order: [sortJoin],
        limit: page_record,
        offset: pageOffset,
      });
      iceBreakerReportData = JSON.parse(JSON.stringify(iceBreakerReportData));
      iceBreakerReportData.rows.forEach((element: any) => {
        element.views = element.gg_viewed_icebreakers.length ? 1 : 0;
        delete element.gg_viewed_icebreakers;

        element.is_favourite = element.gg_favorited_icebreakers.length ? 1 : 0;
        delete element.gg_favorited_icebreakers;
      });
      new SuccessResponse(EC.DataFetched, {
        token: token,
        count: iceBreakerReportData.count,
        rows: iceBreakerReportData.rows,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };
  public exportIceBreakerData = async (req: Request, res: Response) => {
    try {

      //@ts-ignore
      let { token } = req

      let { search, end_date, start_date } = req.body;
      var startDate: any = "";
      var endDate: any = "";

      // Searching      
      var searchCondition = { [dbReader.Sequelize.Op.ne]: "" };

      var dateCondition: any = { [dbReader.Sequelize.Op.ne]: "" };
      if (search) {
        searchCondition = dbReader.Sequelize.Op.like;
        searchCondition = { [dbReader.Sequelize.Op.like]: search };
      }

      //Code search date condition
      if (start_date && end_date) {
        startDate = moment(start_date).format("YYYY-MM-DD");
        endDate = moment(end_date).format("YYYY-MM-DD");
        dateCondition = {
          [dbReader.Sequelize.Op.between]: [startDate, endDate],
        };
      }

      var exportedIcebreakerData = await dbReader.icebreakers.findAndCountAll({
        attributes: [
          "icebreaker_id",
          "icebreaker_title",
          "created_datetime",
          [dbReader.Sequelize.literal("`display_name`"), "authors"],
          [dbReader.Sequelize.literal("`ministry_level`"), "user_category"],
        ],
        where: dbReader.sequelize.and(
          dbReader.sequelize.where(
            dbReader.sequelize.col("`ministry_level`"),
            searchCondition
          ),
          dbReader.sequelize.where(
            dbReader.sequelize.col("`gg_icebreakers`.`created_datetime`"),
            dateCondition
          ),
          dbReader.Sequelize.or({
            is_deleted: 0,
          })
        ),
        include: [
          {
            model: dbReader.users,
            attributes: [],
          },
          {
            separate: true,
            model: dbReader.viewedIceBreakers,
            attributes: [
              [
                dbReader.Sequelize.literal("COUNT(`icebreaker_viewed_id`)"),
                "total_views",
              ],
            ],
            group: ["icebreaker_id"],
          },
          {
            separate: true,
            model: dbReader.favoritedIceBreakers,
            attributes: [
              "favorited_icebreaker_id",
              [
                dbReader.Sequelize.literal("COUNT(`favorited_icebreaker_id`)"),
                "total_favorites",
              ],
            ],
            where: {
              is_favourite: 1,
            },
            group: ["icebreaker_id"],
          },
        ],
      });
      exportedIcebreakerData = JSON.parse(JSON.stringify(exportedIcebreakerData));
      exportedIcebreakerData.rows.forEach((element: any) => {
        element.views = element.gg_viewed_icebreakers.length ? 1 : 0;
        delete element.gg_viewed_icebreakers;

        element.is_favorites = element.gg_favorited_icebreakers.length ? 1 : 0;
        delete element.gg_favorited_icebreakers;
      });
      new SuccessResponse(EC.DataFetched, {
        token: token,
        count: exportedIcebreakerData.count,
        rows: exportedIcebreakerData.rows,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };
  public listIceBreakerById = async (req: Request, res: Response) => {
    try {
      //@ts-ignore
      let { token } = req
      let { icebreaker_id, is_system } = req.params
      var icebreaker = await dbReader.icebreakers.findOne({
        attributes: ["icebreaker_id", "icebreaker_title"],
        include: [
          {
            separate: true,
            model: dbReader.favoritedIceBreakers,
            attributes: ["icebreaker_id","is_favourite"],
          },
          {
            separate: true,
            model: dbReader.giFilters,
            where: {
              filter_type: 2,
              is_deleted: 0,
            },
            attributes: [
              "gi_filter_id",
              "filter_type",
              [dbReader.Sequelize.literal("`name`"), "filters_name"],
              [
                dbReader.Sequelize.literal("`Icebreaker_Filters`.`filter_id`"),
                "filter_id",
              ],
            ],
            include: [
              {
                model: dbReader.filters,
                as: "Icebreaker_Filters",
                attributes: [],
              },
            ],
          },
        ],
        where: dbReader.Sequelize.and(
          {
            is_deleted: 0,
            icebreaker_id: icebreaker_id,
            is_system: is_system,
          },
        ),
        order: dbReader.Sequelize.literal("rand()"),
      });
      icebreaker = JSON.parse(JSON.stringify(icebreaker));

      icebreaker.is_favourite = (icebreaker.gg_favorited_icebreakers.length > 0) ? icebreaker.gg_favorited_icebreakers.is_favourite : 0
      delete icebreaker.gg_favorited_icebreakers

      icebreaker.filters = (icebreaker && icebreaker.gg_games_icebreakers_filters != null) ? icebreaker.gg_games_icebreakers_filters : []
      delete icebreaker.gg_games_icebreakers_filters
      new SuccessResponse(EC.errorMessage(EC.DataFetched, ["Icebreakers"]), {
        token: token,
        ...icebreaker
      }).send(res);
      // }
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };
  public bulkDeleteIceBreaker = async (req: Request, res: Response) => {
    try {

      //@ts-ignore
      let { token } = req

      await dbWriter.icebreakers.update(
        {
          is_deleted: 1,
        },
        {
          where: {
            icebreaker_id: {
              [dbReader.Sequelize.Op.in]: req.body.icebreaker_id,
            },
          },
        }
      );
      new SuccessResponse(
        EC.errorMessage(EC.deleteDataSuccess, ["Icebreakers"]),
        {
          token: token,
        }
      ).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };
}
