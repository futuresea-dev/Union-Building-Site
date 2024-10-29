const requestIp = require('request-ip');
const { dbReader, dbWriter } = require('../models/dbConfig');
import crypto, { generateKeyPairSync } from 'crypto';
import moment from 'moment';

/**
 * Get Current Date in Timestamp Format
 *  @days - default value `0` or grater value to Add days to current date
 *  @return - timestamp with added days 
 */
export function timeStamp(days: number = 0) {
    let currentTime = Date.now();
    let addTime = (days) ? (days * 24 * 60 * 60 * 1000) : 0;
    return Math.round(((currentTime + addTime) + 10000) / 1000)
}

export function dateCompare(date: number) {
    return timeStamp() < date
}

/**
 * Get Random Code
 *  @length - pass Length of Random string 
 *  @require - npm package require-ip
 *  @req - using user request get user remote IP
 *  @return - string
 */
export function RandomString(length = 60) {
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let characters1 = 'abcdefghijklmnopqrstuvwxyz';
    let numbers = '0123456789';
    // let Sc = '!~^$#_+*'
    let _string = characters + numbers;
    _string = (length > 4 ? _string + characters.toLowerCase() : characters + characters1);
    let result = "";
    for (var i = 0; i < length; i++) {
        result += _string.charAt(Math.floor(Math.random() * _string.length));
    }
    return result;
}

/**
 * Get Days Difference between Two Dates
 *  @_timestamp - get old timestamp to subtract with new timestamp to get Difference Days
 *  @return - integer value for difference Days 
 */
export function validateTimestamp(_timestamp: number) {
    return Math.abs(Math.floor((timeStamp() - _timestamp) / (3600 * 24)))
}

/**
 * Get Remote User Ip-address on request
 *  @require - npm package require-ip
 *  @req - using user request get user remote IP
 *  @return - string of IP-address
 */
export function remoteIP(req: any) {
    return requestIp.getClientIp(req)
}

/**
 * Convert Unix Timestamp to Javascript Default Date Format
 * @timestamp - accept timestamp, Convert ac Date
 * @is_UNIX - convert timestamp to date or timestamp format
 * @return - Javascript Default Date Format
 */
export function dateTime(timestamp: number, is_UNIX: boolean = true) {
    //@ts-ignore    
    return is_UNIX ? new Date(timestamp * 1000) : Math.round(timestamp / 1000);
}

export function timestamp(days: number = 0) {
    let currentTime = Date.now();
    let addTime = (days) ? (days * 24 * 60 * 60 * 1000) : 0;
    return Math.round(((currentTime + addTime) + 10000) / 1000)
}

export function getDateRange(startDate: any, endDate: any, dateFormat: any) {
    let dates = [],
        end = moment(endDate), start = moment(startDate),
        diff = moment(endDate).diff(moment(startDate), 'days');
    let j = 0;
    for (var i = 0; i <= diff; i++) {
        j = i == 0 ? 0 : 1
        dates.push(end.subtract(j, 'd').format(dateFormat));
    }
    return dates;
};
export function getMonthFirstDay(month: any) {
    return moment().subtract(month, 'months').startOf('month').format('YYYY-MM-DD');
};

// Send NOtification for Android user
export function sendNotificationToAndroid(payload: any) {
    try {
        let params = {
            "content_available": true,
            "data": {
                "body": payload.body,
                "senderId": payload.sender_user_id,
                "title": payload.title,
                "badge": payload.badgeString,
                "type": payload.type
            },
            "priority": "high",
            "tokens": payload.tokens
        }
        // admin.messaging().sendMulticast(params);
        return 1;
    } catch (e: any) {
        console.log(e.message);
        return 1;
    }
}

// // send notifiction for IOS user 
export function sendNotificationToIos(payload: any) {
    try {
        let params = {
            "content_available": true,
            "data": {
                "body": payload.body,
                "senderId": payload.sender_user_id,
                "title": payload.title,
            },
            "notification": {
                "body": payload.body,
                "title": payload.title,
            },
            "apns": {
                "headers": {
                    "apns-priority": "5"
                },
                "payload": {
                    "aps": {
                        "badge": payload.badge,
                        "sound": "default"
                    }
                }
            },
            "priority": "high",
            "tokens": payload.tokens
        }
        // admin.messaging().sendMulticast(params);
        return 1;
    } catch (e: any) {
        console.log(e.message);
        return 1;
    }
}

export function sendNotificationToWeb(payload: any) {
    try {
        let params = {
            "content_available": true,
            "data": {
                "body": payload.body,
                "senderId": payload.sender_user_id,
                "title": payload.title,
            },
            "notification": {
                "body": payload.body,
                "title": payload.title,
            },
            "apns": {
                "headers": {
                    "apns-priority": "5"
                },
                "payload": {
                    "aps": {
                        "badge": payload.badge,
                        "sound": "default"
                    }
                }
            },
            "priority": "high",
            "tokens": payload.tokens
        }
        // admin.messaging().sendMulticast(params);
        return 1;
    } catch (e: any) {
        console.log(e.message);
        return 1;
    }
}

export function getNumberWithDecimalInMultipleOfFive(number: any) {
    let _number = number;
    number = number.toString();
    number = number.split('.');
    if (number.length > 1) {
        number = _number.toFixed(1).toString().split('.');
        let decimal_part = parseInt(number[1]);
        if (decimal_part >= 1 && decimal_part <= 4) {
            return Math.floor(_number);
        } else if (decimal_part >= 6 && decimal_part <= 9) {
            return Math.ceil(_number);
        } else {
            return _number
        }
    } else {
        return parseInt(number[0]);
    }
};

export function getDefaultSlideContent() {
    let content = `<section data-slide-id=\"$slide_id$\" style=\"height: 720px; width: 1280px; background-color: rgba(255,255,255,1);\"><div data-block-id=\"46002fcd-21ba-40e7-9489-fbf099f8faf1\" data-block-type=\"text\" style=\"position: absolute; top: 250px; left: 300px; width: 700px; height: 125px; transform: rotate(0deg)\"> <div data-text=\"Add Title\" style=\"text-align: center; font-family: arial; font-size: 85px; line-height: 125px; color: #000000; opacity: 100%; \"><p></p></div> </div><div data-block-id=\"650fe37b-fd95-4bfc-8ef0-8067479b2636\" data-block-type=\"text\" style=\"position: absolute; top: 370px; left: 300px; width: 700px; height: 55px; transform: rotate(0deg)\"> <div data-text=\"Add Subtitle\" style=\"text-align: center; font-family: arial; font-size: 38px; line-height: 55px; color: #000000;opacity: 100%; \"><p></p></div> </div></section>`
    return content;
}
/**
 * check if thirdParty api is active
 * @param thirdPartyId 
 * @returns boolean 
 */
export async function isActiveThirdPartyAPI(thirdPartyId: any) {
    let isActive = dbReader.thirdParty.findOne({
        attributes: ['is_active'],
        where: {
            thirdparty_id: thirdPartyId
        },
    })
    isActive = JSON.parse(JSON.stringify(isActive))
    return isActive ? isActive.is_active : 0
}

export function keyGeneration() {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
        modulusLength: 4096,
        publicKeyEncoding: {
            type: 'pkcs1',
            format: 'pem',
        },
        privateKeyEncoding: {
            type: 'pkcs1',
            format: 'pem',
            cipher: 'aes-256-cbc',
            passphrase: 'SM',
        },
    });
    return {
        privateKey: privateKey,
        publicKey: publicKey
    };
}

export function decodeData(key: string, token: string) {
    try {
        const privateKey = key
        const buffer = Buffer.from(token, 'base64')
        const decrypted = crypto.privateDecrypt({
            key: privateKey.toString(),
            passphrase: 'SM',
        }, buffer)
        return JSON.parse(decrypted.toString('utf8'));
    } catch (err: any) {
        throw new Error(err.message)
    }
}