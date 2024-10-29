const axios = require('axios');
import moment from "moment";
import { ThirdPartyController } from "./thirdPartyController";
import { enumerationController } from '../enumerationController';
import { GeneralController } from "../generalController";
const { dbWriter, dbReader } = require('../../models/dbConfig');
const thirdParty = new ThirdPartyController();
const enumObject = new enumerationController();
const generalObj = new GeneralController();
const activeCampaginBaseUrl = 'https://stuffyoucanuse.api-us1.com/api/3/';
const activecampaignThirdPartyId = enumObject.thirdPartyAPIType.get("activecampaign").value;

// v9 Products
const GrowYourKidsV9Annual = enumObject.productIdEnum.get("GrowYourKidsV9Annual").value;
const GrowYourKidsV9Monthly = enumObject.productIdEnum.get("GrowYourKidsV9Monthly").value;
const GrowYourKidsV9Quarterly = enumObject.productIdEnum.get("GrowYourKidsV9Quarterly").value;
const GrowYourStudentV9Annual = enumObject.productIdEnum.get("GrowYourStudentV9Annual").value;
const GrowYourStudentV9Monthly = enumObject.productIdEnum.get("GrowYourStudentV9Monthly").value;
const GrowYourKidsBasicV9Annual = enumObject.productIdEnum.get("GrowYourKidsBasicV9Annual").value;
const GrowYourStudentV9Quarterly = enumObject.productIdEnum.get("GrowYourStudentV9Quarterly").value;
const GrowYourKidsBasicV9Monthly = enumObject.productIdEnum.get("GrowYourKidsBasicV9Monthly").value;
const GrowYourKidsBasicV9Quarterly = enumObject.productIdEnum.get("GrowYourKidsBasicV9Quarterly").value;
const GrowYourStudentBasicV9Annual = enumObject.productIdEnum.get("GrowYourStudentBasicV9Annual").value;
const GrowYourStudentBasicV9Monthly = enumObject.productIdEnum.get("GrowYourStudentBasicV9Monthly").value;
const GrowYourStudentBasicV9Quarterly = enumObject.productIdEnum.get("GrowYourStudentBasicV9Quarterly").value;
// v8 Products
const GrowYourKidsV8Annual = enumObject.productIdEnum.get("GrowYourKidsV8Annual").value;
const GrowYourKidsV8Monthly = enumObject.productIdEnum.get("GrowYourKidsV8Monthly").value;
const GrowYourKidsV8Quarterly = enumObject.productIdEnum.get("GrowYourKidsV8Quarterly").value;
const GrowYourStudentV8Annual = enumObject.productIdEnum.get("GrowYourStudentV8Annual").value;
const GrowYourStudentV8Monthly = enumObject.productIdEnum.get("GrowYourStudentV8Monthly").value;
const GrowYourKidsBasicV8Annual = enumObject.productIdEnum.get("GrowYourKidsBasicV8Annual").value;
const GrowYourStudentV8Quarterly = enumObject.productIdEnum.get("GrowYourStudentV8Quarterly").value;
const GrowYourKidsBasicV8Monthly = enumObject.productIdEnum.get("GrowYourKidsBasicV8Monthly").value;
const GrowYourKidsBasicV8Quarterly = enumObject.productIdEnum.get("GrowYourKidsBasicV8Quarterly").value;
const GrowYourStudentBasicV8Annual = enumObject.productIdEnum.get("GrowYourStudentBasicV8Annual").value;
const GrowYourStudentBasicV8Monthly = enumObject.productIdEnum.get("GrowYourStudentBasicV8Monthly").value;
const GrowYourStudentBasicV8Quarterly = enumObject.productIdEnum.get("GrowYourStudentBasicV8Quarterly").value;
// v7 Products
const GrowYourKidsV7Annual = enumObject.productIdEnum.get("GrowYourKidsV7Annual").value;
const GrowYourKidsV7Monthly = enumObject.productIdEnum.get("GrowYourKidsV7Monthly").value;
const GrowYourKidsV7Quarterly = enumObject.productIdEnum.get("GrowYourKidsV7Quarterly").value;
const GrowYourStudentV7Annual = enumObject.productIdEnum.get("GrowYourStudentV7Annual").value;
const GrowYourStudentV7Monthly = enumObject.productIdEnum.get("GrowYourStudentV7Monthly").value;
const GrowYourKidsBasicV7Annual = enumObject.productIdEnum.get("GrowYourKidsBasicV7Annual").value;
const GrowYourStudentV7Quarterly = enumObject.productIdEnum.get("GrowYourStudentV7Quarterly").value;
const GrowYourKidsBasicV7Monthly = enumObject.productIdEnum.get("GrowYourKidsBasicV7Monthly").value;
const GrowYourKidsBasicV7Quarterly = enumObject.productIdEnum.get("GrowYourKidsBasicV7Quarterly").value;
const GrowYourStudentBasicV7Annual = enumObject.productIdEnum.get("GrowYourStudentBasicV7Annual").value;
const GrowYourStudentBasicV7Monthly = enumObject.productIdEnum.get("GrowYourStudentBasicV7Monthly").value;
const GrowYourStudentBasicV7Quarterly = enumObject.productIdEnum.get("GrowYourStudentBasicV7Quarterly").value;
//v6 products
const GrowYourKidsV6Annual = enumObject.productIdEnum.get("GrowYourKidsV6Annual").value;
const GrowYourKidsV6Monthly = enumObject.productIdEnum.get("GrowYourKidsV6Monthly").value;
const GrowYourKidsV6Quarterly = enumObject.productIdEnum.get("GrowYourKidsV6Quarterly").value;
const GrowYourStudentV6Annual = enumObject.productIdEnum.get("GrowYourStudentV6Annual").value;
const GrowYourStudentV6Monthly = enumObject.productIdEnum.get("GrowYourStudentV6Monthly").value;
const GrowYourStudentV6Quarterly = enumObject.productIdEnum.get("GrowYourStudentV6Quarterly").value;
const GrowYourKidsMinistryV6Annual = enumObject.productIdEnum.get("GrowYourKidsMinistryV6Annual").value;
const GrowYourGroupMinistryV6Annual = enumObject.productIdEnum.get("GrowYourGroupMinistryV6Annual").value;
const GrowYourKidsMinistryV6Monthly = enumObject.productIdEnum.get("GrowYourKidsMinistryV6Monthly").value;
const GrowYourGroupMinistryV6Monthly = enumObject.productIdEnum.get("GrowYourGroupMinistryV6Monthly").value;
const GrowYourKidsMinistryV6Quarterly = enumObject.productIdEnum.get("GrowYourKidsMinistryV6Quarterly").value;
const GrowYourStudentMinistryV6Annual = enumObject.productIdEnum.get("GrowYourStudentMinistryV6Annual").value;
const GrowYourStudentMinistryV6Monthly = enumObject.productIdEnum.get("GrowYourStudentMinistryV6Monthly").value;
const GrowYourGroupMinistryV6Quarterly = enumObject.productIdEnum.get("GrowYourGroupMinistryV6Quarterly").value;
const GrowYourStudentMinistryV6Quarterly = enumObject.productIdEnum.get("GrowYourStudentMinistryV6Quarterly").value;
const GrowYourStudentMinistryV6Quarterly2 = enumObject.productIdEnum.get("GrowYourStudentMinistryV6Quarterly2").value;
//v5 products
const GrowYourKidsV5Annual = enumObject.productIdEnum.get("GrowYourKidsV5Annual").value;
const GrowYourKidsV5Monthly = enumObject.productIdEnum.get("GrowYourKidsV5Monthly").value;
const GrowYourKidsV5Quarterly = enumObject.productIdEnum.get("GrowYourKidsV5Quarterly").value;
const GrowYourStudentV5Annual = enumObject.productIdEnum.get("GrowYourStudentV5Annual").value;
const GrowYourStudentV5Monthly = enumObject.productIdEnum.get("GrowYourStudentV5Monthly").value;
const GrowYourStudentV5Quarterly = enumObject.productIdEnum.get("GrowYourStudentV5Quarterly").value;
const GrowYourKidsMinistryV5Annual = enumObject.productIdEnum.get("GrowYourKidsMinistryV5Annual").value;
const GrowYourKidsMinistryV5Annual2 = enumObject.productIdEnum.get("GrowYourKidsMinistryV5Annual2").value;
const GrowYourKidsMinistryV5Monthly = enumObject.productIdEnum.get("GrowYourKidsMinistryV5Monthly").value;
const GrowYourGroupMinistryV5Annual = enumObject.productIdEnum.get("GrowYourGroupMinistryV5Annual").value;
const GrowYourGroupMinistryV5Monthly = enumObject.productIdEnum.get("GrowYourGroupMinistryV5Monthly").value;
const GrowYourKidsMinistryV5Quarterly = enumObject.productIdEnum.get("GrowYourKidsMinistryV5Quarterly").value;
const GrowYourStudentMinistryV5Annual = enumObject.productIdEnum.get("GrowYourStudentMinistryV5Annual").value;
const GrowYourStudentMinistryV5Annual2 = enumObject.productIdEnum.get("GrowYourStudentMinistryV5Annual2").value;
const GrowYourStudentMinistryV5Monthly = enumObject.productIdEnum.get("GrowYourStudentMinistryV5Monthly").value;
const GrowYourGroupMinistryV5Quarterly = enumObject.productIdEnum.get("GrowYourGroupMinistryV5Quarterly").value;
const GrowYourStudentMinistryV5Quarterly = enumObject.productIdEnum.get("GrowYourStudentMinistryV5Quarterly").value;
//v4 products
const GrowYourKidsV4Annual = enumObject.productIdEnum.get("GrowYourKidsV4Annual").value;
const GrowYourKidsV4Quarterly = enumObject.productIdEnum.get("GrowYourKidsV4Quarterly").value;
const GrowYourStudentV4Annual = enumObject.productIdEnum.get("GrowYourStudentV4Annual").value;
const GrowYourStudentV4Quarterly = enumObject.productIdEnum.get("GrowYourStudentV4Quarterly").value;
const GrowYourKidsMinistryV4Annual = enumObject.productIdEnum.get("GrowYourKidsMinistryV4Annual").value;
const GrowYourKidsMinistryV4Annual2 = enumObject.productIdEnum.get("GrowYourKidsMinistryV4Annual2").value;
const GrowYourKidsMinistryV4Monthly = enumObject.productIdEnum.get("GrowYourKidsMinistryV4Monthly").value;
const GrowYourKidsMinistryV4Quarterly = enumObject.productIdEnum.get("GrowYourKidsMinistryV4Quarterly").value;
const GrowYourStudentMinistryV4Annual = enumObject.productIdEnum.get("GrowYourStudentMinistryV4Annual").value;
const GrowYourStudentMinistryV4Annual2 = enumObject.productIdEnum.get("GrowYourStudentMinistryV4Annual2").value;
const GrowYourStudentMinistryV4Monthly = enumObject.productIdEnum.get("GrowYourStudentMinistryV4Monthly").value;
const GrowYourStudentMinistryV4Quarterly = enumObject.productIdEnum.get("GrowYourStudentMinistryV4Quarterly").value;
//v3 products
const GrowYourKidsV3Annual = enumObject.productIdEnum.get("GrowYourKidsV3Annual").value;
const GrowYourKidsV3Quarterly = enumObject.productIdEnum.get("GrowYourKidsV3Quarterly").value;
const GrowYourStudentV3Annual = enumObject.productIdEnum.get("GrowYourStudentV3Annual").value;
const GrowYourStudentV3Quarterly = enumObject.productIdEnum.get("GrowYourStudentV3Quarterly").value;
const GrowYourKidsMinistryV3Annual = enumObject.productIdEnum.get("GrowYourKidsMinistryV3Annual").value;
const GrowYourKidsMinistryV3Annual2 = enumObject.productIdEnum.get("GrowYourKidsMinistryV3Annual2").value;
const GrowYourKidsMinistryV3Monthly = enumObject.productIdEnum.get("GrowYourKidsMinistryV3Monthly").value;
const GrowYourKidsMinistryV3Quarterly = enumObject.productIdEnum.get("GrowYourKidsMinistryV3Quarterly").value;
const GrowYourStudentMinistryV3Annual = enumObject.productIdEnum.get("GrowYourStudentMinistryV3Annual").value;
const GrowYourStudentMinistryV3Annual2 = enumObject.productIdEnum.get("GrowYourStudentMinistryV3Annual2").value;
const GrowYourStudentMinistryV3Monthly = enumObject.productIdEnum.get("GrowYourStudentMinistryV3Monthly").value;
const GrowYourStudentMinistryV3Quarterly = enumObject.productIdEnum.get("GrowYourStudentMinistryV3Quarterly").value;
//v2 products
const GrowYourKidsV2Annual = enumObject.productIdEnum.get("GrowYourKidsV2Annual").value;
const GrowYourKidsV2Quarterly = enumObject.productIdEnum.get("GrowYourKidsV2Quarterly").value;
const GrowYourStudentV2Annual = enumObject.productIdEnum.get("GrowYourStudentV2Annual").value;
const GrowYourStudentV2Quarterly = enumObject.productIdEnum.get("GrowYourStudentV2Quarterly").value;
const GrowYourKidsMinistryV2Annual = enumObject.productIdEnum.get("GrowYourKidsMinistryV2Annual").value;
const GrowYourKidsMinistryV2Annual2 = enumObject.productIdEnum.get("GrowYourKidsMinistryV2Annual2").value;
const GrowYourKidsMinistryV2Monthly = enumObject.productIdEnum.get("GrowYourKidsMinistryV2Monthly").value;
const GrowYourKidsMinistryV2Quarterly = enumObject.productIdEnum.get("GrowYourKidsMinistryV2Quarterly").value;
const GrowYourStudentMinistryV2Annual = enumObject.productIdEnum.get("GrowYourStudentMinistryV2Annual").value;
const GrowYourStudentMinistryV2Monthly = enumObject.productIdEnum.get("GrowYourStudentMinistryV2Monthly").value;
const GrowYourStudentMinistryV2Quarterly = enumObject.productIdEnum.get("GrowYourStudentMinistryV2Quarterly").value;
//v1 products
const GrowYourStudentV1Annual = enumObject.productIdEnum.get("GrowYourStudentV1Annual").value;
const GrowYourStudentV1Annual2 = enumObject.productIdEnum.get("GrowYourStudentV1Annual2").value;
const GrowYourStudentV1Quarterly = enumObject.productIdEnum.get("GrowYourStudentV1Quarterly").value;
const GrowYourStudentMinistryV1Annual = enumObject.productIdEnum.get("GrowYourStudentMinistryV1Annual").value;
const GrowYourStudentMinistryV1Monthly = enumObject.productIdEnum.get("GrowYourStudentMinistryV1Monthly").value;
const GrowYourStudentMinistryV1Quarterly = enumObject.productIdEnum.get("GrowYourStudentMinistryV1Quarterly").value;
const GrowYourStudentMinistryV1Quarterly2 = enumObject.productIdEnum.get("GrowYourStudentMinistryV1Quarterly2").value;
//hub products
const HubAnnual = enumObject.productIdEnum.get("HubAnnual").value;
const HubMonthly = enumObject.productIdEnum.get("HubMonthly").value;
//slidr products
const SlidrMonthly = enumObject.productIdEnum.get("SlidrMonthly").value;
const SlidrAnnually = enumObject.productIdEnum.get("SlidrAnnually").value;
//builder product
const BuilderMonthly = enumObject.productIdEnum.get("BuilderMonthly").value;
//grow Together product
const GrowTogetherYearly = enumObject.productIdEnum.get("GrowTogetherYearly").value;
const GrowTogetherMonthly = enumObject.productIdEnum.get("GrowTogetherMonthly").value;

//product arrays 
const hubs_products = [HubAnnual, HubMonthly];
const slidr_products = [SlidrMonthly, SlidrAnnually];
const together_products = [GrowTogetherYearly, GrowTogetherMonthly];
const gyk_v2_products = [GrowYourKidsV2Annual, GrowYourKidsV2Quarterly];
const gyk_v3_products = [GrowYourKidsV3Annual, GrowYourKidsV3Quarterly];
const gyk_v4_products = [GrowYourKidsV4Annual, GrowYourKidsV4Quarterly];
const gys_v2_products = [GrowYourStudentV2Annual, GrowYourStudentV2Quarterly];
const gys_v3_products = [GrowYourStudentV3Annual, GrowYourStudentV3Quarterly];
const gys_v4_products = [GrowYourStudentV4Annual, GrowYourStudentV4Quarterly];
const gyk_v5_products = [GrowYourKidsV5Annual, GrowYourKidsV5Monthly, GrowYourKidsV5Quarterly];
const gyk_v6_products = [GrowYourKidsV6Annual, GrowYourKidsV6Quarterly, GrowYourKidsV6Monthly];
const gyk_v7_products = [GrowYourKidsV7Annual, GrowYourKidsV7Quarterly, GrowYourKidsV7Monthly];
const gyk_v8_products = [GrowYourKidsV8Annual, GrowYourKidsV8Monthly, GrowYourKidsV8Quarterly];
const gyk_v9_products = [GrowYourKidsV9Annual, GrowYourKidsV9Monthly, GrowYourKidsV9Quarterly];
const gys_v1_products = [GrowYourStudentV1Annual, GrowYourStudentV1Annual2, GrowYourStudentV1Quarterly];
const gys_v5_products = [GrowYourStudentV5Annual, GrowYourStudentV5Monthly, GrowYourStudentV5Quarterly];
const gys_v6_products = [GrowYourStudentV6Annual, GrowYourStudentV6Quarterly, GrowYourStudentV6Monthly];
const gys_v7_products = [GrowYourStudentV7Annual, GrowYourStudentV7Quarterly, GrowYourStudentV7Monthly];
const gys_v8_products = [GrowYourStudentV8Annual, GrowYourStudentV8Monthly, GrowYourStudentV8Quarterly];
const gys_v9_products = [GrowYourStudentV9Annual, GrowYourStudentV9Monthly, GrowYourStudentV9Quarterly];
const gykb_v7_products = [GrowYourKidsBasicV7Annual, GrowYourKidsBasicV7Quarterly, GrowYourKidsBasicV7Monthly];
const gykb_v8_products = [GrowYourKidsBasicV8Annual, GrowYourKidsBasicV8Monthly, GrowYourKidsBasicV8Quarterly];
const gykb_v9_products = [GrowYourKidsBasicV9Annual, GrowYourKidsBasicV9Monthly, GrowYourKidsBasicV9Quarterly];
const gysb_v8_products = [GrowYourStudentBasicV8Annual, GrowYourStudentBasicV8Monthly, GrowYourStudentBasicV8Quarterly];
const gysb_v9_products = [GrowYourStudentBasicV9Annual, GrowYourStudentBasicV9Monthly, GrowYourStudentBasicV9Quarterly];
const gysb_v7_products = [GrowYourStudentBasicV7Annual, GrowYourStudentBasicV7Quarterly, GrowYourStudentBasicV7Monthly];
const gykm_v6_products = [GrowYourKidsMinistryV6Annual, GrowYourKidsMinistryV6Quarterly, GrowYourKidsMinistryV6Monthly];
const gg_v6_products = [GrowYourGroupMinistryV6Annual, GrowYourGroupMinistryV6Monthly, GrowYourGroupMinistryV6Quarterly];
const gg_v5_products = [GrowYourGroupMinistryV5Annual, GrowYourGroupMinistryV5Monthly, GrowYourGroupMinistryV5Quarterly];
const gysm_v2_products = [GrowYourStudentMinistryV2Annual, GrowYourStudentMinistryV2Monthly, GrowYourStudentMinistryV2Quarterly];
const gykm_v2_products = [GrowYourKidsMinistryV2Annual, GrowYourKidsMinistryV2Annual2, GrowYourKidsMinistryV2Monthly, GrowYourKidsMinistryV2Quarterly];
const gykm_v3_products = [GrowYourKidsMinistryV3Annual, GrowYourKidsMinistryV3Annual2, GrowYourKidsMinistryV3Monthly, GrowYourKidsMinistryV3Quarterly];
const gykm_v4_products = [GrowYourKidsMinistryV4Annual, GrowYourKidsMinistryV4Annual2, GrowYourKidsMinistryV4Monthly, GrowYourKidsMinistryV4Quarterly];
const gykm_v5_products = [GrowYourKidsMinistryV5Annual, GrowYourKidsMinistryV5Annual2, GrowYourKidsMinistryV5Monthly, GrowYourKidsMinistryV5Quarterly];
const gysm_v3_products = [GrowYourStudentMinistryV3Annual, GrowYourStudentMinistryV3Annual2, GrowYourStudentMinistryV3Monthly, GrowYourStudentMinistryV3Quarterly];
const gysm_v4_products = [GrowYourStudentMinistryV4Annual, GrowYourStudentMinistryV4Annual2, GrowYourStudentMinistryV4Monthly, GrowYourStudentMinistryV4Quarterly];
const gysm_v5_products = [GrowYourStudentMinistryV5Annual, GrowYourStudentMinistryV5Annual2, GrowYourStudentMinistryV5Monthly, GrowYourStudentMinistryV5Quarterly];
const gysm_v6_products = [GrowYourStudentMinistryV6Annual, GrowYourStudentMinistryV6Quarterly, GrowYourStudentMinistryV6Quarterly2, GrowYourStudentMinistryV6Monthly];
const gysm_v1_products = [GrowYourStudentMinistryV1Annual, GrowYourStudentMinistryV1Monthly, GrowYourStudentMinistryV1Quarterly, GrowYourStudentMinistryV1Quarterly2];

const RenewalFields = [{ type: "gyk", id: "596" }, { type: "gykm", id: "597" }, { type: "gys", id: "598" }, { type: "gysm", id: "599" }];
const CancelationFields = [{ type: "gk", id: "621" }, { type: "gkb", id: "622" }, { type: "gs", id: "623" }, { type: "gsb", id: "624" }];

export class ActiveCampaignController {

    public SaveThirdPartySuccessLog = async (response: any, config: any, activity_type: any) => {
        try {
            let statusCode = response.status ? (response.status == 201 ? 200 : response.status) : 200;
            let apiResponse = {
                statusCode: statusCode,
                message: "Success",
                response: response.data
            };
            let activeCampaignLog = {
                activity_type: activity_type,
                thirdparty_id: activecampaignThirdPartyId,
                request: config,
                response: apiResponse,
                status: statusCode,
            };
            await thirdParty.SaveThirdPartyLog(activeCampaignLog);
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    public SaveThirdPartyErrorLog = async (error: any, config: any, activity_type: any) => {
        try {
            let thirdPartyAPIStatusValue = error.response ? enumObject.thirdPartyAPIResponse.get(error.response.status.toString()) : error.message;
            let statusCode = error.response ? error.response.status : 400;
            let apiResponse = {
                statusCode: statusCode,
                message: thirdPartyAPIStatusValue,
                response: error
            };
            let activecampaignLog = {
                activity_type: activity_type,
                thirdparty_id: activecampaignThirdPartyId,
                request: config,
                response: apiResponse,
                status: statusCode,
            };
            await thirdParty.SaveThirdPartyLog(activecampaignLog);
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    public addOrRemoveContactActiveCampaignList = async (listData: any, listStatus: any, logList: any) => {
        try {
            let ActiveCampaignController = this, i = 0, logsFlag: any = false;
            let activity_type = enumObject.thirdPartyActivityType.get('ActiveCampaignContactList').value;
            let getConfigurations = await thirdParty.GetThirdPartyConfigurationDetailsById(activecampaignThirdPartyId);
            let configurationData = JSON.parse(JSON.stringify(getConfigurations));
            let api_key = configurationData.configuration_json.api;
            while (i < listData.length) {
                let data = JSON.stringify({
                    contactList: {
                        list: listData[i].list,
                        contact: listData[i].contact,
                        status: listStatus,
                        sourceid: 0
                    }
                });
                let config = {
                    method: 'post',
                    url: activeCampaginBaseUrl + 'contactLists',
                    headers: {
                        'API-Token': api_key,
                        'Content-Type': 'application/json',
                    },
                    data: data
                }
                await axios(config).then(async function (response: any) {
                    logsFlag = true;
                    await ActiveCampaignController.SaveThirdPartySuccessLog(response, config, activity_type);
                }).catch(async function (error: any) {
                    await ActiveCampaignController.SaveThirdPartyErrorLog(error, config, activity_type);
                });
                i++;
            }
            if (logsFlag == true && logList.length) {
                await dbWriter.notes.bulkCreate(logList);
            }
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    public addContactActiveCampaignTag = async (tagsData: any, addTagLogs: any) => {
        try {
            let ActiveCampaignController = this, i = 0, logsFlag: any = false;
            let activity_type = enumObject.thirdPartyActivityType.get('ActiveCampaignContactTags').value;
            let getConfigurations = await thirdParty.GetThirdPartyConfigurationDetailsById(activecampaignThirdPartyId);
            let configurationData = JSON.parse(JSON.stringify(getConfigurations));
            let api_key = configurationData.configuration_json.api;
            let ActiveCustomerTags = [12, 13, 14, 15, 16, 17, 18, 19, 20];

            while (i < tagsData.length) {
                let data = JSON.stringify({
                    contactTag: {
                        contact: tagsData[i].contact,
                        tag: tagsData[i].tag,
                    }
                });
                let config = {
                    method: 'post',
                    url: activeCampaginBaseUrl + 'contactTags',
                    headers: {
                        'API-Token': api_key,
                        'Content-Type': 'application/json',
                    },
                    data: data
                };
                await axios(config).then(async function (response: any) {
                    logsFlag = true;
                    await ActiveCampaignController.SaveThirdPartySuccessLog(response, config, activity_type);
                    //Once Active Customer Tag Added Remove Cancel Tags
                    if (ActiveCustomerTags.includes(tagsData[i].tag)) {
                        await ActiveCampaignController.removeContactCancelActiveCampaignTags(tagsData[i].contact);
                    }
                }).catch(async function (error: any) {
                    await ActiveCampaignController.SaveThirdPartyErrorLog(error, config, activity_type);
                });
                i++;
            }
            if (logsFlag == true && addTagLogs.length) {
                await dbWriter.notes.bulkCreate(addTagLogs);
            }
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    public removeContactActiveCampaignTag = async (tagsData: any, status: any, removeTagLogs: any, sharedDashboardFlag: any = false) => {
        try {
            let groups_flag = false, students_flag = false, kids_flag = false;
            let lesson_builder_flag = false, hubs_flag = false, slides_flag = false, logsFlag: any = false;
            let ActiveCampaignController = this, i = 0, activeProductIds: any = [], together_flag: any = false;
            let failedAndFormerTags = [79, 80, 81, 82, 83, 84, 85, 86, 87, 99, 100, 101, 102, 103, 104, 105, 106, 3302, 3303, 3486, 3488, 3489, 3487, 3493];
            let activity_type = enumObject.thirdPartyActivityType.get('ActiveCampaignContactTags').value;
            let getConfigurations = await thirdParty.GetThirdPartyConfigurationDetailsById(activecampaignThirdPartyId);
            let configurationData = JSON.parse(JSON.stringify(getConfigurations));
            let api_key = configurationData.configuration_json.api;

            if (status) {
                let data = await dbReader.users.findOne({
                    attributes: ['user_id'],
                    where: { is_deleted: 0, activecampaign_contact_id: tagsData[0].contact },
                    include: [{
                        required: true,
                        attributes: ['user_subscription_id'],
                        model: dbReader.userSubscription,
                        where: { subscription_status: [2, 4, 10] },
                        include: [{
                            separate: true,
                            attributes: ['user_orders_id'],
                            model: dbReader.userOrder,
                            include: [{
                                separate: true,
                                model: dbReader.userOrderItems,
                                attributes: ['product_id'],
                                where: { item_type: 1, is_deleted: 0 },
                            }],
                            order: [["user_orders_id", "DESC"]],
                            limit: 1
                        }]
                    }]
                });
                if (data) {
                    data = JSON.parse(JSON.stringify(data));
                    data.user_subscriptions.forEach((e: any) => {
                        e.user_orders[0].user_order_items.forEach((s: any) => {
                            if (!activeProductIds.includes(s.product_id)) activeProductIds.push(s.product_id)
                        });
                    });
                    activeProductIds.forEach((pid: any) => {
                        if (BuilderMonthly == pid) {
                            lesson_builder_flag = true;
                        }
                        if (together_products.includes(pid)) {
                            together_flag = true;
                        }
                        if (hubs_products.includes(pid)) {
                            hubs_flag = true;
                        }
                        if (slidr_products.includes(pid)) {
                            slides_flag = true;
                        }
                        if (gg_v5_products.includes(pid) || gg_v6_products.includes(pid)) {
                            groups_flag = true;
                        }
                        if (gyk_v2_products.includes(pid) || gyk_v3_products.includes(pid) || gyk_v4_products.includes(pid) || gyk_v5_products.includes(pid) || gyk_v6_products.includes(pid) || gykm_v2_products.includes(pid) || gykm_v3_products.includes(pid) || gykm_v4_products.includes(pid) || gykm_v6_products.includes(pid) || gykm_v5_products.includes(pid) || gyk_v7_products.includes(pid) || gykb_v7_products.includes(pid) || gykb_v8_products.includes(pid) || gykb_v9_products.includes(pid) || gyk_v8_products.includes(pid) || gyk_v9_products.includes(pid)) {
                            kids_flag = true;
                        }
                        if (gys_v1_products.includes(pid) || gys_v2_products.includes(pid) || gys_v3_products.includes(pid) || gys_v4_products.includes(pid) || gys_v5_products.includes(pid) || gys_v6_products.includes(pid) || gysm_v1_products.includes(pid) || gysm_v2_products.includes(pid) || gysm_v3_products.includes(pid) || gysm_v4_products.includes(pid) || gysm_v5_products.includes(pid) || gysm_v6_products.includes(pid) || gys_v7_products.includes(pid) || gysb_v7_products.includes(pid) || gys_v8_products.includes(pid) || gys_v9_products.includes(pid) || gysb_v8_products.includes(pid) || gysb_v9_products.includes(pid)) {
                            students_flag = true;
                        }
                    });
                }
            }
            while (i < tagsData.length) {
                let continueFlag = false;
                let tag_id = tagsData[i].tag;
                let contact_id = tagsData[i].contact;
                switch (tag_id) {
                    case 12: //active-customer-grow-kids
                        if (kids_flag == false) { continueFlag = true }
                        break;
                    case 13: //active-customer-grow-students
                        if (students_flag == false) { continueFlag = true }
                        break;
                    case 14: //active-customer-grow-groups
                        if (groups_flag == false) { continueFlag = true }
                        break;
                    case 15: //active-customer-grow-slides
                        if (slides_flag == false) { continueFlag = true }
                        break;
                    case 16: //active-customer-grow-hubs
                        if (hubs_flag == false) { continueFlag = true }
                        break;
                    case 18: //active-customer-grow-together
                        if (together_flag == false) { continueFlag = true }
                        break;
                    case 20: //active-customer-grow-lesson-builder
                        if (lesson_builder_flag == false) { continueFlag = true }
                        break;
                    default:
                        break;
                }
                if (continueFlag || failedAndFormerTags.includes(tag_id) || sharedDashboardFlag) {
                    let config = {
                        method: 'get',
                        url: activeCampaginBaseUrl + 'contacts/' + contact_id + '/contactTags',
                        headers: {
                            'API-Token': api_key,
                            'Content-Type': 'application/json',
                        }
                    }
                    await axios(config).then(async function (response: any) {
                        let contactTags = response.data.contactTags;
                        if (contactTags.length && contactTags.find((e: any) => e.tag == tag_id && e.contact == contact_id)) {
                            let contact_tag_id = contactTags.find((e: any) => e.tag == tag_id && e.contact == contact_id).id;
                            let config = {
                                method: 'delete',
                                url: activeCampaginBaseUrl + 'contactTags/' + contact_tag_id,
                                headers: {
                                    'API-Token': api_key,
                                    'Content-Type': 'application/json',
                                }
                            }
                            await axios(config).then(async function (response: any) {
                                logsFlag = true;
                                await ActiveCampaignController.SaveThirdPartySuccessLog(response, config, activity_type);
                            }).catch(async function (error: any) {
                                await ActiveCampaignController.SaveThirdPartyErrorLog(error, config, activity_type);
                            });
                        }
                    }).catch(async function (error: any) {
                        await ActiveCampaignController.SaveThirdPartyErrorLog(error, config, activity_type);
                    });
                }
                i++;
            }
            if (logsFlag == true && removeTagLogs.length) {
                await dbWriter.notes.bulkCreate(removeTagLogs);
            }
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    public activeCampaignMapProductsData = async (mapProductData: any, addOrRemoveFlag: any) => {
        try {
            let ActiveCampaignController = this, userId = mapProductData.user_id, contactId = mapProductData.contact_id;
            let ac_grow_kids_flag: any = false, ac_grow_students_flag: any = false, ac_grow_groups_flag: any = false,
                ac_grow_together_flag: any = false, ac_grow_hubs_flag: any = false, ac_grow_slidr_flag: any = false,
                ac_grow_builder_flag = false, ac_grow_people_flag = false, removeTagsData: any = [], logList: any = [],
                tagsData: any = [], ac_volume_subscription_tag: any = [], ac_volume_subscription_list: any = [],
                listData: any = [], addTagLogs: any = [], removeTagLogs: any = [], productsArray: any = [];

            //get all music products and assign related tag
            let products = await dbReader.products.findAll({
                attributes: ["product_id"],
                where: { is_deleted: 0, product_type: 3 }
            });
            products = JSON.parse(JSON.stringify(products));
            let musicProducts = products.length ? products.map((m: any) => m.product_id) : [];

            //get all people site products
            let products2 = await dbReader.products.findAll({
                attributes: ["product_id"],
                where: { is_deleted: 0, site_id: enumObject.siteEnum.get("people").value }
            });
            products2 = JSON.parse(JSON.stringify(products2));
            let peopleProducts = products2.length ? products2.map((m: any) => m.product_id) : [];

            // check which workflow should be assign
            mapProductData.products.forEach((p: any) => {
                if (!productsArray.includes(p)) productsArray.push(p)
            });
            productsArray.forEach((product_id: any) => {
                if (musicProducts.includes(product_id) && addOrRemoveFlag == "add") {
                    tagsData.push({
                        contact: contactId,
                        tag: enumObject.activecampaignTags.get("customer-grow-kids-music").value,
                    });
                    logList.push({
                        type: 4,//AC 
                        event_type_id: userId,
                        message: `'${enumObject.activecampaignTagsTitle.get("customer-grow-kids-music").value}' tag added to contact in active campaign`,
                    });
                }
                if (peopleProducts.includes(product_id)) {
                    ac_grow_people_flag = true;
                }
                if (BuilderMonthly == product_id) {
                    ac_grow_builder_flag = true;
                }
                if (together_products.includes(product_id)) {
                    ac_grow_together_flag = true;
                }
                if (hubs_products.includes(product_id)) {
                    ac_grow_hubs_flag = true;
                }
                if (slidr_products.includes(product_id)) {
                    ac_grow_slidr_flag = true;
                }
                if (gys_v8_products.includes(product_id)) {
                    ac_grow_students_flag = true;
                    ac_volume_subscription_tag.push("v8-gysm");
                }
                if (gys_v9_products.includes(product_id)) {
                    ac_grow_students_flag = true;
                    ac_volume_subscription_tag.push("v9-gysm");
                }
                if (gysb_v8_products.includes(product_id)) {
                    ac_grow_students_flag = true;
                    ac_volume_subscription_tag.push("v8-gys");
                }
                if (gysb_v9_products.includes(product_id)) {
                    ac_grow_students_flag = true;
                    ac_volume_subscription_tag.push("v9-gys");
                }
                if (gyk_v8_products.includes(product_id)) {
                    ac_grow_kids_flag = true;
                    ac_volume_subscription_tag.push("v8-gykm");
                }
                if (gyk_v9_products.includes(product_id)) {
                    ac_grow_kids_flag = true;
                    ac_volume_subscription_tag.push("v9-gykm");
                }
                if (gykb_v8_products.includes(product_id)) {
                    ac_grow_kids_flag = true;
                    ac_volume_subscription_tag.push("v8-gyk");
                }
                if (gykb_v9_products.includes(product_id)) {
                    ac_grow_kids_flag = true;
                    ac_volume_subscription_tag.push("v9-gyk");
                }
                if (gyk_v6_products.includes(product_id)) {
                    ac_grow_kids_flag = true;
                    ac_volume_subscription_tag.push("v6-gyk");
                }
                if (gykm_v6_products.includes(product_id)) {
                    ac_grow_kids_flag = true;
                    ac_volume_subscription_tag.push("v6-gykm");
                }
                if (gys_v6_products.includes(product_id)) {
                    ac_grow_students_flag = true;
                    ac_volume_subscription_tag.push("v6-gys");
                }
                if (gysm_v6_products.includes(product_id)) {
                    ac_grow_students_flag = true;
                    ac_volume_subscription_tag.push("v6-gysm");
                }
                if (gys_v7_products.includes(product_id)) {
                    ac_grow_students_flag = true;
                    ac_volume_subscription_tag.push("v7-gysm");
                }
                if (gysb_v7_products.includes(product_id)) {
                    ac_grow_students_flag = true;
                    ac_volume_subscription_tag.push("v7-gys");
                }
                if (gyk_v7_products.includes(product_id)) {
                    ac_grow_kids_flag = true;
                    ac_volume_subscription_tag.push("v7-gykm");
                }
                if (gykb_v7_products.includes(product_id)) {
                    ac_grow_kids_flag = true;
                    ac_volume_subscription_tag.push("v7-gyk");
                }
                if (gg_v6_products.includes(product_id)) {
                    ac_grow_groups_flag = true;
                    ac_volume_subscription_tag.push("v6-gg");
                }
                if (gyk_v5_products.includes(product_id)) {
                    ac_volume_subscription_tag.push("v5-gyk");
                    ac_grow_kids_flag = true;
                }
                if (gys_v5_products.includes(product_id)) {
                    ac_volume_subscription_tag.push("v5-gys");
                    ac_grow_students_flag = true;
                }
                if (gykm_v5_products.includes(product_id)) {
                    ac_volume_subscription_tag.push("v5-gykm");
                    ac_grow_kids_flag = true;
                }
                if (gysm_v5_products.includes(product_id)) {
                    ac_volume_subscription_tag.push("v5-gysm");
                    ac_grow_students_flag = true;
                }
                if (gg_v5_products.includes(product_id)) {
                    ac_volume_subscription_tag.push("v5-gg");
                    ac_grow_groups_flag = true;
                }
                if (gyk_v4_products.includes(product_id)) {
                    ac_volume_subscription_tag.push("v4-gyk");
                    ac_grow_kids_flag = true;
                }
                if (gys_v4_products.includes(product_id)) {
                    ac_volume_subscription_tag.push("v4-gys");
                    ac_grow_students_flag = true;
                }
                if (gykm_v4_products.includes(product_id)) {
                    ac_volume_subscription_tag.push("v4-gykm");
                    ac_grow_kids_flag = true;
                }
                if (gysm_v4_products.includes(product_id)) {
                    ac_volume_subscription_tag.push("v4-gysm");
                    ac_grow_students_flag = true;
                }
                if (gyk_v3_products.includes(product_id)) {
                    ac_volume_subscription_tag.push("v3-gyk");
                    ac_grow_kids_flag = true;
                }
                if (gys_v3_products.includes(product_id)) {
                    ac_volume_subscription_tag.push("v3-gys");
                    ac_grow_students_flag = true;
                }
                if (gykm_v3_products.includes(product_id)) {
                    ac_volume_subscription_tag.push("v3-gykm");
                    ac_grow_kids_flag = true;
                }
                if (gysm_v3_products.includes(product_id)) {
                    ac_volume_subscription_tag.push("v3-gysm");
                    ac_grow_students_flag = true;
                }
                if (gyk_v2_products.includes(product_id)) {
                    ac_volume_subscription_tag.push("v2-gyk");
                    ac_grow_kids_flag = true;
                }
                if (gys_v2_products.includes(product_id)) {
                    ac_volume_subscription_tag.push("v2-gys");
                    ac_grow_students_flag = true;
                }
                if (gykm_v2_products.includes(product_id)) {
                    ac_volume_subscription_tag.push("v2-gykm");
                    ac_grow_kids_flag = true;
                }
                if (gysm_v2_products.includes(product_id)) {
                    ac_volume_subscription_tag.push("v2-gysm");
                    ac_grow_students_flag = true;
                }
                if (gys_v1_products.includes(product_id)) {
                    ac_volume_subscription_tag.push("v1-gys");
                    ac_grow_students_flag = true;
                }
                if (gysm_v1_products.includes(product_id)) {
                    ac_volume_subscription_tag.push("v1-gysm");
                    ac_grow_students_flag = true;
                }
            });

            if (ac_volume_subscription_tag.length && addOrRemoveFlag == "add") {
                ac_volume_subscription_tag.forEach((element: any) => {
                    tagsData.push({
                        contact: contactId,
                        tag: enumObject.activecampaignTags.get(element).value,
                    });
                    addTagLogs.push({
                        type: 4,//AC 
                        event_type_id: userId,
                        message: `'${enumObject.activecampaignTagsTitle.get(element).value}' tag added to contact in active campaign`,
                    });
                });
            }
            if (ac_volume_subscription_list.length) {
                ac_volume_subscription_list.forEach((element: any) => {
                    listData.push({
                        list: enumObject.activecampaignList.get(element).value,
                        contact: contactId,
                    });
                    if (addOrRemoveFlag == "add") {
                        logList.push({
                            type: 4,//AC 
                            event_type_id: userId,
                            message: `Contact added in active campaign '${enumObject.activecampaignListTitle.get(element).value}' list`,
                        });
                    } else {
                        logList.push({
                            type: 4,//AC 
                            event_type_id: userId,
                            message: `Contact removed from active campaign '${enumObject.activecampaignListTitle.get(element).value}' list`
                        });
                    }
                });
            }
            if (ac_grow_together_flag || ac_grow_kids_flag || ac_grow_students_flag || ac_grow_groups_flag || ac_grow_hubs_flag || ac_grow_slidr_flag || ac_grow_builder_flag || ac_grow_people_flag) {
                let ac_customer_tag: any = [], ac_customer_remove_failed_tags: any = [];
                if (ac_grow_people_flag) {
                    ac_customer_tag.push("active-customer-grow-people");
                    ac_customer_remove_failed_tags.push("failed-payment-grow-people")
                    ac_customer_remove_failed_tags.push("former-customer-grow-people")
                    ac_customer_remove_failed_tags.push("inactive-customer-people")
                    ac_customer_remove_failed_tags.push("pending-cancellation-people")
                }
                if (ac_grow_builder_flag) {
                    ac_customer_tag.push("active-customer-grow-lesson-builder");
                    ac_customer_remove_failed_tags.push("failed-payment-grow-lesson-builder")
                    ac_customer_remove_failed_tags.push("former-customer-grow-lesson-builder")
                    ac_customer_remove_failed_tags.push("inactive-customer-lesson-builder")
                    ac_customer_remove_failed_tags.push("pending-cancellation-lesson-builder")
                }
                if (ac_grow_kids_flag) {
                    ac_customer_tag.push("active-customer-grow-kids");
                    ac_customer_remove_failed_tags.push("failed-payment-grow-kids")
                    ac_customer_remove_failed_tags.push("former-customer-grow-kids")
                    ac_customer_remove_failed_tags.push("pending-cancellation-kids")
                    ac_customer_remove_failed_tags.push("inactive-customer-kids")
                }
                if (ac_grow_students_flag) {
                    ac_customer_tag.push("active-customer-grow-students");
                    ac_customer_remove_failed_tags.push("failed-payment-grow-students")
                    ac_customer_remove_failed_tags.push("former-customer-grow-students")
                    ac_customer_remove_failed_tags.push("pending-cancellation-students")
                    ac_customer_remove_failed_tags.push("inactive-customer-students")
                }
                if (ac_grow_groups_flag) {
                    ac_customer_tag.push("active-customer-grow-groups");
                    ac_customer_remove_failed_tags.push("failed-payment-grow-groups")
                    ac_customer_remove_failed_tags.push("former-customer-grow-groups")
                    ac_customer_remove_failed_tags.push("pending-cancellation-groups")
                    ac_customer_remove_failed_tags.push("inactive-customer-groups")
                }
                if (ac_grow_hubs_flag) {
                    ac_customer_tag.push("active-customer-grow-hubs");
                    ac_customer_remove_failed_tags.push("failed-payment-grow-hubs")
                    ac_customer_remove_failed_tags.push("former-customer-grow-hubs")
                    ac_customer_remove_failed_tags.push("pending-cancellation-hubs")
                    ac_customer_remove_failed_tags.push("inactive-customer-hubs")
                }
                if (ac_grow_slidr_flag) {
                    ac_customer_tag.push("active-customer-grow-slides");
                    ac_customer_remove_failed_tags.push("failed-payment-grow-slides")
                    ac_customer_remove_failed_tags.push("former-customer-grow-slides")
                    ac_customer_remove_failed_tags.push("inactive-customer-slides")
                    ac_customer_remove_failed_tags.push("pending-cancellation-slides")
                }
                if (ac_grow_together_flag) {
                    ac_customer_tag.push("active-customer-grow-together");
                    ac_customer_remove_failed_tags.push("failed-payment-grow-together")
                    ac_customer_remove_failed_tags.push("former-customer-grow-together")
                    ac_customer_remove_failed_tags.push("inactive-customer-grow-together")
                    ac_customer_remove_failed_tags.push("pending-cancellation-grow-together")
                }
                if (ac_customer_tag.length) {
                    ac_customer_tag.forEach((element: any) => {
                        tagsData.push({
                            contact: contactId,
                            tag: enumObject.activecampaignTags.get(element).value,
                        });
                        if (addOrRemoveFlag == "add") {
                            addTagLogs.push({
                                type: 4,//AC 
                                event_type_id: userId,
                                message: enumObject.activecampaignTagsTitle.get(element).value + ' tag added to contact in active campaign',
                            });
                        } else {
                            removeTagLogs.push({
                                type: 4,//AC 
                                event_type_id: userId,
                                message: enumObject.activecampaignTagsTitle.get(element).value + ' tag removed from contact in active campaign',
                            });
                        }
                    });
                }
                if (ac_customer_remove_failed_tags.length && addOrRemoveFlag == "add") {
                    ac_customer_remove_failed_tags.forEach((element: any) => {
                        removeTagsData.push({
                            contact: contactId,
                            tag: enumObject.activecampaignTags.get(element).value,
                        });
                        removeTagLogs.push({
                            type: 4,//AC 
                            event_type_id: userId,
                            message: enumObject.activecampaignTagsTitle.get(element).value + ' tag removed from contact in active campaign',
                        });
                    });
                }
            }

            if (listData.length) {
                let listStatus = addOrRemoveFlag == "add" ? 1 : 2;
                await ActiveCampaignController.addOrRemoveContactActiveCampaignList(listData, listStatus, logList);
            }
            if (tagsData.length) {
                if (addOrRemoveFlag == "add") {
                    await ActiveCampaignController.removeContactActiveCampaignTag(removeTagsData, false, removeTagLogs, false);
                    await ActiveCampaignController.addContactActiveCampaignTag(tagsData, addTagLogs);
                } else {
                    await ActiveCampaignController.removeContactActiveCampaignTag(tagsData, true, removeTagLogs, false);
                }
            }
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    public activeCampaignAddFailedTags = async (failedTagData: any) => {
        try {
            let ActiveCampaignController = this, userId = failedTagData.user_id, contactId = failedTagData.contact_id,
                together_flag: any = false, slidr_flag: any = false, builder_flag = false, hubs_flag: any = false,
                groups_flag: any = false, kids_flag: any = false, students_flag: any = false, tagsData: any = [],
                removeTagsData: any = [], addTagLogs: any = [], removeTagLogs: any = [];

            failedTagData.products.forEach((product_id: any) => {
                if (BuilderMonthly == product_id) {
                    builder_flag = true;
                }
                if (together_products.includes(product_id)) {
                    together_flag = true;
                }
                if (hubs_products.includes(product_id)) {
                    hubs_flag = true;
                }
                if (slidr_products.includes(product_id)) {
                    slidr_flag = true;
                }
                if (gg_v6_products.includes(product_id) || gg_v5_products.includes(product_id)) {
                    groups_flag = true;
                }
                if (gykb_v8_products.includes(product_id) || gykb_v9_products.includes(product_id) || gyk_v9_products.includes(product_id) || gyk_v8_products.includes(product_id) || gykb_v7_products.includes(product_id) || gyk_v7_products.includes(product_id) || gyk_v6_products.includes(product_id) || gykm_v6_products.includes(product_id) || gyk_v5_products.includes(product_id) || gykm_v5_products.includes(product_id) || gyk_v4_products.includes(product_id) || gykm_v4_products.includes(product_id) || gyk_v3_products.includes(product_id) || gykm_v3_products.includes(product_id) || gyk_v2_products.includes(product_id) || gykm_v2_products.includes(product_id)) {
                    kids_flag = true;
                }
                if (gys_v8_products.includes(product_id) || gys_v9_products.includes(product_id) || gysb_v8_products.includes(product_id) || gysb_v9_products.includes(product_id) || gys_v7_products.includes(product_id) || gysb_v7_products.includes(product_id) || gys_v6_products.includes(product_id) || gysm_v6_products.includes(product_id) || gys_v5_products.includes(product_id) || gysm_v5_products.includes(product_id) || gys_v4_products.includes(product_id) || gysm_v4_products.includes(product_id) || gys_v3_products.includes(product_id) || gysm_v3_products.includes(product_id) || gys_v2_products.includes(product_id) || gysm_v2_products.includes(product_id) || gys_v1_products.includes(product_id) || gysm_v1_products.includes(product_id)) {
                    students_flag = true;
                }
            });

            if (together_flag || builder_flag || hubs_flag || slidr_flag || groups_flag || kids_flag || students_flag) {
                if (together_flag) {
                    removeTagsData.push({
                        contact: contactId,
                        tag: enumObject.activecampaignTags.get("active-customer-grow-together").value,
                    });
                    removeTagLogs.push({
                        type: 4,//AC 
                        event_type_id: userId,
                        message: `'${enumObject.activecampaignTagsTitle.get("active-customer-grow-together").value}' tag removed from contact in active campaign`,
                    });
                    tagsData.push({
                        contact: contactId,
                        tag: enumObject.activecampaignTags.get("failed-payment-grow-together").value,
                    }, {
                        contact: contactId,
                        tag: enumObject.activecampaignTags.get("inactive-customer-grow-together").value,
                    });
                    addTagLogs.push({
                        type: 4,//AC 
                        event_type_id: userId,
                        message: `'${enumObject.activecampaignTagsTitle.get("failed-payment-grow-together").value}' tag added to contact in active campaign`,
                    }, {
                        type: 4,//AC 
                        event_type_id: userId,
                        message: `'${enumObject.activecampaignTagsTitle.get("inactive-customer-grow-together").value}' tag added to contact in active campaign`,
                    });
                }
                if (builder_flag) {
                    removeTagsData.push({
                        contact: contactId,
                        tag: enumObject.activecampaignTags.get("active-customer-grow-lesson-builder").value,
                    });
                    removeTagLogs.push({
                        type: 4,//AC 
                        event_type_id: userId,
                        message: `'${enumObject.activecampaignTagsTitle.get("active-customer-grow-lesson-builder").value}' tag removed from contact in active campaign`,
                    });
                    tagsData.push({
                        contact: contactId,
                        tag: enumObject.activecampaignTags.get("failed-payment-grow-lesson-builder").value,
                    }, {
                        contact: contactId,
                        tag: enumObject.activecampaignTags.get("inactive-customer-lesson-builder").value,
                    });
                    addTagLogs.push({
                        type: 4,//AC 
                        event_type_id: userId,
                        message: `'${enumObject.activecampaignTagsTitle.get("failed-payment-grow-lesson-builder").value}' tag added to contact in active campaign`,
                    }, {
                        type: 4,//AC 
                        event_type_id: userId,
                        message: `'${enumObject.activecampaignTagsTitle.get("inactive-customer-lesson-builder").value}' tag added to contact in active campaign`,
                    });
                }
                if (hubs_flag) {
                    removeTagsData.push({
                        contact: contactId,
                        tag: enumObject.activecampaignTags.get("active-customer-grow-hubs").value,
                    });
                    removeTagLogs.push({
                        type: 4,//AC 
                        event_type_id: userId,
                        message: `'${enumObject.activecampaignTagsTitle.get("active-customer-grow-hubs").value}' tag removed from contact in active campaign`,
                    });
                    tagsData.push({
                        contact: contactId,
                        tag: enumObject.activecampaignTags.get("failed-payment-grow-hubs").value,
                    }, {
                        contact: contactId,
                        tag: enumObject.activecampaignTags.get("inactive-customer-hubs").value,
                    });
                    addTagLogs.push({
                        type: 4,//AC 
                        event_type_id: userId,
                        message: `'${enumObject.activecampaignTagsTitle.get("failed-payment-grow-hubs").value}' tag added to contact in active campaign`,
                    }, {
                        type: 4,//AC 
                        event_type_id: userId,
                        message: `'${enumObject.activecampaignTagsTitle.get("inactive-customer-hubs").value}' tag added to contact in active campaign`,
                    });
                }
                if (slidr_flag) {
                    removeTagsData.push({
                        contact: contactId,
                        tag: enumObject.activecampaignTags.get("active-customer-grow-slides").value,
                    });
                    removeTagLogs.push({
                        type: 4,//AC 
                        event_type_id: userId,
                        message: `'${enumObject.activecampaignTagsTitle.get("active-customer-grow-slides").value}' tag removed from contact in active campaign`,
                    });
                    tagsData.push({
                        contact: contactId,
                        tag: enumObject.activecampaignTags.get("failed-payment-grow-slides").value,
                    }, {
                        contact: contactId,
                        tag: enumObject.activecampaignTags.get("inactive-customer-slides").value,
                    });
                    addTagLogs.push({
                        type: 4,//AC 
                        event_type_id: userId,
                        message: `'${enumObject.activecampaignTagsTitle.get("failed-payment-grow-slides").value}' tag added to contact in active campaign`,
                    }, {
                        type: 4,//AC 
                        event_type_id: userId,
                        message: `'${enumObject.activecampaignTagsTitle.get("inactive-customer-slides").value}' tag added to contact in active campaign`,
                    });
                }
                if (groups_flag) {
                    removeTagsData.push({
                        contact: contactId,
                        tag: enumObject.activecampaignTags.get("active-customer-grow-groups").value,
                    });
                    removeTagLogs.push({
                        type: 4,//AC 
                        event_type_id: userId,
                        message: `'${enumObject.activecampaignTagsTitle.get("active-customer-grow-groups").value}' tag removed from contact in active campaign`,
                    });
                    tagsData.push({
                        contact: contactId,
                        tag: enumObject.activecampaignTags.get("failed-payment-grow-groups").value,
                    }, {
                        contact: contactId,
                        tag: enumObject.activecampaignTags.get("inactive-customer-groups").value,
                    });
                    addTagLogs.push({
                        type: 4,//AC 
                        event_type_id: userId,
                        message: `'${enumObject.activecampaignTagsTitle.get("failed-payment-grow-groups").value}' tag added to contact in active campaign`,
                    }, {
                        type: 4,//AC 
                        event_type_id: userId,
                        message: `'${enumObject.activecampaignTagsTitle.get("inactive-customer-groups").value}' tag added to contact in active campaign`,
                    });
                }
                if (kids_flag) {
                    removeTagsData.push({
                        contact: contactId,
                        tag: enumObject.activecampaignTags.get("active-customer-grow-kids").value,
                    });
                    removeTagLogs.push({
                        type: 4,//AC 
                        event_type_id: userId,
                        message: `'${enumObject.activecampaignTagsTitle.get("active-customer-grow-kids").value}' tag removed from contact in active campaign`,
                    });
                    tagsData.push({
                        contact: contactId,
                        tag: enumObject.activecampaignTags.get("failed-payment-grow-kids").value,
                    }, {
                        contact: contactId,
                        tag: enumObject.activecampaignTags.get("inactive-customer-kids").value,
                    });
                    addTagLogs.push({
                        type: 4,//AC 
                        event_type_id: userId,
                        message: `'${enumObject.activecampaignTagsTitle.get("failed-payment-grow-kids").value}' tag added to contact in active campaign`,
                    }, {
                        type: 4,//AC 
                        event_type_id: userId,
                        message: `'${enumObject.activecampaignTagsTitle.get("inactive-customer-kids").value}' tag added to contact in active campaign`,
                    });
                }
                if (students_flag) {
                    removeTagsData.push({
                        contact: contactId,
                        tag: enumObject.activecampaignTags.get("active-customer-grow-students").value,
                    });
                    removeTagLogs.push({
                        type: 4,//AC 
                        event_type_id: userId,
                        message: `'${enumObject.activecampaignTagsTitle.get("active-customer-grow-students").value}' tag removed from contact in active campaign`,
                    });
                    tagsData.push({
                        contact: contactId,
                        tag: enumObject.activecampaignTags.get("failed-payment-grow-students").value,
                    }, {
                        contact: contactId,
                        tag: enumObject.activecampaignTags.get("inactive-customer-students").value,
                    });
                    addTagLogs.push({
                        type: 4,//AC 
                        event_type_id: userId,
                        message: `'${enumObject.activecampaignTagsTitle.get("failed-payment-grow-students").value}' tag added to contact in active campaign`,
                    }, {
                        type: 4,//AC 
                        event_type_id: userId,
                        message: `'${enumObject.activecampaignTagsTitle.get("inactive-customer-students").value}' tag added to contact in active campaign`,
                    });
                }
                if (removeTagsData.length) {
                    await ActiveCampaignController.removeContactActiveCampaignTag(removeTagsData, true, removeTagLogs, false);
                }
                if (tagsData.length) {
                    await ActiveCampaignController.addContactActiveCampaignTag(tagsData, addTagLogs);
                }
            }
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    public updateActiveCampaignRenewalFields = async (fieldData: any) => {
        try {
            let addFinalRenewalFields: any = [], ActiveCampaignController = this;
            let activecampaign_contact_id = fieldData.contact_id;
            let user_subscription_id = fieldData.user_subscription_id;
            let data = await dbReader.userSubscription.findOne({
                attributes: ['user_subscription_id', 'next_payment_date'],
                where: { user_subscription_id: user_subscription_id },
                include: [{
                    separate: true,
                    attributes: ['user_orders_id'],
                    model: dbReader.userOrder,
                    include: [{
                        separate: true,
                        model: dbReader.userOrderItems,
                        attributes: ['product_id', 'renewal_count',
                            [dbReader.Sequelize.literal('`sycu_product`.`product_duration_type`'), 'product_duration_type'],
                            [dbReader.Sequelize.literal('`sycu_product`.`product_duration`'), 'product_duration'],
                            [dbReader.Sequelize.literal('`sycu_product`.`ministry_type`'), 'ministry_type'],
                            [dbReader.Sequelize.literal('`sycu_product`.`is_ministry_page`'), 'is_ministry_page']],
                        where: { item_type: 1, is_deleted: 0 },
                        include: [{
                            attributes: [],
                            model: dbReader.products,
                        }]
                    }],
                    order: [["user_orders_id", "DESC"]],
                    limit: 1
                }]
            });
            data = JSON.parse(JSON.stringify(data));
            data.next_payment_date = data.next_payment_date ? moment(data.next_payment_date).format("YYYY-MM-DD") : "";
            if (data.next_payment_date) {
                data.user_orders[0]?.user_order_items.forEach((o: any) => {
                    switch (o.product_duration) {
                        case 30:
                            let next_renewal_date1 = '';
                            let mRenewalDays = ((Math.ceil(o.renewal_count / 12) * 360) - (o.renewal_count * 30));
                            if (mRenewalDays > 0) {
                                next_renewal_date1 = moment(data.next_payment_date).add((mRenewalDays + 30), 'days').format("YYYY-MM-DD");
                            } else {
                                next_renewal_date1 = data.next_payment_date;
                            }
                            let tagtype1 = generalObj.getACTagType(o.ministry_type, o.is_ministry_page, o.product_name);
                            if (tagtype1 && next_renewal_date1) {
                                if (addFinalRenewalFields.some((r: any) => r.tagType == tagtype1)) {
                                    let nextRenewalDate = addFinalRenewalFields.find((r: any) => r.tagType == tagtype1).nextRenewalDate
                                    if (next_renewal_date1 < nextRenewalDate) {
                                        addFinalRenewalFields.find((r: any) => r.tagType == tagtype1).nextRenewalDate = next_renewal_date1
                                    }
                                } else {
                                    addFinalRenewalFields.push({
                                        tagType: tagtype1,
                                        nextRenewalDate: next_renewal_date1
                                    });
                                }
                            }
                            break;
                        case 90:
                            let next_renewal_date2 = '';
                            let renewalDays = ((Math.ceil(o.renewal_count / 4) * 360) - (o.renewal_count * 30));
                            if (renewalDays > 0) {
                                next_renewal_date2 = moment(data.next_payment_date).add(renewalDays, 'days').format("YYYY-MM-DD");
                            } else {
                                next_renewal_date2 = data.next_payment_date;
                            }
                            let tagtype2 = generalObj.getACTagType(o.ministry_type, o.is_ministry_page, o.product_name);
                            if (tagtype2 && next_renewal_date2) {
                                if (addFinalRenewalFields.some((r: any) => r.tagType == tagtype2)) {
                                    let nextRenewalDate = addFinalRenewalFields.find((r: any) => r.tagType == tagtype2).nextRenewalDate
                                    if (next_renewal_date2 < nextRenewalDate) {
                                        addFinalRenewalFields.find((r: any) => r.tagType == tagtype2).nextRenewalDate = next_renewal_date2
                                    }
                                } else {
                                    addFinalRenewalFields.push({
                                        tagType: tagtype2,
                                        nextRenewalDate: next_renewal_date2
                                    });
                                }
                            }
                            break;
                        case 365:
                            let tagtype3 = generalObj.getACTagType(o.ministry_type, o.is_ministry_page, o.product_name);
                            if (tagtype3 && data.next_payment_date) {
                                if (addFinalRenewalFields.some((r: any) => r.tagType == tagtype3)) {
                                    let nextRenewalDate = addFinalRenewalFields.find((r: any) => r.tagType == tagtype3).nextRenewalDate
                                    if (data.next_payment_date < nextRenewalDate) {
                                        addFinalRenewalFields.find((r: any) => r.tagType == tagtype3).nextRenewalDate = data.next_payment_date
                                    }
                                } else {
                                    addFinalRenewalFields.push({
                                        tagType: tagtype3,
                                        nextRenewalDate: data.next_payment_date
                                    });
                                }
                            }
                            break;
                        default:
                            let next_renewal_date = moment(data.next_payment_date).add(o.product_duration, 'days').format("YYYY-MM-DD");
                            let tagtype = generalObj.getACTagType(o.ministry_type, o.is_ministry_page, o.product_name);
                            if (tagtype && next_renewal_date) {
                                if (addFinalRenewalFields.some((r: any) => r.tagType == tagtype)) {
                                    let nextRenewalDate = addFinalRenewalFields.find((r: any) => r.tagType == tagtype).nextRenewalDate
                                    if (next_renewal_date < nextRenewalDate) {
                                        addFinalRenewalFields.find((r: any) => r.tagType == tagtype).nextRenewalDate = next_renewal_date
                                    }
                                } else {
                                    addFinalRenewalFields.push({
                                        tagType: tagtype,
                                        nextRenewalDate: next_renewal_date
                                    });
                                }
                            }
                            break;
                    }
                });
            }
            if (addFinalRenewalFields.length > 0 && activecampaign_contact_id) {
                let activity_type = enumObject.thirdPartyActivityType.get('ActiveCampaignContact').value;
                let getConfigurations = await thirdParty.GetThirdPartyConfigurationDetailsById(activecampaignThirdPartyId);
                let configurationData = JSON.parse(JSON.stringify(getConfigurations));
                let api_key = configurationData.configuration_json.api;
                let fieldValues: any = [];
                addFinalRenewalFields.forEach((f: any) => {
                    let field = RenewalFields.find((r: any) => r.type == f.tagType)?.id;
                    fieldValues.push({
                        "field": field,
                        "value": f.nextRenewalDate
                    });
                });
                let configData = JSON.stringify({
                    contact: {
                        fieldValues: fieldValues
                    }
                });
                let config = {
                    method: 'put',
                    url: 'https://stuffyoucanuse.api-us1.com/api/3/contacts/' + activecampaign_contact_id,
                    headers: {
                        'API-Token': api_key,
                        'Content-Type': 'application/json',
                    },
                    data: configData
                };

                await axios(config).then(async function (response: any) {
                    await ActiveCampaignController.SaveThirdPartySuccessLog(response, config, activity_type);
                }).catch(async function (error: any) {
                    await ActiveCampaignController.SaveThirdPartyErrorLog(error, config, activity_type);
                });
            }
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    public updateActiveCancelationFields = async (fieldData: any) => {
        try {
            if (fieldData.products.length) {
                let arrProductTypes: any = [], ActiveCampaignController = this;
                let productsData = await dbReader.products.findAll({
                    attributes: ["product_id", "ministry_type", "is_ministry_page"],
                    where: { is_deleted: 0, product_id: fieldData.products }
                });
                if (productsData.length) {
                    productsData = JSON.parse(JSON.stringify(productsData));
                    productsData.forEach((p: any) => {
                        if (p.ministry_type == 1) {
                            if (p.is_ministry_page == 1) {
                                arrProductTypes.push('gk')
                            } else {
                                arrProductTypes.push('gkb')
                            }
                        }
                        if (p.ministry_type == 2) {
                            if (p.is_ministry_page == 1) {
                                arrProductTypes.push('gs')
                            } else {
                                arrProductTypes.push('gsb')
                            }
                        }
                    });
                    if (arrProductTypes.length && fieldData.contact_id) {
                        let activity_type = enumObject.thirdPartyActivityType.get('ActiveCampaignContact').value;
                        let getConfigurations = await thirdParty.GetThirdPartyConfigurationDetailsById(activecampaignThirdPartyId);
                        let configurationData = JSON.parse(JSON.stringify(getConfigurations));
                        let api_key = configurationData.configuration_json.api;
                        let fieldValues: any = [];
                        arrProductTypes.forEach((type: any) => {
                            let field = CancelationFields.find((r: any) => r.type == type)?.id;
                            fieldValues.push({
                                "field": field,
                                "value": moment().format("YYYY-MM-DD")
                            });
                        });
                        let configData = JSON.stringify({ contact: { fieldValues: fieldValues } });
                        let config = {
                            method: 'put',
                            url: 'https://stuffyoucanuse.api-us1.com/api/3/contacts/' + fieldData.contact_id,
                            headers: {
                                'API-Token': api_key,
                                'Content-Type': 'application/json',
                            },
                            data: configData
                        }
                        await axios(config).then(async function (response: any) {
                            await ActiveCampaignController.SaveThirdPartySuccessLog(response, config, activity_type);
                        }).catch(async function (error: any) {
                            await ActiveCampaignController.SaveThirdPartyErrorLog(error, config, activity_type);
                        });
                    }
                }
            }
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    public removeActiveCampaignRenewalFields = async (fieldData: any) => {
        try {
            let addFinalRenewalFields: any = [], ActiveCampaignController = this;
            if (fieldData.user_subscription_id) {
                let data = await dbReader.userSubscription.findOne({
                    attributes: ['user_subscription_id'],
                    where: { user_subscription_id: fieldData.user_subscription_id },
                    include: [{
                        separate: true,
                        attributes: ['user_orders_id'],
                        model: dbReader.userOrder,
                        include: [{
                            separate: true,
                            model: dbReader.userOrderItems,
                            attributes: ['user_order_item_id',
                                [dbReader.Sequelize.literal('`sycu_product`.`ministry_type`'), 'ministry_type'],
                                [dbReader.Sequelize.literal('`sycu_product`.`is_ministry_page`'), 'is_ministry_page']],
                            where: { item_type: 1, is_deleted: 0 },
                            include: [{
                                attributes: [],
                                model: dbReader.products,
                            }]
                        }],
                        order: [["user_orders_id", "DESC"]],
                    }]
                });
                data = JSON.parse(JSON.stringify(data));
                data.user_orders[0]?.user_order_items.forEach((o: any) => {
                    let tagtype = generalObj.getACTagType(o.ministry_type, o.is_ministry_page, '');
                    if (tagtype && !addFinalRenewalFields.some((r: any) => r.tagType == tagtype)) {
                        addFinalRenewalFields.push({ tagType: tagtype });
                    }
                });
            }
            if (addFinalRenewalFields.length > 0 && fieldData.contact_id) {
                let activity_type = enumObject.thirdPartyActivityType.get('ActiveCampaignContact').value;
                let getConfigurations = await thirdParty.GetThirdPartyConfigurationDetailsById(activecampaignThirdPartyId);
                let configurationData = JSON.parse(JSON.stringify(getConfigurations));
                let api_key = configurationData.configuration_json.api;
                let fieldValues: any = [];
                addFinalRenewalFields.forEach((f: any) => {
                    let field = RenewalFields.find((r: any) => r.type == f.tagType)?.id;
                    if (field) fieldValues.push({ "field": field, "value": "" });
                });
                let configData = JSON.stringify({ contact: { fieldValues: fieldValues } });
                let config = {
                    method: 'put',
                    url: 'https://stuffyoucanuse.api-us1.com/api/3/contacts/' + fieldData.contact_id,
                    headers: {
                        'API-Token': api_key,
                        'Content-Type': 'application/json',
                    },
                    data: configData
                }
                await axios(config).then(async function (response: any) {
                    await ActiveCampaignController.SaveThirdPartySuccessLog(response, config, activity_type);
                }).catch(async function (error: any) {
                    await ActiveCampaignController.SaveThirdPartyErrorLog(error, config, activity_type);
                });
            }
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    public removeContactCancelActiveCampaignTags = async (contact_id = 0) => {
        try {
            let ActiveCampaignController = this;
            let activity_type = enumObject.thirdPartyActivityType.get('ActiveCampaignContactTags').value;
            let getConfigurations = await thirdParty.GetThirdPartyConfigurationDetailsById(activecampaignThirdPartyId);
            let configurationData = JSON.parse(JSON.stringify(getConfigurations));
            let api_key = configurationData.configuration_json.api;

            if (contact_id) {
                let data = await dbReader.users.findOne({
                    where: { is_deleted: 0, activecampaign_contact_id: contact_id },
                    attributes: ['user_id'],
                    include: [{
                        required: true,
                        attributes: ['subscription_note'],
                        model: dbReader.userSubscription,
                        where: { subscription_status: [2, 4, 10] },
                    }]
                });
                if (data) {
                    data = JSON.parse(JSON.stringify(data));
                    let s = 0, i = 0, removeTagsData: any = [], removeTagLogs: any = [], logsFlag: any = false;
                    while (s < data.user_subscriptions.length) {
                        let findSubscription = data.user_subscriptions[s];
                        if (findSubscription.subscription_note) {
                            if (findSubscription.subscription_note == "Budget") {
                                removeTagsData.push({
                                    contact: contact_id,
                                    tag: enumObject.activecampaignTags.get("cancelled-curriculum-budget").value,
                                })
                                removeTagLogs.push({
                                    type: 4,//AC 
                                    event_type_id: data.user_id,
                                    message: `'${enumObject.activecampaignTagsTitle.get("cancelled-curriculum-budget").value}' tag removed from contact in active campaign`,
                                })
                            } else if (findSubscription.subscription_note == "Dissatisfied with Resources") {
                                removeTagsData.push({
                                    contact: contact_id,
                                    tag: enumObject.activecampaignTags.get("cancelled-curriculum-dissatisfied").value,
                                })
                                removeTagLogs.push({
                                    type: 4,//AC 
                                    event_type_id: data.user_id,
                                    message: `'${enumObject.activecampaignTagsTitle.get("cancelled-curriculum-dissatisfied").value}' tag removed from contact in active campaign`,
                                })
                            } else if (findSubscription.subscription_note == "No Longer Serving in Role") {
                                removeTagsData.push({
                                    contact: contact_id,
                                    tag: enumObject.activecampaignTags.get("cancelled-curriculum-role").value,
                                })
                                removeTagLogs.push({
                                    type: 4,//AC 
                                    event_type_id: data.user_id,
                                    message: `'${enumObject.activecampaignTagsTitle.get("cancelled-curriculum-role").value}' tag removed from contact in active campaign`,
                                })
                            } else if (findSubscription.subscription_note == "Switch to a different curriculum") {
                                removeTagsData.push({
                                    contact: contact_id,
                                    tag: enumObject.activecampaignTags.get("cancelled-curriculum-switch").value,
                                })
                                removeTagLogs.push({
                                    type: 4,//AC 
                                    event_type_id: data.user_id,
                                    message: `'${enumObject.activecampaignTagsTitle.get("cancelled-curriculum-switch").value}' tag removed from contact in active campaign`,
                                })
                            } else {
                                removeTagsData.push({
                                    contact: contact_id,
                                    tag: enumObject.activecampaignTags.get("cancelled-curriculum-other").value,
                                })
                                removeTagLogs.push({
                                    type: 4,//AC 
                                    event_type_id: data.user_id,
                                    message: `'${enumObject.activecampaignTagsTitle.get("cancelled-curriculum-other").value}' tag removed from contact in active campaign`,
                                })
                            }
                        } else {
                            removeTagsData.push({
                                contact: contact_id,
                                tag: enumObject.activecampaignTags.get("cancelled-curriculum-other").value,
                            })
                            removeTagLogs.push({
                                type: 4,//AC 
                                event_type_id: data.user_id,
                                message: `'${enumObject.activecampaignTagsTitle.get("cancelled-curriculum-other").value}' tag removed from contact in active campaign`,
                            })
                        }
                        s++;
                    }
                    while (i < removeTagsData.length) {
                        let tag_id = removeTagsData[i].tag;
                        let contact_id = removeTagsData[i].contact;
                        let config = {
                            method: 'get',
                            url: activeCampaginBaseUrl + 'contacts/' + contact_id + '/contactTags',
                            headers: {
                                'API-Token': api_key,
                                'Content-Type': 'application/json',
                            }
                        }
                        await axios(config).then(async function (response: any) {
                            let contactTags = response.data.contactTags;
                            if (contactTags.length && contactTags.find((e: any) => e.tag == tag_id && e.contact == contact_id)) {
                                let contact_tag_id = contactTags.find((e: any) => e.tag == tag_id && e.contact == contact_id).id;
                                let config = {
                                    method: 'delete',
                                    url: activeCampaginBaseUrl + 'contactTags/' + contact_tag_id,
                                    headers: {
                                        'API-Token': api_key,
                                        'Content-Type': 'application/json',
                                    }
                                }
                                await axios(config).then(async function (response: any) {
                                    logsFlag = true;
                                    await ActiveCampaignController.SaveThirdPartySuccessLog(response, config, activity_type);
                                }).catch(async function (error: any) {
                                    await ActiveCampaignController.SaveThirdPartyErrorLog(error, config, activity_type);
                                });
                            }
                        }).catch(async function (error: any) {
                            await ActiveCampaignController.SaveThirdPartyErrorLog(error, config, activity_type);
                        });
                        i++;
                    }
                    if (logsFlag == true && removeTagLogs.length) {
                        await dbWriter.notes.bulkCreate(removeTagLogs);
                    }
                }
            }
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    public createActiveCampaignTag = async (tagsData: any) => {
        try {
            let ActiveCampaignController = this, responseData: any = {};
            let activity_type = enumObject.thirdPartyActivityType.get('ActiveCampaignContactTags').value;
            let getConfigurations = await thirdParty.GetThirdPartyConfigurationDetailsById(activecampaignThirdPartyId);
            let configurationData = JSON.parse(JSON.stringify(getConfigurations));
            let api_key = configurationData.configuration_json.api;
            let data = JSON.stringify({
                tag: { "tag": tagsData.tag, "tagType": tagsData.tagType, "description": tagsData.description }
            });
            let config = {
                method: 'post',
                url: activeCampaginBaseUrl + 'tags',
                headers: {
                    'API-Token': api_key,
                    'accept': 'application/json',
                    'content-type': 'application/json',
                },
                data: data
            }
            await axios(config).then(async function (response: any) {
                responseData = response?.data?.tag ?? {};
                await ActiveCampaignController.SaveThirdPartySuccessLog(response, config, activity_type);
            }).catch(async function (error: any) {
                await ActiveCampaignController.SaveThirdPartyErrorLog(error, config, activity_type);
            });
            return responseData;
        } catch (error: any) {
            throw new Error(error.message)
        }
    }

    public updateActiveCampaignTag = async (tagsData: any) => {
        try {
            let ActiveCampaignController = this;
            let activity_type = enumObject.thirdPartyActivityType.get('ActiveCampaignContactTags').value;
            let getConfigurations = await thirdParty.GetThirdPartyConfigurationDetailsById(activecampaignThirdPartyId);
            let configurationData = JSON.parse(JSON.stringify(getConfigurations));
            let api_key = configurationData.configuration_json.api;
            let data = JSON.stringify({
                tag: { "tag": tagsData.tag, "tagType": tagsData.tagType, "description": tagsData.description }
            });
            let config = {
                method: 'post',
                url: activeCampaginBaseUrl + 'tags/' + tagsData.id,
                headers: {
                    'API-Token': api_key,
                    'accept': 'application/json',
                    'content-type': 'application/json',
                },
                data: data
            }
            await axios(config).then(async function (response: any) {
                await ActiveCampaignController.SaveThirdPartySuccessLog(response, config, activity_type);
            }).catch(async function (error: any) {
                await ActiveCampaignController.SaveThirdPartyErrorLog(error, config, activity_type);
            });
        } catch (error: any) {
            throw new Error(error.message)
        }
    }
}
