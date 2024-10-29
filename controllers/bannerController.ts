import { Request, Response } from 'express'
import { ErrorController, SuccessResponse, BadRequestError, ApiError } from '../core/index';
const { dbReader, dbWriter } = require('../models/dbConfig');
const { GeneralController } = require('./generalController');
const EC = new ErrorController();

export class HubBanner {

  public saveHubBanner = async (req: Request, res: Response) => {
    try {
      let { banner_id, banner_name, banner_image_url, is_default } = req.body;
      let generalControllerObj = new GeneralController();
      let { user_id = 0 } = generalControllerObj.getCurrentUserDetail(req, res);

      let getDefault = await dbReader.hubBanners.findOne({ where: { is_default } });

      if (banner_id != 0) {
        if (is_default) {
          await dbWriter.hubBanners.update({
            user_id: user_id,
            banner_name: banner_name,
            banner_image_url: banner_image_url,
            is_default: is_default
          }, {
            where: { banner_id: banner_id }
          });

          if (getDefault) {
            await dbWriter.hubBanners.update({ is_default: 0 }, { where: { banner_id: getDefault.banner_id } });
          }
          
          new SuccessResponse(EC.errorMessage(EC.updatedMessage, ["Banner"]), {
            // @ts-ignore
            token: req.token
          }).send(res);
        } else {
          await dbWriter.hubBanners.update({
            user_id: user_id,
            banner_name: banner_name,
            banner_image_url: banner_image_url,
            is_default: is_default
          }, {
            where: { banner_id: banner_id }
          });
          new SuccessResponse(EC.errorMessage(EC.updatedMessage, ["Banner"]), {
            // @ts-ignore
            token: req.token
          }).send(res);
        }
      } else {
        if (is_default) {
          await dbWriter.hubBanners.create({
            banner_name: banner_name || "",
            banner_image_url: banner_image_url || "",
            is_default: is_default || 0,
            user_id: user_id
          });
          if (getDefault) {
            await dbWriter.hubBanners.update({ is_default: 0 }, { where: { banner_id: getDefault.banner_id } });
          }
        } else {
          await dbWriter.hubBanners.create({
            banner_name: banner_name || "",
            banner_image_url: banner_image_url || "",
            is_default: is_default || 0,
            user_id: user_id
          });
        }
        new SuccessResponse(EC.errorMessage(EC.createdMessage, ["Banner"]), {
          // @ts-ignore
          token: req.token,
        }).send(res);
      }
    }
    catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };

  public listingHubBanners = async (req: Request, res: Response) => {
    try {
      let { page_no, sort_date, search } = req.body;
      let rowOffset = 0, rowLimit = EC.pageRecord;
      let SearchCondition = dbReader.Sequelize.Op.ne, SearchData = null;

      if (page_no) { rowOffset = (page_no * rowLimit) - rowLimit; }
      if (search) {
        SearchCondition = dbReader.Sequelize.Op.like;
        SearchData = "%" + search + "%";
      }
      let data = await dbReader.hubBanners.findAndCountAll({
        where: { is_deleted: 0, banner_name: { [SearchCondition]: SearchData } },
        attributes: ['banner_id', [dbReader.sequelize.fn("concat", dbReader.sequelize.col("first_name"), ' ', dbReader.sequelize.col("last_name")), "user_name"], 'banner_name', 'banner_image_url', 'is_default', 'created_datetime'],
        include: [{
          required: true,
          model: dbReader.users,
          attributes: []
        }],
        limit: rowLimit,
        offset: rowOffset,
      });

      new SuccessResponse(EC.errorMessage(EC.getMessage, ["Banners"]), { // @ts-ignore
        token: req.token,
        count: data.count,
        rows: data.rows
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public deleteHubBanners = async (req: Request, res: Response) => {
    try {
      let { banner_id } = req.params;
      await dbWriter.hubBanners.update({
        is_deleted: 1
      }, {
        where: { banner_id: banner_id }
      });

      new SuccessResponse(EC.errorMessage(EC.deletedMessage, ["Banner"]), {
        // @ts-ignore
        token: req.token
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  };

}