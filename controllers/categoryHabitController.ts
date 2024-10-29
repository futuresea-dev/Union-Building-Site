import { Request, Response } from "express";
const app = require('express');
import { ErrorController, SuccessResponse, BadRequestError, ApiError } from "../core/index";
const { dbReader, dbWriter } = require("../models/dbConfig");

export class CategotyController {
    public async createCategory(req: Request, res: Response) {
        try {
            let { title, icon, color, status = 1, is_present_habit_available = 1, description, is_from } = req.body
            let categoryData = await dbWriter.category.create({
                title, icon, color, status, is_present_habit_available, description, is_from
            })
            categoryData = JSON.parse(JSON.stringify(categoryData))
            new SuccessResponse("Category Created successfully!", {
                //@ts-ignore
                token: req.token,
                ...categoryData
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async listHabitCategory(req: Request, res: Response) {
        try {
            let { is_from } = req.body;
            let categoryData = await dbReader.category.findAll({
                where: { is_Deleted: 0, is_from: is_from }
            })
            categoryData = JSON.parse(JSON.stringify(categoryData))
            new SuccessResponse("Category fetched successfully!", {
                //@ts-ignore
                token: req.token,
                rows: categoryData
            }).send(res);
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async deleteHabitCategory(req: Request, res: Response) {
        try {
            //@ts-ignore
            let user_role = req.user_role
            let { category_id } = req.body
            if (user_role == 1 || user_role == 2) {
                await dbWriter.category.update({
                    is_deleted: 1
                }, { where: { category_id: category_id } })
                new SuccessResponse("Category deleted successfully!", {}).send(res);
            } else
                throw new Error("Only admin can delete this category.")
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    public async editHabitCategory(req: Request, res: Response) {
        try {
            //@ts-ignore
            let user_role = req.user_role
            let { category_id, title, icon, color, is_present_habit_available, status, description, is_from } = req.body
            if (user_role == 1 || user_role == 2) {
                await dbWriter.category.update({
                    title, icon, color, is_present_habit_available, status, description, is_from
                }, { where: { category_id: category_id } })
                new SuccessResponse("Category updated successfully!", {}).send(res);
            } else
                throw new Error("Only admin can edit this category.")
        } catch (e: any) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }
}