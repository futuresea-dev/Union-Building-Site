import { Sequelize } from 'sequelize';
import { Request, Response } from "express";

import { ErrorController } from "../core/ErrorController";
import { SuccessResponse } from "../core/ApiResponse";
import { BadRequestError, ApiError } from "../core/ApiError";
const { dbReader, dbWriter } = require("../models/dbConfig");
const { Op } = dbReader.Sequelize;

const EC = new ErrorController();
// const tvSiteId = 14;

export class tvCategoryController {
  public async saveTvCategory(req: Request, res: Response) {
    try {
      //@ts-ignore
      let { user_id = 0 } = req,
        category: any = [];
      let { parent_category_id, category_title, category_image, category_id = 0 } =
        req.body;
      let categorySlug = category_title
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+/gi, "-");
      if (category_id) {
        category = await dbWriter.categories.update(
          {
            category_title: category_title,
            category_image: category_image || "",
            category_slug: categorySlug,
            updated_by: user_id,
          },
          {
            where: {
              category_id: category_id,
              category_level: 2,
            },
          }
        );
      } else {
        var getLastSortOrder = await dbReader.categories.findOne({
          where:{category_level:2, is_deleted:0},
          attributes: [[Sequelize.fn('MAX', Sequelize.col('sort_order')),'maxOrder']]
        });
        getLastSortOrder = JSON.parse(JSON.stringify(getLastSortOrder));

        var newSortOrder = getLastSortOrder.maxOrder + 1
        category = await dbWriter.categories.create({
          // Temporarily passing 0 in parent category id
          parent_category_id: parent_category_id || 0,
          category_title: category_title,
          category_image: category_image || "",
          category_slug: categorySlug,
          category_level: 2,
          sort_order: newSortOrder,
          created_by: user_id,
        });

        let categoryDetail = [
          { category_id: category.category_id, detail_key: "is_deleted", detail_value: 1 },
          { category_id: category.category_id, detail_key: "category_type", detail_value: "All" }
        ];

        await dbWriter.categoriesDetail.bulkCreate(categoryDetail);
      }
      new SuccessResponse(EC.errorMessage(EC.success), {
        //@ts-ignore
        token: req.token,
        category: category,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async deleteTvCategory(req: Request, res: Response) {
    try {
      let { category_id } = req.params;
      let { user_id }: any = req;
      await dbWriter.categories.update(
        {
          is_deleted: 1,
          updated_by: user_id,
        },
        {
          where: { category_id: category_id, category_level: 2 },
        }
      );
      await dbWriter.growTvVideos.update(
        {
          is_deleted: 1,
          updated_by: user_id,
        },
        {
          where: { tv_category_id: category_id },
        }
      );
      new SuccessResponse(EC.deleteDataSuccess, {
        //@ts-ignore
        token: req.token,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async listTvCategory(req: Request, res: Response) {
    try {
      let { sort_order, sort_field, page_no, page_record } = req.body;
      let sortOrder = sort_order ? sort_order : "DESC";
      let sortField = sort_field ? sort_field : "sort_order";
      let rowLimit = page_record ? parseInt(page_record) : 5;
      let rowOffset = page_no ? page_no * page_record - page_record : 0;
      var searchCondition = dbReader.Sequelize.Op.ne, searchData = null;
      if (req.body.search) {
        searchCondition = Op.like;
        searchData = "%" + req.body.search + "%";
      }
      let getCategories = await dbReader.categories.findAndCountAll({
        where: dbReader.Sequelize.and({ is_deleted: 0, parent_category_id: 0 }, { category_level: 2 }, dbReader.Sequelize.or({
          category_title: { [searchCondition]: searchData },
        })),
        include : [{
          separate : true,
          model : dbReader.categoriesDetail,
          attributes:["categories_detail_id","detail_value","detail_key"],
          where: {
              is_deleted:0
          }
        }],
        attributes: ["category_id", "category_title", "category_image", "sort_order", "created_datetime"],
        limit: rowLimit,
        offset: rowOffset,
        order:['sort_order']
      })
      let getTvVideos = await dbReader.growTvVideos.findAll({
        where: { is_deleted: 0 },
      })
      getCategories = JSON.parse(JSON.stringify(getCategories))
      getTvVideos = JSON.parse(JSON.stringify(getTvVideos))
      let _data: any = {}
      let categoriesArr = []
      for (let i = 0; i < getCategories.rows.length; i++) {
        let obj: any = {}
        let ele = getCategories.rows[i];
        let getVideosData = getTvVideos.filter((i: any) => i.tv_category_id == ele.category_id)
        obj.category_id = ele.category_id
        obj.category_title = ele.category_title
        obj.category_image = ele.category_image
        obj.sort_order = ele.sort_order
        obj.created_datetime = ele.created_datetime
        obj.video_count = getVideosData.length ?? 0
        obj.categories_details = ele.categories_details;
        categoriesArr.push(obj)
      }
      _data.count = getCategories.count ?? 0
      _data.category = categoriesArr ?? []
      new SuccessResponse(EC.success, {
        //@ts-ignore
        token: req.token,
        count: _data.count,
        category: _data.category,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async categorySortOrder(req: Request, res: Response) {
    try {
      let { category_id, new_sort_order } = req.body;
      await dbReader.categories.update({sort_order : new_sort_order},
        { where: { category_id: category_id, category_level: 2 } }
      );

      let getCategories = await dbReader.categories.findAll({
        where: [
          dbReader.Sequelize.and(
            { is_deleted: 0 }, 
            { category_level: 2 },
            { category_id: { [dbReader.Sequelize.Op.ne]: category_id } })
        ],
        attributes: ["category_id","category_title","sort_order"],
        order:['sort_order','category_id']
      });

      getCategories = JSON.parse(JSON.stringify(getCategories));

      // let newOrderList:any = [], updatedOrder:any, flag:any = false;

      let cnt = 1,update_category_id:any = [],sort_order="case category_id ";
      getCategories.forEach((element:any) => {
        update_category_id.push(element.category_id)
        if(cnt == new_sort_order){
          cnt ++
        }
        sort_order+= " when "+ element.category_id+" then "+(cnt++)       
      });
      
      if(update_category_id.length){        
        sort_order +=" else sort_order end";      
        await dbWriter.categories.update({
          sort_order:dbWriter.Sequelize.literal(sort_order)
        },{
          where:{is_deleted: 0 ,category_level: 2,category_id:update_category_id}
        })        
      }
      
      new SuccessResponse(EC.success, {
        //@ts-ignore
        token: req.token        
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async listonlyTvCategory(req: Request, res: Response) {
    try {
      let data = await dbReader.categories.findAll({
        where: dbReader.Sequelize.and({ is_deleted: 0 }, { category_level: 2 }),
        attributes: ["category_id", "category_title", "category_image"],
        include : [{
          separate : true,
          model : dbReader.categoriesDetail,
          attributes:["categories_detail_id","detail_value","detail_key"],
          where: { is_deleted:0 }
        }],
      });
      data = JSON.parse(JSON.stringify(data));
      new SuccessResponse(EC.success, {
        //@ts-ignore
        token: req.token,
        category: data,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public async listCategoryMeta(req: Request, res: Response) {
    try {
      let { category_id } = req.params;
      let categoryMeta = await dbReader.categories.findOne({
        where: dbReader.Sequelize.and({ is_deleted: 0 }, { category_level: 2 }, { category_id: category_id }),
        attributes: ["category_id", "category_title", "category_image"],
        include : [{
          separate : true,
          model : dbReader.categoriesDetail,
          attributes:["categories_detail_id","detail_value","detail_key"],
          where: { is_deleted:0 }
        }],
      });
      categoryMeta = JSON.parse(JSON.stringify(categoryMeta));
      new SuccessResponse(EC.success, {
        //@ts-ignore
        token: req.token,
        categoryMeta: categoryMeta,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
}
