import { Request, Response } from "express";
import { ErrorController } from "../core/ErrorController";
import { SuccessResponse } from "../core/ApiResponse";
import { BadRequestError, ApiError, ForbiddenError } from "../core/ApiError";
import { string } from "joi";
// const { getVideoDurationInSeconds } = require('get-video-duration')
const { dbReader, dbWriter } = require("../models/dbConfig");
const { Op } = dbReader.Sequelize;

const url = require('url');
// var youtubeID = require('youtube-id');
var youtubeID: any = "";
const axios = require('axios');
// var TimeFormat = require('hh-mm-ss');
var TimeFormat: any = "";
const moment = require('moment');

const EC = new ErrorController();
// const tvSiteId = 14;

export class tvVideosController {
  public async saveVideo(req: Request, res: Response) {
    try {
      //@ts-ignore
      let { user_id = 0 } = req, videos: any = [], notifyUserList: any = [], userData: any = [];
      let {
        grow_tv_id,
        volume_id,
        ministry_type_id,
        series_id,
        tv_category_id,
        parent_category_id,
        video_title,
        thumbnail_image,
        video_url,
        duration,
      } = req.body;
      // duration = await getVideoDurationInSeconds(video_url);
      // duration =  String(Math.round((parseFloat(duration) + Number.EPSILON) * 100) / 100)

      if (duration == "NaN:00") {
        let cco = new tvVideosController();
        duration = await cco.videoDetails(video_url);
      }

      if (duration) {
        duration = duration.split(":")
        let s = 0
        duration = duration.map((element: any, index: any) => {
          if(duration.length == 3 && index == 0 && element == 0){
            element = ''
          }
          if (element.length == 1) {
            return '0' + element
          } else {
            return element
          }
        }).filter((s:any)=>s != '');
        duration = duration.join(":")
      }

      if (grow_tv_id) {
        videos = await dbWriter.growTvVideos.update({
          volume_id: volume_id,
          ministry_type_id: ministry_type_id,
          series_id: series_id,
          tv_category_id: tv_category_id,
          parent_category_id: parent_category_id,
          video_title: video_title,
          thumbnail_image: thumbnail_image || "",
          video_url: video_url,
          duration: duration,
          updated_by: user_id,
        }, {
          where: {
            grow_tv_id: grow_tv_id,
          },
        });
      } else {
        videos = await dbWriter.growTvVideos.create({
          volume_id: volume_id,
          ministry_type_id: ministry_type_id,
          series_id: series_id,
          tv_category_id: tv_category_id,
          parent_category_id: parent_category_id,
          video_title: video_title,
          thumbnail_image: thumbnail_image || "",
          video_url: video_url,
          duration: duration,
          created_by: user_id,
        });
        var userSubscriptionStatusData = [2, 4];
        userData = await dbReader.users.findAll({
          where: { is_deleted: 0, user_role: 3 },
          attributes: ['user_id'],
          include: [
            {
              required: true,
              model: dbReader.userSubscription,
              attributes: ['user_subscription_id'],
              where: {
                subscription_status: userSubscriptionStatusData,
              },
              include: {
                required: true,
                // separate: true,
                model: dbReader.userSubscriptionItems,
                attributes: ['user_subscription_item_id'],
                where: { item_type: 1, is_deleted: 0 },
                include: {
                  required: true,
                  model: dbReader.products,
                  attributes: ['product_id'],
                  where: {
                    category_id: volume_id,
                    ministry_type: ministry_type_id,
                    is_deleted: 0,
                  },
                },
              },
            },
          ],
        });

        userData.forEach((element: any) => {
          notifyUserList.push({ user_id: element.user_id, grow_tv_video_id: videos.grow_tv_id });
        });

        await dbWriter.growTvUserNotification.bulkCreate(notifyUserList);

      }
      new SuccessResponse(EC.errorMessage(EC.success), {
        //@ts-ignore
        token: req.token,
        videos: videos,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async deleteVideo(req: Request, res: Response) {
    try {
      let { grow_tv_id, series_id, ministry_type_id, volume_id } = req.body;
      let { user_id }: any = req;
      await dbWriter.growTvVideos.update({
        is_deleted: 1,
        updated_by: user_id,
      }, {
        where: { grow_tv_id: grow_tv_id, series_id: series_id, ministry_type_id: ministry_type_id, volume_id: volume_id }
      });
      new SuccessResponse(EC.deleteDataSuccess, {
        //@ts-ignore
        token: req.token,
      }).send(res);
    }
    catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async listTvVideo(req: Request, res: Response) {
    try {
      let { sort_order, sort_field, page_no, page_record, search, series_id, ministry_type_id, volume_id } = req.body;
      var row_offset = 0, row_limit = 10;
      sort_order = req.body.sort_order || 'ASC';
      //Pagination            
      if (page_record) {
        row_limit = parseInt(page_record);
      }
      if (page_no) {
        row_offset = (page_no * page_record) - page_record;
      }
      // Searching data by recipe_name                                    
      var SearchCondition = dbReader.Sequelize.Op.ne, SearchData = null;
      if (search) {
        SearchCondition = dbReader.Sequelize.Op.like;
        SearchData = "%" + search + "%";
      }
      //Sorting by recipe_name or recipe_category_id           
      var sortField = 'created_datetime', sortOrder = 'DESC';
      // var sortField = 'recipe_name', sortOrder = 'ASC';            
      var sortJoin = [
        [sortField, sortOrder]
      ];
      sortOrder = sort_order;
      if (sort_field == "video_title") {
        sortJoin = [dbReader.Sequelize.literal('`video_title`'), sortOrder];
      }
      else if (sort_field == "category_title") {
        sortJoin = [dbReader.Sequelize.literal('category_title'), sortOrder];
      }
      let data = await dbReader.growTvVideos.findAndCountAll({
        include: [
          {
            as: 'sycu_category',
            model: dbReader.categories,
            attributes: ["category_title"],
          }
        ],
        where: dbReader.Sequelize.and({ is_deleted: 0, series_id: series_id, ministry_type_id: ministry_type_id, volume_id: volume_id },
          dbReader.Sequelize.or(
            dbReader.Sequelize.where(dbReader.Sequelize.col('`video_title`'), { [SearchCondition]: SearchData }),
            dbReader.Sequelize.where(dbReader.Sequelize.col('`sycu_category`.`category_title`'), { [SearchCondition]: SearchData }),
          ),
        ),
        order: [sortJoin],
        limit: row_limit,
        offset: row_offset
      });
      if (data.rows.length > 0) {
        data.rows = JSON.parse(JSON.stringify(data.rows));
        new SuccessResponse(EC.success, {
          //@ts-ignore
          token: req.token,
          listdata: data,
        }).send(res);
      } else {
        new SuccessResponse(EC.success, {
          //@ts-ignore
          token: req.token,
          listdata: [],
        }).send(res);
      }
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public listTvCategoryVideo = async (req: Request, res: Response) => {
    try {
      //@ts-ignore
      let { user_id } = req
      let { sort_order, sort_field, page_no, page_record, search, category_id, filterdata = "", filtervolume = "" } = req.body;
      let sortOrder = sort_order ? sort_order : "DESC";
      let sortField = sort_field ? sort_field : "created_datetime";
      let rowLimit = page_record ? parseInt(page_record) : 50;
      let rowOffset = page_no ? page_no * page_record - page_record : 0;
      let filter = filterdata ? filterdata : [1, 2, 3];
      let filterByVolume = filtervolume ? filtervolume : [2, 3, 4, 5, 6, 225];
      var SearchCondition = dbReader.Sequelize.Op.ne, SearchData = null;
      if (search) {
        SearchCondition = dbReader.Sequelize.Op.like;
        SearchData = "%" + search + "%";
      }

      // if(sortField == "category_title"){
      //   sortField = dbReader.Sequelize.literal('`sycu_category`.`category_title`')
      // }
      // if(sortField == "videoVolume"){
      //   sortField = dbReader.Sequelize.literal('`videoVolume`.`category_title`')
      // }
      // if(sortField == "videoSeries"){
      //   sortField = dbReader.Sequelize.literal('`videoSeries`.`category_title`')
      // }

      let data: any = await this.getCategoryVolumes(user_id)
      if (data.length) {
        let condition_generate: any = []
        data.forEach((element: any) => {
          if (element.ids.length) {
            condition_generate.push(dbReader.Sequelize.and(
              { ministry_type_id: element.type },
              { volume_id: element.ids }
            ))
          }
        });
        let tvCategoryData = await dbReader.growTvVideos.findAndCountAll({
          include: [{
            model: dbReader.categories,
            attributes: ['category_title'],
            where: { is_deleted: 0 }
          },
          {
            model: dbReader.users,
            attributes: ['display_name'],
            where: { is_deleted: 0 }
          },
          {
            as: "videoSeries",
            model: dbReader.categories,
            attributes: ["category_title"],
          }, {
            as: "videoVolume",
            model: dbReader.categories,
            attributes: ["category_title"],
          }
          ],
          where: dbReader.Sequelize.and(
            { is_deleted: 0, tv_category_id: category_id, ministry_type_id: filter, volume_id: filterByVolume },
            dbReader.Sequelize.or(
              dbReader.Sequelize.where(dbReader.Sequelize.col('`video_title`'), { [SearchCondition]: SearchData }),
              dbReader.Sequelize.where(dbReader.Sequelize.col('`videoSeries`.`category_title`'), { [SearchCondition]: SearchData }),
            ),
          ),
          limit: rowLimit,
          offset: rowOffset,
          order: [[sortField, sortOrder]],
        });
        tvCategoryData = JSON.parse(JSON.stringify(tvCategoryData))
        new SuccessResponse(EC.success, {
          //@ts-ignore
          token: req.token,
          catgory_data: tvCategoryData,
        }).send(res);
      } else {
        new SuccessResponse(EC.success, {
          //@ts-ignore
          token: req.token,
          catgory_data: []
        }).send(res);
      }
    } catch (err: any) {
      ApiError.handle(new BadRequestError(err.message), res);
    }
  }

  public listAllVideo = async (req: Request, res: Response) => {
    // public async listAllVideo(req: Request, res: Response) {
    try {
      //@ts-ignore
      let { user_id } = req
      let { sort_order, sort_field, page_no, page_record, search, category_id, tv_category_id, video_series_category_id, video_volume_category_id, filterdata = "", filtervolume = "" } = req.body;
      let categoryCond = dbReader.Sequelize.Op.ne, categoryData = null;
      if (category_id) {
        categoryCond = dbReader.Sequelize.Op.eq;
        categoryData = category_id;
      }
      let tvCategoryCond = dbReader.Sequelize.Op.ne, _tvCategoryData = null;
      if (tv_category_id) {
        tvCategoryCond = dbReader.Sequelize.Op.eq;
        _tvCategoryData = tv_category_id;
      }
      let seriesCategoryCond = dbReader.Sequelize.Op.ne, seriesCategoryData = null;
      if (video_series_category_id) {
        seriesCategoryCond = dbReader.Sequelize.Op.eq;
        seriesCategoryData = video_series_category_id;
      }
      let volCategoryCond = dbReader.Sequelize.Op.ne, volCategoryData = null;
      if (video_volume_category_id) {
        volCategoryCond = dbReader.Sequelize.Op.eq;
        volCategoryData = video_volume_category_id;
      }
      let sortOrder = sort_order ? sort_order : "DESC";
      let sortField = sort_field ? sort_field : "created_datetime";
      let rowLimit = page_record ? parseInt(page_record) : 50;
      let rowOffset = page_no ? page_no * page_record - page_record : 0;
      let filter = filterdata ? filterdata : [1, 2, 3];
      let filterByVolume = filtervolume ? filtervolume : [2, 3, 4, 5, 6, 225];
      var SearchCondition = dbReader.Sequelize.Op.ne, SearchData = null;
      if (search) {
        SearchCondition = dbReader.Sequelize.Op.like;
        SearchData = "%" + search + "%";
      }
      if (sortField == "category_title") {
        sortField = dbReader.Sequelize.literal('`sycu_category`.`category_title`')
      }
      if (sortField == "videoVolume") {
        sortField = dbReader.Sequelize.literal('`videoVolume`.`category_title`')
      }
      if (sortField == "videoSeries") {
        sortField = dbReader.Sequelize.literal('`videoSeries`.`category_title`')
      }
      let data: any = await this.getCategoryVolumes(user_id)
      if (data.length) {
        let condition_generate: any = []
        data.forEach((element: any) => {
          if (element.ids.length) {
            condition_generate.push(dbReader.Sequelize.and(
              { ministry_type_id: element.type },
              { volume_id: element.ids }
            ))
          }
        });
        let tvCategoryData = await dbReader.growTvVideos.findAndCountAll({
          include: [{
            model: dbReader.categories,
            attributes: ['category_title', 'category_id'],
            where: { is_deleted: 0, category_id: { [categoryCond]: categoryData } }
          },
          {
            model: dbReader.users,
            attributes: ['display_name'],
            where: { is_deleted: 0 }
          },
          {
            as: "videoSeries",
            model: dbReader.categories,
            attributes: ["category_title", 'category_id'],
            // where: { is_deleted: 0},
            // category_id:{ [seriesCategoryCond]: seriesCategoryData } }
          }, {
            as: "videoVolume",
            model: dbReader.categories,
            attributes: ["category_title", 'category_id'],
            // where: { is_deleted: 0}
            // ,category_id:{ [volCategoryCond]: volCategoryData } }
          }
          ],
          where: dbReader.Sequelize.and(
            { is_deleted: 0 },
            dbReader.Sequelize.or(
              dbReader.Sequelize.where(dbReader.Sequelize.col('grow_tv_videos.parent_category_id'), { [tvCategoryCond]: _tvCategoryData }),
              dbReader.Sequelize.where(dbReader.Sequelize.col('grow_tv_videos.tv_category_id'), { [tvCategoryCond]: _tvCategoryData }),
            ),
            // {tv_category_id:{ [tvCategoryCond]: _tvCategoryData }},
            // {parent_category_id:{ [tvCategoryCond]: _tvCategoryData }},
            dbReader.Sequelize.or(
              dbReader.Sequelize.where(dbReader.Sequelize.col('`video_title`'), { [SearchCondition]: SearchData }),
              dbReader.Sequelize.where(dbReader.Sequelize.col('`videoSeries`.`category_title`'), { [SearchCondition]: SearchData }),
            ),
          ),
          limit: rowLimit,
          offset: rowOffset,
          order: [[sortField, sortOrder]],
        });
        tvCategoryData = JSON.parse(JSON.stringify(tvCategoryData))
        if (video_volume_category_id) {
          let volumeData = tvCategoryData.rows.filter((e: any) => e.videoVolume.category_id == video_volume_category_id)
          tvCategoryData = { rows: volumeData, count: volumeData.length };
        }
        if (video_series_category_id && video_volume_category_id) {
          let seriesData = tvCategoryData.rows.filter((e: any) => e.videoSeries.category_id == video_series_category_id && e.videoVolume.category_id == video_volume_category_id)
          tvCategoryData = { rows: seriesData, count: seriesData.length };
        }
        new SuccessResponse(EC.success, {
          //@ts-ignore
          token: req.token,
          catgory_data: tvCategoryData,
        }).send(res);
      } else {
        new SuccessResponse(EC.success, {
          //@ts-ignore
          token: req.token,
          catgory_data: []
        }).send(res);
      }
    } catch (err: any) {
      ApiError.handle(new BadRequestError(err.message), res);
    }
  }

  public async getCategoryVolumes(user_id = 0) {
    try {
      let arrKids: any = [], arrStudents: any = [], arrGroups: any = [], membershipPageIds: any = [];
      let userMemberships = await dbReader.userMemberships.findAll({
        attributes: ["membership_id", [dbReader.Sequelize.literal("`sycu_membership`.`page_id`"), "page_id"]],
        where: dbReader.Sequelize.and(
          { is_deleted: 0 },
          { status: 2 },
          { user_id: user_id },
          { membership_id: { [dbReader.Sequelize.Op.ne]: 0 } }
        ),
        include: [{
          attributes: [],
          model: dbReader.membership,
          where: { is_deleted: 0, status: 1 },
        }],
      });
      if (userMemberships.length) {
        userMemberships = JSON.parse(JSON.stringify(userMemberships));
        userMemberships.forEach((um: any) => {
          if (!membershipPageIds.includes(um.page_id))
            membershipPageIds.push(um.page_id);
        });
      }
      let categories = await dbReader.categories.findAll({
        where: { is_deleted: 0, category_level: 0 },
        include: [{
          separate: true,
          attributes: ["category_id", "page_id", "ministry_type", "page_link", "is_ministry_page", "page_title"],
          model: dbReader.pages,
          where: { is_deleted: 0, is_published: 1 },
        }],
        order: [["created_datetime", "DESC"]],
      });
      categories = JSON.parse(JSON.stringify(categories));
      let sharedPages = await dbReader.sharedPages.findAll({
        attributes: ["page_id"],
        where: dbReader.Sequelize.and(
          { is_deleted: 0 },
          { receiver_user_id: user_id },
          { membership_id: { [dbReader.Sequelize.Op.ne]: 0 } }
        ),
      });
      sharedPages = JSON.parse(JSON.stringify(sharedPages));
      categories.forEach((element: any) => {
        let ge = {
          category_id: element.category_id,
          category_title: element.category_title,
          category_slug: element.category_slug,
          category_image: element.category_image,
        };
        if (element.pages.length) {
          element.pages.map(function (e: any) {
            e.volume_count = element.volume_count;
          });
        }
        let ak_pages = element.pages.filter((s: any) => s.ministry_type == 1 && (userMemberships.some((m: any) => m.page_id == s.page_id) || sharedPages.some((sp: any) => sp.page_id == s.page_id))
        ).sort((a: any, b: any) => b.is_ministry_page - a.is_ministry_page);
        if (ak_pages.length) {
          arrKids.push({
            ...ge,
            ...ak_pages[0],
          });
        }
        let as_pages = element.pages.filter((s: any) => s.ministry_type == 2 && (userMemberships.some((m: any) => m.page_id == s.page_id) || sharedPages.some((sp: any) => sp.page_id == s.page_id))
        ).sort((a: any, b: any) => b.is_ministry_page - a.is_ministry_page);
        if (as_pages.length) {
          arrStudents.push({
            ...ge,
            ...as_pages[0],
          });
        }
        let ag_pages = element.pages.filter((s: any) => s.ministry_type == 3 && (userMemberships.some((m: any) => m.page_id == s.page_id) || sharedPages.some((sp: any) => sp.page_id == s.page_id))
        ).sort((a: any, b: any) => b.is_ministry_page - a.is_ministry_page);
        if (ag_pages.length) {
          arrGroups.push({
            ...ge,
            ...ag_pages[0],
          });
        }
      });
      let volumes = [
        {
          type: 1,
          ids: arrKids.map((e: any) => { return e.category_id })
        },
        {
          type: 2,
          ids: arrStudents.map((e: any) => { return e.category_id })
        },
        {
          type: 3,
          ids: arrGroups.map((e: any) => { return e.category_id })
        }
      ];
      return volumes
    } catch (e: any) {
      throw new Error(e.message)
    }
  }

  public async videoDetails(video_url: any) {
    try {
      let urlObject: any = url.parse(video_url, true);
      var fetchedData: any = [], videoLength: any = 0, videoDuration: any = 0;
      if (urlObject.host == 'www.youtube.com' || urlObject.host == 'youtube.com' || urlObject.host == 'www.youtu.be' || urlObject.host == 'youtu.be') {
        var video_id = youtubeID(video_url);
        let YT_API_URL: any = 'https://www.googleapis.com/youtube/v3/videos?part=contentDetails&key=AIzaSyBUcruA_FCGLYlOw91g4m79jPgV9X_Bu14&id=' + video_id;
        await axios(YT_API_URL, {
          method: 'GET',
        }).then((data: any) => { fetchedData.push(data.data) });
        fetchedData = JSON.parse(JSON.stringify(fetchedData));
        fetchedData.forEach((element: any) => {
          element.items.forEach((e: any) => {
            videoLength = TimeFormat.fromS(moment.duration(e.contentDetails.duration).as('seconds'), 'mm:ss');;
            return videoLength;
          })
        });
        videoDuration = JSON.stringify(fetchedData[0]);
      }
      else if (urlObject.host == 'www.vimeo.com' || urlObject.host == 'vimeo.com') {
        var oembed_endpoint = 'http://vimeo.com/api/oembed';
        var json_url = oembed_endpoint + '.json?url=' + encodeURIComponent(video_url) + '&width=640';
        await axios(json_url, {
          method: 'GET'
        }).then((data: any) => { fetchedData.push(data.data) });
        videoDuration = parseInt(JSON.stringify(fetchedData[0].duration));
        videoLength = TimeFormat.fromS(videoDuration, 'mm:ss');
        return videoLength;
      }
      return videoLength;
    }
    catch (e: any) {
      throw new Error(e.message);
    }
  }
}
