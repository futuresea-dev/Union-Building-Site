import { enumerationController } from '../enumerationController';
import { ThirdPartyController } from '../thirdParty/thirdPartyController';
const { dbReader, dbWriter } = require('../../models/dbConfig');
const axios = require('axios');
const request = require("request");
const thirdParty = new ThirdPartyController();
const enumObject = new enumerationController();
const hubspotThirdPartyId = 2;//hubspot log hubspotThirdPartyId
//v6 products
const GrowYourKidsV6Annual = enumObject.productIdEnum.get("GrowYourKidsV6Annual").value;
const GrowYourKidsV6Monthly = enumObject.productIdEnum.get("GrowYourKidsV6Monthly").value;
const GrowYourKidsV6Quarterly = enumObject.productIdEnum.get("GrowYourKidsV6Quarterly").value;
const GrowYourStudentV6Annual = enumObject.productIdEnum.get("GrowYourStudentV6Annual").value;
const GrowYourStudentV6Monthly = enumObject.productIdEnum.get("GrowYourStudentV6Monthly").value;
const GrowYourStudentV6Quarterly = enumObject.productIdEnum.get("GrowYourStudentV6Quarterly").value;
const GrowYourKidsMinistryV6Annual = enumObject.productIdEnum.get("GrowYourKidsMinistryV6Annual").value;
const GrowYourKidsMinistryV6Monthly = enumObject.productIdEnum.get("GrowYourKidsMinistryV6Monthly").value;
const GrowYourKidsMinistryV6Quarterly = enumObject.productIdEnum.get("GrowYourKidsMinistryV6Quarterly").value;
const GrowYourStudentMinistryV6Annual = enumObject.productIdEnum.get("GrowYourStudentMinistryV6Annual").value;
const GrowYourStudentMinistryV6Monthly = enumObject.productIdEnum.get("GrowYourStudentMinistryV6Monthly").value;
const GrowYourStudentMinistryV6Quarterly = enumObject.productIdEnum.get("GrowYourStudentMinistryV6Quarterly").value;
const GrowYourGroupMinistryV6Annual = enumObject.productIdEnum.get("GrowYourGroupMinistryV6Annual").value;
const GrowYourGroupMinistryV6Monthly = enumObject.productIdEnum.get("GrowYourGroupMinistryV6Monthly").value;
const GrowYourGroupMinistryV6Quarterly = enumObject.productIdEnum.get("GrowYourGroupMinistryV6Quarterly").value;
//v5 products
const GrowYourKidsV5Annual = enumObject.productIdEnum.get("GrowYourKidsV5Annual").value;
const GrowYourKidsV5Monthly = enumObject.productIdEnum.get("GrowYourKidsV5Monthly").value;
const GrowYourKidsV5Quarterly = enumObject.productIdEnum.get("GrowYourKidsV5Quarterly").value;
const GrowYourStudentV5Annual = enumObject.productIdEnum.get("GrowYourStudentV5Annual").value;
const GrowYourStudentV5Monthly = enumObject.productIdEnum.get("GrowYourStudentV5Monthly").value;
const GrowYourStudentV5Quarterly = enumObject.productIdEnum.get("GrowYourStudentV5Quarterly").value;
const GrowYourKidsMinistryV5Annual = enumObject.productIdEnum.get("GrowYourKidsMinistryV5Annual").value;
const GrowYourKidsMinistryV5Monthly = enumObject.productIdEnum.get("GrowYourKidsMinistryV5Monthly").value;
const GrowYourKidsMinistryV5Quarterly = enumObject.productIdEnum.get("GrowYourKidsMinistryV5Quarterly").value;
const GrowYourStudentMinistryV5Annual = enumObject.productIdEnum.get("GrowYourStudentMinistryV5Annual").value;
const GrowYourStudentMinistryV5Monthly = enumObject.productIdEnum.get("GrowYourStudentMinistryV5Monthly").value;
const GrowYourStudentMinistryV5Quarterly = enumObject.productIdEnum.get("GrowYourStudentMinistryV5Quarterly").value;
const GrowYourGroupMinistryV5Annual = enumObject.productIdEnum.get("GrowYourGroupMinistryV5Annual").value;
const GrowYourGroupMinistryV5Monthly = enumObject.productIdEnum.get("GrowYourGroupMinistryV5Monthly").value;
const GrowYourGroupMinistryV5Quarterly = enumObject.productIdEnum.get("GrowYourGroupMinistryV5Quarterly").value;
//v4 products
const GrowYourKidsV4Annual = enumObject.productIdEnum.get("GrowYourKidsV4Annual").value;
const GrowYourKidsV4Quarterly = enumObject.productIdEnum.get("GrowYourKidsV4Quarterly").value;
const GrowYourStudentV4Annual = enumObject.productIdEnum.get("GrowYourStudentV4Annual").value;
const GrowYourStudentV4Quarterly = enumObject.productIdEnum.get("GrowYourStudentV4Quarterly").value;
const GrowYourKidsMinistryV4Annual = enumObject.productIdEnum.get("GrowYourKidsMinistryV4Annual").value;
const GrowYourKidsMinistryV4Monthly = enumObject.productIdEnum.get("GrowYourKidsMinistryV4Monthly").value;
const GrowYourKidsMinistryV4Quarterly = enumObject.productIdEnum.get("GrowYourKidsMinistryV4Quarterly").value;
const GrowYourStudentMinistryV4Annual = enumObject.productIdEnum.get("GrowYourStudentMinistryV4Annual").value;
const GrowYourStudentMinistryV4Monthly = enumObject.productIdEnum.get("GrowYourStudentMinistryV4Monthly").value;
const GrowYourStudentMinistryV4Quarterly = enumObject.productIdEnum.get("GrowYourStudentMinistryV4Quarterly").value;
//v3 products
const GrowYourKidsV3Annual = enumObject.productIdEnum.get("GrowYourKidsV3Annual").value;
const GrowYourKidsV3Quarterly = enumObject.productIdEnum.get("GrowYourKidsV3Quarterly").value;
const GrowYourStudentV3Annual = enumObject.productIdEnum.get("GrowYourStudentV3Annual").value;
const GrowYourStudentV3Quarterly = enumObject.productIdEnum.get("GrowYourStudentV3Quarterly").value;
const GrowYourKidsMinistryV3Annual = enumObject.productIdEnum.get("GrowYourKidsMinistryV3Annual").value;
const GrowYourKidsMinistryV3Monthly = enumObject.productIdEnum.get("GrowYourKidsMinistryV3Monthly").value;
const GrowYourKidsMinistryV3Quarterly = enumObject.productIdEnum.get("GrowYourKidsMinistryV3Quarterly").value;
const GrowYourStudentMinistryV3Annual = enumObject.productIdEnum.get("GrowYourStudentMinistryV3Annual").value;
const GrowYourStudentMinistryV3Monthly = enumObject.productIdEnum.get("GrowYourStudentMinistryV3Monthly").value;
const GrowYourStudentMinistryV3Quarterly = enumObject.productIdEnum.get("GrowYourStudentMinistryV3Quarterly").value;
//v2 products
const GrowYourKidsV2Annual = enumObject.productIdEnum.get("GrowYourKidsV2Annual").value;
const GrowYourKidsV2Quarterly = enumObject.productIdEnum.get("GrowYourKidsV2Quarterly").value;
const GrowYourStudentV2Annual = enumObject.productIdEnum.get("GrowYourStudentV2Annual").value;
const GrowYourStudentV2Quarterly = enumObject.productIdEnum.get("GrowYourStudentV2Quarterly").value;
const GrowYourKidsMinistryV2Annual = enumObject.productIdEnum.get("GrowYourKidsMinistryV2Annual").value;
const GrowYourKidsMinistryV2Monthly = enumObject.productIdEnum.get("GrowYourKidsMinistryV2Monthly").value;
const GrowYourKidsMinistryV2Quarterly = enumObject.productIdEnum.get("GrowYourKidsMinistryV2Quarterly").value;
const GrowYourStudentMinistryV2Annual = enumObject.productIdEnum.get("GrowYourStudentMinistryV2Annual").value;
const GrowYourStudentMinistryV2Monthly = enumObject.productIdEnum.get("GrowYourStudentMinistryV2Monthly").value;
const GrowYourStudentMinistryV2Quarterly = enumObject.productIdEnum.get("GrowYourStudentMinistryV2Quarterly").value;
//v1 products
const GrowYourStudentV1Annual = enumObject.productIdEnum.get("GrowYourStudentV1Annual").value;
const GrowYourStudentV1Quarterly = enumObject.productIdEnum.get("GrowYourStudentV1Quarterly").value;
const GrowYourStudentMinistryV1Annual = enumObject.productIdEnum.get("GrowYourStudentMinistryV1Annual").value;
const GrowYourStudentMinistryV1Monthly = enumObject.productIdEnum.get("GrowYourStudentMinistryV1Monthly").value;
const GrowYourStudentMinistryV1Quarterly = enumObject.productIdEnum.get("GrowYourStudentMinistryV1Quarterly").value;
//product arrays 
const gyk_v2_products = [GrowYourKidsV2Annual, GrowYourKidsV2Quarterly];
const gyk_v3_products = [GrowYourKidsV3Annual, GrowYourKidsV3Quarterly];
const gyk_v4_products = [GrowYourKidsV4Annual, GrowYourKidsV4Quarterly];
const gys_v1_products = [GrowYourStudentV1Annual, GrowYourStudentV1Quarterly];
const gys_v2_products = [GrowYourStudentV2Annual, GrowYourStudentV2Quarterly];
const gys_v3_products = [GrowYourStudentV3Annual, GrowYourStudentV3Quarterly];
const gys_v4_products = [GrowYourStudentV4Annual, GrowYourStudentV4Quarterly];
const gyk_v5_products = [GrowYourKidsV5Annual, GrowYourKidsV5Monthly, GrowYourKidsV5Quarterly];
const gyk_v6_products = [GrowYourKidsV6Annual, GrowYourKidsV6Quarterly, GrowYourKidsV6Monthly];
const gys_v5_products = [GrowYourStudentV5Annual, GrowYourStudentV5Monthly, GrowYourStudentV5Quarterly];
const gys_v6_products = [GrowYourStudentV6Annual, GrowYourStudentV6Quarterly, GrowYourStudentV6Monthly];
const gykm_v2_products = [GrowYourKidsMinistryV2Annual, GrowYourKidsMinistryV2Monthly, GrowYourKidsMinistryV2Quarterly];
const gykm_v3_products = [GrowYourKidsMinistryV3Annual, GrowYourKidsMinistryV3Monthly, GrowYourKidsMinistryV3Quarterly];
const gykm_v4_products = [GrowYourKidsMinistryV4Annual, GrowYourKidsMinistryV4Monthly, GrowYourKidsMinistryV4Quarterly];
const gykm_v6_products = [GrowYourKidsMinistryV6Annual, GrowYourKidsMinistryV6Quarterly, GrowYourKidsMinistryV6Monthly];
const gykm_v5_products = [GrowYourKidsMinistryV5Annual, GrowYourKidsMinistryV5Monthly, GrowYourKidsMinistryV5Quarterly];
const ggm_v6_products = [GrowYourGroupMinistryV6Annual, GrowYourGroupMinistryV6Monthly, GrowYourGroupMinistryV6Quarterly];
const ggm_v5_products = [GrowYourGroupMinistryV5Annual, GrowYourGroupMinistryV5Monthly, GrowYourGroupMinistryV5Quarterly];
const gym_v1_products = [GrowYourStudentMinistryV1Annual, GrowYourStudentMinistryV1Monthly, GrowYourStudentMinistryV1Quarterly];
const gym_v2_products = [GrowYourStudentMinistryV2Annual, GrowYourStudentMinistryV2Monthly, GrowYourStudentMinistryV2Quarterly];
const gysm_v3_products = [GrowYourStudentMinistryV3Annual, GrowYourStudentMinistryV3Monthly, GrowYourStudentMinistryV3Quarterly];
const gysm_v4_products = [GrowYourStudentMinistryV4Annual, GrowYourStudentMinistryV4Monthly, GrowYourStudentMinistryV4Quarterly];
const gysm_v5_products = [GrowYourStudentMinistryV5Annual, GrowYourStudentMinistryV5Monthly, GrowYourStudentMinistryV5Quarterly];
const gysm_v6_products = [GrowYourStudentMinistryV6Annual, GrowYourStudentMinistryV6Quarterly, GrowYourStudentMinistryV6Monthly];

export class HubSpotController {
    /**
    * create contact api
    * @param data 
    */
    public hubSpotCreateContact = async (registrationData: any) => {
        try {
            if (registrationData) {
                // get site name by site_id
                let site_name = enumObject.siteIdEnum.get(registrationData.via_portal.toString()).value;
                let ministry_name = registrationData.ministry_name ? registrationData.ministry_name : "";
                let source_page = registrationData.source_page ? registrationData.source_page : "";
                let first_name = registrationData.first_name ? registrationData.first_name : "";
                let last_name = registrationData.last_name ? registrationData.last_name : "";
                let mobile = registrationData.mobile ? registrationData.mobile : "";
                let email = registrationData.email ? registrationData.email : "";
                // make hubSpot data for api request  
                let hubSpotData = {
                    "submittedAt": Date.now(),
                    "fields": [
                        {
                            "name": "email",
                            "value": email
                        },
                        {
                            "name": "firstname",
                            "value": first_name
                        },
                        {
                            "name": "lastname",
                            "value": last_name
                        },
                        {
                            "name": "ministry_category",
                            "value": ministry_name
                        },
                        {
                            "name": "signup_for_products",
                            "value": source_page
                        },
                        {
                            "name": "source_application",
                            "value": site_name
                        },
                        {
                            "name": "phone",
                            "value": mobile
                        }
                    ]
                };
                // get hubSpot API configurations
                let getConfigurations = await thirdParty.GetThirdPartyConfigurationDetailsById(hubspotThirdPartyId);
                let configurationData = JSON.parse(JSON.stringify(getConfigurations));
                // get formGuid from site_id
                let hubSpotFormData = configurationData.configuration_json.site_details.find((value: any) => { return (registrationData.via_portal == value.site_id) })
                hubSpotFormData = hubSpotFormData ? hubSpotFormData : configurationData.configuration_json.site_details.find((value: any) => { return (value.site_id == 2) });
                let formGuid = hubSpotFormData.form_guid;
                let portalId = configurationData.configuration_json.portal_id;
                let hubSpotAPI: any = process.env["HUBSPOT_API"] ? process.env["HUBSPOT_API"] : 'https://api.hsforms.com/submissions/v3/integration/submit/';
                let hubSpotURL = hubSpotAPI + portalId + "/" + formGuid;
                let finalHubSpotData = JSON.stringify(hubSpotData);
                let activityType = "addHubSpotContact";
                await this.hubSpotAPIRequestResponse(finalHubSpotData, hubSpotURL, activityType, 'POST');
            }
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    /**
    * hubSpot API Request Response
    * @param hubSpotData (request data)
    * @param hubSpotURL (hubSpot URL)
    * @param activityType (type activity perform in hubSpot)
    * @param apiMethod (type api method in hubSpot)
    */
    public hubSpotAPIRequestResponse = async (hubSpotData: any, hubSpotURL: string, activityType: string, apiMethod: string) => {
        const options = {
            method: apiMethod,
            headers: { "Content-Type": "application/json; charset=utf8" },
            data: hubSpotData,
            url: hubSpotURL,
        };
        await axios(options).then(async function (response: any) {
            if (response) {
                let thirdPartyAPIStatus = enumObject.thirdPartyAPIResponse.get(response.status.toString());
                if (thirdPartyAPIStatus) {
                    let thirdPartyAPIStatusValue = thirdPartyAPIStatus.value;
                    let apiResponse = {
                        statusCode: response.status,
                        message: thirdPartyAPIStatusValue,
                        response: response.data
                    };
                    let hubSpotLog = {
                        activity_type: enumObject.thirdPartyActivityType.get(activityType).value,
                        thirdparty_id: hubspotThirdPartyId,
                        request: options,
                        response: apiResponse,
                        status: response.status,
                    };
                    await thirdParty.SaveThirdPartyLog(hubSpotLog);
                }
            }
        }).catch(async function (error: any) {
            let thirdPartyAPIStatusValue = error.response ? enumObject.thirdPartyAPIResponse.get(error.response.status.toString()) : error.message;
            let statusCode = error.response ? error.response.status : 400;
            let apiResponse = {
                statusCode: statusCode,
                message: thirdPartyAPIStatusValue,
                response: error
            };
            let hubSpotLog = {
                activity_type: enumObject.thirdPartyActivityType.get(activityType).value,
                thirdparty_id: hubspotThirdPartyId,
                request: options,
                response: apiResponse,
                status: statusCode,
            };
            await thirdParty.SaveThirdPartyLog(hubSpotLog);
        })
    }

    /**
    * hubSpot enroll contact into a workflow
    * @param enrollmentData 
    */
    public enrollContactIntoHubspotWorkflow = async (enrollmentData: any) => {
        try {
            if (enrollmentData) {
                let properties: any = [], gyk_v5_flag: any = false, gys_v5_flag: any = false, gykm_v5_flag: any = false, gym_v1_flag: any = false;
                let gyk_v2_flag: any = false, gys_v2_flag: any = false, gykm_v2_flag: any = false, gym_v2_flag: any = false, gys_v1_flag: any = false;
                let gym_v4_flag: any = false, gyk_v3_flag: any = false, gys_v3_flag: any = false, gykm_v3_flag: any = false, gym_v3_flag: any = false;
                let gym_v5_flag: any = false, ggm_v5_flag: any = false, gyk_v4_flag: any = false, gys_v4_flag: any = false, gykm_v4_flag: any = false;
                let gyk_v6_flag: any = false, gykm_v6_flag: any = false, gys_v6_flag: any = false, gym_v6_flag: any = false, ggm_v6_flag: any = false;
                let user_email = enrollmentData.user_email ? enrollmentData.user_email : "";
                let products = enrollmentData.products ? enrollmentData.products : [];

                if (products.length) {
                    let hubSpot = this;
                    let getConfigurations = await thirdParty.GetThirdPartyConfigurationDetailsById(hubspotThirdPartyId);
                    let configurationData = JSON.parse(JSON.stringify(getConfigurations));
                    let hapi_key = configurationData.configuration_json.hapi_key;
                    let activityType = "HubspotWorkflowSubscription";
                    let hubspot_url = process.env["HUBSPOT_WORKFLOW_API"] ? process.env["HUBSPOT_WORKFLOW_API"] : 'https://api.hubapi.com/contacts/v1/contact/email/';
                    let hubSpotURL = hubspot_url + user_email + "/profile?hapikey=" + hapi_key;
                    let email_url = process.env["HUBSPOT_WORKFLOW_API"] + user_email + "/profile";

                    //check in hubspot of user is not created then create it
                    const email_options = {
                        method: 'GET',
                        url: email_url,
                        qs: { hapikey: hapi_key }
                    }
                    request(email_options, async function (error: any, response: any, body: any) {
                        if (!body || body == "") {
                            let user = await dbReader.users.findOne({
                                attributes: ['first_name', 'last_name', 'email', 'mobile', 'via_portal', 'ministry_level'],
                                where: { email: user_email, is_deleted: 0 }
                            });
                            user = JSON.parse(JSON.stringify(user));
                            let source_page = "";
                            let email = user_email;
                            let via_portal = user.via_portal;
                            let mobile = user.mobile ? user.mobile : "";
                            let last_name = user.last_name ? user.last_name : "";
                            let first_name = user.first_name ? user.first_name : "";
                            let ministry_name = user.ministry_level == 1 ? "Youth Ministry" : (user.ministry_level == 2 ? "Kids Ministry" : (user.ministry_level == 3 ? "I Oversee Both" : "None Of These"));
                            let hubSpotData = { first_name, last_name, email, mobile, ministry_name, via_portal, source_page }
                            await hubSpot.hubSpotCreateContact(hubSpotData);
                        }
                    });

                    // check which workflow should be assign
                    products.forEach((product_id: any) => {
                        if (gyk_v6_products.includes(product_id)) { gyk_v6_flag = true }
                        if (gykm_v6_products.includes(product_id)) { gykm_v6_flag = true }
                        if (gys_v6_products.includes(product_id)) { gys_v6_flag = true }
                        if (gysm_v6_products.includes(product_id)) { gym_v6_flag = true }
                        if (ggm_v6_products.includes(product_id)) { ggm_v6_flag = true }
                        if (gyk_v5_products.includes(product_id)) { gyk_v5_flag = true }
                        if (gys_v5_products.includes(product_id)) { gys_v5_flag = true }
                        if (gykm_v5_products.includes(product_id)) { gykm_v5_flag = true }
                        if (gysm_v5_products.includes(product_id)) { gym_v5_flag = true }
                        if (ggm_v5_products.includes(product_id)) { ggm_v5_flag = true }
                        if (gyk_v4_products.includes(product_id)) { gyk_v4_flag = true }
                        if (gys_v4_products.includes(product_id)) { gys_v4_flag = true }
                        if (gykm_v4_products.includes(product_id)) { gykm_v4_flag = true }
                        if (gysm_v4_products.includes(product_id)) { gym_v4_flag = true }
                        if (gyk_v3_products.includes(product_id)) { gyk_v3_flag = true }
                        if (gys_v3_products.includes(product_id)) { gys_v3_flag = true }
                        if (gykm_v3_products.includes(product_id)) { gykm_v3_flag = true }
                        if (gysm_v3_products.includes(product_id)) { gym_v3_flag = true }
                        if (gyk_v2_products.includes(product_id)) { gyk_v2_flag = true }
                        if (gys_v2_products.includes(product_id)) { gys_v2_flag = true }
                        if (gykm_v2_products.includes(product_id)) { gykm_v2_flag = true }
                        if (gym_v2_products.includes(product_id)) { gym_v2_flag = true }
                        if (gys_v1_products.includes(product_id)) { gys_v1_flag = true }
                        if (gym_v1_products.includes(product_id)) { gym_v1_flag = true }
                    });

                     //create the array of workflow properties to assign based on flags
                    if (gyk_v6_flag || gyk_v6_flag == true) {
                        properties.push({
                            "property": "gyk_v6_customer",
                            "value": "Yes"
                        }, {
                            "property": "gyk_v6_status",
                            "value": "Active"
                        });
                    }
                    if (gykm_v6_flag || gykm_v6_flag == true) {
                        properties.push({
                            "property": "gykm_v6_customer",
                            "value": "Yes"
                        }, {
                            "property": "gykm_v6_status",
                            "value": "Active"
                        });
                    }
                    if (gys_v6_flag || gys_v6_flag == true) {
                        properties.push({
                            "property": "gys_v6_customer",
                            "value": "Yes"
                        }, {
                            "property": "gys_v6_status",
                            "value": "Active"
                        });
                    }
                    if (gym_v6_flag || gym_v6_flag == true) {
                        properties.push({
                            "property": "gym_v6_customer",
                            "value": "Yes"
                        }, {
                            "property": "gym_v6_status",
                            "value": "Active"
                        });
                    }
                    if (ggm_v6_flag || ggm_v6_flag == true) {
                        properties.push({
                            "property": "ggm_v6_customer",
                            "value": "Yes"
                        }, {
                            "property": "ggm_v6_status",
                            "value": "Active"
                        });
                    }
                    if (gyk_v5_flag || gyk_v5_flag == true) {
                        properties.push({
                            "property": "gyk_v5_customer",
                            "value": "Yes"
                        }, {
                            "property": "gyk_v5_status",
                            "value": "Active"
                        });
                    }
                    if (gys_v5_flag || gys_v5_flag == true) {
                        properties.push({
                            "property": "gys_v5_customer",
                            "value": "Yes"
                        }, {
                            "property": "gys_v5_status",
                            "value": "Active"
                        });
                    }
                    if (gykm_v5_flag || gykm_v5_flag == true) {
                        properties.push({
                            "property": "gykm_v5_customer",
                            "value": "Yes"
                        }, {
                            "property": "gykm_v5_status",
                            "value": "Active"
                        });
                    }
                    if (gym_v5_flag || gym_v5_flag == true) {
                        properties.push({
                            "property": "gym_v5_customer",
                            "value": "Yes"
                        }, {
                            "property": "gym_v5_status",
                            "value": "Active"
                        });
                    }
                    if (ggm_v5_flag || ggm_v5_flag == true) {
                        properties.push({
                            "property": "ggm_v5_customer",
                            "value": "Yes"
                        }, {
                            "property": "ggm_v5_status",
                            "value": "Active"
                        });
                    }
                    if (gyk_v4_flag || gyk_v4_flag == true) {
                        properties.push({
                            "property": "gyk_v4_customer",
                            "value": "Yes"
                        }, {
                            "property": "gyk_v4_status",
                            "value": "Active"
                        });
                    }
                    if (gys_v4_flag || gys_v4_flag == true) {
                        properties.push({
                            "property": "gys_v4_customer",
                            "value": "Yes"
                        }, {
                            "property": "gys_v4_status",
                            "value": "Active"
                        });
                    }
                    if (gykm_v4_flag || gykm_v4_flag == true) {
                        properties.push({
                            "property": "gykm_v4_customer",
                            "value": "Yes"
                        }, {
                            "property": "gykm_v4_status",
                            "value": "Active"
                        });
                    }
                    if (gym_v4_flag || gym_v4_flag == true) {
                        properties.push({
                            "property": "gym_v4_customer",
                            "value": "Yes"
                        }, {
                            "property": "gym_v4_status",
                            "value": "Active"
                        });
                    }
                    if (gyk_v3_flag || gyk_v3_flag == true) {
                        properties.push({
                            "property": "gyk_v3_customer",
                            "value": "Yes"
                        }, {
                            "property": "gyk_v3_status",
                            "value": "Active"
                        });
                    }
                    if (gys_v3_flag || gys_v3_flag == true) {
                        properties.push({
                            "property": "gys_v3_customer",
                            "value": "Yes"
                        }, {
                            "property": "gys_v3_status",
                            "value": "Active"
                        });
                    }
                    if (gykm_v3_flag || gykm_v3_flag == true) {
                        properties.push({
                            "property": "gykm_v3_customer",
                            "value": "Yes"
                        }, {
                            "property": "gykm_v3_status",
                            "value": "Active"
                        });
                    }
                    if (gym_v3_flag || gym_v3_flag == true) {
                        properties.push({
                            "property": "gym_v3_customer",
                            "value": "Yes"
                        }, {
                            "property": "gym_v3_status",
                            "value": "Active"
                        });
                    }
                    if (gyk_v2_flag || gyk_v2_flag == true) {
                        properties.push({
                            "property": "gyk_v2_customer",
                            "value": "Yes"
                        }, {
                            "property": "gyk_v2_status",
                            "value": "Active"
                        });
                    }
                    if (gys_v2_flag || gys_v2_flag == true) {
                        properties.push({
                            "property": "gys_v2_customer",
                            "value": "Yes"
                        }, {
                            "property": "gys_v2_status",
                            "value": "Active"
                        });
                    }
                    if (gykm_v2_flag || gykm_v2_flag == true) {
                        properties.push({
                            "property": "gykm_v2_customer",
                            "value": "Yes"
                        }, {
                            "property": "gykm_v2_status",
                            "value": "Active"
                        });
                    }
                    if (gym_v2_flag || gym_v2_flag == true) {
                        properties.push({
                            "property": "gym_v2_customer",
                            "value": "Yes"
                        }, {
                            "property": "gym_v2_status",
                            "value": "Active"
                        });
                    }
                    if (gys_v1_flag || gys_v1_flag == true) {
                        properties.push({
                            "property": "gys_v1_customer",
                            "value": "Yes"
                        }, {
                            "property": "gys_v1_status",
                            "value": "Active"
                        });
                    }
                    if (gym_v1_flag || gym_v1_flag == true) {
                        properties.push({
                            "property": "gym_v1_customer",
                            "value": "Yes"
                        }, {
                            "property": "gym_v1_status",
                            "value": "Active"
                        });
                    }

                    if (properties.length) {
                        const options = {
                            method: 'POST',
                            data: { "properties": properties },
                            url: hubSpotURL,
                        };
                        await axios(options).then(async function (response: any) {
                            if (response) {
                                //add thiredperty logs
                                let apiResponse = {
                                    statusCode: 200,
                                    message: "Success Create",
                                    response: response.data
                                };
                                let hubSpotLog = {
                                    activity_type: enumObject.thirdPartyActivityType.get(activityType).value,
                                    thirdparty_id: hubspotThirdPartyId,
                                    request: options,
                                    response: apiResponse,
                                    status: 200,
                                };
                                await thirdParty.SaveThirdPartyLog(hubSpotLog);

                                let hubspotLogList: any = [], orderMessage: any, subscriptionMessage: any, hubspotNoteList: any = [];
                                if (enrollmentData.login_user_display_name) {
                                    orderMessage = "Order #" + enrollmentData.user_order_number + " added to Hubspot by " + enrollmentData.login_user_display_name;
                                    subscriptionMessage = "Subscription #" + enrollmentData.subscription_number + " added to Hubspot by " + enrollmentData.login_user_display_name;
                                } else {
                                    orderMessage = "Order #" + enrollmentData.user_order_number + " added to Hubspot.";
                                    subscriptionMessage = "Subscription #" + enrollmentData.subscription_number + " added to Hubspot.";
                                }
                                // add logs for user order and subscription for hubspot
                                hubspotLogList.push({
                                    type: 1, //order 
                                    event_type_id: enrollmentData.user_orders_id,
                                    message: orderMessage,
                                });
                                hubspotLogList.push({
                                    type: 2, //subscription
                                    event_type_id: enrollmentData.subscription_id,
                                    message: subscriptionMessage,
                                });

                                // add notes for user order, subscription and activity for hubspot
                                hubspotNoteList.push({
                                    type: 1, //order 
                                    event_type_id: enrollmentData.user_orders_id,
                                    message: orderMessage,
                                });
                                hubspotNoteList.push({
                                    type: 2, //subscription
                                    event_type_id: enrollmentData.subscription_id,
                                    message: subscriptionMessage,
                                });

                                //save hubspot log
                                await dbWriter.logs.bulkCreate(hubspotLogList);
                                // save hubspot notes
                                await dbWriter.notes.bulkCreate(hubspotNoteList);
                            }
                        }).catch(async function (error: any) {
                            //add thirdParty logs
                            let thirdPartyAPIStatusValue = error.response ? enumObject.thirdPartyAPIResponse.get(error.response.status.toString()) : error.message;
                            let statusCode = error.response ? error.response.status : 400;
                            let apiResponse = {
                                statusCode: statusCode,
                                message: thirdPartyAPIStatusValue,
                                response: error
                            };
                            let hubSpotLog = {
                                activity_type: enumObject.thirdPartyActivityType.get(activityType).value,
                                thirdparty_id: hubspotThirdPartyId,
                                request: options,
                                response: apiResponse,
                                status: statusCode,
                            };
                            await thirdParty.SaveThirdPartyLog(hubSpotLog);
                        });
                    }
                }
            }
        } catch (error: any) {
            console.log(error.message)
        }
    }

    /**
    * hubSpot change status workflow
    * @param hubspotData 
    */
    public updateHubspotWorkflowStatus = async (hubspotData: any) => {
        try {
            if (hubspotData) {
                let properties: any = [], gyk_v5_flag: any = false, gys_v5_flag: any = false, gykm_v5_flag: any = false, gym_v1_flag: any = false;
                let gyk_v2_flag: any = false, gys_v2_flag: any = false, gykm_v2_flag: any = false, gym_v2_flag: any = false, gys_v1_flag: any = false;
                let gym_v4_flag: any = false, gyk_v3_flag: any = false, gys_v3_flag: any = false, gykm_v3_flag: any = false, gym_v3_flag: any = false;
                let gym_v5_flag: any = false, ggm_v5_flag: any = false, gyk_v4_flag: any = false, gys_v4_flag: any = false, gykm_v4_flag: any = false;
                let gyk_v6_flag: any = false, gykm_v6_flag: any = false, gys_v6_flag: any = false, gym_v6_flag: any = false, ggm_v6_flag: any = false;
                let user_email = hubspotData.user_email ? hubspotData.user_email : "";
                let products = hubspotData.products ? hubspotData.products : [];
                let status = hubspotData.status ? hubspotData.status : 0;

                if (products.length && status && user_email) {
                    let getConfigurations = await thirdParty.GetThirdPartyConfigurationDetailsById(hubspotThirdPartyId);
                    let configurationData = JSON.parse(JSON.stringify(getConfigurations));
                    let hapi_key = configurationData.configuration_json.hapi_key;
                    let activityType = "HubspotWorkflowSubscription";
                    let hubspot_url = process.env["HUBSPOT_WORKFLOW_API"] ? process.env["HUBSPOT_WORKFLOW_API"] : 'https://api.hubapi.com/contacts/v1/contact/email/';
                    let hubSpotURL = hubspot_url + user_email + "/profile?hapikey=" + hapi_key;
                    let hubspotStatus = '';

                    switch (status) {
                        case 2:
                            hubspotStatus = 'Active';
                            break;
                        case 3:
                            hubspotStatus = 'Paused';
                            break;
                        case 4:
                            hubspotStatus = 'Pending Cancellation';
                            break;
                        case 5:
                            hubspotStatus = 'Cancelled';
                            break;
                        case 6:
                            hubspotStatus = 'Expired';
                            break;
                    }
                    products.forEach((product_id: any) => {
                        if (gyk_v6_products.includes(product_id)) { gyk_v6_flag = true }
                        if (gykm_v6_products.includes(product_id)) { gykm_v6_flag = true }
                        if (gys_v6_products.includes(product_id)) { gys_v6_flag = true }
                        if (gysm_v6_products.includes(product_id)) { gym_v6_flag = true }
                        if (ggm_v6_products.includes(product_id)) { ggm_v6_flag = true }
                        if (gyk_v5_products.includes(product_id)) { gyk_v5_flag = true }
                        if (gys_v5_products.includes(product_id)) { gys_v5_flag = true }
                        if (gykm_v5_products.includes(product_id)) { gykm_v5_flag = true }
                        if (gysm_v5_products.includes(product_id)) { gym_v5_flag = true }
                        if (ggm_v5_products.includes(product_id)) { ggm_v5_flag = true }
                        if (gyk_v4_products.includes(product_id)) { gyk_v4_flag = true }
                        if (gys_v4_products.includes(product_id)) { gys_v4_flag = true }
                        if (gykm_v4_products.includes(product_id)) { gykm_v4_flag = true }
                        if (gysm_v4_products.includes(product_id)) { gym_v4_flag = true }
                        if (gyk_v3_products.includes(product_id)) { gyk_v3_flag = true }
                        if (gys_v3_products.includes(product_id)) { gys_v3_flag = true }
                        if (gykm_v3_products.includes(product_id)) { gykm_v3_flag = true }
                        if (gysm_v3_products.includes(product_id)) { gym_v3_flag = true }
                        if (gyk_v2_products.includes(product_id)) { gyk_v2_flag = true }
                        if (gys_v2_products.includes(product_id)) { gys_v2_flag = true }
                        if (gykm_v2_products.includes(product_id)) { gykm_v2_flag = true }
                        if (gym_v2_products.includes(product_id)) { gym_v2_flag = true }
                        if (gys_v1_products.includes(product_id)) { gys_v1_flag = true }
                        if (gym_v1_products.includes(product_id)) { gym_v1_flag = true }
                    });

                    if (gyk_v6_flag || gyk_v6_flag == true) {
                        properties.push({
                            "property": "gyk_v6_status",
                            "value": hubspotStatus
                        });
                    }
                    if (gykm_v6_flag || gykm_v6_flag == true) {
                        properties.push({
                            "property": "gykm_v6_status",
                            "value": hubspotStatus
                        });
                    }
                    if (gys_v6_flag || gys_v6_flag == true) {
                        properties.push({
                            "property": "gys_v6_status",
                            "value": hubspotStatus
                        });
                    }
                    if (gym_v6_flag || gym_v6_flag == true) {
                        properties.push({
                            "property": "gym_v6_status",
                            "value": hubspotStatus
                        });
                    }
                    if (ggm_v6_flag || ggm_v6_flag == true) {
                        properties.push({
                            "property": "ggm_v6_status",
                            "value": hubspotStatus
                        });
                    }
                    if (gyk_v5_flag || gyk_v5_flag == true) {
                        properties.push({
                            "property": "gyk_v5_status",
                            "value": hubspotStatus
                        });
                    }
                    if (gys_v5_flag || gys_v5_flag == true) {
                        properties.push({
                            "property": "gys_v5_status",
                            "value": hubspotStatus
                        });
                    }
                    if (gykm_v5_flag || gykm_v5_flag == true) {
                        properties.push({
                            "property": "gykm_v5_status",
                            "value": hubspotStatus
                        });
                    }
                    if (gym_v5_flag || gym_v5_flag == true) {
                        properties.push({
                            "property": "gym_v5_status",
                            "value": hubspotStatus
                        });
                    }
                    if (ggm_v5_flag || ggm_v5_flag == true) {
                        properties.push({
                            "property": "ggm_v5_status",
                            "value": hubspotStatus
                        });
                    }
                    if (gyk_v4_flag || gyk_v4_flag == true) {
                        properties.push({
                            "property": "gyk_v4_status",
                            "value": hubspotStatus
                        });
                    }
                    if (gys_v4_flag || gys_v4_flag == true) {
                        properties.push({
                            "property": "gys_v4_status",
                            "value": hubspotStatus
                        });
                    }
                    if (gykm_v4_flag || gykm_v4_flag == true) {
                        properties.push({
                            "property": "gykm_v4_status",
                            "value": hubspotStatus
                        });
                    }
                    if (gym_v4_flag || gym_v4_flag == true) {
                        properties.push({
                            "property": "gym_v4_status",
                            "value": hubspotStatus
                        });
                    }
                    if (gyk_v3_flag || gyk_v3_flag == true) {
                        properties.push({
                            "property": "gyk_v3_status",
                            "value": hubspotStatus
                        });
                    }
                    if (gys_v3_flag || gys_v3_flag == true) {
                        properties.push({
                            "property": "gys_v3_status",
                            "value": hubspotStatus
                        });
                    }
                    if (gykm_v3_flag || gykm_v3_flag == true) {
                        properties.push({
                            "property": "gykm_v3_status",
                            "value": hubspotStatus
                        });
                    }
                    if (gym_v3_flag || gym_v3_flag == true) {
                        properties.push({
                            "property": "gym_v3_status",
                            "value": hubspotStatus
                        });
                    }
                    if (gyk_v2_flag || gyk_v2_flag == true) {
                        properties.push({
                            "property": "gyk_v2_status",
                            "value": hubspotStatus
                        });
                    }
                    if (gys_v2_flag || gys_v2_flag == true) {
                        properties.push({
                            "property": "gys_v2_status",
                            "value": hubspotStatus
                        });
                    }
                    if (gykm_v2_flag || gykm_v2_flag == true) {
                        properties.push({
                            "property": "gykm_v2_status",
                            "value": hubspotStatus
                        });
                    }
                    if (gym_v2_flag || gym_v2_flag == true) {
                        properties.push({
                            "property": "gym_v2_status",
                            "value": hubspotStatus
                        });
                    }
                    if (gys_v1_flag || gys_v1_flag == true) {
                        properties.push({
                            "property": "gys_v1_status",
                            "value": hubspotStatus
                        });
                    }
                    if (gym_v1_flag || gym_v1_flag == true) {
                        properties.push({
                            "property": "gym_v1_status",
                            "value": hubspotStatus
                        });
                    }

                    if (properties.length) {
                        const options = {
                            method: 'POST',
                            data: { "properties": properties },
                            url: hubSpotURL,
                        };
                        await axios(options).then(async function (response: any) {
                            if (response) {
                                //add thiredperty logs
                                let apiResponse = {
                                    statusCode: 200,
                                    message: "Success Create",
                                    response: response.data
                                };
                                let hubSpotLog = {
                                    activity_type: enumObject.thirdPartyActivityType.get(activityType).value,
                                    thirdparty_id: hubspotThirdPartyId,
                                    request: options,
                                    response: apiResponse,
                                    status: 200,
                                };
                                await thirdParty.SaveThirdPartyLog(hubSpotLog);
                            }
                        }).catch(async function (error: any) {
                            //add thirdParty logs
                            let thirdPartyAPIStatusValue = error.response ? enumObject.thirdPartyAPIResponse.get(error.response.status.toString()) : error.message;
                            let statusCode = error.response ? error.response.status : 400;
                            let apiResponse = {
                                statusCode: statusCode,
                                message: thirdPartyAPIStatusValue,
                                response: error
                            };
                            let hubSpotLog = {
                                activity_type: enumObject.thirdPartyActivityType.get(activityType).value,
                                thirdparty_id: hubspotThirdPartyId,
                                request: options,
                                response: apiResponse,
                                status: statusCode,
                            };
                            await thirdParty.SaveThirdPartyLog(hubSpotLog);
                        });
                    }
                }
            }
        } catch (error: any) {
            console.log(error.message)
        }
    }
}