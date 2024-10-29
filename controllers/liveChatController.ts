import { Request, Response } from 'express'
import { ErrorController, SuccessResponse, BadRequestError, ApiError } from '../core/index';
const { dbReader, dbWriter } = require('../models/dbConfig');
import moment from "moment";
const axios = require('axios');
const EC = new ErrorController();
const { Op } = dbReader.Sequelize;

export class LiveChat {
  public getLiveChatData = async (req: Request, res: Response) => {
    try {
      const username = '8b807612-673a-4e34-8404-999e66631054';
      const password = 'dal:yHCQ3juYtQKKcAxdKA0Bzyz2354';
      const encodedBase64Token = Buffer.from(`${username}:${password}`).toString('base64');
      const authorization = `Basic ${encodedBase64Token}`;
      let results;
      var currentDate = moment().format("YYYY-MM-DDTHH:MM:SS.ssssss+HH:MM")
      var pastDate = moment(currentDate).subtract(1, "days").format("YYYY-MM-DDTHH:MM:SS.ssssss+HH:MM")
      await axios({
        url: 'https://api.livechatinc.com/v3.5/agent/action/list_archives',
        method: 'post',
        headers: {
          Authorization: authorization,
        },
        data: {
          "limit":100,
          // "page_id":"MTY3NDY4NDYzODAyOTk5OTpkZXNjOjEwMDp0cnVl"
          // "from":"2022-12-01T16:24:14.541007Z",
          // "to":"2023-01-26T16:24:14.541007Z"
          "from":pastDate,
          "to":currentDate
        }// Request Body if you have     
      }).then(async (e: any) => {
        let array: any = []
        results = JSON.parse(JSON.stringify(e.data))
        let n = 0
        while (n < results.chats.length) {
          let data = await dbReader.liveChatData.findOne({
            where: { chat_id: results.chats[n].id }
          })
  console.log(data);
          if (!data) {
            await dbWriter.liveChatData.create({
              chat_id: results.chats[n].id,
              users_data: JSON.stringify(results.chats[n].users),
              chat_data: JSON.stringify(results.chats[n].thread.events),
              created_at:results.chats[n].thread.events[0].created_at
            })
          }
          n++
        }
      }).catch((err: any) => {
        throw new Error("Something went wrong");
      })
      new SuccessResponse(EC.errorMessage(EC.success), {
        data: results,
      }).send(res);
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
  public listLiveChatData = async (req: Request, res: Response) => {
    try {
      let { range, sort_order, page_record, page_no } = req.body;
      let sortOrder = sort_order ? sort_order : "DESC";
      let rowLimit = page_record ? parseInt(page_record) : 25;
      let rowOffset = page_no ? ((page_no * page_record) - page_record) : 0;
      // Searching
      var searchCondition = dbReader.Sequelize.Op.ne, searchData = null;
      if (req.body.search) {
          searchCondition = Op.like;
          searchData = "%" + req.body.search + "%";
      }
      let data = await dbReader.liveChatData.findAndCountAll({
        where: dbReader.Sequelize.and(
          dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('sycu_live_chat_archives.created_at'), '%Y-%m-%d %H:%i'), { [dbReader.Sequelize.Op.gte]: range.start_date }),
          dbReader.Sequelize.where(dbReader.Sequelize.fn('DATE_FORMAT', dbReader.sequelize.col('sycu_live_chat_archives.created_at'), '%Y-%m-%d %H:%i'), { [dbReader.Sequelize.Op.lte]: range.end_date }),
          dbReader.Sequelize.or(
            { chat_data: { [searchCondition]: searchData } },
            ),
        ),
        limit: rowLimit,
        offset: rowOffset,
        order: [["created_at", sortOrder]]
      });
      if (data) {
        data = JSON.parse(JSON.stringify(data));
        let array: any = [];
        data.rows.forEach((e: any) => {
          array.push({
            chat_id: e.chat_id,
            users_data: JSON.parse(e.users_data),
            chat_data: {
              parent_id: e.chat_id,
              data: JSON.parse(e.chat_data),
            },
            created_at: e.created_at
          })
        });
        new SuccessResponse(EC.errorMessage(EC.success), {
          //@ts-ignore
          token: req.token,
          count: data.count,
          rows: array
        }).send(res);
      } else {
        new SuccessResponse("No Data Found", {
          data: [],
        }).send(res);
      }
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }
}
