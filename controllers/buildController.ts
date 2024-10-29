//Sm & So
import { Request, Response } from "express";
import { ErrorController, SuccessResponse, BadRequestError, ApiError } from '../core/index';
const { dbReader, dbWriter } = require('../models/dbConfig');
import { RandomString } from '../helpers/helpers';
const { Op } = dbReader.Sequelize;
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
    accessKeyId: process.env.AWSACCESSKEYID,
    secretAccessKey: process.env.AWSSECRETACCESSKEY,
});
const EC = new ErrorController();

export class adminBuildController {

    //Sm This API is for create message from Admin Side 
    public createMessageBuild = async (req: Request, res: Response) => {
        try {
            // Getting user Id from bearer token
            const requestContent: any = req;
            let userId = requestContent.user_id;
            // Getting Message Count For arranging sortable order
            let getMessage = await dbReader.messageBuildList.count({
                where: {
                    user_id: userId,
                    is_deleted: 0,
                    is_restore: 0
                },
                attributes: ['user_id']
            });
            // Inserting record in message buildList table
            let insertMessageBuildList;
            insertMessageBuildList = await dbWriter.messageBuildList.create({
                user_id: userId,
                build_folder_id: 0,
                build_title: 'NEW LESSON',
                build_sub_title: 'SUBTITLE',
                is_default_build: 0,
                is_demo_build: 0,
                is_system: 1,
                media_url: "",
                restore_point_title: "",
                sortable_order: getMessage,
                is_original: 1,
                build_type: req.body.build_type,
                series_id: req.body.series_id,
                week_no: req.body.week_no,
                is_deleted: 0,
                created_datetime: new Date(),
                is_from: 1
            });
            // Updating the parent_id
            await dbWriter.messageBuildList.update(
                {
                    parent_id: insertMessageBuildList.message_build_list_id
                },
                {
                    where: {
                        message_build_list_id: insertMessageBuildList.message_build_list_id
                    }
                }
            );
            // Checking wether the generated code is already available or not in database.
            // To avoid duplication
            // if we get the record in database then again code will be generated
            // and checked in database
            var checkLoop = 1;
            while (checkLoop != 0) {
                let result = RandomString(4);
                let publicCode = RandomString(12);
                var getShareCode = await dbReader.shareCode.findOne({
                    where: {
                        code: result,
                        is_deleted: 0
                    },
                    attributes: ['code']
                });
                if (!getShareCode) {
                    await dbWriter.shareCode.create({
                        user_id: insertMessageBuildList.user_id,
                        share_content_id: insertMessageBuildList.message_build_list_id,
                        share_content_type: 1,
                        code: result,
                        public_code: publicCode,
                    });
                    checkLoop = 0;
                }
            }
            var insertArray = [];
            if (req.body.is_new_volume) {

                if (req.body.build_type == 1) {
                    insertArray.push({
                        build_list_id: insertMessageBuildList.message_build_list_id,
                        build_elements_id: 16,
                        title: 'BIG IDEA',
                        extra_title: 'BIBLE',
                        extra_title_1: "ABOUT THIS WEEK",
                        content: 'The big idea of your talk in 10 words or less.',
                        extra_content: 'The Scripture references you’re going to cover.',
                        extra_content_1: "About this week of your talk in 15 words or less.",
                        media_url: '',
                        sortable_order: 0,
                        build_type: 1,
                        is_series: 0,
                        is_deleted: 0,
                        is_visible: 1,
                    })
                    insertArray.push({
                        build_list_id: insertMessageBuildList.message_build_list_id,
                        build_elements_id: 17,
                        title: 'Welcome Time!',
                        extra_title: '',
                        extra_title_1: "",
                        content: '',
                        extra_content: '',
                        extra_content_1: "",
                        media_url: '',
                        sortable_order: 0,
                        build_type: 1,
                        is_series: 0,
                        is_deleted: 0,
                        is_visible: 1,
                    })
                    insertArray.push({
                        build_list_id: insertMessageBuildList.message_build_list_id,
                        build_elements_id: 8,
                        title: 'Activity',
                        extra_title: '',
                        extra_title_1: "",
                        content: '',
                        extra_content: '',
                        extra_content_1: "",
                        media_url: '',
                        sortable_order: 0,
                        build_type: 1,
                        is_series: 0,
                        is_deleted: 0,
                        is_visible: 1,
                    })
                    insertArray.push({
                        build_list_id: insertMessageBuildList.message_build_list_id,
                        build_elements_id: 8,
                        title: 'Activity',
                        extra_title: '',
                        extra_title_1: "",
                        content: '',
                        extra_content: '',
                        extra_content_1: "",
                        media_url: '',
                        sortable_order: 0,
                        build_type: 1,
                        is_series: 0,
                        is_deleted: 0,
                        is_visible: 1,
                    })
                    insertArray.push({
                        build_list_id: insertMessageBuildList.message_build_list_id,
                        build_elements_id: 17,
                        title: 'Story Time',
                        extra_title: '',
                        extra_title_1: "",
                        content: '',
                        extra_content: '',
                        extra_content_1: "",
                        media_url: '',
                        sortable_order: 0,
                        build_type: 1,
                        is_series: 0,
                        is_deleted: 0,
                        is_visible: 1,
                    })
                    insertArray.push({
                        build_list_id: insertMessageBuildList.message_build_list_id,
                        build_elements_id: 2,
                        title: 'Scripture',
                        extra_title: '',
                        extra_title_1: "",
                        content: '',
                        extra_content: '',
                        extra_content_1: "",
                        media_url: '',
                        sortable_order: 0,
                        build_type: 1,
                        is_series: 0,
                        is_deleted: 0,
                        is_visible: 1,
                    })
                    insertArray.push({
                        build_list_id: insertMessageBuildList.message_build_list_id,
                        build_elements_id: 1,
                        title: 'Big Idea Reveal',
                        extra_title: '',
                        extra_title_1: "",
                        content: '',
                        extra_content: '',
                        extra_content_1: "",
                        media_url: '',
                        sortable_order: 0,
                        build_type: 1,
                        is_series: 0,
                        is_deleted: 0,
                        is_visible: 1,
                    })
                    insertArray.push({
                        build_list_id: insertMessageBuildList.message_build_list_id,
                        build_elements_id: 5,
                        title: 'Video',
                        extra_title: '',
                        extra_title_1: "",
                        content: "Cali's World",
                        extra_content: '',
                        extra_content_1: "",
                        media_url: '',
                        sortable_order: 0,
                        build_type: 1,
                        is_series: 0,
                        is_deleted: 0,
                        is_visible: 1,
                    })

                    insertArray.push({
                        build_list_id: insertMessageBuildList.message_build_list_id,
                        build_elements_id: 10,
                        title: 'Prayer',
                        extra_title: '',
                        extra_title_1: "",
                        content: '',
                        extra_content: '',
                        extra_content_1: "",
                        media_url: '',
                        sortable_order: 0,
                        build_type: 1,
                        is_series: 0,
                        is_deleted: 0,
                        is_visible: 1,
                    })
                    insertArray.push({
                        build_list_id: insertMessageBuildList.message_build_list_id,
                        build_elements_id: 17,
                        title: 'Sharing Time',
                        extra_title: '',
                        extra_title_1: "",
                        content: '',
                        extra_content: '',
                        extra_content_1: "",
                        media_url: '',
                        sortable_order: 0,
                        build_type: 1,
                        is_series: 0,
                        is_deleted: 0,
                        is_visible: 1,
                    })
                    insertArray.push({
                        build_list_id: insertMessageBuildList.message_build_list_id,
                        build_elements_id: 9,
                        title: 'Snack',
                        extra_title: '',
                        extra_title_1: "",
                        content: '',
                        extra_content: '',
                        extra_content_1: "",
                        media_url: '',
                        sortable_order: 0,
                        build_type: 1,
                        is_series: 0,
                        is_deleted: 0,
                        is_visible: 1,
                    })
                    insertArray.push({
                        build_list_id: insertMessageBuildList.message_build_list_id,
                        build_elements_id: 9,
                        title: 'Disucssion: Circle Time',
                        extra_title: '',
                        extra_title_1: "",
                        content: '',
                        extra_content: '',
                        extra_content_1: "",
                        media_url: '',
                        sortable_order: 0,
                        build_type: 1,
                        is_series: 0,
                        is_deleted: 0,
                        is_visible: 1,
                    })
                    insertArray.push({
                        build_list_id: insertMessageBuildList.message_build_list_id,
                        build_elements_id: 8,
                        title: 'Activity',
                        extra_title: '',
                        extra_title_1: "",
                        content: '',
                        extra_content: '',
                        extra_content_1: "",
                        media_url: '',
                        sortable_order: 0,
                        build_type: 1,
                        is_series: 0,
                        is_deleted: 0,
                        is_visible: 1,
                    })
                    insertArray.push({
                        build_list_id: insertMessageBuildList.message_build_list_id,
                        build_elements_id: 2,
                        title: 'Memory Verse',
                        extra_title: '',
                        extra_title_1: "",
                        content: '',
                        extra_content: '',
                        extra_content_1: "",
                        media_url: '',
                        sortable_order: 0,
                        build_type: 1,
                        is_series: 0,
                        is_deleted: 0,
                        is_visible: 1,
                    })
                    insertArray.push({
                        build_list_id: insertMessageBuildList.message_build_list_id,
                        build_elements_id: 17,
                        title: 'Play Time',
                        extra_title: '',
                        extra_title_1: "",
                        content: '',
                        extra_content: '',
                        extra_content_1: "",
                        media_url: '',
                        sortable_order: 0,
                        build_type: 1,
                        is_series: 0,
                        is_deleted: 0,
                        is_visible: 1,
                    })
                    insertArray.push({
                        build_list_id: insertMessageBuildList.message_build_list_id,
                        build_elements_id: 8,
                        title: 'Coloring Page',
                        extra_title: '',
                        extra_title_1: "",
                        content: '',
                        extra_content: '',
                        extra_content_1: "",
                        media_url: '',
                        sortable_order: 0,
                        build_type: 1,
                        is_series: 0,
                        is_deleted: 0,
                        is_visible: 1,
                    })
                    insertArray.push({
                        build_list_id: insertMessageBuildList.message_build_list_id,
                        build_elements_id: 8,
                        title: 'Activity',
                        extra_title: '',
                        extra_title_1: "",
                        content: '',
                        extra_content: '',
                        extra_content_1: "",
                        media_url: '',
                        sortable_order: 0,
                        build_type: 1,
                        is_series: 0,
                        is_deleted: 0,
                        is_visible: 1,
                    })
                    insertArray.push({
                        build_list_id: insertMessageBuildList.message_build_list_id,
                        build_elements_id: 8,
                        title: 'Activity',
                        extra_title: '',
                        extra_title_1: "",
                        content: '',
                        extra_content: '',
                        extra_content_1: "",
                        media_url: '',
                        sortable_order: 0,
                        build_type: 1,
                        is_series: 0,
                        is_deleted: 0,
                        is_visible: 1,
                    })
                }
                else if (req.body.build_type == 2) {
                    insertArray.push({
                        build_list_id: insertMessageBuildList.message_build_list_id,
                        build_elements_id: 16,
                        title: 'BIG IDEA',
                        extra_title: 'BIBLE',
                        extra_title_1: "ABOUT THIS WEEK",
                        content: 'The big idea of your talk in 10 words or less.',
                        extra_content: 'The Scripture references you’re going to cover.',
                        extra_content_1: "About this week of your talk in 15 words or less.",
                        media_url: '',
                        sortable_order: 0,
                        build_type: 1,
                        is_series: 0,
                        is_collapsed: 0,
                        is_visible: 1,
                        is_delete: 0,

                    });
                    insertArray.push({
                        build_list_id: insertMessageBuildList.message_build_list_id,
                        build_elements_id: 17,
                        title: 'Large Group Time',
                        extra_title: '',
                        extra_title_1: "",
                        content: '',
                        extra_content: '',
                        extra_content_1: "",
                        media_url: '',
                        sortable_order: 0,
                        build_type: 1,
                        is_series: 0,
                        is_deleted: 0,
                        is_visible: 1,
                    })
                    insertArray.push({
                        build_list_id: insertMessageBuildList.message_build_list_id,
                        build_elements_id: 1,
                        title: 'Welcome',
                        extra_title: '',
                        extra_title_1: "",
                        content: '',
                        extra_content: '',
                        extra_content_1: "",
                        media_url: '',
                        sortable_order: 0,
                        build_type: 1,
                        is_series: 0,
                        is_deleted: 0,
                        is_visible: 1,
                    })
                    insertArray.push({
                        build_list_id: insertMessageBuildList.message_build_list_id,
                        build_elements_id: 17,
                        title: 'What?',
                        extra_title: '',
                        extra_title_1: "",
                        content: '',
                        extra_content: '',
                        extra_content_1: "",
                        media_url: '',
                        sortable_order: 0,
                        build_type: 1,
                        is_series: 0,
                        is_deleted: 0,
                        is_visible: 1,
                    })
                    insertArray.push({
                        build_list_id: insertMessageBuildList.message_build_list_id,
                        build_elements_id: 2,
                        title: 'Scripture',
                        extra_title: '',
                        extra_title_1: "",
                        content: '',
                        extra_content: '',
                        extra_content_1: "",
                        media_url: '',
                        sortable_order: 0,
                        build_type: 1,
                        is_series: 0,
                        is_deleted: 0,
                        is_visible: 1,
                    })
                    insertArray.push({
                        build_list_id: insertMessageBuildList.message_build_list_id,
                        build_elements_id: 8,
                        title: 'Activity',
                        extra_title: '',
                        extra_title_1: "",
                        content: '',
                        extra_content: '',
                        extra_content_1: "",
                        media_url: '',
                        sortable_order: 0,
                        build_type: 1,
                        is_series: 0,
                        is_deleted: 0,
                        is_visible: 1,
                    })
                    insertArray.push({
                        build_list_id: insertMessageBuildList.message_build_list_id,
                        build_elements_id: 8,
                        title: 'Activity',
                        extra_title: '',
                        extra_title_1: "",
                        content: '',
                        extra_content: '',
                        extra_content_1: "",
                        media_url: '',
                        sortable_order: 0,
                        build_type: 1,
                        is_series: 0,
                        is_deleted: 0,
                        is_visible: 1,
                    })
                    insertArray.push({
                        build_list_id: insertMessageBuildList.message_build_list_id,
                        build_elements_id: 14,
                        title: 'Poll',
                        extra_title: '',
                        extra_title_1: "",
                        content: 'Could also be a question',
                        extra_content: '',
                        extra_content_1: "",
                        media_url: '',
                        sortable_order: 0,
                        build_type: 1,
                        is_series: 0,
                        is_deleted: 0,
                        is_visible: 1,
                    })
                    insertArray.push({
                        build_list_id: insertMessageBuildList.message_build_list_id,
                        build_elements_id: 17,
                        title: 'So What?',
                        extra_title: '',
                        extra_title_1: "",
                        content: '',
                        extra_content: '',
                        extra_content_1: "",
                        media_url: '',
                        sortable_order: 0,
                        build_type: 1,
                        is_series: 0,
                        is_deleted: 0,
                        is_visible: 1,
                    })
                    insertArray.push({
                        build_list_id: insertMessageBuildList.message_build_list_id,
                        build_elements_id: 2,
                        title: 'Scripture',
                        extra_title: '',
                        extra_title_1: "",
                        content: '',
                        extra_content: '',
                        extra_content_1: "",
                        media_url: '',
                        sortable_order: 0,
                        build_type: 1,
                        is_series: 0,
                        is_deleted: 0,
                        is_visible: 1,
                    })
                    insertArray.push({
                        build_list_id: insertMessageBuildList.message_build_list_id,
                        build_elements_id: 1,
                        title: 'Big Idea Reveal',
                        extra_title: '',
                        extra_title_1: "",
                        content: '',
                        extra_content: '',
                        extra_content_1: "",
                        media_url: '',
                        sortable_order: 0,
                        build_type: 1,
                        is_series: 0,
                        is_deleted: 0,
                        is_visible: 1,
                    })
                    insertArray.push({
                        build_list_id: insertMessageBuildList.message_build_list_id,
                        build_elements_id: 8,
                        title: 'Activity',
                        extra_title: '',
                        extra_title_1: "",
                        content: 'Could also be an image or video',
                        extra_content: '',
                        extra_content_1: "",
                        media_url: '',
                        sortable_order: 0,
                        build_type: 1,
                        is_series: 0,
                        is_deleted: 0,
                        is_visible: 1,
                    })
                    insertArray.push({
                        build_list_id: insertMessageBuildList.message_build_list_id,
                        build_elements_id: 8,
                        title: 'Activity',
                        extra_title: '',
                        extra_title_1: "",
                        content: 'Could also be an object lesson',
                        extra_content: '',
                        extra_content_1: "",
                        media_url: '',
                        sortable_order: 0,
                        build_type: 1,
                        is_series: 0,
                        is_deleted: 0,
                        is_visible: 1,
                    })
                    insertArray.push({
                        build_list_id: insertMessageBuildList.message_build_list_id,
                        build_elements_id: 2,
                        title: 'Scripture',
                        extra_title: '',
                        extra_title_1: "",
                        content: '',
                        extra_content: '',
                        extra_content_1: "",
                        media_url: '',
                        sortable_order: 0,
                        build_type: 1,
                        is_series: 0,
                        is_deleted: 0,
                        is_visible: 1,
                    })
                    insertArray.push({
                        build_list_id: insertMessageBuildList.message_build_list_id,
                        build_elements_id: 5,
                        title: 'Video',
                        extra_title: '',
                        extra_title_1: "",
                        content: '',
                        extra_content: '',
                        extra_content_1: "",
                        media_url: '',
                        sortable_order: 0,
                        build_type: 1,
                        is_series: 0,
                        is_deleted: 0,
                        is_visible: 1,
                    })
                    insertArray.push({
                        build_list_id: insertMessageBuildList.message_build_list_id,
                        build_elements_id: 17,
                        title: 'Now What?',
                        extra_title: '',
                        extra_title_1: "",
                        content: '',
                        extra_content: '',
                        extra_content_1: "",
                        media_url: '',
                        sortable_order: 0,
                        build_type: 1,
                        is_series: 0,
                        is_deleted: 0,
                        is_visible: 1,
                    })
                    insertArray.push({
                        build_list_id: insertMessageBuildList.message_build_list_id,
                        build_elements_id: 11,
                        title: 'Reflection',
                        extra_title: '',
                        extra_title_1: "",
                        content: '',
                        extra_content: '',
                        extra_content_1: "",
                        media_url: '',
                        sortable_order: 0,
                        build_type: 1,
                        is_series: 0,
                        is_deleted: 0,
                        is_visible: 1,
                    })
                    insertArray.push({
                        build_list_id: insertMessageBuildList.message_build_list_id,
                        build_elements_id: 12,
                        title: 'Response',
                        extra_title: '',
                        extra_title_1: "",
                        content: '',
                        extra_content: '',
                        extra_content_1: "",
                        media_url: '',
                        sortable_order: 0,
                        build_type: 1,
                        is_series: 0,
                        is_deleted: 0,
                        is_visible: 1,
                    })
                    insertArray.push({
                        build_list_id: insertMessageBuildList.message_build_list_id,
                        build_elements_id: 2,
                        title: 'Memory Verse',
                        extra_title: '',
                        extra_title_1: "",
                        content: '',
                        extra_content: '',
                        extra_content_1: "",
                        media_url: '',
                        sortable_order: 0,
                        build_type: 1,
                        is_series: 0,
                        is_deleted: 0,
                        is_visible: 1,
                    })
                    insertArray.push({
                        build_list_id: insertMessageBuildList.message_build_list_id,
                        build_elements_id: 10,
                        title: 'Prayer',
                        extra_title: '',
                        extra_title_1: "",
                        content: '',
                        extra_content: '',
                        extra_content_1: "",
                        media_url: '',
                        sortable_order: 0,
                        build_type: 1,
                        is_series: 0,
                        is_deleted: 0,
                        is_visible: 1,
                    })
                    insertArray.push({
                        build_list_id: insertMessageBuildList.message_build_list_id,
                        build_elements_id: 17,
                        title: 'Small Group Time',
                        extra_title: '',
                        extra_title_1: "",
                        content: '',
                        extra_content: '',
                        extra_content_1: "",
                        media_url: '',
                        sortable_order: 0,
                        build_type: 1,
                        is_series: 0,
                        is_deleted: 0,
                        is_visible: 1,
                    })
                    insertArray.push({
                        build_list_id: insertMessageBuildList.message_build_list_id,
                        build_elements_id: 9,
                        title: 'Discussion',
                        extra_title: '',
                        extra_title_1: "",
                        content: '',
                        extra_content: '',
                        extra_content_1: "",
                        media_url: '',
                        sortable_order: 0,
                        build_type: 1,
                        is_series: 0,
                        is_deleted: 0,
                        is_visible: 1,
                    })
                    insertArray.push({
                        build_list_id: insertMessageBuildList.message_build_list_id,
                        build_elements_id: 8,
                        title: 'Activity',
                        extra_title: '',
                        extra_title_1: "",
                        content: '',
                        extra_content: '',
                        extra_content_1: "",
                        media_url: '',
                        sortable_order: 0,
                        build_type: 1,
                        is_series: 0,
                        is_deleted: 0,
                        is_visible: 1,
                    })
                }
                else if (req.body.build_type == 3 || req.body.build_type == 4) {
                    insertArray.push({
                        build_list_id: insertMessageBuildList.message_build_list_id,
                        build_elements_id: 16,
                        title: 'BIG IDEA',
                        extra_title: 'BIBLE',
                        extra_title_1: "ABOUT THIS WEEK",
                        content: 'The big idea of your talk in 10 words or less.',
                        extra_content: 'The Scripture references you’re going to cover.',
                        extra_content_1: "About this week of your talk in 15 words or less.",
                        media_url: '',
                        sortable_order: 0,
                        build_type: 1,
                        is_series: 0,
                        is_deleted: 0,
                        is_visible: 1,
                    })
                }
            }
            else {
                //finding the id's of static data. talk,big idea and bible
                // Calling loop for put content in right title and avoid mismatch
                // inserting/Mapping data of buildElements and MessageBuildList
                var elementData = ['TALK', 'BIG IDEA / BIBLE']
                var getStaticData = await dbReader.buildElements.findAll({
                    where: {
                        build_elements_name: {
                            [Op.in]: elementData
                        }
                    }
                });
                for (var i = 0; i < getStaticData.length; i++) {
                    if (getStaticData[i].build_elements_name == "BIG IDEA / BIBLE") {
                        insertArray.push({
                            build_list_id: insertMessageBuildList.message_build_list_id,
                            build_elements_id: getStaticData[i].build_elements_id,
                            title: 'BIG IDEA',
                            extra_title: 'BIBLE',
                            extra_title_1: "ABOUT THIS WEEK",
                            content: 'The big idea of your talk in 10 words or less.',
                            extra_content: 'The Scripture references you’re going to cover.',
                            extra_content_1: "About this week of your talk in 15 words or less.",
                            media_url: '',
                            sortable_order: 0,
                            build_type: 1,
                            is_series: 0,
                            is_collapsed: 0,
                            is_visible: 1,
                            is_delete: 0
                        });
                    } else {
                        insertArray.push({
                            build_list_id: insertMessageBuildList.message_build_list_id,
                            build_elements_id: getStaticData[i].build_elements_id,
                            title: 'TALK',
                            extra_title: '',
                            content: '',
                            extra_content: '',
                            media_url: '',
                            sortable_order: 1,
                            build_type: 1,
                            is_series: 0,
                            is_collapsed: 0,
                            is_visible: 1,
                            is_delete: 0
                        });
                    }
                }
            }

            if (insertArray.length)
                await dbWriter.buildElementsDetails.bulkCreate(insertArray);

            new SuccessResponse(EC.messageSaved, {
                //@ts-ignore
                token: req.token,
                data: insertMessageBuildList
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    // So This API is for list message from Admin Side
    public listMessageBuild = async (req: Request, res: Response) => {

        try {
            // Getting user Id from bearer token
            const requestContent: any = req;
            let userId = requestContent.user_id;

            // Week Number Condition
            var searchWeekCondition = dbReader.Sequelize.Op.ne, searchWeekData = null;
            if (req.body.week_no && req.body.week_no != 0) {
                searchWeekCondition = Op.in;
                searchWeekData = [req.body.week_no]
            }

            // Week Number Condition
            var searchWeekTypeCondition = dbReader.Sequelize.Op.ne, searchWeekTypeData = null;
            if (req.body.build_type && req.body.build_type != 0) {
                searchWeekTypeCondition = Op.in;
                searchWeekTypeData = [req.body.build_type]
            }

            let getMessageBuildList = await dbReader.messageBuildList.findAndCountAll({
                attributes: [
                    'build_folder_id', 'build_sub_title', 'build_title', 'build_type', 'is_added_by_code', 'is_auto_saved', 'is_default_build', 'is_deleted', 'is_demo_build', 'is_original', 'is_restore', 'media_url', 'message_build_list_id', 'parent_id', 'created_datetime', 'restore_created_datetime', 'restore_point_title', 'restore_updated_datetime', 'series_id', 'sortable_order', 'updated_datetime', 'user_id', 'week_no',
                    [dbReader.Sequelize.literal('code'), 'code'],
                    [dbReader.Sequelize.literal('build_share_code_id'), 'code_id']
                ],
                where:
                {
                    is_deleted: 0,
                    is_restore: 0,
                    series_id: req.body.series_id,
                    week_no: { [searchWeekCondition]: searchWeekData },
                    build_type: { [searchWeekTypeCondition]: searchWeekTypeData }
                },
                include: [{
                    required: false,
                    model: dbReader.shareCode,
                    where: {
                        share_content_type: 1
                    },
                    attributes: [],
                }]
            });

            if (getMessageBuildList.count > 0) {
                if (getMessageBuildList.rows.length > 0) {
                    getMessageBuildList.rows.forEach((e: any) => {
                        e.build_title = e.build_title.replace(/\\'/g, "'");
                        e.build_sub_title = e.build_sub_title.replace(/\\'/g, "'");
                    }
                    );
                }
                new SuccessResponse(EC.listMessageBuild, {
                    //@ts-ignore
                    token: req.token,
                    count: getMessageBuildList.count,
                    data: getMessageBuildList.rows
                }).send(res);
            }
            else {
                new SuccessResponse(EC.noDataFound, {
                    //@ts-ignore
                    token: req.token,
                    count: 0,
                    data: []
                }).send(res);

            }
        }
        catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
    public createVolume = async (req: Request, res: Response) => {
        try {
            // Getting user Id from bearer token
            const requestContent: any = req;
            let userId = requestContent.user_id;

            // Getting Category Volume Id  From Series Id
            let getCategoryVolumeId = await dbReader.categories.findOne({
                where: { category_id: req.body.series_id, is_deleted: 0 }
            });
            if (getCategoryVolumeId) {
                getCategoryVolumeId = JSON.parse(JSON.stringify(getCategoryVolumeId));
                // Finding that category volume id in  volume table
                // If available then we have to just add series
                // if not available then first we have to add volume
                // and then series

                // Getting Series description from details table
                let getSeriesDescription = await dbReader.categoriesDetail.findOne({
                    attributes: ['detail_value'],
                    where: { category_id: req.body.series_id, is_deleted: 0, detail_key: 'description' }
                });
                getSeriesDescription = JSON.parse(JSON.stringify(getSeriesDescription));
                let getVolumeByVolumeId = await dbReader.volumeModel.findOne({
                    where: {
                        is_deleted: 0,
                        is_restore: 0,
                        ministry_type: req.body.ministry_type,
                        category_id: getCategoryVolumeId.parent_category_id,
                    }
                });
                if (getVolumeByVolumeId) {
                    getVolumeByVolumeId = JSON.parse(JSON.stringify(getVolumeByVolumeId));
                    // Volume Exist So we have to create only series
                    //Checking Series Is already created or not
                    let checkSeries = await dbReader.seriesBuildList.findOne({
                        attributes: ['volume_id'],
                        where: {
                            volume_id: getVolumeByVolumeId.volume_id,
                            series_id: req.body.series_id,
                            user_id: userId,
                            is_deleted: 0
                        }
                    });
                    if (checkSeries) {
                        new SuccessResponse(EC.seriesAlreadyAvailable, {
                            //@ts-ignore
                            token: req.token,
                            data: checkSeries
                        }).send(res);
                    } else {
                        // Getting The count Of Series To Arrange Sortable Order
                        let getSeriesCount = await dbReader.seriesBuildList.count({
                            where: {
                                user_id: userId,
                                volume_id: getVolumeByVolumeId.volume_id,
                                is_deleted: 0
                            },
                            attributes: ['volume_id']
                        });

                        let createSeries = await dbWriter.seriesBuildList.create({
                            user_id: userId,
                            volume_id: getVolumeByVolumeId.volume_id,
                            series_id: req.body.series_id,
                            series_buildlist_title: getCategoryVolumeId.category_title,
                            series_buildlist_content: getSeriesDescription.detail_value,
                            media_url: getCategoryVolumeId.category_image,
                            sortable_order: getSeriesCount,
                            hex_color: "",
                            is_visible: 1,
                            is_deleted: 0
                        });

                        // Checking wether the generated code is already available or not in database.
                        // To avoid duplication
                        // if we get the record in database then again code will be generated
                        // and checked in database

                        let checkLoop = 1;
                        while (checkLoop != 0) {
                            let result = RandomString(4);
                            let publicCode = RandomString(12);
                            let getShareCode = await dbReader.shareCode.findOne({
                                where: { code: result, is_deleted: 0 }
                            });
                            if (!getShareCode) {
                                await dbWriter.shareCode.create({
                                    user_id: userId,
                                    share_content_id: createSeries.series_build_list_id,
                                    share_content_type: 2,
                                    code: result,
                                    public_code: publicCode
                                });
                                checkLoop = 0;
                            }
                        }

                        //finding the id's of static data. talk,big idea and bible
                        let elementData = ['Weekly Conversation']
                        let getStaticData = await dbReader.buildElements.findOne({
                            where: { build_elements_name: { [Op.in]: elementData } }
                        });
                        getStaticData = JSON.parse(JSON.stringify(getStaticData));

                        let insertBuildElementDetails = await dbWriter.buildElementsDetails.create({
                            build_list_id: createSeries.series_build_list_id,
                            build_elements_id: getStaticData.build_elements_id,
                            title: getStaticData.build_elements_name,
                            extra_title: '',
                            content: '',
                            extra_content: '',
                            media_url: '',
                            sortable_order: 0,
                            build_type: 1,
                            is_series: 1,
                            is_collapsed: 0,
                            is_visible: 1,
                            is_delete: 0
                        });

                        new SuccessResponse(EC.success, {
                            //@ts-ignore
                            token: req.token,
                            data: createSeries
                        }).send(res);
                    }
                } else {
                    // Inserting record in volume table
                    let insertVolumeRecord = await dbWriter.volumeModel.create({
                        user_id: userId,
                        build_folder_id: 0,
                        volume_title: 'New Volume',
                        is_system: 1,
                        is_deleted: 0,
                        category_id: getCategoryVolumeId.parent_category_id,
                        ministry_type: req.body.ministry_type
                    });

                    // Updating Parent_ID 
                    let updateVolume = await dbWriter.volumeModel.update({
                        parent_id: insertVolumeRecord.volume_id
                    }, {
                        where: { volume_id: insertVolumeRecord.volume_id }
                    });
                    // Checking wether the generated code is already available or not in database.
                    // To avoid duplication
                    // if we get the record in database then again code will be generated
                    // and checked in database

                    let checkLoop = 1;
                    while (checkLoop != 0) {
                        let result = RandomString(4);
                        let publicCode = RandomString(12);
                        let getShareCode = await dbReader.shareCode.findOne({
                            where: { code: result, is_deleted: 0 }
                        });
                        if (!getShareCode) {
                            await dbWriter.shareCode.create({
                                user_id: insertVolumeRecord.user_id,
                                share_content_id: insertVolumeRecord.volume_id,
                                share_content_type: 3,
                                code: result,
                                public_code: publicCode
                            });
                            checkLoop = 0;
                        }
                    }
                    // One insert query
                    // series image series description
                    let insertSeries = await dbWriter.seriesBuildList.create({
                        user_id: userId,
                        volume_id: insertVolumeRecord.volume_id,
                        series_id: req.body.series_id,
                        series_buildlist_title: getCategoryVolumeId.category_title,
                        series_buildlist_content: getSeriesDescription.detail_value,
                        media_url: getCategoryVolumeId.category_image,
                        sortable_order: 0,
                        hex_color: "",
                        is_visible: 1,
                        is_deleted: 0
                    });

                    // For Series
                    // Checking wether the generated code is already available or not in database.
                    // To avoid duplication
                    // if we get the record in database then again code will be generated
                    // and checked in database

                    let checkLoop2 = 1;
                    while (checkLoop2 != 0) {
                        let result = RandomString(4);
                        let publicCode = RandomString(12);
                        let getShareCode = await dbReader.shareCode.findOne({
                            where: { code: result, is_deleted: 0 }
                        });
                        if (!getShareCode) {
                            await dbWriter.shareCode.create({
                                user_id: insertVolumeRecord.user_id,
                                share_content_id: insertSeries.series_build_list_id,
                                share_content_type: 2,
                                code: result,
                                public_code: publicCode
                            });
                            checkLoop2 = 0;
                        }
                    }

                    //finding the id's of static data. talk,big idea and bible
                    let elementData = ['Weekly Conversation']
                    let getStaticData = await dbReader.buildElements.findOne({
                        where: { build_elements_name: { [Op.in]: elementData } }
                    });
                    getStaticData = JSON.parse(JSON.stringify(getStaticData));

                    let insertBuildElementDetails = await dbWriter.buildElementsDetails.create({
                        build_list_id: insertSeries.series_build_list_id,
                        build_elements_id: getStaticData.build_elements_id,
                        title: getStaticData.build_elements_name,
                        extra_title: '',
                        content: '',
                        extra_content: '',
                        media_url: '',
                        sortable_order: 0,
                        build_type: 1,
                        is_series: 1,
                        is_collapsed: 0,
                        is_visible: 1,
                        is_delete: 0
                    });

                    new SuccessResponse(EC.success, {
                        //@ts-ignore
                        token: req.token,
                        data: insertSeries
                    }).send(res);
                }
            } else {
                new SuccessResponse(EC.noDataFound, {
                    //@ts-ignore
                    token: req.token,
                    data: {}
                }).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public listSeriesBuild = async (req: Request, res: Response) => {
        try {
            // Getting user Id from bearer token
            const requestContent: any = req;
            let userId = requestContent.user_id;
            // Series Id Condition
            var seriesCondition = dbReader.Sequelize.Op.ne, seriesData = null;
            if (req.body.series_id && req.body.series_id != 0) {
                seriesCondition = Op.in;
                seriesData = [req.body.series_id]
            }
            if (req.body.type && req.body.type == 1) {

                // aaranging sortable order if not
                let getSortableOrder = await dbReader.seriesBuildList.count({
                    where: {
                        sortable_order: 0,
                        is_deleted: 0,
                        volume_id: req.body.volume_id
                    }
                })

                if (getSortableOrder > 1) {
                    let ab = new adminBuildController();
                    await ab.arrangeSortOrder(req.body.volume_id, 2);
                }

                let getSeriesBuildList = await dbReader.volumeModel.findOne({
                    attributes: ['volume_id', 'volume_title',
                        [dbReader.Sequelize.literal('code'), 'code'],
                        [dbReader.Sequelize.literal('build_share_code_id'), 'code_id']],
                    include: [{
                        separate: true,
                        attributes: [
                            'series_build_list_id', 'user_id', 'volume_id', 'series_buildlist_title', 'series_buildlist_content', 'media_url', 'sortable_order', 'hex_color', 'is_visible', 'is_deleted', 'created_datetime', 'updated_datetime', 'is_added_by_code',
                            [dbReader.Sequelize.literal('code'), 'code'],
                            [dbReader.Sequelize.literal('build_share_code_id'), 'code_id']
                        ],
                        model: dbReader.seriesBuildList,
                        where: {
                            series_id: { [seriesCondition]: seriesData },
                            is_deleted: 0
                        },
                        order: [['sortable_order', 'ASC']],
                        include: [
                            {
                                model: dbReader.shareCode,
                                where: {
                                    share_content_type: 2
                                },
                                attributes: [],
                            }
                        ]
                    },
                    {
                        model: dbReader.shareCode,
                        where: {
                            share_content_type: 3
                        },
                        attributes: [],
                    }],
                    where:
                    {
                        is_deleted: 0,
                        is_restore: 0,
                        volume_id: req.body.volume_id
                    }
                });
                if (getSeriesBuildList) {
                    getSeriesBuildList = JSON.parse(JSON.stringify(getSeriesBuildList))
                    new SuccessResponse(EC.listMessageBuild, {
                        //@ts-ignore
                        token: req.token,
                        count: 1,
                        ...getSeriesBuildList
                    }).send(res);
                }
                else {
                    new SuccessResponse(EC.noDataFound, {
                        //@ts-ignore
                        token: req.token,
                        count: 0
                    }).send(res);
                }
            }
            else {
                let getSeriesBuildList = await dbReader.volumeModel.findOne({
                    attributes: ['volume_id', 'volume_title',
                        [dbReader.Sequelize.literal('code'), 'code'],
                        [dbReader.Sequelize.literal('build_share_code_id'), 'code_id']],
                    include: [{
                        separate: true,
                        attributes: [
                            'series_build_list_id', 'user_id', 'volume_id', 'series_buildlist_title', 'series_buildlist_content', 'media_url', 'sortable_order', 'hex_color', 'is_visible', 'is_deleted', 'created_datetime', 'updated_datetime', 'is_added_by_code',
                            [dbReader.Sequelize.literal('code'), 'code'],
                            [dbReader.Sequelize.literal('build_share_code_id'), 'code_id']
                        ],
                        model: dbReader.seriesBuildList,
                        where: {
                            series_id: { [seriesCondition]: seriesData },
                            is_deleted: 0
                        },
                        order: [['sortable_order', 'ASC']],
                        include: [
                            {
                                model: dbReader.shareCode,
                                where: {
                                    share_content_type: 2
                                },
                                attributes: [],
                            }
                        ]
                    },
                    {
                        model: dbReader.shareCode,
                        where: {
                            share_content_type: 3
                        },
                        attributes: [],
                    }],
                    where: {
                        is_deleted: 0,
                        is_restore: 0,
                        category_id: req.body.volume_id,
                        ministry_type: req.body.ministry_type
                    }
                });

                if (getSeriesBuildList) {
                    if (getSeriesBuildList.gb_series_buildlists.length > 0) {
                        getSeriesBuildList = JSON.parse(JSON.stringify(getSeriesBuildList));
                        new SuccessResponse(EC.listMessageBuild, {
                            //@ts-ignore
                            token: req.token,
                            count: 1,
                            ...getSeriesBuildList.gb_series_buildlists
                        }).send(res);
                    }
                    else {
                        new SuccessResponse(EC.noDataFound, {
                            //@ts-ignore
                            token: req.token,
                            count: 0
                        }).send(res);
                    }
                }
                else {
                    new SuccessResponse(EC.noDataFound, {
                        //@ts-ignore
                        token: req.token,
                        count: 0
                    }).send(res);
                }
            }
        }
        catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
    public getShareLink = async (req: Request, res: Response) => {

        try {
            // Getting user Id from bearer token
            const requestContent: any = req;
            let userId = requestContent.user_id;

            let getShareCode = await dbReader.shareCode.findOne({
                attributes: [
                    'share_content_id', 'share_content_type', ['public_code', 'shareable_link']
                ],
                where: {
                    build_share_code_id: req.body.build_share_code_id,
                    is_deleted: 0
                }
            });

            if (getShareCode) {
                //manipulating data from response
                getShareCode = JSON.parse(JSON.stringify(getShareCode));
                if (getShareCode.share_content_type == 1) {
                    // For Message
                    getShareCode.shareable_link = process.env.ShareLinkURLMessage + getShareCode.share_content_id + '?code=' + getShareCode.shareable_link;
                }
                else {
                    // For Series
                    getShareCode.shareable_link = process.env.ShareLinkURLApp + getShareCode.share_content_id + '?code=' + getShareCode.shareable_link;
                }

                new SuccessResponse(EC.shareLink, {
                    //@ts-ignore
                    token: req.token,
                    data: getShareCode
                }).send(res);
            }
            else {
                new SuccessResponse(EC.noDataFound, {}).send(res);
                // ApiError.handle(new BadRequestError(EC.noDataFound), res);
            }
        }
        catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public deleteMessageBuild = async (req: Request, res: Response) => {

        try {
            // Getting user Id from bearer token
            const requestContent: any = req;
            let userId = requestContent.user_id;

            let deleteMessageBuild = await dbWriter.messageBuildList.update({ is_deleted: 1 },
                { where: { message_build_list_id: req.body.message_build_list_id } }
            );

            // now deleting the reference of message from notes if available
            // we are not adding user id condition because in one user has added another user build
            // and written notes. and if original message is deleted then that notes will also be deleted
            let deleteMessageNotes = await dbWriter.notesModel.update({ is_deleted: 1 },
                { where: { type_id: req.body.message_build_list_id, type: 0 } }
            );

            // Now Deleting Code Of that message So we can re use again
            let deleteMessageCode = await dbWriter.addedCodes.update({ is_deleted: 1 },
                { where: { build_id: req.body.message_build_list_id, build_type: 0 } }
            );

            // Removing the reference of added code
            let deleteAddedCode = await dbWriter.shareCode.update({ is_deleted: 1 },
                { where: { share_content_id: req.body.message_build_list_id, share_content_type: 1 } }
            );


            // Arranging Sort order again 
            // To Resolve Mismatch Issue

            let getAllMessage = await dbReader.messageBuildList.findAndCountAll({
                where: { user_id: userId, is_deleted: 0, is_restore: 0 },
                order: [['sortable_order', 'ASC']]
            });

            let tempObject = {};
            let tempArray = [];

            for (var i = 0; i < getAllMessage.count; i++) {
                tempObject = {
                    message_build_list_id: getAllMessage.rows[i].message_build_list_id,
                    sortable_order: i
                }

                tempArray.push(tempObject);
            }
            // Updating sort order of all elements 
            let updateElementSortOrder = await dbWriter.messageBuildList.bulkCreate(tempArray, { updateOnDuplicate: ["sortable_order"] });

            new SuccessResponse(EC.deleteDataSuccess, {}).send(res);
        }
        catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    //Delete volume
    public deleteVolume = async (req: Request, res: Response) => {
        try {
            // Getting user Id from bearer token
            const requestContent: any = req;
            let userId = requestContent.user_id;

            let deleteVolume = await dbWriter.volumeModel.update({ is_deleted: 1 },
                { where: { volume_id: req.body.volume_id } }
            );


            let deleteShareCodeVolume = await dbWriter.shareCode.update({ is_deleted: 1 },
                { where: { share_content_id: req.body.volume_id, share_content_type: 3 } }
            );

            let deleteVolumeNotes = await dbWriter.notesModel.update({ is_deleted: 1 },
                { where: { type_id: req.body.volume_id, type: 2 } }
            );
            // Removing the reference of added code
            let deleteMessageCode = await dbWriter.addedCodes.update({ is_deleted: 1 },
                { where: { build_id: req.body.volume_id, build_type: 2 } }
            );

            // Deleting All Series Of Particular Volume
            let getAllSeriesOfVolume = await dbReader.seriesBuildList.findAndCountAll({
                attributes: ['series_build_list_id'],
                where: { volume_id: req.body.volume_id }
            });

            let tempObject = {};
            let tempArray = [];
            let tempCodeObject = {};
            let tempCodeArray = [];


            for (var i = 0; i < getAllSeriesOfVolume.count; i++) {
                tempObject = { series_build_list_id: getAllSeriesOfVolume.rows[i].series_build_list_id, is_deleted: 1 }
                tempArray.push(tempObject);

                // For Deleting Code Of Series
                tempCodeObject = {
                    share_content_id: getAllSeriesOfVolume.rows[i].series_build_list_id
                }
                tempCodeArray.push(tempCodeObject);
            }

            let updateSeries = await dbWriter.seriesBuildList.bulkCreate(tempArray,
                { updateOnDuplicate: ["is_deleted"] }
            );

            let deleteShareCodeSeries = await dbWriter.shareCode.update({ is_deleted: 1 },
                { where: { share_content_id: { [Op.in]: tempCodeArray }, share_content_type: 2, user_id: userId } }
            );


            // Deleting All Codes Of Volume And Series

            new SuccessResponse(EC.deleteVolume, {
                //@ts-ignore
                token: req.token
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public updateSeriesBuild = async (req: Request, res: Response) => {
        try {
            const requestContent: any = req;
            let userId = requestContent.user_id;

            let getAllData = JSON.parse(JSON.stringify(req.body));
            // For delete
            if (req.body.is_deleted && req.body.is_deleted == 1) {

                //Getting Volume of particular series 
                let getVolumeOfSeries = await dbReader.seriesBuildList.findOne({
                    attributes: ['volume_id'],
                    where: { series_build_list_id: req.body.series_build_list_id }
                });


                await dbWriter.seriesBuildList.update({ is_deleted: 1 }, {
                    where: { series_build_list_id: req.body.series_build_list_id }
                });

                // now deleting the reference of Series from notes if available
                let deleteMessageNotes = await dbWriter.notesModel.update({ is_deleted: 1 },
                    { where: { type_id: req.body.series_build_list_id, type: 1 } }
                );
                // Removing the reference of added code
                let deleteMessageCode = await dbWriter.addedCodes.update({ is_deleted: 1 },
                    { where: { build_id: req.body.series_build_list_id, build_type: 1 } }
                );

                // Now Deleting Code Of that message So we can re use again
                let deleteSeriesCode = await dbWriter.shareCode.update({ is_deleted: 1 },
                    { where: { share_content_id: req.body.series_build_list_id, share_content_type: 2 } }
                );

                // Updating Sort Order Of All Series
                let getAllSeries = await dbReader.seriesBuildList.findAndCountAll({
                    where: { volume_id: getVolumeOfSeries.volume_id, is_deleted: 0 },
                    order: [['sortable_order', 'ASC']]
                });

                let tempObject = {};
                let tempArray = [];

                for (var i = 0; i < getAllSeries.count; i++) {
                    tempObject = {
                        series_build_list_id: getAllSeries.rows[i].series_build_list_id,
                        sortable_order: i
                    }

                    tempArray.push(tempObject);
                }

                // Updating sort order of all series 
                let updateSeriesSortOrder = await dbWriter.seriesBuildList.bulkCreate(tempArray, { updateOnDuplicate: ["sortable_order"] });

            }
            // For Visible true or false
            if (getAllData.is_visible != undefined) {
                if (getAllData.is_visible == 1) {
                    await dbWriter.seriesBuildList.update({
                        is_visible: 1
                    }, {
                        where: {
                            series_build_list_id: req.body.series_build_list_id,
                            user_id: userId
                        }
                    });
                }
                else if (getAllData.is_visible == 0) {
                    await dbWriter.seriesBuildList.update({
                        is_visible: 0
                    },
                        {
                            where: {
                                series_build_list_id: req.body.series_build_list_id,
                                user_id: userId
                            }
                        });
                }

            }

            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token,
            }).send(res);

        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    // Builder APIs
    public createDuplicateBuildElement = async (req: Request, res: Response) => {
        try {

            // Finding the element which we want to duplicate
            let getBuildElementsDetailsList = await dbReader.buildElementsDetails.findOne({
                where: {
                    build_elements_details_id: req.body.build_elements_details_id,
                    is_delete: 0
                }
            });

            // Get all elements present in message
            // for arranging  sortable order
            let getAllElementMessage = await dbReader.buildElementsDetails.findAndCountAll({
                where: {
                    build_list_id: getBuildElementsDetailsList.build_list_id,
                    is_series: req.body.is_series,
                    is_delete: 0
                },
                order: [['sortable_order', 'ASC']]
            });

            let tempObject = {};
            let tempArray = [];
            let cnt = 0;
            for (var i = 0; i < getAllElementMessage.count; i++) {
                if (cnt > 0) {
                    // we don't want to update sort order of elements
                    // which come before duplicated elements
                    tempObject = {
                        build_elements_details_id: getAllElementMessage.rows[i].build_elements_details_id,
                        sortable_order: getAllElementMessage.rows[i].sortable_order + 1
                    }

                    tempArray.push(tempObject);
                }
                else {
                    // Once the element get. we will update all elements sort order
                    // after that element
                    if (getAllElementMessage.rows[i].build_elements_details_id == req.body.build_elements_details_id) {
                        // getting sort order of that element
                        cnt = getAllElementMessage.rows[i].sortable_order + 1
                    }
                }
            }

            // Create duplicate data from original

            let insertBuildElementDetails = await dbWriter.buildElementsDetails.create({
                build_list_id: getBuildElementsDetailsList.build_list_id,
                build_elements_id: getBuildElementsDetailsList.build_elements_id,
                title: getBuildElementsDetailsList.title,
                extra_title: getBuildElementsDetailsList.extra_title,
                extra_title_1: getBuildElementsDetailsList.extra_title_1 || "",
                content: getBuildElementsDetailsList.content,
                extra_content: getBuildElementsDetailsList.extra_content,
                extra_content_1: getBuildElementsDetailsList.extra_content_1 || "",
                media_url: getBuildElementsDetailsList.media_url,
                sortable_order: cnt,
                build_type: getBuildElementsDetailsList.build_type,
                is_series: getBuildElementsDetailsList.is_series,
                is_collapsed: getBuildElementsDetailsList.is_collapsed,
                is_visible: getBuildElementsDetailsList.is_visible,
                is_delete: getBuildElementsDetailsList.is_delete
            });

            // Updating sort order of all elements 
            let updateElementSortOrder = await dbWriter.buildElementsDetails.bulkCreate(
                tempArray,
                { updateOnDuplicate: ["sortable_order"] }
            );
            new SuccessResponse(EC.duplicateElement, {
                //@ts-ignore
                token: req.token,
                data: insertBuildElementDetails
            }).send(res);
        }
        catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public updateBuildElementsDetails = async (req: Request, res: Response) => {
        try {

            let getAllData = JSON.parse(JSON.stringify(req.body));

            // Adding Series or Message Id in response
            // As per Front-end developer requirement

            let findId = await dbReader.buildElementsDetails.findOne({
                attributes: ['build_list_id', 'is_series'],
                where: {
                    build_elements_details_id: req.body.build_elements_details_id
                }
            })

            // For Visible true or false
            if (getAllData.is_visible != undefined) {
                if (getAllData.is_visible == 1) {
                    await dbWriter.buildElementsDetails.update({
                        is_visible: 1
                    },
                        {
                            where: {
                                build_elements_details_id: req.body.build_elements_details_id
                            }
                        });
                }
                else if (getAllData.is_visible == 0) {
                    await dbWriter.buildElementsDetails.update({
                        is_visible: 0
                    },
                        {
                            where: {
                                build_elements_details_id: req.body.build_elements_details_id
                            }
                        });
                }

            }
            // For is_collapsed
            if (getAllData.is_collapsed != undefined) {
                if (getAllData.is_collapsed == 1) {
                    await dbWriter.buildElementsDetails.update({
                        is_collapsed: 1
                    },
                        {
                            where: {
                                build_elements_details_id: req.body.build_elements_details_id
                            }
                        });
                }
                else if (getAllData.is_collapsed == 0) {
                    await dbWriter.buildElementsDetails.update({
                        is_collapsed: 0
                    },
                        {
                            where: {
                                build_elements_details_id: req.body.build_elements_details_id
                            }
                        });
                }
            }

            // For delete
            if (req.body.is_delete && req.body.is_delete == 1) {
                await dbWriter.buildElementsDetails.update({
                    is_delete: 1
                },
                    {
                        where: {
                            build_elements_details_id: req.body.build_elements_details_id
                        }
                    });

                // Arranging The Sortable For Elements
                let getAllElements = await dbReader.buildElementsDetails.findAndCountAll({
                    where: {
                        build_list_id: findId.build_list_id,
                        is_series: findId.is_series,
                        is_delete: 0
                    },
                    order: [['sortable_order', 'ASC']]
                });

                // Arrange Sortable Order
                let tempObject = {};
                let tempArray = [];
                for (var i = 0; i < getAllElements.count; i++) {
                    tempObject = {
                        build_elements_details_id: getAllElements.rows[i].build_elements_details_id,
                        sortable_order: i
                    }

                    tempArray.push(tempObject);
                }
                // Updating sort order of all elements 
                let updateElementSortOrder = await dbWriter.buildElementsDetails.bulkCreate(tempArray, { updateOnDuplicate: ["sortable_order"] });


            }
            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token,
                data: findId.build_list_id
            }).send(res);

        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public updateMessageAndElements = async (req: Request, res: Response) => {

        try {
            // Getting user Id from bearer token
            const requestContent: any = req;
            let userId = requestContent.user_id;

            // validating type. wiether normal update or restore update
            if (req.body.type == 1) {
                // Normal Update
                let updateMessageBuild = await dbWriter.messageBuildList.update(req.body,
                    { where: { message_build_list_id: req.body.message_build_list_id } }
                );

                //  Changing the id of all data 
                for (var j = 0; j < req.body.element_details.length; j++) {
                    var temp = req.body.element_details[j]
                    let insertingBuildElementDetails = await dbWriter.buildElementsDetails.update(
                        temp,
                        {
                            where: {
                                build_elements_details_id: temp.build_elements_details_id
                            }
                        }
                    );

                }

                new SuccessResponse(EC.success, {
                    //@ts-ignore
                    token: req.token,
                    data: []
                }).send(res);
            }
            else if (req.body.type == 2) {
                // For restore update
                let getMessage = await dbReader.messageBuildList.findOne({
                    where: { message_build_list_id: req.body.message_build_list_id, is_deleted: 0 }
                });

                // Getting All Elements
                let getAllElements = await dbReader.buildElementsDetails.findAndCountAll({
                    where: { build_list_id: req.body.message_build_list_id, is_series: 0, is_delete: 0 }
                });

                var getMessageObject = {
                    user_id: getMessage.dataValues.user_id,
                    build_folder_id: getMessage.dataValues.build_folder_id,
                    build_title: getMessage.dataValues.build_title,
                    build_sub_title: getMessage.dataValues.build_sub_title,
                    is_default_build: getMessage.dataValues.is_default_build,
                    is_demo_build: getMessage.dataValues.is_demo_build,
                    media_url: getMessage.dataValues.media_url,
                    sortable_order: getMessage.dataValues.sortable_order,
                    build_type: getMessage.dataValues.build_type,
                    is_deleted: getMessage.dataValues.is_deleted,
                    created_datetime: getMessage.dataValues.created_datetime,
                    updated_datetime: getMessage.dataValues.updated_datetime,
                    is_added_by_code: getMessage.dataValues.is_added_by_code,
                    is_auto_saved: getMessage.dataValues.is_auto_saved
                }

                //Updating Messages 
                let updateMessage = await dbWriter.messageBuildList.update(getMessageObject,
                    { where: { message_build_list_id: getMessage.parent_id } }
                );

                // Deleting All Elements Of Current Message 
                let deleteElements = await dbWriter.buildElementsDetails.update({ is_delete: 1 },
                    { where: { build_list_id: getMessage.parent_id, is_series: 0 } }
                );

                // Inserting New Elements From Restore Messages
                let tempObject = {};
                let tempArray = [];
                for (var i = 0; i < getAllElements.count; i++) {
                    tempObject = {
                        build_list_id: getMessage.parent_id,
                        build_elements_id: getAllElements.rows[i].build_elements_id,
                        title: getAllElements.rows[i].title,
                        extra_title: getAllElements.rows[i].extra_title,
                        content: getAllElements.rows[i].content,
                        extra_content: getAllElements.rows[i].extra_content,
                        media_url: getAllElements.rows[i].media_url,
                        sortable_order: getAllElements.rows[i].sortable_order,
                        build_type: getAllElements.rows[i].build_type,
                        is_series: getAllElements.rows[i].is_series,
                        is_collapsed: getAllElements.rows[i].is_collapsed,
                        is_visible: getAllElements.rows[i].is_visible,
                        is_delete: getAllElements.rows[i].is_delete,
                        created_datetime: getAllElements.rows[i].created_datetime,
                        updated_datetime: getAllElements.rows[i].updated_datetime,
                    }
                    tempArray.push(tempObject);
                }
                let insertElements = await dbWriter.buildElementsDetails.bulkCreate(tempArray);

                new SuccessResponse(EC.success, {
                    //@ts-ignore
                    token: req.token,
                    data: []
                }).send(res);
            }


        }
        catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public listBuildElementsDetails = async (req: Request, res: Response) => {
        /*
            * Getting list of All buildElementsDetails  - 
             * Code done by Sm 
        */
        try {
            const requestContent: any = req;
            let userId = requestContent.user_id;

            let buildListId = req.body;
            if (buildListId.is_series == 1) {

                // getting sort order  of elements for arrainging sort order
                let getElementSortOrder = await dbReader.buildElementsDetails.count({
                    where: {
                        build_list_id: buildListId.id,
                        is_delete: 0,
                        is_series: 1,
                        sortable_order: 0
                    }
                });

                if (getElementSortOrder > 1) {
                    let buildController = new adminBuildController();
                    let arrangeSortOrder = await buildController.arrangeSortOrder(buildListId.id, 3);
                }


                // Checking user Id. If user id is same then we have to give all data.
                // If User Id is different then we have to give only visible data

                // AS PER MOBILE DEVELOPER REQUIREMENT
                let checkSeriesUser = await dbReader.seriesBuildList.findOne({
                    attributes: ['user_id'],
                    where: {
                        series_build_list_id: buildListId.id
                    }
                });
                if (checkSeriesUser) {
                    let getBuildElementsDetailsList;
                    getBuildElementsDetailsList = await dbReader.seriesBuildList.findOne({
                        attributes: [
                            'series_build_list_id', 'user_id', 'volume_id', 'series_buildlist_title', 'series_buildlist_content', 'media_url', 'sortable_order', 'hex_color', 'is_visible', 'is_deleted', 'created_datetime', 'updated_datetime', 'is_added_by_code',
                            [dbReader.Sequelize.literal('code'), 'code'],
                            [dbReader.Sequelize.literal('build_share_code_id'), 'code_id']
                        ],
                        where: {
                            is_deleted: 0,
                            series_build_list_id: buildListId.id,
                        },
                        include: [{
                            separate: true,
                            model: dbReader.buildElementsDetails,
                            include: [{
                                model: dbReader.buildElements,
                                attributes: []
                            }],
                            attributes: [
                                [dbReader.Sequelize.literal('`gb_build_elements`.`build_elements_id`'), 'build_elements_id'],
                                [dbReader.Sequelize.literal(`build_elements_name`), 'build_elements_name'],
                                [dbReader.Sequelize.literal(`hex_color`), 'hex_color'],
                                [dbReader.Sequelize.literal(`element_category`), 'element_category'],
                                [dbReader.Sequelize.literal(`element_type`), 'element_type'],
                                "build_elements_details_id", "build_list_id", "build_elements_id", "title", "extra_title", "content", "extra_content", ["media_url", "media_url"], "sortable_order", "build_type", "is_series", "is_collapsed", "is_visible", "is_delete", "extra_title_1", "extra_content_1"
                            ],
                            where: {
                                is_delete: 0,
                                is_series: 1
                            },
                            order: [['sortable_order', 'ASC']]
                        }, {
                            //required: false,
                            model: dbReader.shareCode,
                            where: {
                                share_content_type: 2
                            },
                            attributes: [],
                        }]
                    });

                    if (getBuildElementsDetailsList) {
                        getBuildElementsDetailsList = JSON.parse(JSON.stringify(getBuildElementsDetailsList));
                        if (getBuildElementsDetailsList.sycu_build_elements_details.length > 0) {
                            getBuildElementsDetailsList.sycu_build_elements_details.forEach((e: any) => {
                                e.content = e.content.replace(/\\'/g, "'");
                                e.title = e.title.replace(/\\'/g, "'");
                                e.extra_title = e.extra_title.replace(/\\'/g, "'");
                                e.extra_content = e.extra_content.replace(/\\'/g, "'");
                            });
                        }
                        new SuccessResponse(EC.success, {
                            //@ts-ignore
                            token: req.token,
                            count: 1,
                            data: getBuildElementsDetailsList
                        }).send(res);
                    }
                    else {
                        new SuccessResponse(EC.noDataFound, {}).send(res);
                    }
                }
                else {
                    new SuccessResponse(EC.noDataFound, {
                        //@ts-ignore
                        token: req.token,
                        count: 0,
                        data: []
                    }).send(res);
                }

            }
            else {

                // getting sort order  of elements for arrainging sort order
                let getElementSortOrder = await dbReader.buildElementsDetails.count({
                    where: {
                        build_list_id: buildListId.id,
                        is_delete: 0,
                        is_series: 0,
                        sortable_order: 0
                    }
                });

                if (getElementSortOrder > 1) {
                    let buildController = new adminBuildController();
                    let arrangeSortOrder = await buildController.arrangeSortOrder(buildListId.id, 1);
                }
                // Checking user Id. If user id is same then we have to give all data.
                // If User Id is different then we have to give only visible data

                // AS PER MOBILE DEVELOPER REQUIREMENT
                let checkMessageUser = await dbReader.messageBuildList.findOne({
                    attributes: ['user_id'],
                    where: {
                        message_build_list_id: buildListId.id
                    }
                });

                if (checkMessageUser) {
                    let getBuildElementsDetailsList;

                    getBuildElementsDetailsList = await dbReader.messageBuildList.findOne({
                        attributes: [
                            'message_build_list_id', 'user_id', 'build_folder_id', 'build_title', 'build_sub_title', 'is_default_build', 'is_demo_build', 'media_url', 'sortable_order', 'build_type', 'is_deleted', 'created_datetime', 'updated_datetime',
                            [dbReader.Sequelize.literal('code'), 'code'],
                            [dbReader.Sequelize.literal('build_share_code_id'), 'code_id']
                        ],
                        where: {
                            message_build_list_id: buildListId.id,
                            is_deleted: 0
                        },
                        include: [{
                            separate: true,
                            model: dbReader.buildElementsDetails,
                            include: [{
                                model: dbReader.buildElements,
                                attributes: []
                            }],
                            attributes: [
                                [dbReader.Sequelize.literal('`gb_build_elements`.`build_elements_id`'), 'build_elements_id'],
                                [dbReader.Sequelize.literal(`build_elements_name`), 'build_elements_name'],
                                [dbReader.Sequelize.literal(`hex_color`), 'hex_color'],
                                [dbReader.Sequelize.literal(`element_category`), 'element_category'],
                                [dbReader.Sequelize.literal(`element_type`), 'element_type'],
                                "build_elements_details_id", "build_list_id", "build_elements_id", "title", "extra_title", "content", "extra_content", ["media_url", "media_url"], "sortable_order", "build_type", "is_series", "is_collapsed", "is_visible", "is_delete", "extra_title_1", "extra_content_1"
                            ],
                            where: {
                                is_delete: 0,
                                is_series: 0,

                            },
                            order: [['sortable_order', 'ASC']]
                        }, {
                            model: dbReader.shareCode,
                            where: {
                                share_content_type: 1
                            },
                            attributes: [],
                        }]
                    });

                    if (getBuildElementsDetailsList) {
                        getBuildElementsDetailsList = JSON.parse(JSON.stringify(getBuildElementsDetailsList));
                        if (getBuildElementsDetailsList.sycu_build_elements_details.length > 0) {
                            getBuildElementsDetailsList.sycu_build_elements_details.forEach((e: any) => {
                                e.content = e.content.replace(/\\'/g, "'");
                                e.title = e.title.replace(/\\'/g, "'");
                                e.extra_title = e.extra_title.replace(/\\'/g, "'");
                                e.extra_content = e.extra_content.replace(/\\'/g, "'");
                            });
                        }
                        new SuccessResponse(EC.success, {
                            //@ts-ignore
                            token: req.token,
                            count: 1,
                            data: getBuildElementsDetailsList
                        }).send(res);
                    }
                    else {
                        new SuccessResponse(EC.noDataFound, {}).send(res);
                    }
                }
                else {
                    new SuccessResponse(EC.noDataFound, {
                        //@ts-ignore
                        token: req.token,
                        count: 0,
                        data: []
                    }).send(res);
                }
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public listBuildElements = async (req: Request, res: Response) => {
        try {
            // Getting user Id from bearer token
            const requestContent: any = req;
            let userId = requestContent.user_id;

            let getBuildElementsList = await dbReader.buildElements.findAndCountAll({
                where: {
                    element_category: {
                        [Op.in]: req.body.element_category
                    },
                    user_id: {
                        // 0 = system created buildelement and 1 = byUser created buildElement
                        [Op.in]: [0, userId]
                    },
                    is_deleted: 0
                },
                order: [['build_elements_id', 'ASC']]
            })
            if (getBuildElementsList.count > 0) {
                new SuccessResponse(EC.success, {
                    //@ts-ignore
                    token: req.token,
                    count: getBuildElementsList.count,
                    data: getBuildElementsList.rows
                }).send(res);
            }
            else {
                new SuccessResponse(EC.noDataFound, {}).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    //This api is for front-end developer
    // because they have different requirement
    // So this api is totally different from others

    public addMessageElementForWeb = async (req: Request, res: Response) => {
        try {
            // Getting user Id from bearer token
            const requestContent: any = req;
            let userId = requestContent.user_id;

            // Get all elements present in message
            // for arranging  sortable order
            let getAllElementMessage = await dbReader.buildElementsDetails.findAndCountAll({
                where: {
                    build_list_id: req.body.message_build_list_id,
                    is_series: 0,
                    is_delete: 0
                },
                order: [['sortable_order', 'ASC']]
            });

            let insertBuildElementDetails;

            //Checking For Big Idea And Bible 
            // big idea and bible are one data in database
            // we have to separate it here
            if (req.body.build_elements_id == 16) {

                insertBuildElementDetails = await dbWriter.buildElementsDetails.create({
                    build_list_id: req.body.message_build_list_id,
                    build_elements_id: req.body.build_elements_id,
                    title: 'BIG IDEA',
                    extra_title: 'BIBLE',
                    extra_title_1: "ABOUT THIS WEEK",
                    content: 'The big idea of your talk in 10 words or less.',
                    extra_content: 'The Scripture references you’re going to cover.',
                    extra_content_1: "About this week of your talk in 15 words or less.",
                    media_url: '',
                    sortable_order: req.body.destination,
                    build_type: 1,
                    is_series: 0,
                    is_collapsed: 0,
                    is_visible: 1,
                    is_delete: 0
                });
            }
            //Checking For Big Idea Legacy
            // It has fix content which we have to add
            else if (req.body.build_elements_id == 19) {
                insertBuildElementDetails = await dbWriter.buildElementsDetails.create({
                    build_list_id: req.body.message_build_list_id,
                    build_elements_id: req.body.build_elements_id,
                    title: 'BIG IDEA (LEGACY)',
                    extra_title: '',
                    content: 'The big idea of your talk in 15 words or less.',
                    extra_content: '',
                    media_url: '',
                    sortable_order: req.body.destination,
                    build_type: 1,
                    is_series: 0,
                    is_collapsed: 0,
                    is_visible: 1,
                    is_delete: 0
                });
            }
            else if (req.body.build_elements_id == 21) {
                insertBuildElementDetails = await dbWriter.buildElementsDetails.create({
                    build_list_id: req.body.message_build_list_id,
                    build_elements_id: req.body.build_elements_id,
                    title: 'ABOUT THIS WEEK',
                    extra_title: '',
                    content: 'About this week of your talk in 15 words or less.',
                    extra_content: '',
                    media_url: '',
                    sortable_order: req.body.destination,
                    build_type: 1,
                    is_series: 0,
                    is_collapsed: 0,
                    is_visible: 1,
                    is_delete: 0
                });
            }
            else {
                // Getting title from element details 
                let getElementDetail = await dbReader.buildElements.findOne({
                    where: {
                        build_elements_id: req.body.build_elements_id
                    }
                });

                // inserting new records on top with perfect sort order
                insertBuildElementDetails = await dbWriter.buildElementsDetails.create({
                    build_list_id: req.body.message_build_list_id,
                    build_elements_id: req.body.build_elements_id,
                    title: getElementDetail.dataValues.build_elements_name,
                    extra_title: "",
                    content: "",
                    extra_content: "",
                    media_url: "",
                    sortable_order: req.body.destination,
                    build_type: 1,
                    is_series: 0,
                    is_collapsed: 0,
                    is_visible: 1,
                    is_delete: 0
                });

            }

            let tempObject = {};
            let tempArray = [];

            for (var i = 0; i < getAllElementMessage.count; i++) {
                // Now changing the sort order of elements based on source
                // All elements are in ascending order so we can easily change the sort order
                if (getAllElementMessage.rows[i].sortable_order >= req.body.destination) {
                    tempObject = {
                        build_elements_details_id: getAllElementMessage.rows[i].build_elements_details_id,
                        sortable_order: getAllElementMessage.rows[i].sortable_order + 1
                    }
                    tempArray.push(tempObject);
                }
            }
            // Updating sort order of all elements 
            let updateElementSortOrder = await dbWriter.buildElementsDetails.bulkCreate(
                tempArray,
                { updateOnDuplicate: ["sortable_order"] }
            );

            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token,
                data: insertBuildElementDetails
            }).send(res);


        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    //Api for Mobile update sortorder
    public saveElementsSortOrder = async (req: Request, res: Response) => {
        try {
            // Getting user Id from bearer token
            const requestContent: any = req;
            let userId = requestContent.user_id;

            var element = req.body.elements;
            // For web developers
            if (req.body.sort_order_type && req.body.sort_order_type == 'single') {
                let getAllElementSortOrder;
                if (req.body.type && req.body.type == 1) {
                    // For Series
                    getAllElementSortOrder = await dbReader.seriesBuildList.findOne({
                        attributes: ['series_build_list_id'],
                        include: [{
                            model: dbReader.buildElementsDetails,
                            where: {
                                is_series: 1,
                                is_delete: 0
                            },
                            order: [['sortable_order', 'ASC']]
                        }],
                        where: {
                            series_build_list_id: req.body.id,
                            is_deleted: 0
                        }
                    });
                }
                else {
                    // For Message
                    // Getting All Data In form 
                    getAllElementSortOrder = await dbReader.messageBuildList.findOne({
                        attributes: ['message_build_list_id'],
                        include: [{
                            model: dbReader.buildElementsDetails,
                            where: {
                                is_series: 0,
                                is_delete: 0
                            },
                            order: [['sortable_order', 'ASC']]
                        }],
                        where: {
                            message_build_list_id: req.body.id,
                            is_deleted: 0
                        }
                    });
                }
                // from request body we will get source and destination
                // source = from the position were i picked element
                // destination = were i drop element
                if (getAllElementSortOrder) {
                    let tempObject = {};
                    let tempArray = [];

                    tempObject = {
                        build_elements_details_id: req.body.build_elements_details_id,
                        sortable_order: req.body.destination
                    }

                    tempArray.push(tempObject);

                    for (var i = 0; i < getAllElementSortOrder.sycu_build_elements_details.length; i++) {
                        // Now changing the sort order of elements based on source
                        // All elements are in ascending order so we can easily change the sort order
                        if (getAllElementSortOrder.sycu_build_elements_details[i].sortable_order < req.body.source) {
                            // Sort table order is less than source than +1
                            if (getAllElementSortOrder.sycu_build_elements_details[i].sortable_order >= req.body.destination) {
                                if (getAllElementSortOrder.sycu_build_elements_details[i].build_elements_details_id != req.body.build_elements_details_id) {
                                    tempObject = {
                                        build_elements_details_id: getAllElementSortOrder.sycu_build_elements_details[i].build_elements_details_id,
                                        sortable_order: getAllElementSortOrder.sycu_build_elements_details[i].sortable_order + 1
                                    };
                                    tempArray.push(tempObject);
                                }
                            }
                        }
                        else {
                            if (getAllElementSortOrder.sycu_build_elements_details[i].sortable_order <= req.body.destination) {
                                // Sort table order is greater than source than -1
                                if (getAllElementSortOrder.sycu_build_elements_details[i].build_elements_details_id != req.body.build_elements_details_id) {
                                    tempObject = {
                                        build_elements_details_id: getAllElementSortOrder.sycu_build_elements_details[i].build_elements_details_id,
                                        sortable_order: getAllElementSortOrder.sycu_build_elements_details[i].sortable_order - 1
                                    };
                                    tempArray.push(tempObject);
                                }
                            }
                        }

                    }
                    // Updating sort order of all elements 
                    let updateElementSortOrder = await dbWriter.buildElementsDetails.bulkCreate(
                        tempArray,
                        { updateOnDuplicate: ["sortable_order"] }
                    );

                    new SuccessResponse(EC.elementSorted, {
                        //@ts-ignore
                        token: req.token,
                        data: []
                    }).send(res);
                }
                else {
                    new SuccessResponse(EC.noDataFound, {
                        //@ts-ignore
                        token: req.token,
                        data: []
                    }).send(res);
                }
            }
            // For mobile developers
            else {
                for (var i = 0; i < element.length; i++) {
                    let updateMessageSortable = await dbWriter.buildElementsDetails.update(
                        { sortable_order: element[i].sortable_order },
                        {
                            where: {
                                build_elements_details_id: element[i].build_elements_details_id
                            }
                        }
                    );
                }
                new SuccessResponse(EC.elementSorted, {
                    //@ts-ignore
                    token: req.token,
                    data: []
                }).send(res);
            }

        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
    public validateVideoURL = async (req: Request, res: Response) => {
        try {
            let url = req.body.url;
            let yt = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
            let dm = /^(?:(?:https?):)?(?:\/\/)?(?:www\.)?(?:(?:dailymotion\.com(?:\/embed)?\/video)|dai\.ly)\/([a-zA-Z0-9]+)(?:_[\w_-]+)?$/;
            let vi = /(http|https)?:\/\/(www\.|player\.)?vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|video\/|)(\d+)(?:|\/\?)/
            let td = /^(?:(?:https?):)?(?:\/\/)?(?:www\.)?(?:(?:ted\.com(?:\/talks)?\/talks))\/([a-zA-Z0-9&=_\.-a-zA-Z0-9]+)(?:_[\w_-]+)?$/

            if (url.match(yt)) {
                //return url.match(p)[1];
                new SuccessResponse(EC.validVideoURL, {
                    //@ts-ignore
                    token: req.token,
                    flag: true
                }).send(res);
            } else if (url.match(dm)) {
                new SuccessResponse(EC.validVideoURL, {
                    //@ts-ignore
                    token: req.token,
                    flag: true
                }).send(res);
            } else if (url.match(vi)) {
                new SuccessResponse(EC.validVideoURL, {
                    //@ts-ignore
                    token: req.token,
                    flag: true
                }).send(res);
            } else if (url.match(td)) {
                new SuccessResponse(EC.validVideoURL, {
                    //@ts-ignore
                    token: req.token,
                    flag: true
                }).send(res);
            }
            else {
                new SuccessResponse(EC.validVideoURL, {
                    //@ts-ignore
                    token: req.token,
                    flag: false
                }).send(res);
            }

        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public getSeriesElementDetailsBySeriesId = async (req: Request, res: Response) => {
        try {
            const requestContent: any = req;
            let userId = requestContent.user_id;

            let getBuildElementDetails = await dbReader.seriesBuildList.findOne({
                attributes: ['series_build_list_id', 'volume_id', 'series_buildlist_title', 'series_buildlist_content', 'media_url'],
                include: [{
                    separate: true,
                    attributes: [
                        [dbReader.Sequelize.literal('build_elements_name'), 'element_name'],
                        'build_elements_details_id', 'build_elements_id', 'title', 'content', 'media_url', 'sortable_order', 'build_type', 'is_series', 'is_collapsed',
                        'is_visible', 'is_delete', 'created_datetime', 'updated_datetime'
                    ],
                    model: dbReader.buildElementsDetails,
                    include: [{
                        model: dbReader.buildElements,
                        attributes: []
                    }],
                    where: {
                        is_series: 1,
                        is_delete: 0
                    },
                    order: [['sortable_order', 'ASC']]
                }],
                where: {
                    series_build_list_id: req.body.series_build_list_id
                }
            });
            getBuildElementDetails = JSON.parse(JSON.stringify(getBuildElementDetails));
            if (getBuildElementDetails) {
                new SuccessResponse(EC.success, {
                    //@ts-ignore
                    token: req.token,
                    ...getBuildElementDetails
                }).send(res);
            }
            else {
                new SuccessResponse(EC.noDataFound, {
                    //@ts-ignore
                    token: req.token,
                    count: 0
                }).send(res);
                // ApiError.handle(new BadRequestError(EC.noDataFound), res);
            }
        }
        catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
    public addUpdateSeriesElement = async (req: Request, res: Response) => {
        try {
            // Getting user Id from bearer token
            const requestContent: any = req;
            let userId = requestContent.user_id;

            if (req.body.build_elements_details_id && req.body.build_elements_details_id != 0) {
                req.body.updated_datetime = new Date();
                let UpdateElement = await dbWriter.buildElementsDetails.update(
                    {
                        title: req.body.title,
                        content: req.body.content
                    },
                    {
                        where: {
                            build_elements_details_id: req.body.build_elements_details_id
                        }
                    }
                );

                new SuccessResponse(EC.seriesElement, {
                    //@ts-ignore
                    token: req.token
                }).send(res);
            }
            else {

                let getAllElementsInSeries = await dbReader.buildElementsDetails.findAndCountAll({
                    where: {
                        build_list_id: req.body.build_list_id,
                        is_series: 1,
                        is_delete: 0
                    }
                });

                let insertBuildElementDetails = await dbWriter.buildElementsDetails.create({
                    build_list_id: req.body.build_list_id,
                    build_elements_id: 19,
                    title: req.body.title,
                    extra_title: "",
                    content: req.body.content,
                    extra_content: "",
                    media_url: "",
                    sortable_order: getAllElementsInSeries.count,
                    build_type: 1,
                    is_series: 1,
                    is_collapsed: 0,
                    is_visible: 1
                })
                insertBuildElementDetails = JSON.parse(JSON.stringify(insertBuildElementDetails));
                new SuccessResponse(EC.seriesElement, {
                    //@ts-ignore
                    token: req.token,
                    ...insertBuildElementDetails
                }).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
    public addUpdateSeriesBuildList = async (req: Request, res: Response) => {
        try {
            const requestContent: any = req;
            let userId = requestContent.user_id;

            if (req.body.series_build_list_id && req.body.series_build_list_id != 0) {
                req.body.updated_datetime = new Date();
                let UpdateMessageBuildList = await dbWriter.seriesBuildList.update(
                    req.body,
                    {
                        where: {
                            series_build_list_id: req.body.series_build_list_id,
                        }
                    }
                );

                new SuccessResponse(EC.success, {
                    //@ts-ignore
                    token: req.token
                }).send(res);
            }
            else {

                let volumeData = await dbReader.seriesBuildList.findAndCountAll({
                    where: {
                        volume_id: req.body.volume_id,
                        is_deleted: 0
                    }
                });

                let createSeries = await dbWriter.seriesBuildList.create({
                    user_id: userId,
                    volume_id: req.body.volume_id,
                    series_buildlist_title: "NEW SERIES",
                    series_buildlist_content: "",
                    media_url: "",
                    sortable_order: volumeData.count,
                    hex_color: "",
                    is_visible: 1,
                    is_deleted: 0
                });

                // Checking wether the generated code is already available or not in database.
                // To avoid duplication
                // if we get the record in database then again code will be generated
                // and checked in database

                var checkLoop = 1;
                while (checkLoop != 0) {

                    let result = RandomString(4);
                    let publicCode = RandomString(12);

                    var getShareCode = await dbReader.shareCode.findOne({
                        where: {
                            code: result,
                            is_deleted: 0
                        }
                    });

                    if (getShareCode) {
                        // Nothing to do.
                        // just wait for another code generate
                    }
                    else {
                        await dbWriter.shareCode.create({
                            user_id: userId,
                            share_content_id: createSeries.series_build_list_id,
                            share_content_type: 2,
                            code: result,
                            public_code: publicCode
                        });
                        checkLoop = 0;
                    }
                }

                //finding the id's of static data. talk,big idea and bible
                var elementData = ['Weekly Conversation']
                var getStaticData = await dbReader.buildElements.findOne({
                    where: {
                        build_elements_name: {
                            [Op.in]: elementData
                        }
                    }
                });


                let insertObject = {};
                insertObject = {
                    build_list_id: createSeries.series_build_list_id,
                    build_elements_id: getStaticData.build_elements_id,
                    title: getStaticData.build_elements_name,
                    extra_title: '',
                    content: '',
                    extra_content: '',
                    media_url: '',
                    sortable_order: 0,
                    build_type: 1,
                    is_series: 1,
                    is_collapsed: 0,
                    is_visible: 1,
                    is_delete: 0
                }

                let insertBuildElementDetails = await dbWriter.buildElementsDetails.create(
                    insertObject
                );

                createSeries = JSON.parse(JSON.stringify(createSeries));
                new SuccessResponse(EC.success, {
                    //@ts-ignore
                    token: req.token,
                    ...createSeries
                }).send(res);

            }

        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public createDuplicateSeries = async (req: Request, res: Response) => {
        try {
            const requestContent: any = req;
            let userId = requestContent.user_id;

            let seriesData = await dbReader.seriesBuildList.findOne({
                where: {
                    series_build_list_id: req.body.series_build_list_id,
                    user_id: userId,
                    is_deleted: 0
                }

            });

            // For Sorting
            let volumeData = await dbReader.seriesBuildList.findAndCountAll({
                where: {
                    volume_id: seriesData.volume_id,
                    user_id: userId,
                    is_deleted: 0
                }
            });
            if (seriesData) {
                let createDuplicateSeries = await dbWriter.seriesBuildList.create({
                    user_id: userId,
                    volume_id: seriesData.volume_id,
                    series_buildlist_title: seriesData.series_buildlist_title,
                    series_buildlist_content: seriesData.series_buildlist_content,
                    media_url: seriesData.media_url,
                    sortable_order: volumeData.count,
                    hex_color: seriesData.hex_color,
                    is_visible: seriesData.is_visible,
                    is_deleted: seriesData.is_deleted
                });

                // Checking wether the generated code is already available or not in database.
                // To avoid duplication
                // if we get the record in database then again code will be generated
                // and checked in database
                var checkLoop = 1;
                while (checkLoop != 0) {

                    let result = RandomString(4);
                    let publicCode = RandomString(12);

                    var getShareCode = await dbReader.shareCode.findOne({
                        where: {
                            code: result,
                            is_deleted: 0
                        }
                    });

                    if (getShareCode) {
                        // Nothing to do.
                        // just wait for another code generate
                    }
                    else {
                        let insertCodeForSeries = await dbWriter.shareCode.create({
                            user_id: createDuplicateSeries.user_id,
                            share_content_id: createDuplicateSeries.series_build_list_id,
                            share_content_type: 2,
                            code: result,
                            public_code: publicCode
                        });
                        createDuplicateSeries = JSON.parse(JSON.stringify(createDuplicateSeries));

                        createDuplicateSeries.code = insertCodeForSeries.code;
                        createDuplicateSeries.code_id = insertCodeForSeries.build_share_code_id;


                        checkLoop = 0;
                    }
                }

                // Creating Element of that series
                let getElementDetails = await dbReader.buildElementsDetails.findAndCountAll({
                    where: {
                        build_list_id: seriesData.series_build_list_id,
                        is_series: 1,
                        is_delete: 0
                    }
                });

                // Creating new elements in a new series 
                var tempObject = {};
                var tempArray = [];

                for (var i = 0; i < getElementDetails.count; i++) {
                    tempObject = {
                        build_list_id: createDuplicateSeries.series_build_list_id,
                        build_elements_id: getElementDetails.rows[i].build_elements_id,
                        title: getElementDetails.rows[i].title,
                        extra_title: getElementDetails.rows[i].extra_title,
                        content: getElementDetails.rows[i].content,
                        extra_content: getElementDetails.rows[i].extra_content,
                        media_url: getElementDetails.rows[i].media_url,
                        sortable_order: getElementDetails.rows[i].sortable_order,
                        build_type: getElementDetails.rows[i].build_type,
                        is_series: getElementDetails.rows[i].is_series,
                        is_collapsed: getElementDetails.rows[i].is_collapsed,
                        is_visible: getElementDetails.rows[i].is_visible,
                        is_delete: getElementDetails.rows[i].is_delete
                    }
                    tempArray.push(tempObject);
                }

                let insertElementDetails = await dbWriter.buildElementsDetails.bulkCreate(tempArray);

                createDuplicateSeries = JSON.parse(JSON.stringify(createDuplicateSeries));
                new SuccessResponse(EC.duplicateSeries, {
                    //@ts-ignore
                    token: req.token,
                    ...createDuplicateSeries
                }).send(res);
            } else {
                new SuccessResponse(EC.noDataFound, {
                    //@ts-ignore
                    token: req.token,
                    count: 0
                }).send(res)
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public updateSeriesBuildList = async (req: Request, res: Response) => {
        try {
            const requestContent: any = req;
            let userId = requestContent.user_id;
            let getAllData = JSON.parse(JSON.stringify(req.body));
            // For delete
            if (req.body.is_deleted && req.body.is_deleted == 1) {
                //Getting Volume of particular series 
                let getVolumeOfSeries = await dbReader.seriesBuildList.findOne({
                    attributes: ['volume_id'],
                    where: { series_build_list_id: req.body.series_build_list_id }
                });
                await dbWriter.seriesBuildList.update({ is_deleted: 1 }, {
                    where: { series_build_list_id: req.body.series_build_list_id }
                });
                // now deleting the reference of Series from notes if available
                let deleteMessageNotes = await dbWriter.notesModel.update({ is_deleted: 1 },
                    { where: { type_id: req.body.series_build_list_id, type: 1 } }
                );
                // Removing the reference of added code
                let deleteMessageCode = await dbWriter.addedCodes.update({ is_deleted: 1 },
                    { where: { build_id: req.body.series_build_list_id, build_type: 1 } }
                );
                // Now Deleting Code Of that message So we can re use again
                let deleteSeriesCode = await dbWriter.shareCode.update({ is_deleted: 1 },
                    { where: { share_content_id: req.body.series_build_list_id, share_content_type: 2 } }
                );
                // Updating Sort Order Of All Series
                let getAllSeries = await dbReader.seriesBuildList.findAndCountAll({
                    where: { volume_id: getVolumeOfSeries.volume_id, is_deleted: 0 },
                    order: [['sortable_order', 'ASC']]
                });
                let tempObject = {};
                let tempArray = [];
                for (var i = 0; i < getAllSeries.count; i++) {
                    tempObject = {
                        series_build_list_id: getAllSeries.rows[i].series_build_list_id,
                        sortable_order: i
                    }
                    tempArray.push(tempObject);
                }
                // Updating sort order of all series 
                let updateSeriesSortOrder = await dbWriter.seriesBuildList.bulkCreate(tempArray, { updateOnDuplicate: ["sortable_order"] });
            }
            // For Visible true or false
            if (getAllData.is_visible != undefined) {
                if (getAllData.is_visible == 1) {
                    await dbWriter.seriesBuildList.update({
                        is_visible: 1
                    }, {
                        where: {
                            series_build_list_id: req.body.series_build_list_id
                        }
                    });
                }
                else if (getAllData.is_visible == 0) {
                    await dbWriter.seriesBuildList.update({
                        is_visible: 0
                    },
                        {
                            where: {
                                series_build_list_id: req.body.series_build_list_id
                            }
                        });
                }
            }
            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token,
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public addSeriesBuildList = async (req: Request, res: Response) => {
        try {
            const requestContent: any = req;
            let userId = requestContent.user_id;
            let volumeData = await dbReader.seriesBuildList.findAndCountAll({
                where: {
                    volume_id: req.body.volume_id,
                    user_id: userId,
                    is_deleted: 0
                }
            });

            let createSeries = await dbWriter.seriesBuildList.create({
                user_id: userId,
                volume_id: req.body.volume_id,
                series_buildlist_title: "NEW SERIES",
                series_buildlist_content: "",
                media_url: "",
                sortable_order: volumeData.count,
                hex_color: "",
                is_visible: 1,
                is_deleted: 0
            });

            // Checking wether the generated code is already available or not in database.
            // To avoid duplication
            // if we get the record in database then again code will be generated
            // and checked in database

            var checkLoop = 1;
            while (checkLoop != 0) {

                let result = RandomString(4);
                let publicCode = RandomString(12);

                var getShareCode = await dbReader.shareCode.findOne({
                    where: {
                        code: result,
                        is_deleted: 0
                    }
                });

                if (getShareCode) {
                    // Nothing to do.
                    // just wait for another code generate
                }
                else {
                    await dbWriter.shareCode.create({
                        user_id: userId,
                        share_content_id: createSeries.series_build_list_id,
                        share_content_type: 2,
                        code: result,
                        public_code: publicCode
                    });
                    checkLoop = 0;
                }
            }
            createSeries = JSON.parse(JSON.stringify(createSeries));
            new SuccessResponse(EC.success, {
                //@ts-ignore
                token: req.token,
                ...createSeries
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public saveSeriesSortOrder = async (req: Request, res: Response) => {
        try {
            // Getting user Id from bearer token
            const requestContent: any = req;
            let userId = requestContent.user_id;

            if (req.body.sort_order_type && req.body.sort_order_type == 'single') {

                // Getting All Data In form 
                let getAllElementSortOrder = await dbReader.volumeModel.findOne({
                    attributes: ['volume_id'],
                    include: [{
                        model: dbReader.seriesBuildList,
                        where: {
                            is_deleted: 0
                        },
                        order: [['sortable_order', 'ASC']]
                    }],
                    where: {
                        volume_id: req.body.volume_id,
                        is_deleted: 0
                    }
                });

                if (getAllElementSortOrder) {
                    // from request body we will get source and destination
                    // source = from the position were i picked element
                    // destination = were i drop element
                    let tempObject = {};
                    let tempArray = [];

                    tempObject = {
                        series_build_list_id: req.body.series_build_list_id,
                        sortable_order: req.body.destination
                    }

                    tempArray.push(tempObject);

                    for (var i = 0; i < getAllElementSortOrder.gb_series_buildlists.length; i++) {
                        // Now changing the sort order of elements based on source
                        // All elements are in ascending order so we can easily change the sort order
                        if (getAllElementSortOrder.gb_series_buildlists[i].sortable_order < req.body.source) {
                            if (getAllElementSortOrder.gb_series_buildlists[i].sortable_order >= req.body.destination) {
                                if (getAllElementSortOrder.gb_series_buildlists[i].series_build_list_id != req.body.series_build_list_id) {
                                    tempObject = {
                                        series_build_list_id: getAllElementSortOrder.gb_series_buildlists[i].series_build_list_id,
                                        sortable_order: getAllElementSortOrder.gb_series_buildlists[i].sortable_order + 1
                                    }
                                    tempArray.push(tempObject);
                                }
                            }
                        }
                        else {
                            if (getAllElementSortOrder.gb_series_buildlists[i].sortable_order <= req.body.destination) {
                                // Sort table order is greater than source than -1
                                if (getAllElementSortOrder.gb_series_buildlists[i].series_build_list_id != req.body.series_build_list_id) {
                                    tempObject = {
                                        series_build_list_id: getAllElementSortOrder.gb_series_buildlists[i].series_build_list_id,
                                        sortable_order: getAllElementSortOrder.gb_series_buildlists[i].sortable_order - 1
                                    };
                                    tempArray.push(tempObject);
                                }
                            }
                        }
                    }
                    // Updating sort order of all elements 
                    let updateSeriesSortOrder = await dbWriter.seriesBuildList.bulkCreate(
                        tempArray,
                        { updateOnDuplicate: ["sortable_order"] }
                    );
                    new SuccessResponse(EC.seriesSort, {
                        //@ts-ignore
                        token: req.token
                    }).send(res);
                }
                else {
                    new SuccessResponse(EC.noDataFound, {
                        //@ts-ignore
                        token: req.token
                    }).send(res);
                }

            }
            else {
                var element = req.body.series;
                for (var i = 0; i < element.length; i++) {
                    let updateMessageSortable = await dbWriter.seriesBuildList.update(
                        { sortable_order: element[i].sortable_order },
                        {
                            where: {
                                series_build_list_id: element[i].series_build_list_id
                            }
                        }
                    );
                }
                new SuccessResponse(EC.success, {
                    //@ts-ignore
                    token: req.token
                }).send(res);

            }


        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public createUpdateVolumeForMobile = async (req: Request, res: Response) => {
        try {
            // Getting user Id from bearer token
            const requestContent: any = req;
            let userId = requestContent.user_id;

            // Inserting Record in volume table 
            if (req.body.volume_id && req.body.volume_id != 0) {
                let UpdateVolumeList = await dbWriter.volumeModel.update(
                    { volume_title: req.body.volume_title },
                    {
                        where: {
                            volume_id: req.body.volume_id
                        }
                    }
                );

                let getInsertedData = await dbReader.volumeModel.findOne({
                    where: {
                        volume_id: req.body.volume_id,
                        user_id: userId
                    }
                });
                getInsertedData = JSON.parse(JSON.stringify(getInsertedData));
                new SuccessResponse(EC.volumeCU, {
                    //@ts-ignore
                    token: req.token,
                    ...getInsertedData
                }).send(res);
            }
            else {
                // Inserting data
                let insertVolume = await dbWriter.volumeModel.create({
                    user_id: userId,
                    build_folder_id: req.body.build_folder_id,
                    volume_title: req.body.volume_title,
                    is_system: 0,
                    is_deleted: 0
                });
                // Updating Parent_ID 
                let updateVolume = await dbWriter.volumeModel.update({ parent_id: insertVolume.volume_id },
                    { where: { volume_id: insertVolume.volume_id } }
                );
                // Checking wether the generated code is already available or not in database.
                // To avoid duplication
                // if we get the record in database then again code will be generated
                // and checked in database
                var checkLoop = 1;
                while (checkLoop != 0) {

                    let result = RandomString(4);
                    let publicCode = RandomString(12);

                    var getShareCode = await dbReader.shareCode.findOne({
                        where: {
                            code: result,
                            is_deleted: 0
                        }
                    });

                    if (!getShareCode) {
                        await dbWriter.shareCode.create({
                            user_id: insertVolume.user_id,
                            share_content_id: insertVolume.volume_id,
                            share_content_type: 3,
                            code: result,
                            public_code: publicCode,
                        });
                        checkLoop = 0;
                    }

                }
                if (insertVolume) {
                    insertVolume = JSON.parse(JSON.stringify(insertVolume));
                    new SuccessResponse(EC.success, {
                        //@ts-ignore
                        token: req.token,
                        ...insertVolume
                    }).send(res);
                }
                else {
                    new SuccessResponse(EC.noDataFound, {
                        //@ts-ignore
                        token: req.token
                    }).send(res);
                }
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
    public addUpdateSeriesForMobile = async (req: Request, res: Response) => {
        try {
            // Getting user Id from bearer token
            const requestContent: any = req;
            let userId = requestContent.user_id;

            if (req.body.series_build_list_id && req.body.series_build_list_id != 0) {
                req.body.updated_datetime = new Date();
                let UpdateMessageBuildList = await dbWriter.seriesBuildList.update(
                    req.body,
                    {
                        where: {
                            series_build_list_id: req.body.series_build_list_id
                        }
                    }
                );
                let result = await dbReader.seriesBuildList.findOne({
                    attributes: [
                        'series_build_list_id', 'series_buildlist_title', 'series_buildlist_content', 'user_id', 'volume_id', 'media_url', 'sortable_order', 'hex_color', 'is_visible', 'is_deleted', 'created_datetime', 'updated_datetime', 'is_added_by_code',
                        [dbReader.Sequelize.literal('code'), 'code'],
                        [dbReader.Sequelize.literal('build_share_code_id'), 'code_id']
                    ],
                    include: [{
                        model: dbReader.shareCode,
                        where: {
                            share_content_type: 2,
                            is_deleted: 0
                        },
                        attributes: []
                    }],
                    where: {
                        series_build_list_id: req.body.series_build_list_id,
                        user_id: userId
                    }
                })
                result = JSON.parse(JSON.stringify(result));
                new SuccessResponse(EC.seriesCU, {
                    //@ts-ignore
                    token: req.token,
                    ...result
                }).send(res);
            }
            else {
                let volumeData = await dbReader.seriesBuildList.findAndCountAll({
                    where: {
                        volume_id: req.body.volume_id,
                        user_id: userId,
                        is_deleted: 0
                    }
                });
                let cnt = 0;
                if (volumeData) {
                    cnt = volumeData.count;
                }
                let createSeries = await dbWriter.seriesBuildList.create({
                    user_id: userId,
                    volume_id: req.body.volume_id,
                    series_buildlist_title: req.body.series_buildlist_title,
                    series_buildlist_content: req.body.series_buildlist_content,
                    media_url: req.body.media_url,
                    sortable_order: cnt,
                    hex_color: "",
                    is_visible: 1,
                    is_deleted: 0
                })

                // Checking wether the generated code is already available or not in database.
                // To avoid duplication
                // if we get the record in database then again code will be generated
                // and checked in database

                var checkLoop = 1;
                while (checkLoop != 0) {

                    let result = RandomString(4);
                    let publicCode = RandomString(12);

                    var getShareCode = await dbReader.shareCode.findOne({
                        where: {
                            code: result,
                            is_deleted: 0
                        }
                    });

                    if (getShareCode) {
                        // Nothing to do.
                        // just wait for another code generate
                    }
                    else {
                        await dbWriter.shareCode.create({
                            user_id: userId,
                            share_content_id: createSeries.series_build_list_id,
                            share_content_type: 2,
                            code: result,
                            public_code: publicCode
                        });
                        checkLoop = 0;
                    }
                }
                createSeries = JSON.parse(JSON.stringify(createSeries));
                if (createSeries) {
                    new SuccessResponse(EC.success, {
                        //@ts-ignore
                        token: req.token,
                        ...createSeries
                    }).send(res);
                }
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    // this function is to arrange the sortable order of the data
    // which we migrated because that data are not sorted properly

    public arrangeSortOrder = async (id: number = 0, type: number = 0) => {
        try {
            // type = 1 for message elements, 2 for volume series, 3 for series elements
            let elementsData;
            if (type == 1) {
                elementsData = await dbReader.buildElementsDetails.findAndCountAll({
                    atributes: ['build_elements_details_id', 'build_list_id', 'sortable_order'],
                    where: {
                        build_list_id: id,
                        is_delete: 0,
                        is_series: 0
                    },
                    order: [['build_elements_details_id', 'ASC']]
                });
                if (elementsData.count > 0) {
                    elementsData = JSON.parse(JSON.stringify(elementsData));
                    let arrayData = [];
                    for (var i = 0; i < elementsData.count; i++) {
                        arrayData.push({
                            build_elements_details_id: elementsData.rows[i].build_elements_details_id,
                            sortable_order: i
                        });

                    }
                    let updateElements = await dbWriter.buildElementsDetails.bulkCreate(
                        arrayData,
                        { updateOnDuplicate: ["sortable_order"] }
                    );
                }
            }
            else if (type == 2) {
                elementsData = await dbReader.seriesBuildList.findAndCountAll({
                    atributes: ['series_build_list_id', 'sortable_order'],
                    where: {
                        volume_id: id,
                        is_deleted: 0
                    },
                    order: [['series_build_list_id', 'ASC']]
                });
                if (elementsData.count > 0) {
                    elementsData = JSON.parse(JSON.stringify(elementsData));
                    let arrayData = [];
                    for (var i = 0; i < elementsData.count; i++) {
                        arrayData.push({
                            series_build_list_id: elementsData[i].series_build_list_id,
                            sortable_order: i
                        });

                    }
                    let updateSeries = await dbWriter.seriesBuildList.bulkCreate(
                        arrayData,
                        { updateOnDuplicate: ["sortable_order"] }
                    );
                }
            }
            else if (type == 3) {
                elementsData = await dbReader.buildElementsDetails.findAndCountAll({
                    atributes: ['build_elements_details_id', 'build_list_id', 'sortable_order'],
                    where: {
                        build_list_id: id,
                        is_delete: 0,
                        is_series: 1
                    },
                    order: [['build_elements_details_id', 'ASC']]
                });
                if (elementsData.count > 0) {
                    elementsData = JSON.parse(JSON.stringify(elementsData));
                    let arrayData = [];
                    for (var i = 0; i < elementsData.count; i++) {
                        arrayData.push({
                            build_elements_details_id: elementsData.rows[i].build_elements_details_id,
                            sortable_order: i
                        });

                    }
                    let updateElements = await dbWriter.buildElementsDetails.bulkCreate(
                        arrayData,
                        { updateOnDuplicate: ["sortable_order"] }
                    );
                }
            }

            return elementsData;


        } catch (e: any) {
            //  ApiError.handle(new BadRequestError(e.message), res);
            return e;
        }
    }

}