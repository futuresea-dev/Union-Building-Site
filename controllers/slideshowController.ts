import { Request, Response } from "express";
import { ErrorController } from "../core/ErrorController";
import { SuccessResponse } from '../core/ApiResponse';
const axios = require('axios');
import { BadRequestError, ApiError, AuthFailureError } from '../core/ApiError';
import { getDefaultSlideContent } from '../helpers/helpers';
import _ from "lodash";
const { dbReader, dbWriter } = require('../models/dbConfig');
const { Op } = dbReader.Sequelize;

let url = 'https://generator.slidr.stuffyoucanuse.dev/api/generateSlideImages';

const EC = new ErrorController();

export class slideshowController {

    /**
     * getSlideshowsBySeries
     */
    public async getSlideshowsBySeries(req: Request, res: Response) {
        try {
             //@ts-ignore
             let { user_id } = req
             let userData = await dbReader.users.findOne({
                where: { user_id: user_id},
                attributes: ["user_role"]
            })
            userData = JSON.parse(JSON.stringify(userData));

            if(userData.user_role === 1 || 2 ) { 

                let { series_id } = req.params
    
                let findSlideshow = await dbReader.slideShows.findAll({
                    where: {
                        category_id: series_id,
                        is_deleted: 0,
                        week_number: { [dbReader.Sequelize.Op.ne]: 0 }
                    },
                    include: [{
                        model: dbReader.slides,
                        where: { is_deleted: 0 },
                        required: false,
                        limit: 1,
                        attributes: ["content"]
                    }, {
                        model: dbReader.slideshowSetting,
                        where: { is_deleted: 0 },
                        required: false,
                    }]
                })
                let findRecommendedFont = await dbReader.categories.findOne({
                    where: {category_id:series_id,is_deleted:0},
                    attributes: ["recommended_fonts"]
                })
                new SuccessResponse(EC.listOfData, {
                    slideShows: findSlideshow,
                    recommendedFont: JSON.parse(findRecommendedFont.recommended_fonts)
                }).send(res);
            } else {
                ApiError.handle(new AuthFailureError(EC.unauthorizedError), res);
            }

        } catch (error: any) {
            ApiError.handle(new BadRequestError(error.message), res);
        }
    }

    /**
     * createMinistrySlideshow
     */
    public async createSlideshowBySeries(req: Request, res: Response) {
        try {
            //@ts-ignore
            let { user_id } = req
            let userData = await dbReader.users.findOne({
                where: { user_id: user_id},
                attributes: ["user_role"]
            })
            userData = JSON.parse(JSON.stringify(userData));
            if(userData.user_role === 1 || 2 ) { 

                let { series_id, ministry_type, ministry_sub_type, week_number } = req.body
    
                let createSlideshow = await dbWriter.slideShows.create(
                    {
                        category_id: series_id,
                        ministry_sub_type: ministry_sub_type,
                        ministry_type: ministry_type,
                        week_number: week_number,
                        is_system: 1,
                        user_id: user_id
                    }
                );
    
                const CreateSlide = await dbWriter.slides.create({
                    content: '',
                    slideshow_id: createSlideshow.slideshow_id,
                    user_id: user_id
                })
    
                let content = getDefaultSlideContent().replace("$slide_id$", CreateSlide.slide_id.toString());
    
                await dbWriter.slides.update({
                    content: content
                }, {
                    where: {
                        slide_id: CreateSlide.slide_id
                    }
                })
    
                await dbWriter.slideshowSetting.create({
                    slideshow_id: createSlideshow.slideshow_id,
                    show_slide_no: 0,
                    presentation_size: '1280*720',
                    background_color: '',
                    background_image: '',
                    slideshow_gridlines: 0,
                    slideshow_repeat: 0,
                    background_repeat: '',
                    background_all: '',
                    background_position: '',
                    user_id: user_id
                })
    
                new SuccessResponse(EC.errorMessage(EC.saveDataSuccess, ["Comment"]), { // @ts-ignore
                    token: req.token,
                    slideshow_id: createSlideshow.slideshow_id
                }).send(res);
            } else {
                ApiError.handle(new AuthFailureError(EC.unauthorizedError), res);
            }

        } catch (error: any) {
            ApiError.handle(new BadRequestError(error.message), res);
        }
    }

    /**
     * create slideshow for game
     */
     public async createSlideshowByGame(req: Request, res: Response) {
        try {
            //@ts-ignore
            let { user_id } = req
            let userData = await dbReader.users.findOne({
                where: { user_id: user_id},
                attributes: ["user_role"]
            })
            userData = JSON.parse(JSON.stringify(userData));
            if(userData.user_role === 1 || 2 ) { 

                let { game_id, title } = req.body
                let slideshowData = await dbReader.slideShows.findOne({
                    where: { game_id: game_id, is_deleted: 0},
                    attributes: ["slideshow_id"]
                })

                if(!_.isEmpty(slideshowData)) {
                    throw new Error(EC.slideshowByGameExists);
                } else {
                    let createSlideshow = await dbWriter.slideShows.create(
                        {
                            category_id: 0,
                            is_system: 1,
                            user_id: user_id,
                            game_id: game_id,
                            title: title
                        }
                    );
        
                    const CreateSlide = await dbWriter.slides.create({
                        content: '',
                        slideshow_id: createSlideshow.slideshow_id,
                        user_id: user_id
                    })
        
                    let content = getDefaultSlideContent().replace("$slide_id$", CreateSlide.slide_id.toString());
        
                    await dbWriter.slides.update({
                        content: content
                    }, {
                        where: {
                            slide_id: CreateSlide.slide_id
                        }
                    })
        
                    await dbWriter.slideshowSetting.create({
                        slideshow_id: createSlideshow.slideshow_id,
                        show_slide_no: 0,
                        presentation_size: '1280*720',
                        background_color: '',
                        background_image: '',
                        slideshow_gridlines: 0,
                        slideshow_repeat: 0,
                        background_repeat: '',
                        background_all: '',
                        background_position: '',
                        user_id: user_id
                    })
        
                    new SuccessResponse(EC.errorMessage(EC.saveDataSuccess, ["Comment"]), { // @ts-ignore
                        token: req.token,
                        slideshow_id: createSlideshow.slideshow_id
                    }).send(res);
                }   
            } else {
                ApiError.handle(new AuthFailureError(EC.unauthorizedError), res);
            }

        } catch (error: any) {
            ApiError.handle(new BadRequestError(error.message), res);
        }
    }

    /**
     * getSlideshowsByGame
     */
     public async getSlideshowsByGame(req: Request, res: Response) {
        try {
             //@ts-ignore
             let { user_id } = req
             let userData = await dbReader.users.findOne({
                where: { user_id: user_id},
                attributes: ["user_role"]
            })
            userData = JSON.parse(JSON.stringify(userData));
            if(userData.user_role === 1 || 2 ) { 
                let { page_record, page_no } = req.body;
                var row_offset = 0, row_limit = 10;
    
                //Pagination 
                if (page_record) {
                    row_limit = parseInt(page_record);
                }
    
                if (page_no) {
                    row_offset = (page_no * page_record) - page_record;
                }

                // Searching
                var searchCondition = dbReader.Sequelize.Op.ne, searchData = null;
                if (req.body.search) {
                    searchCondition = dbReader.Sequelize.Op.like;
                    searchData = "%" + req.body.search + "%";
                }
    
                let findSlideshow = await dbReader.slideShows.findAndCountAll({
                    where: dbReader.Sequelize.and({
                        game_id: { [dbReader.Sequelize.Op.ne]: 0 },
                        is_deleted: 0,
                    }, dbReader.Sequelize.or({ title: { [searchCondition]: searchData }})),
                    include: [{
                        model: dbReader.slides,
                        where: { is_deleted: 0 },
                        required: false,
                        limit: 1,
                        attributes: ["content"]
                    }, {
                        model: dbReader.slideshowSetting,
                        where: { is_deleted: 0 },
                        required: false,
                    }],
                    limit: row_limit,
                    offset: row_offset,
                    order: [["title", "ASC"]]
                })
    
                new SuccessResponse(EC.listOfData, {
                    slideShows: findSlideshow
                }).send(res);
            } else {
                ApiError.handle(new AuthFailureError(EC.unauthorizedError), res);
            }

        } catch (error: any) {
            ApiError.handle(new BadRequestError(error.message), res);
        }
    }

    /**
     * importSlideshow
     */
    public async importSlideshow(req: Request, res: Response) {
        try {
             //@ts-ignore
             let { user_id } = req
             let userData = await dbReader.users.findOne({
                 where: { user_id: user_id},
                 attributes: ["user_role"]
             })
             userData = JSON.parse(JSON.stringify(userData));
             if(userData.user_role === 1 || 2 ) { 

                 let { series_id, ministry_type, ministry_sub_type, week_no, parent_slideshow_id } = req.body
                 // let { slideshow_id } = req.params
                 let slides: any = [];
                 let slide_ids: any = [];
     
                 let findSlideShow = await dbReader.slideShows.findOne({
                     where: { slideshow_id: parent_slideshow_id, is_deleted: 0 },
                     attributes: ['slideshow_id', 'feed_id', "title", "description", "category_id"]
                 })
     
                 let findSlides = await dbReader.slides.findAll({ where: { slideshow_id: parent_slideshow_id, is_deleted: 0 } })
     
                 let findSlideShowSetting = await dbReader.slideshowSetting.findOne({
                     where: { slideshow_id: parent_slideshow_id, is_deleted: 0 },
                     attributes: ['slideshow_setting_id', 'slideshow_id', 'show_slide_no', "presentation_size", "background_image", 'background_color', "background_repeat", 'background_all', 'background_position', 'slideshow_repeat', 'slideshow_gridlines']
                 })
     
                 if (findSlideShow) {
     
                     var createSlideShow = await dbWriter.slideShows.create({
                         sort_order: 0,
                         feed_id: 0,
                         title: findSlideShow.title,
                         description: findSlideShow.description,
                         category_id: series_id,
                         parent_slideshow_id: parent_slideshow_id,
                         ministry_type: ministry_type,
                         ministry_sub_type: ministry_sub_type,
                         week_number: week_no,
                         is_system: 1,
                         user_id:user_id
                     })
     
                     findSlides.forEach((element: any) => {
                         slides.push({
                             parent_slide_id: element.slide_id,
                             content: element.content,
                             slideshow_id: createSlideShow.slideshow_id,
                             slide_type: element.slide_type,
                             published_slide_image_url: element.published_slide_image_url,
                             video_url: element.video_url,
                             video_type: element.video_type,
                             sort_order: element.sort_order,
                             user_id: user_id
                         })
                     });
     
                     let Slides = await dbWriter.slides.bulkCreate(slides)
     
                     if (Slides.length) {
                         let content = "case slide_id";
     
                         Slides.forEach((element: any) => {
                             findSlides.forEach((element1: any) => {
                                 if (element.slide_id) {
     
                                     slide_ids.push(element.slide_id);
                                     content += " when " + element.slide_id + " then '" + element.content.replace(`${element1.slide_id}`, element.slide_id.toString()) + "'";
                                 }
                             });
                         });
     
                         if (slide_ids.length) {
     
                             content += " else content end";
     
                             await dbWriter.slides.update({
                                 updated_datetime: new Date(),
                                 content: dbWriter.Sequelize.literal(content),
                             }, {
                                 where: {
                                     slide_id: { [dbReader.Sequelize.Op.in]: slide_ids }
                                 }
                             })
                         }
                     }
     
                     await dbWriter.slideshowSetting.create({
                         slideshow_id: createSlideShow.slideshow_id,
                         show_slide_no: findSlideShowSetting.show_slide_no,
                         presentation_size: findSlideShowSetting.presentation_size,
                         background_color: findSlideShowSetting.background_color,
                         background_image: findSlideShowSetting.background_image,
                         background_repeat: findSlideShowSetting.background_repeat,
                         background_all: findSlideShowSetting.background_all,
                         background_position: findSlideShowSetting.background_position,
                         slideshow_repeat: findSlideShowSetting.slideshow_repeat,
                         slideshow_gridlines: findSlideShowSetting.slideshow_gridlines,
                         user_id:user_id
                     })
     
                     let findSlideshow = await dbReader.slideShows.findOne({
                         where: {
                             slideshow_id: createSlideShow.slideshow_id
                         },
                         include: [{
                             required: false,
                             model: dbReader.slides,
                             where: { is_deleted: 0 },
                             attributes: ["content"]
                         }, {
                             required: false,
                             model: dbReader.slideshowSetting,
                             where: { is_deleted: 0 },
                         }],
                         limit: 1
                     })
     
                     new SuccessResponse(EC.errorMessage(EC.importSlideshow, ["slideShows"]), {
                         //@ts-ignore
                         token: req.token,
                         slideshow_id: createSlideShow.slideshow_id,
                         slideShows: findSlideshow
                     }).send(res);
     
                 } else {
                     throw new Error(EC.errorMessage(EC.SlideShowDataNotFound));
                 }
             } else {
                ApiError.handle(new AuthFailureError(EC.unauthorizedError), res);
             }

        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async addOrEditRecommendedFonts(req:Request,res:Response){
        try {
            let {recommended_fonts,series_id} = req.body;
            let fonts = await dbWriter.categories.update({
                recommended_fonts: JSON.stringify(recommended_fonts)
            },
            {
                where:{
                    category_id:series_id
                }
            });

            new SuccessResponse(EC.success, {}).send(res);
        } catch (error:any) {
            ApiError.handle(new BadRequestError(error), res);
        }
    }

}
