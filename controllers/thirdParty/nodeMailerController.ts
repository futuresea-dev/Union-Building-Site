const nodemailer = require('nodemailer');
const { dbReader, dbWriter } = require('../../models/dbConfig');
const S = require('string');
import moment, { Moment } from "moment";
import { enumerationController } from '../enumerationController';
import { sendEmailLogsController } from '../sendEmailogsController';
import { SendSMSLogsController } from "../sendSMSLogsController";
const Bluebird = require('bluebird');
var EnumObject = new enumerationController();
const fromDisplayName = 'Stuff You Can Use';
const accountSiteUrl = (process.env.NODE_ENV == "production") ? "https://accounts.stuffyoucanuse.org/" : "https://accounts.stuffyoucanuse.dev/";
const formatter = require('number-formatter');
function formatNumber(value : any) {
  return formatter("$#,##0.00", value);
}
export class NodeMailerController {

  // Email Template Convert Function
  public async ConvertData(ReqData: any, callback: any) {
    if (ReqData.templateIdentifier != 0) {

      var getEmailTemplate = await dbReader.emailDesignTemplate.findOne({
        where: { email_design_template_id: ReqData.templateIdentifier }
      });

      if (getEmailTemplate) {
        var mainData = getEmailTemplate.template_html_text;
        ReqData.subjectMail = getEmailTemplate.subject;

        var promiseWhile = async function (condition: any, action: any) {
          var resolver = Bluebird.defer();
          var loop = function () {
            if (!condition()) return resolver.resolve();
            return Bluebird.cast(action())
              .then(loop)
              .catch(resolver.reject);
          };
          process.nextTick(loop);
          return resolver.promise;
        };

        // $ Variable $
        var gv: any = [];
        const regex = /\$([0-9a-zA-Z-_\/\']+)\$/gm;
        let s;

        if (getEmailTemplate.template_html_text) {
          while ((s = regex.exec(getEmailTemplate.template_html_text)) !== null) {
            if (s.index === regex.lastIndex) {
              regex.lastIndex++;
            }
            gv.push(s[0]);
          }
        } else {
          while ((s = regex.exec(getEmailTemplate.template_html_text)) !== null) {
            if (s.index === regex.lastIndex) {
              regex.lastIndex++;
            }
            gv.push(s[0]);
          }
        }

        var gvcount = 0, stop = gv.length, gvd: any = {};

        promiseWhile(function () {
          return gvcount < stop;
        }, function () {
          var cntdata = gv[gvcount++];
          return new Promise(async function (resolve, reject) {
            switch (cntdata) {
              // Done
              case '$FirstName$':
                if (ReqData.first_name) {
                  gvd[cntdata] = ReqData.first_name;
                }
                else {
                  var tableData = await dbReader.users.findOne({
                    attributes: ['first_name'],
                    where: {
                      user_id: ReqData.user_id
                    }
                  });
                  gvd[cntdata] = tableData.first_name;
                }
                resolve(true);
                break;
              case '$SubscriptionMembership$':
                gvd[cntdata] = '';
                resolve(true);
                break;
              case '$Renew$':
                gvd[cntdata] = ReqData.Renew;
                console.log(ReqData.Renew);
                resolve(true);
                break;
              case '$UserName$':
                if (ReqData.username) {
                  gvd[cntdata] = ReqData.username;
                }
                else {
                  var tableData = await dbReader.users.findOne({
                    attributes: ['username'],
                    where: {
                      user_id: ReqData.user_id
                    }
                  });
                  gvd[cntdata] = tableData.username;
                }
                resolve(true);
                break;
              case '$ChangePasswordLink$':
                gvd[cntdata] = ReqData.redirect_url;
                resolve(true);
                break;
              case '$subscriptionNumber$':
                if (ReqData.subscriptionNumber) {
                  gvd[cntdata] = '#' + ReqData.subscriptionNumber;
                } else {
                  var tableData = await dbReader.userSubscription.findOne({
                    attributes: ['subscription_number'],
                    where: {
                      user_subscription_id: ReqData.user_subscription_id
                    }
                  });
                  gvd[cntdata] = '#' + tableData.subscription_number
                }
                resolve(true);
                break;
              case '$OrderNumber$':
                if (ReqData.orderNumber) {
                  gvd[cntdata] = ReqData.orderNumber;
                }
                else {
                  var tableData = await dbReader.userOrder.findOne({
                    attributes: ['user_order_number'],
                    where: {
                      user_orders_id: ReqData.userOrderId
                    }
                  });
                  gvd[cntdata] = tableData.user_order_number
                }
                resolve(true);
                break;
              case '$OrderCreatedDate$':
                if (ReqData.orderCreatedDate) {
                  gvd[cntdata] = moment(ReqData.orderCreatedDate).format('MMMM DD, YYYY');;
                }
                else {
                  var tableData = await dbReader.userOrder.findOne({
                    attributes: ['created_datetime'],
                    where: {
                      user_orders_id: ReqData.userOrderId
                    }
                  });
                  tableData = JSON.parse(JSON.stringify(tableData));
                  if (tableData) {
                    gvd[cntdata] = moment(tableData.created_datetime).format('MMMM DD, YYYY');
                  } else {
                    gvd[cntdata] = ''
                  }
                }
                resolve(true);
                break;
              case '$OrderPaymentLink$':
                // gvd[cntdata] = ReqData.orderPaymentLink;
                gvd[cntdata] = 'www.google.com'
                resolve(true);
                break;
              case '$OrderDetails$':
                var tableData: any = [];
                if (ReqData.OrderDetails) {
                  tableData = ReqData.OrderDetails;
                } else {
                  tableData = await dbReader.userOrderItems.findAll({
                    attributes: ['product_name', 'product_amount', 'updated_product_name'],
                    where: {
                      user_orders_id: ReqData.userOrderId
                    }
                  });
                }
                var htmlRender = ""
                var updated_product_name = ""
                for (var i = 0; i < tableData.length; i++) {
                  if (tableData[i].updated_product_name) {
                    if ((tableData[i].updated_product_name).includes("Kids")) {
                      updated_product_name = "Grow Curriculum (Kids)"
                    } else if ((tableData[i].updated_product_name).includes("Students")) {
                      updated_product_name = "Grow Curriculum (Students)"
                    } else if ((tableData[i].updated_product_name).includes("Groups")) {
                      updated_product_name = "Grow Curriculum (Groups)"
                    } else {
                      updated_product_name = tableData[i].updated_product_name
                    }
                  } else {
                    if ((tableData[i].product_name).includes("Kids")) {
                      updated_product_name = "Grow Curriculum (Kids)"
                    } else if ((tableData[i].product_name).includes("Students")) {
                      updated_product_name = "Grow Curriculum (Students)"
                    } else if ((tableData[i].product_name).includes("Groups")) {
                      updated_product_name = "Grow Curriculum (Groups)"
                    } else {
                      updated_product_name = (tableData[i].product_name)
                    }
                  }
                  // var updated_product_name = ((tableData[i].updated_product_name) ? ((tableData[i].updated_product_name).includes("kids"))? "" : ((tableData[i].updated_product_name).includes("students")) ? "" : ((tableData[i].updated_product_name).includes()) ? "": tableData[i].product_name)
                  htmlRender += '<tr><td style="color: #636363; border: 1px solid #e5e5e5; vertical-align: middle; padding: 12px; text-align: left">' + updated_product_name + '</td>' +
                    '<td style="color: #636363; border: 1px solid #e5e5e5; vertical-align: middle; padding: 12px; text-align: left">' + 1 + '</td>' +
                    '<td style="color: #636363; border: 1px solid #e5e5e5; vertical-align: middle; padding: 12px; text-align: left">' +formatNumber(tableData[i].product_amount) + '</td></tr>';
                }
                gvd[cntdata] = htmlRender;
                resolve(true);
                break;
              case '$SubscriptionInformation$':
                if (ReqData.isRecurringSubscription) {
                  var SubscriptionDetailsHtml = "";
                  if (ReqData.SubscriptionDetails) {
                    for (var i = 0; i < ReqData.SubscriptionDetails.length; i++) {
                      SubscriptionDetailsHtml += '<tr><td style="color: #636363; border: 1px solid #e5e5e5; vertical-align: middle; padding: 12px; text-align: left">' + moment(ReqData.SubscriptionDetails[i].start_date, moment.defaultFormat).format('MM/DD/YYYY') + '</td>' +
                        '<td style="color: #636363; border: 1px solid #e5e5e5; vertical-align: middle; padding: 12px; text-align: left">' + moment(ReqData.SubscriptionDetails[i].end_date, moment.defaultFormat).format('MM/DD/YYYY') + '</td>' +
                        '<td style="color: #636363; border: 1px solid #e5e5e5; vertical-align: middle; padding: 12px; text-align: left">' + formatNumber(ReqData.orderTotal)+ '</td></tr>';
                    }
                  } else {
                    if (ReqData.userOrderId) {
                      var tableData = await dbReader.userOrder.findAll({
                        include: [{
                          model: dbReader.userSubscription
                        }],
                        where: {
                          user_orders_id: ReqData.userOrderId
                        }
                      }).catch((error: any) => {
                        console.log(error)
                      });
                      for (var i = 0; i < tableData.length; i++) {
                        SubscriptionDetailsHtml += '<tr><td style="color: #636363; border: 1px solid #e5e5e5; vertical-align: middle; padding: 12px; text-align: left">' + moment(tableData[i].user_subscription.start_date, moment.defaultFormat).format('MM/DD/YYYY') + '</td>' +
                          '<td style="color: #636363; border: 1px solid #e5e5e5; vertical-align: middle; padding: 12px; text-align: left">' + moment(tableData[i].user_subscription.end_date, moment.defaultFormat).format('MM/DD/YYYY') + '</td>' +
                          '<td style="color: #636363; border: 1px solid #e5e5e5; vertical-align: middle; padding: 12px; text-align: left">$' + ReqData.orderTotal + '</td></tr>';
                      }
                    }
                  }
                  let details = "Your ", heading = "Subscription Information", paymentsArray = [];;
                  function ordinal_suffix_of(i: any) {
                    var j = i % 10,
                      k = i % 100;
                    if (j == 1 && k != 11) {
                      return i + "st";
                    }
                    if (j == 2 && k != 12) {
                      return i + "nd";
                    }
                    if (j == 3 && k != 13) {
                      return i + "rd";
                    }
                    return i + "th";
                  }
                  for (let i = 0; i < ReqData.productDetails.length; i++) {
                    heading = (ReqData.productDetails[i].product_duration == 90) ? ('Quarter ' + ReqData.productDetails[i].renewal_count) : "Subscription Information";
                    let count = ReqData.productDetails[i].product_duration == 90 ? "4 quarterly" : (ReqData.productDetails[i].product_duration == 30) ? "12 monthly" : "1 yearly"
                    let renew_count = (count.includes("quarterly") || count.includes("monthly")) ? ordinal_suffix_of(ReqData.productDetails[i].renewal_count) : ReqData.productDetails[i].renewal_count
                 
                    paymentsArray.push(`${renew_count} of ${count} payment for ${ReqData.productDetails[i].product_name}`);
                  }
                  if (paymentsArray.length > 1) {
                    let lastPayment = paymentsArray.pop();
                    details += paymentsArray.join(", ") + " and " + lastPayment;
                  } else {
                    details += paymentsArray[0];
                  }

                  if (ReqData.failedFlag == 1) {
                    details += " were unsuccessful";
                  } 
                  // else {
                  //   details += ".";
                  // }
                    //   if (i != 0) {
                  //     if (ReqData.failedFlag == 1) {
                  //       details += "and " + renew_count + " of " + count + " payments for " + (ReqData.productDetails[i].product_name) + " was unsuccessful. "
                  //     } else {
                  //       details += "and " + renew_count + " of " + count + " payments for " + ReqData.productDetails[i].product_name
                  //     }
                  //   } else {
                  //     if (ReqData.failedFlag == 1) {
                  //       details += renew_count + " of " + count + " payments for " + (ReqData.productDetails[i].product_name) + " was unsuccessful. "
                  //     } else {
                  //       details += renew_count + " of " + count + " payments for " + ReqData.productDetails[i].product_name
                  //     }
                  //   }
                  // }
                  let statement = ` The charge on your credit card will appear as <b>"SYCU/Grow"</b>`
                  if (ReqData.isCheckPayment) {
                    statement = 'We have successfully received your check payment.'
                  }
                  if (ReqData.failedFlag == 1) {
                    statement = ` We were unable to charge your card for this subscription. Please update your card information. We will try again to take your payment over the next 7 days.
                      <small> 
                                                                     <b> To regain access to your resources, please
                                                                   <a href="https://accounts.stuffyoucanuse.dev/?q=3"
                                                                    style="color: #556cd6; font-weight: normal; text-decoration: underline"
                                                                    target="_blank" rel="noreferrer"><b>click here to update your credit card</b></a>.</b></div>
                                        <div style="margin-top: 35px;text-align: center;"> 
                                            <a href="https://accounts.stuffyoucanuse.dev/?q=3" style="background: #b0cf46;    border-radius: 8px;color: #fff;   display: inline-block;font-size: 16px;font-style: normal;line-height: normal;padding: 12px 30px;box-sizing: border-box;text-decoration: none;font-weight: 500;" target="_blank">Update Credit Card</a>
                                        </div>`
                  }
                  gvd[cntdata] = ` <small> ${details}. ${statement}</small>
                  <div style="margin-bottom: 0px;margin-top: 35px;">
                  <h2 style="margin-bottom: 10px;color: #556cd6; display: block; font-family: &quot;Helvetica Neue&quot;,Helvetica,Roboto,Arial,sans-serif; font-size: 18px; font-weight: bold; line-height: 130%; margin: 0 0 18px; text-align: left;margin-bottom: 10px"> ${heading} </h2>
                  <table style="color: #636363; border: 1px solid #e5e5e5; vertical-align: middle; width: 100%; font-family: 'Helvetica Neue',Helvetica,Roboto,Arial,sans-serif; margin-bottom: 0.5em;margin-top: 5px;" cellspacing="0" cellpadding="6" border="1">
                      <thead><tr>
                              <th style="color: #636363; border: 1px solid #e5e5e5; vertical-align: middle; padding: 12px; text-align: left"> Start date </th>
                              <th style="color: #636363; border: 1px solid #e5e5e5; vertical-align: middle; padding: 12px; text-align: left"> End date </th>
                              <th style="color: #636363; border: 1px solid #e5e5e5; vertical-align: middle; padding: 12px; text-align: left"> Recurring total </th>
                      </tr></thead>
                      <tbody> ${SubscriptionDetailsHtml} </tbody>
                  </table>
                  </div>`
                } else {
                  gvd[cntdata] = ''
                }
                resolve(true);
                break;
              case '$SubscriptionDetails$':
                if (ReqData.SubscriptionDetails) {
                  var htmlRender = "";
                  for (var i = 0; i < ReqData.SubscriptionDetails.length; i++) {
                    htmlRender += '<tr><td style="color: #636363; border: 1px solid #e5e5e5; vertical-align: middle; padding: 12px; text-align: left">' + (i + 1) + '</td>' +
                      '<td style="color: #636363; border: 1px solid #e5e5e5; vertical-align: middle; padding: 12px; text-align: left">' + moment(ReqData.SubscriptionDetails[i].start_date, moment.defaultFormat).format('DD/MM/YYYY') + '</td>' +
                      '<td style="color: #636363; border: 1px solid #e5e5e5; vertical-align: middle; padding: 12px; text-align: left">' + moment(ReqData.SubscriptionDetails[i].end_date, moment.defaultFormat).format('DD/MM/YYYY') + '</td>' +
                      '<td style="color: #636363; border: 1px solid #e5e5e5; vertical-align: middle; padding: 12px; text-align: left">$' + ReqData.SubscriptionDetails[i].total_amount + '</td></tr>';
                  }
                  gvd[cntdata] = htmlRender;
                } else {
                  if (ReqData.userOrderId) {
                    var tableData = await dbReader.userOrder.findAll({
                      include: [{
                        model: dbReader.userSubscription
                      }],
                      where: {
                        user_orders_id: ReqData.userOrderId
                      }
                    }).catch((error: any) => {
                      console.log(error)
                    });
                    var htmlRender = "";
                    for (var i = 0; i < tableData.length; i++) {
                      htmlRender += '<tr><td style="color: #636363; border: 1px solid #e5e5e5; vertical-align: middle; padding: 12px; text-align: left">' + tableData[i].user_subscription.user_subscription_id + '</td>' +
                        '<td style="color: #636363; border: 1px solid #e5e5e5; vertical-align: middle; padding: 12px; text-align: left">' + moment(tableData[i].user_subscription.start_date, moment.defaultFormat).format('DD/MM/YYYY') + '</td>' +
                        '<td style="color: #636363; border: 1px solid #e5e5e5; vertical-align: middle; padding: 12px; text-align: left">' + moment(tableData[i].user_subscription.end_date, moment.defaultFormat).format('DD/MM/YYYY') + '</td>' +
                        '<td style="color: #636363; border: 1px solid #e5e5e5; vertical-align: middle; padding: 12px; text-align: left">$' + tableData[i].user_subscription.total_amount + '</td></tr>';
                    }
                    // gvd[cntdata] = tableData.sub_amount;
                    gvd[cntdata] = htmlRender;
                  } else {
                    gvd[cntdata] = '';
                  }
                }
                resolve(true);
                break;
              case '$OrderSubTotal$':
                if (ReqData.orderSubTotal) {
                  gvd[cntdata] =  formatNumber(ReqData.orderSubTotal);
                } else {
                  var tableData = await dbReader.userOrder.findOne({
                    attributes: ['sub_amount'],
                    where: {
                      user_orders_id: ReqData.userOrderId
                    }
                  });
                  gvd[cntdata] = formatNumber(tableData.sub_amount);
                }
                resolve(true);
                break;
              case '$FinalTotal$':
                let FinalTotal = 0
                if (ReqData.finalTotal) {
                  FinalTotal = ReqData.finalTotal
                }
                gvd[cntdata] = '$' + FinalTotal
                resolve(true);
                break;
              case '$RefundDate$':
                if (ReqData.refundDate) {
                  gvd[cntdata] = moment(ReqData.refundDate).format('MMMM DD, YYYY');
                } else {
                  var tableData = await dbReader.refunds.findOne({
                    attributes: ['created_datetime'],
                    where: {
                      refund_id: ReqData.refund_id
                    }
                  })
                  gvd[cntdata] = moment(tableData.created_datetime).format('MMMM DD, YYYY')
                }
                resolve(true);
                break;
              case '$RefundData$':
                var htmlRender = "";
                if (ReqData.refundData) {
                  for (let i = 0; i < ReqData.refundData.length; i++) {
                    htmlRender += '<tr><th colspan="2" style="color: #636363; border: 1px solid #e5e5e5; vertical-align: middle; padding: 12px; text-align: left"> Refunded on ' + ReqData.refundData[i].date + ' </th>' +
                      '<td style="color: #636363; border: 1px solid #e5e5e5; vertical-align: middle; padding: 12px; text-align: left"><span> $' + ReqData.refundData[i].amount + '</span> </td>' +
                      '</tr>';
                  }
                } else {
                  let tempRefData = await dbReader.refunds.findAll({
                    where: {
                      order_id: ReqData.userOrderId
                    }
                  })
                  tempRefData.forEach((e: any) => {
                    let date = moment(new Date(e.created_datetime)).format('MMMM DD, YYYY, hh:mm A');
                    htmlRender += '<tr><th colspan="2" style="color: #636363; border: 1px solid #e5e5e5; vertical-align: middle; padding: 12px; text-align: left"> Refunded on ' + date + ' </th>' +
                      '<td style="color: #636363; border: 1px solid #e5e5e5; vertical-align: middle; padding: 12px; text-align: left"><span> $' + e.refund_amount + '</span> </td>' +
                      '</tr>';
                  })
                }
                gvd[cntdata] = htmlRender;
                resolve(true);
                break;
              case '$OrderTotal$':
                if (ReqData.orderTotal) {
                  gvd[cntdata] = formatNumber(ReqData.orderTotal);
                }
                else {
                  var tableData = await dbReader.userOrder.findOne({
                    attributes: ['total_amount'],
                    where: {
                      user_orders_id: ReqData.userOrderId
                    }
                  });
                  gvd[cntdata] = formatNumber(tableData.total_amount);
                }
                resolve(true);
                break;
              case '$SiteName$':
                if (ReqData.SiteName) {
                  gvd[cntdata] = ReqData.SiteName;
                } else {
                  var tableData = await dbReader.sites.findOne({
                    attributes: ['title'],
                    where: {
                      site_id: "Grow" + ReqData.title
                    }
                  });
                  gvd[cntdata] = tableData.title;
                }
                resolve(true);
                break;
              case '$LastName$':
                if (ReqData.lastName) {
                  gvd[cntdata] = ReqData.lastName;
                }
                else {
                  var tableData = await dbReader.users.findOne({
                    attributes: ['last_name'],
                    where: {
                      user_id: ReqData.user_id
                    }
                  });
                  gvd[cntdata] = tableData.last_name;
                }
                resolve(true);
                break;
              case '$Shipping$':
                if (ReqData.shipping) {
                  gvd[cntdata] = ReqData.shipping;
                }
                else {
                  var tableData = await dbReader.userOrder.findOne({
                    attributes: ['shipping_amount'],
                    where: {
                      user_orders_id: ReqData.userOrderId
                    }
                  });
                  gvd[cntdata] = tableData.shipping;
                }
                resolve(true);
                break;
              case '$PaymentMethod$':
                if (ReqData.paymentMethod == 1) {
                  gvd[cntdata] = 'Stripe'; //ReqData.paymentMethod;
                } else if (ReqData.paymentMethod == 2) {
                  gvd[cntdata] = 'Check'; //ReqData.paymentMethod;
                } else {
                  gvd[cntdata] = 'Manual'; //ReqData.paymentMethod;
                }
                resolve(true);
                break;
              case '$UserAddress$':
                if (ReqData.userAddress) {
                  gvd[cntdata] = ReqData.userAddress;
                }
                else {
                  var tableData = await dbReader.billingAddress.findOne({
                    attributes: ['address_line1', 'address_line2', 'city'],
                    include: [{
                      model: dbReader.state,
                      attributes: ['name']
                    }, {
                      model: dbReader.country,
                      attributes: ['name']
                    }],
                    where: {
                      user_orders_id: ReqData.userOrderId,
                      address_type: 2
                    }
                  });
                  gvd[cntdata] = tableData.address_line1 + " " + tableData.address_line2 + "," + tableData.city + "," + tableData.sycu_state.name + "," + tableData.sycu_country.name;
                }
                // gvd[cntdata] = ReqData.userAddress;
                resolve(true);
                break;
              case '$UserEmail$':
                if (ReqData.user_email) {
                  gvd[cntdata] = ReqData.user_email;
                }
                else {
                  var tableData = await dbReader.users.findOne({
                    attributes: ['email'],
                    where: {
                      user_id: ReqData.user_id
                    }
                  });
                  gvd[cntdata] = tableData.email;
                }
                resolve(true);
                break;
              case '$BillingAddress$':
                if (ReqData.billingAddress) {
                  gvd[cntdata] = ReqData.billingAddress;
                }
                else {
                  let tableData = await dbReader.userAddress.findOne({
                    where: { is_deleted: 0, address_type: 1, user_orders_id: null, user_id: ReqData.user_id },
                    include: [{
                      model: dbReader.state,
                      attributes: ['name']
                    }, {
                      model: dbReader.country,
                      attributes: ['name']
                    }]
                  });
                  gvd[cntdata] = tableData.address_line1 + " " + tableData.address_line2 + "," + tableData.city + "," + tableData.sycu_state.name + "," + tableData.sycu_country.name;
                }
                resolve(true);
                break;
              case '$SHIPBOB_PRODUCT$':
                if (ReqData.shipbob_product) {
                  gvd[cntdata] = ReqData.shipbob_product;
                } else {
                  gvd[cntdata] = "";
                }
                resolve(true);
                break;
              case '$SHIPPING_ADDRESS$':
                if (ReqData.shipping_address) {
                  gvd[cntdata] = "[" + ReqData.shipping_address + "]";
                } else {
                  gvd[cntdata] = "";
                }
                resolve(true);
                break;
              case '$CONFIRM_LINK1$':
                if (ReqData.confirmation_link1) {
                  gvd[cntdata] = ReqData.confirmation_link1;
                } else {
                  gvd[cntdata] = "";
                }
                resolve(true);
                break;
              case '$CONFIRM_LINK2$':
                if (ReqData.confirmation_link2) {
                  gvd[cntdata] = ReqData.confirmation_link2;
                } else {
                  gvd[cntdata] = "";
                }
                resolve(true);
                break;
              case '$SubscriptionAccount$':
                gvd[cntdata] = "SubscriptionAccount";// ReqData.subscriptionAccount;
                resolve(true);
                break;
              default:
                resolve(true);
            }
          });
        }).then(async function () {
          var dts = mainData;
          Object.keys(gvd).forEach(function (key) {
            if (!gvd[key]) gvd[key] = "";
            gvd[key] = S(gvd[key]).unescapeHTML().s
            dts = S(dts).replaceAll(key, S(gvd[key]).escapeHTML().s).s;
          });
          var dtss = S(dts).unescapeHTML().s;
          ReqData.htmlContent = dtss;
          var body = {
            status: 1,
            user_id: ReqData.user_id,
            email_design_template_id: ReqData.templateIdentifier,
            subject_mail: ReqData.subjectMail,
            site: ReqData.site,
            receiver: ReqData.user_email,
            htmlContent: ReqData.htmlContent,
            global_id: (ReqData.userOrderId) ? ReqData.userOrderId : 0
          };
          ReqData.body = body;

          var getHtmlContent = new sendEmailLogsController();
          if (ReqData.user_email) {
            var server = {}, ObjectArray = {};
            // Getting mail server
            var emailService = await dbReader.siteEmailServices.findOne({
              where: {
                site_id: ReqData.site,
                is_deleted: 0,
              },
              order: [['site_email_service_id', 'DESC']]
            });
            emailService = JSON.parse(JSON.stringify(emailService));
            if (emailService) {
              var cntData = emailService.email_service_id;
              ReqData.body.site_email_service_id = emailService.site_email_service_id
              switch (cntData) {
                // getting email_service_id to send mail through enum
                case EnumObject.emailServerIdEnum.get('aws').value:
                  var getEmailServiceData = JSON.parse(emailService.service_type_credentials);
                  // server = {
                  //   service: getEmailServiceData[0].smtp_server,
                  //   host: 'email-smtp.us-west-2.amazonaws.com',
                  //   port: getEmailServiceData[1].smtp_port,
                  //   secureConnection: true,
                  //   auth: {
                  //       user: getEmailServiceData[6].smtpUser,
                  //       pass: getEmailServiceData[4].smtpPassword
                  //   }
                  // };
                  //
                  break;
                case EnumObject.emailServerIdEnum.get('gmail').value:
                  var getEmailServiceData = JSON.parse(emailService.service_type_credentials);
                  server = getEmailServiceData;
                  ObjectArray = {
                    from: {
                      name: fromDisplayName,
                      address: getEmailServiceData.auth.user
                    },
                    to: ReqData.user_email,
                    replyTo: "support@stuffyoucanuse.org",
                    subject: ReqData.subjectMail,
                    html: ReqData.htmlContent
                  };
                  ReqData.body.sender = getEmailServiceData.auth.user
                  break;
                case EnumObject.emailServerIdEnum.get('smtp').value:
                  var getEmailServiceData = JSON.parse(emailService.service_type_credentials);
                  delete getEmailServiceData.serviceProvider
                  server = getEmailServiceData;
                  ObjectArray = {
                    from: {
                      name: fromDisplayName,
                      address: 'support@stuffyoucanuse.org'
                    },
                    to: ReqData.user_email,
                    replyTo: "support@stuffyoucanuse.org",
                    subject: ReqData.subjectMail,
                    html: ReqData.htmlContent
                  };
                  ReqData.body.sender = 'support@stuffyoucanuse.org'
                  break;
                default:
                  break;
              }
              let transporter = await nodemailer.createTransport(server);
              transporter.sendMail(ObjectArray, async function (error: any, info: any) {
                if (error) {
                  console.log(error);
                  body.status = 0;
                  //ReqData.body['response_data'] = JSON.stringify(error);
                  ReqData.body.response_data = JSON.stringify(error);
                  await getHtmlContent.uploadDataToAWSBucket(ReqData);
                } else {
                  ReqData.body.response_data = JSON.stringify(info);
                  await getHtmlContent.uploadDataToAWSBucket(ReqData);
                }
              });
            } else {
              body.status = 0;
              await getHtmlContent.uploadDataToAWSBucket(ReqData);
            }
          } else {
            body.status = 0;
            await getHtmlContent.uploadDataToAWSBucket(ReqData);
          }
        });
      } else {
        console.log("Email Template Not Found.");
      }
    } else {
      console.log("Method Not Found.");
    }
  }

  public async sendDirectMail(ReqData: any) {
    try {
      var body = {
        status: 1,
        user_id: ReqData.user_id,
        email_design_template_id: ReqData.templateIdentifier,
        subject_mail: ReqData.subjectMail,
        site: ReqData.site,
        receiver: ReqData.user_email,
        htmlContent: ReqData.htmlContent,
        global_id: (ReqData.userOrderId) ? ReqData.userOrderId : 0,
        parent_id: (ReqData.parent_id) ? ReqData.parent_id : 0,
      };
      ReqData.body = body;

      var server = {}, ObjectArray = {};
      // Getting mail server 
      var emailService = await dbReader.siteEmailServices.findOne({
        where: {
          site_id: ReqData.site,
          is_deleted: 0,
        },
        order: [['site_email_service_id', 'DESC']]
      });
      emailService = JSON.parse(JSON.stringify(emailService));
      var getHtmlContent = new sendEmailLogsController();
      if (emailService) {
        var cntData = emailService.email_service_id;
        ReqData.body.site_email_service_id = emailService.site_email_service_id
        switch (cntData) {
          // getting email_service_id to send mail through enum
          case EnumObject.emailServerIdEnum.get('aws').value:
            var getEmailServiceData = JSON.parse(emailService.service_type_credentials);
            break;
          case EnumObject.emailServerIdEnum.get('gmail').value:
            var getEmailServiceData = JSON.parse(emailService.service_type_credentials);
            server = getEmailServiceData;
            ObjectArray = {
              from: {
                name: fromDisplayName,
                address: getEmailServiceData.auth.user
              },
              to: ReqData.user_email,
              replyTo: "support@stuffyoucanuse.org",
              subject: ReqData.subjectMail,
              html: ReqData.htmlContent
            };
            ReqData.body.sender = getEmailServiceData.auth.user
            break;
          case EnumObject.emailServerIdEnum.get('smtp').value:
            var getEmailServiceData = JSON.parse(emailService.service_type_credentials);
            delete getEmailServiceData.serviceProvider
            server = getEmailServiceData;
            ObjectArray = {
              from: {
                name: fromDisplayName,
                address: getEmailServiceData.auth.user
              },
              to: ReqData.user_email,
              replyTo: "support@stuffyoucanuse.org",
              subject: ReqData.subjectMail,
              html: ReqData.htmlContent
            };
            ReqData.body.sender = getEmailServiceData.auth.user
            break;
          default:
            break;
        }
        let transporter = await nodemailer.createTransport(server);
        transporter.sendMail(ObjectArray, async function (error: any, info: any) {
          if (error) {
            console.log(error);
            body.status = 0;
            //ReqData.body['response_data'] = JSON.stringify(error);
            ReqData.body.response_data = JSON.stringify(error);
            await getHtmlContent.uploadDataToAWSBucket(ReqData);
          } else {
            ReqData.body.response_data = JSON.stringify(info);
            await getHtmlContent.uploadDataToAWSBucket(ReqData);
          }
        });
      } else {
        body.status = 0;
        await getHtmlContent.uploadDataToAWSBucket(ReqData);
      }
    } catch (e: any) {
      throw new Error(e.message);
    }
  }

  public async ConvertSMSData(ReqData: any) {
    if (ReqData.templateIdentifier != 0) {
      let getSMSTemplate = await dbReader.smsDesignTemplate.findOne({
        where: { sms_design_template_id: ReqData.templateIdentifier }
      });
      if (getSMSTemplate) {
        let mainData = getSMSTemplate.sms_content;
        let promiseWhile = async function (condition: any, action: any) {
          let resolver = Bluebird.defer();
          let loop = function () {
            if (!condition()) return resolver.resolve();
            return Bluebird.cast(action())
              .then(loop)
              .catch(resolver.reject);
          };
          process.nextTick(loop);
          return resolver.promise;
        };

        // $ Variable $
        let gv: any = [];
        const regex = /\$([0-9a-zA-Z-_\/\']+)\$/gm;
        let s;

        if (getSMSTemplate.sms_content) {
          while ((s = regex.exec(getSMSTemplate.sms_content)) !== null) {
            if (s.index === regex.lastIndex) {
              regex.lastIndex++;
            }
            gv.push(s[0]);
          }
        } else {
          while ((s = regex.exec(getSMSTemplate.sms_content)) !== null) {
            if (s.index === regex.lastIndex) {
              regex.lastIndex++;
            }
            gv.push(s[0]);
          }
        }

        let gvcount = 0, stop = gv.length, gvd: any = {};

        promiseWhile(function () {
          return gvcount < stop;
        }, function () {
          let cntdata = gv[gvcount++];
          return new Promise(async function (resolve, reject) {
            switch (cntdata) {
              //for hub sms
              case '$otpCode$':
                gvd[cntdata] = ReqData.otpCode;
                resolve(true);
                break;
              case '$meetup_title$':
                if (ReqData.meetup_title) {
                  gvd[cntdata] = ReqData.meetup_title;
                }
                else {
                  gvd[cntdata] = "";
                }
                resolve(true);
                break;
              case '$meetup_datetime$':
                if (ReqData.meetup_datetime) {
                  gvd[cntdata] = ReqData.meetup_datetime;
                }
                else {
                  gvd[cntdata] = "";
                }
                resolve(true);
                break;
              case '$meetup_link$':
                if (ReqData.meetup_link) {
                  gvd[cntdata] = ReqData.meetup_link;
                }
                else {
                  gvd[cntdata] = "";
                }
                resolve(true);
                break;
              case '$fullName$':
                if (ReqData.fullName) {
                  gvd[cntdata] = ReqData.fullName;
                }
                resolve(true);
                break;
              default:
                resolve(true);
            }
          });
        }).then(async function () {
          let dts = mainData;
          Object.keys(gvd).forEach(function (key) {
            if (!gvd[key]) gvd[key] = "";
            gvd[key] = S(gvd[key]).unescapeHTML().s
            dts = S(dts).replaceAll(key, S(gvd[key]).escapeHTML().s).s;
          });
          let dtss = S(dts).unescapeHTML().s;
          ReqData.htmlContent = dtss;
          let body = {
            status: 1,
            sms_design_template_id: ReqData.templateIdentifier,
            user_id: ReqData.user_id,
            site_id: ReqData.site,
            receiver: ReqData.mobile,
            content_text: ReqData.htmlContent
          };
          ReqData.body = body;

          var getHtmlContent = new SendSMSLogsController();
          if (ReqData.mobile) {
            let siteSmsServices = await dbReader.siteSmsServices.findOne({
              attributes: ['service_type_credentials'],
              where: { is_deleted: 0, site_id: 2, service_type: 'twilio' }
            });
            siteSmsServices = JSON.parse(JSON.stringify(siteSmsServices));
            let countryCode = await dbReader.users.findOne({
              where: { user_id: ReqData.user_id, is_deleted: 0 },
            });
            let to = '+1' + ReqData.mobile;
            if (countryCode) {
              countryCode = JSON.parse(JSON.stringify(countryCode));
              if (countryCode.country_code.includes('+')) {
                to = countryCode.country_code + ReqData.mobile;
              } else {
                to = '+' + countryCode.country_code + ReqData.mobile;
              }
            }
            ReqData.body.receiver = to;
            let twilio_credentials = JSON.parse(siteSmsServices.service_type_credentials);
            let SMSSenderId = twilio_credentials.sender_id;
            let accountSid = twilio_credentials.account_id;
            let authToken = twilio_credentials.auth_token;
            let client = require('twilio')(accountSid, authToken);
            client.messages
              .create({
                body: ReqData.htmlContent,
                from: SMSSenderId,
                to: to,
              })
              .then(async (info: any) => {
                ReqData.body.response_data = JSON.stringify(info);
                await getHtmlContent.createSMSLog(ReqData)
              })
              .catch(async (error: any) => {
                ReqData.body.status = 0;
                ReqData.body.response_data = JSON.stringify(error);
                await getHtmlContent.createSMSLog(ReqData);
              });
          } else {
            console.log("Mobile number Not found.");
          }
        });
      } else {
        console.log("SMS Template Not Found.");
      }
    } else {
      console.log("Method Not Found.");
    }
  }
}
