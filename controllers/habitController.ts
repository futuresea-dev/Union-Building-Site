import { Request, Response } from "express";
import { ErrorController, SuccessResponse, BadRequestError, ApiError } from ".././core/index";
const { dbReader, dbWriter } = require("../models/dbConfig");
const EC = new ErrorController();
const { Op } = dbReader.Sequelize;

export class HabitController {
    public async createHabit(req: Request, res: Response) {
        try {
            //getting userId from token
            //@ts-ignore
            let user_id = req.user_id;
            let { category_index, title, description, is_from = 1, is_admin = 1, image_index } = req.body;
            title = title.toUpperCase();

            let habitInsertData = await dbWriter.habit.create({
                category_index,
                title,
                description,
                user_id,
                is_from,
                is_admin,
                image_index
            })
            habitInsertData = JSON.parse(JSON.stringify(habitInsertData))
            let habitData = await dbReader.habit.findOne({
                where: {
                    habit_id: habitInsertData.habit_id
                }
            })
            habitData = JSON.parse(JSON.stringify(habitData))
            new SuccessResponse("Habit Created successfully!", {
                //@ts-ignore
                token: req.token,
                ...habitData
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async listHabit(req: Request, res: Response) {
        try {
            let { is_from, is_admin, sort_field, sort_order, category_index } = req.body
            let whereCondition: any = {}
            if (is_admin == 1) {
                whereCondition.is_from = is_from
                whereCondition.is_deleted = 0
                whereCondition.is_admin = 1
            }
            else {
                whereCondition.is_from = is_from
                whereCondition.is_admin = 0
            }
            if (category_index) {
                whereCondition.category_index = category_index
            }
            //Pagination
            var limit = req.body.page_record == undefined ? 10 : parseInt(req.body.page_record);
            var offset = req.body.page_no == undefined ? 1 : parseInt(req.body.page_no);
            // Automatic Offset and limit will set on the base of page number
            var row_limit = limit;
            var row_offset = (offset * limit) - limit;
            //Sorting
            if (sort_field == 'category_name') {
                sort_field = dbReader.Sequelize.literal('`category`.`title`')
            } else if (sort_field == 'count') {
                sort_field = dbReader.Sequelize.literal(`(select count(1) from ghb_habit where habit.habit_id = ghb_habit.parent_habit_id  AND ghb_habit.is_admin = 0 AND ghb_habit.is_deleted = 0)`)
            } else if (sort_field == 'user_count') {
                sort_field = dbReader.Sequelize.literal(`(select count(DISTINCT(ghb_habit.user_id)) from ghb_habit where habit.habit_id = ghb_habit.parent_habit_id  AND ghb_habit.is_admin = 0 AND ghb_habit.is_deleted = 0)`)
            } else sort_field = sort_field;
            sort_field = sort_field ? sort_field : 'habit_id'
            sort_order = sort_order ? sort_order : 'ASC'
            //Searching
            var searchCondition = dbReader.Sequelize.Op.ne, searchData = null;
            if (req.body.search) {
                searchCondition = Op.like;
                searchData = '%' + req.body.search + '%';
            }
            let whereStatement = dbReader.sequelize.and(
                whereCondition,
                dbReader.sequelize.or(
                    { habit_id: { [searchCondition]: searchData } },
                    { title: { [searchCondition]: searchData } },
                    { description: { [searchCondition]: searchData } }
                )
            )
            let habitData = await dbReader.habit.findAndCountAll({
                attributes: ['habit_id', 'title', 'description', 'task_1', 'category_index', 'parent_habit_id', 'user_id', 'is_deleted', 'image_index',
                    [dbReader.Sequelize.literal('`category`.`title`'), 'category_name'],
                    [dbReader.Sequelize.literal(`(select count(1) from ghb_habit where habit.habit_id = ghb_habit.parent_habit_id  AND ghb_habit.is_admin = 0 AND ghb_habit.is_deleted = 0)`), 'count'],
                    [dbReader.Sequelize.literal(`(select count(DISTINCT(ghb_habit.user_id)) from ghb_habit where habit.habit_id = ghb_habit.parent_habit_id  AND ghb_habit.is_admin = 0 AND ghb_habit.is_deleted = 0)`), 'user_count'],
                ],
                where: whereStatement,
                include: [{
                    model: dbReader.category,
                    attributes: [],
                }],
                limit: row_limit,
                offset: row_offset,
                order: [[sort_field, sort_order]]
            })
            habitData = JSON.parse(JSON.stringify(habitData))
            if (habitData.count > 0) {
                new SuccessResponse("List fetched successfully!", {
                    //@ts-ignore
                    token: req.token,
                    count: habitData.count,
                    rows: habitData.rows
                }).send(res);
            }
            else {
                new SuccessResponse("No Data Found!", {
                    //@ts-ignore
                    token: req.token,
                    count: 0,
                    rows: []
                }).send(res);
            }
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async editHabbit(req: Request, res: Response) {
        try {
            //getting userId from token
            //@ts-ignore
            let user_role = req.user_role;
            let { habit_id, title, description, image_index, category_index } = req.body;
            title = title.toUpperCase();

            if (user_role == 1 || user_role == 2) {
                await dbWriter.habit.update({
                    title, image_index, description, category_index,
                    updated_datetime: new Date()
                },
                    { where: { habit_id } })
                new SuccessResponse("Habbit has been updated successfully!", {
                    //@ts-ignore
                    token: req.token
                }).send(res);
            }
            else
                throw new Error("Only admin can edit this habit!")
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async deleteHabbit(req: Request, res: Response) {
        try {
            //@ts-ignore
            let user_role = req.user_role;
            let { habit_id } = req.body;

            if (user_role == 1 || user_role == 2) {
                await dbWriter.habit.update({
                    is_deleted: 1,
                    updated_datetime: new Date()
                },
                    {
                        where: { habit_id: habit_id }
                    })
                new SuccessResponse("Deleted successfully!", {
                    //@ts-ignore
                    token: req.token
                }).send(res);
            }
            else
                throw new Error("Only admin can delete this habit!")

        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async getHabitDetails(req: Request, res: Response) {
        try {
            let { habit_id } = req.params;
            let habitData = await dbReader.habit.findOne({
                where: { habit_id }
            })
            habitData = JSON.parse(JSON.stringify(habitData))
            new SuccessResponse("Habit fetch successfully!", { ...habitData }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async switchIndex(req: Request, res: Response) {
        try {
            let { user_id, new_index, old_index } = req.body;
            let newRecord = await dbReader.habit.findAll({
                where: {
                    user_id: user_id,
                    is_deleted: 0,
                    user_index: old_index
                }
            })
            newRecord = JSON.parse(JSON.stringify(newRecord))
            if (newRecord.length) {
                await dbWriter.habit.update({
                    user_index: new_index
                }, { where: { habit_id: newRecord[0].habit_id } })

                let nextRecordList = await dbReader.habit.findAll({
                    where: {
                        user_index: { [Op.gte]: new_index },
                        is_deleted: 0
                    }
                })
                nextRecordList = JSON.parse(JSON.stringify(nextRecordList))
                let _habit_id: any = [], _user_index = 'case habit_id '
                nextRecordList.forEach((e: any) => {
                    if (newRecord[0].habit_id != e.habit_id) {
                        _habit_id.push(e.habit_id)
                        _user_index += ' when ' + e.habit_id + ' then ' + (e.user_index + 1)
                    }
                })
                if (_habit_id.length) {
                    _user_index += ' else user_index end'
                    await dbWriter.habit.update({
                        user_index: dbWriter.sequelize.literal(_user_index),
                        updated_datetime: new Date()
                    },
                        { where: { habit_id: _habit_id } })
                }
                new SuccessResponse("List Update successfully!", {
                    //@ts-ignore
                    token: req.token
                }).send(res);
            } else
                throw new Error("Habit data not found.")
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    // public async uploadImageToS3(req: Request, res: Response) {
    //     try {
    //         // let { url } = req.body
    //         // var b64string = url
    //         let file_data: any = req.file;
    //         // var fileAndLocationName = '_' + new Date().getTime()
    //         // var buf = Buffer.from(b64string, 'base64');

    //         let imageUrl = await new Promise(async (resolve, rejects) => {
    //             const params = {
    //                 Bucket: 'sycu-accounts/user-profile-image',
    //                 region: 'us-east-2',
    //                 Key: file_data.filename,
    //                 Body: fs.readFileSync(file_data.path),
    //                 ContentType: file_data.mimetype,
    //                 ACL: 'public-read'
    //             };
    //             await s3.upload(params, function (err: any, data: any) {
    //                 if (err)
    //                     console.log('error ' + err);
    //                 console.log(`File uploaded successfully at ${data.Location}`);
    //                 // Unlink Local Directory File
    //                 fs.unlinkSync(file_data.path)
    //                 // console.log(data.Location);
    //                 resolve(data.Location); // return ;
    //             });
    //         });

    //         new SuccessResponse("Image uploaded successfully!", {
    //             //@ts-ignore
    //             token: req.token,
    //             imageUrl
    //         }).send(res);
    //     }
    //     catch (e: any) {
    //         ApiError.handle(new BadRequestError(e.message), res);
    //     }
    // }


    public async listAllIcons(req: Request, res: Response) {
        try {
            let listArray: any = [
                'https://sycu-accounts.s3.us-east-2.amazonaws.com/habits/icon-pack-1.png',
                'https://sycu-accounts.s3.us-east-2.amazonaws.com/habits/icon-pack-2.png',
                'https://sycu-accounts.s3.us-east-2.amazonaws.com/habits/icon-pack-3.png',
                'https://sycu-accounts.s3.us-east-2.amazonaws.com/habits/icon-pack-4.png',
                'https://sycu-accounts.s3.us-east-2.amazonaws.com/habits/icon-pack-5.png',
                'https://sycu-accounts.s3.us-east-2.amazonaws.com/habits/icon-pack-6.png',
                'https://sycu-accounts.s3.us-east-2.amazonaws.com/habits/icon-pack-10.png',
                'https://sycu-accounts.s3.us-east-2.amazonaws.com/habits/icon-pack-31.png',
                'https://sycu-accounts.s3.us-east-2.amazonaws.com/habits/icon-pack-31.png',
                'https://sycu-accounts.s3.us-east-2.amazonaws.com/habits/icon-pack-51.png',
                'https://sycu-accounts.s3.us-east-2.amazonaws.com/habits/icon-pack-52.png',
                'https://sycu-accounts.s3.us-east-2.amazonaws.com/habits/icon-pack-53.png',
                'https://sycu-accounts.s3.us-east-2.amazonaws.com/habits/icon-pack-54.png',
                'https://sycu-accounts.s3.us-east-2.amazonaws.com/habits/icon-pack-55.png',
            ]
            new SuccessResponse("Links fetched successfully!", {
                listArray
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async fetchHabitById(req: Request, res: Response) {
        try {
            let { habit_id } = req.params
            let habitData = await dbReader.habit.findOne({
                where: {
                    habit_id: habit_id,
                    is_deleted: 0
                }
            })
            habitData = JSON.parse(JSON.stringify(habitData))
            new SuccessResponse("Habit fetched successfully!", {
                //@ts-ignore
                token: req.token,
                ...habitData
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
}
