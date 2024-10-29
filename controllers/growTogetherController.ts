import { Request, Response } from "express";
import { ErrorController } from "../core/ErrorController";
import { SuccessResponse, ForbiddenResponse } from "../core/ApiResponse";
import { BadRequestError, ApiError } from "../core/ApiError";
const { dbReader, dbWriter } = require("../models/dbConfig");
const EC = new ErrorController();

export class growTogetherController {

    public async getIntakeFormList(req: Request, res: Response) {
        try {
            let { user_id, user_role }: any = req;
            let { sort_order, sort_field, page_no, page_record, search, filterByMastermindGroup = "", filterByStatus = "", start_date = "", end_date = "" } = req.body;
            let row_offset = 0, row_limit = 10, whereClause; sort_order = sort_order || 'ASC'; sort_field = sort_field || 'created_datetime';
            let filter_mastermind_group = filterByMastermindGroup ? filterByMastermindGroup : [0, 1, 2, 3];
            let filter_status = filterByStatus ? filterByStatus : [0, 1, 2, 3];
            //Pagination 
            if (page_record) { row_limit = parseInt(page_record); }
            if (page_no) { row_offset = (page_no * page_record) - page_record; }
            // Searching data by recipe_name 
            let SearchCondition = dbReader.Sequelize.Op.ne, SearchData = null;
            if (search) { SearchCondition = dbReader.Sequelize.Op.like; SearchData = "%" + search + "%"; }
            if (!start_date && !end_date) {
                whereClause = dbReader.Sequelize.and(
                    { is_deleted: 0, status: filter_status, mastermind_group: filter_mastermind_group },
                    dbReader.Sequelize.or(
                        dbReader.Sequelize.where(
                            dbReader.Sequelize.col('`sycu_user`.`display_name`'), { [SearchCondition]: SearchData }
                        ),
                        dbReader.Sequelize.where(
                            dbReader.Sequelize.col('`sycu_user`.`email`'), { [SearchCondition]: SearchData }
                        ),
                        { mastermind_group: { [SearchCondition]: SearchData } },
                        { no_of_volunteers: { [SearchCondition]: SearchData } },
                        { no_of_kid_student: { [SearchCondition]: SearchData } },
                        { reference_mastermind_group: { [SearchCondition]: SearchData } },
                    ),
                )
            } else {
                whereClause = dbReader.Sequelize.and(
                    { is_deleted: 0, status: filter_status, mastermind_group: filter_mastermind_group },
                    dbReader.Sequelize.and(
                        dbReader.Sequelize.where(
                            dbReader.Sequelize.fn(
                                'DATE_FORMAT',
                                dbReader.sequelize.literal('`grow_together_intake_form`.`created_datetime`'),
                                '%Y-%m-%d'
                            ),
                            { [dbReader.Sequelize.Op.between]: [start_date, end_date] }
                        ),
                    ),
                    dbReader.Sequelize.or(
                        dbReader.Sequelize.where(
                            dbReader.Sequelize.col('`sycu_user`.`display_name`'), { [SearchCondition]: SearchData }
                        ),
                        dbReader.Sequelize.where(
                            dbReader.Sequelize.col('`sycu_user`.`email`'), { [SearchCondition]: SearchData }
                        ),
                        { mastermind_group: { [SearchCondition]: SearchData } },
                        { no_of_volunteers: { [SearchCondition]: SearchData } },
                        { no_of_kid_student: { [SearchCondition]: SearchData } },
                        { reference_mastermind_group: { [SearchCondition]: SearchData } },
                    ),
                )
            }
            let sortJoin = [[sort_field, sort_order]];
            if (sort_field == "username") {
                sortJoin = [dbReader.sequelize.literal('`username`'), sort_order];
            } else if (sort_field == "email") {
                sortJoin = [dbReader.sequelize.literal('`email`'), sort_order];
            }
            let intakeList = await dbReader.growTogetherIntakeForms.findAndCountAll({
                attributes: ['grow_together_intake_form_id', 'user_id', 'status', 'mastermind_group', 'no_of_volunteers', 'no_of_kid_student', 'reference_mastermind_group', 'call_schedule', 'created_datetime', 'is_leader', [dbReader.Sequelize.literal('`sycu_user`.`display_name`'), 'username'], [dbReader.Sequelize.literal('`sycu_user`.`email`'), 'email'], [dbReader.Sequelize.literal('`sycu_user`.`user_role`'), 'user_role']],
                include: [{
                    model: dbReader.users,
                    attributes: [],
                }],
                where: whereClause,
                order: [sortJoin],
                limit: row_limit,
                offset: row_offset
            });
            intakeList = JSON.parse(JSON.stringify(intakeList));

            var checkUserTogatherSubscription;
            intakeList.rows.forEach((element: any) => {
                element.call_schedule = JSON.parse(element.call_schedule);
            });

            var i = 0, gtc = new growTogetherController();
            while (i < intakeList.rows.length) {
                checkUserTogatherSubscription = await gtc.checkUserTogatherSubscription(intakeList.rows[i].user_id);
                intakeList.rows[i].is_circle_access = (intakeList.rows[i].user_role != 3) ? true : checkUserTogatherSubscription
                i = i + 1;
            }

            new SuccessResponse(EC.success, {
                //@ts-ignore 
                token: req.token,
                count: intakeList.count,
                data: intakeList.rows
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async saveIntakeFormStatus(req: Request, res: Response) {
        try {
            let { user_id }: any = req;
            let { grow_together_intake_form_id, status } = req.body;
            await dbWriter.growTogetherIntakeForms.update({
                status: status,
                updated_by: user_id
            }, {
                where: {
                    grow_together_intake_form_id: grow_together_intake_form_id,
                    is_deleted: 0
                }
            });
            new SuccessResponse(EC.errorMessage(EC.success), {
                //@ts-ignore 
                token: req.token
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async saveIntakeApplication(req: Request, res: Response) {
        try {
            let { user_id, user_role }: any = req;
            let { grow_together_intake_form_id, mastermind_group, no_of_volunteers, no_of_kid_student, call_schedule, reference_mastermind_group, is_leader } = req.body;

            if (user_role != 3) {
                await dbWriter.growTogetherIntakeForms.update({
                    mastermind_group: mastermind_group,
                    no_of_volunteers: no_of_volunteers,
                    no_of_kid_student: no_of_kid_student,
                    call_schedule: JSON.stringify(call_schedule),
                    reference_mastermind_group: reference_mastermind_group,
                    updated_by: user_id,
                    is_leader: is_leader
                }, {
                    where: { grow_together_intake_form_id: grow_together_intake_form_id, is_deleted: 0 }
                });

                new SuccessResponse(EC.errorMessage(EC.success), {
                    //@ts-ignore
                    token: req.token
                }).send(res);
            } else {
                new ForbiddenResponse("Unauthorized.").send(res);
            }

        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async checkUserTogatherSubscription(user_id: any) {
        return await new Promise(async function (resolve) {
            let subscriptions = await dbReader.userSubscription.findAll({
                attributes: ["user_subscription_id"],
                where: { site_id: 12, user_id: user_id, subscription_status: [2, 4, 10], is_circle_access: 1 },
            });
            if (subscriptions.length) {
                return resolve(true);
            } else {
                return resolve(false);
            }
        })
    }
}
