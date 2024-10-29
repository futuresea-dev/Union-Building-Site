import { timeStamp, validateTimestamp, dateTime } from '../helpers/helpers';
import { Crypto, UAParser } from '../core/index';
import { ExcludeAuthURL } from '../core/ExcludeAuthURL';
const { dbWriter, dbReader } = require('../models/dbConfig');
import moment = require('moment');
const crypto = new Crypto();

export class TokenValidate {
    /**
     * this method use to validate every token from User Request. and validate is request Genuine or Not, if Not throw unauthorize error 
     * @param token 
     * @param UA_string 
     * @returns - Object 
     */
    public async isValid(data: any, UA_string: string) {
        const UA = new UAParser(UA_string);
        let bearer = data.token.split(" ")
        let decoded_data = JSON.parse(crypto.decrypt(bearer[1]).toString())
        let userAgent = {
            browser_name: UA.getBrowser().name,
            browser_version: UA.getBrowser().version,
            engine_name: UA.getEngine().name,
            engine_version: UA.getEngine().version,
            os: UA.getOS().name,
            os_ver: UA.getOS().version,
            cpu: UA.getCPU().architecture,
            ua: UA.getUA()
        }

        if (decoded_data !== false && (crypto.hmacsha1(userAgent) === decoded_data.useragent)) {
            let switch_account_user = decoded_data.switch_account_user || false;
            let urlSplitData = data.url.split('/'), pointUrl = '';
            if (urlSplitData.length) {
                pointUrl = urlSplitData[1] || '';
            }
            if ([1, 2].includes(decoded_data.userData.user_role) || ExcludeAuthURL.includes(pointUrl)) {
                // let tokenCheck = await dbReader.userLoginLogs.findOne({
                //     where: { access_token: bearer[1], is_logout: 0 },
                //     attributes: ['access_token']
                // })
                // tokenCheck = JSON.parse(JSON.stringify(tokenCheck))
                // if (tokenCheck || switch_account_user) {
                if (data.header.origin && !switch_account_user) {
                    switch (data.header.origin) {
                        case "https://accounts.stuffyoucanuse.dev":
                            break;
                        case "https://curriculum.stuffyoucanuse.dev":
                            if (decoded_data.login_history.is_curriculum == false) {
                                await dbWriter.appVisitHistory.create({
                                    site_id: 2,
                                    user_id: decoded_data.userData.user_id,
                                    create_datetime: new Date(),
                                    last_access_datetime: new Date()
                                });
                                decoded_data.login_history.is_curriculum = true;
                            }
                            break;
                        case "https://builder.stuffyoucanuse.dev":
                            if (decoded_data.login_history.is_builder == false) {
                                await dbWriter.appVisitHistory.create({
                                    site_id: 3,
                                    user_id: decoded_data.userData.user_id,
                                    create_datetime: new Date(),
                                    last_access_datetime: new Date()
                                });
                                decoded_data.login_history.is_builder = true;
                            }
                            break;
                        case "https://affiliate.stuffyoucanuse.dev":
                            if (decoded_data.login_history.is_affiliate == false) {
                                await dbWriter.appVisitHistory.create({
                                    site_id: 8,
                                    user_id: decoded_data.userData.user_id,
                                    create_datetime: new Date(),
                                    last_access_datetime: new Date()
                                });
                                decoded_data.login_history.is_affiliate = true;
                            }
                            break;
                    }
                }
                let new_token: any = '';
                if (decoded_data.expireIn >= timeStamp()) {
                    new_token = await this.get_new_token(decoded_data)
                    if (new_token) {
                        return (data.token) ? { user_id: decoded_data.userData.user_id, token: new_token, user_role: decoded_data.userData.user_role, display_name: decoded_data.userData.user_public_data.display_name, users_login_log_id: decoded_data.userData.users_login_log_id } : false
                    } else {
                        return false
                    }
                } else {
                    new_token = await this.get_new_token(decoded_data, true)
                    if (new_token) {
                        return (data.token) ? { user_id: decoded_data.userData.user_id, token: new_token, user_role: decoded_data.userData.user_role, display_name: decoded_data.userData.user_public_data.display_name, users_login_log_id: decoded_data.userData.users_login_log_id } : false
                    } else {
                        return false
                    }
                }
                // } else {
                //     return false
                // }
            } else {
                return false
            }
        } else {
            return false
        }
    }

    private async get_new_token(data: any, is_renew: boolean = false) {
        if (is_renew) {
            const { dbReader } = require('../models/dbConfig');
            return await new Promise(async function (resolve) {
                let refresh_token_expire_time = await dbReader.userLoginLogs.findOne({
                    where: { user_id: data.userData.user_id, is_logout: 0, users_login_log_id: data.userData.users_login_log_id },
                    attributes: ['refresh_token', 'refresh_token_expire_datetime']
                })
                refresh_token_expire_time = JSON.parse(JSON.stringify(refresh_token_expire_time));
                if (refresh_token_expire_time && (moment(new Date()).format('YYYY-MM-DD HH:mm:ss') <= moment(refresh_token_expire_time.refresh_token_expire_datetime).format('YYYY-MM-DD HH:mm:ss'))) {
                    const ct = timeStamp(1)
                    data.expireIn = (ct > moment(refresh_token_expire_time.refresh_token_expire_datetime).unix()) ? moment(refresh_token_expire_time.refresh_token_expire_datetime).unix() : ct
                    await dbWriter.userLoginLogs.update({
                        refresh_token_expire_datetime: dateTime(timeStamp(30)),
                    }, {
                        where: { users_login_log_id: data.userData.users_login_log_id }
                    })
                    return resolve(crypto.encrypt(JSON.stringify(data), false).toString());
                } else {
                    return resolve(false)
                }
            })
        } else {
            return crypto.encrypt(JSON.stringify(data), false).toString();
        }
    }
}
