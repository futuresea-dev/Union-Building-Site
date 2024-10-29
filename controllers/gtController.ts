import { Request, Response } from "express";
import { ErrorController } from "../core/ErrorController";
import { SuccessResponse } from '../core/ApiResponse';
import { BadRequestError, ApiError } from '../core/ApiError';
import moment from "moment";
const { dbReader, dbWriter } = require('../models/dbConfig');
const EC = new ErrorController();
// const dotenv = require("dotenv").config();
require("dotenv").config();
const axios = require("axios");
let refreshToken:any = "eyJzdiI6IjAwMDAwMSIsImFsZyI6IkhTNTEyIiwidiI6IjIuMCIsImtpZCI6ImIxZjhhODlhLTgwYTctNDY1Mi04NmZlLWVlNWI3ZGI4OThkOCJ9.eyJ2ZXIiOjksImF1aWQiOiJhZTE5MWU1ZTQzYjg5ZmFhZThlNDkzOGRlOWZkMzgzNCIsImNvZGUiOiJ1bFNiRmVkNUU4ektvWW41QURYVDdTcVpTaEZ5RXl6anciLCJpc3MiOiJ6bTpjaWQ6dlVBSWpjNkxSMkdYbndqdWtnUEQwUSIsImdubyI6MCwidHlwZSI6MSwidGlkIjowLCJhdWQiOiJodHRwczovL29hdXRoLnpvb20udXMiLCJ1aWQiOiJfcksyVWVmWlF1MkV2OWw5Z3lHR3R3IiwibmJmIjoxNzA1MzE1Mjg3LCJleHAiOjE3MTMwOTEyODcsImlhdCI6MTcwNTMxNTI4NywiYWlkIjoidjBLRW9Vc2lReDIxS3QtVVJJZW5OdyJ9.sTbzWMP7CifFZhZgZzgWpWn39gTQaI6EKRSAai7dDZH8Bu1l6AVucNCVQ7Mk-jBFcXxrm72uX3sdizzvQU6L3Q";
let accessToken = "";
import { NodeMailerController } from "./thirdParty/nodeMailerController";
var ObjectMail = new NodeMailerController();
import { enumerationController } from '../controllers/enumerationController';
var EnumObject = new enumerationController();
export class GTController {

    public listAllMeetups = async (req: Request, res: Response) => {
        try {
            let { page_no, page_record, meetup_category, meetup_type, sort_by, sort_order,is_approved,is_proposal } = req.body,
                totalRecord = page_record * page_no,
                pageOffset = totalRecord - page_record,
                sortBy = sort_by ? sort_by : 'meetup_datetime',
                sortOrder = sort_order ? sort_order : 'DESC'

            let where: any = { is_deleted: 0 }
            if (meetup_category) {
                where['meetup_category'] = meetup_category
            }
            if (meetup_type) {
                where['meetup_type'] = meetup_type
            }
            if (is_approved== 0 || is_approved == 1 || is_approved == 2) {
                where['is_approved'] = is_approved;
            }
            if(is_proposal == 0 || is_proposal == 1) {
                where['is_proposal'] = is_proposal
            }
            let meetupData = await dbReader.sycuGrowTogetherMeetup.findAndCountAll({
                where: where,
                order: [[sortBy, sortOrder]],
                limit: page_record,
                offset: pageOffset,
                include: [
                    {
                        model:dbReader.sycuGrowTogetherMeetupParticipants,
                        required:false,
                        attributes:['user_id'],
                        include:[
                            {
                                model:dbReader.users,
                                attributes:['first_name','last_name','email']
                            }
                        ],
                        separate:true
                    }
                ]
            })
            meetupData = JSON.parse(JSON.stringify(meetupData));
            new SuccessResponse(EC.success, meetupData).send(res);
        } catch (err: any) {
            ApiError.handle(new BadRequestError(err.message), res);
        }
    }

    // Send mail to all the users who have joined when updating
    public addUpdateMeetup = async (req: Request, res: Response) => {
        try {
            //@ts-ignore
            let { user_id } = req;
            let { meetup_id = 0, meetup_title, meetup_category, meetup_datetime, participants_limit, zoom_meeting_id } = req.body
            if (meetup_id) {
                if(zoom_meeting_id){
                    let meetingData:any = await dbReader.sycuGrowTogetherMeetup.findOne({
                        where: {
                            meetup_id: meetup_id,
                            is_deleted: 0
                        }
                    })
                    if(meetingData.meetup_datetime!=meetup_datetime){
                        let participants = await dbReader.sycuGrowTogetherMeetupParticipants.findAll({
                            where:{
                                meetup_id:meetup_id,
                                is_deleted:0
                            },
                            include:[
                                {
                                    model:dbReader.users,
                                    attributes: ['email','display_name' , 'first_name', 'last_name','mobile']
                                }
                            ]
                        })
                        if(participants){
                            let siteId = EnumObject.templateIdentifier.get('MeetupUpdate').value
                            let smsId = EnumObject.smsTemplateIdentifier.get('MeetupUpdate').value
                            participants = JSON.parse(JSON.stringify(participants));
                            participants.forEach((element:any) => {
                                let emailPayload= {
                                    user_email: element.sycu_user.email,
                                    user_id: element.user_id,
                                    templateIdentifier: siteId,
                                    fullName: element.sycu_user.display_name.trim.length == 0 ? `${element.sycu_user.first_name} ${element.sycu_user.last_name}` : element.sycu_user.display_name,
                                    site: 2,
                                    meetup_title: meetingData.meetup_title,
                                    meetup_datetime: meetup_datetime,
                                    SiteName:"Grow Together"
                                };
                                let smsPayload = {
                                    mobile: element.sycu_user.mobile,
                                    templateIdentifier: smsId,
                                    fullName: element.sycu_user.first_name,
                                    site: 2,
                                    meetup_title: meetingData.meetup_title,
                                    meetup_datetime: meetup_datetime,
                                    SiteName:"Grow Together",
                                    user_id: element.user_id
                                }
                                ObjectMail.ConvertData(emailPayload,{});
                                ObjectMail.ConvertSMSData(smsPayload);
                            })
                        }
                    }
                    try {
                        const params = new URLSearchParams();
                    params.append('grant_type', 'refresh_token'); params.append('refresh_token', refreshToken);
                    let oauthAPI = await axios.post("https://zoom.us/oauth/token", params.toString(), {
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded"
                        },
                        auth: {
                            username: process.env.ZOOM_CLIENT_ID,
                            password: process.env.CLIENT_SECRET
                        }
                    });
                    accessToken = oauthAPI.data.access_token;
                    refreshToken = oauthAPI.data.refresh_token;
                    let updateMeeting = await axios.patch(`https://api.zoom.us/v2/meetings/${zoom_meeting_id}`, {
                        topic: meetup_title,
                        start_time: moment.utc(meetup_datetime, 'MMM D YYYY, h:mm a'),
                    }, {
                        headers: {
                            "Authorization": "Bearer " + accessToken
                        }
                    })
                    } catch (error:any) {
                        console.log(error.message,"err");
                    }
                }
                await dbWriter.sycuGrowTogetherMeetup.update({
                    user_id: user_id,
                    meetup_title: meetup_title,
                    participants_limit: participants_limit,
                    meetup_datetime: meetup_datetime,
                    meetup_category: meetup_category,
                    updated_by: user_id
                }, {
                    where: { meetup_id: meetup_id }
                })
            } else {
                const params = new URLSearchParams();
                params.append('grant_type', 'refresh_token'); params.append('refresh_token', refreshToken);
                let oauthAPI = await axios.post("https://zoom.us/oauth/token", params.toString(), {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    auth: {
                        username: process.env.ZOOM_CLIENT_ID,
                        password: process.env.CLIENT_SECRET
                    }
                });
                accessToken = oauthAPI.data.access_token;
                refreshToken = oauthAPI.data.refresh_token;

                let meetingData = await axios.post("https://api.zoom.us/v2/users/me/meetings", {
                    topic: meetup_title,
                    type: 2,
                    start_time: moment.utc(meetup_datetime, 'MMM D YYYY, h:mm a'),
                    duration: 40
                }, {
                    headers: {
                        "Authorization": "Bearer " + accessToken
                    }
                })
                await dbWriter.sycuGrowTogetherMeetup.create({
                    user_id: user_id,
                    meetup_title: meetup_title,
                    participants_limit: participants_limit,
                    meetup_datetime: meetup_datetime,
                    meetup_category: meetup_category,
                    meetup_type: 1,
                    created_by: user_id,
                    meetup_link: meetingData.data.join_url,
                    zoom_meeting_id: meetingData.data.id,
                    is_approved: 1,
                    is_proposal:0
                })
            }
            new SuccessResponse(EC.success, {}).send(res);
        } catch (err: any) {
            ApiError.handle(new BadRequestError(err.message), res);
        }
    }

    public deleteProposeMeetup = async (req: Request, res: Response) => {
        try {
            let { meetup_id, zoom_meeting_id } = req.params

            let meetingData:any = await dbReader.sycuGrowTogetherMeetup.findOne({
                where: {
                    meetup_id: meetup_id,
                    is_deleted: 0
                }
            })
                let participants = await dbReader.sycuGrowTogetherMeetupParticipants.findAll({
                    where:{
                        meetup_id:meetup_id,
                        is_deleted:0
                    },
                    include:[
                        {
                            model:dbReader.users,
                            attributes: ['email','display_name' , 'first_name', 'last_name','mobile']
                        }
                    ]
                })
                if(participants){
                    let siteId = EnumObject.templateIdentifier.get('MeetupCancel').value
                    let smsId = EnumObject.smsTemplateIdentifier.get('MeetupCancel').value
                    participants = JSON.parse(JSON.stringify(participants));
                    participants.forEach((element:any) => {
                        let emailPayload= {
                            user_email: element.sycu_user.email,
                            user_id: element.user_id,
                            templateIdentifier: siteId,
                            fullName: element.sycu_user.display_name.trim.length == 0 ? `${element.sycu_user.first_name} ${element.sycu_user.last_name}` : element.sycu_user.display_name,
                            site: 2,
                            meetup_title: meetingData.meetup_title,
                            SiteName:"Grow Together"
                        };
                        let smsPayload = {
                            mobile: element.sycu_user.mobile,
                            templateIdentifier: smsId,
                            fullName: element.sycu_user.first_name,
                            site: 2,
                            meetup_title: meetingData.meetup_title,
                            SiteName:"Grow Together",
                            user_id: element.user_id
                        }
                        ObjectMail.ConvertData(emailPayload,{});
                        ObjectMail.ConvertSMSData(smsPayload);
                    })
                }
            
            

            const params = new URLSearchParams();
            params.append('grant_type', 'refresh_token'); params.append('refresh_token', refreshToken);
            let oauthAPI = await axios.post("https://zoom.us/oauth/token", params.toString(), {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                auth: {
                    username: process.env.ZOOM_CLIENT_ID,
                    password: process.env.CLIENT_SECRET
                }
            });
            accessToken = oauthAPI.data.access_token;
            refreshToken = oauthAPI.data.refresh_token;
            try {
                let deleteMeeting = await axios.delete(`https://api.zoom.us/v2/meetings/${zoom_meeting_id}`, {
                    headers: {
                        "Authorization": "Bearer " + accessToken
                    }
                })
            } catch (error) {
                // @ts-ignore
                console.log(error.message,"error message");
            }

            await dbWriter.sycuGrowTogetherMeetup.update({
                is_deleted: 1,
                deleted_datetime: new Date()
            }, {
                where: { meetup_id: meetup_id }
            })
            new SuccessResponse("Meetup deleted successfully.", {}).send(res);
        } catch (err: any) {
            ApiError.handle(new BadRequestError(err.message), res);
        }
    }

    public acceptOrRejectMeetup = async (req: Request, res: Response) => {
        try {
            let { meetup_id, is_approved } = req.body
            let findMeeting = await dbReader.sycuGrowTogetherMeetup.findOne({
                where: { meetup_id: meetup_id }
            });
            if(!findMeeting){
                new BadRequestError("Meetup not found.")
            }
            else{
                let meetingData;
                if(is_approved == 1){
                    const params = new URLSearchParams();
                    params.append('grant_type', 'refresh_token'); params.append('refresh_token', refreshToken);
                    let oauthAPI = await axios.post("https://zoom.us/oauth/token", params.toString(), {
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded"
                        },
                        auth: {
                            username: process.env.ZOOM_CLIENT_ID,
                            password: process.env.CLIENT_SECRET
                        }
                    });
                    accessToken = oauthAPI.data.access_token;
                    refreshToken = oauthAPI.data.refresh_token;
    
                     meetingData = await axios.post("https://api.zoom.us/v2/users/me/meetings", {
                        topic: findMeeting.meetup_title,
                        type: 2,
                        start_time: moment.utc(findMeeting.meetup_datetime, 'MMM D YYYY, h:mm a'),
                        duration: 40
                    }, {
                        headers: {
                            "Authorization": "Bearer " + accessToken
                        }
                    })
                    await dbWriter.sycuGrowTogetherMeetup.update({
                        is_approved: is_approved,
                        zoom_meeting_id: meetingData.data.id,
                        meetup_link: meetingData.data.join_url
                    }, {
                        where: { meetup_id: meetup_id }
                    })
                }
                else{
                    await dbWriter.sycuGrowTogetherMeetup.update({
                        is_approved: is_approved
                    }, {
                        where: { meetup_id: meetup_id }
                    })
                }

                
                new SuccessResponse("Meetup updated successfully.", {}).send(res);
            }
        } catch (err: any) {
            ApiError.handle(new BadRequestError(err.message), res);
        }
    }
}
