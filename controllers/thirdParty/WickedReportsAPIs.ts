import { integer } from 'aws-sdk/clients/cloudfront';
import axios from 'axios';
const { dbReader, dbWriter } = require('../../models/dbConfig');
const{ThirdPartyController}= require('./thirdPartyController');
import { enumerationController } from '../enumerationController';
var EnumObject = new enumerationController();
export class WickedReportsAPIs {
  /**
          *set the API url for    
         */
  public apiUrl: string = process.env.wickedReportURL?.toString()??"";
  public thirdparty_id: integer  = 1;

  public testMode: boolean = true;
  /**
        *set test mode       
       */
  constructor() {
    if (process.env.NODE_ENV == "production") {
      this.testMode = false && process.env.isWickedReportTesting == "false" ;
    }
  }
  /**
       * Get authentication api key for wicked reports
       *@return apiKey      
      */
  public GetWickedReportsAPIKey() {
    try {
      let apiKey: string = "TQ1UzPqLxgQwC33cMFyZO0tC1z9OmBFc";
      return apiKey;
    }
    catch (error: any) {
      throw new Error(error.message)
    }
  }
  /**
       * Create product on wicked report
       * @param productDetails 
      
      */
  public CreateProduct = async (productDetails: any, site: string) => {
    let activity_type = "products";
    let requestObj: any = {};
    let responseObj: any = {};
    let status: number = 200;
    let message: string = "Success";
    try {
      //let data: any = [];
      // Json for product details
      if (productDetails.length > 0) {

        requestObj = productDetails.map((m: any) => {
          const product = {
            "SourceSystem":m.site_id ? EnumObject.siteIdEnum.get(m.site_id?.toString()).value:"",
            "SourceID": m.product_id?.toString(),
            "ProductName": m.product_name?.toString(),
            "ProductPrice": typeof m.product_amount == "string" ? parseFloat(m.product_amount).toFixed(2) : m.product_amount.toFixed(2)
          };
          return product;
        });

        // Third party apI call to create product on wicked report
        responseObj =await this.PostRequestWickedReports(requestObj, activity_type);
        if (responseObj.errors.length>0) {
          status= 400;
        }
      }
      else {
        message = "productDetails is required";
       status= 400;
      }
    }
    catch (error: any) {
      message = error.message;
     status= error.status;
    }
    finally {
      let WickedReportLog = {        
        status,
        message,
        request: requestObj,
        response: responseObj,
        thirdparty_id: this.thirdparty_id,
        "activity_type":1
      };
      let obj = new ThirdPartyController();
      await obj.SaveThirdPartyLog(WickedReportLog);
    }
  }

  /**
       * Create order on wicked report with order item and payment details if available
       * @param Order
      */
  public CreateOrder = async (Order: any) => {
    let activity_type = "orders";
    let requestObj: any = {};
    let responseObj: any = {};
    let status: number = 200;
    let message: string = "Success";
    try {
      if (Order.length > 0) {
        requestObj = Order.map((m: any) => {
          const orderItem = {
            "SourceSystem": m.site_id ? EnumObject.siteIdEnum.get(m.site_id?.toString())?.value??"account":"account",
            "SourceID": m.order_id?.toString(),//userId_orderId_currentTimestamp
            "CreateDate": m.order_date?.toString(), //utc time “YYYY-MM-DD HH:MM:SS” 
            "ContactEmail": m.user_email?.toString(),
            "OrderTotal": typeof m.order_amount == "string" ? parseFloat(m.order_amount).toFixed(2) : m.order_amount.toFixed(2),
            "Country": m.country?.toString(),
            "City": m.city?.toString(),
            "State": m.state?.toString(),
            "SubscriptionID": m.subscription_id?.toString(),
            "IP_Address": m.user_IP?.toString(),
            "OrderItems": [],
            "OrderPayments": []
          };
          // add order items
          if (m.order_item.length > 0) {
            orderItem.OrderItems = m.order_item.map((om: any) => {
              let OrderItemDetails = {
                "OrderItemID": om.order_item_id?.toString(),
                "ProductID": om.product_id?.toString(),
                "Qty": typeof om.qty == "string" ? parseInt(om.qty).toFixed(2) : om.qty,
                "PPU": typeof om.price == "string" ? parseFloat(om.price).toFixed(2) : om.price.toFixed(2)
              }
              return OrderItemDetails;
            });
          }
          else {
            message = "";
           status= 400;
          }

          //add payment 
          if (m.payment.length > 0) {
            orderItem.OrderPayments = m.payment.map((pm: any) => {
              let status = "";
              let paymentDetails = {
                "PaymentDate": pm.payment_date?.toString(), //utc time “YYYY-MM-DD HH:MM:SS” 
                "Amount": typeof pm.amount == "string" ? parseFloat(pm.amount).toFixed(2) : pm.amount.toFixed(2),
                "Status": pm.status? EnumObject.WickedReportPaymentStatusEnum.get(pm.status?.toString()).value:"APPROVED"// [1=APPROVED, 2=FAILED, 3=REFUNDED, 4=PARTIALLY REFUNDED]
              }
              return paymentDetails;
            });
          } else {
            message = "";
           status= 400;
          }

          return orderItem;
        });

        responseObj = await this.PostRequestWickedReports(requestObj, activity_type);
        if (responseObj.errors.length>0) {
          status= 400;
        }
      }
      else {
        message = "";
        status = 400;
        //return "OrderItems is required";
      }
    }
    catch (error: any) {
      message = error.message;
      status =  error.status;
    }
    finally {
      let WickedReportLog = {        
        status,
        message,
        request: requestObj,
        response: responseObj,
        thirdparty_id: this.thirdparty_id,
        "activity_type":2
      };
      let obj = new ThirdPartyController();
      await obj.SaveThirdPartyLog(WickedReportLog);
    }
  }
  /**
       * Create order on wicked report with order item and payment details if available
       * @param OrderItems      
      */
  public CreateOrderItems = async (OrderItems: any) => {
    let activity_type = "orderitems";
    let requestObj: any = {};
    let responseObj: any = {};
    let status: number = 200;
    let message: string = "Success";
    try {     
      if (OrderItems.length > 0) {
        requestObj = OrderItems.map((m: any) => {
          const orderItem = {
            "SourceSystem":m.site_id ? EnumObject.siteIdEnum.get(m.site_id?.toString()).value:"",
            "SourceID": m.order_item_id?.toString(),
            "OrderID": m.order_id?.toString(),
            "ProductID": m.product_id?.toString(),
            "Qty": typeof m.product_quantity == "string" ? parseInt(m.product_quantity) : m.product_quantity,
            "PPU": typeof m.product_amount == "string" ? parseFloat(m.product_amount).toFixed(2) : m.product_amount.toFixed(2)
          };
          return orderItem;
        });
        responseObj=  await this.PostRequestWickedReports(requestObj, activity_type);
        if (responseObj.errors.length>0) {
          status= 400;
        }

      }
      else {
        message = "";
       status= 400;
      }
    }
    catch (error: any) {
      message = "";
            status= 400;
    }
    finally {
      let WickedReportLog = {        
        status,
        message,
        request: requestObj,
        response: responseObj,
        thirdparty_id: this.thirdparty_id,
        "activity_type":2
      };

      let obj = new ThirdPartyController();
      await obj.SaveThirdPartyLog(WickedReportLog);
    }
  }
  /**
       * Create order on wicked report with order item and payment details if available
       * @param PaymentItem
      */
  public CreatePaymentItem = async (PaymentItem: any) => {
    let activity_type = "orderpayments";
    let requestObj: any = {};
    let responseObj: any = {};
    let status: number = 200;
    let message: string = "Success";
    try {
     
      if (PaymentItem.length > 0) {
        requestObj = PaymentItem.map((m: any) => {
          const orderItem = {
            "SourceSystem": m.site_id ? EnumObject.siteIdEnum.get(m.site_id?.toString()).value:"",            
            "OrderID": m.order_id?.toString(),
            "PaymentDate": m.paymentDate?.toString(),            
            "Amount": typeof m.amount == "string" ? parseFloat(m.amount).toFixed(2) : m.amount.toFixed(2),
            "Status":m.status? EnumObject.WickedReportPaymentStatusEnum.get(m.status?.toString()).value:"APPROVED"// [1=APPROVED, 2=FAILED, 3=REFUNDED, 4=PARTIALLY REFUNDED]
          };
          return orderItem;
        });
        responseObj =await this.PostRequestWickedReports(requestObj, activity_type);
        if (responseObj.errors.length>0) {
          status= 400;
        }
      }
      else {
        
        message = "Order items are required";
        status= 400;
      }
    }
    catch (error: any) {
      message = error.message;
            status= error.status;
    }
    finally {
      let WickedReportLog = {        
        status,
        message,
        request: requestObj,
        response: responseObj,
        thirdparty_id: this.thirdparty_id,
        "activity_type":3
      };
      let obj = new ThirdPartyController();
      await obj.SaveThirdPartyLog(WickedReportLog);
    }
  }

  /**
       * Post call to Wicked report
       * @param _data 
       * @param _function 
      
      */
  public async PostRequestWickedReports(_data: any, _function: string) {
    try {
      let _apiKey = this.GetWickedReportsAPIKey();
      console.log(`${this.apiUrl}${_function}`);
      var config: any = {
        method: "post",
        url: `${this.apiUrl}${_function}`,
        headers: {
          'Content-Type': 'application/json',
          'apikey': _apiKey,
          'test': this.testMode
        },
        data: _data
      };
      let result = await axios(config)
        .then(function (response: any) {
          //console.log(JSON.stringify(response.data));
          return response.data;
        })
        .catch(function (error: any) {

          throw new Error(error.message)
        });
     // console.log(result);
      return result;
    }
    catch (error: any) {
      throw new Error(error.message)
    }

  }

}