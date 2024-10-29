import { Request, Response } from "express";
import { ErrorController, SuccessResponse, BadRequestError, ApiError } from '../core/index';
const { dbReader, dbWriter } = require('../models/dbConfig');
const { Op } = dbReader.Sequelize;
const EC = new ErrorController();
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  accessKeyId: process.env.AWSACCESSKEYID,
  secretAccessKey: process.env.AWSSECRETACCESSKEY,
});


export class sendEmailLogsController {

  /*
  * Getting list log of emails send by the system  - 
  * Code done by So 
  */
  public listEmailLogs = async (req: Request, res: Response) => {
    try {
      //Pagination
      var limit = req.body.page_record == undefined ? 10 : parseInt(req.body.page_record);
      var offset = req.body.page_no == undefined ? 1 : parseInt(req.body.page_no);
      let userId = req.body.user_id ? req.body.user_id : 0

      // Automatic offset and limit will set on the base of page number
      var row_limit = limit;
      var row_offset = (offset * limit) - limit;

      // Added Code By So 29-11-2021
      // Getting sort field(column) and sort order(ASC) from body
      // If it is not passed in body then default values will set
      var sortField = 'send_email_log_id', sortOrder = "DESC";
      if (req.body.sortField) {
        sortField = req.body.sortField
      }
      if (req.body.sortOrder) {
        sortOrder = req.body.sortOrder;
      }

      // Searching                           
      var SearchCondition = dbReader.Sequelize.Op.ne, SearchData = null;
      if (req.body.search) {
        SearchCondition = Op.like;
        SearchData = "%" + req.body.search + "%";
      }

      // Filtering
      var filter = dbReader.Sequelize.and();
      if (req.body.filter) {
        var data = req.body.filter[0];
        filter = dbReader.Sequelize.and(data);
      }

      let whereCondition: any;
      if (userId) {
        whereCondition = dbReader.Sequelize.and(
          dbReader.Sequelize.or(
            { subject_mail: { [SearchCondition]: SearchData } },
            { receiver: { [SearchCondition]: SearchData } },
            { html_link: { [SearchCondition]: SearchData } }
          ),
          filter,
          { user_id: userId }
        );
      } else {
        whereCondition = dbReader.Sequelize.and(
          dbReader.Sequelize.or(
            { subject_mail: { [SearchCondition]: SearchData } },
            { receiver: { [SearchCondition]: SearchData } },
            { html_link: { [SearchCondition]: SearchData } }
          ),
          filter
        );
      }

      let getSendEmailLogs = await dbReader.sendEmailLog.findAndCountAll({
        attributes: [
          'send_email_log_id', 'email_design_template_id', 'user_id',
          [dbReader.Sequelize.literal('title'), 'site_name'],
          'subject_mail', 'receiver', 'html_link', 'created_datetime', 'status'
        ],
        where: whereCondition,
        include: [{
          model: dbReader.sites,
          attributes: []
        }],
        offset: row_offset,
        limit: row_limit,
        order: [[sortField, sortOrder]]
      })

      getSendEmailLogs = JSON.parse(JSON.stringify(getSendEmailLogs));
      if (getSendEmailLogs.rows.length) {
        new SuccessResponse(EC.success, {
          //@ts-ignore
          token: req.token,
          count: getSendEmailLogs.count,
          data: getSendEmailLogs.rows
        }).send(res);
      } else {
        new SuccessResponse(EC.noDataFound, {
          //@ts-ignore
          token: req.token,
          count: 0,
          data: []
        }).send(res);
      }
    } catch (e: any) {
      ApiError.handle(new BadRequestError(e.message), res);
    }
  }

  public uploadDataToAWSBucket = async (req: Request) => {
    try {
      const mailHtml = req.body.htmlContent
      var payLoad = {
        status: req.body.status,
        site_id: req.body.site,
        email_design_template_id: req.body.email_design_template_id,
        user_id: req.body.user_id,
        response_data: req.body.response_data,
        subject_mail: req.body.subject_mail,
        receiver: req.body.receiver,
        html_link: '',
        type: (req.body.global_id != 0) ? 1 : 0,
        global_id: req.body.global_id,
        site_email_service_id: req.body.site_email_service_id,
        sender: req.body.sender,
        parent_id: (req.body.parent_id) ? req.body.parent_id : 0
      }
      var insertIdSendEmailLog = 0;

      // Inserting in sycu_send_email_logs table
      let data = await dbWriter.sendEmailLog.create(payLoad);
      insertIdSendEmailLog = data.send_email_log_id;

      let parentId = payLoad.parent_id;
      if (payLoad.parent_id == 0) {
        parentId = insertIdSendEmailLog
      }


      var fileName = payLoad.user_id + "_" + insertIdSendEmailLog + "_" + new Date().getTime() + ".html";
      var uploadHtml = await this.uploadFile(mailHtml, fileName);

      // Updating in sycu_send_email_logs table
      await dbWriter.sendEmailLog.update({
        html_link: uploadHtml,
        parent_id: parentId
      }, {
        where: { send_email_log_id: insertIdSendEmailLog }
      });
      return uploadHtml;
    } catch (e: any) {
      return e.message;
    }
  }

  // AWS S3 Upload Function
  public uploadFile = async (htmlFile: any, fileName: any) => {

    return new Promise(async (resolve, rejects) => {
      const params = {
        Bucket: 'sycu-accounts/email-logs', // pass your bucket name
        region: 'us-east-2',
        Key: fileName,
        ContentType: 'text/html',
        Body: htmlFile,
        ACL: 'public-read'
      };

      await s3.upload(params, function (err: any, data: any) {
        if (err)
          console.log('error ' + err);

        console.log(`File uploaded successfully at ${data.Location}`);
        // console.log(data.Location);
        resolve(data.Location); // return ;
      });

    });
  };
}
