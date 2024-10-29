import { Request } from "express";
import { ErrorController } from '../core/index';
const { dbWriter } = require('../models/dbConfig');
const EC = new ErrorController();

export class SendSMSLogsController {
  public createSMSLog = async (req: Request) => {
    try {
      let { sms_design_template_id, content_text, status, site_id, user_id, receiver, response_data } = req.body;

      let payLoad = {
        status: status,
        site_id: site_id,
        sms_design_template_id: sms_design_template_id,
        user_id: user_id,
        receiver: receiver,
        content_text: content_text,
        response_data: response_data
      }
      
      // Inserting in sycu_send_sms_logs table
      await dbWriter.sendSMSLog.create(payLoad);
    } catch (e: any) {
      return e.message;
    }
  }
}
