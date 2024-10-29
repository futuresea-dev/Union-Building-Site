import { ThirdPartyController } from "../thirdParty/thirdPartyController";
import { enumerationController } from "../enumerationController";
const { dbReader, dbWriter } = require('../../models/dbConfig');

const axios = require("axios");
const thirdParty = new ThirdPartyController();
const enumObject = new enumerationController();

let circleApi: any, circleActivityType: any, community_id: any = 9602, space_group_id: any = 36080;

export class CircleAPIs {
    /**
     * Initialize circle configuration variables
     */
    constructor() {
        circleApi = process?.env["Circle_API"] || 'https://app.circle.so/api/v1/';
        circleActivityType = enumObject.thirdPartyAPIType.get("circle").value;
    }

    public circleAPICall = async (ReqData: any) => {
        try {
            // return await axios(ReqData.circleUserCheckApiURL, {
            //     method: ReqData.method,
            //     headers: {
            //         Authorization: `Token ${ReqData.thirdPartyConfigurationAPIKey}`,
            //     },
            // }).then((result: any) => {
            //     return result
            // });
            return false
        } catch (err: any) {
            return false
        }
    }

    public userActionInSpace = async (ReqData: any) => {
        try {
            let thirdPartyConfiguration = await thirdParty?.GetThirdPartyConfigurationDetailsById(circleActivityType);
            let thirdPartyConfigurationAPIKey = JSON.parse(JSON.stringify(thirdPartyConfiguration)).configuration_json.api_key;
            if (ReqData.user_email && ReqData.Method) {
                let _ReqData: any = null
                if (ReqData.Method != 'DELETE') {
                    _ReqData = {
                        circleUserCheckApiURL: `${circleApi}/community_members/search?email=${ReqData.user_email}&community_id=${community_id}`,
                        method: 'GET',
                        thirdPartyConfigurationAPIKey: thirdPartyConfigurationAPIKey
                    }
                    let isCircleUser: any = await this.circleAPICall(_ReqData)
                    if (isCircleUser && isCircleUser.data.id) {
                        // _ReqData = {
                        //     circleUserCheckApiURL: `${circleApi}/space_group_members?email=${ReqData.user_email}&space_group_id=${space_group_id}&community_id=${community_id}`,
                        //     method: ReqData.Method,
                        //     thirdPartyConfigurationAPIKey: thirdPartyConfigurationAPIKey
                        // }
                        // let MemberAddGroup:any = await this.circleAPICall(_ReqData)
                        // return MemberAddGroup.data
                        return isCircleUser.data
                    } else {
                        let userData = await dbReader.users.findOne({
                            where: { user_id: ReqData.user_id }
                        })
                        userData = JSON.parse(JSON.stringify(userData))
                        if (userData) {
                            let url = `${circleApi}/community_members?email=${ReqData.user_email}&community_id=${community_id}&name=${userData.display_name}&bio=Runner&skip_invitation=true`
                            if (userData.profile_image) {
                                url = `${circleApi}/community_members?email=${ReqData.user_email}&community_id=${community_id}&name=${userData.display_name}&bio=Runner&avatar=${userData.profile_image}&skip_invitation=true`
                            }
                            _ReqData = {
                                circleUserCheckApiURL: url,
                                method: 'POST',
                                thirdPartyConfigurationAPIKey: thirdPartyConfigurationAPIKey
                            }
                            let isUserAdded: any = await this.circleAPICall(_ReqData)
                            if (isUserAdded && isUserAdded.data.success) {
                                // _ReqData = {
                                //     circleUserCheckApiURL: `${circleApi}/space_group_members?email=${ReqData.user_email}&space_group_id=${space_group_id}&community_id=${community_id}`,
                                //     method: ReqData.Method,
                                //     thirdPartyConfigurationAPIKey: thirdPartyConfigurationAPIKey
                                // }
                                // let MemberAddGroup:any = await this.circleAPICall(_ReqData)
                                // return MemberAddGroup.data
                                return isUserAdded.data
                            } else {
                                return {
                                    success: false,
                                    message: (isUserAdded) ? isUserAdded.message : { success: false, message: 'Add: Something wrong with circle service' }
                                }
                            }
                        } else {
                            return {
                                success: false,
                                message: "User not found"
                            }
                        }
                    }
                } else {
                    // _ReqData = {
                    //     circleUserCheckApiURL: `${circleApi}/space_group_members?email=${ReqData.user_email}&space_group_id=${space_group_id}&community_id=${community_id}`,
                    //     method: ReqData.Method,
                    //     thirdPartyConfigurationAPIKey: thirdPartyConfigurationAPIKey
                    // }
                    // let MemberAddGroup:any = await this.circleAPICall(_ReqData)
                    // return (MemberAddGroup) ? MemberAddGroup.data : { success: false, message: 'Delete: Something wrong with circle service' }
                    _ReqData = {
                        circleUserCheckApiURL: `${circleApi}/community_members?community_id=${community_id}&email=${ReqData.user_email}`,
                        method: ReqData.Method,
                        thirdPartyConfigurationAPIKey: thirdPartyConfigurationAPIKey
                    }
                    let MemberRemoveCommunity: any = await this.circleAPICall(_ReqData)
                    return (MemberRemoveCommunity) ? MemberRemoveCommunity.data : { success: false, message: 'Delete: Something wrong with circle service' }
                }
            } else {
                return {
                    success: false,
                    message: "User email address not found"
                }
            }
        } catch (err: any) {
            return {
                success: false,
                message: err.message
            }
        }
    }
}